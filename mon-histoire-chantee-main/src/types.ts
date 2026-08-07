export type OfferId = "discovery" | "essential" | "premium";

export interface OfferConfig {
  id: OfferId;
  active: boolean;
  name: string;
  priceCents: number;
  compareAtCents: number | null;
  benefits: string[];
  revisionLimit: number | null;
  deliveryHours: number;
  recommended: boolean;
  expressEligible: boolean;
}

export interface OffersConfig {
  version: number;
  expressPriceCents: number;
  offers: OfferConfig[];
  updatedAt?: string;
}

export interface SiteContent {
  brand: {
    name: string;
    supportEmail: string;
    colors: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
      accent: string;
    };
  };
  announcement: string;
  privacy: {
    cookieBannerEnabled: boolean;
    text: string;
    acceptLabel: string;
    rejectLabel: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    cta: string;
    video: string;
  };
  howItWorks: Array<{ title: string; text: string }>;
  comparison: Array<{ icon: string; title: string; duration: string; featured?: boolean }>;
  occasions: Array<{ title: string; image: string }>;
  songPreview: {
    eyebrow: string;
    title: string;
    subtitle: string;
    duration: string;
    audio: string;
  };
  faq: Array<{ question: string; answer: string }>;
  finalCta: { title: string; text: string; cta: string };
  offers: {
    essential: { name: string; price: string; benefits: string[] };
    premium: { name: string; price: string; benefits: string[] };
    expressPrice: string;
  };
  funnel: {
    audioReviews: Array<{ name: string; country: string; title: string; occasion: string; quote: string; video: string; audio: string; duration: string }>;
  };
}

export interface FunnelAnswers {
  relation: string;
  recipientName: string;
  pronunciation: string;
  genre: string;
  voice: string;
  qualities: string[];
  customQualities: string;
  memories: string;
  message: string;
  offer: OfferId;
  express: boolean;
  email: string;
  consent: boolean;
}
