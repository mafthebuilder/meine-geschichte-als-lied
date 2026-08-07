import { useEffect, useMemo, useState } from "react";

type FunnelRow = {
  key: string;
  label: string;
  count: number;
};

type DailyRow = { date: string; count: number; eventName: string };
type CampaignRow = { campaign: string; source: string; views: number; starts: number; leads: number; checkouts: number; purchases: number };

type AnalyticsData = {
  funnel: FunnelRow[];
  revenueCents: number;
  averageOrderCents: number;
  paidOrders: number;
  daily: DailyRow[];
  campaigns: CampaignRow[];
  note?: string;
};

function money(cents: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format((cents || 0) / 100);
}

export default function AnalyticsAdmin({ token, onUnauthorized }: { token: string; onUnauthorized: () => void }) {
  const [days, setDays] = useState("30");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/analytics?days=${encodeURIComponent(days)}`, { headers: { "X-Admin-Token": token } });
      if (response.status === 401) return onUnauthorized();
      const payload = await response.json() as AnalyticsData & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Chargement impossible.");
      setData(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [days]);

  const maxDaily = useMemo(() => Math.max(1, ...(data?.daily || []).map(item => item.count)), [data]);

  return <section className="admin-section analytics-admin-section" id="analytics">
    <div className="analytics-heading">
      <div><span className="eyebrow">Pilotage CRO</span><h2>Analytics du funnel</h2><p>Mesure interne D1, indépendante de Meta, Shopify et du futur paiement Stripe.</p></div>
      <label>Période
        <select value={days} onChange={event => setDays(event.target.value)}>
          <option value="7">7 derniers jours</option>
          <option value="30">30 derniers jours</option>
          <option value="90">90 derniers jours</option>
          <option value="all">Depuis le début</option>
        </select>
      </label>
    </div>

    {error && <div className="orders-error">{error}</div>}
    {loading && <div className="orders-empty">Chargement des données…</div>}

    {!loading && data && <>
      <div className="analytics-money-grid">
        <article><span>Chiffre d’affaires</span><strong>{money(data.revenueCents)}</strong></article>
        <article><span>Commandes payées</span><strong>{data.paidOrders}</strong></article>
        <article><span>Panier moyen</span><strong>{money(data.averageOrderCents)}</strong></article>
        <article><span>Conversion visite → achat</span><strong>{data.funnel[0]?.count ? `${((data.paidOrders / data.funnel[0].count) * 100).toFixed(2)} %` : "—"}</strong></article>
      </div>

      <div className="analytics-funnel">
        {data.funnel.map((row, index) => {
          const previous = index > 0 ? data.funnel[index - 1].count : 0;
          const stepRate = previous ? (row.count / previous) * 100 : 0;
          const globalRate = data.funnel[0]?.count ? (row.count / data.funnel[0].count) * 100 : 0;
          return <article key={row.key}>
            <div><span>{String(index + 1).padStart(2, "0")}</span><strong>{row.label}</strong></div>
            <b>{row.count}</b>
            <small>{index === 0 ? "Base" : `${stepRate.toFixed(1)} % depuis l’étape précédente`} · {globalRate.toFixed(1)} % global</small>
          </article>;
        })}
      </div>

      <div className="analytics-grid-two">
        <section className="analytics-panel">
          <div className="analytics-panel-title"><div><span>Activité</span><h3>Événements par jour</h3></div></div>
          <div className="analytics-bars">
            {(data.daily || []).slice(-21).map((item, index) => <div key={`${item.date}-${item.eventName}-${index}`} title={`${item.date} · ${item.eventName}: ${item.count}`}>
              <span style={{ height: `${Math.max(5, (item.count / maxDaily) * 100)}%` }} />
              <small>{new Date(`${item.date}T12:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}</small>
            </div>)}
            {!data.daily.length && <p>Aucun événement enregistré sur cette période.</p>}
          </div>
        </section>

        <section className="analytics-panel">
          <div className="analytics-panel-title"><div><span>Attribution</span><h3>Campagnes principales</h3></div></div>
          <div className="analytics-campaign-table">
            <div className="analytics-campaign-head"><span>Campagne</span><span>Vues</span><span>Leads</span><span>Checkout</span></div>
            {data.campaigns.map((item, index) => <div key={`${item.campaign}-${index}`}>
              <span><strong>{item.campaign || "Sans UTM"}</strong><small>{item.source || "direct"}</small></span>
              <b>{item.views}</b><b>{item.leads}</b><b>{item.checkouts}</b>
            </div>)}
            {!data.campaigns.length && <p>Aucune campagne attribuée sur cette période.</p>}
          </div>
        </section>
      </div>

      {data.note && <p className="analytics-note">{data.note}</p>}
    </>}
  </section>;
}
