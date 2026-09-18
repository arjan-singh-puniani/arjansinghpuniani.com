import type { Metadata } from "next";
import Link from "next/link";
import styles from "./holoanatomy.module.css";

export const metadata: Metadata = {
  title: "HoloAnatomy — Interactive 3D Anatomy",
  description: "Explore head and neck, shoulder, and heart anatomy with interactive 3D dissection, structure identification, and quizzes.",
  alternates: { canonical: "/playground/holoanatomy" },
};

export default function HoloAnatomyPage() {
  return <>
    <header className={`page-hero ${styles.hero}`}>
      <div className="shell">
        <Link href="/playground">← Playground</Link>
        <p className="eyebrow">HoloAnatomy · Interactive spatial anatomy</p>
        <h1>Explore. Pull apart. Understand.</h1>
        <p>Move through the head and neck, rotator cuff, and heart. Separate structures, inspect their relationships, and test your recall with identification quizzes.</p>
        <div className={styles.actions}>
          <a className="button" href="#anatomy">Explore anatomy ↓</a>
          <a href="/holoanatomy/index.html" target="_blank" rel="noreferrer">Open full screen ↗</a>
        </div>
      </div>
    </header>
    <section className={styles.viewerSection} id="anatomy" aria-label="Interactive anatomy viewer">
      <div className="shell">
        <p className={styles.instructions}>Drag to orbit and scroll or pinch to zoom. Choose an exhibit, select a structure, or open Quiz to practice identification.</p>
        <iframe className={styles.viewer} src="/holoanatomy/index.html" title="HoloAnatomy interactive 3D anatomy and identification quiz" loading="lazy" allow="fullscreen" />
        <p className={styles.note}>For more room on a small screen, <a href="/holoanatomy/index.html" target="_blank" rel="noreferrer">open the full-screen viewer ↗</a>.</p>
      </div>
    </section>
    <section className="section">
      <div className="shell">
        <h2>Anatomy with a source.</h2>
        <p>Educational visualization using BodyParts3D geometry. The head and neck exhibit includes the nerve structures available in this dataset; it is not a complete cranial or spinal nerve atlas.</p>
        <p>BodyParts3D, © The Database Center for Life Science licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC Attribution 4.0 International</a>.</p>
        <p><a href="/holoanatomy/anatomy-provenance.md">Read the anatomical provenance ↗</a></p>
      </div>
    </section>
  </>;
}
