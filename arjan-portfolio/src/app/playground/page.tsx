import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { siteUrl } from "@/lib/site";
import styles from "./playground.module.css";

export const metadata: Metadata = {
  title: "Interactive Playground",
  description:
    "Interactive experiments by Arjan Singh Puniani in cozy social simulation, tennis, embodied learning, mechanically causal physics, and Formula-style mechanical systems.",
  alternates: { canonical: "/playground" },
  openGraph: {
    type: "website",
    url: `${siteUrl}/playground`,
    title: "Interactive Playground | Arjan Singh Puniani",
    description:
      "Interactive experiments in cozy social simulation, tennis, embodied learning, physics, and Formula-style mechanical systems.",
    images: ["/video/tennis-racket-background-poster.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Interactive Playground | Arjan Singh Puniani",
    description:
      "Interactive experiments in cozy social simulation, tennis, embodied learning, physics, and Formula-style mechanical systems.",
    images: ["/video/tennis-racket-background-poster.jpg"],
  },
};

export default function Playground() {
  return <>
    <header className="page-hero playground-hero"><div className="shell"><p className="eyebrow">Playground · Interactive experiments</p><h1>Ideas you can move.</h1><p>Small, original experiments in games, simulation, tennis, embodied learning, and playful systems.</p></div></header>
    <section className="section"><div className="shell"><article className="playground-card"><div><span className="status">PLAYGROUND EXPERIMENT</span><p className="eyebrow">Vector Tennis / Endless Rally</p><h2>One input. Every contact counts.</h2><p>A deterministic arcade rally built over mechanically causal racket and ball physics. Start instantly, then open Racket Lab to inspect the deeper model.</p><div className="mini-causal-chain" aria-label="Read leads to timing, contact, ball state, survival, and restart">{["Read", "Time", "Strike", "Survive", "Restart"].map((item) => <span key={item}>{item}</span>)}</div><Link className="button" href="/playground/vector-tennis">Play Endless Rally</Link></div><div className="racket-mark" aria-hidden="true"><i /><b>↗</b></div></article></div></section>
    <section className="section"><div className="shell"><article className={`playground-card ${styles.pitCard}`}><div><span className="status">MECHANICAL LAB</span><p className="eyebrow">Formula Systems / Pit Stop Lab</p><h2>Three seconds. One mechanical chain.</h2><p>Inspect a procedural center-lock wheel change with a wheel gun, retained nut, splined hub, brake assembly, incoming wheel, jack release, camera presets, and exploded views.</p><Link className="button" href="/playground/pit-stop">Open Pit Stop Lab</Link></div><figure className={styles.pitPreview}><Image src="/pit-stop-lab/preview.png" alt="Formula-style center-lock pit wheel simulation" fill sizes="(max-width: 800px) 100vw, 46vw" /></figure></article></div></section>
    <section className="section"><div className="shell"><article className={styles.rallyEntry}><div className={styles.rallyCopy}><span className="status">FEATURED COZY GAME</span><p className="eyebrow">Rally House / Presence & Acting</p><h2>A little club that notices.</h2><p>Coach, wander, decorate, and watch people react to what actually happened. Relationships, witnessed moments, routines, favorite places, and club history carry forward.</p><div className={styles.rallyRhythm} aria-label="Coach, notice, react, remember, return"><span>Coach</span><span>Notice</span><span>React</span><span>Remember</span><span>Return</span></div><Link className="button" href="/playground/rally-house">Enter Rally House</Link></div><figure className={styles.rallyPreview}><Image src="/rally-house/preview.png" alt="Rally House living tennis academy with stylized characters around an isometric court" fill sizes="(max-width: 800px) 100vw, 48vw" /></figure></article></div></section>
  </>;
}
