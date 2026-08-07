import type { OfferConfig, OfferId, OffersConfig } from "../types";

export const DEFAULT_OFFERS_CONFIG: OffersConfig = {
  version: 1,
  expressPriceCents: 490,
  offers: [
    {
      id: "discovery",
      active: true,
      name: "Starter",
      priceCents: 990,
      compareAtCents: null,
      benefits: ["Persönliches Lied", "Lieferung innerhalb von 4 Tagen", "Keine Überarbeitung inklusive"],
      revisionLimit: 0,
      deliveryHours: 96,
      recommended: false,
      expressEligible: true
    },
    {
      id: "essential",
      active: true,
      name: "Basis",
      priceCents: 1490,
      compareAtCents: 5090,
      benefits: ["Persönliches Lied", "Lieferung innerhalb von 4 Tagen", "1 Überarbeitung inklusive"],
      revisionLimit: 1,
      deliveryHours: 96,
      recommended: false,
      expressEligible: true
    },
    {
      id: "premium",
      active: true,
      name: "Premium",
      priceCents: 2490,
      compareAtCents: 8390,
      benefits: ["Persönliches Lied", "Priorisierte Lieferung innerhalb von 24 Std.", "Unbegrenzte Überarbeitungen"],
      revisionLimit: null,
      deliveryHours: 24,
      recommended: true,
      expressEligible: false
    }
  ]
};

export function activeOffers(config: OffersConfig) {
  return config.offers.filter(offer => offer.active);
}

export function findOffer(config: OffersConfig, id: OfferId | string): OfferConfig {
  return config.offers.find(offer => offer.id === id)
    || activeOffers(config)[0]
    || DEFAULT_OFFERS_CONFIG.offers[1];
}

export function formatOfferPrice(cents: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}
