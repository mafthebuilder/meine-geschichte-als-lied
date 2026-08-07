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
        if (!response.ok) throw new Error(payload.error || "Diese Lieferseite wurde nicht gefunden.");
        if (active) setData(payload);
      })
      .catch(loadError => active && setError(loadError instanceof Error ? loadError.message : "Die Seite konnte nicht geladen werden."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [token]);

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => setError("Die Wiedergabe konnte nicht gestartet werden."));
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
      if (!response.ok) throw new Error("Der Download konnte nicht gestartet werden.");

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        throw new Error("Die Audiodatei ist vorübergehend nicht verfügbar.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const safeRecipient = (data.recipientName || "dein-lieblingsmensch")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `lied-fuer-${safeRecipient || "dein-lieblingsmensch"}.mp3`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Download nicht möglich.");
    } finally {
      setDownloading(false);
    }
  }

  async function submitRevision(event: FormEvent) {
    event.preventDefault();
    if (!revisionMessage.trim()) {
      setRevisionStatus("Beschreibe bitte die gewünschte Änderung.");
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
      if (!response.ok) throw new Error(payload.error || "Deine Änderungsanfrage konnte nicht gesendet werden.");
      setRevisionStatus("Deine Änderungsanfrage wurde erfolgreich gesendet ✓");
      setRevisionMessage("");
      setSongMoment("");
      setData(current => current ? {
        ...current,
        revisionCount: payload.revisionCount ?? current.revisionCount + 1,
        canRequestRevision: false,
        revisionPending: true
      } : current);
    } catch (submitError) {
      setRevisionStatus(submitError instanceof Error ? submitError.message : "Senden nicht möglich.");
    } finally {
      setSendingRevision(false);
    }
  }

  if (loading) return <main className="delivery-page delivery-state-page"><div className="delivery-state-card"><span className="delivery-note">♪</span><h1>Dein Lied ist gleich da …</h1><p>Wir bereiten deinen privaten Bereich vor.</p></div></main>;

  if (!data || error) return <main className="delivery-page delivery-state-page"><div className="delivery-state-card"><span className="delivery-note">♪</span><h1>Link nicht gefunden</h1><p>{error || "Diese Seite ist nicht mehr verfügbar."}</p><a href="mailto:kontakt@meinegeschichtealslied.com">Support kontaktieren</a></div></main>;

  const revisionUsed = data.revisionLimit !== null && data.revisionCount >= data.revisionLimit;
  const noRevisionIncluded = data.revisionLimit === 0;
  const revisionDescription = noRevisionIncluded
    ? `Dein Paket ${data.offerName} enthält keine Überarbeitung.`
    : data.revisionPending
      ? "Deine Änderungsanfrage wird gerade bearbeitet."
      : data.revisionLimit === null
        ? `Dein Paket ${data.offerName} enthält unbegrenzte Überarbeitungen – jeweils eine Anfrage nach der anderen.`
        : revisionUsed
          ? `${data.revisionLimit > 1 ? "Deine enthaltenen Überarbeitungen wurden" : "Deine enthaltene Überarbeitung wurde"} bereits genutzt.`
          : `Dein Paket ${data.offerName} enthält ${data.revisionLimit} Überarbeitung${data.revisionLimit > 1 ? "en" : ""}.`;

  return <main className="delivery-page">
    <div className="delivery-glow delivery-glow-one" />
    <div className="delivery-glow delivery-glow-two" />

    {previewMode && <div className="delivery-preview-banner">Admin-Vorschau · kein Kundenaufruf wird erfasst</div>}
    <header className="delivery-header">
      <img src={LOGO_URL} alt="Meine Geschichte als Lied" />
      <span>Dein privater Lied-Bereich</span>
    </header>

    <section className="delivery-shell">
      <div className="delivery-hero-copy">
        <span className="delivery-eyebrow">✦ Dein persönliches Lied ist fertig</span>
        <h1>Eine Geschichte wurde<br /><em>zum Lied für {data.recipientName}</em></h1>
        <p>Hallo {data.customerFirstName || "du"}, aus deinen Erinnerungen und Worten ist jetzt ein Lied geworden. Nimm dir einen Moment, dreh den Ton auf und hör es in Ruhe an.</p>
      </div>

      <article className="delivery-player-card">
        <div className="delivery-player-top">
          <div className="delivery-cover-mark">♪</div>
          <div>
            <span>Einzigartig für euch erstellt</span>
            <h2>Für {data.recipientName}</h2>
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
          <button type="button" className="delivery-play-button" onClick={togglePlayback} aria-label={playing ? "Pause" : "Lied anhören"}>
            {playing ? "Ⅱ" : "▶"}
          </button>
          <div className="delivery-progress-wrap">
            <input aria-label="Fortschritt des Liedes" type="range" min="0" max={duration || 1} step="0.1" value={Math.min(currentTime, duration || 1)} onChange={event => seek(Number(event.target.value))} />
            <div className="delivery-time"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
          </div>
        </div>

        <button type="button" className="delivery-download-button" onClick={downloadSong} disabled={downloading}>
          <span>{downloading ? "MP3 wird vorbereitet …" : "Mein Lied herunterladen"}</span><b>{downloading ? "…" : "↓"}</b>
        </button>
        <p className="delivery-download-note">MP3-Datei · Zum Behalten, Verschenken und Teilen</p>
      </article>

      <section className="delivery-gift-section">
        <span className="delivery-section-kicker">Mach daraus euren Moment</span>
        <h2>So wird das Verschenken noch persönlicher</h2>
        <div className="delivery-gift-grid">
          <article><span>01</span><strong>Mach einen echten Moment daraus</strong><p>Wähle einen ruhigen Augenblick, in dem die Person ungestört zuhören kann.</p></article>
          <article><span>02</span><strong>Lass das Lied für sich sprechen</strong><p>Starte das Lied und beobachte den Moment, in dem die ersten vertrauten Details erkannt werden.</p></article>
          <article><span>03</span><strong>Halte die Reaktion fest</strong><p>Wenn es passt, filme den Moment ganz unauffällig. Diese Erinnerung kann genauso wertvoll werden wie das Lied selbst.</p></article>
        </div>
      </section>

      <section className="delivery-revision-card">
        <div>
          <span className="delivery-section-kicker">Deine Zufriedenheit zählt</span>
          <h2>Möchtest du etwas ändern lassen?</h2>
          <p>{revisionDescription}</p>
        </div>

        {!showRevision && data.canRequestRevision && <button type="button" className="delivery-revision-button" onClick={() => setShowRevision(true)}>Änderung anfragen</button>}
        {!data.canRequestRevision && !data.revisionPending && <a className="delivery-revision-button secondary" href="mailto:kontakt@meinegeschichtealslied.com">Support kontaktieren</a>}
        {data.revisionPending && <span className="delivery-revision-pending">Anfrage wird bearbeitet</span>}

        {showRevision && data.canRequestRevision && <form className="delivery-revision-form" onSubmit={submitRevision}>
          <label>Was möchtest du ändern?
            <select value={revisionType} onChange={event => setRevisionType(event.target.value)}>
              <option value="lyrics">Den Liedtext</option>
              <option value="pronunciation">Die Aussprache eines Namens</option>
              <option value="voice_style">Die Stimme oder den Musikstil</option>
              <option value="other">Etwas anderes</option>
            </select>
          </label>
          <label>Beschreibe die gewünschte Änderung möglichst genau
            <textarea rows={5} value={revisionMessage} onChange={event => setRevisionMessage(event.target.value)} placeholder="Beispiel: Bitte ersetze die Zeile im zweiten Vers durch …" />
          </label>
          <label>An welcher Stelle im Lied? <small>Optional</small>
            <input value={songMoment} onChange={event => setSongMoment(event.target.value)} placeholder="Beispiel: ungefähr bei 1:12" />
          </label>
          <div className="delivery-revision-actions">
            <button type="button" onClick={() => setShowRevision(false)}>Abbrechen</button>
            <button type="submit" disabled={sendingRevision}>{sendingRevision ? "Wird gesendet …" : "Anfrage senden"}</button>
          </div>
          {revisionStatus && <p className="delivery-revision-status">{revisionStatus}</p>}
        </form>}
      </section>
    </section>

    <footer className="delivery-footer">
      <img src={LOGO_URL} alt="Meine Geschichte als Lied" />
      <p>Diese Seite ist streng privat. Eine Frage? <a href="mailto:kontakt@meinegeschichtealslied.com">Unser Support hilft dir weiter</a>.</p>
    </footer>
  </main>;
}
