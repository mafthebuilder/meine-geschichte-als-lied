type AnalyticsEventName =
  | "LandingPageView"
  | "MHCFormStarted"
  | "Lead"
  | "InitiateCheckout"
  | "Purchase";

type AnalyticsPayload = {
  submissionId?: string;
  value?: number;
  currency?: string;
  paymentProvider?: string;
  providerId?: string;
  metadata?: Record<string, unknown>;
};

const SESSION_KEY = "mhc_analytics_session_id";
const ATTRIBUTION_KEY = "mhc_attribution";
const SENT_PREFIX = "mhc_analytics_sent:";

function getSessionId() {
  let value = sessionStorage.getItem(SESSION_KEY);
  if (!value) {
    value = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    sessionStorage.setItem(SESSION_KEY, value);
  }
  return value;
}

function readAttribution() {
  try {
    return JSON.parse(localStorage.getItem(ATTRIBUTION_KEY) || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export function captureAttribution() {
  const params = new URLSearchParams(window.location.search);
  const current = readAttribution();
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "campaign_id", "adset_id", "ad_id", "fbclid"];
  let changed = false;
  keys.forEach(key => {
    const value = params.get(key);
    if (value) {
      current[key] = value;
      changed = true;
    }
  });
  if (changed) localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(current));
  return current;
}

export async function trackAnalyticsEvent(eventName: AnalyticsEventName, payload: AnalyticsPayload = {}, once = true) {
  const sessionId = getSessionId();
  const attribution = captureAttribution();
  const dedupeKey = `${eventName}:${payload.submissionId || sessionId}`;
  if (once && sessionStorage.getItem(`${SENT_PREFIX}${dedupeKey}`) === "1") return;

  const eventId = `browser:${dedupeKey}`;
  const body = {
    eventId,
    eventName,
    sessionId,
    submissionId: payload.submissionId || "",
    path: window.location.pathname,
    referrer: document.referrer,
    ...attribution,
    valueCents: typeof payload.value === "number" ? Math.round(payload.value * 100) : undefined,
    currency: payload.currency || "EUR",
    paymentProvider: payload.paymentProvider || "",
    providerId: payload.providerId || "",
    metadata: payload.metadata || {}
  };

  try {
    const response = await fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true
    });
    if (response.ok && once) sessionStorage.setItem(`${SENT_PREFIX}${dedupeKey}`, "1");
  } catch {
    // Analytics must never block the funnel.
  }
}
