import { useEffect, useMemo, useRef, useState } from "react";
import type { FunnelAnswers, OfferConfig } from "../types";
import { createStripePaymentIntent, getStripePaymentStatus } from "../lib/api";
import { trackMetaEvent } from "../lib/meta";

interface StripePaymentProps {
  submissionId: string;
  answers: FunnelAnswers;
  total: number;
  recipientName: string;
  offer: OfferConfig;
  offerConfigVersion: number;
  expressPriceCents: number;
  promoCode?: string;
}

type StripePaymentIntent = { id: string; status: string };
type StripeConfirmResult = { error?: { message?: string }; paymentIntent?: StripePaymentIntent };
type StripeElement = {
  mount(target: HTMLElement): void;
  unmount(): void;
  destroy?(): void;
  on(eventName: string, handler: (event: Record<string, unknown>) => void): void;
};
type StripeElements = {
  create(type: "expressCheckout" | "payment", options?: Record<string, unknown>): StripeElement;
  submit(): Promise<{ error?: { message?: string } }>;
};
type StripeInstance = {
  elements(options: Record<string, unknown>): StripeElements;
  confirmPayment(options: Record<string, unknown>): Promise<StripeConfirmResult>;
};
type StripeFactory = (publishableKey: string) => StripeInstance;

declare global {
  interface Window {
    Stripe?: StripeFactory;
  }
}

let stripeScriptPromise: Promise<void> | null = null;

function loadStripeScript() {
  if (window.Stripe) return Promise.resolve();
  if (stripeScriptPromise) return stripeScriptPromise;
  stripeScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://js.stripe.com/v3/"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Stripe konnte nicht geladen werden.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Stripe konnte nicht geladen werden."));
    document.head.appendChild(script);
  });
  return stripeScriptPromise;
}

function readCookie(name: string) {
  const prefix = `${name}=`;
  const part = document.cookie.split(";").map(value => value.trim()).find(value => value.startsWith(prefix));
  return part ? decodeURIComponent(part.slice(prefix.length)) : "";
}

function billingNameFromEmail(email: string) {
  const localPart = email.split("@")[0] || "";
  const readableName = localPart
    .replace(/\+.*$/, "")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return readableName.slice(0, 80) || "Kunde Meine Geschichte als Lied";
}

