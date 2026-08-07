import { useEffect, useMemo, useState } from "react";
import type { FunnelAnswers, SiteContent } from "../types";
import { createCheckout, saveSubmission } from "../lib/api";

const relations = ["Ma femme", "Mon mari", "Ma copine", "Mon copain", "Ma mère", "Mon père", "Mes enfants", "Frère / Sœur", "Un(e) ami(e)", "Pour moi", "Une personne qui compte"];
const genres = ["Chanson française", "Piano-voix émouvant", "Pop romantique", "Guitare-voix intime", "Soul", "Jazz vocal"];
const voices = ["Voix féminine", "Voix masculine", "Pas de préférence"];
const qualities = ["Attentionné(e)", "Drôle", "Courageux(se)", "Généreux(se)", "Rassurant(e)", "Passionné(e)", "Loyal(e)", "Tendre", "Inspirant(e)", "Fort(e)", "Solaire", "Authentique"];
const initial: FunnelAnswers = { relation: "", recipientName: "", pronunciation: "", genre: "", voice: "", qualities: [], customQualities: "", memories: "", message: "", offer: "essential", express: false, email: "", consent: false };

function getId() {
  const existing = localStorage.getItem("mhc_submission_id");
  if (existing) return existing;
  const id = crypto.randomUUID(); localStorage.setItem("mhc_submission_id", id); return id;
}

