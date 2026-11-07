"use client";

import Image from "next/image";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import styles from "./hospital.module.css";

export default function HospitalPlayer() {
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const [frameHeight, setFrameHeight] = useState(1150);
  const [message, setMessage] = useState("");
  const player = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const enter = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!playing || loaded) return;
    const timeout = window.setTimeout(() => setSlow(true), 15000);
    return () => window.clearTimeout(timeout);
  }, [playing, loaded]);

  useEffect(() => {
    const body = frame.current?.contentDocument?.body;
    if (!playing || !loaded || !body) return;
    const resize = () => setFrameHeight(Math.max(700, Math.ceil(body.getBoundingClientRect().height) + 2));
    const observer = new ResizeObserver(resize);
    observer.observe(body);
    resize();
    return () => observer.disconnect();
  }, [playing, loaded]);

  function launch() {
    // Keep touch pickup and placement controls inside the phone viewport.
    if (window.matchMedia("(max-width: 700px)").matches) {
      window.location.assign("/hospitalsim/index.html");
      return;
    }
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
    <div className={`${styles.frameShell} ${playing ? styles.active : ""}`} ref={player} style={{ "--hospital-height": `${frameHeight}px` } as CSSProperties}>
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
        {!loaded && <p className={styles.loading} role="status">{slow ? "Taking longer than expected. Try opening the experience in a new tab below." : "Opening your clinic…"}</p>}
      </> : <div className={styles.poster}>
        <Image src="/hospitalsim/docs/people-presence-scene.png" width={1600} height={1000} sizes="(max-width: 800px) 100vw, 1200px" alt="Actual advanced-scenario hospitalSIM scene; the main clinic begins empty" />
        <div className={styles.posterCopy}><p>A little room for care.</p><button ref={enter} className="button" onClick={launch}>Play hospitalSIM <span aria-hidden="true">↗</span></button><span>Build · Understand · Try again</span></div>
      </div>}
    </div>
    <div className={styles.playerFooter}>
      <p>{playing ? "Live experience" : "Starts when you enter"} · browser play</p>
      <div>{playing && <><button onClick={close}>Close experience</button><button onClick={fullscreen}>Enter fullscreen ↗</button></>}<a href="/hospitalsim/index.html" target="_blank" rel="noreferrer">Open in a new tab ↗</a></div>
    </div>
    {message && <p role="status">{message}</p>}
    <p className={styles.controls} id="hospital-controls">Build reception and hire Quinn to open. Then add a GP room and hire Mira while the first patient checks in. Patients arrive in everyday clothes, check in, change, and queue for their GP. Completed services earn revenue; booked visits introduce pharmacy and specialist rooms. Tap an entrance or exit to move it. Tap an empty room to rotate or remove it. Click or tap a person to lift them; tap a green tile to put down. Settings keeps previous hospitals and advanced challenges. Progress saves on this device; no gameplay analytics.</p>
    <noscript><p>Open <a href="/hospitalsim/index.html">hospitalSIM in its own page</a>. JavaScript and WebGL2 are required for the interactive view; the descriptions and structural references below remain available.</p></noscript>
  </>;
}
