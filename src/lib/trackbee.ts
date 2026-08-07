const TRACKBEE_STORAGE_KEY = "_tb_link_decoration_params";

const TRACKING_QUERY_KEYS = new Set([
  "fbclid",
  "gclid",
  "gbraid",
  "wbraid",
  "ttclid",
  "msclkid",
  "twclid",
  "sccid",
  "epik",
  "dclid",
  "yclid",
  "li_fat_id",
  "irclickid"
]);

function isTrackingQueryKey(key: string) {
  const normalizedKey = key.toLowerCase();
  return normalizedKey.startsWith("utm_") || TRACKING_QUERY_KEYS.has(normalizedKey);
}

function addValue(target: URLSearchParams, key: string, value: unknown) {
  if (!key || target.has(key)) return;
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") return;

  const normalizedValue = String(value).trim();
  if (normalizedValue) target.set(key, normalizedValue);
}

function addStoredTrackBeeParams(target: URLSearchParams) {
  try {
    const stored = window.localStorage.getItem(TRACKBEE_STORAGE_KEY);
    if (!stored) return;

    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;

    for (const [key, value] of Object.entries(parsed)) {
      addValue(target, key, value);
    }
  } catch (error) {
    console.warn("TrackBee stored parameters could not be read:", error);
  }
}

/**
 * Adds the attribution parameters captured by TrackBee to the Shopify checkout URL.
 * The checkout URL is created asynchronously, so it is not present in the DOM for
 * TrackBee's link-decoration script to update as a normal anchor link.
 */
export function decorateCheckoutUrl(checkoutUrl: string) {
  if (typeof window === "undefined") return checkoutUrl;

  try {
    const decoratedUrl = new URL(checkoutUrl, window.location.href);

    addStoredTrackBeeParams(decoratedUrl.searchParams);

    // Fallback for a very fast click before the deferred TrackBee script has
    // persisted the landing-page parameters in localStorage.
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.forEach((value, key) => {
      if (isTrackingQueryKey(key)) addValue(decoratedUrl.searchParams, key, value);
    });

    return decoratedUrl.toString();
  } catch (error) {
    console.warn("TrackBee checkout decoration failed:", error);
    return checkoutUrl;
  }
}
