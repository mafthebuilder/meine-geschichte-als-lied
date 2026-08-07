import { useState } from "react";
import type { SiteContent } from "../types";

function Logo({ name }: { name: string }) {
  return <a className="logo" href="/"><span className="logo-note">♪</span><span>{name}</span></a>;
}

export default function HomePage({ content }: { content: SiteContent }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <>
    <div className="announcement">{content.announcement}</div>
    <header className="site-header container">
      <Logo name={content.brand.name} />
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">☰</button>
      <nav className={menuOpen ? "nav open" : "nav"}>
        <a href="#fonctionnement">Comment ça marche</a>
        <a href="#occasions">Occasions</a>
        <a href="#faq">FAQ</a>
        <a href="mailto:contact@monhistoirechantee.com">Contact</a>
      </nav>
      <a className="button button-small header-cta" href="/composer">Créer ma chanson</a>
    </header>

    <main>
      <section className="hero container">
        <div className="hero-copy">
          <span className="eyebrow">{content.hero.eyebrow}</span>
          <h1>{content.hero.title}</h1>
          <p className="lead">{content.hero.description}</p>
          <a className="button" href="/composer">{content.hero.cta} <span>→</span></a>
          <div className="trust-row"><span>✓ Satisfait ou remboursé</span><span>✓ Livrée sous 4 jours</span></div>
        </div>
        <div className="hero-media">
          <video src={content.hero.video} autoPlay muted loop playsInline />
          <div className="floating-card"><span>▶</span><div><strong>Une émotion unique</strong><small>Créée à partir de vos souvenirs</small></div></div>
        </div>
      </section>

      <section className="section section-soft" id="fonctionnement">
        <div className="container">
          <div className="section-heading"><span className="eyebrow">Simple et personnel</span><h2>Votre histoire devient une chanson</h2></div>
          <div className="steps-grid">{content.howItWorks.map((step, i) => <article className="step-card" key={step.title}><span className="step-number">{i + 1}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
          <div className="center"><a className="button button-outline" href="/composer">Raconter mon histoire</a></div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading"><span className="eyebrow">Un cadeau différent</span><h2>Les souvenirs durent plus longtemps</h2></div>
        <div className="comparison-grid">{content.comparison.map(item => <article key={item.title} className={item.featured ? "comparison-card featured" : "comparison-card"}>{item.featured && <span className="best-label">Notre choix</span>}<span className="comparison-icon">{item.icon}</span><h3>{item.title}</h3><p>{item.duration}</p></article>)}</div>
      </section>

      <section className="section section-dark">
        <div className="container testimonial-layout">
          <div><span className="eyebrow light">Le moment où tout change</span><h2>Une chanson peut dire ce que les mots n’arrivent pas toujours à exprimer.</h2><p>Chaque détail vient de votre histoire : un prénom, une rencontre, un souvenir, une phrase que vous seuls comprenez.</p><a className="button button-light" href="/composer">Créer la sienne</a></div>
          <div className="memory-collage"><img src="/media/images/family.jpg" alt="Famille réunie" /><img src="/media/images/testimonial-avatar-2.jpg" alt="Souvenir de famille" /><div className="quote-card">“Un cadeau personnel, fait pour être réécouté.”</div></div>
        </div>
      </section>

      <section className="section container" id="occasions">
        <div className="section-heading"><span className="eyebrow">Pour tous les moments importants</span><h2>À qui offrirez-vous sa chanson ?</h2></div>
        <div className="occasions-grid">{content.occasions.map(item => <a href="/composer" className="occasion-card" key={item.title}><img src={item.image} alt={item.title} /><span>{item.title} <b>→</b></span></a>)}</div>
      </section>

      <section className="section section-soft">
        <div className="container product-preview">
          <div className="record-art"><span>♪</span><small>{content.brand.name}</small></div>
          <div className="song-card"><span className="eyebrow">Votre chanson personnalisée</span><h2>{content.songPreview.title}</h2><p>{content.songPreview.subtitle}</p><div className="player"><button aria-label="Lire">▶</button><div className="track"><i></i></div><span>0:00 / {content.songPreview.duration}</span></div><div className="feature-list"><span>✓ Qualité audio prête à partager</span><span>✓ Paroles écrites sur mesure</span><span>✓ Livraison directe par e-mail</span></div><a className="button" href="/composer">Créer ma chanson</a></div>
        </div>
      </section>

      <section className="section container" id="faq">
        <div className="section-heading"><span className="eyebrow">Questions fréquentes</span><h2>Tout ce qu’il faut savoir</h2></div>
        <div className="faq-list">{content.faq.map((item, i) => <details key={item.question} open={i === 0}><summary>{item.question}<span>+</span></summary><p>{item.answer}</p></details>)}</div>
      </section>

      <section className="final-cta"><div className="container"><span className="eyebrow light">Un cadeau vraiment personnel</span><h2>{content.finalCta.title}</h2><p>{content.finalCta.text}</p><a className="button button-light" href="/composer">{content.finalCta.cta} →</a></div></section>
    </main>

    <footer><div className="container footer-grid"><div><Logo name={content.brand.name} /><p>Des chansons personnalisées pour les moments qui comptent.</p></div><div><strong>Aide</strong><a href="#faq">FAQ</a><a href={`mailto:${content.brand.supportEmail}`}>Contact</a></div><div><strong>Légal</strong><a href="#">CGV</a><a href="#">Confidentialité</a><a href="#">Mentions légales</a></div></div><div className="container copyright">© 2026 {content.brand.name} · Paiement sécurisé via Shopify</div></footer>
  </>;
}
