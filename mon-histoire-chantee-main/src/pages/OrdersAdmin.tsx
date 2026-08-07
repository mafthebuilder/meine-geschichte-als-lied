import { useEffect, useMemo, useState } from "react";

type OrderStatus = "to_create" | "in_production" | "ready" | "delivered" | "revision_requested";
type RevisionStatus = "new" | "in_progress" | "version_ready" | "completed";

type OrderAnswers = {
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

type Revision = {
  id: string;
  revisionType: string;
  message: string;
  songMoment: string;
  status: RevisionStatus;
  createdAt: string;
};

type AdminOrder = {
  id: string;
  paymentProvider: "shopify" | "stripe" | string;
  providerOrderId: string;
  orderName: string;
  submissionId: string;
  email: string;
  customerName: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  amountCents: number;
  currency: string;
  selectedOffer: string;
  offerName: string;
  offerConfigVersion: number;
  revisionLimit: number | null;
  deliveryHours: number;
  express: boolean;
  productionStatus: OrderStatus;
  deliveryFileName: string;
  deliveryUrl: string;
  providerCreatedAt: string;
  deliveredAt: string;
  deliveryEmailSentAt: string;
  deliveryEmailCount: number;
  deliveryViewedAt: string;
  deliveryDownloadedAt: string;
  revisionCount: number;
  revisions: Revision[];
  answers: OrderAnswers | null;
};

const statusLabels: Record<OrderStatus, string> = {
  to_create: "À créer",
  in_production: "En production",
  ready: "Prête à envoyer",
  delivered: "Livrée",
  revision_requested: "Révision demandée"
};

const revisionStatusLabels: Record<RevisionStatus, string> = {
  new: "Nouvelle",
  in_progress: "En cours",
  version_ready: "Nouvelle version prête",
  completed: "Terminée"
};

const revisionTypeLabels: Record<string, string> = {
  lyrics: "Paroles",
  pronunciation: "Prononciation",
  voice_style: "Voix ou style musical",
  other: "Autre élément"
};

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency || "EUR" }).format((Number(cents) || 0) / 100);
}

function formatDate(value: string, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", withTime
    ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short", year: "numeric" }
  ).format(date);
}

function deadlineFor(order: AdminOrder) {
  const date = new Date(order.providerCreatedAt);
  if (Number.isNaN(date.getTime())) return "—";
  date.setHours(date.getHours() + (order.deliveryHours || (order.express ? 24 : 96)));
  return formatDate(date.toISOString(), true);
}

function briefText(order: AdminOrder) {
  const a = order.answers || {};
  return [
    `COMMANDE ${order.orderName}`,
    `Paiement : ${order.paymentProvider.toUpperCase()} · ${order.paymentStatus}`,
    `Client : ${order.customerName || "Non renseigné"}`,
    `E-mail : ${order.email || a.email || "Non renseigné"}`,
    `Formule : ${order.offerName || order.selectedOffer || a.offer || "Non renseignée"}`,
    `Express : ${order.express ? "OUI" : "NON"}`,
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
    a.message || "Non renseigné"
  ].join("\n");
}

