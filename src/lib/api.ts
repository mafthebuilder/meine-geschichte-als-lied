import { defaultContent } from "../config/defaultContent";
import type { FunnelAnswers, OfferId, OffersConfig, SiteContent } from "../types";

function mergeDeep<T>(base: T, override: unknown): T {
  if (!override || typeof override !== "object") return base;
  if (Array.isArray(base)) {
    if (!Array.isArray(override)) return base;
    return base.map((item, index) => index < override.length ? mergeDeep(item, override[index]) : item) as T;
  }

  const result = structuredClone(base) as Record<string, unknown>;
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    const current = result[key];
    if (current && typeof current === "object" && !Array.isArray(current) && value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = mergeDeep(current, value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

async function parseApiResponse<T>(response: Response, fallback: string): Promise<T> {
  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || fallback);
  return data;
}

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const response = await fetch("/api/content");
    if (!response.ok) return defaultContent;
    const data = await response.json() as { content?: Partial<SiteContent> };
    return mergeDeep(defaultContent, data.content);
  } catch {
    return defaultContent;
  }
}


export async function getOffersConfig(): Promise<OffersConfig> {
  const response = await fetch("/api/offers");
  return parseApiResponse<{ config: OffersConfig }>(response, "Die Pakete sind momentan nicht verfügbar.").then(result => result.config);
}

export async function saveSubmission(id: string, answers: FunnelAnswers, stage: "progress" | "form_completed" = "progress") {
  const response = await fetch("/api/submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, answers, stage })
  });
  if (!response.ok) throw new Error("Deine Angaben konnten nicht gespeichert werden.");
}

export async function validatePromoCode(input: {
  code: string;
  offer: OfferId;
  express: boolean;
}) {
  const response = await fetch("/api/promo/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  return parseApiResponse<{
    valid: true;
    code: string;
    percent: number;
    discountCents: number;
    amountCents: number;
  }>(response, "Dieser Rabattcode ist ungültig.");
}

export async function createStripePaymentIntent(input: {
  submissionId: string;
  offer: OfferId;
  offerConfigVersion: number;
  express: boolean;
  email: string;
  promoCode?: string;
  paymentIntentId?: string;
  fbp?: string;
  fbc?: string;
  sourceUrl?: string;
}) {
  const response = await fetch("/api/stripe/payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  return parseApiResponse<{
    clientSecret: string;
    publishableKey: string;
    paymentIntentId: string;
    amountCents: number;
    testMode: boolean;
  }>(response, "Die sichere Zahlung ist momentan nicht verfügbar.");
}

export async function getStripePaymentStatus(paymentIntentId: string, submissionId: string) {
  const params = new URLSearchParams({ paymentIntentId, submissionId });
  const response = await fetch(`/api/stripe/payment-status?${params.toString()}`);
  return parseApiResponse<{ status: string; paymentIntentId: string }>(response, "Die Zahlung konnte nicht überprüft werden.");
}

export async function getResumeSubmission(token: string): Promise<{ submissionId: string; answers: FunnelAnswers }> {
  const response = await fetch(`/api/resume/${encodeURIComponent(token)}`);
  const data = await response.json() as { submissionId?: string; answers?: FunnelAnswers; error?: string };
  if (!response.ok || !data.submissionId || !data.answers) throw new Error(data.error || "Dein Entwurf konnte nicht wiederhergestellt werden.");
  return { submissionId: data.submissionId, answers: data.answers };
}
