"use client";

import Image from "next/image";
import Link from "next/link";
import { type MouseEvent, useRef, useState } from "react";
import guide from "./guide-screens.json";
import styles from "./rally-house.module.css";

const steps = [
  { title: "Play tennis immediately.", text: "Tap a club member, then choose Challenge to Match.", screen: guide.challenge, alt: "Isometric club view with Challenge to Match highlighted in a member’s menu" },
  { title: "Championship mode.", text: "Use the touch stick and Swing. On a keyboard: arrows and Space.", screen: guide.championship, alt: "Championship court view with the movement and swing controls highlighted" },
  { title: "Replay your last shot.", text: "After a point, choose Analyze last swing.", screen: guide.analyze, alt: "A completed point with the Analyze last swing button highlighted" },
  { title: "Analyze your swing like a pro.", text: "Pause, scrub and inspect your joints on the replay.", screen: guide.lab, alt: "The recorded shot in AnatomyMotion with a registered body rig and elbow analysis" },
] as const;

export default function RallyHouseExperience() {
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [fullscreenMessage, setFullscreenMessage] = useState("");
  const player = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  function enterClub(event: MouseEvent<HTMLAnchorElement>) {
    // Touch play gets the whole viewport so rotation cannot scroll an active iframe offscreen.
    if (window.matchMedia("(pointer: coarse)").matches || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setPlaying(true);
    player.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }
  async function fullscreen() {
    try {
      if (!player.current?.requestFullscreen) throw new Error("Fullscreen unavailable");
      await player.current.requestFullscreen();
    } catch {
      setFullscreenMessage("Fullscreen is unavailable here. Use Open in a new tab above.");
    }
  }
  return <div className={styles.experience}>
    <header className={styles.hero}>
      <div className={`shell ${styles.heroGrid}`}>
        <div className={styles.heroCopy}>
          <Link className={styles.back} href="/playground">← Playground</Link>
          <p className={styles.kicker}>Rally House</p>
          <h1><span>The Sims meets</span>{" "}<em>Mario Tennis.</em></h1>
          <p className={styles.deck}>Build your club. Play a point. See your swing.</p>
          <div className={styles.actions}>
            <a className={styles.primary} href="/rally-house/index.html" onClick={enterClub}>Play Rally House ↗</a>
            <a className={styles.textLink} href="#how-to-play">See how it plays ↓</a>
          </div>
          <p className={styles.small}>Free browser play. Your club saves on this device.</p>
        </div>
        <figure className={styles.heroImage}>
          <Image src={`/rally-house/media/${guide.club.image}`} width={guide.club.width} height={guide.club.height} priority sizes="(max-width: 800px) 100vw, 60vw" alt="Rally House’s isometric tennis club, with its court, café and club members" />
          <figcaption>Actual gameplay</figcaption>
        </figure>
      </div>
    </header>

    <section className={`shell ${styles.walkthrough}`} id="how-to-play" aria-labelledby="guide-title">
      <h2 id="guide-title">How to play</h2>
      <ol className={styles.steps}>
        {steps.map((step, i) => <li className={styles.step} key={step.title}>
          <div className={styles.stepCopy}><span className={styles.stepNumber}>0{i + 1}</span><h3>{step.title}</h3><p>{step.text}</p></div>
          <figure>
            <div className={styles.screen}>
              <Image src={`/rally-house/media/${step.screen.image}`} width={step.screen.width} height={step.screen.height} sizes="(max-width: 800px) 100vw, 70vw" alt={step.alt} />
              {step.screen.callout && <span className={styles.callout} aria-hidden="true" data-testid="screen-callout" style={{ left: `${step.screen.callout.left}%`, top: `${step.screen.callout.top}%`, width: `${step.screen.callout.width}%`, height: `${step.screen.callout.height}%` }} />}
            </div>
            {i === 3 && <figcaption>VectorCourt × AnatomyMotion · Analysis uses your recorded game motion.</figcaption>}
          </figure>
        </li>)}
      </ol>
    </section>

    <section className={styles.playSection} id="play" aria-labelledby="play-title">
      <div className="shell">
        <div className={styles.playHeading}><h2 id="play-title">Your court.</h2><a href="/rally-house/index.html" target="_blank" rel="noreferrer">Open in a new tab ↗</a></div>
        <div className={styles.frameShell} ref={player}>
          {playing ? <><iframe ref={frame} className={styles.gameFrame} src="/rally-house/index.html" title="Play Rally House" allow="fullscreen" allowFullScreen aria-describedby="rally-house-controls" onLoad={() => { setLoaded(true); frame.current?.focus({ preventScroll: true }); }} />{!loaded && <p className={styles.loading} role="status">Opening the club…</p>}</> : <div className={styles.playPoster}><Image src={`/rally-house/media/${guide.championship.image}`} width={guide.championship.width} height={guide.championship.height} sizes="100vw" alt="The Rally House court, ready for Championship" /><a className={styles.posterButton} href="/rally-house/index.html" onClick={enterClub}>Enter the club <span>↗</span></a></div>}
        </div>
        <div className={styles.playerFooter}><span>{playing ? "Live game" : "Starts when you enter"}</span>{playing && <button onClick={fullscreen}>Enter fullscreen ↗</button>}</div>
        {fullscreenMessage && <p role="status">{fullscreenMessage}</p>}
        <p className={styles.controls} id="rally-house-controls"><span><strong>Club</strong> Tap to walk and interact.</span><span><strong>Court</strong> WASD / arrows · Space to swing.</span><span><strong>Touch</strong> Stick + Swing.</span></p>
      </div>
    </section>
    <footer className={`shell ${styles.colophon}`}>Built by Arjan Singh Puniani · All screens captured from the game.</footer>
  </div>;
}
