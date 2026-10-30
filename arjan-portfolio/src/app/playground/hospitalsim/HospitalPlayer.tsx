"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./hospital.module.css";

export default function HospitalPlayer() {
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
          src="/hospitalsim/index.html"
          title="hospitalSIM: hospital management game"
          allow="fullscreen"
          allowFullScreen
          aria-describedby="hospital-controls"
          onLoad={() => { setLoaded(true); frame.current?.focus({ preventScroll: true }); }}
        />
        {!loaded && <p className={styles.loading} role="status">{slow ? "Taking longer than expected. Try opening the experience in a new tab below." : "Opening your neighborhood hospital…"}</p>}
      </> : <div className={styles.poster}>
        <Image src="/hospitalsim/preview.webp" width={1200} height={900} sizes="(max-width: 800px) 100vw, 1200px" alt="Actual hospitalSIM browser build with three medical platforms and clinicians" />
        <div className={styles.posterCopy}><p>A little room for care.</p><button ref={enter} className="button" onClick={launch}>Play hospitalSIM <span aria-hidden="true">↗</span></button><span>Build · Understand · Try again</span></div>
      </div>}
    </div>
    <div className={styles.playerFooter}>
      <p>{playing ? "Live experience" : "Starts when you enter"} · browser play</p>
      <div>{playing && <><button onClick={close}>Close experience</button><button onClick={fullscreen}>Enter fullscreen ↗</button></>}<a href="/hospitalsim/index.html" target="_blank" rel="noreferrer">Open in a new tab ↗</a></div>
    </div>
    {message && <p role="status">{message}</p>}
    <p className={styles.controls} id="hospital-controls">Add a consultation, then watch the next queue. People & rooms provides patient inspection and upgrades. Build mode pauses time; use the location list or arrows and Enter to place. Resume with Play. Shift settings contains all scenarios, policy experiments, checkpoints and device checks. Closing saves on this device; no gameplay analytics.</p>
    <noscript><p>Open <a href="/hospitalsim/index.html">hospitalSIM in its own page</a>. JavaScript and WebGL2 are required for the interactive view; the descriptions and structural references below remain available.</p></noscript>
  </>;
}
