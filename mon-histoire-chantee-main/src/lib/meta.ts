const META_PIXEL_ID = "1544240104114351";
const META_SCRIPT_URL = "https://connect.facebook.net/en_US/fbevents.js";
const EVENT_STORAGE_PREFIX = "mhc_meta_event:";

type MetaEventParams = Record<string, string | number | boolean | Array<string> | Array<Record<string, string | number>>>;
type DedupeScope = "page" | "session";

interface FbqFunction {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  push?: FbqFunction;
  loaded?: boolean;
  version?: string;
}

declare global {
  interface Window {
    fbq?: FbqFunction;
    _fbq?: FbqFunction;
  }
}

let initialized = false;
const pageEvents = new Set<string>();
const pendingKeys = new Set<string>();
const pendingEvents: Array<{
  method: "track" | "trackCustom";
  eventName: string;
  params: MetaEventParams;
  dedupeKey: string;
  scope: DedupeScope;
  eventId?: string;
}> = [];

function createFbq() {
  if (window.fbq) return window.fbq;

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue?.push(args);
  } as FbqFunction;

  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = META_SCRIPT_URL;
  const firstScript = document.getElementsByTagName("script")[0];
  firstScript?.parentNode?.insertBefore(script, firstScript);

  return fbq;
}

function canTrack(consentRequired: boolean) {
  if (!consentRequired) return true;
  return window.localStorage.getItem("mhc_tracking_consent") === "accepted";
}

export function setupMetaPixel(consentRequired: boolean) {
  if (typeof window === "undefined" || initialized || !canTrack(consentRequired)) return false;

  const fbq = createFbq();
  fbq("init", META_PIXEL_ID);
  fbq("track", "PageView");
  initialized = true;

  const queued = pendingEvents.splice(0);
  pendingKeys.clear();
  queued.forEach(event => sendEvent(event.method, event.eventName, event.params, event.dedupeKey, event.scope, event.eventId));
  return true;
}

function alreadySent(key: string, scope: DedupeScope) {
  if (scope === "page") return pageEvents.has(key);
  return window.sessionStorage.getItem(`${EVENT_STORAGE_PREFIX}${key}`) === "1";
}

function markSent(key: string, scope: DedupeScope) {
  if (scope === "page") pageEvents.add(key);
  else window.sessionStorage.setItem(`${EVENT_STORAGE_PREFIX}${key}`, "1");
}

function createEventId(key: string) {
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);
  const random = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}_${Math.random()}`;
  return `mhc_${safeKey}_${random}`;
}

function sendEvent(
  method: "track" | "trackCustom",
  eventName: string,
  params: MetaEventParams,
  dedupeKey: string,
  scope: DedupeScope,
  eventId?: string
) {
  if (!window.fbq || alreadySent(dedupeKey, scope)) return false;

  window.fbq(method, eventName, params, { eventID: eventId || createEventId(dedupeKey) });
  markSent(dedupeKey, scope);
  return true;
}

function track(
  method: "track" | "trackCustom",
  eventName: string,
  params: MetaEventParams,
  dedupeKey: string,
  scope: DedupeScope,
  eventId?: string
) {
  if (alreadySent(dedupeKey, scope)) return false;

  if (!initialized || !window.fbq) {
    if (!pendingKeys.has(dedupeKey)) {
      pendingKeys.add(dedupeKey);
      pendingEvents.push({ method, eventName, params, dedupeKey, scope, eventId });
    }
    return false;
  }

  return sendEvent(method, eventName, params, dedupeKey, scope, eventId);
}

export function trackMetaEvent(
  eventName: "ViewContent" | "Lead" | "AddToCart" | "InitiateCheckout" | "Purchase",
  params: MetaEventParams,
  dedupeKey: string,
  scope: DedupeScope = "session",
  eventId?: string
) {
  return track("track", eventName, params, dedupeKey, scope, eventId);
}

export function trackMetaCustomEvent(
  eventName: string,
  params: MetaEventParams,
  dedupeKey: string,
  scope: DedupeScope = "session",
  eventId?: string
) {
  return track("trackCustom", eventName, params, dedupeKey, scope, eventId);
}
