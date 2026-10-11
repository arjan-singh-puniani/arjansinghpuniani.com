import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/site";
import ReplisomePlayer from "./ReplisomePlayer";
import styles from "./replisome.module.css";

const description = "Watch, explore, and build the molecular machinery that copies DNA in an interactive, structure-informed educational experience.";

export const metadata: Metadata = {
  title: "REPLISOME — DNA Replication",
  description,
  alternates: { canonical: "/playground/replisome" },
  openGraph: {
    type: "website",
    url: `${siteUrl}/playground/replisome`,
    title: "REPLISOME | Arjan Singh Puniani",
    description,
    images: [{ url: "/replisome/preview.webp", width: 1200, height: 900, alt: "Protein complexes and DNA at the REPLISOME replication fork" }],
  },
  twitter: { card: "summary_large_image", title: "REPLISOME | Arjan Singh Puniani", description, images: ["/replisome/preview.webp"] },
};

export default function ReplisomePage() {
  return <>
    <header className={styles.hero}>
      <div className="shell">
        <Link className={styles.back} href="/playground">← Playground</Link>
        <p className="eyebrow">DNA replication · An interactive molecular experience</p>
        <h1>REPLISOME</h1>
        <p className={styles.deck}>One fork. Two strands. A living molecular machine.</p>
        <p className={styles.intro}>Follow the proteins that open DNA, copy its instructions, and join the new strands. Watch the choreography, inspect the structures, or assemble an Okazaki fragment yourself. Open the MCAT lens to trace strand polarity, predict enzyme effects, and interpret replication experiments.</p>
      </div>
    </header>

    <section className={`shell ${styles.experience}`} aria-labelledby="experience-title">
      <div className={styles.sectionHead}>
        <div><p className="eyebrow">Inside the replication fork</p><h2 id="experience-title">Life. Copied.</h2></div>
        <span className="status">EDUCATIONAL MODEL</span>
      </div>
      <ReplisomePlayer />
    </section>

    <section className={`shell ${styles.modes}`} aria-label="Three ways to explore">
      {[
        ["01", "Watch", "Follow a continuous view of leading-strand synthesis and the repeating steps that build lagging-strand fragments."],
        ["02", "Explore", "Select a protein, inspect its role, and compare the cinematic view with deposited structural coordinates."],
        ["03", "Play", "Place a primer, load the clamp, choose a polymerase, pair nucleotides, and process and seal a fragment."],
      ].map(([number, title, text]) => <article key={title}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}
    </section>

    <section className={`shell ${styles.notes}`} aria-labelledby="notes-title">
      <div><p className="eyebrow">Evidence & interpretation</p><h2 id="notes-title">Built from structures.<br />Made for understanding.</h2></div>
      <div>
        <p>The protein models draw on deposited structures from <a href="https://www.rcsb.org/structure/7PFO">7PFO</a>, <a href="https://www.rcsb.org/structure/6TNZ">6TNZ</a>, and <a href="https://www.rcsb.org/structure/8QJ7">8QJ7</a>. Their arrangement, movement, reaction timing, and displayed ATP accounting are illustrative.</p>
        <p>This is an educational model. It combines separately solved complexes; it does not represent a validated atomistic trajectory of the complete replisome. Open “Sources & model notes” inside the experience for provenance and simplifications.</p>
        <p>The optional MCAT lens adds five visual labs and an original three-question transfer checkpoint. Predict before revealing a mechanism, then examine why each alternative succeeds or fails. It supports replication reasoning; a short checkpoint cannot establish exam readiness.</p>
        <p className={styles.small}>Runs in your browser. WebGL2 is required for the 3D view. Sound starts muted; motion and rendering quality can be adjusted inside the experience.</p>
      </div>
    </section>
  </>;
}