export default function OrdersAdmin({ token, onUnauthorized, setGlobalStatus }: { token: string; onUnauthorized: () => void; setGlobalStatus: (message: string) => void }) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState("");
  const [error, setError] = useState("");

  async function api(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);
    headers.set("X-Admin-Token", token);
    if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
    const response = await fetch(path, { ...options, headers });
    if (response.status === 401) {
      onUnauthorized();
      throw new Error("Session administrateur expirée.");
    }
    const data = await response.json() as Record<string, unknown>;
    if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Action impossible.");
    return data;
  }

  async function loadOrders(silent = false) {
    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await api("/api/admin/orders");
      setOrders((data.orders as AdminOrder[]) || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Chargement impossible.");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => { void loadOrders(); }, []);

  const stats = useMemo(() => ({
    total: orders.length,
    toCreate: orders.filter(order => order.productionStatus === "to_create").length,
    revisions: orders.filter(order => order.productionStatus === "revision_requested").length,
    delivered: orders.filter(order => order.productionStatus === "delivered").length
  }), [orders]);

  async function syncOrders() {
    setSyncing(true);
    setError("");
    setGlobalStatus("Synchronisation Shopify…");
    try {
      const data = await api("/api/admin/orders/sync", { method: "POST" });
      setGlobalStatus(`${data.imported || 0} commande(s) synchronisée(s) ✓`);
      await loadOrders(true);
    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.message : "Synchronisation impossible.";
      setError(message);
      setGlobalStatus(message);
    } finally {
      setSyncing(false);
    }
  }

  async function changeStatus(order: AdminOrder, status: OrderStatus) {
    setBusyOrderId(order.id);
    try {
      await api(`/api/admin/order-status?id=${encodeURIComponent(order.id)}`, { method: "PUT", body: JSON.stringify({ status }) });
      await loadOrders(true);
      setGlobalStatus(`Commande ${order.orderName} : ${statusLabels[status]} ✓`);
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Mise à jour impossible.");
    } finally {
      setBusyOrderId("");
    }
  }

  async function changeRevisionStatus(order: AdminOrder, revision: Revision, status: RevisionStatus) {
    setBusyOrderId(order.id);
    try {
      await api(`/api/admin/revision-status?id=${encodeURIComponent(revision.id)}`, { method: "PUT", body: JSON.stringify({ status }) });
      await loadOrders(true);
      setGlobalStatus(`Révision ${revisionStatusLabels[status].toLowerCase()} ✓`);
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Mise à jour impossible.");
    } finally {
      setBusyOrderId("");
    }
  }

  async function uploadSong(order: AdminOrder, file?: File) {
    if (!file) return;
    setBusyOrderId(order.id);
    setGlobalStatus(`Import de la chanson ${order.orderName}…`);
    try {
      const form = new FormData();
      form.append("file", file);
      await api(`/api/admin/order-audio?id=${encodeURIComponent(order.id)}`, { method: "POST", body: form });
      await loadOrders(true);
      setGlobalStatus(`Chanson ajoutée à ${order.orderName} ✓`);
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Import impossible.";
      setError(message);
      setGlobalStatus(message);
    } finally {
      setBusyOrderId("");
    }
  }

  async function sendOrderConfirmation(order: AdminOrder, isTest = false) {
    if (!isTest && !window.confirm(`Renvoyer l’e-mail de confirmation à ${order.email} ?`)) return;
    setBusyOrderId(order.id);
    setGlobalStatus(isTest ? "Envoi du test de confirmation…" : "Envoi de la confirmation par Justine…");
    try {
      await api(`/api/admin/order-confirmation-email${isTest ? "-test" : ""}?id=${encodeURIComponent(order.id)}`, { method: "POST" });
      setGlobalStatus(isTest
        ? "Confirmation test envoyée à monhistoirechantee@gmail.com ✓"
        : `Confirmation envoyée à ${order.email} depuis Justine ✓`
      );
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "Envoi de la confirmation impossible.";
      setError(message);
      setGlobalStatus(message);
    } finally {
      setBusyOrderId("");
    }
  }

  async function sendDeliveryEmail(order: AdminOrder) {
    const isResend = order.deliveryEmailCount > 0;
    if (isResend && !window.confirm(`Renvoyer l’e-mail de livraison à ${order.email} ?`)) return;
    setBusyOrderId(order.id);
    setGlobalStatus(isResend ? "Renvoi de l’e-mail premium…" : "Envoi de l’e-mail premium…");
    try {
      await api(`/api/admin/order-delivery-email?id=${encodeURIComponent(order.id)}`, { method: "POST" });
      await loadOrders(true);
      setGlobalStatus(`E-mail envoyé à ${order.email} depuis Justine ✓`);
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "Envoi impossible.";
      setError(message);
      setGlobalStatus(message);
    } finally {
      setBusyOrderId("");
    }
  }

  async function sendTestEmail(order: AdminOrder) {
    setBusyOrderId(order.id);
    setGlobalStatus("Envoi du test à monhistoirechantee@gmail.com…");
    try {
      await api(`/api/admin/order-delivery-email-test?id=${encodeURIComponent(order.id)}`, { method: "POST" });
      setGlobalStatus("E-mail test envoyé sans modifier la commande ✓");
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "Envoi du test impossible.";
      setError(message);
      setGlobalStatus(message);
    } finally {
      setBusyOrderId("");
    }
  }

  async function copyBrief(order: AdminOrder) {
    await navigator.clipboard.writeText(briefText(order));
    setGlobalStatus(`Brief de ${order.orderName} copié ✓`);
  }

  async function copyDeliveryLink(order: AdminOrder) {
    await navigator.clipboard.writeText(`${window.location.origin}${order.deliveryUrl}`);
    setGlobalStatus(`Lien de livraison de ${order.orderName} copié ✓`);
  }

  return <section className="admin-section orders-admin-section" id="commandes">
    <div className="orders-admin-heading">
      <div><span className="eyebrow">Production</span><h2>Commandes & livraison</h2><p>Socle universel Shopify/Stripe : créez la chanson, prévisualisez la page privée puis envoyez l’e-mail premium.</p></div>
      <button className="button orders-sync-button" type="button" onClick={syncOrders} disabled={syncing}>{syncing ? "Synchronisation…" : "Synchroniser Shopify"}</button>
    </div>

    <div className="orders-stats">
      <div><span>Total</span><strong>{stats.total}</strong></div>
      <div><span>À créer</span><strong>{stats.toCreate}</strong></div>
      <div><span>Révisions</span><strong>{stats.revisions}</strong></div>
      <div><span>Livrées</span><strong>{stats.delivered}</strong></div>
    </div>

    {error && <div className="orders-error">{error}</div>}
    {loading && <div className="orders-empty">Chargement des commandes…</div>}
    {!loading && !orders.length && <div className="orders-empty"><strong>Aucune commande synchronisée.</strong><span>Cliquez sur « Synchroniser Shopify » pour importer les commandes payées existantes.</span></div>}

    <div className="orders-list">
      {orders.map(order => {
        const a = order.answers || {};
        const busy = busyOrderId === order.id;
        const hasAudio = Boolean(order.deliveryFileName && order.deliveryUrl);
        return <article className={`order-card status-${order.productionStatus}`} key={order.id}>
          <div className="order-card-header">
            <div className="order-title-block"><span className="order-status-dot" /><div><div className="order-number-line"><h3>{order.orderName}</h3><span className={`payment-provider provider-${order.paymentProvider}`}>{order.paymentProvider}</span></div><p>{order.customerName || "Client"} · {order.email}</p></div></div>
            <select value={order.productionStatus} disabled={busy} onChange={event => changeStatus(order, event.target.value as OrderStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </div>

          <div className="order-meta-grid">
            <div><span>Montant</span><strong>{formatMoney(order.amountCents, order.currency)}</strong></div>
            <div><span>Formule</span><strong>{order.offerName || order.selectedOffer || a.offer || "—"}</strong></div>
            <div><span>Livraison</span><strong>{order.deliveryHours <= 24 ? "24 h" : `${Math.round(order.deliveryHours / 24)} jours`}</strong></div>
            <div><span>Échéance</span><strong>{deadlineFor(order)}</strong></div>
          </div>

          <details className="order-brief-details">
            <summary>Voir le brief client complet</summary>
            <div className="order-answers-grid">
              <div><span>Destinataire</span><p>{a.recipientName || "—"}</p></div>
              <div><span>Relation</span><p>{a.relation || "—"}</p></div>
              <div><span>Style & voix</span><p>{a.genre || "—"} · {a.voice || "—"}</p></div>
              <div><span>Prononciation</span><p>{a.pronunciation || "—"}</p></div>
              <div className="wide"><span>Qualités</span><p>{a.qualities?.join(", ") || a.customQualities || "—"}</p></div>
              <div className="wide"><span>Souvenirs</span><p>{a.memories || "—"}</p></div>
              <div className="wide"><span>Message</span><p>{a.message || "—"}</p></div>
            </div>
          </details>

          <div className="order-action-row">
            <button type="button" onClick={() => copyBrief(order)}>Copier le brief</button>
            {order.paymentProvider === "stripe" && <button type="button" onClick={() => sendOrderConfirmation(order, true)} disabled={busy}>Tester confirmation</button>}
            {order.paymentProvider === "stripe" && <button type="button" onClick={() => sendOrderConfirmation(order)} disabled={busy}>Renvoyer confirmation</button>}
            <label className="order-upload-button">{hasAudio ? "Remplacer le MP3" : "Ajouter le MP3"}<input type="file" accept="audio/*,.mp3,.wav,.m4a" disabled={busy} onChange={event => uploadSong(order, event.target.files?.[0])} /></label>
            {hasAudio && <a href={`${order.deliveryUrl}?preview=1`} target="_blank" rel="noreferrer">Prévisualiser</a>}
            {hasAudio && <button type="button" onClick={() => copyDeliveryLink(order)}>Copier le lien</button>}
          </div>

          {hasAudio && <div className="premium-delivery-panel order-delivery-panel">
            <div className="order-delivery-file"><span className="order-music-icon">♪</span><div><strong>{order.deliveryFileName}</strong><span>Page privée personnalisée prête</span></div></div>
            <div className="order-delivery-buttons"><button type="button" onClick={() => sendTestEmail(order)} disabled={busy}>Envoyer un test</button><button type="button" className="primary" onClick={() => sendDeliveryEmail(order)} disabled={busy}>{order.deliveryEmailCount ? "Renvoyer l’e-mail" : order.revisionCount ? "Envoyer la nouvelle version" : "Envoyer la chanson"}</button></div>
            <div className="order-delivery-timeline">
              <div className={order.deliveryEmailSentAt ? "done" : ""}><span>1</span><strong>E-mail</strong><small>{order.deliveryEmailSentAt ? formatDate(order.deliveryEmailSentAt, true) : "Non envoyé"}</small></div>
              <div className={order.deliveryViewedAt ? "done" : ""}><span>2</span><strong>Page consultée</strong><small>{order.deliveryViewedAt ? formatDate(order.deliveryViewedAt, true) : "En attente"}</small></div>
              <div className={order.deliveryDownloadedAt ? "done" : ""}><span>3</span><strong>Téléchargement</strong><small>{order.deliveryDownloadedAt ? formatDate(order.deliveryDownloadedAt, true) : "En attente"}</small></div>
            </div>
          </div>}

          {!!order.revisions.length && <section className="order-revisions-panel">
            <div className="order-revisions-heading"><div><span>Demandes client</span><strong>Révisions</strong></div><small>{order.revisionCount} demande(s)</small></div>
            <div className="order-revision-list">{order.revisions.map(revision => <article key={revision.id}>
              <div className="order-revision-top"><div><span>{revisionTypeLabels[revision.revisionType] || revision.revisionType}</span><strong>{formatDate(revision.createdAt, true)}</strong></div><select value={revision.status} disabled={busy} onChange={event => changeRevisionStatus(order, revision, event.target.value as RevisionStatus)}>{Object.entries(revisionStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <p>{revision.message}</p>{revision.songMoment && <small>Moment concerné : {revision.songMoment}</small>}
            </article>)}</div>
          </section>}
        </article>;
      })}
    </div>
  </section>;
}
