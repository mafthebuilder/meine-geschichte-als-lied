import { useEffect, useMemo, useState } from "react";

type ProspectStatus = "to_create" | "in_production" | "ready" | "sent" | "converted";

type ProspectAnswers = {
  relation?: string;
  recipientName?: string;
  pronunciation?: string;
  genre?: string;
  voice?: string;
  qualities?: string[];
  customQualities?: string;
  memories?: string;
  message?: string;
  offer?: string;
  express?: boolean;
  email?: string;
};

type Prospect = {
  submissionId: string;
  email: string;
  status: ProspectStatus;
  submissionStatus: string;
  selectedOffer: string;
  express: boolean;
  createdAt: string;
  updatedAt: string;
  excerptFileName: string;
  previewUrl: string;
  previewEmailSentAt: string;
  previewEmailCount: number;
  previewViewedAt: string;
  answers: ProspectAnswers;
};

const statusLabels: Record<ProspectStatus, string> = {
  to_create: "À traiter",
  in_production: "Extrait en création",
  ready: "Extrait prêt",
  sent: "Relance envoyée",
  converted: "Converti"
};

function formatDate(value: string, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", withTime
    ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short", year: "numeric" }
  ).format(date);
}

function briefText(prospect: Prospect) {
  const a = prospect.answers || {};
  return [
    `PROSPECT ${prospect.submissionId}`,
    `E-mail : ${prospect.email || "Non renseigné"}`,
    `Formule envisagée : ${(prospect.selectedOffer || a.offer || "Non renseignée").toUpperCase()}`,
    `Express : ${prospect.express ? "OUI" : "NON"}`,
    "",
    `Destinataire : ${a.recipientName || "Non renseigné"}`,
    `Relation : ${a.relation || "Non renseignée"}`,
    `Prononciation : ${a.pronunciation || "Non renseignée"}`,
    `Style musical : ${a.genre || "Non renseigné"}`,
    `Voix : ${a.voice || "Non renseignée"}`,
    `Qualités : ${a.qualities?.join(", ") || "Non renseignées"}`,
    `Autres qualités : ${a.customQualities || "Aucune"}`,
    "",
    "SOUVENIRS :",
    a.memories || "Non renseignés",
    "",
    "MESSAGE À TRANSMETTRE :",
    a.message || "Non renseigné",
    "",
    "OBJECTIF EXTRAIT :",
    "Créer un extrait de 20 à 35 secondes, émotionnel, immédiatement reconnaissable et contenant idéalement le prénom du destinataire ou un souvenir précis."
  ].join("\n");
}

