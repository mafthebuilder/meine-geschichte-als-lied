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
  SHOPIFY_ADMIN_ACCESS_TOKEN?: string;
  SHOPIFY_CLIENT_ID?: string;
  SHOPIFY_CLIENT_SECRET?: string;
  ADMIN_TOKEN?: string;
  KLAVIYO_PRIVATE_API_KEY?: string;
  KLAVIYO_LIST_ID?: string;
  KLAVIYO_API_REVISION?: string;
  META_PIXEL_ID?: string;
  META_CAPI_ACCESS_TOKEN?: string;
  META_SEND_SHOPIFY_PURCHASES?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  MHC_PROMO_CODE?: string;
  MHC_PROMO_PERCENT?: string;
  EMAIL: {
    send(message: {
      to: string | { email: string; name?: string } | Array<string | { email: string; name?: string }>;
      from: string | { email: string; name?: string };
      subject: string;
      html?: string;
      text?: string;
      replyTo?: string | { email: string; name?: string };
      headers?: Record<string, string>;
    }): Promise<{ messageId: string }>;
  };
}

type Answers = Record<string, unknown>;
type SubmissionStage = "progress" | "form_completed";

type OfferId = "discovery" | "essential" | "premium";

type OfferConfigRecord = {
  id: OfferId;
  active: boolean;
  name: string;
  priceCents: number;
  compareAtCents: number | null;
  benefits: string[];
  revisionLimit: number | null;
  deliveryHours: number;
  recommended: boolean;
  expressEligible: boolean;
};

type OffersConfigRecord = {
  version: number;
  expressPriceCents: number;
  offers: OfferConfigRecord[];
  updatedAt?: string;
};

const DEFAULT_OFFERS_CONFIG: OffersConfigRecord = {
  version: 1,
  expressPriceCents: 490,
  offers: [
    {
      id: "discovery",
      active: true,
      name: "Découverte",
      priceCents: 990,
      compareAtCents: null,
      benefits: ["Chanson personnalisée", "Livraison sous 4 jours", "Aucune révision incluse"],
      revisionLimit: 0,
      deliveryHours: 96,
      recommended: false,
      expressEligible: true
    },
    {
      id: "essential",
      active: true,
      name: "Essentiel",
      priceCents: 1490,
      compareAtCents: 5090,
      benefits: ["Chanson personnalisée", "Livraison sous 4 jours", "1 révision offerte"],
      revisionLimit: 1,
      deliveryHours: 96,
      recommended: false,
      expressEligible: true
    },
    {
      id: "premium",
      active: true,
      name: "Premium",
      priceCents: 2490,
      compareAtCents: 8390,
      benefits: ["Chanson personnalisée", "Livraison prioritaire sous 24 h", "Révisions illimitées"],
      revisionLimit: null,
      deliveryHours: 24,
      recommended: true,
      expressEligible: false
    }
  ]
};

const LEGACY_PRICE_CENTS = {
  discovery: 990,
  essential: 1490,
  premium: 2490,
  express: 490
} as const;

function baseOfferAmountCents(offer: string) {
  if (offer === "premium") return LEGACY_PRICE_CENTS.premium;
  if (offer === "discovery") return LEGACY_PRICE_CENTS.discovery;
  return LEGACY_PRICE_CENTS.essential;
}

function baseOfferAmountEuros(offer: string) {
  return baseOfferAmountCents(offer) / 100;
}
type AnalyticsEventName = "LandingPageView" | "MHCFormStarted" | "Lead" | "AddToCart" | "InitiateCheckout" | "Purchase";

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
});

let schemaReady: Promise<void> | null = null;

