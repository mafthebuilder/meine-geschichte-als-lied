import { useEffect, useState } from "react";
import { defaultContent } from "./config/defaultContent";
import { getSiteContent } from "./lib/api";
import HomePage from "./pages/HomePage";
import ComposerPage from "./pages/ComposerPage";
import AdminPage from "./pages/AdminPage";
import type { SiteContent } from "./types";

export default function App() {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  useEffect(() => { getSiteContent().then(setContent); }, []);

  useEffect(() => {
    const c = content.brand.colors;
    const root = document.documentElement;
    root.style.setProperty("--primary", c.primary);
    root.style.setProperty("--secondary", c.secondary);
    root.style.setProperty("--background", c.background);
    root.style.setProperty("--text", c.text);
    root.style.setProperty("--accent", c.accent);
  }, [content]);

  const path = window.location.pathname.replace(/\/$/, "") || "/";
  if (path === "/composer") return <ComposerPage content={content} />;
  if (path === "/admin") return <AdminPage content={content} onChange={setContent} />;
  return <HomePage content={content} />;
}
