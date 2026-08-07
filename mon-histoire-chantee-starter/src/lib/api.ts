import { defaultContent } from "../config/defaultContent";
import type { FunnelAnswers, SiteContent } from "../types";

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const response = await fetch("/api/content");
    if (!response.ok) return defaultContent;
    const data = await response.json() as { content?: SiteContent };
    return data.content ?? defaultContent;
  } catch {
    return defaultContent;
  }
}

export async function saveSubmission(id: string, answers: FunnelAnswers) {
  const response = await fetch("/api/submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, answers })
  });
  if (!response.ok) throw new Error("Impossible d’enregistrer vos réponses.");
}

export async function createCheckout(id: string, answers: FunnelAnswers) {
  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ submissionId: id, offer: answers.offer, express: answers.express, email: answers.email })
  });
  const data = await response.json() as { checkoutUrl?: string; error?: string };
  if (!response.ok || !data.checkoutUrl) throw new Error(data.error ?? "Checkout indisponible.");
  return data.checkoutUrl;
}