async function ensureSchema(env: Env) {
  if (!schemaReady) schemaReady = (async () => {
    await env.DB.batch([
      env.DB.prepare("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, email TEXT, answers TEXT NOT NULL, selected_offer TEXT, express INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'started', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS integration_events (event_key TEXT PRIMARY KEY, submission_id TEXT NOT NULL, provider TEXT NOT NULL, event_name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', last_error TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS mhc_orders (id TEXT PRIMARY KEY, submission_id TEXT, payment_provider TEXT NOT NULL, provider_order_id TEXT NOT NULL, provider_payment_id TEXT, order_name TEXT NOT NULL, email TEXT, customer_name TEXT, payment_status TEXT NOT NULL DEFAULT 'pending', fulfillment_status TEXT, amount_cents INTEGER NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'EUR', selected_offer TEXT, express INTEGER NOT NULL DEFAULT 0, production_status TEXT NOT NULL DEFAULT 'to_create', delivery_file_key TEXT, delivery_file_name TEXT, delivery_token TEXT UNIQUE, provider_created_at TEXT NOT NULL, synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, delivered_at TEXT, delivery_email_sent_at TEXT, delivery_email_message_id TEXT, delivery_email_count INTEGER NOT NULL DEFAULT 0, delivery_viewed_at TEXT, delivery_downloaded_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(payment_provider, provider_order_id))"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS mhc_revisions (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, revision_type TEXT NOT NULL, message TEXT NOT NULL, song_moment TEXT, status TEXT NOT NULL DEFAULT 'new', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(order_id) REFERENCES mhc_orders(id))"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS prospect_previews (submission_id TEXT PRIMARY KEY, status TEXT NOT NULL DEFAULT 'to_create', excerpt_file_key TEXT, excerpt_file_name TEXT, preview_token TEXT UNIQUE, preview_email_sent_at TEXT, preview_email_count INTEGER NOT NULL DEFAULT 0, preview_viewed_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(submission_id) REFERENCES submissions(id))"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS analytics_events (id TEXT PRIMARY KEY, event_id TEXT NOT NULL UNIQUE, event_name TEXT NOT NULL, session_id TEXT, submission_id TEXT, event_source TEXT NOT NULL DEFAULT 'browser', path TEXT, referrer TEXT, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_content TEXT, utm_term TEXT, campaign_id TEXT, adset_id TEXT, ad_id TEXT, value_cents INTEGER, currency TEXT, payment_provider TEXT, provider_id TEXT, metadata TEXT, occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS stripe_payment_sessions (payment_intent_id TEXT PRIMARY KEY, submission_id TEXT NOT NULL, client_secret TEXT NOT NULL, amount_cents INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'EUR', selected_offer TEXT NOT NULL, express INTEGER NOT NULL DEFAULT 0, email TEXT, status TEXT NOT NULL, fbp TEXT, fbc TEXT, client_ip TEXT, client_user_agent TEXT, event_source_url TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(submission_id) REFERENCES submissions(id))"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS stripe_webhook_events (event_id TEXT PRIMARY KEY, status TEXT NOT NULL DEFAULT 'processing', error TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS mhc_orders_submission_idx ON mhc_orders(submission_id)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS mhc_orders_status_idx ON mhc_orders(production_status)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS mhc_orders_created_idx ON mhc_orders(provider_created_at)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS mhc_revisions_order_idx ON mhc_revisions(order_id)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS prospect_previews_status_idx ON prospect_previews(status)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS analytics_events_name_idx ON analytics_events(event_name)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS analytics_events_submission_idx ON analytics_events(submission_id)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS analytics_events_occurred_idx ON analytics_events(occurred_at)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS analytics_events_campaign_idx ON analytics_events(utm_campaign)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS stripe_payment_sessions_submission_idx ON stripe_payment_sessions(submission_id)")
    ]);
    await ensureColumn(env, "submissions", "offer_config_version", "INTEGER");
    await ensureColumn(env, "stripe_payment_sessions", "offer_name", "TEXT");
    await ensureColumn(env, "stripe_payment_sessions", "offer_config_version", "INTEGER");
    await ensureColumn(env, "stripe_payment_sessions", "revision_limit", "INTEGER");
    await ensureColumn(env, "stripe_payment_sessions", "delivery_hours", "INTEGER");
    await ensureColumn(env, "stripe_payment_sessions", "offer_snapshot", "TEXT");
    await ensureColumn(env, "mhc_orders", "offer_name", "TEXT");
    await ensureColumn(env, "mhc_orders", "offer_config_version", "INTEGER");
    await ensureColumn(env, "mhc_orders", "revision_limit", "INTEGER");
    await ensureColumn(env, "mhc_orders", "delivery_hours", "INTEGER");
    await ensureColumn(env, "mhc_orders", "offer_snapshot", "TEXT");
    await migrateLegacyTables(env);
  })().catch(error => {
    schemaReady = null;
    throw error;
  });
  await schemaReady;
}

async function tableExists(env: Env, name: string) {
  const row = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").bind(name).first<{ name: string }>();
  return Boolean(row?.name);
}

async function ensureColumn(env: Env, table: "submissions" | "stripe_payment_sessions" | "mhc_orders", column: string, definition: string) {
  const rows = await env.DB.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
  if ((rows.results || []).some(row => row.name === column)) return;
  try {
    await env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (!message.includes("duplicate column")) throw error;
  }
}

async function migrateLegacyTables(env: Env) {
  if (await tableExists(env, "orders")) {
    const legacy = await env.DB.prepare("SELECT * FROM orders").all<Record<string, unknown>>();
    for (const row of legacy.results || []) {
      const providerOrderId = asString(row.shopify_order_id);
      if (!providerOrderId) continue;
      await env.DB.prepare(`INSERT OR IGNORE INTO mhc_orders(
        id, submission_id, payment_provider, provider_order_id, order_name, email, customer_name, payment_status,
        fulfillment_status, amount_cents, currency, selected_offer, express, production_status, delivery_file_key,
        delivery_file_name, delivery_token, provider_created_at, synced_at, delivered_at, delivery_email_sent_at,
        delivery_email_message_id, delivery_email_count, delivery_viewed_at, delivery_downloaded_at, updated_at
      ) VALUES(?, ?, 'shopify', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`)
        .bind(
          `shopify:${providerOrderId}`, asString(row.submission_id) || null, providerOrderId,
          asString(row.order_name) || providerOrderId, asString(row.email) || null, asString(row.customer_name) || null,
          asString(row.financial_status).toLowerCase() || "paid", asString(row.fulfillment_status) || null,
          Math.round(Number(asString(row.total_amount) || 0) * 100), asString(row.currency) || "EUR",
          asString(row.selected_offer) || null, Number(row.express) ? 1 : 0, asString(row.production_status) || "to_create",
          asString(row.delivery_file_key) || null, asString(row.delivery_file_name) || null, asString(row.delivery_token) || null,
          asString(row.shopify_created_at) || new Date().toISOString(), asString(row.synced_at) || new Date().toISOString(),
          asString(row.delivered_at) || null, asString(row.delivery_email_sent_at) || null,
          asString(row.delivery_email_message_id) || null, Number(row.delivery_email_count || 0),
          asString(row.delivery_viewed_at) || null, asString(row.delivery_downloaded_at) || null
        ).run();
    }
  }

  if (await tableExists(env, "revisions")) {
    const legacy = await env.DB.prepare("SELECT * FROM revisions").all<Record<string, unknown>>();
    for (const row of legacy.results || []) {
      const legacyOrderId = asString(row.shopify_order_id);
      if (!legacyOrderId) continue;
      await env.DB.prepare("INSERT OR IGNORE INTO mhc_revisions(id, order_id, revision_type, message, song_moment, status, created_at, updated_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(asString(row.id), `shopify:${legacyOrderId}`, asString(row.revision_type), asString(row.message), asString(row.song_moment) || null, asString(row.status) || "new", asString(row.created_at) || new Date().toISOString(), asString(row.updated_at) || new Date().toISOString())
        .run();
    }
  }
}

function isAdmin(request: Request, env: Env) {
  return Boolean(env.ADMIN_TOKEN && request.headers.get("X-Admin-Token") === env.ADMIN_TOKEN);
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asInt(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : fallback;
}

function cloneDefaultOffersConfig(): OffersConfigRecord {
  return JSON.parse(JSON.stringify(DEFAULT_OFFERS_CONFIG)) as OffersConfigRecord;
}

function normalizeOfferConfig(raw: unknown, fallback: OfferConfigRecord): OfferConfigRecord {
  const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const rawRevisionLimit = value.revisionLimit;
  const revisionLimit = rawRevisionLimit === null
    ? null
    : Math.max(0, Math.min(20, asInt(rawRevisionLimit, fallback.revisionLimit ?? 0)));
  const compareAtValue = value.compareAtCents;
  const compareAtCents = compareAtValue === null || compareAtValue === "" || typeof compareAtValue === "undefined"
    ? null
    : Math.max(0, asInt(compareAtValue));
  const benefits = asStringArray(value.benefits).map(item => item.trim()).filter(Boolean).slice(0, 10);

  return {
    id: fallback.id,
    active: typeof value.active === "boolean" ? value.active : fallback.active,
    name: asString(value.name).slice(0, 60) || fallback.name,
    priceCents: Math.max(50, Math.min(100000, asInt(value.priceCents, fallback.priceCents))),
    compareAtCents,
    benefits: benefits.length ? benefits : fallback.benefits,
    revisionLimit,
    deliveryHours: Math.max(1, Math.min(720, asInt(value.deliveryHours, fallback.deliveryHours))),
    recommended: typeof value.recommended === "boolean" ? value.recommended : fallback.recommended,
    expressEligible: typeof value.expressEligible === "boolean" ? value.expressEligible : fallback.expressEligible
  };
}

function normalizeOffersConfig(raw: unknown): OffersConfigRecord {
  const fallback = cloneDefaultOffersConfig();
  const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const rawOffers = Array.isArray(value.offers) ? value.offers : [];
  const offers = fallback.offers.map(defaultOffer => {
    const candidate = rawOffers.find(item => item && typeof item === "object" && asString((item as Record<string, unknown>).id) === defaultOffer.id);
    return normalizeOfferConfig(candidate, defaultOffer);
  });
  return {
    version: Math.max(1, asInt(value.version, fallback.version)),
    expressPriceCents: Math.max(0, Math.min(100000, asInt(value.expressPriceCents, fallback.expressPriceCents))),
    offers,
    updatedAt: asString(value.updatedAt) || undefined
  };
}

async function loadOffersConfig(env: Env): Promise<OffersConfigRecord> {
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key=?").bind("offers_config").first<{ value: string }>();
  if (row?.value) {
    try { return normalizeOffersConfig(JSON.parse(row.value)); } catch { /* fall back and repair below */ }
  }
  const fallback = cloneDefaultOffersConfig();
  fallback.updatedAt = new Date().toISOString();
  await env.DB.prepare("INSERT INTO settings(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO NOTHING")
    .bind("offers_config", JSON.stringify(fallback)).run();
  return fallback;
}

function validateOffersConfig(raw: unknown, nextVersion: number): OffersConfigRecord {
  const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const rawOffers = Array.isArray(value.offers) ? value.offers : [];
  const expectedIds: OfferId[] = ["discovery", "essential", "premium"];
  if (rawOffers.length !== expectedIds.length) throw new Error("Les trois emplacements d’offres sont requis.");

  const ids = rawOffers.map(item => asString((item as Record<string, unknown>)?.id));
  if (new Set(ids).size !== expectedIds.length || expectedIds.some(id => !ids.includes(id))) {
    throw new Error("La structure des offres est invalide.");
  }

  const config = normalizeOffersConfig({ ...value, version: nextVersion, updatedAt: new Date().toISOString() });
  const active = config.offers.filter(offer => offer.active);
  if (active.length < 2 || active.length > 3) throw new Error("Activez exactement 2 ou 3 offres.");

  for (const offer of config.offers) {
    if (!offer.name.trim()) throw new Error(`Ajoutez un titre à l’offre ${offer.id}.`);
    if (offer.priceCents < 50) throw new Error(`Le prix de ${offer.name} est invalide.`);
    if (offer.compareAtCents !== null && offer.compareAtCents <= offer.priceCents) {
      throw new Error(`Le prix comparé de ${offer.name} doit être supérieur au prix actuel.`);
    }
    if (!offer.benefits.length) throw new Error(`Ajoutez au moins un avantage à ${offer.name}.`);
  }

  const recommendedActive = active.filter(offer => offer.recommended);
  if (recommendedActive.length > 1) throw new Error("Une seule offre active peut porter le badge « Recommandée ».");
  return config;
}

function findActiveOffer(config: OffersConfigRecord, id: string) {
  const offer = config.offers.find(item => item.id === id && item.active);
  if (!offer) throw new Error("Cette formule n’est plus disponible.");
  return offer;
}

function calculateConfiguredAmount(config: OffersConfigRecord, offerId: string, requestedExpress: boolean) {
  const offer = findActiveOffer(config, offerId);
  const express = Boolean(requestedExpress && offer.expressEligible);
  const deliveryHours = express ? 24 : offer.deliveryHours;
  const amountCents = offer.priceCents + (express ? config.expressPriceCents : 0);
  const snapshot = {
    id: offer.id,
    name: offer.name,
    priceCents: offer.priceCents,
    compareAtCents: offer.compareAtCents,
    revisionLimit: offer.revisionLimit,
    deliveryHours,
    express,
    expressPriceCents: express ? config.expressPriceCents : 0,
    configVersion: config.version
  };
  return { offer, express, deliveryHours, amountCents, snapshot };
}

function revisionLimitForOrder(row: Record<string, unknown>): number | null {
  if (row.offer_config_version !== null && typeof row.offer_config_version !== "undefined") {
    return row.revision_limit === null || typeof row.revision_limit === "undefined" ? null : Math.max(0, asInt(row.revision_limit));
  }
  const offer = asString(row.selected_offer);
  if (offer === "premium") return null;
  if (offer === "discovery") return 0;
  return 1;
}

function deliveryHoursForOrder(row: Record<string, unknown>) {
  const configured = asInt(row.delivery_hours);
  if (configured > 0) return configured;
  return Boolean(row.express) ? 24 : 96;
}

function offerNameForOrder(row: Record<string, unknown>) {
  const configured = asString(row.offer_name);
  if (configured) return configured;
  const offer = asString(row.selected_offer);
  if (offer === "premium") return "Premium";
  if (offer === "discovery") return "Découverte";
  return "Essentiel";
}

function parseAnswers(value: unknown): Answers | null {
  if (typeof value !== "string" || !value) return null;
  try { return JSON.parse(value) as Answers; } catch { return null; }
}

function safeKey(name: string, prefix = "uploads") {
  const ext = name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  return `${prefix}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
}

function safeDeliveryKey(orderName: string, fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "mp3";
  const order = orderName.replace(/[^a-zA-Z0-9_-]/g, "") || "commande";
  return `deliveries/${order}/${crypto.randomUUID()}.${ext}`;
}

function safeExcerptKey(submissionId: string, fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "mp3";
  return `previews/${submissionId.replace(/[^a-zA-Z0-9_-]/g, "")}/${crypto.randomUUID()}.${ext}`;
}

function stableOrderId(provider: string, providerOrderId: string) {
  return `${provider}:${providerOrderId}`;
}

function isPaidStatus(status: string) {
  return ["paid", "partially_paid", "authorized", "succeeded"].includes(status.toLowerCase());
}

async function recordAnalyticsEvent(env: Env, input: {
  eventId: string;
  eventName: AnalyticsEventName;
  sessionId?: string;
  submissionId?: string;
  eventSource?: string;
  path?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  campaignId?: string;
  adsetId?: string;
  adId?: string;
  valueCents?: number;
  currency?: string;
  paymentProvider?: string;
  providerId?: string;
  metadata?: unknown;
  occurredAt?: string;
}) {
  const allowed = new Set<AnalyticsEventName>(["LandingPageView", "MHCFormStarted", "Lead", "AddToCart", "InitiateCheckout", "Purchase"]);
  if (!allowed.has(input.eventName) || !input.eventId) return;
  await env.DB.prepare(`INSERT OR IGNORE INTO analytics_events(
    id, event_id, event_name, session_id, submission_id, event_source, path, referrer, utm_source, utm_medium,
    utm_campaign, utm_content, utm_term, campaign_id, adset_id, ad_id, value_cents, currency, payment_provider,
    provider_id, metadata, occurred_at
  ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`)
    .bind(
      crypto.randomUUID(), input.eventId, input.eventName, input.sessionId || null, input.submissionId || null,
      input.eventSource || "server", input.path || null, input.referrer || null, input.utmSource || null,
      input.utmMedium || null, input.utmCampaign || null, input.utmContent || null, input.utmTerm || null,
      input.campaignId || null, input.adsetId || null, input.adId || null,
      Number.isFinite(input.valueCents) ? input.valueCents : null, input.currency || null,
      input.paymentProvider || null, input.providerId || null,
      input.metadata ? JSON.stringify(input.metadata) : null, input.occurredAt || null
    ).run();
}

async function attributionForSubmission(env: Env, submissionId: string) {
  if (!submissionId) return {} as Record<string, string>;
  const row = await env.DB.prepare(`SELECT utm_source, utm_medium, utm_campaign, utm_content, utm_term, campaign_id, adset_id, ad_id
    FROM analytics_events WHERE submission_id=? AND (utm_source IS NOT NULL OR utm_campaign IS NOT NULL) ORDER BY occurred_at ASC LIMIT 1`)
    .bind(submissionId).first<Record<string, unknown>>();
  return {
    utmSource: asString(row?.utm_source), utmMedium: asString(row?.utm_medium), utmCampaign: asString(row?.utm_campaign),
    utmContent: asString(row?.utm_content), utmTerm: asString(row?.utm_term), campaignId: asString(row?.campaign_id),
    adsetId: asString(row?.adset_id), adId: asString(row?.ad_id)
  };
}

async function recordServerFunnelEvent(env: Env, eventName: AnalyticsEventName, submissionId: string, details: Record<string, unknown> = {}) {
  const attribution = await attributionForSubmission(env, submissionId);
  await recordAnalyticsEvent(env, {
    eventId: `server:${eventName}:${submissionId}`,
    eventName,
    submissionId,
    eventSource: "server",
    valueCents: asInt(details.valueCents, 0) || undefined,
    currency: asString(details.currency) || "EUR",
    paymentProvider: asString(details.paymentProvider),
    providerId: asString(details.providerId),
    metadata: details,
    ...attribution
  });
}

function klaviyoHeaders(env: Env) {
  return {
    Authorization: `Klaviyo-API-Key ${env.KLAVIYO_PRIVATE_API_KEY}`,
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
    revision: env.KLAVIYO_API_REVISION || "2026-07-15"
  };
}

async function klaviyoRequest(env: Env, endpoint: string, body: unknown) {
  if (!env.KLAVIYO_PRIVATE_API_KEY) return;
  const response = await fetch(`https://a.klaviyo.com${endpoint}`, { method: "POST", headers: klaviyoHeaders(env), body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`Klaviyo ${response.status}: ${(await response.text()).slice(0, 1200)}`);
}

async function subscribeKlaviyoProfile(env: Env, email: string) {
  if (!env.KLAVIYO_PRIVATE_API_KEY || !env.KLAVIYO_LIST_ID) return;
  await klaviyoRequest(env, "/api/profile-subscription-bulk-create-jobs/", {
    data: {
      type: "profile-subscription-bulk-create-job",
      attributes: { profiles: { data: [{ type: "profile", attributes: { email, subscriptions: { email: { marketing: { consent: "SUBSCRIBED" } } } } }] } },
      relationships: { list: { data: { type: "list", id: env.KLAVIYO_LIST_ID } } }
    }
  });
}

async function createKlaviyoEvent(env: Env, eventName: string, uniqueId: string, email: string, answers: Answers, properties: Record<string, unknown>) {
  if (!env.KLAVIYO_PRIVATE_API_KEY) return;
  const qualities = asStringArray(answers.qualities);
  await klaviyoRequest(env, "/api/events", {
    data: {
      type: "event",
      attributes: {
        unique_id: uniqueId,
        properties,
        metric: { data: { type: "metric", attributes: { name: eventName } } },
        profile: { data: { type: "profile", attributes: { email, locale: "fr-FR", properties: {
          "MHC Submission ID": uniqueId.split(":")[0], "MHC Relation": asString(answers.relation),
          "MHC Genre": asString(answers.genre), "MHC Voice": asString(answers.voice),
          "MHC Quality Count": qualities.length, "MHC Email Consent": Boolean(answers.consent)
        } } } }
      }
    }
  });
}

async function runIntegrationOnce(env: Env, eventKey: string, submissionId: string, provider: string, eventName: string, action: () => Promise<void>, allowResend = false) {
  const existing = await env.DB.prepare("SELECT status FROM integration_events WHERE event_key=?").bind(eventKey).first<{ status: string }>();
  if (existing?.status === "sent" && !allowResend) return;
  await env.DB.prepare("INSERT INTO integration_events(event_key, submission_id, provider, event_name, status, last_error, updated_at) VALUES(?, ?, ?, ?, 'pending', NULL, CURRENT_TIMESTAMP) ON CONFLICT(event_key) DO UPDATE SET status='pending', last_error=NULL, updated_at=CURRENT_TIMESTAMP")
    .bind(eventKey, submissionId, provider, eventName).run();
  try {
    await action();
    await env.DB.prepare("UPDATE integration_events SET status='sent', last_error=NULL, updated_at=CURRENT_TIMESTAMP WHERE event_key=?").bind(eventKey).run();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur d’intégration inconnue";
    await env.DB.prepare("UPDATE integration_events SET status='failed', last_error=?, updated_at=CURRENT_TIMESTAMP WHERE event_key=?").bind(message.slice(0, 1200), eventKey).run();
    throw error;
  }
}

async function trackFormCompleted(env: Env, submissionId: string, email: string, answers: Answers, origin: string) {
  if (!Boolean(answers.consent)) return;
  await runIntegrationOnce(env, `${submissionId}:subscribe`, submissionId, "klaviyo", "Subscribe Profile", () => subscribeKlaviyoProfile(env, email));
  await runIntegrationOnce(env, `${submissionId}:form_completed`, submissionId, "klaviyo", "MHC Form Completed", () => createKlaviyoEvent(env, "MHC Form Completed", `${submissionId}:form_completed`, email, answers, {
    "Submission ID": submissionId,
    "Recipient Name": asString(answers.recipientName),
    Relation: asString(answers.relation),
    "Music Genre": asString(answers.genre),
    Voice: asString(answers.voice),
    "Quality Count": asStringArray(answers.qualities).length,
    "Funnel URL": `${origin}/composer`,
    "Email Consent": true
  }));
}

async function trackCheckoutStarted(env: Env, submissionId: string, email: string, consent: boolean, answers: Answers, checkoutUrl: string, valueCents?: number) {
  if (!consent) return;
  await runIntegrationOnce(env, `${submissionId}:checkout_started`, submissionId, "klaviyo", "MHC Checkout Started", () => createKlaviyoEvent(env, "MHC Checkout Started", `${submissionId}:checkout_started`, email, answers, {
    "Submission ID": submissionId,
    "Recipient Name": asString(answers.recipientName),
    Offer: asString(answers.offer),
    Express: Boolean(answers.express),
    "Checkout URL": checkoutUrl,
    Value: typeof valueCents === "number" ? valueCents / 100 : baseOfferAmountEuros(asString(answers.offer)) + (Boolean(answers.express) ? LEGACY_PRICE_CENTS.express / 100 : 0),
    Currency: "EUR"
  }));
}

async function trackPreviewReady(env: Env, submissionId: string, email: string, answers: Answers, previewUrl: string, resumeUrl: string, resendCount: number) {
  const key = `${submissionId}:preview_ready:${resendCount + 1}`;
  await runIntegrationOnce(env, key, submissionId, "klaviyo", "MHC Preview Ready", () => createKlaviyoEvent(env, "MHC Preview Ready", key, email, answers, {
    "Submission ID": submissionId,
    "Recipient Name": asString(answers.recipientName),
    "Preview URL": previewUrl,
    "Resume URL": resumeUrl,
    Offer: asString(answers.offer),
    Express: Boolean(answers.express)
  }), true);
}

async function trackOrderPaid(env: Env, order: Record<string, unknown>, answers: Answers) {
  const email = asString(order.email);
  const submissionId = asString(order.submission_id);
  if (!email || !submissionId) return;
  await runIntegrationOnce(env, `${submissionId}:order_paid`, submissionId, "klaviyo", "MHC Order Paid", () => createKlaviyoEvent(env, "MHC Order Paid", `${submissionId}:order_paid`, email, answers, {
    "Submission ID": submissionId,
    "Order ID": asString(order.id),
    "Order Name": asString(order.order_name),
    "Payment Provider": asString(order.payment_provider),
    Value: asInt(order.amount_cents) / 100,
    Currency: asString(order.currency) || "EUR",
    Offer: asString(order.selected_offer),
    Express: Boolean(order.express)
  }));
}

type ShopifyOrderNode = {
  id: string;
  name: string;
  createdAt: string;
  email?: string | null;
  displayFinancialStatus?: string | null;
  displayFulfillmentStatus?: string | null;
  totalPriceSet?: { shopMoney?: { amount?: string; currencyCode?: string } };
  customer?: { displayName?: string | null; email?: string | null } | null;
  customAttributes?: Array<{ key: string; value?: string | null }>;
  lineItems?: { nodes?: Array<{ name?: string; title?: string; variantTitle?: string | null; quantity?: number; customAttributes?: Array<{ key: string; value?: string | null }> }> };
};

let cachedShopifyToken: { value: string; expiresAt: number } | null = null;

async function getShopifyAdminAccessToken(env: Env) {
  if (cachedShopifyToken && Date.now() < cachedShopifyToken.expiresAt - 60_000) return cachedShopifyToken.value;
  if (!env.SHOPIFY_CLIENT_ID || !env.SHOPIFY_CLIENT_SECRET) {
    if (env.SHOPIFY_ADMIN_ACCESS_TOKEN) return env.SHOPIFY_ADMIN_ACCESS_TOKEN;
    throw new Error("Ajoutez SHOPIFY_CLIENT_ID et SHOPIFY_CLIENT_SECRET dans Cloudflare.");
  }
  const response = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: env.SHOPIFY_CLIENT_ID, client_secret: env.SHOPIFY_CLIENT_SECRET })
  });
  const result = await response.json() as { access_token?: string; expires_in?: number; error?: string; error_description?: string };
  if (!response.ok || !result.access_token) throw new Error(result.error_description || result.error || `Authentification Shopify ${response.status}`);
  cachedShopifyToken = { value: result.access_token, expiresAt: Date.now() + (result.expires_in || 86399) * 1000 };
  return result.access_token;
}

