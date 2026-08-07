import type { SiteContent } from "../types";
import { legalDocuments } from "../legal/legalContent";

const BRAND_LOGO_URL = "/mhc-logo-v2.png";

export default function LegalPage({ path, content }: { path: string; content: SiteContent }) {
  const key = path.replace(/^\//, "");
  const doc = legalDocuments[key];

  if (!doc) return null;

  return (
    <div className="legal-page">
      <header className="legal-header container">
        <a className="logo" href="/" aria-label={`${content.brand.name} - Startseite`}>
          <img className="brand-logo-image" src={BRAND_LOGO_URL} alt={content.brand.name} />
        </a>
        <a className="legal-back" href="/">← Zur Startseite</a>
      </header>

      <main className="legal-main container">
        <article className="legal-card">
          <p className="legal-kicker">Rechtliches</p>
          <h1>{doc.title}</h1>
          <p className="legal-updated">{doc.updated}</p>

          {doc.sections.map((section) => (
            <section className="legal-section" key={section.heading}>
              <h2>{section.heading}</h2>
              {section.blocks.map((block, index) => {
                if (block.type === "ul") {
                  return (
                    <ul key={`${section.heading}-${index}`}>
                      {block.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  );
                }
                return (
                  <p key={`${section.heading}-${index}`} className="legal-paragraph">
                    {block.text.split("\n").map((line, lineIndex) => (
                      <span key={`${line}-${lineIndex}`}>
                        {line}
                        {lineIndex < block.text.split("\n").length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                );
              })}
            </section>
          ))}
        </article>
      </main>

      <footer className="legal-footer">
        <div className="container legal-footer-inner">
          <span>© 2026 {content.brand.name}</span>
          <nav aria-label="Rechtliche Hinweise">
            <a href="/agb">AGB</a>
            <a href="/widerruf">Widerruf & Erstattung</a>
            <a href="/datenschutz">Datenschutz</a>
            <a href="/impressum">Impressum</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
