import { useState } from "react";
import type { SiteContent } from "../types";

export default function AdminPage({ content, onChange }: { content: SiteContent; onChange: (c: SiteContent) => void }) {
  const [draft, setDraft] = useState<SiteContent>(content);
  const [token, setToken] = useState(sessionStorage.getItem("mhc_admin_token") || "");
  const [status, setStatus] = useState("");
  const update = (path: string, value: string) => {
    const copy = structuredClone(draft) as Record<string, unknown>;
    const parts = path.split("."); let cursor: Record<string, unknown> = copy;
    parts.slice(0, -1).forEach(p => { cursor = cursor[p] as Record<string, unknown>; });
    cursor[parts.at(-1)!] = value; setDraft(copy as SiteContent);
  };
  async function save() {
    sessionStorage.setItem("mhc_admin_token", token); setStatus("Enregistrement…");
    const response = await fetch("/api/content", { method: "PUT", headers: { "Content-Type": "application/json", "X-Admin-Token": token }, body: JSON.stringify({ content: draft }) });
    if (!response.ok) return setStatus("Erreur : vérifiez le token administrateur.");
    onChange(draft); setStatus("Modifications publiées ✓");
  }
  async function upload(target: string, file?: File) {
    if (!file) return; setStatus("Import du média…"); const form = new FormData(); form.append("file", file);
    const response = await fetch("/api/media", { method: "POST", headers: { "X-Admin-Token": token }, body: form });
    const data = await response.json() as { url?: string; error?: string };
    if (!response.ok || !data.url) return setStatus(data.error || "Import impossible");
    update(target, data.url); setStatus("Média importé. Cliquez sur Publier.");
  }
  return <div className="admin-page"><aside><a className="logo" href="/"><span className="logo-note">♪</span>Administration</a><a className="active" href="#design">Design</a><a href="#hero">Hero</a><a href="#medias">Médias</a><a href="#contenu">Contenu</a><a href="/" target="_blank">Voir le site ↗</a></aside><main><div className="admin-top"><div><span className="eyebrow">MVP</span><h1>Personnalisation du site</h1><p>Modifiez les éléments essentiels sans toucher au code.</p></div><button className="button" onClick={save}>Publier</button></div><section className="admin-section"><h2>Accès administrateur</h2><label>Token administrateur<input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="Défini dans Cloudflare" /></label></section><section className="admin-section" id="design"><h2>Identité visuelle</h2><div className="admin-grid"><label>Nom de la marque<input value={draft.brand.name} onChange={e => update("brand.name", e.target.value)} /></label><label>E-mail support<input value={draft.brand.supportEmail} onChange={e => update("brand.supportEmail", e.target.value)} /></label>{Object.entries(draft.brand.colors).map(([key, value]) => <label key={key}>Couleur {key}<div className="color-field"><input type="color" value={value} onChange={e => update(`brand.colors.${key}`, e.target.value)} /><input value={value} onChange={e => update(`brand.colors.${key}`, e.target.value)} /></div></label>)}</div></section><section className="admin-section" id="hero"><h2>Hero</h2><div className="admin-grid"><label>Surtitre<input value={draft.hero.eyebrow} onChange={e => update("hero.eyebrow", e.target.value)} /></label><label>CTA<input value={draft.hero.cta} onChange={e => update("hero.cta", e.target.value)} /></label><label className="wide">Titre<textarea rows={2} value={draft.hero.title} onChange={e => update("hero.title", e.target.value)} /></label><label className="wide">Description<textarea rows={3} value={draft.hero.description} onChange={e => update("hero.description", e.target.value)} /></label></div></section><section className="admin-section" id="medias"><h2>Médias principaux</h2><div className="media-admin"><div><video src={draft.hero.video} muted /><label className="upload-button">Remplacer la vidéo hero<input type="file" accept="video/*" onChange={e => upload("hero.video", e.target.files?.[0])} /></label></div>{draft.occasions.map((item, index) => <div key={item.title}><img src={item.image} alt="" /><strong>{item.title}</strong><label className="upload-button">Remplacer<input type="file" accept="image/*" onChange={e => upload(`occasions.${index}.image`, e.target.files?.[0])} /></label></div>)}</div></section><section className="admin-section" id="contenu"><h2>Textes rapides</h2><label>Bandeau promotionnel<input value={draft.announcement} onChange={e => update("announcement", e.target.value)} /></label><label>Titre CTA final<input value={draft.finalCta.title} onChange={e => update("finalCta.title", e.target.value)} /></label><label>Texte CTA final<textarea rows={2} value={draft.finalCta.text} onChange={e => update("finalCta.text", e.target.value)} /></label></section>{status && <div className="admin-status">{status}</div>}</main></div>;
}
