import { useEffect, useState } from "react";
import { defaultContent } from "./config/defaultContent";
import { getSiteContent } from "./lib/api";
import { setupMetaPixel } from "./lib/meta";
import HomePage from "./pages/HomePage";
import ComposerPage from "./pages/ComposerPage";
import AdminPage from "./pages/AdminPage";
import DeliveryPage from "./pages/DeliveryPage";
import PreviewPage from "./pages/PreviewPage";
import { trackAnalyticsEvent } from "./lib/analytics";
import type { SiteContent } from "./types";

function CookieBanner({ content }: { content: SiteContent }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!content.privacy.cookieBannerEnabled) {
      setVisible(false);
      return;
    }
    setVisible(!localStorage.getItem("mhc_tracking_consent"));
  }, [content.privacy.cookieBannerEnabled]);

  function choose(value: "accepted" | "rejected") {
    localStorage.setItem("mhc_tracking_consent", value);
    window.dispatchEvent(new CustomEvent("mhc:consent-change", { detail: value }));
    setVisible(false);
  }

  if (!visible) return null;
  return <div className="cookie-banner" role="dialog" aria-label="Datenschutzeinstellungen">
    <p>{content.privacy.text}</p>
    <div>
      <button type="button" className="cookie-reject" onClick={() => choose("rejected")}>{content.privacy.rejectLabel}</button>
      <button type="button" className="button cookie-accept" onClick={() => choose("accepted")}>{content.privacy.acceptLabel}</button>
    </div>
  </div>;
}

export default function App() {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [contentLoaded, setContentLoaded] = useState(false);
  const path = window.location.pathname.replace(/\/$/, "") || "/";

  useEffect(() => {
    getSiteContent().then(setContent).finally(() => setContentLoaded(true));
  }, []);

  useEffect(() => {
    if (path === "/" || path === "/composer") void trackAnalyticsEvent("LandingPageView");
  }, [path]);

  useEffect(() => {
    if (!contentLoaded || path === "/admin") return;

    setupMetaPixel(content.privacy.cookieBannerEnabled);
    const handleConsent = (event: Event) => {
      if ((event as CustomEvent<string>).detail === "accepted") setupMetaPixel(false);
    };

    window.addEventListener("mhc:consent-change", handleConsent);
    return () => window.removeEventListener("mhc:consent-change", handleConsent);
  }, [contentLoaded, content.privacy.cookieBannerEnabled, path]);

  useEffect(() => {
    const c = content.brand.colors;
    const root = document.documentElement;
    root.style.setProperty("--primary", c.primary);
    root.style.setProperty("--secondary", c.secondary);
    root.style.setProperty("--background", c.background);
    root.style.setProperty("--text", c.text);
    root.style.setProperty("--accent", c.accent);
  }, [content]);

  if (path === "/admin") return <AdminPage content={content} onChange={setContent} />;
  if (path.startsWith("/chanson/")) {
    const token = decodeURIComponent(path.slice("/chanson/".length));
    return <DeliveryPage token={token} />;
  }
  if (path.startsWith("/extrait/")) {
    const token = decodeURIComponent(path.slice("/extrait/".length));
    return <PreviewPage token={token} />;
  }

  const page = path === "/composer" ? <ComposerPage content={content} /> : <HomePage content={content} />;
  return <>{page}<CookieBanner content={content} /></>;
}
