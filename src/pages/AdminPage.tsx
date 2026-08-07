import { type FormEvent, useEffect, useState } from "react";
import type { SiteContent } from "../types";
import OrdersAdmin from "./OrdersAdmin";
import ProspectsAdmin from "./ProspectsAdmin";
import AnalyticsAdmin from "./AnalyticsAdmin";
import OffersAdmin from "./OffersAdmin";

export default function AdminPage({ content, onChange }: { content: SiteContent; onChange: (c: SiteContent) => void }) {
  const [draft, setDraft] = useState<SiteContent>(content);
  const [token, setToken] = useState(sessionStorage.getItem("mhc_admin_token") || "");
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(Boolean(token));
  const [status, setStatus] = useState("");
  const [workspace, setWorkspace] = useState<"analytics" | "prospects" | "orders" | "offers" | "content">("analytics");

  useEffect(() => setDraft(content), [content]);
  useEffect(() => {
    if (!token) return;
    verify(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (path: string, value: unknown) => {
    const copy = structuredClone(draft) as unknown as Record<string, unknown>;
    const parts = path.split(".");
    let cursor: Record<string, unknown> = copy;
    parts.slice(0, -1).forEach(part => { cursor = cursor[part] as Record<string, unknown>; });
    cursor[parts.at(-1)!] = value;
    setDraft(copy as unknown as SiteContent);
  };

  function lock(message = "Session administrateur expirée.") {
    sessionStorage.removeItem("mhc_admin_token");
    setAuthorized(false);
    setToken("");
    setStatus(message);
  }

  async function verify(value: string) {
    setChecking(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/verify", { headers: { "X-Admin-Token": value } });
      if (!response.ok) return lock("Mot de passe incorrect.");
      sessionStorage.setItem("mhc_admin_token", value);
      setAuthorized(true);
      setStatus("");
    } catch {
      setStatus("Connexion impossible. Réessayez.");
    } finally {
      setChecking(false);
    }
  }

  async function login(event: FormEvent) {
    event.preventDefault();
    if (!token.trim()) return setStatus("Saisissez votre mot de passe administrateur.");
    await verify(token.trim());
  }

  async function save() {
    setStatus("Enregistrement…");
    const response = await fetch("/api/content", { method: "PUT", headers: { "Content-Type": "application/json", "X-Admin-Token": token }, body: JSON.stringify({ content: draft }) });
    if (response.status === 401) return lock();
    if (!response.ok) return setStatus("Enregistrement impossible.");
    onChange(draft);
    setStatus("Modifications publiées ✓");
  }

  async function upload(target: string, file?: File) {
    if (!file) return;
    setStatus("Import du média…");
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/media", { method: "POST", headers: { "X-Admin-Token": token }, body: form });
    if (response.status === 401) return lock();
    const data = await response.json() as { url?: string; error?: string };
    if (!response.ok || !data.url) return setStatus(data.error || "Import impossible");
    update(target, data.url);
    setStatus("Média importé. Cliquez sur Publier.");
  }

  if (checking) return <div className="admin-login-page"><div className="admin-login-card"><span className="admin-login-icon">♪</span><h1>Vérification de l’accès</h1><p>Connexion à l’administration…</p></div></div>;

  if (!authorized) return <div className="admin-login-page">
    <form className="admin-login-card" onSubmit={login}>
      <span className="admin-login-icon">♪</span>
      <span className="eyebrow">Espace privé</span>
      <h1>Administration</h1>
      <p>Entrez votre mot de passe pour modifier le site.</p>
      <label>Mot de passe administrateur<input autoFocus type="password" value={token} onChange={event => setToken(event.target.value)} placeholder="Votre mot de passe" /></label>
      <button className="button" type="submit">Se connecter</button>
      {status && <div className="admin-login-error">{status}</div>}
      <a href="/">← Retour au site</a>
    </form>
  </div>;

  return <div className="admin-page">
    <aside>
      <a className="logo" href="/"><img src="/mhc-favicon-v2.png" alt="" />Administration</a>
      <button className={workspace === "analytics" ? "active" : ""} onClick={() => setWorkspace("analytics")}>Analytics</button>
      <button className={workspace === "prospects" ? "active" : ""} onClick={() => setWorkspace("prospects")}>Prospects & extraits</button>
      <button className={workspace === "orders" ? "active" : ""} onClick={() => setWorkspace("orders")}>Commandes & livraison</button>
      <button className={workspace === "offers" ? "active" : ""} onClick={() => setWorkspace("offers")}>Offres</button>
      <button className={workspace === "content" ? "active" : ""} onClick={() => setWorkspace("content")}>Contenu du site</button>
      <a href="/" target="_blank">Voir le site ↗</a>
      <button className="admin-logout" onClick={() => lock("Vous êtes déconnecté.")}>Se déconnecter</button>
    </aside>
    <main>
      <div className="admin-top"><div><span className="eyebrow">Centre de pilotage</span><h1>Administration</h1><p>Analysez le funnel, récupérez les prospects et livrez chaque chanson depuis un seul espace.</p></div>{workspace === "content" && <button className="button" onClick={save}>Publier le contenu</button>}</div>
      <nav className="admin-workspace-tabs" aria-label="Sections de l’administration">
        <button className={workspace === "analytics" ? "active" : ""} onClick={() => setWorkspace("analytics")}>Analytics</button>
        <button className={workspace === "prospects" ? "active" : ""} onClick={() => setWorkspace("prospects")}>Prospects</button>
        <button className={workspace === "orders" ? "active" : ""} onClick={() => setWorkspace("orders")}>Commandes</button>
        <button className={workspace === "offers" ? "active" : ""} onClick={() => setWorkspace("offers")}>Offres</button>
        <button className={workspace === "content" ? "active" : ""} onClick={() => setWorkspace("content")}>Contenu</button>
      </nav>
      {workspace === "analytics" && <AnalyticsAdmin token={token} onUnauthorized={() => lock()} />}
      {workspace === "prospects" && <ProspectsAdmin token={token} onUnauthorized={() => lock()} setGlobalStatus={setStatus} />}
      {workspace === "orders" && <OrdersAdmin token={token} onUnauthorized={() => lock()} setGlobalStatus={setStatus} />}
      {workspace === "offers" && <OffersAdmin token={token} onUnauthorized={() => lock()} setGlobalStatus={setStatus} />}
      {workspace === "content" && <>
      <section className="admin-section" id="design"><h2>Identité visuelle</h2><div className="admin-grid"><label>Nom de la marque<input value={draft.brand.name} onChange={event => update("brand.name", event.target.value)} /></label><label>E-mail support<input value={draft.brand.supportEmail} onChange={event => update("brand.supportEmail", event.target.value)} /></label>{Object.entries(draft.brand.colors).map(([key, value]) => <label key={key}>Couleur {key}<div className="color-field"><input type="color" value={value} onChange={event => update(`brand.colors.${key}`, event.target.value)} /><input value={value} onChange={event => update(`brand.colors.${key}`, event.target.value)} /></div></label>)}</div></section>
      <section className="admin-section" id="hero"><h2>Hero</h2><div className="admin-grid"><label>Surtitre<input value={draft.hero.eyebrow} onChange={event => update("hero.eyebrow", event.target.value)} /></label><label>CTA<input value={draft.hero.cta} onChange={event => update("hero.cta", event.target.value)} /></label><label className="wide">Titre<textarea rows={2} value={draft.hero.title} onChange={event => update("hero.title", event.target.value)} /></label><label className="wide">Description<textarea rows={3} value={draft.hero.description} onChange={event => update("hero.description", event.target.value)} /></label></div></section>
      <section className="admin-section" id="medias"><h2>Médias principaux</h2><div className="media-admin"><div><video src={draft.hero.video} muted /><label className="upload-button">Remplacer la vidéo hero<input type="file" accept="video/*" onChange={event => upload("hero.video", event.target.files?.[0])} /></label></div>{draft.occasions.map((item, index) => <div key={item.title}><img src={item.image} alt="" /><strong>{item.title}</strong><label className="upload-button">Remplacer<input type="file" accept="image/*" onChange={event => upload(`occasions.${index}.image`, event.target.files?.[0])} /></label></div>)}</div></section>
      <section className="admin-section" id="song-preview"><h2>Une histoire devenue une chanson</h2><p>Modifiez le texte et l’extrait audio présenté sur la page d’accueil.</p><div className="admin-grid"><label>Surtitre<input value={draft.songPreview.eyebrow} onChange={event => update("songPreview.eyebrow", event.target.value)} /></label><label>Durée affichée<input value={draft.songPreview.duration} onChange={event => update("songPreview.duration", event.target.value)} placeholder="2:30" /></label><label className="wide">Titre<input value={draft.songPreview.title} onChange={event => update("songPreview.title", event.target.value)} /></label><label className="wide">Texte<textarea rows={3} value={draft.songPreview.subtitle} onChange={event => update("songPreview.subtitle", event.target.value)} /></label></div><div className="admin-song-preview">{draft.songPreview.audio ? <audio controls src={draft.songPreview.audio} /> : <div className="empty-audio">Aucune chanson téléversée</div>}<label className="upload-button">Téléverser la chanson MP3<input type="file" accept="audio/*" onChange={event => upload("songPreview.audio", event.target.files?.[0])} /></label></div></section>
      <section className="admin-section" id="reviews"><h2>Avis vidéo et extraits audio</h2><p>Ces cinq avis apparaissent dans le slider de l’étape « Choisissez la finition ».</p><div className="audio-admin-grid review-admin-grid">{draft.funnel.audioReviews.map((review, index) => <div className="audio-admin-card" key={`${review.name}-${index}`}><strong className="admin-review-number">Avis {index + 1}</strong><label>Prénom<input value={review.name} onChange={event => update(`funnel.audioReviews.${index}.name`, event.target.value)} /></label><label>Pays<input value={review.country} onChange={event => update(`funnel.audioReviews.${index}.country`, event.target.value)} /></label><label>Titre de l’avis<input value={review.title} onChange={event => update(`funnel.audioReviews.${index}.title`, event.target.value)} /></label><label>Occasion<input value={review.occasion} onChange={event => update(`funnel.audioReviews.${index}.occasion`, event.target.value)} /></label><label>Témoignage<textarea rows={4} value={review.quote} onChange={event => update(`funnel.audioReviews.${index}.quote`, event.target.value)} /></label>{review.video ? <video className="admin-review-video" muted loop playsInline controls src={review.video} /> : <div className="empty-audio">Aucune vidéo réaction</div>}<label className="upload-button">Téléverser la vidéo réaction<input type="file" accept="video/*" onChange={event => upload(`funnel.audioReviews.${index}.video`, event.target.files?.[0])} /></label>{review.audio ? <audio controls src={review.audio} /> : <div className="empty-audio">Aucun extrait de chanson</div>}<label className="upload-button">Téléverser l’extrait audio<input type="file" accept="audio/*" onChange={event => upload(`funnel.audioReviews.${index}.audio`, event.target.files?.[0])} /></label></div>)}</div></section>
      <section className="admin-section" id="tracking">
        <div className="admin-section-heading"><div><h2>Cookies & tracking</h2><p>Activez le bandeau uniquement pour les marchés où vous souhaitez demander le consentement avant le déclenchement des pixels publicitaires.</p></div>
          <label className="admin-toggle">
            <input type="checkbox" checked={draft.privacy.cookieBannerEnabled} onChange={event => update("privacy.cookieBannerEnabled", event.target.checked)} />
            <span aria-hidden="true" />
            <strong>{draft.privacy.cookieBannerEnabled ? "Bandeau activé" : "Bandeau désactivé"}</strong>
          </label>
        </div>
        <div className="admin-grid cookie-admin-fields">
          <label className="wide">Texte du bandeau<textarea rows={2} value={draft.privacy.text} onChange={event => update("privacy.text", event.target.value)} /></label>
          <label>Bouton accepter<input value={draft.privacy.acceptLabel} onChange={event => update("privacy.acceptLabel", event.target.value)} /></label>
          <label>Bouton refuser<input value={draft.privacy.rejectLabel} onChange={event => update("privacy.rejectLabel", event.target.value)} /></label>
        </div>
      </section>
      <section className="admin-section" id="contenu"><h2>Textes rapides</h2><label>Bandeau promotionnel<input value={draft.announcement} onChange={event => update("announcement", event.target.value)} /></label><label>Titre CTA final<input value={draft.finalCta.title} onChange={event => update("finalCta.title", event.target.value)} /></label><label>Texte CTA final<textarea rows={2} value={draft.finalCta.text} onChange={event => update("finalCta.text", event.target.value)} /></label></section>
      </>}
      {status && <div className="admin-status">{status}</div>}
    </main>
  </div>;
}
