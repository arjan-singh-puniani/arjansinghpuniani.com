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
    <section className={`section ${styles.playSection}`}><div className="shell"><article className="playground-card"><div><span className="status">INTERACTIVE ANATOMY LAB</span><p className="eyebrow">HoloAnatomy · Spatial learning</p><h2>Take anatomy into your own hands.</h2><p>Explore the head and neck, rotator cuff, and heart in 3D. Pull structures apart, inspect their relationships, and test your recall with built-in identification quizzes.</p><div className="mini-causal-chain" aria-label="Explore, dissect, identify, quiz">{["Explore", "Dissect", "Identify", "Quiz"].map((item) => <span key={item}>{item}</span>)}</div><Link className="button" href="/playground/holoanatomy">Explore HoloAnatomy</Link></div></article></div></section>
    <section className={`section ${styles.playSection}`}><div className="shell"><article className="playground-card"><div><span className="status">PLAYGROUND EXPERIMENT</span><p className="eyebrow">Vector Tennis / Endless Rally</p><h2>One input. Every contact counts.</h2><p>A deterministic arcade rally built over mechanically causal racket and ball physics. Start instantly, then open Racket Lab to inspect the deeper model.</p><div className="mini-causal-chain" aria-label="Read leads to timing, contact, ball state, survival, and restart">{["Read", "Time", "Strike", "Survive", "Restart"].map((item) => <span key={item}>{item}</span>)}</div><Link className="button" href="/playground/vector-tennis">Play Endless Rally</Link></div><div className="racket-mark" aria-hidden="true"><i /><b>↗</b></div></article></div></section>
    <section className={`section ${styles.playSection}`}><div className="shell"><article className={styles.rallyEntry}><div className={styles.rallyCopy}><span className="status">FEATURED COZY GAME</span><p className="eyebrow">Rally House · Cozy tennis life sim</p><h2>Come hang out for a while.</h2><p>Hit a few balls. Make some matcha. Move a chair into the sun. Chat with whoever’s around—or don’t. Rally House is a little tennis club for wandering, decorating, and letting the day unfold at its own pace.</p><div className={styles.rallyRhythm} aria-label="Hit, hang out, decorate, make matcha, stay awhile"><span>Hit</span><span>Hang out</span><span>Decorate</span><span>Make matcha</span><span>Stay awhile</span></div><Link className="button" href="/playground/rally-house">Enter Rally House</Link></div><figure className={styles.rallyPreview}><Image src="/rally-house/preview-cozy.webp" alt="Cozy Rally House tennis clubhouse with friends chatting in the lounge and playing on court" fill sizes="(max-width: 800px) 100vw, 55vw" priority /></figure></article></div></section>
    <section className={`section ${styles.playSection}`}><div className="shell"><article className={styles.pitEntry}><div className={styles.pitCopy}><span className="status">INTERACTIVE MECHANICAL LAB</span><p className="eyebrow">Formula Systems / Pit Stop Lab</p><h2>Inspect the mechanical chain.</h2><p>Take apart a center-lock wheel change and see how the wheel gun, retained nut, splined hub, brake assembly, incoming wheel, jack release, and timing work as one system.</p><div className={styles.pitRhythm} aria-label="Disassemble, inspect, rebuild, replay"><span>Disassemble</span><span>Inspect</span><span>Rebuild</span><span>Replay</span></div><Link className="button" href="/playground/pit-stop">Open Pit Stop Lab</Link></div><figure className={styles.pitHero}><Image src="/pit-stop-lab/preview-hero.webp" alt="Close-up Formula-style center-lock wheel, hub, and wheel gun for Pit Stop Lab" fill sizes="(max-width: 800px) 100vw, 52vw" /></figure></article></div></section>
  </>;
}
