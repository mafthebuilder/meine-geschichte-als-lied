import { useEffect, useRef, useState, type FormEvent } from "react";

const LOGO_URL = "/mhc-logo-v2.png";

type DeliveryData = {
  orderName: string;
  customerFirstName: string;
  recipientName: string;
  offer: string;
  offerName: string;
  audioUrl: string;
  downloadUrl: string;
  revisionCount: number;
  revisionLimit: number | null;
  canRequestRevision: boolean;
  revisionPending: boolean;
  deliveredAt: string;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export default function DeliveryPage({ token }: { token: string }) {
  const [data, setData] = useState<DeliveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showRevision, setShowRevision] = useState(false);
  const [revisionType, setRevisionType] = useState("lyrics");
  const [revisionMessage, setRevisionMessage] = useState("");
  const [songMoment, setSongMoment] = useState("");
  const [revisionStatus, setRevisionStatus] = useState("");
  const [sendingRevision, setSendingRevision] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewMode = new URLSearchParams(window.location.search).get("preview") === "1";

  useEffect(() => {
    let active = true;
    fetch(`/api/delivery/${encodeURIComponent(token)}${previewMode ? "?preview=1" : ""}`)
      .then(async response => {
        const payload = await response.json() as DeliveryData & { error?: string };
        if (!response.ok) throw new Error(payload.error || "Cette page de livraison est introuvable.");
        if (active) setData(payload);
      })
      .catch(loadError => active && setError(loadError instanceof Error ? loadError.message : "Chargement impossible."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [token]);

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => setError("La lecture audio n’a pas pu démarrer."));
    else audio.pause();
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(value)) return;
    audio.currentTime = value;
    setCurrentTime(value);
  }

  async function downloadSong() {
    if (!data || downloading) return;
    setDownloading(true);
    setError("");
    try {
      const response = await fetch(data.downloadUrl, {
        method: "GET",
        credentials: "same-origin"
      });
      if (!response.ok) throw new Error("Le téléchargement n’a pas pu démarrer.");

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        throw new Error("Le fichier audio est temporairement indisponible.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const safeRecipient = (data.recipientName || "votre-proche")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `chanson-pour-${safeRecipient || "votre-proche"}.mp3`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Téléchargement impossible.");
    } finally {
      setDownloading(false);
    }
  }

  async function submitRevision(event: FormEvent) {
    event.preventDefault();
    if (!revisionMessage.trim()) {
      setRevisionStatus("Décrivez la modification souhaitée.");
      return;
    }
    setSendingRevision(true);
    setRevisionStatus("");
    try {
      const response = await fetch("/api/delivery/revisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          revisionType,
          message: revisionMessage.trim(),
          songMoment: songMoment.trim()
        })
      });
      const payload = await response.json() as { ok?: boolean; revisionCount?: number; error?: string };
      if (!response.ok) throw new Error(payload.error || "Votre demande n’a pas pu être envoyée.");
      setRevisionStatus("Votre demande a bien été envoyée à Justine ✓");
      setRevisionMessage("");
      setSongMoment("");
      setData(current => current ? {
        ...current,
        revisionCount: payload.revisionCount ?? current.revisionCount + 1,
        canRequestRevision: false,
        revisionPending: true
      } : current);
    } catch (submitError) {
      setRevisionStatus(submitError instanceof Error ? submitError.message : "Envoi impossible.");
    } finally {
      setSendingRevision(false);
    }
  }

  if (loading) return <main className="delivery-page delivery-state-page"><div className="delivery-state-card"><span className="delivery-note">♪</span><h1>Votre chanson arrive…</h1><p>Nous préparons votre espace privé.</p></div></main>;

  if (!data || error) return <main className="delivery-page delivery-state-page"><div className="delivery-state-card"><span className="delivery-note">♪</span><h1>Lien introuvable</h1><p>{error || "Cette page n’est plus disponible."}</p><a href="mailto:contact@monhistoirechantee.com">Contacter Justine</a></div></main>;

  const revisionUsed = data.revisionLimit !== null && data.revisionCount >= data.revisionLimit;
  const noRevisionIncluded = data.revisionLimit === 0;
  const revisionDescription = noRevisionIncluded
    ? `Votre formule ${data.offerName} n’inclut pas de révision.`
    : data.revisionPending
      ? "Votre demande de révision est en cours de traitement."
      : data.revisionLimit === null
        ? `Votre formule ${data.offerName} inclut des révisions illimitées, une demande à la fois.`
        : revisionUsed
          ? `${data.revisionLimit > 1 ? "Vos révisions incluses ont" : "Votre révision incluse a"} déjà été utilisée${data.revisionLimit > 1 ? "s" : ""}.`
          : `Votre formule ${data.offerName} inclut ${data.revisionLimit} révision${data.revisionLimit > 1 ? "s" : ""}.`;

  return <main className="delivery-page">
    <div className="delivery-glow delivery-glow-one" />
    <div className="delivery-glow delivery-glow-two" />

    {previewMode && <div className="delivery-preview-banner">Mode prévisualisation administrateur · aucune consultation client enregistrée</div>}
    <header className="delivery-header">
      <img src={LOGO_URL} alt="Mon Histoire Chantée" />
      <span>Page privée et sécurisée</span>
    </header>

    <section className="delivery-shell">
      <div className="delivery-hero-copy">
        <span className="delivery-eyebrow">✦ Votre chanson est prête</span>
        <h1>Une histoire devenue<br /><em>une chanson pour {data.recipientName}</em></h1>
        <p>Bonjour {data.customerFirstName || "à vous"}, tout ce que vous nous avez confié a maintenant une voix. Prenez un instant, montez le son et laissez l’émotion faire le reste.</p>
      </div>

      <article className="delivery-player-card">
        <div className="delivery-player-top">
          <div className="delivery-cover-mark">♪</div>
          <div>
            <span>Création originale</span>
            <h2>Pour {data.recipientName}</h2>
          </div>
          <span className="delivery-order-number">{data.orderName}</span>
        </div>

        <div className="delivery-wave" aria-hidden="true">
          {[18,34,24,46,30,58,42,26,52,38,62,33,49,25,41,56,31,45,22,36,54,29,47,35].map((height, index) => <span key={index} style={{ height }} />)}
        </div>

        <audio
          ref={audioRef}
          src={data.audioUrl}
          preload="metadata"
          onLoadedMetadata={event => setDuration(event.currentTarget.duration || 0)}
          onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />

        <div className="delivery-controls">
          <button type="button" className="delivery-play-button" onClick={togglePlayback} aria-label={playing ? "Mettre en pause" : "Écouter la chanson"}>
            {playing ? "Ⅱ" : "▶"}
          </button>
          <div className="delivery-progress-wrap">
            <input aria-label="Progression de la chanson" type="range" min="0" max={duration || 1} step="0.1" value={Math.min(currentTime, duration || 1)} onChange={event => seek(Number(event.target.value))} />
            <div className="delivery-time"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
          </div>
        </div>

        <button type="button" className="delivery-download-button" onClick={downloadSong} disabled={downloading}>
          <span>{downloading ? "Préparation du MP3…" : "Télécharger ma chanson"}</span><b>{downloading ? "…" : "↓"}</b>
        </button>
        <p className="delivery-download-note">Format MP3 · À conserver et partager librement avec vos proches</p>
      </article>

      <section className="delivery-gift-section">
        <span className="delivery-section-kicker">Le moment parfait</span>
        <h2>Comment lui faire découvrir la chanson ?</h2>
        <div className="delivery-gift-grid">
          <article><span>01</span><strong>Créez un vrai moment</strong><p>Choisissez un instant calme où cette personne pourra écouter sans être interrompue.</p></article>
          <article><span>02</span><strong>Gardez la surprise</strong><p>Lancez simplement la chanson et observez le moment où elle reconnaît son histoire.</p></article>
          <article><span>03</span><strong>Conservez la réaction</strong><p>Filmez discrètement si le contexte s’y prête. Ce souvenir peut devenir aussi précieux que la chanson.</p></article>
        </div>
      </section>

      <section className="delivery-revision-card">
        <div>
          <span className="delivery-section-kicker">Votre satisfaction compte</span>
          <h2>Une petite modification à demander ?</h2>
          <p>{revisionDescription}</p>
        </div>

        {!showRevision && data.canRequestRevision && <button type="button" className="delivery-revision-button" onClick={() => setShowRevision(true)}>Demander une révision</button>}
        {!data.canRequestRevision && !data.revisionPending && <a className="delivery-revision-button secondary" href="mailto:contact@monhistoirechantee.com">Écrire à Justine</a>}
        {data.revisionPending && <span className="delivery-revision-pending">Demande en cours</span>}

        {showRevision && data.canRequestRevision && <form className="delivery-revision-form" onSubmit={submitRevision}>
          <label>Que souhaitez-vous modifier ?
            <select value={revisionType} onChange={event => setRevisionType(event.target.value)}>
              <option value="lyrics">Les paroles</option>
              <option value="pronunciation">La prononciation d’un prénom</option>
              <option value="voice_style">La voix ou le style musical</option>
              <option value="other">Un autre élément</option>
            </select>
          </label>
          <label>Décrivez précisément la modification
            <textarea rows={5} value={revisionMessage} onChange={event => setRevisionMessage(event.target.value)} placeholder="Exemple : remplacer la phrase du deuxième couplet par…" />
          </label>
          <label>À quel moment de la chanson ? <small>Facultatif</small>
            <input value={songMoment} onChange={event => setSongMoment(event.target.value)} placeholder="Exemple : vers 1 min 12" />
          </label>
          <div className="delivery-revision-actions">
            <button type="button" onClick={() => setShowRevision(false)}>Annuler</button>
            <button type="submit" disabled={sendingRevision}>{sendingRevision ? "Envoi…" : "Envoyer ma demande"}</button>
          </div>
          {revisionStatus && <p className="delivery-revision-status">{revisionStatus}</p>}
        </form>}
      </section>
    </section>

    <footer className="delivery-footer">
      <img src={LOGO_URL} alt="Mon Histoire Chantée" />
      <p>Cette page est strictement privée. Une question ? <a href="mailto:contact@monhistoirechantee.com">Écrivez à Justine</a>.</p>
    </footer>
  </main>;
}
