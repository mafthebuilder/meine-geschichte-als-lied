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
  announcement: "Persönlich für euch geschrieben · Lieferung in 4 Tagen",
  privacy: {
    cookieBannerEnabled: false,
    text: "Wir verwenden Technologien, um die Nutzung unserer Website zu messen und unser Angebot zu verbessern.",
    acceptLabel: "Alle akzeptieren",
    rejectLabel: "Nur notwendige"
  },
  hero: {
    eyebrow: "Eure Geschichte. Euer Lied.",
    title: "Ein Lied, das eure Geschichte für immer festhält.",
    description: "Erzähl uns von dem Menschen, der dir wichtig ist – von euren Erinnerungen, kleinen Eigenheiten und den Momenten, die euch verbinden. Wir machen daraus ein persönliches Lied, das es nur einmal gibt.",
    cta: "Persönliches Lied erstellen",
    video: "/media/videos/hero-couple.mp4"
  },
  howItWorks: [
    { title: "Erzähl uns, was euch verbindet", text: "Beantworte ein paar einfache Fragen über die Person, eure gemeinsamen Erinnerungen und das, was du ihr sagen möchtest." },
    { title: "Wir schreiben euer persönliches Lied", text: "Aus deinen Angaben entsteht ein individueller Songtext mit einer musikalischen Stimmung, die zu euch passt." },
    { title: "Du bekommst dein Lied per E-Mail", text: "Innerhalb von 4 Tagen erhältst du dein Lied über einen privaten Link – zum Anhören, Herunterladen und Verschenken." }
  ],
  comparison: [
    { icon: "💐", title: "Ein Blumenstrauß", duration: "Hält ein paar Tage" },
    { icon: "🍽️", title: "Ein gemeinsames Essen", duration: "Bleibt ein schöner Abend" },
    { icon: "🎵", title: "Eure Geschichte als Lied", duration: "Bleibt für immer", featured: true }
  ],
  occasions: [
    { title: "Für deinen Lieblingsmenschen", image: "/media/images/couple.jpg" },
    { title: "Für Mama & Papa", image: "/media/images/mother.jpg" },
    { title: "Für dein Kind", image: "/media/images/child.jpg" },
    { title: "Zur Hochzeit", image: "/media/images/wedding.jpg" },
    { title: "Zum Geburtstag", image: "/media/images/birthday.jpg" },
    { title: "Zum Jahrestag oder als Erinnerung", image: "/media/images/tribute.jpg" }
  ],
  songPreview: {
    eyebrow: "So kann eure Geschichte klingen",
    title: "Aus Erinnerungen wird Musik",
    subtitle: "Hör dir an, wie aus persönlichen Momenten ein Lied mit echter Bedeutung entsteht.",
    duration: "2:30",
    audio: ""
  },
  faq: [
    { question: "Muss ich den Songtext selbst schreiben?", answer: "Nein. Du erzählst uns einfach eure Geschichte. Wir formulieren daraus einen persönlichen Songtext und setzen ihn musikalisch um." },
    { question: "Was bekomme ich genau?", answer: "Du erhältst einen privaten Link zu deinem fertigen Lied sowie die Audiodatei zum Herunterladen. Der persönliche Songtext ist ebenfalls enthalten." },
    { question: "Wie schnell bekomme ich mein Lied?", answer: "Die Standardlieferung erfolgt innerhalb von 4 Tagen. Je nach Paket kannst du eine Express-Lieferung wählen; im Premium-Paket ist die Lieferung innerhalb von 24 Stunden bereits inklusive." },
    { question: "Kann ich nachträglich etwas ändern lassen?", answer: "Das hängt vom gewählten Paket ab: Starter enthält keine Überarbeitung, Basis eine Überarbeitung und Premium unbegrenzte Überarbeitungen im Rahmen deiner ursprünglichen Angaben." },
    { question: "Bleibt mein Lied privat?", answer: "Ja. Dein Lied wird über einen privaten Link bereitgestellt. Du allein entscheidest, ob und mit wem du es teilst." },
    { question: "Wie funktioniert die Geld-zurück-Garantie?", answer: "Die Geld-zurück-Garantie gilt nach den Bedingungen unserer AGB. Die genauen Voraussetzungen findest du dort transparent aufgeführt." }
  ],
  finalCta: {
    title: "Mach aus euren Erinnerungen etwas, das bleibt.",
    text: "Ein paar Minuten reichen, um uns eure Geschichte zu erzählen. Den Rest übernehmen wir.",
    cta: "Jetzt persönliches Lied erstellen"
  },
  offers: {
    essential: { name: "Basis", price: "14,90 €", benefits: ["Persönliches Lied als MP3", "Lieferung in 4 Tagen", "1 Überarbeitung inklusive"] },
    premium: { name: "Premium", price: "24,90 €", benefits: ["Persönliches Lied als MP3", "Lieferung in 24 Std. inklusive", "Unbegrenzte Überarbeitungen"] },
    expressPrice: "4,90 €"
  },
  funnel: {
    audioReviews: [
      { name: "Fabienne M.", country: "Belgien", title: "Mein Mann war sofort gerührt", occasion: "Für ihren Mann", quote: "Als er seinen Namen und sogar unseren kleinen Spitznamen gehört hat, war er sofort gerührt. Danke für dieses wunderschöne Lied.", video: "/media/videos/hero-couple.mp4", audio: "", duration: "0:38" },
      { name: "Aline R.", country: "Frankreich", title: "Wir haben beide geweint", occasion: "Für ihre Mutter", quote: "Schon bei den ersten Zeilen hat sie unsere Geschichte wiedererkannt. Diesen Moment wird unsere Familie nicht vergessen.", video: "/media/videos/hero-couple.mp4", audio: "", duration: "0:41" },
      { name: "Karim D.", country: "Frankreich", title: "So persönlich war noch kein Geschenk", occasion: "Für seine Frau", quote: "Sie hätte nie erwartet, all diese kleinen Details in einem Lied wiederzufinden. Ihre Reaktion war unbezahlbar.", video: "/media/videos/hero-couple.mp4", audio: "", duration: "0:36" },
      { name: "Sophie L.", country: "Schweiz", title: "Unglaublich emotional", occasion: "Zum 20. Jahrestag", quote: "Das Lied erzählt unseren gemeinsamen Weg erstaunlich genau. Wir haben es am selben Abend gleich mehrmals gehört.", video: "/media/videos/hero-couple.mp4", audio: "", duration: "0:43" },
      { name: "Élodie P.", country: "Frankreich", title: "Er hat unsere Geschichte sofort erkannt", occasion: "Für ihren Partner", quote: "Unsere Erinnerungen, die Orte und sogar unsere kleinen Gewohnheiten waren alle darin. Es war wunderschön und sehr berührend.", video: "/media/videos/hero-couple.mp4", audio: "", duration: "0:39" }
    ]
  }
};
