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
        if (!response.ok) throw new Error(payload.error || "Cet extrait n’est plus disponible.");
        if (active) setData(payload);
      })
      .catch(loadError => active && setError(loadError instanceof Error ? loadError.message : "Chargement impossible."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [token, previewMode]);

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => setError("La lecture n’a pas pu démarrer."));
    else audio.pause();
  }

  if (loading) return <main className="preview-page preview-state-page"><div className="preview-state-card"><span>♪</span><h1>Votre extrait arrive…</h1><p>Nous préparons votre écoute privée.</p></div></main>;
  if (!data || error) return <main className="preview-page preview-state-page"><div className="preview-state-card"><span>♪</span><h1>Extrait introuvable</h1><p>{error || "Ce lien n’est plus disponible."}</p><a href="mailto:contact@monhistoirechantee.com">Contacter Justine</a></div></main>;

  return <main className="preview-page">
    <div className="preview-orb preview-orb-one" />
    <div className="preview-orb preview-orb-two" />
    {previewMode && <div className="preview-admin-banner">Prévisualisation administrateur · aucune consultation client enregistrée</div>}

    <header className="preview-header">
      <img src={LOGO_URL} alt="Mon Histoire Chantée" />
      <span>Extrait privé</span>
    </header>

    <section className="preview-shell">
      <div className="preview-copy">
        <span className="preview-kicker">✦ Nous avons commencé à donner vie à votre histoire</span>
        <h1>Écoutez les premières secondes de la chanson de <em>{data.recipientName}</em></h1>
        <p>Bonjour {data.customerFirstName || "à vous"}, vos souvenirs ont déjà commencé à devenir une chanson. Montez le son et imaginez le moment où {data.recipientName} découvrira la version complète.</p>
      </div>

      <article className="preview-player-card">
        <div className="preview-player-heading">
          <span className="preview-music-mark">♪</span>
          <div><small>Extrait personnalisé</small><h2>Pour {data.recipientName}</h2></div>
          <span className="preview-private-pill">Privé</span>
        </div>

        <div className="preview-wave" aria-hidden="true">
          {[22,38,28,51,34,61,45,30,56,40,66,37,53,29,47,59,35,50,26,42,58,32,49,39].map((height, index) => <span key={index} style={{ height }} />)}
        </div>

        <audio ref={audioRef} src={data.audioUrl} preload="metadata" onLoadedMetadata={event => setDuration(event.currentTarget.duration || 0)} onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />

        <div className="preview-controls">
          <button type="button" onClick={togglePlayback} aria-label={playing ? "Mettre en pause" : "Écouter l’extrait"}>{playing ? "Ⅱ" : "▶"}</button>
          <div>
            <input type="range" min="0" max={duration || 1} step="0.1" value={Math.min(currentTime, duration || 1)} onChange={event => { const value = Number(event.target.value); if (audioRef.current) audioRef.current.currentTime = value; setCurrentTime(value); }} />
            <div><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
          </div>
        </div>
      </article>

      <section className="preview-cta-card">
        <span>Votre histoire mérite sa version complète</span>
        <h2>Le plus beau moment reste à créer.</h2>
        <p>Vos réponses sont sauvegardées. Vous retrouvez directement votre formule et pouvez finaliser en moins d’une minute.</p>
        <a href={data.resumeUrl}>Découvrir la chanson complète <b>✦</b></a>
        <small>Paiement sécurisé · Sans abonnement · Satisfait ou remboursé</small>
      </section>

      <footer className="preview-footer">
        <img src={LOGO_URL} alt="Mon Histoire Chantée" />
        <p>Une question ? <a href="mailto:contact@monhistoirechantee.com">Écrivez à Justine</a></p>
      </footer>
    </section>
  </main>;
}