async function shopifyAdminGraphql<T>(env: Env, query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/${env.SHOPIFY_API_VERSION || "2026-04"}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": await getShopifyAdminAccessToken(env) },
    body: JSON.stringify({ query, variables })
  });
  const result = await response.json() as { data?: T; errors?: Array<{ message?: string }> };
  if (!response.ok || result.errors?.length || !result.data) throw new Error(result.errors?.map(item => item.message).filter(Boolean).join(" · ") || `Shopify ${response.status}`);
  return result.data;
}

function attributeValue(attributes: Array<{ key: string; value?: string | null }> | undefined, keys: string[]) {
  const wanted = new Set(keys.map(key => key.toLowerCase()));
  return attributes?.find(attribute => wanted.has(attribute.key.toLowerCase()))?.value?.trim() || "";
}

function extractOrderMetadata(order: ShopifyOrderNode) {
  const lines = order.lineItems?.nodes || [];
  const lineAttributes = lines.flatMap(line => line.customAttributes || []);
  const submissionId = attributeValue(order.customAttributes || [], ["__submission_id", "_submission_id"]) || attributeValue(lineAttributes, ["_submission_id", "__submission_id"]);
  const selectedOffer = attributeValue(lineAttributes, ["_formule", "formule"]) || (lines.some(line => `${line.name || ""} ${line.variantTitle || ""}`.toLowerCase().includes("premium")) ? "premium" : "essential");
  const express = lines.some(line => `${line.name || ""} ${line.title || ""}`.toLowerCase().includes("express"));
  return { submissionId, selectedOffer, express };
}

async function syncShopifyOrders(env: Env) {
  const query = `query MhcOrders($first:Int!){ orders(first:$first, sortKey:CREATED_AT, reverse:true){ nodes{ id name createdAt email displayFinancialStatus displayFulfillmentStatus totalPriceSet{shopMoney{amount currencyCode}} customer{displayName email} customAttributes{key value} lineItems(first:20){nodes{name title variantTitle quantity customAttributes{key value}}} } } }`;
  const data = await shopifyAdminGraphql<{ orders: { nodes: ShopifyOrderNode[] } }>(env, query, { first: 100 });
  let imported = 0;
  for (const order of data.orders.nodes || []) {
    const metadata = extractOrderMetadata(order);
    if (!metadata.submissionId) continue;
    const providerOrderId = order.id;
    const id = stableOrderId("shopify", providerOrderId);
    const paymentStatus = asString(order.displayFinancialStatus).toLowerCase() || "pending";
    const amountCents = Math.round(Number(order.totalPriceSet?.shopMoney?.amount || 0) * 100);
    const email = asString(order.email) || asString(order.customer?.email);
    const customerName = asString(order.customer?.displayName);
    await env.DB.prepare(`INSERT INTO mhc_orders(
      id, submission_id, payment_provider, provider_order_id, order_name, email, customer_name, payment_status,
      fulfillment_status, amount_cents, currency, selected_offer, express, provider_created_at, synced_at, updated_at
    ) VALUES(?, ?, 'shopify', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(payment_provider, provider_order_id) DO UPDATE SET
      submission_id=excluded.submission_id, order_name=excluded.order_name, email=excluded.email,
      customer_name=excluded.customer_name, payment_status=excluded.payment_status,
      fulfillment_status=excluded.fulfillment_status, amount_cents=excluded.amount_cents, currency=excluded.currency,
      selected_offer=excluded.selected_offer, express=excluded.express, provider_created_at=excluded.provider_created_at,
      synced_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP`)
      .bind(id, metadata.submissionId, providerOrderId, order.name, email || null, customerName || null, paymentStatus,
        asString(order.displayFulfillmentStatus).toLowerCase() || null, amountCents,
        order.totalPriceSet?.shopMoney?.currencyCode || "EUR", metadata.selectedOffer, metadata.express ? 1 : 0, order.createdAt)
      .run();

    if (isPaidStatus(paymentStatus)) {
      await env.DB.prepare("UPDATE submissions SET status='paid', updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(metadata.submissionId).run();
      const answersRow = await env.DB.prepare("SELECT answers FROM submissions WHERE id=?").bind(metadata.submissionId).first<{ answers: string }>();
      const answers = parseAnswers(answersRow?.answers) || {};
      const orderRow = await env.DB.prepare("SELECT * FROM mhc_orders WHERE id=?").bind(id).first<Record<string, unknown>>();
      await recordAnalyticsEvent(env, {
        eventId: `server:Purchase:shopify:${providerOrderId}`,
        eventName: "Purchase",
        submissionId: metadata.submissionId,
        eventSource: "shopify_sync",
        valueCents: amountCents,
        currency: order.totalPriceSet?.shopMoney?.currencyCode || "EUR",
        paymentProvider: "shopify",
        providerId: providerOrderId,
        metadata: { orderName: order.name },
        occurredAt: order.createdAt,
        ...await attributionForSubmission(env, metadata.submissionId)
      });
      if (orderRow) await trackOrderPaid(env, orderRow, answers).catch(error => console.error("MHC Order Paid failed", error));
    }
    imported += 1;
  }
  return imported;
}

type RevisionRow = { id: string; order_id: string; revision_type: string; message: string; song_moment?: string | null; status: string; created_at: string };

function serializeRevision(row: RevisionRow) {
  return { id: row.id, revisionType: row.revision_type, message: row.message, songMoment: row.song_moment || "", status: row.status, createdAt: row.created_at };
}

function serializeOrder(row: Record<string, unknown>, revisions: RevisionRow[] = []) {
  const token = asString(row.delivery_token);
  return {
    id: asString(row.id), paymentProvider: asString(row.payment_provider), providerOrderId: asString(row.provider_order_id),
    orderName: asString(row.order_name), submissionId: asString(row.submission_id), email: asString(row.email),
    customerName: asString(row.customer_name), paymentStatus: asString(row.payment_status), fulfillmentStatus: asString(row.fulfillment_status),
    amountCents: asInt(row.amount_cents), currency: asString(row.currency) || "EUR", selectedOffer: asString(row.selected_offer),
    offerName: offerNameForOrder(row), offerConfigVersion: asInt(row.offer_config_version),
    revisionLimit: revisionLimitForOrder(row), deliveryHours: deliveryHoursForOrder(row),
    express: Boolean(row.express), productionStatus: asString(row.production_status) || "to_create",
    deliveryFileName: asString(row.delivery_file_name), deliveryUrl: token ? `/chanson/${encodeURIComponent(token)}` : "",
    providerCreatedAt: asString(row.provider_created_at), deliveredAt: asString(row.delivered_at),
    deliveryEmailSentAt: asString(row.delivery_email_sent_at), deliveryEmailCount: asInt(row.delivery_email_count),
    deliveryViewedAt: asString(row.delivery_viewed_at), deliveryDownloadedAt: asString(row.delivery_downloaded_at),
    revisionCount: revisions.length, revisions: revisions.map(serializeRevision), answers: parseAnswers(row.answers)
  };
}

function serializeProspect(row: Record<string, unknown>) {
  const token = asString(row.preview_token);
  return {
    submissionId: asString(row.submission_id), email: asString(row.email), status: asString(row.preview_status) || (asString(row.order_id) ? "converted" : "to_create"),
    submissionStatus: asString(row.submission_status), selectedOffer: asString(row.selected_offer), offerConfigVersion: asInt(row.offer_config_version), express: Boolean(row.express),
    createdAt: asString(row.created_at), updatedAt: asString(row.updated_at), excerptFileName: asString(row.excerpt_file_name),
    previewUrl: token ? `/extrait/${encodeURIComponent(token)}` : "", previewEmailSentAt: asString(row.preview_email_sent_at),
    previewEmailCount: asInt(row.preview_email_count), previewViewedAt: asString(row.preview_viewed_at), answers: parseAnswers(row.answers) || {}
  };
}


async function sendMetaInitiateCheckout(env: Env, params: {
  submissionId: string;
  paymentIntentId: string;
  email: string;
  amountCents: number;
  offer: string;
  express: boolean;
}) {
  const pixelId = env.META_PIXEL_ID || "1544240104114351";
  if (!env.META_CAPI_ACCESS_TOKEN || !pixelId) return;
  const session = await env.DB.prepare("SELECT * FROM stripe_payment_sessions WHERE payment_intent_id=?").bind(params.paymentIntentId).first<Record<string, unknown>>();
  const userData: Record<string, unknown> = {};
  if (params.email) userData.em = [await sha256Hex(params.email.toLowerCase())];
  userData.external_id = [await sha256Hex(params.submissionId)];
  if (asString(session?.fbp)) userData.fbp = asString(session?.fbp);
  if (asString(session?.fbc)) userData.fbc = asString(session?.fbc);
  if (asString(session?.client_ip)) userData.client_ip_address = asString(session?.client_ip);
  if (asString(session?.client_user_agent)) userData.client_user_agent = asString(session?.client_user_agent);
  const offerSnapshot = parseAnswers(session?.offer_snapshot) || {};
  const offerItemPrice = asInt(offerSnapshot.priceCents, baseOfferAmountCents(params.offer)) / 100;
  const expressItemPrice = asInt(offerSnapshot.expressPriceCents, LEGACY_PRICE_CENTS.express) / 100;
  const contents = [
    { id: `chanson_personnalisee_${params.offer}`, quantity: 1, item_price: offerItemPrice },
    ...(params.express ? [{ id: "livraison_express_24h", quantity: 1, item_price: expressItemPrice }] : [])
  ];
  const payload = {
    data: [{
      event_name: "InitiateCheckout",
      event_time: Math.floor(Date.now() / 1000),
      event_id: `initiate_checkout:stripe:${params.submissionId}`,
      event_source_url: asString(session?.event_source_url) || "https://monhistoirechantee.com/composer",
      action_source: "website",
      user_data: userData,
      custom_data: {
        value: params.amountCents / 100,
        currency: "EUR",
        content_ids: contents.map(item => item.id),
        contents,
        content_type: "product",
        num_items: contents.length
      }
    }]
  };
  const response = await fetch(`https://graph.facebook.com/v23.0/${pixelId}/events?access_token=${encodeURIComponent(env.META_CAPI_ACCESS_TOKEN)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(`Meta CAPI ${response.status}: ${(await response.text()).slice(0, 500)}`);
}

async function sendMetaPurchase(env: Env, order: Record<string, unknown>) {
  const pixelId = env.META_PIXEL_ID || "1544240104114351";
  if (!env.META_CAPI_ACCESS_TOKEN || !pixelId) return;
  if (asString(order.payment_provider) === "shopify" && env.META_SEND_SHOPIFY_PURCHASES !== "true") return;
  const email = asString(order.email).toLowerCase();
  const submissionId = asString(order.submission_id);
  const session = asString(order.payment_provider) === "stripe"
    ? await env.DB.prepare("SELECT * FROM stripe_payment_sessions WHERE payment_intent_id=?").bind(asString(order.provider_order_id)).first<Record<string, unknown>>()
    : null;
  const userData: Record<string, unknown> = {};
  if (email) userData.em = [await sha256Hex(email)];
  if (submissionId) userData.external_id = [await sha256Hex(submissionId)];
  if (asString(session?.fbp)) userData.fbp = asString(session?.fbp);
  if (asString(session?.fbc)) userData.fbc = asString(session?.fbc);
  if (asString(session?.client_ip)) userData.client_ip_address = asString(session?.client_ip);
  if (asString(session?.client_user_agent)) userData.client_user_agent = asString(session?.client_user_agent);
  const provider = asString(order.payment_provider);
  const providerId = asString(order.provider_order_id);
  const offerSnapshot = parseAnswers(order.offer_snapshot) || {};
  const offerItemPrice = asInt(offerSnapshot.priceCents, baseOfferAmountCents(asString(order.selected_offer))) / 100;
  const expressItemPrice = asInt(offerSnapshot.expressPriceCents, LEGACY_PRICE_CENTS.express) / 100;
  const contents = [
    { id: `chanson_personnalisee_${asString(order.selected_offer)}`, quantity: 1, item_price: offerItemPrice },
    ...(Boolean(order.express) ? [{ id: "livraison_express_24h", quantity: 1, item_price: expressItemPrice }] : [])
  ];
  const payload = {
    data: [{
      event_name: "Purchase",
      event_time: Math.floor(new Date(asString(order.provider_created_at) || Date.now()).getTime() / 1000),
      event_id: provider === "stripe" ? `purchase:stripe:${providerId}` : `purchase:${provider}:${providerId}`,
      event_source_url: asString(session?.event_source_url) || "https://monhistoirechantee.com/composer",
      action_source: "website",
      user_data: userData,
      custom_data: {
        value: asInt(order.amount_cents) / 100,
        currency: asString(order.currency) || "EUR",
        content_ids: contents.map(item => item.id),
        contents,
        content_type: "product",
        num_items: contents.length
      }
    }]
  };
  const response = await fetch(`https://graph.facebook.com/v23.0/${pixelId}/events?access_token=${encodeURIComponent(env.META_CAPI_ACCESS_TOKEN)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(`Meta CAPI ${response.status}: ${(await response.text()).slice(0, 500)}`);
}

type StripePaymentIntentObject = {
  id: string;
  object?: string;
  client_secret?: string | null;
  status: string;
  amount: number;
  amount_received?: number;
  currency: string;
  created?: number;
  receipt_email?: string | null;
  metadata?: Record<string, string>;
  last_payment_error?: { message?: string } | null;
};

type StripeWebhookEvent = {
  id: string;
  type: string;
  data?: { object?: StripePaymentIntentObject };
};

function stripeConfigured(env: Env) {
  return Boolean(env.STRIPE_PUBLISHABLE_KEY && env.STRIPE_SECRET_KEY);
}

async function stripeRequest<T>(env: Env, path: string, method: "GET" | "POST" = "GET", params?: URLSearchParams): Promise<T> {
  if (!env.STRIPE_SECRET_KEY) throw new Error("Ajoutez STRIPE_SECRET_KEY dans Cloudflare.");
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {})
    },
    body: method === "POST" ? params : undefined
  });
  const text = await response.text();
  let payload: Record<string, unknown> = {};
  try { payload = JSON.parse(text) as Record<string, unknown>; } catch { /* Stripe should return JSON. */ }
  if (!response.ok) {
    const stripeError = payload.error as { message?: string } | undefined;
    throw new Error(stripeError?.message || `Stripe ${response.status}`);
  }
  return payload as T;
}

