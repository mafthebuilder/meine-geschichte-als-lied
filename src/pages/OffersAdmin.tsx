import { useEffect, useState } from "react";
import type { OfferConfig, OffersConfig } from "../types";
import { DEFAULT_OFFERS_CONFIG, formatOfferPrice } from "../config/offers";

function eurosToCents(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export default function OffersAdmin({ token, onUnauthorized, setGlobalStatus }: {
  token: string;
  onUnauthorized: () => void;
  setGlobalStatus: (message: string) => void;
}) {
  const [config, setConfig] = useState<OffersConfig>(DEFAULT_OFFERS_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function request(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);
    headers.set("X-Admin-Token", token);
    headers.set("Content-Type", "application/json");
    const response = await fetch(path, { ...options, headers });
    const payload = await response.json() as { config?: OffersConfig; error?: string };
    if (response.status === 401) {
      onUnauthorized();
      throw new Error("Session administrateur expirée.");
    }
    if (!response.ok) throw new Error(payload.error || "Action impossible.");
    return payload;
  }

  useEffect(() => {
    let active = true;
    request("/api/admin/offers")
      .then(payload => {
        if (active && payload.config) setConfig(payload.config);
      })
      .catch(loadError => active && setError(loadError instanceof Error ? loadError.message : "Chargement impossible."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  function updateOffer(id: OfferConfig["id"], patch: Partial<OfferConfig>) {
    setConfig(current => ({
      ...current,
      offers: current.offers.map(offer => offer.id === id ? { ...offer, ...patch } : offer)
    }));
  }

  async function save() {
    setSaving(true);
    setError("");
    setGlobalStatus("Publication des offres…");
    try {
      const payload = await request("/api/admin/offers", {
        method: "PUT",
        body: JSON.stringify({ config })
      });
      if (payload.config) setConfig(payload.config);
      setGlobalStatus(`Offres publiées · version ${payload.config?.version || config.version} ✓`);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Publication impossible.";
      setError(message);
      setGlobalStatus(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <section className="admin-section"><p>Chargement des offres…</p></section>;

  return <section className="admin-section offers-admin-section">
    <div className="offers-admin-heading">
      <div>
        <span className="eyebrow">Configuration commerciale</span>
        <h2>Offres</h2>
        <p>Les prix publiés ici pilotent automatiquement le formulaire, Stripe, les délais et les droits de révision.</p>
      </div>
      <button className="button" type="button" onClick={save} disabled={saving}>{saving ? "Publication…" : "Publier les offres"}</button>
    </div>

    <div className="offers-admin-global">
      <label>Supplément Express
        <div className="money-input"><input type="number" min="0" step="0.01" value={config.expressPriceCents / 100} onChange={event => setConfig(current => ({ ...current, expressPriceCents: eurosToCents(event.target.value) }))} /><span>€</span></div>
      </label>
      <div><span>Version active</span><strong>v{config.version}</strong></div>
      <div><span>Offres actives</span><strong>{config.offers.filter(offer => offer.active).length} / 3</strong></div>
    </div>

    {error && <div className="orders-error">{error}</div>}

    <div className="offers-admin-grid">
      {config.offers.map(offer => <article className={`offer-admin-card ${offer.active ? "active" : "inactive"}`} key={offer.id}>
        <div className="offer-admin-card-top">
          <div><small>{offer.id}</small><strong>{offer.name || "Sans titre"}</strong><span>{formatOfferPrice(offer.priceCents)}</span></div>
          <label className="admin-toggle">
            <input type="checkbox" checked={offer.active} onChange={event => updateOffer(offer.id, { active: event.target.checked })} />
            <span aria-hidden="true" />
            <strong>{offer.active ? "Active" : "Inactive"}</strong>
          </label>
        </div>

        <div className="offer-admin-fields">
          <label>Titre<input value={offer.name} maxLength={60} onChange={event => updateOffer(offer.id, { name: event.target.value })} /></label>
          <label>Prix
            <div className="money-input"><input type="number" min="0.50" step="0.01" value={offer.priceCents / 100} onChange={event => updateOffer(offer.id, { priceCents: eurosToCents(event.target.value) })} /><span>€</span></div>
          </label>
          <label>Prix comparé
            <div className="money-input"><input type="number" min="0" step="0.01" placeholder="Aucun" value={offer.compareAtCents === null ? "" : offer.compareAtCents / 100} onChange={event => updateOffer(offer.id, { compareAtCents: event.target.value.trim() ? eurosToCents(event.target.value) : null })} /><span>€</span></div>
          </label>
          <label>Délai de livraison
            <select value={offer.deliveryHours} onChange={event => updateOffer(offer.id, { deliveryHours: Number(event.target.value) })}>
              <option value={24}>24 heures</option>
              <option value={48}>2 jours</option>
              <option value={72}>3 jours</option>
              <option value={96}>4 jours</option>
              <option value={120}>5 jours</option>
            </select>
          </label>
          <label>Nombre de révisions
            <input type="number" min={0} max={20} disabled={offer.revisionLimit === null} value={offer.revisionLimit ?? 0} onChange={event => updateOffer(offer.id, { revisionLimit: Math.max(0, Number(event.target.value) || 0) })} />
          </label>
          <label className="offer-checkbox"><input type="checkbox" checked={offer.revisionLimit === null} onChange={event => updateOffer(offer.id, { revisionLimit: event.target.checked ? null : 0 })} /> Révisions illimitées</label>
          <label className="offer-checkbox"><input type="checkbox" checked={offer.expressEligible} onChange={event => updateOffer(offer.id, { expressEligible: event.target.checked })} /> Option Express disponible</label>
          <label className="offer-checkbox"><input type="checkbox" checked={offer.recommended} onChange={event => updateOffer(offer.id, { recommended: event.target.checked })} /> Badge « Recommandée »</label>
          <label className="wide">Ce qui est compris <small>Une ligne par avantage</small>
            <textarea rows={6} value={offer.benefits.join("\n")} onChange={event => updateOffer(offer.id, { benefits: event.target.value.split("\n") })} />
          </label>
        </div>
      </article>)}
    </div>
  </section>;
}
