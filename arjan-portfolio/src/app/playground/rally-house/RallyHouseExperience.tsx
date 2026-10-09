"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import styles from "./rally-house.module.css";

const scenes = [
  { name: "Wander", image: "club", title: "A club with a life of its own.", text: "People practise, take tea, watch the court, and find their usual corners. Tap a person or an object to join in.", alt: "Actual Rally House gameplay: a miniature club with people, tea, plants, and a tennis court" },
  { name: "Challenge", image: "transition", title: "Same place. A different perspective.", text: "Challenge a member. Both players walk to the court as the camera moves from the miniature into the match.", alt: "Actual Championship transition as the camera moves toward the court" },
  { name: "Rally", image: "rally", title: "Then it becomes a tennis game.", text: "Move, prepare your swing, and meet the ball. A landing cue helps you read the return; the racket still has to make contact.", alt: "Actual arcade tennis gameplay with a visible ball, two players, and a small swing prompt" },
] as const;

export default function RallyHouseExperience() {
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [fullscreenMessage, setFullscreenMessage] = useState("");
  const player = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  function enterClub() {
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
          <p className={styles.kicker}>Rally House / A living tennis club</p>
          <h1>A little club.<br /><em>One more rally.</em></h1>
          <p className={styles.deck}>Wander through a miniature club. Get to know its people. Challenge someone, and play tennis on the very same court.</p>
          <div className={styles.actions}>
            <button className={styles.primary} onClick={enterClub}>Play Rally House ↗</button>
            <a className={styles.textLink} href="#inside">See the transformation ↓</a>
          </div>
          <p className={styles.small}>Play in your browser. Your club saves on this device.</p>
        </div>
        <figure className={styles.heroImage}>
          <Image src="/rally-house/media/club.webp" width={1440} height={1000} priority sizes="(max-width: 800px) 100vw, 60vw" alt={scenes[0].alt} />
          <figcaption>One continuous place. Captured from the playable build.</figcaption>
        </figure>
      </div>
    </header>

    <section className={`shell ${styles.inside}`} id="inside" aria-labelledby="inside-title">
      <div className={styles.sectionHead}><p className={styles.kicker}>One place. Two rhythms.</p><h2 id="inside-title">From watching life<br />to playing the point.</h2></div>
      <div className={styles.sceneLayout}>
        <div className={styles.sceneChoices} aria-label="Gameplay scenes">
          {scenes.map((item, i) => <button key={item.name} aria-pressed={scene === i} onClick={() => setScene(i)}><span>0{i + 1}</span><strong>{item.name}</strong><span aria-hidden="true">↗</span></button>)}
          <div className={styles.sceneCopy} aria-live="polite"><h3>{scenes[scene].title}</h3><p>{scenes[scene].text}</p></div>
        </div>
        <figure className={styles.sceneImage}><Image src={`/rally-house/media/${scenes[scene].image}.webp`} width={1440} height={1000} sizes="(max-width: 800px) 100vw, 65vw" alt={scenes[scene].alt} /><figcaption>Actual gameplay · {scenes[scene].name}</figcaption></figure>
      </div>
      <details className={styles.film}><summary>Watch the continuous club-to-court capture <span>↗</span></summary><p>Recorded from the game with automated controls. Silent capture; scene descriptions are available as captions.</p><video controls playsInline preload="none" poster="/rally-house/media/club.webp" aria-label="Continuous Rally House gameplay capture"><source src="/rally-house/media/club-to-court.webm" type="video/webm" /><track kind="captions" src="/rally-house/media/club-to-court.vtt" srcLang="en" label="Scene descriptions" default /></video></details>
    </section>

    <section className={styles.playSection} id="play" aria-labelledby="play-title">
      <div className="shell">
        <div className={styles.playHeading}><div><p className={styles.kicker}>Your turn</p><h2 id="play-title">Come on in.</h2></div><a href="/rally-house/index.html" target="_blank" rel="noreferrer">Open in a new tab ↗</a></div>
        <div className={styles.frameShell} ref={player}>
          {playing ? <><iframe ref={frame} className={styles.gameFrame} src="/rally-house/index.html" title="Play Rally House" allow="fullscreen" allowFullScreen aria-describedby="rally-house-controls" onLoad={() => { setLoaded(true); frame.current?.focus({ preventScroll: true }); }} />{!loaded && <p className={styles.loading} role="status">Opening the club…</p>}</> : <div className={styles.playPoster}><Image src="/rally-house/media/rally.webp" width={1440} height={1000} sizes="100vw" alt="Rally House tennis court, ready to play" /><button className={styles.posterButton} onClick={enterClub}>Enter the club <span>↗</span></button></div>}
        </div>
        <div className={styles.playerFooter}><span>{playing ? "Live game" : "The game starts when you enter"} · browser play</span>{playing && <button onClick={fullscreen}>Enter fullscreen ↗</button>}</div>
        {fullscreenMessage && <p role="status">{fullscreenMessage}</p>}
        <div className={styles.controls} id="rally-house-controls"><p><strong>In the club</strong>Tap to walk. Tap people and objects. Drag to pan; scroll or pinch to zoom.</p><p><strong>On the court</strong>WASD or arrows to move. Space to swing. On touch screens, use the stick and Swing. Esc returns to the club.</p><p><strong>At your pace</strong>Pause the match to adjust sound and motion. Leaving the game pauses the point until you resume. Your view of the club is preserved.</p></div>
      </div>
    </section>

    <section className={`shell ${styles.details}`} aria-labelledby="detail-title">
      <figure><Image src="/rally-house/media/bell-reach.webp" width={1440} height={1000} sizes="(max-width: 800px) 100vw, 50vw" alt="Actual gameplay: the player reaching for the bell on the front edge of the reception counter" /><figcaption>A small action, with a visible response.</figcaption></figure>
      <div><p className={styles.kicker}>Attention, not administration</p><h2 id="detail-title">Small things<br />make a place.</h2><p>Ring the bell. Tend a plant. Read the club journal. An action can bring a reach, a sound, a glance, and a record of what happened.</p><p>Those records matter. Completed matches enter club memory; a member’s last Championship with you appears when you select them. An unfinished match never becomes an invented result.</p></div>
    </section>
    <section className={`shell ${styles.decisions}`} aria-label="Design and engineering decisions">
      {[
        ["The world is the interface", "Context follows the person or object you select. Facts come from the simulation and its saved records."],
        ["Contact has one source", "The racket’s string bed determines the strike. Ball release, impact sound, and feedback follow that contact."],
        ["Memory follows events", "Object visits and Championship results enter history only when the action actually completes."],
        ["A continuous court", "Walking routes go around the net posts. The match changes camera and controls, then returns to the same club."],
      ].map(([title, text], i) => <article key={title}><span>0{i + 1}</span><h3>{title}</h3><p>{text}</p></article>)}
    </section>
    <footer className={`shell ${styles.colophon}`}><p>Built by Arjan Singh Puniani</p><p>Gameplay, simulation, interaction, and animation · TypeScript · custom WebGL2 renderer · fixed-step simulation · local saves</p><p>All images and footage on this page come from Rally House.</p></footer>
  </div>;
}