export default function ComposerPage({ content }: { content: SiteContent }) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<FunnelAnswers>(() => {
    try { return { ...initial, ...JSON.parse(localStorage.getItem("mhc_answers") || "{}") }; } catch { return initial; }
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submissionId = useMemo(getId, []);
  useEffect(() => { localStorage.setItem("mhc_answers", JSON.stringify(answers)); }, [answers]);
  const name = answers.recipientName || "cette personne";
  const price = answers.offer === "premium" ? 39.90 : 29.90;
  const total = price + (answers.express ? 9.90 : 0);

  function valid() {
    if (step === 1 && (!answers.relation || !answers.recipientName.trim())) return "Choisissez un destinataire et indiquez son prénom.";
    if (step === 2 && !answers.genre) return "Choisissez un style musical.";
    if (step === 3 && answers.qualities.length === 0 && !answers.customQualities.trim()) return "Choisissez au moins une qualité.";
    if (step === 4 && answers.memories.trim().length < 20) return "Partagez un souvenir un peu plus détaillé.";
    if (step === 6 && (!/^\S+@\S+\.\S+$/.test(answers.email) || !answers.consent)) return "Indiquez un e-mail valide et acceptez les conditions.";
    return "";
  }
  async function next() { const e = valid(); if (e) return setError(e); setError(""); await saveSubmission(submissionId, answers).catch(() => undefined); setStep(s => Math.min(6, s + 1)); window.scrollTo(0, 0); }
  async function checkout() {
    const e = valid(); if (e) return setError(e); setLoading(true); setError("");
    try { await saveSubmission(submissionId, answers); const url = await createCheckout(submissionId, answers); window.location.href = url; }
    catch (err) { setError(err instanceof Error ? err.message : "Une erreur est survenue."); setLoading(false); }
  }
  function toggleQuality(q: string) { setAnswers(a => ({ ...a, qualities: a.qualities.includes(q) ? a.qualities.filter(x => x !== q) : [...a.qualities, q] })); }

  return <div className="funnel-page">
    <div className="funnel-announcement">🎁 Offre de lancement | Livraison sous 4 jours</div>
    <header className="funnel-header"><a className="logo" href="/"><span className="logo-note">♪</span>{content.brand.name}</a><span>Vos réponses restent privées 🔒</span></header>
    <div className="progress-wrap"><div><span>Étape {step} sur 6</span><strong>{Math.round(step / 6 * 100)} %</strong></div><div className="progress"><i style={{ width: `${step / 6 * 100}%` }} /></div></div>
    <main className="funnel-card">
      {step === 1 && <><span className="eyebrow">Commençons par l’essentiel</span><h1>Pour qui créons-nous cette chanson ?</h1><p className="funnel-intro">Dites-nous à qui elle est destinée, puis indiquez son prénom.</p><label className="field-label">Destinataire</label><div className="choice-grid">{relations.map(x => <button className={answers.relation === x ? "choice active" : "choice"} onClick={() => setAnswers(a => ({ ...a, relation: x }))} key={x}>{x}</button>)}</div><label className="field-label">Son prénom</label><input className="text-input" placeholder="Entrez son prénom" value={answers.recipientName} onChange={e => setAnswers(a => ({ ...a, recipientName: e.target.value }))} /><label className="field-label optional">Prononciation <small>Facultatif</small></label><input className="text-input" placeholder="Ex. Maëlle : ma-èl" value={answers.pronunciation} onChange={e => setAnswers(a => ({ ...a, pronunciation: e.target.value }))} /></>}
      {step === 2 && <><span className="eyebrow">L’univers musical</span><h1>Quel style ressemble le plus à {name} ?</h1><p className="funnel-intro">Choisissez l’ambiance qui correspond à votre histoire.</p><div className="choice-grid two">{genres.map((x, i) => <button className={answers.genre === x ? "choice active" : "choice"} onClick={() => setAnswers(a => ({ ...a, genre: x }))} key={x}>{x}{i === 0 && <small>Le plus choisi</small>}</button>)}</div><label className="field-label optional">Voix préférée <small>Facultatif</small></label><div className="choice-grid three">{voices.map(x => <button className={answers.voice === x ? "choice active" : "choice"} onClick={() => setAnswers(a => ({ ...a, voice: x }))} key={x}>{x}</button>)}</div></>}
      {step === 3 && <><span className="eyebrow">Sa personnalité</span><h1>Qu’est-ce qui rend {name} unique ?</h1><p className="funnel-intro">Sélectionnez les qualités qui le ou la décrivent le mieux.</p><div className="chips">{qualities.map(q => <button onClick={() => toggleQuality(q)} className={answers.qualities.includes(q) ? "chip active" : "chip"} key={q}>{answers.qualities.includes(q) ? "✓ " : "+ "}{q}</button>)}</div><label className="field-label optional">Vos propres mots <small>Facultatif</small></label><input className="text-input" placeholder="Ex. toujours présent(e), plein(e) d’énergie..." value={answers.customQualities} onChange={e => setAnswers(a => ({ ...a, customQualities: e.target.value }))} /></>}
      {step === 4 && <><span className="eyebrow">Vos souvenirs</span><h1>Racontez-nous les moments partagés avec {name}</h1><p className="funnel-intro">Une rencontre, un voyage, une habitude, une épreuve surmontée… Les détails rendent la chanson vraiment personnelle.</p><textarea className="textarea" rows={9} placeholder="Ex. Nous nous sommes rencontrés à Lyon en 2012..." value={answers.memories} onChange={e => setAnswers(a => ({ ...a, memories: e.target.value }))} /><div className="inspiration"><strong>Besoin d’inspiration ?</strong><span>Comment vous êtes-vous rencontrés ? Quel moment vous fait toujours sourire ? Quelle date ou quel lieu compte particulièrement ?</span></div></>}
      {step === 5 && <><span className="eyebrow">Quelques mots du cœur</span><h1>Quel message souhaitez-vous transmettre à {name} ?</h1><p className="funnel-intro">Ajoutez ce que vous aimeriez lui dire. Cette étape reste facultative.</p><textarea className="textarea" rows={8} placeholder="Ex. Merci d’avoir toujours cru en moi..." value={answers.message} onChange={e => setAnswers(a => ({ ...a, message: e.target.value }))} /><div className="inspiration"><strong>Exemples</strong><span>“Je t’aime plus que les mots ne peuvent le dire.” · “Merci d’être toujours là.” · “Je suis fier de tout ce que nous avons construit.”</span></div></>}
      {step === 6 && <><span className="eyebrow">Votre formule</span><h1>Choisissez la finition de votre chanson</h1><p className="funnel-intro">Votre questionnaire est prêt. Sélectionnez votre formule avant le paiement sécurisé.</p><div className="offer-grid"><button className={answers.offer === "essential" ? "offer-card active" : "offer-card"} onClick={() => setAnswers(a => ({ ...a, offer: "essential" }))}><span>Essentielle</span><strong>29,90 €</strong><ul><li>Chanson personnalisée</li><li>Livraison sous 4 jours</li><li>1 révision offerte</li></ul></button><button className={answers.offer === "premium" ? "offer-card active premium" : "offer-card premium"} onClick={() => setAnswers(a => ({ ...a, offer: "premium" }))}><em>Recommandée</em><span>Premium</span><strong>39,90 €</strong><ul><li>Chanson personnalisée</li><li>Livraison sous 4 jours</li><li>Révisions illimitées</li></ul></button></div><label className={answers.express ? "express-option active" : "express-option"}><input type="checkbox" checked={answers.express} onChange={e => setAnswers(a => ({ ...a, express: e.target.checked }))} /><span>⚡ Livraison Express sous 24 h</span><strong>+9,90 €</strong></label><label className="field-label">Votre e-mail</label><input className="text-input" type="email" placeholder="vous@exemple.com" value={answers.email} onChange={e => setAnswers(a => ({ ...a, email: e.target.value }))} /><label className="consent"><input type="checkbox" checked={answers.consent} onChange={e => setAnswers(a => ({ ...a, consent: e.target.checked }))} /><span>J’accepte les CGV et le démarrage de la création personnalisée après paiement.</span></label><div className="total"><span>Total</span><strong>{total.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</strong></div></>}
      {error && <div className="error-message">{error}</div>}
      <div className="funnel-actions">{step > 1 && <button className="back-button" onClick={() => { setError(""); setStep(s => s - 1); }}>← Retour</button>}<button className="button next-button" onClick={step === 6 ? checkout : next} disabled={loading}>{loading ? "Chargement…" : step === 6 ? "Continuer vers le paiement sécurisé →" : "Suivant →"}</button></div>
    </main>
    <footer className="funnel-footer">Besoin d’aide ? <a href={`mailto:${content.brand.supportEmail}`}>{content.brand.supportEmail}</a></footer>
  </div>;
}
