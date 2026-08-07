interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  ASSETS: Fetcher;
  SHOPIFY_STORE_DOMAIN: string;
  SHOPIFY_API_VERSION: string;
  SHOPIFY_PRIVATE_STOREFRONT_TOKEN?: string;
  SHOPIFY_ESSENTIAL_VARIANT_ID?: string;
  SHOPIFY_PREMIUM_VARIANT_ID?: string;
  SHOPIFY_EXPRESS_VARIANT_ID?: string;
  ADMIN_TOKEN?: string;
}

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

async function ensureSchema(env: Env) {
  await env.DB.batch([
    env.DB.prepare("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, email TEXT, answers TEXT NOT NULL, selected_offer TEXT, express INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'started', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)")
  ]);
}
function isAdmin(request: Request, env: Env) { return Boolean(env.ADMIN_TOKEN && request.headers.get("X-Admin-Token") === env.ADMIN_TOKEN); }
function safeKey(name: string) { const ext = name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin"; return `uploads/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`; }

async function handleApi(request: Request, env: Env, url: URL) {
  await ensureSchema(env);
  if (url.pathname === "/api/content" && request.method === "GET") {
    const row = await env.DB.prepare("SELECT value FROM settings WHERE key = ?").bind("site_content").first<{ value: string }>();
    return json({ content: row ? JSON.parse(row.value) : null });
  }
  if (url.pathname === "/api/content" && request.method === "PUT") {
    if (!isAdmin(request, env)) return json({ error: "Accès refusé" }, 401);
    const body = await request.json() as { content?: unknown };
    if (!body.content) return json({ error: "Contenu manquant" }, 400);
    await env.DB.prepare("INSERT INTO settings(key, value, updated_at) VALUES(?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP").bind("site_content", JSON.stringify(body.content)).run();
    return json({ ok: true });
  }
  if (url.pathname === "/api/media" && request.method === "POST") {
    if (!isAdmin(request, env)) return json({ error: "Accès refusé" }, 401);
    const form = await request.formData(); const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "Fichier manquant" }, 400);
    if (file.size > 60 * 1024 * 1024) return json({ error: "Fichier trop volumineux (60 Mo max)" }, 413);
    const key = safeKey(file.name); await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type || "application/octet-stream" } });
    return json({ url: `/media/${key}` });
  }
  if (url.pathname === "/api/submissions" && request.method === "POST") {
    const body = await request.json() as { id?: string; answers?: Record<string, unknown> };
    if (!body.id || !body.answers) return json({ error: "Données manquantes" }, 400);
    const email = typeof body.answers.email === "string" ? body.answers.email : null;
    const offer = typeof body.answers.offer === "string" ? body.answers.offer : null;
    const express = body.answers.express ? 1 : 0;
    await env.DB.prepare("INSERT INTO submissions(id, email, answers, selected_offer, express, updated_at) VALUES(?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET email=excluded.email, answers=excluded.answers, selected_offer=excluded.selected_offer, express=excluded.express, updated_at=CURRENT_TIMESTAMP").bind(body.id, email, JSON.stringify(body.answers), offer, express).run();
    return json({ ok: true, id: body.id });
  }
  if (url.pathname === "/api/checkout" && request.method === "POST") {
    const body = await request.json() as { submissionId?: string; offer?: "essential" | "premium"; express?: boolean; email?: string };
    const token = env.SHOPIFY_PRIVATE_STOREFRONT_TOKEN;
    const mainVariant = body.offer === "premium" ? env.SHOPIFY_PREMIUM_VARIANT_ID : env.SHOPIFY_ESSENTIAL_VARIANT_ID;
    if (!body.submissionId || !body.offer) return json({ error: "Commande incomplète" }, 400);
    if (!token || !mainVariant) return json({ error: "Le checkout Shopify doit encore être connecté dans Cloudflare." }, 503);
    const lines: Array<Record<string, unknown>> = [{ merchandiseId: mainVariant, quantity: 1, attributes: [{ key: "submission_id", value: body.submissionId }, { key: "formule", value: body.offer }] }];
    if (body.express) {
      if (!env.SHOPIFY_EXPRESS_VARIANT_ID) return json({ error: "La variante Express n’est pas configurée." }, 503);
      lines.push({ merchandiseId: env.SHOPIFY_EXPRESS_VARIANT_ID, quantity: 1, attributes: [{ key: "submission_id", value: body.submissionId }] });
    }
    const query = `mutation CartCreate($input: CartInput!) { cartCreate(input: $input) { cart { checkoutUrl } userErrors { field message } } }`;
    const endpoint = `https://${env.SHOPIFY_STORE_DOMAIN}/api/${env.SHOPIFY_API_VERSION || "2026-04"}/graphql.json`;
    const shopify = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "Shopify-Storefront-Private-Token": token, "Shopify-Storefront-Buyer-IP": request.headers.get("CF-Connecting-IP") || "127.0.0.1" }, body: JSON.stringify({ query, variables: { input: { lines, attributes: [{ key: "submission_id", value: body.submissionId }] } } }) });
    const result = await shopify.json() as { data?: { cartCreate?: { cart?: { checkoutUrl?: string }; userErrors?: Array<{ message: string }> } }; errors?: Array<{ message: string }> };
    const checkoutUrl = result.data?.cartCreate?.cart?.checkoutUrl;
    if (!checkoutUrl) return json({ error: result.data?.cartCreate?.userErrors?.[0]?.message || result.errors?.[0]?.message || "Shopify n’a pas créé le checkout." }, 502);
    await env.DB.prepare("UPDATE submissions SET status='checkout_started', updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(body.submissionId).run();
    return json({ checkoutUrl });
  }
  return json({ error: "Route inconnue" }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env, url);
    if (url.pathname.startsWith("/media/")) {
      const key = decodeURIComponent(url.pathname.slice(7)); const object = await env.MEDIA.get(key);
      if (!object) return new Response("Fichier introuvable", { status: 404 });
      const headers = new Headers(); object.writeHttpMetadata(headers); headers.set("etag", object.httpEtag); headers.set("Cache-Control", "public, max-age=31536000, immutable");
      return new Response(object.body, { headers });
    }
    return env.ASSETS.fetch(request);
  }
} satisfies ExportedHandler<Env>;