function stripeAmount(offer: string, express: boolean) {
  return baseOfferAmountCents(offer) + (express ? LEGACY_PRICE_CENTS.express : 0);
}

function normalizePromoCode(value: unknown) {
  return asString(value).trim().toUpperCase().replace(/\s+/g, "").slice(0, 40);
}

function activePromo(env: Env) {
  const code = normalizePromoCode(env.MHC_PROMO_CODE);
  if (!code) return null;

  const rawValue = asString(env.MHC_PROMO_PERCENT).trim().replace(",", ".");
  const rawPercent = Number(rawValue);
  if (!rawValue || !Number.isFinite(rawPercent)) {
    throw new Error("Le code promo est temporairement indisponible.");
  }

  const percent = Math.min(99, Math.max(1, Math.round(rawPercent)));
  return { code, percent };
}

function calculatePromo(env: Env, submittedCode: unknown, baseAmountCents: number) {
  const code = normalizePromoCode(submittedCode);
  if (!code) return { code: "", percent: 0, discountCents: 0, amountCents: baseAmountCents };
  const configured = activePromo(env);
  if (!configured || code !== configured.code) throw new Error("Ce code promo n’est pas valide.");
  const amountCents = Math.max(50, Math.round(baseAmountCents * (100 - configured.percent) / 100));
  return {
    code: configured.code,
    percent: configured.percent,
    discountCents: baseAmountCents - amountCents,
    amountCents
  };
}

