import { useEffect, useRef, useState } from "react";
import type { FunnelAnswers, SiteContent } from "../types";
import { getOffersConfig, getResumeSubmission, saveSubmission, validatePromoCode } from "../lib/api";
import StripePayment from "../components/StripePayment";
import { trackMetaCustomEvent, trackMetaEvent } from "../lib/meta";
import { activeOffers, DEFAULT_OFFERS_CONFIG, findOffer, formatOfferPrice } from "../config/offers";

const relations = ["Ma femme", "Mon mari", "Ma copine", "Mon copain", "Ma mère", "Mon père", "Mes enfants", "Frère / Sœur", "Un(e) ami(e)", "Pour moi", "Une personne qui compte"];

const recipientQuestions: Record<string, string> = {
  "Ma femme": "Quel est le prénom de votre femme ?",
  "Mon mari": "Quel est le prénom de votre mari ?",
  "Ma copine": "Quel est le prénom de votre copine ?",
  "Mon copain": "Quel est le prénom de votre copain ?",
  "Ma mère": "Quel est le prénom de votre mère ?",
  "Mon père": "Quel est le prénom de votre père ?",
  "Mes enfants": "Quels prénoms souhaitez-vous mettre à l’honneur pour vos enfants ?",
  "Frère / Sœur": "Quel est le prénom de votre frère ou de votre sœur ?",
  "Un(e) ami(e)": "Quel est le prénom de votre ami(e) ?",
  "Pour moi": "Quel prénom souhaitez-vous utiliser dans la chanson ?",
  "Une personne qui compte": "Quel est le prénom de cette personne ?"
};

function getInitialStep() {
  const savedStep = Number(localStorage.getItem("mhc_step"));
  const migrationKey = "mhc_recipient_step_split_v1";

  if (!localStorage.getItem(migrationKey)) {
    let migratedStep = savedStep >= 1 && savedStep <= 7 ? savedStep : 1;
    try {
      const savedAnswers = JSON.parse(localStorage.getItem("mhc_answers") || "{}") as Partial<FunnelAnswers>;
      if (migratedStep === 1) {
        migratedStep = savedAnswers.relation ? (savedAnswers.recipientName?.trim() ? 3 : 2) : 1;
      } else {
        migratedStep += 1;
      }
    } catch {
      migratedStep = 1;
    }
    localStorage.setItem(migrationKey, "1");
    localStorage.setItem("mhc_step", String(migratedStep));
    return migratedStep;
  }

  return savedStep >= 1 && savedStep <= 8 ? savedStep : 1;
}

const genres = [
  { label: "Pop moderne", description: "Lumineux & fédérateur", popular: true },
  { label: "RnB", description: "Sensuel & profond" },
  { label: "Piano-voix", description: "Intime & bouleversant" },
  { label: "Chanson française", description: "Élégant & narratif" },
  { label: "Latino", description: "Chaleureux & rythmé" },
  { label: "Soul", description: "Puissant & chaleureux" },
  { label: "Hip-hop", description: "Moderne & percutant" },
  { label: "Guitare acoustique", description: "Doux & authentique" },
  { label: "Reggae", description: "Solaire & détendu" },
  { label: "Méditerranée", description: "Solaire & envoûtant" }
];

const voices = ["Voix féminine", "Voix masculine", "Pas de préférence"];
const qualities = ["Attentionné(e)", "Drôle", "Courageux(se)", "Généreux(se)", "Rassurant(e)", "Passionné(e)", "Loyal(e)", "Tendre", "Inspirant(e)", "Fort(e)", "Solaire", "Authentique"];
const initial: FunnelAnswers = { relation: "", recipientName: "", pronunciation: "", genre: "", voice: "", qualities: [], customQualities: "", memories: "", message: "", offer: "essential", express: false, email: "", consent: true };

function getId() {
  const existing = localStorage.getItem("mhc_submission_id");
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem("mhc_submission_id", id);
  return id;
}

function AnnouncementBar({ text, className }: { text: string; className: string }) {
  const [offer, delivery = "Livraison rapide"] = text.split(/[·|]/).map(part => part.trim());
  return <div className={className}><strong>{offer}</strong><span aria-hidden="true" /><strong>{delivery}</strong></div>;
}

function SparklesIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Zm6 9 .8 2.2L21 15l-2.2.8L18 18l-.8-2.2L15 15l2.2-.8L18 12ZM6 13l1.1 3.1L10 17.2l-2.9 1.1L6 21l-1.1-2.7L2 17.2l2.9-1.1L6 13Z" fill="currentColor"/></svg>;
}

function LockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2m-9 0h8a2 2 0 0 1 2 2v7H6v-7a2 2 0 0 1 2-2Zm2 0V8a2 2 0 1 1 4 0v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}


function CheckIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function PlayIcon({ paused = true }: { paused?: boolean }) {
  return paused
    ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 7 8 5-8 5V7Z" fill="currentColor"/></svg>
    : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7h3v10H8V7Zm5 0h3v10h-3V7Z" fill="currentColor"/></svg>;
}

function ShieldIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.8 2.8 8.2 7 10 4.2-1.8 7-5.2 7-10V6l-7-3Zm-3 9 2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function HeartWaveIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h3l2-5 3 10 2-5h2l2-4 2 4h2M7 4.5C5 3.8 3 5.3 3 7.7c0 4.1 5.2 7.3 9 10.3 3.8-3 9-6.2 9-10.3 0-2.4-2-3.9-4-3.2-1 .3-1.8 1.1-2.3 2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}


export default function ComposerPage({ content }: { content: SiteContent }) {
  const [step, setStep] = useState(getInitialStep);
  const [answers, setAnswers] = useState<FunnelAnswers>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("mhc_answers") || "{}") as Partial<FunnelAnswers>;
      const merged = { ...initial, ...saved };
      if (!localStorage.getItem("mhc_consent_copy_v2")) {
        merged.consent = true;
        localStorage.setItem("mhc_consent_copy_v2", "1");
      }
      return merged;
    } catch {
      return initial;
    }
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [playingReview, setPlayingReview] = useState<number | null>(null);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; percent: number } | null>(null);
  const audioRefs = useRef<Array<HTMLAudioElement | null>>([]);
  const reviewSliderRef = useRef<HTMLDivElement | null>(null);
  const [offersConfig, setOffersConfig] = useState(DEFAULT_OFFERS_CONFIG);
  const [submissionId, setSubmissionId] = useState(getId);

  useEffect(() => { localStorage.setItem("mhc_answers", JSON.stringify(answers)); }, [answers]);
  useEffect(() => { localStorage.setItem("mhc_step", String(step)); }, [step]);
  useEffect(() => {
    let active = true;
    getOffersConfig()
      .then(config => {
        if (!active) return;
        setOffersConfig(config);
        const enabled = activeOffers(config);
        setAnswers(current => enabled.some(offer => offer.id === current.offer)
          ? current
          : { ...current, offer: enabled[0]?.id || "essential", express: false });
      })
      .catch(() => setOffersConfig(DEFAULT_OFFERS_CONFIG));
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const resumeToken = new URLSearchParams(window.location.search).get("resume");
    if (!resumeToken) return;
    let active = true;
    setLoading(true);
    getResumeSubmission(resumeToken)
      .then(result => {
        if (!active) return;
        setSubmissionId(result.submissionId);
        localStorage.setItem("mhc_submission_id", result.submissionId);
        setAnswers({ ...initial, ...result.answers });
        setStep(8);
        setError("");
        window.history.replaceState({}, "", "/composer");
      })
      .catch(resumeError => active && setError(resumeError instanceof Error ? resumeError.message : "Impossible de reprendre votre création."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const resetLoading = () => setLoading(false);
    window.addEventListener("pageshow", resetLoading);
    return () => window.removeEventListener("pageshow", resetLoading);
  }, []);
  useEffect(() => {
    const selected = findOffer(offersConfig, answers.offer);
    if (!selected.expressEligible && answers.express) {
      setAnswers(current => ({ ...current, express: false }));
    }
  }, [answers.offer, answers.express, offersConfig.version]);
  useEffect(() => {
    const highestPrice = Math.max(...activeOffers(offersConfig).map(offer => offer.priceCents), 0) / 100;
    trackMetaEvent("ViewContent", {
      content_name: "Formulaire chanson personnalisée",
      content_category: "Chanson personnalisée",
      content_ids: ["chanson_personnalisee"],
      content_type: "product",
      value: highestPrice,
      currency: "EUR"
    }, "composer_view", "page");
  }, [offersConfig.version]);

  const name = answers.recipientName || "cette personne";
  const visibleOffers = activeOffers(offersConfig);
  const selectedOffer = findOffer(offersConfig, answers.offer);
  const expressAvailable = selectedOffer.expressEligible;
  const expressSelected = expressAvailable && answers.express;
  const baseTotalCents = selectedOffer.priceCents + (expressSelected ? offersConfig.expressPriceCents : 0);
  const totalCents = appliedPromo ? Math.max(50, Math.round(baseTotalCents * (100 - appliedPromo.percent) / 100)) : baseTotalCents;
  const promoDiscountCents = baseTotalCents - totalCents;
  const total = totalCents / 100;
  const originalTotalCents = (selectedOffer.compareAtCents || selectedOffer.priceCents) + (expressSelected ? offersConfig.expressPriceCents : 0);
  const originalTotal = originalTotalCents / 100;
  const savings = Math.max(0, originalTotal - total);
  const canCreate = /^\S+@\S+\.\S+$/.test(answers.email) && answers.consent;


  async function applyPromoCode() {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoMessage("Saisissez votre code promo.");
      return;
    }
    setPromoLoading(true);
    setPromoMessage("");
    try {
      const result = await validatePromoCode({ code, offer: answers.offer, express: expressSelected });
      setAppliedPromo({ code: result.code, percent: result.percent });
      setPromoInput(result.code);
      setPromoMessage(`Code appliqué · -${result.percent} %`);
    } catch (promoError) {
      setAppliedPromo(null);
      setPromoMessage(promoError instanceof Error ? promoError.message : "Ce code promo n’est pas valide.");
    } finally {
      setPromoLoading(false);
    }
  }

  function removePromoCode() {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoMessage("");
  }

  function valid() {
    if (step === 1 && !answers.relation) return "Choisissez un destinataire.";
    if (step === 2 && !answers.recipientName.trim()) return "Indiquez le prénom du destinataire.";
    if (step === 3 && !answers.genre) return "Choisissez un style musical.";
    if (step === 4 && answers.qualities.length === 0 && !answers.customQualities.trim()) return "Choisissez au moins une qualité.";
    if (step === 5 && answers.memories.trim().length < 20) return "Partagez un souvenir un peu plus détaillé.";
    if (step === 7 && !canCreate) return "Indiquez un e-mail valide et acceptez les conditions.";
    return "";
  }

  function selectRelation(relation: string) {
    trackMetaCustomEvent("MHCFormStarted", {
      content_name: "Formulaire chanson personnalisée",
      funnel_step: 1
    }, `form_started:${submissionId}`);

    const nextAnswers = { ...answers, relation };
    setAnswers(nextAnswers);
    setError("");
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
    void saveSubmission(submissionId, nextAnswers, "progress").catch(() => undefined);
  }

  async function next() {
    const e = valid();
    if (e) return setError(e);
    setError("");
    await saveSubmission(submissionId, answers, step === 7 ? "form_completed" : "progress").catch(() => undefined);
    if (step === 7) {
      trackMetaEvent("Lead", {
        content_name: "Questionnaire chanson personnalisée terminé",
        content_category: "Chanson personnalisée"
      }, `lead:${submissionId}`);
    }
    setStep(s => Math.min(8, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }


  function toggleQuality(q: string) {
    setAnswers(a => ({ ...a, qualities: a.qualities.includes(q) ? a.qualities.filter(x => x !== q) : [...a.qualities, q] }));
  }

  function toggleReview(index: number, audioUrl: string) {
    if (!audioUrl) return;
    audioRefs.current.forEach((audio, i) => {
      if (audio && i !== index) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    const current = audioRefs.current[index];
    if (!current) return;
    if (playingReview === index) {
      current.pause();
      setPlayingReview(null);
    } else {
      current.play().then(() => setPlayingReview(index)).catch(() => setPlayingReview(null));
    }
  }

  function scrollReviews(direction: -1 | 1) {
    const slider = reviewSliderRef.current;
    if (!slider) return;
    slider.scrollBy({ left: direction * Math.max(280, slider.clientWidth * 0.82), behavior: "smooth" });
  }

  const heading = (() => {
    if (step === 1) return { eyebrow: "Commençons par l’essentiel", title: <>Pour qui créons-nous cette chanson ?</>, intro: "Choisissez le destinataire de la chanson." };
    if (step === 2) return { eyebrow: "Son prénom", title: <>{recipientQuestions[answers.relation] || "Quel est le prénom du destinataire ?"}</>, intro: "Ajoutez la prononciation uniquement si le prénom peut être difficile à interpréter." };
    if (step === 3) return { eyebrow: "L’univers musical", title: <>Quel style ressemble le plus à <span className="name-highlight">{name}</span> ?</>, intro: "Choisissez l’ambiance qui correspond le mieux à votre histoire." };
    if (step === 4) return { eyebrow: "Sa personnalité", title: <>Qu’est-ce qui rend <span className="name-highlight">{name}</span> unique ?</>, intro: "Sélectionnez les qualités qui le ou la décrivent le mieux." };
    if (step === 5) return { eyebrow: "Vos souvenirs", title: <>Partagez vos souvenirs avec <span className="name-highlight">{name}</span></>, intro: "Une rencontre, un voyage, une habitude, une épreuve surmontée… Les détails rendent la chanson vraiment personnelle." };
    if (step === 6) return { eyebrow: "Quelques mots du cœur", title: <>Quel message souhaitez-vous transmettre à <span className="name-highlight">{name}</span> ?</>, intro: "Ajoutez ce que vous aimeriez lui dire. Cette étape reste facultative." };
    if (step === 7) return { eyebrow: "Dernière vérification", title: <>Tout est prêt pour la chanson de <span className="name-highlight">{name}</span></>, intro: "Indiquez où recevoir la confirmation, puis découvrez quelques chansons créées pour d’autres histoires." };
    return { eyebrow: "Votre formule", title: <>Choisissez la finition de votre chanson</>, intro: "Sélectionnez la formule qui vous convient avant le paiement sécurisé." };
  })();

  return <div className="funnel-page">
    <AnnouncementBar text={content.announcement} className="funnel-announcement" />

    <header className="funnel-topbar">
      <div className="progress-wrap">
        <div className="progress-meta"><span>Étape {step} sur 8</span><strong>{Math.round(step / 8 * 100)} %</strong></div>
        <div className="progress"><i style={{ width: `${step / 8 * 100}%` }} /></div>
      </div>
      <div className="privacy-pill"><LockIcon /><span>Vos réponses restent privées</span></div>
    </header>

    <main className="funnel-shell">
      <div className="funnel-heading">
        <span className="eyebrow">{heading.eyebrow}</span>
        <h1>{heading.title}</h1>
        <p>{heading.intro}</p>
      </div>

      <section className={step === 1 ? "funnel-card recipient-step-card" : "funnel-card"}>
        {step === 1 && <>
          <label className="field-label">Destinataire</label>
          <div className="recipient-grid">{relations.map(x => <button type="button" className={answers.relation === x ? "recipient-choice active" : "recipient-choice"} onClick={() => selectRelation(x)} key={x}><span>{x}</span><i aria-hidden="true"><CheckIcon /></i></button>)}</div>
        </>}

        {step === 2 && <>
          <label className="field-label">{answers.relation === "Mes enfants" ? "Prénoms" : "Prénom"}</label>
          <input className="text-input" autoFocus placeholder={answers.relation === "Mes enfants" ? "Ex. Lina et Adam" : "Entrez son prénom"} value={answers.recipientName} onChange={e => setAnswers(a => ({ ...a, recipientName: e.target.value }))} />
          <label className="field-label optional">Prononciation <small>Facultatif</small></label>
          <input className="text-input" placeholder="Ex. Maëlle : ma-èl" value={answers.pronunciation} onChange={e => setAnswers(a => ({ ...a, pronunciation: e.target.value }))} />
        </>}

        {step === 3 && <>
          <div className="choice-grid genre-grid">{genres.map(genre => <button type="button" className={answers.genre === genre.label ? "choice genre-choice active" : "choice genre-choice"} onClick={() => setAnswers(a => ({ ...a, genre: genre.label }))} key={genre.label}><span>{genre.label}</span><small>{genre.description}</small>{genre.popular && <em>Le plus choisi</em>}</button>)}</div>
          <label className="field-label optional">Voix préférée <small>Facultatif</small></label>
          <div className="choice-grid three">{voices.map(x => <button type="button" className={answers.voice === x ? "choice active" : "choice"} onClick={() => setAnswers(a => ({ ...a, voice: x }))} key={x}>{x}</button>)}</div>
        </>}

        {step === 4 && <>
          <div className="chips">{qualities.map(q => <button type="button" onClick={() => toggleQuality(q)} className={answers.qualities.includes(q) ? "chip active" : "chip"} key={q}>{answers.qualities.includes(q) ? "✓ " : "+ "}{q}</button>)}</div>
          <label className="field-label optional">Vos propres mots <small>Facultatif</small></label>
          <input className="text-input" placeholder="Ex. toujours présent(e), plein(e) d’énergie..." value={answers.customQualities} onChange={e => setAnswers(a => ({ ...a, customQualities: e.target.value }))} />
        </>}

        {step === 5 && <>
          <textarea className="textarea" rows={9} placeholder="Ex. Notre rencontre à Lyon, ce voyage que nous n’oublierons jamais, nos habitudes du dimanche..." value={answers.memories} onChange={e => setAnswers(a => ({ ...a, memories: e.target.value }))} />
          <div className="inspiration"><strong>Besoin d’inspiration ?</strong><span>Comment vous êtes-vous rencontrés ? Quel moment vous fait toujours sourire ? Quelle date ou quel lieu compte particulièrement ?</span></div>
        </>}

        {step === 6 && <>
          <textarea className="textarea" rows={8} placeholder="Ex. Merci d’avoir toujours cru en moi..." value={answers.message} onChange={e => setAnswers(a => ({ ...a, message: e.target.value }))} />
          <div className="inspiration"><strong>Quelques pistes</strong><span>“Je t’aime plus que les mots ne peuvent le dire.” · “Merci d’être toujours là.” · “Je suis fier de tout ce que nous avons construit.”</span></div>
        </>}

        {step === 7 && <>
          <div className="verification-summary">
            <div><span>Pour</span><strong>{name}</strong></div>
            <div><span>Style</span><strong>{answers.genre}</strong></div>
            <div><span>Personnalisation</span><strong>{answers.qualities.length || 1} détails clés</strong></div>
          </div>

          <label className="field-label">Votre adresse e-mail</label>
          <input className="text-input email-input" type="email" placeholder="vous@exemple.com" value={answers.email} onChange={e => setAnswers(a => ({ ...a, email: e.target.value }))} />
          <p className="field-help">Votre confirmation et le suivi de création seront envoyés à cette adresse.</p>
          <label className="consent"><input type="checkbox" checked={answers.consent} onChange={e => setAnswers(a => ({ ...a, consent: e.target.checked }))} /><span>Je veux suivre ma création</span></label>

          <div className="reassurance-grid">
            <div className="reassurance-card"><span><HeartWaveIcon /></span><strong>100 % personnalisée</strong><p>Chaque chanson reprend votre histoire, vos mots et vos souvenirs.</p></div>
            <div className="reassurance-card"><span><LockIcon /></span><strong>Strictement privée</strong><p>Vos réponses et votre chanson ne sont jamais publiées sans accord.</p></div>
            <div className="reassurance-card"><span><ShieldIcon /></span><strong>Satisfait ou remboursé</strong><p>Vous êtes protégé par notre garantie selon les conditions annoncées.</p></div>
          </div>
        </>}

        {step === 8 && <>
          <div className="order-ready"><span><SparklesIcon /></span><div><small>Votre création est prête à être lancée</small><strong>Chanson personnalisée pour {name}</strong><p>Confirmation envoyée à {answers.email}</p></div></div>
          <div className={`offer-grid offer-grid-${visibleOffers.length}`}>
            {visibleOffers.map(offer => <button
              type="button"
              key={offer.id}
              className={[
                "offer-card",
                answers.offer === offer.id ? "active" : "",
                offer.recommended ? "premium" : ""
              ].filter(Boolean).join(" ")}
              onClick={() => setAnswers(current => ({ ...current, offer: offer.id, express: offer.expressEligible ? current.express : false }))}
            >
              {offer.recommended && <em>Recommandée</em>}
              <span>{offer.name}</span>
              <div className="offer-price-line">
                {offer.compareAtCents ? <del>{formatOfferPrice(offer.compareAtCents)}</del> : <del className="offer-price-placeholder" aria-hidden="true">—</del>}
                <small>Aujourd’hui</small>
              </div>
              <strong>{formatOfferPrice(offer.priceCents)}</strong>
              <ul>{offer.benefits.map((benefit, index) => <li key={`${offer.id}-${index}`}>{benefit}</li>)}</ul>
            </button>)}
          </div>
          {expressAvailable
            ? <label className={expressSelected ? "express-option active" : "express-option"}><input type="checkbox" checked={expressSelected} onChange={e => setAnswers(a => ({ ...a, express: e.target.checked }))} /><span>⚡ Livraison Express 24 h</span><strong>+{formatOfferPrice(offersConfig.expressPriceCents)}</strong></label>
            : <div className="express-option active express-included"><span>⚡ Livraison prioritaire 24 h incluse</span><strong>Inclus</strong></div>}
          <div className="total">
            <div className="total-copy">
              <span>Total</span>
              {!promoOpen && !appliedPromo && <button type="button" className="promo-toggle" onClick={() => setPromoOpen(true)}>Ajouter un code promo</button>}
              {(promoOpen || appliedPromo) && <div className="promo-box">
                {appliedPromo ? <div className="promo-applied"><span>✓ {appliedPromo.code} · -{appliedPromo.percent} %</span><button type="button" onClick={removePromoCode}>Retirer</button></div> : <>
                  <div className="promo-input-row">
                    <input aria-label="Code promo" placeholder="Code promo" value={promoInput} onChange={event => setPromoInput(event.target.value.toUpperCase())} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void applyPromoCode(); } }} />
                    <button type="button" onClick={() => void applyPromoCode()} disabled={promoLoading}>{promoLoading ? "…" : "Appliquer"}</button>
                  </div>
                  <button type="button" className="promo-cancel" onClick={() => { setPromoOpen(false); setPromoInput(""); setPromoMessage(""); }}>Annuler</button>
                </>}
                {promoMessage && <small className={appliedPromo ? "promo-message success" : "promo-message"}>{promoMessage}</small>}
              </div>}
            </div>
            <div className="total-prices">
              {originalTotal > total && <del>{originalTotal.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</del>}
              <strong>{total.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</strong>
              {savings > 0 && <small className="total-savings">Économisez {savings.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</small>}
            </div>
          </div>

          <section className="finish-reviews" aria-label="Avis clients">
            <div className="finish-reviews-heading">
              <div><span className="eyebrow">Ils ont offert leur chanson</span><h2>Leur réaction en dit plus que des mots</h2></div>
              <div className="review-slider-actions"><span>Glissez pour découvrir</span><button type="button" onClick={() => scrollReviews(-1)} aria-label="Avis précédent">←</button><button type="button" onClick={() => scrollReviews(1)} aria-label="Avis suivant">→</button></div>
            </div>
            <div className="review-slider" ref={reviewSliderRef}>
              {content.funnel.audioReviews.map((review, index) => <article className="finish-review-card" key={`${review.name}-${index}`}>
                <div className="finish-review-author">
                  <div className="reaction-video-wrap">{review.video ? <video src={review.video} autoPlay muted loop playsInline preload="metadata" /> : <span>♪</span>}<i aria-hidden="true" /></div>
                  <div><strong>{review.name}</strong><span>{review.country}</span></div>
                </div>
                <div className="review-rating"><span className="review-stars" aria-label="5 étoiles"><i>★</i><i>★</i><i>★</i><i>★</i><i>★</i></span><span className="review-verified">✓ Vérifié</span></div>
                <h3>{review.title}</h3>
                <p>« {review.quote} »</p>
                <button type="button" className="review-audio-button" disabled={!review.audio} onClick={() => toggleReview(index, review.audio)}><span><PlayIcon paused={playingReview !== index} /></span><div><strong>{playingReview === index ? "Mettre en pause" : "Écouter leur chanson"}</strong><small>{review.occasion} · {review.audio ? review.duration : "Bientôt disponible"}</small></div></button>
                {review.audio && <audio ref={element => { audioRefs.current[index] = element; }} src={review.audio} onEnded={() => setPlayingReview(null)} />}
              </article>)}
            </div>
            <div className="review-swipe-hint" aria-hidden="true"><span /><span /><span /><small>Faites glisser</small></div>
          </section>

          <StripePayment submissionId={submissionId} answers={{ ...answers, express: expressSelected }} total={total} recipientName={name} offer={selectedOffer} offerConfigVersion={offersConfig.version} expressPriceCents={offersConfig.expressPriceCents} promoCode={appliedPromo?.code || ""} />
        </>}

        {error && <div className="error-message">{error}</div>}
        {step !== 1 && <div className={step === 8 ? "funnel-actions payment-back-action" : "funnel-actions"}>
          <button type="button" className="back-button" onClick={() => { setError(""); setLoading(false); setStep(s => s - 1); }}>← Retour</button>
          {step !== 8 && <button type="button" className="button next-button" onClick={next} disabled={loading || (step === 7 && !canCreate)}>
            {loading ? "Chargement…" : step === 7 ? <><SparklesIcon /> Créer ma chanson</> : <>Continuer <span aria-hidden="true">→</span></>}
          </button>}
        </div>}
      </section>
    </main>

    <footer className="funnel-footer">Besoin d’aide ? <a href={`mailto:${content.brand.supportEmail}`}>{content.brand.supportEmail}</a></footer>
  </div>;
}
