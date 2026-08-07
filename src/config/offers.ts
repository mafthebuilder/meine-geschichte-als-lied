import type { OfferConfig, OfferId, OffersConfig } from "../types";

export const DEFAULT_OFFERS_CONFIG: OffersConfig = {
  version: 1,
  expressPriceCents: 490,
  offers: [
    {
      id: "discovery",
      active: true,
      name: "Découverte",
      priceCents: 990,
      compareAtCents: null,
      benefits: ["Chanson personnalisée", "Livraison sous 4 jours", "Aucune révision incluse"],
      revisionLimit: 0,
      deliveryHours: 96,
      recommended: false,
      expressEligible: true
    },
    {
      id: "essential",
      active: true,
      name: "Essentiel",
      priceCents: 1490,
      compareAtCents: 5090,
      benefits: ["Chanson personnalisée", "Livraison sous 4 jours", "1 révision offerte"],
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
      benefits: ["Chanson personnalisée", "Livraison prioritaire sous 24 h", "Révisions illimitées"],
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
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}