function stripePaymentParams(input: {
  amountCents: number;
  submissionId: string;
  offer: string;
  offerName: string;
  offerConfigVersion: number;
  revisionLimit: number | null;
  deliveryHours: number;
  express: boolean;
  email: string;
  recipientName: string;
  promoCode?: string;
  discountCents?: number;
}, includePaymentMethodType = true) {
  const params = new URLSearchParams({
    amount: String(input.amountCents),
    currency: "eur",
    description: `Chanson personnalisée pour ${input.recipientName || "un proche"}`,
    "metadata[submission_id]": input.submissionId,
    "metadata[offer]": input.offer,
    "metadata[offer_name]": input.offerName,
    "metadata[offer_config_version]": String(input.offerConfigVersion),
    "metadata[revision_limit]": input.revisionLimit === null ? "-1" : String(input.revisionLimit),
    "metadata[delivery_hours]": String(input.deliveryHours),
    "metadata[express]": input.express ? "1" : "0",
    "metadata[recipient_name]": input.recipientName,
    "metadata[promo_code]": input.promoCode || "",
    "metadata[discount_cents]": String(input.discountCents || 0)
  });
  if (includePaymentMethodType) params.append("payment_method_types[]", "card");
  return params;
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string) {
  if (!/^[a-f0-9]+$/i.test(hex) || hex.length % 2 !== 0) return new Uint8Array();
  return new Uint8Array(hex.match(/.{2}/g)?.map(value => Number.parseInt(value, 16)) || []);
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function verifyStripeSignature(payload: string, signatureHeader: string, secret: string) {
  const entries = signatureHeader.split(",").map(part => part.trim().split("=", 2));
  const timestamp = entries.find(([key]) => key === "t")?.[1] || "";
  const signatures = entries.filter(([key]) => key === "v1").map(([, value]) => value);
  const timestampNumber = Number(timestamp);
  if (!timestamp || !Number.isFinite(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > 300 || !signatures.length) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`)));
  return signatures.some(signature => constantTimeEqual(expected, hexToBytes(signature)));
}

function stripeOrderConfirmationHtml(params: {
  customerFirstName: string;
  recipientName: string;
  offerName: string;
  revisionLimit: number | null;
  deliveryHours: number;
  amountCents: number;
  orderName: string;
}) {
  const logo = "https://cdn.shopify.com/s/files/1/1094/5658/9138/files/Logov2-nobg_ea620d66-5432-4114-a214-109012b35880.png?v=1785951795";
  const customer = escapeHtml(params.customerFirstName);
  const recipient = escapeHtml(params.recipientName || "votre proche");
  const revisionLabel = params.revisionLimit === null
    ? "Révisions illimitées"
    : params.revisionLimit === 0
      ? "Sans révision incluse"
      : `${params.revisionLimit} révision${params.revisionLimit > 1 ? "s" : ""} incluse${params.revisionLimit > 1 ? "s" : ""}`;
  const offer = `${params.offerName} · ${revisionLabel}`;
  const deliveryDays = Math.max(1, Math.round(params.deliveryHours / 24));
  const delivery = params.deliveryHours <= 24 ? "Livraison prioritaire sous 24 h" : `Livraison sous ${deliveryDays} jours`;
  const amount = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(params.amountCents / 100);
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>Commande confirmée</title></head>
<body style="margin:0;padding:0;background:#fffaf6;color:#2c2023;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Votre paiement est confirmé. La chanson de ${recipient} entre en création.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:radial-gradient(circle at 88% 4%,rgba(181,60,108,.17),transparent 25%),linear-gradient(180deg,#fffaf7,#f8efec);"><tr><td align="center" style="padding:30px 12px 42px;"><table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:640px;max-width:100%;"><tr><td align="center" style="padding:0 16px 22px;"><img src="${logo}" width="220" alt="Mon Histoire Chantée" style="display:block;width:220px;max-width:72%;height:auto;border:0;"></td></tr>
<tr><td style="overflow:hidden;border:1px solid rgba(111,51,69,.13);border-radius:32px;background:radial-gradient(circle at 88% 8%,rgba(240,217,217,.85),transparent 26%),linear-gradient(145deg,#fff,#fff8fa);box-shadow:0 24px 70px rgba(69,38,46,.14);"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="height:8px;background:linear-gradient(90deg,#6f3345,#b53c6c,#6f3345);font-size:0;line-height:0;">&nbsp;</td></tr><tr><td style="padding:43px 44px 39px;"><span style="display:inline-block;padding:8px 13px;border-radius:999px;background:linear-gradient(135deg,#f7dca8,#e8ba69);color:#684616;font-family:Arial,sans-serif;font-size:10px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;">✓ Paiement confirmé</span>
<h1 style="margin:20px 0 17px;font-family:Georgia,'Times New Roman',serif;font-size:43px;line-height:1.04;font-weight:500;letter-spacing:-.03em;color:#2c2023;">La chanson de <span style="color:#a23463;font-style:italic;">${recipient}</span> entre en création.</h1><p style="margin:0;font-family:Arial,sans-serif;font-size:17px;line-height:1.72;color:#675b5e;">Bonjour${customer ? ` ${customer}` : ""},</p><p style="margin:15px 0 0;font-family:Arial,sans-serif;font-size:17px;line-height:1.72;color:#675b5e;">Votre commande est bien enregistrée. Justine et l’équipe vont maintenant transformer vos souvenirs et vos mots en une chanson entièrement personnalisée.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:27px;border-radius:22px;background:linear-gradient(135deg,#8f3158,#5e273e);box-shadow:0 20px 44px rgba(92,35,58,.24);"><tr><td style="padding:23px 24px;color:#fff;font-family:Arial,sans-serif;"><div style="font-size:11px;font-weight:900;letter-spacing:.11em;text-transform:uppercase;color:#f1c98e;">${escapeHtml(params.orderName)}</div><div style="margin-top:11px;font-family:Georgia,'Times New Roman',serif;font-size:25px;">${escapeHtml(offer)}</div><div style="margin-top:9px;font-size:14px;color:#f5e7ec;">${escapeHtml(delivery)}</div><div style="margin-top:17px;padding-top:15px;border-top:1px solid rgba(255,255,255,.18);font-size:18px;font-weight:900;">Total payé : ${escapeHtml(amount)}</div></td></tr></table>
<p style="margin:26px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:23px;line-height:1.45;color:#3b2930;text-align:center;">Vous n’avez plus rien à faire. Nous vous écrirons dès que votre chanson sera prête.</p><p style="margin:28px 0 0;padding-top:22px;border-top:1px solid #e7dcd7;font-family:Arial,sans-serif;font-size:15px;line-height:1.68;color:#675b5e;"><strong style="color:#2c2023;">Justine</strong><br><span style="color:#9b6378;">Mon Histoire Chantée</span></p></td></tr></table></td></tr>
<tr><td align="center" style="padding:23px 22px 0;font-family:Arial,sans-serif;font-size:11px;line-height:1.6;color:#887a7e;">Une question ? Répondez directement à cet e-mail ou écrivez à <a href="mailto:contact@monhistoirechantee.com" style="color:#6f3345;text-decoration:underline;">contact@monhistoirechantee.com</a>.</td></tr></table></td></tr></table></body></html>`;
}

async function sendStripeOrderConfirmation(
  env: Env,
  order: Record<string, unknown>,
  answers: Answers,
  options: { recipientEmail?: string; isTest?: boolean } = {}
) {
  const email = options.recipientEmail || asString(order.email);
  if (!email) throw new Error("Adresse e-mail client manquante.");
  const recipientName = asString(answers.recipientName) || "votre proche";
  const customerFirstName = options.isTest ? "Test MHC" : firstName(asString(order.customer_name));
  const result = await env.EMAIL.send({
    // Send the recipient as a plain email string. Cloudflare officially supports
    // this format and it avoids runtime validation issues with dynamic display names.
    to: email,
    from: { email: "contact@monhistoirechantee.com", name: "Justine | Mon Histoire Chantée" },
    replyTo: { email: "contact@monhistoirechantee.com", name: "Justine" },
    subject: `${options.isTest ? "[TEST] " : ""}Votre commande pour ${recipientName} est confirmée ✨`,
    html: stripeOrderConfirmationHtml({
      customerFirstName,
      recipientName,
      offerName: offerNameForOrder(order),
      revisionLimit: revisionLimitForOrder(order),
      deliveryHours: deliveryHoursForOrder(order),
      amountCents: asInt(order.amount_cents),
      orderName: asString(order.order_name)
    }),
    text: `Bonjour${customerFirstName ? ` ${customerFirstName}` : ""},\n\nVotre paiement est confirmé. La chanson de ${recipientName} entre maintenant en création.\n\nFormule : ${offerNameForOrder(order)}\nLivraison : ${deliveryHoursForOrder(order) <= 24 ? "sous 24 h" : `sous ${Math.round(deliveryHoursForOrder(order) / 24)} jours`}\nTotal payé : ${(asInt(order.amount_cents) / 100).toFixed(2).replace(".", ",")} €\n\nNous vous écrirons dès qu’elle sera prête.\n\nJustine\nMon Histoire Chantée`
  });
  return result.messageId;
}

async function createOrUpdateStripeIntent(env: Env, request: Request, body: Record<string, unknown>, origin: string) {
  if (!stripeConfigured(env)) throw new Error("Ajoutez les clés Stripe dans Cloudflare.");
  const submissionId = asString(body.submissionId);
  const requestedOfferId = asString(body.offer);
  if (!submissionId || !requestedOfferId) throw new Error("Informations de commande incomplètes.");

  const offersConfig = await loadOffersConfig(env);
  const clientOfferConfigVersion = asInt(body.offerConfigVersion);
  if (clientOfferConfigVersion && clientOfferConfigVersion !== offersConfig.version) {
    throw new Error("Nos offres viennent d’être mises à jour. Rechargez cette page.");
  }
  const pricing = calculateConfiguredAmount(offersConfig, requestedOfferId, Boolean(body.express));
  const offer = pricing.offer.id;
  const express = pricing.express;
  const offerSnapshot = JSON.stringify(pricing.snapshot);

  const submission = await env.DB.prepare("SELECT email,answers,status FROM submissions WHERE id=?").bind(submissionId).first<Record<string, unknown>>();
  if (!submission) throw new Error("Votre création n’a pas été retrouvée. Rechargez la page.");
  const email = asString(submission.email) || asString(body.email);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Adresse e-mail invalide.");

  const answers = parseAnswers(submission.answers) || {};
  answers.offer = offer;
  answers.express = express;
  answers.email = email;

  const promo = calculatePromo(env, body.promoCode, pricing.amountCents);
  const amountCents = promo.amountCents;
  const recipientName = asString(answers.recipientName);
  const paymentInput = {
    amountCents,
    submissionId,
    offer,
    offerName: pricing.offer.name,
    offerConfigVersion: offersConfig.version,
    revisionLimit: pricing.offer.revisionLimit,
    deliveryHours: pricing.deliveryHours,
    express,
    email,
    recipientName,
    promoCode: promo.code,
    discountCents: promo.discountCents
  };

  let requestedId = asString(body.paymentIntentId);
  let existing: Record<string, unknown> | null = null;
  if (requestedId) {
    existing = await env.DB.prepare("SELECT * FROM stripe_payment_sessions WHERE payment_intent_id=? AND submission_id=?")
      .bind(requestedId, submissionId).first<Record<string, unknown>>();
  }
  if (!existing) {
    existing = await env.DB.prepare("SELECT * FROM stripe_payment_sessions WHERE submission_id=? AND status NOT IN ('succeeded','canceled') ORDER BY updated_at DESC LIMIT 1")
      .bind(submissionId).first<Record<string, unknown>>();
    requestedId = asString(existing?.payment_intent_id);
  }

  let intent: StripePaymentIntentObject;
  if (requestedId) {
    const current = await stripeRequest<StripePaymentIntentObject>(env, `/payment_intents/${encodeURIComponent(requestedId)}`);
    if (current.metadata?.submission_id !== submissionId || ["succeeded", "canceled", "processing", "requires_capture"].includes(current.status)) {
      intent = await stripeRequest<StripePaymentIntentObject>(env, "/payment_intents", "POST", stripePaymentParams(paymentInput));
    } else {
      intent = await stripeRequest<StripePaymentIntentObject>(env, `/payment_intents/${encodeURIComponent(requestedId)}`, "POST", stripePaymentParams(paymentInput, false));
    }
  } else {
    intent = await stripeRequest<StripePaymentIntentObject>(env, "/payment_intents", "POST", stripePaymentParams(paymentInput));
  }
  if (!intent.id || !intent.client_secret) throw new Error("Stripe n’a pas pu préparer le paiement.");

  const fbp = asString(body.fbp);
  const fbc = asString(body.fbc);
  const sourceUrl = asString(body.sourceUrl) || `${origin}/composer`;
  const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() || "";
  const userAgent = request.headers.get("User-Agent") || "";

  await env.DB.batch([
    env.DB.prepare(`INSERT INTO stripe_payment_sessions(
      payment_intent_id,submission_id,client_secret,amount_cents,currency,selected_offer,offer_name,offer_config_version,
      revision_limit,delivery_hours,offer_snapshot,express,email,status,fbp,fbc,client_ip,client_user_agent,event_source_url,updated_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(payment_intent_id) DO UPDATE SET
      client_secret=excluded.client_secret,amount_cents=excluded.amount_cents,currency=excluded.currency,
      selected_offer=excluded.selected_offer,offer_name=excluded.offer_name,offer_config_version=excluded.offer_config_version,
      revision_limit=excluded.revision_limit,delivery_hours=excluded.delivery_hours,offer_snapshot=excluded.offer_snapshot,
      express=excluded.express,email=excluded.email,status=excluded.status,
      fbp=COALESCE(NULLIF(excluded.fbp,''),stripe_payment_sessions.fbp),
      fbc=COALESCE(NULLIF(excluded.fbc,''),stripe_payment_sessions.fbc),
      client_ip=excluded.client_ip,client_user_agent=excluded.client_user_agent,event_source_url=excluded.event_source_url,
      updated_at=CURRENT_TIMESTAMP`)
      .bind(
        intent.id, submissionId, intent.client_secret, amountCents, "EUR", offer, pricing.offer.name, offersConfig.version,
        pricing.offer.revisionLimit, pricing.deliveryHours, offerSnapshot, express ? 1 : 0, email, intent.status,
        fbp || null, fbc || null, clientIp || null, userAgent || null, sourceUrl
      ),
    env.DB.prepare(`UPDATE submissions SET email=?,answers=?,selected_offer=?,offer_config_version=?,express=?,
      status=CASE WHEN status='paid' THEN status ELSE 'checkout_started' END,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
      .bind(email, JSON.stringify(answers), offer, offersConfig.version, express ? 1 : 0, submissionId)
  ]);

  await recordServerFunnelEvent(env, "InitiateCheckout", submissionId, {
    valueCents: amountCents,
    currency: "EUR",
    paymentProvider: "stripe",
    providerId: intent.id,
    offer,
    offerName: pricing.offer.name,
    offerConfigVersion: offersConfig.version,
    express,
    promoCode: promo.code || undefined,
    discountCents: promo.discountCents
  });
  return { intent, submissionId, email, answers, amountCents, sourceUrl, promo };
}

async function createStripeOrder(env: Env, intent: StripePaymentIntentObject) {
  const submissionId = asString(intent.metadata?.submission_id);
  const session = await env.DB.prepare("SELECT * FROM stripe_payment_sessions WHERE payment_intent_id=?")
    .bind(intent.id).first<Record<string, unknown>>();
  if (!submissionId || !session) throw new Error("Session Stripe inconnue.");

  const submission = await env.DB.prepare("SELECT email,answers FROM submissions WHERE id=?")
    .bind(submissionId).first<Record<string, unknown>>();
  if (!submission) throw new Error("Questionnaire client introuvable.");

  const answers = parseAnswers(submission.answers) || {};
  const email = asString(session.email) || asString(submission.email) || asString(intent.receipt_email);
  const customerName = firstName(asString(answers.customerName));
  const offer = asString(session.selected_offer) || asString(intent.metadata?.offer) || "essential";
  const offerName = asString(session.offer_name) || asString(intent.metadata?.offer_name) || offerNameForOrder({ selected_offer: offer });
  const rawOfferConfigVersion = session.offer_config_version ?? intent.metadata?.offer_config_version;
  const hasOfferSnapshot = rawOfferConfigVersion !== null
    && typeof rawOfferConfigVersion !== "undefined"
    && Number.isFinite(Number(rawOfferConfigVersion))
    && Number(rawOfferConfigVersion) > 0;
  const offerConfigVersion = hasOfferSnapshot ? Math.max(1, asInt(rawOfferConfigVersion, 1)) : 0;
  const rawRevisionLimit = session.revision_limit ?? intent.metadata?.revision_limit;
  const revisionLimit = hasOfferSnapshot
    ? (rawRevisionLimit === null || asString(rawRevisionLimit) === "-1" ? null : Math.max(0, asInt(rawRevisionLimit)))
    : (offer === "premium" ? null : offer === "discovery" ? 0 : 1);
  const deliveryHours = asInt(session.delivery_hours || intent.metadata?.delivery_hours, Boolean(session.express) ? 24 : 96);
  const offerSnapshot = asString(session.offer_snapshot) || JSON.stringify({
    id: offer,
    name: offerName,
    revisionLimit,
    deliveryHours,
    configVersion: offerConfigVersion
  });
  const express = Boolean(session.express) || asString(intent.metadata?.express) === "1";
  const amountCents = asInt(intent.amount_received || intent.amount || session.amount_cents);
  const createdAt = new Date().toISOString();
  const orderId = stableOrderId("stripe", intent.id);
  const orderName = `MHC-${intent.id.slice(-8).toUpperCase()}`;

  await env.DB.batch([
    env.DB.prepare(`INSERT INTO mhc_orders(
      id,submission_id,payment_provider,provider_order_id,provider_payment_id,order_name,email,customer_name,payment_status,
      amount_cents,currency,selected_offer,offer_name,offer_config_version,revision_limit,delivery_hours,offer_snapshot,
      express,provider_created_at,synced_at,updated_at
    ) VALUES(?,?,'stripe',?,?,?,?,?,'succeeded',?,'EUR',?,?,?,?,?,?,?, ?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT(payment_provider,provider_order_id) DO UPDATE SET
      submission_id=excluded.submission_id,provider_payment_id=excluded.provider_payment_id,order_name=excluded.order_name,
      email=excluded.email,customer_name=excluded.customer_name,payment_status='succeeded',amount_cents=excluded.amount_cents,
      currency='EUR',selected_offer=excluded.selected_offer,offer_name=excluded.offer_name,
      offer_config_version=excluded.offer_config_version,revision_limit=excluded.revision_limit,
      delivery_hours=excluded.delivery_hours,offer_snapshot=excluded.offer_snapshot,express=excluded.express,
      synced_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP`)
      .bind(
        orderId, submissionId, intent.id, intent.id, orderName, email || null, customerName || null,
        amountCents, offer, offerName, offerConfigVersion, revisionLimit, deliveryHours, offerSnapshot,
        express ? 1 : 0, createdAt
      ),
    env.DB.prepare("UPDATE submissions SET status='paid',selected_offer=?,offer_config_version=?,express=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
      .bind(offer, offerConfigVersion, express ? 1 : 0, submissionId),
    env.DB.prepare("UPDATE stripe_payment_sessions SET status='succeeded',amount_cents=?,updated_at=CURRENT_TIMESTAMP WHERE payment_intent_id=?")
      .bind(amountCents, intent.id)
  ]);

  await recordAnalyticsEvent(env, {
    eventId: `server:Purchase:stripe:${intent.id}`,
    eventName: "Purchase",
    submissionId,
    eventSource: "stripe_webhook",
    valueCents: amountCents,
    currency: "EUR",
    paymentProvider: "stripe",
    providerId: intent.id,
    metadata: {
      orderName,
      offer,
      offerName,
      offerConfigVersion,
      revisionLimit,
      deliveryHours,
      express,
      promoCode: asString(intent.metadata?.promo_code) || undefined,
      discountCents: asInt(intent.metadata?.discount_cents)
    },
    occurredAt: createdAt,
    ...await attributionForSubmission(env, submissionId)
  });

  const order = await env.DB.prepare("SELECT * FROM mhc_orders WHERE id=?").bind(orderId).first<Record<string, unknown>>();
  if (!order) throw new Error("Commande Stripe non créée.");
  return { order, answers, submissionId };
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] || "";
}

function deliveryEmailHtml(params: {
  customerFirstName: string;
  recipientName: string;
  deliveryUrl: string;
  isRevision?: boolean;
}) {
  const customer = escapeHtml(params.customerFirstName || "à vous");
  const recipient = escapeHtml(params.recipientName || "votre proche");
  const deliveryUrl = escapeHtml(params.deliveryUrl);
  const logo = "https://cdn.shopify.com/s/files/1/1094/5658/9138/files/Logov2-nobg_ea620d66-5432-4114-a214-109012b35880.png?v=1785951795";
  const badge = params.isRevision ? "✦ Nouvelle version prête" : "✦ Création terminée";
  const title = params.isRevision ? `Votre nouvelle version pour <span style="color:#a23463;font-style:italic;">${recipient}</span> est prête.` : `Votre chanson pour <span style="color:#a23463;font-style:italic;">${recipient}</span> est prête.`;
  const intro = params.isRevision
    ? "Nous avons pris en compte votre demande. La nouvelle version de votre chanson vous attend dans le même espace privé."
    : "Vos souvenirs, vos mots et tout ce que vous souhaitiez transmettre ont désormais une voix. Votre espace privé vous attend.";
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>Votre chanson est prête</title></head>
<body style="margin:0;padding:0;background:#fffaf6;color:#2c2023;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">La chanson de ${recipient} est prête. Découvrez-la dans votre espace privé.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:radial-gradient(circle at 88% 4%,rgba(181,60,108,.17),transparent 25%),linear-gradient(180deg,#fffaf7,#f8efec);"><tr><td align="center" style="padding:30px 12px 42px;">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:640px;max-width:100%;">
<tr><td align="center" style="padding:0 16px 22px;"><img src="${logo}" width="220" alt="Mon Histoire Chantée" style="display:block;width:220px;max-width:72%;height:auto;border:0;"></td></tr>
<tr><td style="overflow:hidden;border:1px solid rgba(111,51,69,.13);border-radius:32px;background:radial-gradient(circle at 88% 8%,rgba(240,217,217,.85),transparent 26%),linear-gradient(145deg,#fff,#fff8fa);box-shadow:0 24px 70px rgba(69,38,46,.14);">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="height:8px;background:linear-gradient(90deg,#6f3345,#b53c6c,#6f3345);font-size:0;line-height:0;">&nbsp;</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:43px 44px 39px;">
<span style="display:inline-block;padding:8px 13px;border-radius:999px;background:linear-gradient(135deg,#f7dca8,#e8ba69);color:#684616;font-family:Arial,sans-serif;font-size:10px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;">${badge}</span>
<h1 style="margin:20px 0 17px;font-family:Georgia,'Times New Roman',serif;font-size:43px;line-height:1.04;font-weight:500;letter-spacing:-.03em;color:#2c2023;">${title}</h1>
<p style="margin:0;font-family:Arial,sans-serif;font-size:17px;line-height:1.72;color:#675b5e;">Bonjour ${customer},</p>
<p style="margin:15px 0 0;font-family:Arial,sans-serif;font-size:17px;line-height:1.72;color:#675b5e;">${intro}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:27px;border-radius:24px;background:linear-gradient(135deg,#8f3158,#5e273e);box-shadow:0 20px 44px rgba(92,35,58,.24);"><tr><td style="padding:23px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="54"><div style="width:54px;height:54px;border-radius:18px;background:#fff;color:#8f3158;font-family:Arial,sans-serif;font-size:22px;line-height:54px;text-align:center;font-weight:900;">♪</div></td><td style="padding-left:15px;"><div style="font-family:Arial,sans-serif;font-size:10px;font-weight:900;letter-spacing:.11em;text-transform:uppercase;color:#f1c98e;">Votre création originale</div><div style="margin-top:5px;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.2;color:#fff;">Une histoire que vous seuls reconnaîtrez</div></td></tr></table>
</td></tr></table>
<p style="margin:26px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:23px;line-height:1.45;color:#3b2930;text-align:center;">Choisissez un moment calme, montez le son et laissez la surprise opérer.</p>
<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin-top:23px;"><tr><td align="center" style="border-radius:999px;background:linear-gradient(110deg,#762d4e,#b53c6c 52%,#8b3157);box-shadow:0 17px 36px rgba(133,42,80,.31);"><a href="${deliveryUrl}" style="display:inline-block;padding:19px 35px;border-radius:999px;font-family:Arial,sans-serif;font-size:17px;line-height:1;font-weight:900;color:#fff;text-decoration:none;">Découvrir ma chanson&nbsp;&nbsp;▶</a></td></tr></table>
<div style="margin-top:13px;font-family:Arial,sans-serif;font-size:11px;line-height:1.5;text-align:center;color:#7f7075;">Écoute privée · Téléchargement MP3 · Demande de révision intégrée</div>
<p style="margin:28px 0 0;padding-top:22px;border-top:1px solid #e7dcd7;font-family:Arial,sans-serif;font-size:15px;line-height:1.68;color:#675b5e;">Nous espérons que cette chanson fera vivre un moment inoubliable.<br><br><strong style="color:#2c2023;">Justine</strong><br><span style="color:#9b6378;">Mon Histoire Chantée</span></p>
</td></tr></table></td></tr>
<tr><td align="center" style="padding:23px 22px 0;font-family:Arial,sans-serif;font-size:11px;line-height:1.6;color:#887a7e;">Une question ? Répondez directement à cet e-mail ou écrivez à <a href="mailto:contact@monhistoirechantee.com" style="color:#6f3345;text-decoration:underline;">contact@monhistoirechantee.com</a>.</td></tr>
</table></td></tr></table></body></html>`;
}

function deliveryEmailText(params: { customerFirstName: string; recipientName: string; deliveryUrl: string; isRevision?: boolean }) {
  return [
    `Bonjour${params.customerFirstName ? ` ${params.customerFirstName}` : ""},`,
    "",
    params.isRevision
      ? `Votre nouvelle version pour ${params.recipientName || "votre proche"} est prête.`
      : `Votre chanson personnalisée pour ${params.recipientName || "votre proche"} est prête.`,
    "",
    "Écoutez-la et téléchargez-la depuis votre espace privé :",
    params.deliveryUrl,
    "",
    "Nous espérons qu’elle fera vivre un moment inoubliable.",
    "",
    "Justine",
    "Mon Histoire Chantée"
  ].join("\n");
}


async function getOrderWithAnswers(env: Env, orderId: string) {
  return env.DB.prepare("SELECT o.*, s.answers FROM mhc_orders o LEFT JOIN submissions s ON s.id=o.submission_id WHERE o.id=?")
    .bind(orderId).first<Record<string, unknown>>();
}

async function sendDelivery(env: Env, order: Record<string, unknown>, origin: string, to: string, isTest: boolean) {
  const token = asString(order.delivery_token);
  if (!token || !asString(order.delivery_file_key)) throw new Error("Ajoutez d’abord la chanson finale.");
  const answers = parseAnswers(order.answers) || {};
  const recipientName = asString(answers.recipientName) || "votre proche";
  const customerFirstName = firstName(asString(order.customer_name));
  const isRevision = asInt(order.delivery_email_count) > 0 || asString(order.production_status) === "revision_requested";
  const deliveryUrl = `${origin}/chanson/${encodeURIComponent(token)}`;
  const result = await env.EMAIL.send({
    // Keep recipient payload minimal and valid for every order, including legacy rows.
    to,
    from: { email: "contact@monhistoirechantee.com", name: "Justine | Mon Histoire Chantée" },
    replyTo: { email: "contact@monhistoirechantee.com", name: "Justine" },
    subject: isRevision ? `Votre nouvelle version pour ${recipientName} est prête ✨` : `Votre chanson pour ${recipientName} est prête ✨`,
    html: deliveryEmailHtml({ customerFirstName, recipientName, deliveryUrl, isRevision }),
    text: deliveryEmailText({ customerFirstName, recipientName, deliveryUrl, isRevision })
  });
  return result.messageId;
}

function periodStart(days: string) {
  if (days === "all") return "1970-01-01T00:00:00.000Z";
  const allowed = new Set(["7", "30", "90"]);
  const count = allowed.has(days) ? Number(days) : 30;
  return new Date(Date.now() - count * 86400000).toISOString();
}

async function analyticsSummary(env: Env, days: string) {
  const start = periodStart(days);
  const events = await env.DB.prepare("SELECT * FROM analytics_events WHERE occurred_at>=? ORDER BY occurred_at ASC").bind(start).all<Record<string, unknown>>();
  const submissions = await env.DB.prepare("SELECT id, email, status, created_at, updated_at FROM submissions WHERE created_at>=? OR updated_at>=?").bind(start, start).all<Record<string, unknown>>();
  const orders = await env.DB.prepare("SELECT * FROM mhc_orders WHERE provider_created_at>=? AND payment_status IN ('paid','partially_paid','authorized','succeeded')").bind(start).all<Record<string, unknown>>();

  const sets: Record<AnalyticsEventName, Set<string>> = {
    LandingPageView: new Set(), MHCFormStarted: new Set(), Lead: new Set(), AddToCart: new Set(), InitiateCheckout: new Set(), Purchase: new Set()
  };
  for (const row of events.results || []) {
    const name = asString(row.event_name) as AnalyticsEventName;
    if (!sets[name]) continue;
    sets[name].add(asString(row.submission_id) || asString(row.session_id) || asString(row.event_id));
  }
  for (const row of submissions.results || []) {
    const id = asString(row.id);
    if (!id) continue;
    sets.MHCFormStarted.add(id);
    const status = asString(row.status);
    if (asString(row.email) && ["form_completed", "checkout_started", "paid"].includes(status)) sets.Lead.add(id);
    if (["checkout_started", "paid"].includes(status)) sets.InitiateCheckout.add(id);
  }
  let revenueCents = 0;
  for (const row of orders.results || []) {
    const id = asString(row.id);
    sets.Purchase.add(asString(row.submission_id) || id);
    revenueCents += asInt(row.amount_cents);
  }

  const labels: Array<[AnalyticsEventName, string]> = [
    ["LandingPageView", "Vues de page"], ["MHCFormStarted", "Formulaires démarrés"], ["Lead", "Prospects"],
    ["InitiateCheckout", "Paiements affichés"], ["Purchase", "Achats"]
  ];
  const funnel = labels.map(([key, label]) => ({ key, label, count: sets[key].size }));

  const dailyMap = new Map<string, number>();
  for (const row of events.results || []) {
    const date = asString(row.occurred_at).slice(0, 10);
    if (date) dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
  }
  const daily = Array.from(dailyMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count, eventName: "Tous" }));

  const campaignMap = new Map<string, { campaign: string; source: string; views: Set<string>; starts: Set<string>; leads: Set<string>; checkouts: Set<string>; purchases: Set<string> }>();
  for (const row of events.results || []) {
    const campaign = asString(row.utm_campaign) || "Sans UTM";
    const source = asString(row.utm_source) || "direct";
    const key = `${campaign}::${source}`;
    const current = campaignMap.get(key) || { campaign, source, views: new Set(), starts: new Set(), leads: new Set(), checkouts: new Set(), purchases: new Set() };
    const identity = asString(row.submission_id) || asString(row.session_id) || asString(row.event_id);
    const eventName = asString(row.event_name);
    if (eventName === "LandingPageView") current.views.add(identity);
    if (eventName === "MHCFormStarted") current.starts.add(identity);
    if (eventName === "Lead") current.leads.add(identity);
    if (eventName === "InitiateCheckout") current.checkouts.add(identity);
    if (eventName === "Purchase") current.purchases.add(identity);
    campaignMap.set(key, current);
  }
  const campaigns = Array.from(campaignMap.values()).map(item => ({ campaign: item.campaign, source: item.source, views: item.views.size, starts: item.starts.size, leads: item.leads.size, checkouts: item.checkouts.size, purchases: item.purchases.size })).sort((a, b) => b.views - a.views).slice(0, 12);

  return {
    funnel,
    revenueCents,
    paidOrders: orders.results?.length || 0,
    averageOrderCents: orders.results?.length ? Math.round(revenueCents / orders.results.length) : 0,
    daily,
    campaigns,
    note: "Les données historiques de formulaires et commandes sont reconstruites depuis D1. Les vues de page et l’attribution détaillée commencent au déploiement de cette version."
  };
}

async function handleApi(request: Request, env: Env, url: URL, ctx: ExecutionContext) {
  await ensureSchema(env);

  if (url.pathname === "/api/offers" && request.method === "GET") {
    return json({ config: await loadOffersConfig(env) });
  }

  if (url.pathname === "/api/stripe/webhook" && request.method === "POST") {
    if (!env.STRIPE_WEBHOOK_SECRET) return json({ error: "Webhook Stripe non configuré." }, 503);
    const payload = await request.text();
    const signature = request.headers.get("Stripe-Signature") || "";
    if (!await verifyStripeSignature(payload, signature, env.STRIPE_WEBHOOK_SECRET)) return json({ error: "Signature Stripe invalide." }, 400);
    let event: StripeWebhookEvent;
    try { event = JSON.parse(payload) as StripeWebhookEvent; }
    catch { return json({ error: "Payload Stripe invalide." }, 400); }
    if (!event.id || !event.type) return json({ error: "Événement Stripe incomplet." }, 400);
    const existing = await env.DB.prepare("SELECT status FROM stripe_webhook_events WHERE event_id=?").bind(event.id).first<{ status: string }>();
    if (existing?.status === "processed") return json({ received: true, duplicate: true });
    await env.DB.prepare("INSERT INTO stripe_webhook_events(event_id,status,error,updated_at) VALUES(?,'processing',NULL,CURRENT_TIMESTAMP) ON CONFLICT(event_id) DO UPDATE SET status='processing',error=NULL,updated_at=CURRENT_TIMESTAMP").bind(event.id).run();
    try {
      const intent = event.data?.object;
      if (intent?.id && event.type === "payment_intent.succeeded") {
        const result = await createStripeOrder(env, intent);
        await runIntegrationOnce(
          env,
          `${result.submissionId}:stripe_confirmation:${intent.id}`,
          result.submissionId,
          "cloudflare_email",
          "Stripe Order Confirmation",
          async () => { await sendStripeOrderConfirmation(env, result.order, result.answers); }
        );
        const secondaryResults = await Promise.allSettled([
          trackOrderPaid(env, result.order, result.answers),
          sendMetaPurchase(env, result.order)
        ]);
        secondaryResults.forEach((secondaryResult, index) => {
          if (secondaryResult.status === "rejected") {
            console.error(index === 0 ? "Klaviyo order event failed" : "Meta Purchase failed", secondaryResult.reason);
          }
        });
      } else if (intent?.id && event.type === "payment_intent.payment_failed") {
        await env.DB.prepare("UPDATE stripe_payment_sessions SET status='payment_failed',updated_at=CURRENT_TIMESTAMP WHERE payment_intent_id=?").bind(intent.id).run();
      }
      await env.DB.prepare("UPDATE stripe_webhook_events SET status='processed',error=NULL,updated_at=CURRENT_TIMESTAMP WHERE event_id=?").bind(event.id).run();
      return json({ received: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur Stripe inconnue";
      await env.DB.prepare("UPDATE stripe_webhook_events SET status='failed',error=?,updated_at=CURRENT_TIMESTAMP WHERE event_id=?").bind(message.slice(0, 1200), event.id).run();
      console.error("Stripe webhook failed", event.id, message);
      return json({ error: "Traitement du webhook impossible." }, 500);
    }
  }


  if (url.pathname === "/api/promo/validate" && request.method === "POST") {
    try {
      const body = await request.json() as Record<string, unknown>;
      const offer = asString(body.offer);
      const config = await loadOffersConfig(env);
      const pricing = calculateConfiguredAmount(config, offer, Boolean(body.express));
      const promo = calculatePromo(env, body.code, pricing.amountCents);
      if (!promo.code) return json({ error: "Saisissez un code promo." }, 400);
      return json({ valid: true, ...promo });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Ce code promo n’est pas valide." }, 400);
    }
  }

  if (url.pathname === "/api/stripe/payment-intent" && request.method === "POST") {
    try {
      const body = await request.json() as Record<string, unknown>;
      const result = await createOrUpdateStripeIntent(env, request, body, url.origin);
      const backgroundTasks: Promise<unknown>[] = [];
      if (asString(result.email)) backgroundTasks.push(trackCheckoutStarted(env, result.submissionId, result.email, Boolean(result.answers.consent), result.answers, `${url.origin}/composer`, result.amountCents).catch(error => console.error("Stripe checkout Klaviyo failed", error)));
      backgroundTasks.push(sendMetaInitiateCheckout(env, {
        submissionId: result.submissionId,
        paymentIntentId: result.intent.id,
        email: result.email,
        amountCents: result.amountCents,
        offer: asString(result.answers.offer),
        express: Boolean(result.answers.express)
      }).catch(error => console.error("Meta InitiateCheckout CAPI failed", error)));
      ctx.waitUntil(Promise.all(backgroundTasks));
      return json({
        clientSecret: result.intent.client_secret,
        publishableKey: env.STRIPE_PUBLISHABLE_KEY,
        paymentIntentId: result.intent.id,
        amountCents: result.amountCents,
        testMode: Boolean(env.STRIPE_PUBLISHABLE_KEY?.startsWith("pk_test_")),
        promoCode: result.promo.code || "",
        promoPercent: result.promo.percent,
        discountCents: result.promo.discountCents
      });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Paiement Stripe indisponible." }, 502);
    }
  }

  if (url.pathname === "/api/stripe/payment-status" && request.method === "GET") {
    const paymentIntentId = url.searchParams.get("paymentIntentId") || "";
    const submissionId = url.searchParams.get("submissionId") || "";
    if (!paymentIntentId || !submissionId) return json({ error: "Paiement incomplet." }, 400);
    const session = await env.DB.prepare("SELECT payment_intent_id FROM stripe_payment_sessions WHERE payment_intent_id=? AND submission_id=?").bind(paymentIntentId, submissionId).first<{ payment_intent_id: string }>();
    if (!session) return json({ error: "Paiement introuvable." }, 404);
    try {
      const intent = await stripeRequest<StripePaymentIntentObject>(env, `/payment_intents/${encodeURIComponent(paymentIntentId)}`);
      await env.DB.prepare("UPDATE stripe_payment_sessions SET status=?,updated_at=CURRENT_TIMESTAMP WHERE payment_intent_id=?").bind(intent.status, paymentIntentId).run();
      return json({ paymentIntentId: intent.id, status: intent.status });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Vérification Stripe impossible." }, 502);
    }
  }


  if (url.pathname === "/api/admin/verify" && request.method === "GET") {
    return isAdmin(request, env) ? json({ ok: true }) : json({ error: "Accès refusé" }, 401);
  }

  if (url.pathname === "/api/admin/offers" && request.method === "GET") {
    if (!isAdmin(request, env)) return json({ error: "Accès refusé" }, 401);
    return json({ config: await loadOffersConfig(env) });
  }

  if (url.pathname === "/api/admin/offers" && request.method === "PUT") {
    if (!isAdmin(request, env)) return json({ error: "Accès refusé" }, 401);
    try {
      const body = await request.json() as { config?: unknown };
      if (!body.config) return json({ error: "Configuration manquante." }, 400);
      const current = await loadOffersConfig(env);
      const config = validateOffersConfig(body.config, current.version + 1);
      await env.DB.prepare("INSERT INTO settings(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP")
        .bind("offers_config", JSON.stringify(config)).run();
      return json({ ok: true, config });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Configuration invalide." }, 400);
    }
  }

  if (url.pathname === "/api/analytics/events" && request.method === "POST") {
    const body = await request.json() as Record<string, unknown>;
    const eventName = asString(body.eventName) as AnalyticsEventName;
    const eventId = asString(body.eventId);
    if (!eventId || !eventName) return json({ error: "Événement incomplet" }, 400);
    await recordAnalyticsEvent(env, {
      eventId, eventName, sessionId: asString(body.sessionId), submissionId: asString(body.submissionId), eventSource: "browser",
      path: asString(body.path), referrer: asString(body.referrer), utmSource: asString(body.utm_source), utmMedium: asString(body.utm_medium),
      utmCampaign: asString(body.utm_campaign), utmContent: asString(body.utm_content), utmTerm: asString(body.utm_term),
      campaignId: asString(body.campaign_id), adsetId: asString(body.adset_id), adId: asString(body.ad_id),
      valueCents: asInt(body.valueCents), currency: asString(body.currency), paymentProvider: asString(body.paymentProvider),
      providerId: asString(body.providerId), metadata: body.metadata
    });
    return json({ ok: true });
  }

  if (url.pathname === "/api/admin/analytics" && request.method === "GET") {
    if (!isAdmin(request, env)) return json({ error: "Accès refusé" }, 401);
    return json(await analyticsSummary(env, url.searchParams.get("days") || "30"));
  }

  if (url.pathname === "/api/admin/prospects" && request.method === "GET") {
    if (!isAdmin(request, env)) return json({ error: "Accès refusé" }, 401);
    const scope = url.searchParams.get("scope") || "active";
    const rows = await env.DB.prepare(`SELECT s.id AS submission_id, s.email, s.answers, s.selected_offer, s.offer_config_version, s.express, s.status AS submission_status,
      s.created_at, s.updated_at, p.status AS preview_status, p.excerpt_file_name, p.preview_token, p.preview_email_sent_at,
      p.preview_email_count, p.preview_viewed_at,
      (SELECT id FROM mhc_orders o WHERE o.submission_id=s.id AND o.payment_status IN ('paid','partially_paid','authorized','succeeded') LIMIT 1) AS order_id
      FROM submissions s LEFT JOIN prospect_previews p ON p.submission_id=s.id
      WHERE s.email IS NOT NULL AND s.email<>'' AND s.status IN ('form_completed','checkout_started','paid')
      ${scope === "active" ? "AND NOT EXISTS(SELECT 1 FROM mhc_orders o WHERE o.submission_id=s.id AND o.payment_status IN ('paid','partially_paid','authorized','succeeded'))" : ""}
      ORDER BY s.updated_at DESC`).all<Record<string, unknown>>();
    return json({ prospects: (rows.results || []).map(row => {
      if (asString(row.order_id)) row.preview_status = "converted";
      return serializeProspect(row);
    }) });
  }

  if (url.pathname === "/api/admin/prospect-status" && request.method === "PUT") {
    if (!isAdmin(request, env)) return json({ error: "Accès refusé" }, 401);
    const id = url.searchParams.get("id") || "";
    const body = await request.json() as { status?: string };
    const allowed = new Set(["to_create", "in_production", "ready", "sent", "converted"]);
    if (!id || !allowed.has(body.status || "")) return json({ error: "Statut invalide" }, 400);
    await env.DB.prepare("INSERT INTO prospect_previews(submission_id,status,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(submission_id) DO UPDATE SET status=excluded.status,updated_at=CURRENT_TIMESTAMP").bind(id, body.status).run();
    return json({ ok: true });
  }

  if (url.pathname === "/api/admin/prospect-excerpt" && request.method === "POST") {
    if (!isAdmin(request, env)) return json({ error: "Accès refusé" }, 401);
    const id = url.searchParams.get("id") || "";
    const submission = await env.DB.prepare("SELECT id FROM submissions WHERE id=? AND email IS NOT NULL").bind(id).first<{ id: string }>();
    if (!submission) return json({ error: "Prospect introuvable" }, 404);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "Fichier manquant" }, 400);
    if (file.size > 30 * 1024 * 1024) return json({ error: "Extrait trop volumineux (30 Mo max)" }, 413);
    const previous = await env.DB.prepare("SELECT excerpt_file_key, preview_token FROM prospect_previews WHERE submission_id=?").bind(id).first<{ excerpt_file_key?: string; preview_token?: string }>();
    const key = safeExcerptKey(id, file.name);
    await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type || "audio/mpeg" } });
    if (previous?.excerpt_file_key) ctx.waitUntil(env.MEDIA.delete(previous.excerpt_file_key));
    const token = previous?.preview_token || crypto.randomUUID().replace(/-/g, "");
    await env.DB.prepare(`INSERT INTO prospect_previews(submission_id,status,excerpt_file_key,excerpt_file_name,preview_token,updated_at)
      VALUES(?,'ready',?,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(submission_id) DO UPDATE SET status='ready',excerpt_file_key=excluded.excerpt_file_key,excerpt_file_name=excluded.excerpt_file_name,preview_token=excluded.preview_token,updated_at=CURRENT_TIMESTAMP`)
      .bind(id, key, file.name, token).run();
    return json({ ok: true, previewUrl: `/extrait/${token}` });
  }

  if (url.pathname === "/api/admin/prospect-preview-email" && request.method === "POST") {
    if (!isAdmin(request, env)) return json({ error: "Accès refusé" }, 401);
    const id = url.searchParams.get("id") || "";
    const row = await env.DB.prepare(`SELECT s.email,s.answers,p.preview_token,p.excerpt_file_key,p.preview_email_count
      FROM submissions s JOIN prospect_previews p ON p.submission_id=s.id WHERE s.id=?`).bind(id).first<Record<string, unknown>>();
    if (!row || !asString(row.preview_token) || !asString(row.excerpt_file_key)) return json({ error: "Ajoutez et prévisualisez d’abord l’extrait." }, 409);
    if (!env.KLAVIYO_PRIVATE_API_KEY) return json({ error: "La clé privée Klaviyo n’est pas configurée." }, 503);
    const previewUrl = `${url.origin}/extrait/${encodeURIComponent(asString(row.preview_token))}`;
    const resumeUrl = `${url.origin}/composer?resume=${encodeURIComponent(asString(row.preview_token))}`;
    const answers = parseAnswers(row.answers) || {};
    await trackPreviewReady(env, id, asString(row.email), answers, previewUrl, resumeUrl, asInt(row.preview_email_count));
    await env.DB.prepare("UPDATE prospect_previews SET status='sent',preview_email_sent_at=CURRENT_TIMESTAMP,preview_email_count=preview_email_count+1,updated_at=CURRENT_TIMESTAMP WHERE submission_id=?").bind(id).run();
    return json({ ok: true });
  }

  if (url.pathname === "/api/admin/orders" && request.method === "GET") {
    if (!isAdmin(request, env)) return json({ error: "Accès refusé" }, 401);
    const rows = await env.DB.prepare("SELECT o.*,s.answers FROM mhc_orders o LEFT JOIN submissions s ON s.id=o.submission_id ORDER BY o.provider_created_at DESC").all<Record<string, unknown>>();
    const revisions = await env.DB.prepare("SELECT * FROM mhc_revisions ORDER BY created_at ASC").all<RevisionRow>();
    const byOrder = new Map<string, RevisionRow[]>();
    for (const revision of revisions.results || []) byOrder.set(revision.order_id, [...(byOrder.get(revision.order_id) || []), revision]);
    return json({ orders: (rows.results || []).map(row => serializeOrder(row, byOrder.get(asString(row.id)) || [])) });
  }

  if (url.pathname === "/api/admin/orders/sync" && request.method === "POST") {
    if (!isAdmin(request, env)) return json({ error: "Accès refusé" }, 401);
    try { return json({ ok: true, imported: await syncShopifyOrders(env) }); }
    catch (error) { return json({ error: error instanceof Error ? error.message : "Synchronisation impossible" }, 502); }
  }

  if (url.pathname === "/api/admin/order-status" && request.method === "PUT") {
    if (!isAdmin(request, env)) return json({ error: "Accès refusé" }, 401);
    const id = url.searchParams.get("id") || "";
    const body = await request.json() as { status?: string };
    const allowed = new Set(["to_create", "in_production", "ready", "delivered", "revision_requested"]);
    if (!id || !allowed.has(body.status || "")) return json({ error: "Statut invalide" }, 400);
    await env.DB.prepare("UPDATE mhc_orders SET production_status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(body.status, id).run();
    return json({ ok: true });
  }

  if (url.pathname === "/api/admin/order-audio" && request.method === "POST") {
    if (!isAdmin(request, env)) return json({ error: "Accès refusé" }, 401);
    const id = url.searchParams.get("id") || "";
    const order = await env.DB.prepare("SELECT order_name,delivery_file_key,delivery_token FROM mhc_orders WHERE id=?").bind(id).first<Record<string, unknown>>();
    if (!order) return json({ error: "Commande introuvable" }, 404);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "Fichier manquant" }, 400);
    if (file.size > 60 * 1024 * 1024) return json({ error: "Fichier trop volumineux (60 Mo max)" }, 413);
    const key = safeDeliveryKey(asString(order.order_name), file.name);
    await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type || "audio/mpeg" } });
    if (asString(order.delivery_file_key)) ctx.waitUntil(env.MEDIA.delete(asString(order.delivery_file_key)));
    const token = asString(order.delivery_token) || crypto.randomUUID().replace(/-/g, "");
    await env.DB.prepare("UPDATE mhc_orders SET delivery_file_key=?,delivery_file_name=?,delivery_token=?,production_status='ready',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(key, file.name, token, id).run();
    return json({ ok: true, deliveryUrl: `/chanson/${token}` });
  }

  if (url.pathname === "/api/admin/revision-status" && request.method === "PUT") {
    if (!isAdmin(request, env)) return json({ error: "Accès refusé" }, 401);
    const id = url.searchParams.get("id") || "";
    const body = await request.json() as { status?: string };
    const allowed = new Set(["new", "in_progress", "version_ready", "completed"]);
    if (!id || !allowed.has(body.status || "")) return json({ error: "Statut invalide" }, 400);
    await env.DB.prepare("UPDATE mhc_revisions SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(body.status, id).run();
    if (body.status === "completed") {
      const revision = await env.DB.prepare("SELECT order_id FROM mhc_revisions WHERE id=?").bind(id).first<{ order_id: string }>();
      if (revision) await env.DB.prepare("UPDATE mhc_orders SET production_status='delivered',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(revision.order_id).run();
    }
    return json({ ok: true });
  }

  if ((url.pathname === "/api/admin/order-confirmation-email-test" || url.pathname === "/api/admin/order-confirmation-email") && request.method === "POST") {
    if (!isAdmin(request, env)) return json({ error: "Accès refusé" }, 401);
    const id = url.searchParams.get("id") || "";
    const isTest = url.pathname.endsWith("-test");
    const order = await env.DB.prepare(`SELECT o.*, s.answers FROM mhc_orders o LEFT JOIN submissions s ON s.id=o.submission_id WHERE o.id=?`).bind(id).first<Record<string, unknown>>();
    if (!order) return json({ error: "Commande introuvable." }, 404);
    if (asString(order.payment_provider) !== "stripe") return json({ error: "Cette confirmation est réservée aux commandes Stripe." }, 400);
    const answers = parseAnswers(order.answers) || {};
    const recipientEmail = isTest ? "monhistoirechantee@gmail.com" : asString(order.email);
    if (!recipientEmail) return json({ error: "Adresse e-mail client manquante." }, 400);
    try {
      const messageId = await sendStripeOrderConfirmation(env, order, answers, { recipientEmail, isTest });
      return json({ ok: true, messageId, recipientEmail });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Envoi impossible." }, 502);
    }
  }

  if ((url.pathname === "/api/admin/order-delivery-email-test" || url.pathname === "/api/admin/order-delivery-email") && request.method === "POST") {
    if (!isAdmin(request, env)) return json({ error: "Accès refusé" }, 401);
    const id = url.searchParams.get("id") || "";
    const order = await getOrderWithAnswers(env, id);
    if (!order) return json({ error: "Commande introuvable" }, 404);
    const isTest = url.pathname.endsWith("-test");
    const recipient = isTest ? "monhistoirechantee@gmail.com" : asString(order.email);
    if (!recipient) return json({ error: "Adresse e-mail client manquante" }, 409);
    try {
      const messageId = await sendDelivery(env, order, url.origin, recipient, isTest);
      if (!isTest) await env.DB.prepare("UPDATE mhc_orders SET production_status='delivered',delivered_at=COALESCE(delivered_at,CURRENT_TIMESTAMP),delivery_email_sent_at=CURRENT_TIMESTAMP,delivery_email_message_id=?,delivery_email_count=delivery_email_count+1,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(messageId, id).run();
      return json({ ok: true, messageId });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Envoi impossible" }, 502);
    }
  }

  if (url.pathname.startsWith("/api/preview/") && request.method === "GET") {
    const token = decodeURIComponent(url.pathname.slice("/api/preview/".length));
    const row = await env.DB.prepare(`SELECT s.id,s.email,s.answers,s.created_at,p.excerpt_file_key,p.preview_token
      FROM prospect_previews p JOIN submissions s ON s.id=p.submission_id WHERE p.preview_token=?`).bind(token).first<Record<string, unknown>>();
    if (!row || !asString(row.excerpt_file_key)) return json({ error: "Extrait introuvable" }, 404);
    if (url.searchParams.get("preview") !== "1") await env.DB.prepare("UPDATE prospect_previews SET preview_viewed_at=COALESCE(preview_viewed_at,CURRENT_TIMESTAMP),updated_at=CURRENT_TIMESTAMP WHERE preview_token=?").bind(token).run();
    const answers = parseAnswers(row.answers) || {};
    return json({
      recipientName: asString(answers.recipientName) || "votre proche",
      customerFirstName: firstName(asString(answers.customerName)),
      audioUrl: `/api/preview-audio/${encodeURIComponent(token)}`,
      resumeUrl: `/composer?resume=${encodeURIComponent(token)}`,
      createdAt: asString(row.created_at)
    });
  }

  if (url.pathname.startsWith("/api/preview-audio/") && request.method === "GET") {
    const token = decodeURIComponent(url.pathname.slice("/api/preview-audio/".length));
    const row = await env.DB.prepare("SELECT excerpt_file_key,excerpt_file_name FROM prospect_previews WHERE preview_token=?").bind(token).first<Record<string, unknown>>();
    if (!row || !asString(row.excerpt_file_key)) return new Response("Fichier introuvable", { status: 404 });
    const object = await env.MEDIA.get(asString(row.excerpt_file_key));
    if (!object) return new Response("Fichier introuvable", { status: 404 });
    const headers = new Headers(); object.writeHttpMetadata(headers); headers.set("Cache-Control", "private, no-store"); headers.set("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(asString(row.excerpt_file_name) || "extrait.mp3")}`);
    return new Response(object.body, { headers });
  }

  if (url.pathname.startsWith("/api/resume/") && request.method === "GET") {
    const token = decodeURIComponent(url.pathname.slice("/api/resume/".length));
    const row = await env.DB.prepare("SELECT s.id,s.answers FROM prospect_previews p JOIN submissions s ON s.id=p.submission_id WHERE p.preview_token=?").bind(token).first<Record<string, unknown>>();
    if (!row) return json({ error: "Création introuvable" }, 404);
    return json({ submissionId: asString(row.id), answers: parseAnswers(row.answers) || {} });
  }

  if (url.pathname.startsWith("/api/delivery/") && request.method === "GET") {
    const token = decodeURIComponent(url.pathname.slice("/api/delivery/".length));
    const row = await env.DB.prepare("SELECT o.*,s.answers FROM mhc_orders o LEFT JOIN submissions s ON s.id=o.submission_id WHERE o.delivery_token=?").bind(token).first<Record<string, unknown>>();
    if (!row || !asString(row.delivery_file_key)) return json({ error: "Commande introuvable" }, 404);
    const preview = url.searchParams.get("preview") === "1";
    if (!preview) await env.DB.prepare("UPDATE mhc_orders SET delivery_viewed_at=COALESCE(delivery_viewed_at,CURRENT_TIMESTAMP),updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(asString(row.id)).run();
    const revisions = await env.DB.prepare(`SELECT COUNT(*) AS count,
      SUM(CASE WHEN status IN ('new','in_progress','version_ready') THEN 1 ELSE 0 END) AS open_count
      FROM mhc_revisions WHERE order_id=?`).bind(asString(row.id)).first<{ count: number; open_count: number }>();
    const answers = parseAnswers(row.answers) || {};
    const offer = asString(row.selected_offer) || "essential";
    const revisionCount = Number(revisions?.count || 0);
    const openRevisionCount = Number(revisions?.open_count || 0);
    const revisionLimit = revisionLimitForOrder(row);
    const canRequestRevision = (revisionLimit === null || revisionCount < revisionLimit) && openRevisionCount === 0;
    return json({
      orderName: asString(row.order_name),
      customerFirstName: firstName(asString(row.customer_name)),
      recipientName: asString(answers.recipientName) || "votre proche",
      offer,
      offerName: offerNameForOrder(row),
      audioUrl: `/api/delivery-audio/${encodeURIComponent(token)}`,
      downloadUrl: `/api/delivery-download/${encodeURIComponent(token)}${preview ? "?preview=1" : ""}`,
      revisionCount,
      revisionLimit,
      revisionPending: openRevisionCount > 0,
      canRequestRevision,
      deliveredAt: asString(row.delivered_at)
    });
  }

  if (url.pathname.startsWith("/api/delivery-audio/") && request.method === "GET") {
    const token = decodeURIComponent(url.pathname.slice("/api/delivery-audio/".length));
    const row = await env.DB.prepare("SELECT delivery_file_key,delivery_file_name FROM mhc_orders WHERE delivery_token=?").bind(token).first<Record<string, unknown>>();
    if (!row || !asString(row.delivery_file_key)) return new Response("Fichier introuvable", { status: 404 });
    const object = await env.MEDIA.get(asString(row.delivery_file_key));
    if (!object) return new Response("Fichier introuvable", { status: 404 });
    const headers = new Headers(); object.writeHttpMetadata(headers); headers.set("Cache-Control", "private, no-store"); headers.set("X-Content-Type-Options", "nosniff"); headers.set("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(asString(row.delivery_file_name) || "ma-chanson.mp3")}`);
    return new Response(object.body, { headers });
  }

  if (url.pathname.startsWith("/api/delivery-download/") && request.method === "GET") {
    const token = decodeURIComponent(url.pathname.slice("/api/delivery-download/".length));
    const row = await env.DB.prepare("SELECT id,delivery_file_key,delivery_file_name FROM mhc_orders WHERE delivery_token=?").bind(token).first<Record<string, unknown>>();
    if (!row || !asString(row.delivery_file_key)) return new Response("Fichier introuvable", { status: 404 });
    const object = await env.MEDIA.get(asString(row.delivery_file_key));
    if (!object) return new Response("Fichier introuvable", { status: 404 });
    if (url.searchParams.get("preview") !== "1") await env.DB.prepare("UPDATE mhc_orders SET delivery_downloaded_at=COALESCE(delivery_downloaded_at,CURRENT_TIMESTAMP),updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(asString(row.id)).run();
    const headers = new Headers(); object.writeHttpMetadata(headers); headers.set("Cache-Control", "private, no-store"); headers.set("X-Content-Type-Options", "nosniff"); headers.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(asString(row.delivery_file_name) || "ma-chanson.mp3")}`);
    return new Response(object.body, { headers });
  }

  if (url.pathname === "/api/delivery/revisions" && request.method === "POST") {
    const body = await request.json() as { token?: string; revisionType?: string; message?: string; songMoment?: string };
    const token = asString(body.token), message = asString(body.message), revisionType = asString(body.revisionType) || "other", songMoment = asString(body.songMoment);
    if (!token || !message) return json({ error: "Décrivez la modification souhaitée." }, 400);
    if (message.length > 4000 || songMoment.length > 300) return json({ error: "Votre message est trop long." }, 400);
    if (!new Set(["lyrics", "pronunciation", "voice_style", "other"]).has(revisionType)) return json({ error: "Type de révision invalide." }, 400);
    const order = await env.DB.prepare("SELECT o.*,s.answers FROM mhc_orders o LEFT JOIN submissions s ON s.id=o.submission_id WHERE o.delivery_token=?").bind(token).first<Record<string, unknown>>();
    if (!order) return json({ error: "Commande introuvable." }, 404);
    const count = await env.DB.prepare(`SELECT COUNT(*) AS count,
      SUM(CASE WHEN status IN ('new','in_progress','version_ready') THEN 1 ELSE 0 END) AS open_count
      FROM mhc_revisions WHERE order_id=?`).bind(asString(order.id)).first<{ count: number; open_count: number }>();
    const currentCount = Number(count?.count || 0);
    const openCount = Number(count?.open_count || 0);
    const revisionLimit = revisionLimitForOrder(order);
    if (revisionLimit === 0) return json({ error: "Cette formule n’inclut pas de révision." }, 403);
    if (openCount > 0) return json({ error: "Une demande de révision est déjà en cours de traitement." }, 409);
    if (revisionLimit !== null && currentCount >= revisionLimit) return json({ error: "Le nombre de révisions incluses a été atteint. Écrivez à Justine pour toute question." }, 409);
    const revisionId = crypto.randomUUID();
    await env.DB.batch([
      env.DB.prepare("INSERT INTO mhc_revisions(id,order_id,revision_type,message,song_moment,status,created_at,updated_at) VALUES(?,?,?,?,?,'new',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").bind(revisionId, asString(order.id), revisionType, message, songMoment || null),
      env.DB.prepare("UPDATE mhc_orders SET production_status='revision_requested',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(asString(order.id))
    ]);
    const answers = parseAnswers(order.answers) || {};
    ctx.waitUntil(env.EMAIL.send({
      to: { email: "monhistoirechantee@gmail.com", name: "Mon Histoire Chantée" },
      from: { email: "contact@monhistoirechantee.com", name: "Notifications MHC" }, replyTo: asString(order.email) || "contact@monhistoirechantee.com",
      subject: `Nouvelle demande de révision ${asString(order.order_name)} · ${asString(answers.recipientName) || "chanson"}`,
      html: `<h2>Nouvelle demande de révision</h2><p><strong>Commande :</strong> ${escapeHtml(order.order_name)}</p><p><strong>Client :</strong> ${escapeHtml(order.customer_name)} · ${escapeHtml(order.email)}</p><p><strong>Type :</strong> ${escapeHtml(revisionType)}</p><p><strong>Moment :</strong> ${escapeHtml(songMoment || "Non précisé")}</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p><p><a href="${url.origin}/admin">Ouvrir l’administration</a></p>`,
      text: `Nouvelle demande de révision\nCommande : ${asString(order.order_name)}\nClient : ${asString(order.customer_name)} · ${asString(order.email)}\nType : ${revisionType}\nMoment : ${songMoment || "Non précisé"}\n\n${message}`
    }).catch(error => console.error("Revision notification failed", error)));
    return json({ ok: true, revisionId, revisionCount: currentCount + 1 });
  }

  if (url.pathname === "/api/content" && request.method === "GET") {
    const row = await env.DB.prepare("SELECT value FROM settings WHERE key=?").bind("site_content").first<{ value: string }>();
    return json({ content: row ? JSON.parse(row.value) : null });
  }

  if (url.pathname === "/api/content" && request.method === "PUT") {
    if (!isAdmin(request, env)) return json({ error: "Accès refusé" }, 401);
    const body = await request.json() as { content?: unknown };
    if (!body.content) return json({ error: "Contenu manquant" }, 400);
    await env.DB.prepare("INSERT INTO settings(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP").bind("site_content", JSON.stringify(body.content)).run();
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
    const body = await request.json() as { id?: string; answers?: Answers; stage?: SubmissionStage };
    if (!body.id || !body.answers) return json({ error: "Données manquantes" }, 400);
    const email = asString(body.answers.email) || null, offer = asString(body.answers.offer) || null, express = body.answers.express ? 1 : 0;
    const status = body.stage === "form_completed" ? "form_completed" : "started";
    await env.DB.prepare(`INSERT INTO submissions(id,email,answers,selected_offer,express,status,updated_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET email=excluded.email,answers=excluded.answers,selected_offer=excluded.selected_offer,express=excluded.express,
      status=CASE WHEN excluded.status='started' AND submissions.status IN ('form_completed','checkout_started','paid') THEN submissions.status ELSE excluded.status END,updated_at=CURRENT_TIMESTAMP`)
      .bind(body.id, email, JSON.stringify(body.answers), offer, express, status).run();
    await recordServerFunnelEvent(env, "MHCFormStarted", body.id, { stage: status });
    if (body.stage === "form_completed" && email) {
      await recordServerFunnelEvent(env, "Lead", body.id, { emailCaptured: true });
      ctx.waitUntil(trackFormCompleted(env, body.id, email, body.answers, url.origin).catch(error => console.error("Form completed integration failed", error)));
    }
    return json({ ok: true, id: body.id });
  }

  if (url.pathname === "/api/checkout" && request.method === "POST") {
    const body = await request.json() as { submissionId?: string; offer?: "essential" | "premium"; express?: boolean; email?: string; consent?: boolean };
    const token = env.SHOPIFY_PRIVATE_STOREFRONT_TOKEN;
    const mainVariant = body.offer === "premium" ? env.SHOPIFY_PREMIUM_VARIANT_ID : env.SHOPIFY_ESSENTIAL_VARIANT_ID;
    if (!body.submissionId || !body.offer) return json({ error: "Commande incomplète" }, 400);
    if (!token || !mainVariant) return json({ error: "Le checkout Shopify doit encore être connecté dans Cloudflare." }, 503);
    const stored = await env.DB.prepare("SELECT answers FROM submissions WHERE id=?").bind(body.submissionId).first<{ answers: string }>();
    const answers = parseAnswers(stored?.answers) || { offer: body.offer, express: body.express, email: body.email, consent: body.consent };
    const valueCents = stripeAmount(body.offer, Boolean(body.express));
    await recordServerFunnelEvent(env, "AddToCart", body.submissionId, { valueCents, currency: "EUR", offer: body.offer, express: body.express });

    const lines: Array<Record<string, unknown>> = [{ merchandiseId: mainVariant, quantity: 1, attributes: [{ key: "_submission_id", value: body.submissionId }, { key: "_formule", value: body.offer }] }];
    if (body.express) {
      if (!env.SHOPIFY_EXPRESS_VARIANT_ID) return json({ error: "La variante Express n’est pas configurée." }, 503);
      lines.push({ merchandiseId: env.SHOPIFY_EXPRESS_VARIANT_ID, quantity: 1, attributes: [{ key: "_submission_id", value: body.submissionId }] });
    }
    const query = `mutation CartCreate($input:CartInput!){cartCreate(input:$input){cart{checkoutUrl}userErrors{field message}}}`;
    const input: Record<string, unknown> = { lines, attributes: [{ key: "__submission_id", value: body.submissionId }] };
    if (asString(body.email)) input.buyerIdentity = { email: asString(body.email) };
    const response = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/${env.SHOPIFY_API_VERSION || "2026-04"}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Shopify-Storefront-Private-Token": token, "Shopify-Storefront-Buyer-IP": request.headers.get("CF-Connecting-IP") || "127.0.0.1" },
      body: JSON.stringify({ query, variables: { input } })
    });
    const result = await response.json() as { data?: { cartCreate?: { cart?: { checkoutUrl?: string }; userErrors?: Array<{ message: string }> } }; errors?: Array<{ message: string }> };
    const checkoutUrl = result.data?.cartCreate?.cart?.checkoutUrl;
    if (!checkoutUrl) return json({ error: result.data?.cartCreate?.userErrors?.[0]?.message || result.errors?.[0]?.message || "Shopify n’a pas créé le checkout." }, 502);
    await env.DB.prepare("UPDATE submissions SET status='checkout_started',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(body.submissionId).run();
    await recordServerFunnelEvent(env, "InitiateCheckout", body.submissionId, { valueCents, currency: "EUR", paymentProvider: "shopify", offer: body.offer, express: body.express });
    if (asString(body.email)) ctx.waitUntil(trackCheckoutStarted(env, body.submissionId, asString(body.email), Boolean(body.consent), answers, checkoutUrl).catch(error => console.error("Checkout integration failed", error)));
    return json({ checkoutUrl });
  }

  return json({ error: "Route inconnue" }, 404);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env, url, ctx);
    if (url.pathname.startsWith("/livraison/")) return Response.redirect(`${url.origin}/chanson/${encodeURIComponent(decodeURIComponent(url.pathname.slice("/livraison/".length)))}`, 302);
    if (url.pathname.startsWith("/media/")) {
      const object = await env.MEDIA.get(decodeURIComponent(url.pathname.slice(7)));
      if (!object) return new Response("Fichier introuvable", { status: 404 });
      const headers = new Headers(); object.writeHttpMetadata(headers); headers.set("etag", object.httpEtag); headers.set("Cache-Control", "public, max-age=31536000, immutable");
      return new Response(object.body, { headers });
    }
    return env.ASSETS.fetch(request);
  }
} satisfies ExportedHandler<Env>;