function readAttribution() {
  try {
    return JSON.parse(localStorage.getItem("mhc_attribution") || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function metaIdentifiers() {
  const attribution = readAttribution();
  const fbclid = attribution.fbclid || new URLSearchParams(window.location.search).get("fbclid") || "";
  return {
    fbp: readCookie("_fbp"),
    fbc: readCookie("_fbc") || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : "")
  };
}

function paymentContent(answers: FunnelAnswers, total: number, offer: OfferConfig, expressPriceCents: number) {
  const contents = [
    { id: `personalisiertes_lied_${answers.offer}`, quantity: 1, item_price: offer.priceCents / 100 },
    ...(answers.express ? [{ id: "express_lieferung_24h", quantity: 1, item_price: expressPriceCents / 100 }] : [])
  ];
  return {
    content_name: `Personalisiertes Lied ${offer.name}`,
    content_category: "Personalisiertes Lied",
    content_ids: contents.map(item => item.id),
    contents,
    content_type: "product",
    num_items: contents.length,
    value: total,
    currency: "EUR"
  };
}

export default function StripePayment({ submissionId, answers, total, recipientName, offer, offerConfigVersion, expressPriceCents, promoCode = "" }: StripePaymentProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const expressRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const stripeRef = useRef<StripeInstance | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const mountedElementsRef = useRef<StripeElement[]>([]);
  const intentIdRef = useRef("");
  const activated = true;
  const [clientSecret, setClientSecret] = useState("");
  const [publishableKey, setPublishableKey] = useState("");
  const [intentId, setIntentId] = useState("");
  const [walletVisible, setWalletVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [returnCheckComplete, setReturnCheckComplete] = useState(false);

  const amountCents = Math.round(total * 100);
  const paymentParams = useMemo(() => paymentContent(answers, total, offer, expressPriceCents), [answers.offer, answers.express, total, offer, expressPriceCents]);


  useEffect(() => {
    if (!activated || success) return;
    const redirectedIntent = new URLSearchParams(window.location.search).get("payment_intent");
    if (!redirectedIntent) return;
    let cancelled = false;
    setLoadingIntent(true);
    intentIdRef.current = redirectedIntent;
    let retryPayment = false;
    getStripePaymentStatus(redirectedIntent, submissionId)
      .then(result => {
        if (cancelled) return;
        window.history.replaceState({}, "", "/composer");
        if (result.status === "succeeded") completePayment(redirectedIntent);
        else retryPayment = true;
      })
      .catch(() => {
        if (!cancelled) {
          window.history.replaceState({}, "", "/composer");
          retryPayment = true;
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingIntent(false);
          if (retryPayment) setReturnCheckComplete(true);
        }
      });
    return () => { cancelled = true; };
  }, [activated, submissionId, success]);

  useEffect(() => {
    if (!activated || success || loadingIntent) return;
    const redirectedIntent = new URLSearchParams(window.location.search).get("payment_intent");
    if (redirectedIntent && !returnCheckComplete) return;
    let cancelled = false;
    async function preparePayment() {
      setLoadingIntent(true);
      setReady(false);
      setError("");
      try {
        const identifiers = metaIdentifiers();
        const result = await createStripePaymentIntent({
          submissionId,
          offer: answers.offer,
          offerConfigVersion,
          express: answers.express,
          email: answers.email,
          promoCode,
          paymentIntentId: intentIdRef.current,
          fbp: identifiers.fbp,
          fbc: identifiers.fbc,
          sourceUrl: window.location.href
        });
        if (cancelled) return;
        intentIdRef.current = result.paymentIntentId;
        setIntentId(result.paymentIntentId);
        setClientSecret(result.clientSecret);
        setPublishableKey(result.publishableKey);
        setTestMode(result.testMode);
        trackMetaEvent("InitiateCheckout", paymentParams, `initiate_checkout:stripe:${submissionId}`, "session", `initiate_checkout:stripe:${submissionId}`);
      } catch (intentError) {
        if (!cancelled) setError(intentError instanceof Error ? intentError.message : "Die sichere Zahlung ist gerade nicht verfügbar. Bitte versuche es gleich noch einmal.");
      } finally {
        if (!cancelled) setLoadingIntent(false);
      }
    }
    void preparePayment();
    return () => { cancelled = true; };
  }, [activated, answers.offer, answers.express, answers.email, submissionId, offerConfigVersion, promoCode, success, returnCheckComplete]);

  useEffect(() => {
    if (!clientSecret || !publishableKey || success) return;
    let cancelled = false;
    async function mountElements() {
      setReady(false);
      setWalletVisible(false);
      setError("");
      await loadStripeScript();
      if (cancelled || !window.Stripe || !expressRef.current || !cardRef.current) return;
      mountedElementsRef.current.forEach(element => {
        try { element.unmount(); } catch { /* noop */ }
        try { element.destroy?.(); } catch { /* noop */ }
      });
      mountedElementsRef.current = [];
      expressRef.current.innerHTML = "";
      cardRef.current.innerHTML = "";

      const stripe = window.Stripe(publishableKey);
      const elements = stripe.elements({
        clientSecret,
        locale: "de",
        appearance: {
          theme: "flat",
          variables: {
            colorPrimary: "#8b3157",
            colorBackground: "#ffffff",
            colorText: "#2c2023",
            colorDanger: "#a5314a",
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontSizeBase: "16px",
            borderRadius: "15px",
            spacingUnit: "5px"
          },
          rules: {
            ".Input": { border: "1px solid #e3d6d9", boxShadow: "0 8px 22px rgba(70,37,48,.06)", padding: "15px 16px" },
            ".Input:focus": { border: "1px solid #9e3a62", boxShadow: "0 0 0 3px rgba(158,58,98,.12)" },
            ".Label": { color: "#4c3a40", fontWeight: "650", marginBottom: "8px" },
            ".Tab": { border: "1px solid #e3d6d9", boxShadow: "none" },
            ".Tab--selected": { border: "1px solid #8b3157", boxShadow: "0 0 0 2px rgba(139,49,87,.1)" }
          }
        }
      });
      stripeRef.current = stripe;
      elementsRef.current = elements;

      const express = elements.create("expressCheckout", {
        billingAddressRequired: false,
        shippingAddressRequired: false,
        emailRequired: false,
        phoneNumberRequired: false,
        buttonHeight: 55,
        buttonType: { applePay: "check-out", googlePay: "checkout" },
        paymentMethods: {
          applePay: "auto",
          googlePay: "auto",
          link: "never",
          paypal: "never",
          amazonPay: "never",
          klarna: "never"
        }
      });
      express.on("availablepaymentmethodschange", event => {
        const methods = event.paymentMethods as Record<string, { available?: boolean }> | null | undefined;
        setWalletVisible(Boolean(methods && Object.values(methods).some(method => method?.available)));
      });
      express.on("confirm", event => { void confirmPayment("wallet", event); });
      express.mount(expressRef.current);

      const card = elements.create("payment", {
        layout: { type: "accordion", defaultCollapsed: false, radios: "never", spacedAccordionItems: false },
        wallets: { applePay: "never", googlePay: "never", link: "never" },
        fields: {
          billingDetails: { name: "never", email: "never", address: "if_required" }
        }
      });
      card.on("ready", () => setReady(true));
      card.mount(cardRef.current);
      mountedElementsRef.current = [express, card];
    }
    void mountElements().catch(mountError => !cancelled && setError(mountError instanceof Error ? mountError.message : "Das Zahlungsmodul konnte nicht geladen werden."));
    return () => { cancelled = true; };
  }, [clientSecret, publishableKey, amountCents, success]);

  useEffect(() => () => {
    mountedElementsRef.current.forEach(element => {
      try { element.unmount(); } catch { /* noop */ }
      try { element.destroy?.(); } catch { /* noop */ }
    });
  }, []);

  function completePayment(paymentIntentId: string) {
    const eventId = `purchase:stripe:${paymentIntentId}`;
    trackMetaEvent("Purchase", paymentParams, `purchase:${paymentIntentId}`, "session", eventId);
    setSuccess(true);
    setLoading(false);
    setError("");
    window.setTimeout(() => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 40);
  }

  async function confirmPayment(method: "wallet" | "card", walletEvent?: Record<string, unknown>) {
    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    if (!stripe || !elements || !clientSecret || loading) return;
    setLoading(true);
    setError("");
    try {
      if (method === "card") {
        const submitted = await elements.submit();
        if (submitted.error) throw new Error(submitted.error.message || "Prüfe bitte deine Zahlungsangaben.");
      }
      const result = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/composer`,
          payment_method_data: { billing_details: { name: billingNameFromEmail(answers.email), email: answers.email } }
        },
        redirect: "if_required"
      });
      if (result.error) throw new Error(result.error.message || "Die Zahlung konnte nicht bestätigt werden.");
      if (result.paymentIntent?.status === "succeeded") completePayment(result.paymentIntent.id);
      else throw new Error("Die Zahlung wird noch geprüft. Bitte aktualisiere die Seite in wenigen Augenblicken.");
    } catch (paymentError) {
      const message = paymentError instanceof Error ? paymentError.message : "Die Zahlung konnte nicht bestätigt werden.";
      const paymentFailed = walletEvent?.paymentFailed;
      if (method === "wallet" && typeof paymentFailed === "function") paymentFailed({ reason: "fail", message });
      setError(message);
      setLoading(false);
    }
  }

  return <section className={success ? "stripe-payment-shell success" : "stripe-payment-shell"} ref={sectionRef} aria-label="Sichere Zahlung">
    {success ? <div className="stripe-payment-success">
      <span className="stripe-success-icon">✓</span>
      <span className="eyebrow">Zahlung bestätigt</span>
      <h2>Dein Lied für <em>{recipientName}</em> ist jetzt in Arbeit.</h2>
      <p>Die Bestätigung geht an <strong>{answers.email}</strong>. Sobald dein Lied fertig ist, erhältst du dort deinen privaten Link.</p>
      <div className="stripe-success-details"><span>Sichere Bestellung</span><span>Persönlich erstellt</span><span>{answers.express || offer.deliveryHours <= 24 ? "Lieferung in 24 Std." : "Lieferung in 4 Tagen"}</span></div>
    </div> : <>
      <div className="stripe-payment-heading">
        <div><span className="eyebrow">Nur noch ein Schritt</span><h2>Dein Lied für {recipientName} kann jetzt entstehen</h2><p>Schließe deine Bestellung sicher ab. Danach beginnen wir mit der Erstellung deines persönlichen Liedes.</p></div>
        <div className="stripe-trust-badges" aria-label="Vertrauensmerkmale">
          <span className="stripe-secure-badge">🔒 Sicher mit Stripe</span>
          <span className="stripe-business-badge">✓ Verifiziertes Unternehmen</span>
          <span className="stripe-business-badge">✓ Kein Abo</span>
        </div>
      </div>

      {!activated && <div className="stripe-payment-placeholder"><span /><span /><span /><p>Sichere Zahlung wird geladen …</p></div>}
      {activated && loadingIntent && !clientSecret && <div className="stripe-payment-placeholder"><span /><span /><span /><p>Zahlung wird vorbereitet …</p></div>}

      {clientSecret && <div className={ready ? "stripe-payment-content ready" : "stripe-payment-content loading"}>
        <div className={walletVisible ? "stripe-wallet-zone visible" : "stripe-wallet-zone"}>
          <div ref={expressRef} />
        </div>
        {walletVisible && <div className="stripe-payment-divider"><span>oder mit Karte bezahlen</span></div>}
        <div className="stripe-card-zone">
          <div className="stripe-card-label"><strong>Kredit- oder Debitkarte</strong><span>Visa · Mastercard</span></div>
          <div className={ready ? "stripe-element-frame ready" : "stripe-element-frame"} ref={cardRef} />
          <button type="button" className="button stripe-card-submit" onClick={() => void confirmPayment("card")} disabled={!ready || loading || loadingIntent}>
            {loading ? <><i className="stripe-spinner" /> Zahlung läuft …</> : <>Jetzt sicher bestellen <span aria-hidden="true">✦</span></>}
          </button>
          <div className="stripe-micro-reassurance"><span>🔒 Sicher verschlüsselt</span><span>✓ Einmalzahlung · kein Abo</span><span>↩ Geld-zurück-Garantie</span></div>
        </div>
      </div>}

      {testMode && <div className="stripe-test-mode">Stripe-Testmodus aktiv</div>}
      {error && <div className="stripe-payment-error" role="alert">{error}</div>}
      {!error && intentId && <div className="stripe-payment-legal" aria-label="Akzeptierte Zahlungsmethoden">
        <img
          src="https://cdn.shopify.com/s/files/1/1094/5658/9138/files/payment-methods_result.avif?v=1785082552"
          alt="Akzeptierte Zahlungsmethoden"
          loading="eager"
          style={{ display: "block", width: "180px", maxWidth: "58%", height: "auto", margin: "0 auto", opacity: 0.86 }}
        />
      </div>}
    </>}
  </section>;
}
