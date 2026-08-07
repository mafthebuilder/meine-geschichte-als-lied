import type { SiteContent } from "../types";

export const defaultContent: SiteContent = {
  brand: {
    name: "Meine Geschichte als Lied",
    supportEmail: "kontakt@meinegeschichtealslied.com",
    colors: {
      primary: "#6f3345",
      secondary: "#f0d9d9",
      background: "#fffaf6",
      text: "#2c2023",
      accent: "#c79b62"
    }
  },
  announcement: "-70 % nur heute · Schnelle Lieferung",
  privacy: {
    cookieBannerEnabled: false,
    text: "Wir verwenden Tracking-Technologien, um die Werbeleistung zu messen und dein Erlebnis zu verbessern.",
    acceptLabel: "Alle akzeptieren",
    rejectLabel: "Ohne Zustimmung fortfahren"
  },
  hero: {
    eyebrow: "Ein Lied aus eurer Geschichte",
    title: "Das Geschenk, das eure schönsten Erinnerungen wieder lebendig macht.",
    description: "Erzähl uns von den Momenten, die euch verbinden. Wir machen daraus ein einzigartiges Lied – geschrieben für den Menschen, den du liebst.",
    cta: "Mein Lied erstellen",
    video: "/media/videos/hero-couple.mp4"
  },
  howItWorks: [
    { title: "Erzähl uns eure Geschichte", text: "Beantworte ein paar Fragen über die Person, eure Erinnerungen und die Botschaft, die du ihr mitgeben möchtest." },
    { title: "Wir machen daraus ein Lied", text: "Aus deiner Geschichte entstehen persönliche Lyrics und eine musikalische Stimmung, die zu euch passt." },
    { title: "Du erhältst es per E-Mail", text: "Innerhalb von 4 Tagen ist dein Lied bereit zum Anhören, Herunterladen und Teilen." }
  ],
  comparison: [
    { icon: "💐", title: "Ein Blumenstrauß", duration: "Ein paar Tage" },
    { icon: "🍽️", title: "Ein Abendessen", duration: "Ein Abend" },
    { icon: "🎵", title: "Das eigene Lied", duration: "Eine Erinnerung fürs Leben", featured: true }
  ],
  occasions: [
    { title: "Für deinen Partner", image: "/media/images/couple.jpg" },
    { title: "Für deine Eltern", image: "/media/images/mother.jpg" },
    { title: "Für deine Kinder", image: "/media/images/child.jpg" },
    { title: "Zur Hochzeit", image: "/media/images/wedding.jpg" },
    { title: "Zum Geburtstag", image: "/media/images/birthday.jpg" },
    { title: "Als besondere Erinnerung", image: "/media/images/tribute.jpg" }
  ],
  songPreview: {
    eyebrow: "Dein persönliches Lied",
    title: "Eine Geschichte wird zum Lied",
    subtitle: "Hör dir einen Ausschnitt an, der aus einer echten Geschichte entstanden ist.",
    duration: "2:30",
    audio: ""
  },
  faq: [
    { question: "Muss ich den Liedtext selbst schreiben?", answer: "Nein. Du erzählst uns einfach eure Geschichte im Fragebogen – wir machen daraus einen persönlichen Liedtext." },
    { question: "Was genau erhalte ich?", answer: "Du erhältst einen privaten Link zu deinem Lied sowie die digitale Audiodatei und den Liedtext." },
    { question: "Wie lange dauert die Lieferung?", answer: "Die Standardlieferung erfolgt innerhalb von 4 Tagen. Mit der Express-Option wird dein Lied priorisiert innerhalb von 24 Stunden geliefert." },
    { question: "Kann ich Änderungen anfragen?", answer: "Ja. Das Basis-Paket enthält eine Überarbeitung, Premium enthält unbegrenzte Überarbeitungen im Rahmen des ursprünglichen Briefings." },
    { question: "Bleibt mein Lied privat?", answer: "Ja. Es wird über einen privaten Link bereitgestellt. Du entscheidest selbst, ob und mit wem du es teilst." },
    { question: "Wie funktioniert die Geld-zurück-Garantie?", answer: "Die Geld-zurück-Garantie gilt gemäß den Bedingungen in unseren AGB." }
  ],
  finalCta: {
    title: "Verschenke ein Gefühl, das man immer wieder hören kann.",
    text: "Ein paar Minuten reichen, um uns eure Geschichte zu erzählen.",
    cta: "Jetzt starten"
  },
  offers: {
    essential: { name: "Basis", price: "14,90 €", benefits: ["Persönliches Lied", "Lieferung innerhalb von 4 Tagen", "1 Überarbeitung inklusive"] },
    premium: { name: "Premium", price: "24,90 €", benefits: ["Persönliches Lied", "Priorisierte Lieferung innerhalb von 24 Std.", "Unbegrenzte Überarbeitungen"] },
    expressPrice: "4,90 €"
  },
  funnel: {
    audioReviews: [
      { name: "Fabienne M.", country: "Belgien", title: "Mein Mann war wirklich gerührt", occasion: "Für ihren Mann", quote: "Als er seinen Namen und sogar unseren kleinen Spitznamen gehört hat, war er sofort gerührt. Danke für diese wunderschöne Arbeit.", video: "/media/videos/hero-couple.mp4", audio: "", duration: "0:38" },
      { name: "Aline R.", country: "Frankreich", title: "Wir haben zusammen geweint", occasion: "Für ihre Mutter", quote: "Schon bei den ersten Zeilen hat sie unsere Geschichte erkannt. Ein Moment, den unsere ganze Familie lange in Erinnerung behalten wird.", video: "/media/videos/hero-couple.mp4", audio: "", duration: "0:41" },
      { name: "Karim D.", country: "Frankreich", title: "Das persönlichste Geschenk", occasion: "Für seine Frau", quote: "Sie hätte nie erwartet, all diese kleinen Details in einem Lied wiederzufinden. Ihre Reaktion war unbezahlbar.", video: "/media/videos/hero-couple.mp4", audio: "", duration: "0:36" },
      { name: "Sophie L.", country: "Schweiz", title: "Unglaublich emotional", occasion: "Zum 20. Jahrestag", quote: "Das Lied erzählt unseren gemeinsamen Weg erstaunlich genau. Wir haben es am selben Abend gleich mehrmals gehört.", video: "/media/videos/hero-couple.mp4", audio: "", duration: "0:43" },
      { name: "Élodie P.", country: "Frankreich", title: "Er hat unsere Geschichte sofort erkannt", occasion: "Für ihren Partner", quote: "Unsere Erinnerungen, die Orte und sogar unsere kleinen Gewohnheiten waren alle drin. Es war wunderschön und sehr berührend.", video: "/media/videos/hero-couple.mp4", audio: "", duration: "0:39" }
    ]
  }
};
