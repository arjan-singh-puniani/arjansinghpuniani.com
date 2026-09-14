import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/site";
import styles from "./rally-house.module.css";

export const metadata: Metadata = {
  title: "Rally House — Presence & Acting",
  description:
    "Play Rally House, Arjan Singh Puniani's cozy social tennis simulation where coaching, routines, relationships, witnessed moments, decorating, and club history shape a living academy.",
  alternates: { canonical: "/playground/rally-house" },
  openGraph: {
    type: "website",
    url: `${siteUrl}/playground/rally-house`,
    title: "Rally House | Arjan Singh Puniani",
    description:
      "A cozy living tennis academy where people notice what happens, reactions linger, conversations are earned, and the club remembers.",
    images: [{
      url: "/rally-house/preview.png",
      width: 1100,
      height: 760,
      alt: "Rally House living tennis academy with characters gathered around an isometric court after hours",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rally House | Arjan Singh Puniani",
    description:
      "A cozy social tennis simulation about coaching, presence, relationships, and a club that develops a history.",
    images: ["/rally-house/preview.png"],
  },
};

export default function RallyHousePage() {
  return (
    <>
      <header className={styles.hero}>
        <div className={`shell ${styles.heroGrid}`}>
          <div>
            <Link className={styles.back} href="/playground">← Playground</Link>
            <p className="eyebrow">Rally House · Cozy social tennis simulation</p>
            <h1>A little club that notices.</h1>
            <p className={styles.deck}>
              Coach a lesson, wander through the academy, decorate a corner, and watch people react to what actually happened. Relationships, witnessed moments, routines, favorite places, and club history carry forward.
            </p>
            <div className={styles.actions}>
              <a className="button" href="#play">Play Rally House ↓</a>
              <a className={styles.textLink} href="/rally-house/index.html" target="_blank" rel="noreferrer">Open full screen ↗</a>
            </div>
          </div>
          <aside className={styles.summary} aria-label="Rally House game summary">
            <p>PRESENCE & ACTING / v16</p>
            <dl>
              <div><dt>Do</dt><dd>Coach · wander · decorate</dd></div>
              <div><dt>People</dt><dd>Notice · react · remember</dd></div>
              <div><dt>Club</dt><dd>Routines · rituals · history</dd></div>
            </dl>
          </aside>
        </div>
      </header>

      <section className={styles.gameSection} id="play" aria-label="Playable Rally House game">
        <div className="shell">
          <div className={styles.frameShell}>
            <iframe className={styles.gameFrame} src="/rally-house/index.html" title="Rally House interactive living tennis academy" loading="eager" allow="fullscreen" />
          </div>
          <div className={styles.gameFooter}>
            <p>Tap to walk · drag to pan · Shift/right-drag to orbit · pinch or scroll to zoom.</p>
            <a href="/rally-house/index.html" target="_blank" rel="noreferrer">Full-screen game ↗</a>
          </div>
        </div>
      </section>

      <section className={styles.whySection}>
        <div className="shell">
          <p className="eyebrow">Why it feels alive</p>
          <div className={styles.whyGrid}>
            <article><span>01</span><h2>People notice.</h2><p>Witnesses pause, outcomes affect mood, and reactions can persist after the moment instead of vanishing when the animation ends.</p></article>
            <article><span>02</span><h2>Conversations are earned.</h2><p>Follow-ups, reflections, and reconciliation draw from actual club events rather than manufacturing history the player never created.</p></article>
            <article><span>03</span><h2>The place remembers.</h2><p>Coaching evidence, favorite objects, routines, relationships, and bounded memories influence what people do later.</p></article>
          </div>
        </div>
      </section>
    </>
  );
}
