import { useEffect, useRef, useState } from "react";
import type { SiteContent } from "../types";

const BRAND_LOGO_URL = "/mhc-logo-v2.png";

function Logo({ name }: { name: string }) {
  return <a className="logo" href="/" aria-label={`${name} - Startseite`}>
    <img className="brand-logo-image" src={BRAND_LOGO_URL} alt={name} />
  </a>;
}

function AnnouncementBar({ text }: { text: string }) {
  const [offer, delivery = "Schnelle Lieferung"] = text.split(/[·|]/).map(part => part.trim());
  return <div className="announcement"><strong>{offer}</strong><span aria-hidden="true" /><strong>{delivery}</strong></div>;
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function SparkleIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Zm6 9 .8 2.2L21 15l-2.2.8L18 18l-.8-2.2L15 15l2.2-.8L18 12Z" fill="currentColor"/></svg>;
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function HomePage({ content }: { content: SiteContent }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setPreviewPlaying(false);
    setPreviewTime(0);
    setPreviewDuration(0);
  }, [content.songPreview.audio]);

  function togglePreview() {
    const audio = previewAudioRef.current;
    if (!audio || !content.songPreview.audio) return;
    if (audio.paused) {
      audio.play().then(() => setPreviewPlaying(true)).catch(() => setPreviewPlaying(false));
    } else {
      audio.pause();
      setPreviewPlaying(false);
    }
  }

  const previewProgress = previewDuration > 0 ? Math.min(100, (previewTime / previewDuration) * 100) : 0;

  return <div className="home-page">
    <AnnouncementBar text={content.announcement} />
    <header className="site-header container">
      <Logo name={content.brand.name} />
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">☰</button>
      <nav className={menuOpen ? "nav open" : "nav"}>
        <a href="#fonctionnement">So funktioniert’s</a>
        <a href="#occasions">Anlässe</a>
        <a href="#faq">FAQ</a>
        <a href="mailto:kontakt@meinegeschichtealslied.com">Kontakt</a>
      </nav>
      <a className="button button-small header-cta" href="/composer"><SparkleIcon /> Mein Lied erstellen</a>
    </header>

    <main>
      <section className="hero container">
        <div className="hero-copy">
          <span className="eyebrow">{content.hero.eyebrow}</span>
          <h1>{content.hero.title}</h1>
          <p className="lead">{content.hero.description}</p>
          <a className="button" href="/composer"><SparkleIcon /> {content.hero.cta} <ArrowIcon /></a>
          <div className="trust-row"><span>✓ Geld-zurück-Garantie</span><span>✓ Lieferung in 4 Tagen</span></div>
        </div>
        <div className="hero-media">
          <video src={content.hero.video} autoPlay muted loop playsInline />
          <div className="floating-card"><span>▶</span><div><strong>Ein ganz persönlicher Moment</strong><small>Aus euren Erinnerungen entstanden</small></div></div>
        </div>
      </section>

      <section className="section section-soft" id="fonctionnement">
        <div className="container">
          <div className="section-heading"><span className="eyebrow">Einfach und persönlich</span><h2>Eure Geschichte wird zum Lied</h2></div>
          <div className="steps-grid">{content.howItWorks.map((step, i) => <article className="step-card" key={step.title}><span className="step-number">{i + 1}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
          <div className="center"><a className="button button-outline" href="/composer">Unsere Geschichte erzählen <ArrowIcon /></a></div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading"><span className="eyebrow">Ein Geschenk, das bleibt</span><h2>Erinnerungen halten länger</h2></div>
        <div className="comparison-grid">{content.comparison.map(item => <article key={item.title} className={item.featured ? "comparison-card featured" : "comparison-card"}>{item.featured && <span className="best-label">Unsere Empfehlung</span>}<span className="comparison-icon">{item.icon}</span><h3>{item.title}</h3><p>{item.duration}</p></article>)}</div>
      </section>

      <section className="section section-dark">
        <div className="container testimonial-layout">
          <div><span className="eyebrow light">Der Moment, der alles verändert</span><h2>Ein Lied kann sagen, wofür Worte manchmal nicht reichen.</h2><p>Jedes Detail kommt aus eurer Geschichte: ein Name, eine Begegnung, eine Erinnerung, ein Satz, den nur ihr versteht.</p><a className="button button-light" href="/composer"><SparkleIcon /> Persönliches Lied erstellen</a></div>
          <div className="memory-collage"><img src="/media/images/family.jpg" alt="Familie zusammen" /><img src="/media/images/testimonial-avatar-2.jpg" alt="Familienerinnerung" /><div className="quote-card">„Ein persönliches Geschenk, das man immer wieder hören möchte.“</div></div>
        </div>
      </section>

      <section className="section container" id="occasions">
        <div className="section-heading"><span className="eyebrow">Für die Momente, die wirklich zählen</span><h2>Für wen möchtest du ein Lied verschenken?</h2></div>
        <div className="occasions-grid">{content.occasions.map(item => <a href="/composer" className="occasion-card" key={item.title}><img src={item.image} alt={item.title} /><span>{item.title} <b>→</b></span></a>)}</div>
      </section>

      <section className="section section-soft">
        <div className="container product-preview">
          <div className="record-art"><span>♪</span><small>{content.brand.name}</small></div>
          <div className="song-card"><span className="eyebrow">{content.songPreview.eyebrow}</span><h2>{content.songPreview.title}</h2><p>{content.songPreview.subtitle}</p><div className="player"><button type="button" aria-label={previewPlaying ? "Pause" : "Hörprobe abspielen"} onClick={togglePreview} disabled={!content.songPreview.audio}>{previewPlaying ? "Ⅱ" : "▶"}</button><div className="track" aria-hidden="true"><i style={{ width: `${previewProgress}%` }} /></div><span>{formatTime(previewTime)} / {previewDuration > 0 ? formatTime(previewDuration) : content.songPreview.duration}</span><audio ref={previewAudioRef} src={content.songPreview.audio || undefined} preload="metadata" onLoadedMetadata={event => setPreviewDuration(event.currentTarget.duration)} onTimeUpdate={event => setPreviewTime(event.currentTarget.currentTime)} onEnded={event => { event.currentTarget.currentTime = 0; setPreviewPlaying(false); setPreviewTime(0); }} /></div><div className="feature-list"><span>✓ Hochwertige Audiodatei zum Teilen</span><span>✓ Individuell geschriebener Liedtext</span><span>✓ Direkte Lieferung per E-Mail</span></div><a className="button" href="/composer"><SparkleIcon /> Mein Lied erstellen <ArrowIcon /></a></div>
        </div>
      </section>

      <section className="section container" id="faq">
        <div className="section-heading"><span className="eyebrow">Häufige Fragen</span><h2>Alles, was du wissen solltest</h2></div>
        <div className="faq-list">{content.faq.map((item, i) => <details key={item.question} open={i === 0}><summary>{item.question}<span>+</span></summary><p>{item.answer}</p></details>)}</div>
      </section>

      <section className="final-cta"><div className="container"><span className="eyebrow light">Ein wirklich persönliches Geschenk</span><h2>{content.finalCta.title}</h2><p>{content.finalCta.text}</p><a className="button button-light" href="/composer"><SparkleIcon /> {content.finalCta.cta} <ArrowIcon /></a></div></section>
    </main>

    <footer><div className="container footer-grid"><div><Logo name={content.brand.name} /><p>Persönliche Lieder für die Momente, die wirklich zählen.</p></div><div><strong>Hilfe</strong><a href="#faq">FAQ</a><a href={`mailto:${content.brand.supportEmail}`}>Kontakt</a></div><div><strong>Rechtliches</strong><a href="https://monhistoirechantee.myshopify.com/pages/conditions-generales-de-vente">AGB</a><a href="https://monhistoirechantee.myshopify.com/pages/politique-de-remboursement-et-de-retractation">Widerruf & Erstattung</a><a href="https://monhistoirechantee.myshopify.com/pages/mentions-legales">Impressum</a></div></div><div className="container copyright">© 2026 {content.brand.name} · Sichere Zahlung in EUR</div></footer>
  </div>;
}
