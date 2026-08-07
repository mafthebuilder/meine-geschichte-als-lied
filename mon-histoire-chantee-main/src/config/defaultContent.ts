import type { SiteContent } from "../types";

export const defaultContent: SiteContent = {
  brand: {
    name: "Mon Histoire Chantée",
    supportEmail: "contact@monhistoirechantee.com",
    colors: {
      primary: "#6f3345",
      secondary: "#f0d9d9",
      background: "#fffaf6",
      text: "#2c2023",
      accent: "#c79b62"
    }
  },
  announcement: "-70% aujourd’hui · Livraison rapide",
  privacy: {
    cookieBannerEnabled: false,
    text: "Nous utilisons des traceurs pour mesurer les performances publicitaires et améliorer votre expérience.",
    acceptLabel: "Tout accepter",
    rejectLabel: "Continuer sans accepter"
  },
  hero: {
    eyebrow: "Une chanson créée à partir de votre histoire",
    title: "Le cadeau qui fait revivre vos plus beaux souvenirs.",
    description: "Racontez-nous les moments qui comptent. Nous les transformons en une chanson unique, écrite pour la personne que vous aimez.",
    cta: "Créer ma chanson",
    video: "/media/videos/hero-couple.mp4"
  },
  howItWorks: [
    { title: "Racontez votre histoire", text: "Répondez à quelques questions sur la personne, vos souvenirs et le message à transmettre." },
    { title: "Nous créons sa chanson", text: "Votre histoire devient des paroles et une ambiance musicale entièrement personnalisées." },
    { title: "Recevez-la par e-mail", text: "Sous 4 jours, votre chanson est prête à écouter, télécharger et partager." }
  ],
  comparison: [
    { icon: "💐", title: "Un bouquet", duration: "Quelques jours" },
    { icon: "🍽️", title: "Un dîner", duration: "Une soirée" },
    { icon: "🎵", title: "Sa propre chanson", duration: "Un souvenir pour toujours", featured: true }
  ],
  occasions: [
    { title: "Votre partenaire", image: "/media/images/couple.jpg" },
    { title: "Vos parents", image: "/media/images/mother.jpg" },
    { title: "Vos enfants", image: "/media/images/child.jpg" },
    { title: "Un mariage", image: "/media/images/wedding.jpg" },
    { title: "Un anniversaire", image: "/media/images/birthday.jpg" },
    { title: "Un hommage", image: "/media/images/tribute.jpg" }
  ],
  songPreview: {
    eyebrow: "Votre chanson personnalisée",
    title: "Une histoire devenue chanson",
    subtitle: "Écoutez un extrait créé à partir d’une véritable histoire.",
    duration: "2:30",
    audio: ""
  },
  faq: [
    { question: "Dois-je écrire les paroles moi-même ?", answer: "Non. Vous racontez simplement votre histoire dans le questionnaire et nous nous chargeons de la transformer en chanson." },
    { question: "Que vais-je recevoir ?", answer: "Vous recevrez un lien privé permettant d’écouter votre chanson ainsi que son fichier numérique et ses paroles." },
    { question: "Quel est le délai de livraison ?", answer: "La livraison standard est prévue sous 4 jours. L’option Express permet une livraison prioritaire sous 24 heures." },
    { question: "Puis-je demander une modification ?", answer: "Oui. La formule Essentielle comprend une révision et la formule Premium comprend des révisions illimitées, dans le cadre de la demande initiale." },
    { question: "Ma chanson reste-t-elle privée ?", answer: "Oui. Elle est livrée via un lien privé. Vous décidez ensuite librement de la partager ou non." },
    { question: "Comment fonctionne la garantie ?", answer: "La garantie satisfait ou remboursé s’applique selon les conditions précisées dans nos CGV." }
  ],
  finalCta: {
    title: "Offrez une émotion qu’ils pourront réécouter.",
    text: "Quelques minutes suffisent pour nous raconter votre histoire.",
    cta: "Commencer maintenant"
  },
  offers: {
    essential: { name: "Essentielle", price: "29,90 €", benefits: ["Chanson personnalisée", "Livraison sous 4 jours", "1 révision offerte"] },
    premium: { name: "Premium", price: "39,90 €", benefits: ["Chanson personnalisée", "Livraison sous 4 jours", "Révisions illimitées"] },
    expressPrice: "9,90 €"
  },
  funnel: {
    audioReviews: [
      { name: "Fabienne M.", country: "Belgique", title: "Mon petit mari a été très ému", occasion: "Pour son mari", quote: "Mon petit mari a été vraiment très ému lorsqu’il a entendu son prénom et le petit surnom que je lui donne. Merci pour ce si beau travail.", video: "/media/videos/hero-couple.mp4", audio: "", duration: "0:38" },
      { name: "Aline R.", country: "France", title: "Nous avons pleuré ensemble", occasion: "Pour sa maman", quote: "Dès les premières paroles, elle a reconnu notre histoire. C’était un moment que toute la famille gardera longtemps.", video: "/media/videos/hero-couple.mp4", audio: "", duration: "0:41" },
      { name: "Karim D.", country: "France", title: "Le cadeau le plus personnel", occasion: "Pour sa femme", quote: "Elle ne s’attendait pas à entendre tous ces détails dans une chanson. Sa réaction valait vraiment tout.", video: "/media/videos/hero-couple.mp4", audio: "", duration: "0:36" },
      { name: "Sophie L.", country: "Suisse", title: "Une émotion incroyable", occasion: "Pour leurs 20 ans", quote: "La chanson raconte exactement notre parcours. Nous l’avons réécoutée plusieurs fois le soir même.", video: "/media/videos/hero-couple.mp4", audio: "", duration: "0:43" },
      { name: "Élodie P.", country: "France", title: "Il a reconnu notre histoire", occasion: "Pour son compagnon", quote: "Les souvenirs, les lieux et même nos petites habitudes étaient là. C’était touchant et très réussi.", video: "/media/videos/hero-couple.mp4", audio: "", duration: "0:39" }
    ]
  }
};
