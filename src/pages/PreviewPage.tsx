import { useEffect, useRef, useState } from "react";

const LOGO_URL = "/mhc-logo-v2.png";

type PreviewData = {
  recipientName: string;
  customerFirstName: string;
  audioUrl: string;
  resumeUrl: string;
  createdAt: string;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}

export default function PreviewPage({ token }: { token: string }) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewMode = new URLSearchParams(window.location.search).get("preview") === "1";

  useEffect(() => {
    let active = true;
    fetch(`/api/preview/${encodeURIComponent(token)}${previewMode ? "?preview=1" : ""}`)
      .then(async response => {
        const payload = await response.json() as PreviewData & { error?: string };
        if (!response.ok) throw new Error(payload.error || "Diese Hörprobe ist nicht mehr verfügbar.");
        if (active) setData(payload);
      })
      .catch(loadError => active && setError(loadError instanceof Error ? loadError.message : "Die Seite konnte nicht geladen werden."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [token, previewMode]);

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => setError("Die Wiedergabe konnte nicht gestartet werden."));
    else audio.pause();
  }

  if (loading) return <main className="preview-page preview-state-page"><div className="preview-state-card"><span>♪</span><h1>Deine Hörprobe ist gleich da …</h1><p>Wir bereiten deinen privaten Hörbereich vor.</p></div></main>;
  if (!data || error) return <main className="preview-page preview-state-page"><div className="preview-state-card"><span>♪</span><h1>Hörprobe nicht gefunden</h1><p>{error || "Dieser Link ist nicht mehr verfügbar."}</p><a href="mailto:kontakt@meinegeschichtealslied.com">Justine kontaktieren</a></div></main>;

  return <main className="preview-page">
    <div className="preview-orb preview-orb-one" />
    <div className="preview-orb preview-orb-two" />
    {previewMode && <div className="preview-admin-banner">Admin-Vorschau · kein Kundenaufruf wird erfasst</div>}

    <header className="preview-header">
      <img src={LOGO_URL} alt="Meine Geschichte als Lied" />
      <span>Private Hörprobe</span>
    </header>

    <section className="preview-shell">
      <div className="preview-copy">
        <span className="preview-kicker">✦ Aus euren Erinnerungen wird Musik</span>
        <h1>Hör dir die ersten Sekunden deines Liedes für <em>{data.recipientName}</em> an</h1>
        <p>Hallo {data.customerFirstName || "du"}, aus deinen Angaben ist bereits etwas ganz Persönliches entstanden. Dreh den Ton auf und stell dir den Moment vor, in dem {data.recipientName} das vollständige Lied zum ersten Mal hört.</p>
      </div>

      <article className="preview-player-card">
        <div className="preview-player-heading">
          <span className="preview-music-mark">♪</span>
          <div><small>Persönliche Hörprobe</small><h2>Für {data.recipientName}</h2></div>
          <span className="preview-private-pill">Privat</span>
        </div>

        <div className="preview-wave" aria-hidden="true">
          {[22,38,28,51,34,61,45,30,56,40,66,37,53,29,47,59,35,50,26,42,58,32,49,39].map((height, index) => <span key={index} style={{ height }} />)}
        </div>

        <audio ref={audioRef} src={data.audioUrl} preload="metadata" onLoadedMetadata={event => setDuration(event.currentTarget.duration || 0)} onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />

        <div className="preview-controls">
          <button type="button" onClick={togglePlayback} aria-label={playing ? "Pause" : "Hörprobe anhören"}>{playing ? "Ⅱ" : "▶"}</button>
          <div>
            <input type="range" min="0" max={duration || 1} step="0.1" value={Math.min(currentTime, duration || 1)} onChange={event => { const value = Number(event.target.value); if (audioRef.current) audioRef.current.currentTime = value; setCurrentTime(value); }} />
            <div><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
          </div>
        </div>
      </article>

      <section className="preview-cta-card">
        <span>Die Geschichte ist noch nicht zu Ende</span>
        <h2>Das vollständige Lied wartet auf seinen großen Moment.</h2>
        <p>Deine Angaben sind gespeichert. Du kommst direkt zu deiner Auswahl zurück und kannst die Bestellung in wenigen Augenblicken abschließen.</p>
        <a href={data.resumeUrl}>Vollständiges Lied bestellen <b>✦</b></a>
        <small>Sichere Zahlung · Kein Abo · Geld-zurück-Garantie</small>
      </section>

      <footer className="preview-footer">
        <img src={LOGO_URL} alt="Meine Geschichte als Lied" />
        <p>Eine Frage? <a href="mailto:kontakt@meinegeschichtealslied.com">Schreib Justine</a></p>
      </footer>
    </section>
  </main>;
}
