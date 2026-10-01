import type { Metadata } from "next";
import Link from "next/link";
import styles from "./holoanatomy.module.css";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "HoloAnatomy — Interactive 3D Anatomy",
  description: "An interactive anatomy prototype with head and neck, shoulder, and heart models using BodyParts3D geometry.",
  alternates: { canonical: "/playground/holoanatomy" },
  openGraph: {
    type: "website", url: `${siteUrl}/playground/holoanatomy`,
    title: "HoloAnatomy | Arjan Singh Puniani",
    description: "An interactive anatomy prototype with head and neck, shoulder, and heart models using BodyParts3D geometry.",
    images: ["/images/playground/anatomy-learner.webp"],
  },
  twitter: {
    card: "summary_large_image", title: "HoloAnatomy | Arjan Singh Puniani",
    description: "An interactive anatomy prototype using BodyParts3D geometry. Learning outcomes have not been tested.",
    images: ["/images/playground/anatomy-learner.webp"],
  },
};

export default function HoloAnatomyPage() {
  return <>
    <header className={`page-hero ${styles.hero}`}>
      <div className="shell">
        <Link href="/playground">← Playground</Link>
        <p className="eyebrow">HoloAnatomy · Interactive spatial anatomy</p>
        <h1>HoloAnatomy</h1>
        <p>I built this anatomy prototype using head and neck, shoulder, and heart geometry. Rotate the models, separate structures, and inspect their relationships.</p>
        <div className={styles.actions}>
          <a className="button" href="#anatomy">Explore anatomy ↓</a>
          <a href="/holoanatomy/index.html" target="_blank" rel="noreferrer">Open full screen ↗</a>
        </div>
      </div>
    </header>
    <section className={styles.viewerSection} id="anatomy" aria-label="Interactive anatomy viewer">
      <div className="shell">
        <p className={styles.instructions}>Drag to orbit and scroll or pinch to zoom. Choose an exhibit and select a structure to inspect or isolate it.</p>
        <iframe className={styles.viewer} src="/holoanatomy/index.html" title="HoloAnatomy interactive 3D anatomy viewer" loading="lazy" allow="fullscreen" />
        <p className={styles.note}>For more room on a small screen, <a href="/holoanatomy/index.html" target="_blank" rel="noreferrer">open the full-screen viewer ↗</a>.</p>
      </div>
    </section>
    <section className="section">
      <div className="shell">
        <h2>Geometry source and limitations</h2>
        <p>Educational visualization using BodyParts3D geometry. The head and neck exhibit includes only the nerve structures available in this dataset. It is not a complete nerve atlas, and learning outcomes have not been tested.</p>
        <p>BodyParts3D, © The Database Center for Life Science licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC Attribution 4.0 International</a>.</p>
        <p><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/" target="_blank" rel="noreferrer">BodyParts3D source database ↗</a></p>
      </div>
    </section>
  </>;
}
