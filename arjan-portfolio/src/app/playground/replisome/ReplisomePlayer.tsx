"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./replisome.module.css";

export default function ReplisomePlayer() {
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const [message, setMessage] = useState("");
  const player = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const enter = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!playing || loaded) return;
    const timeout = window.setTimeout(() => setSlow(true), 15000);
    return () => window.clearTimeout(timeout);
  }, [playing, loaded]);

  function launch() {
    setLoaded(false);
    setSlow(false);
    setMessage("");
    setPlaying(true);
    player.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }

  function close() {
    setPlaying(false);
    setLoaded(false);
    setMessage("");
    window.requestAnimationFrame(() => enter.current?.focus({ preventScroll: true }));
  }

  async function fullscreen() {
    try {
      if (!player.current?.requestFullscreen) throw new Error("Fullscreen unavailable");
      await player.current.requestFullscreen();
    } catch {
      setMessage("Fullscreen is unavailable here. Use Open in a new tab for more space.");
    }
  }

  return <>
    <div className={`${styles.frameShell} ${playing ? styles.active : ""}`} ref={player}>
      {playing ? <>
        <iframe
          ref={frame}
          className={styles.simFrame}
          src="/replisome/index.html"
          title="REPLISOME: interactive DNA replication experience"
          allow="fullscreen"
          allowFullScreen
          aria-describedby="replisome-controls"
          onLoad={() => { setLoaded(true); frame.current?.focus({ preventScroll: true }); }}
        />
        {!loaded && <p className={styles.loading} role="status">{slow ? "Taking longer than expected. Try opening the experience in a new tab below." : "Opening the replication fork…"}</p>}
      </> : <div className={styles.poster}>
        <Image src="/replisome/preview.webp" width={1200} height={900} sizes="(max-width: 800px) 100vw, 1200px" alt="Colorful molecular complexes surrounding the DNA replication fork" />
        <div className={styles.posterCopy}><p>One fork. Two strands.</p><button ref={enter} className="button" onClick={launch}>Enter experience <span aria-hidden="true">↗</span></button><span>Watch · Explore · Play</span></div>
      </div>}
    </div>
    <div className={styles.playerFooter}>
      <p>{playing ? "Live experience" : "Starts when you enter"} · browser play</p>
      <div>{playing && <><button onClick={close}>Close experience</button><button onClick={fullscreen}>Enter fullscreen ↗</button></>}<a href="/replisome/index.html" target="_blank" rel="noreferrer">Open in a new tab ↗</a></div>
    </div>
    {message && <p role="status">{message}</p>}
    <p className={styles.controls} id="replisome-controls">Choose Watch, Explore, or Play inside the experience. Space pauses playback; L toggles labels. In Explore, drag to orbit and pinch or scroll to zoom. Closing the experience ends the current session.</p>
    <noscript><p>Open <a href="/replisome/index.html">REPLISOME in its own page</a>. JavaScript and WebGL2 are required for the interactive view; the descriptions and structural references below remain available.</p></noscript>
  </>;
}
