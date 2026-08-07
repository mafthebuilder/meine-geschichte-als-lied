export type OfferId = "essential" | "premium";

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
    title: string;
    subtitle: string;
    duration: string;
  };
  faq: Array<{ question: string; answer: string }>;
  finalCta: { title: string; text: string; cta: string };
  offers: {
    essential: { name: string; price: string; benefits: string[] };
    premium: { name: string; price: string; benefits: string[] };
    expressPrice: string;
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