export default function ProspectsAdmin({ token, onUnauthorized, setGlobalStatus }: { token: string; onUnauthorized: () => void; setGlobalStatus: (value: string) => void }) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"active" | "all">("active");

  async function api(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);
    headers.set("X-Admin-Token", token);
    if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
    const response = await fetch(path, { ...options, headers });
    if (response.status === 401) {
      onUnauthorized();
      throw new Error("Session administrateur expirée.");
    }
    const payload = await response.json() as Record<string, unknown>;
    if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Action impossible.");
    return payload;
  }

  async function load(silent = false) {
    if (!silent) setLoading(true);
    setError("");
    try {
      const payload = await api(`/api/admin/prospects?scope=${filter}`);
      setProspects((payload.prospects as Prospect[]) || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Chargement impossible.");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [filter]);

  const stats = useMemo(() => ({
    total: prospects.length,
    toCreate: prospects.filter(item => item.status === "to_create").length,
    ready: prospects.filter(item => item.status === "ready").length,
    sent: prospects.filter(item => item.status === "sent").length
  }), [prospects]);

  async function changeStatus(prospect: Prospect, status: ProspectStatus) {
    setBusyId(prospect.submissionId);
    try {
      await api(`/api/admin/prospect-status?id=${encodeURIComponent(prospect.submissionId)}`, { method: "PUT", body: JSON.stringify({ status }) });
      await load(true);
      setGlobalStatus(`${statusLabels[status]} ✓`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Mise à jour impossible.");
    } finally {
      setBusyId("");
    }
  }

  async function uploadExcerpt(prospect: Prospect, file?: File) {
    if (!file) return;
    setBusyId(prospect.submissionId);
    setGlobalStatus("Import de l’extrait…");
    try {
      const form = new FormData();
      form.append("file", file);
      await api(`/api/admin/prospect-excerpt?id=${encodeURIComponent(prospect.submissionId)}`, { method: "POST", body: form });
      await load(true);
      setGlobalStatus("Extrait enregistré. Prévisualisez-le avant l’envoi ✓");
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : "Import impossible.";
      setError(message);
      setGlobalStatus(message);
    } finally {
      setBusyId("");
    }
  }

  async function sendPreviewEvent(prospect: Prospect) {
    const resend = prospect.previewEmailCount > 0;
    if (resend && !window.confirm(`Déclencher à nouveau l’e-mail extrait pour ${prospect.email} ?`)) return;
    setBusyId(prospect.submissionId);
    setGlobalStatus("Transmission de l’extrait à Klaviyo…");
    try {
      await api(`/api/admin/prospect-preview-email?id=${encodeURIComponent(prospect.submissionId)}`, { method: "POST" });
      await load(true);
      setGlobalStatus(`Événement MHC Preview Ready envoyé pour ${prospect.email} ✓`);
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : "Envoi impossible.";
      setError(message);
      setGlobalStatus(message);
    } finally {
      setBusyId("");
    }
  }

  async function copyBrief(prospect: Prospect) {
    await navigator.clipboard.writeText(briefText(prospect));
    setGlobalStatus(`Brief de ${prospect.answers?.recipientName || prospect.email} copié ✓`);
  }

  async function copyLink(prospect: Prospect) {
    if (!prospect.previewUrl) return;
    await navigator.clipboard.writeText(`${window.location.origin}${prospect.previewUrl}`);
    setGlobalStatus("Lien privé de l’extrait copié ✓");
  }

  return <section className="admin-section prospects-admin-section" id="prospects">
    <div className="prospects-heading">
      <div><span className="eyebrow">Récupération</span><h2>Prospects & extraits</h2><p>Retrouvez les formulaires terminés sans achat, créez un extrait personnalisé puis déclenchez l’e-mail 2 dans Klaviyo.</p></div>
      <label>Afficher
        <select value={filter} onChange={event => setFilter(event.target.value as "active" | "all")}>
          <option value="active">Prospects actifs</option>
          <option value="all">Tous, y compris convertis</option>
        </select>
      </label>
    </div>

    <div className="orders-stats">
      <div><span>Prospects</span><strong>{stats.total}</strong></div>
      <div><span>À traiter</span><strong>{stats.toCreate}</strong></div>
      <div><span>Extraits prêts</span><strong>{stats.ready}</strong></div>
      <div><span>Relances envoyées</span><strong>{stats.sent}</strong></div>
    </div>

    {error && <div className="orders-error">{error}</div>}
    {loading && <div className="orders-empty">Chargement des prospects…</div>}
    {!loading && !prospects.length && <div className="orders-empty"><strong>Aucun prospect à traiter.</strong><span>Les personnes ayant terminé le formulaire sans acheter apparaîtront ici.</span></div>}

    <div className="prospect-list">
      {prospects.map(prospect => {
        const busy = busyId === prospect.submissionId;
        const a = prospect.answers || {};
        return <article className={`prospect-card status-${prospect.status}`} key={prospect.submissionId}>
          <div className="prospect-card-top">
            <div><span className="prospect-status-dot" /><div><small>{statusLabels[prospect.status]}</small><h3>Chanson pour {a.recipientName || "destinataire non renseigné"}</h3><p>{prospect.email}</p></div></div>
            <select value={prospect.status} disabled={busy || prospect.status === "converted"} onChange={event => changeStatus(prospect, event.target.value as ProspectStatus)}>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          <div className="prospect-meta-grid">
            <div><span>Formulaire</span><strong>{formatDate(prospect.createdAt, true)}</strong></div>
            <div><span>Style</span><strong>{a.genre || "—"}</strong></div>
            <div><span>Relation</span><strong>{a.relation || "—"}</strong></div>
            <div><span>Formule</span><strong>{prospect.selectedOffer || a.offer || "—"}</strong></div>
          </div>

          <details className="prospect-details">
            <summary>Voir les réponses complètes</summary>
            <div className="prospect-answer-grid">
              <div><span>Qualités</span><p>{a.qualities?.join(", ") || a.customQualities || "—"}</p></div>
              <div><span>Voix</span><p>{a.voice || "—"}</p></div>
              <div className="wide"><span>Souvenirs</span><p>{a.memories || "—"}</p></div>
              <div className="wide"><span>Message</span><p>{a.message || "—"}</p></div>
            </div>
          </details>

          <div className="prospect-actions">
            <button type="button" onClick={() => copyBrief(prospect)}>Copier le brief</button>
            <label className="prospect-upload-button">{prospect.excerptFileName ? "Remplacer l’extrait" : "Ajouter l’extrait"}<input type="file" accept="audio/*,.mp3,.wav,.m4a" disabled={busy || prospect.status === "converted"} onChange={event => uploadExcerpt(prospect, event.target.files?.[0])} /></label>
            {prospect.previewUrl && <a href={`${prospect.previewUrl}?preview=1`} target="_blank" rel="noreferrer">Prévisualiser</a>}
            {prospect.previewUrl && <button type="button" onClick={() => copyLink(prospect)}>Copier le lien</button>}
            {prospect.previewUrl && prospect.status !== "converted" && <button type="button" className="primary" disabled={busy} onClick={() => sendPreviewEvent(prospect)}>{prospect.previewEmailCount ? "Renvoyer l’e-mail 2" : "Déclencher l’e-mail 2"}</button>}
          </div>

          {prospect.excerptFileName && <div className="prospect-tracking">
            <span>♪ {prospect.excerptFileName}</span>
            <span className={prospect.previewEmailSentAt ? "done" : ""}>E-mail {prospect.previewEmailSentAt ? formatDate(prospect.previewEmailSentAt, true) : "non envoyé"}</span>
            <span className={prospect.previewViewedAt ? "done" : ""}>Extrait {prospect.previewViewedAt ? "consulté" : "non consulté"}</span>
          </div>}
        </article>;
      })}
    </div>
  </section>;
}
