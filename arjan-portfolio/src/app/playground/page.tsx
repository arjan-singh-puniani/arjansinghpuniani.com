import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { siteUrl } from "@/lib/site";
import styles from "./playground.module.css";

export const metadata: Metadata = {
  title: "Playground",
  description: "Small interactive experiments by Arjan Singh Puniani in anatomy, tennis, cozy games, motorsport, and cardiovascular flow.",
  alternates: { canonical: "/playground" },
  openGraph: {
    type: "website",
    url: `${siteUrl}/playground`,
    title: "Playground | Arjan Singh Puniani",
    description: "Small interactive experiments in anatomy, tennis, cozy games, motorsport, and cardiovascular flow.",
    images: ["/images/playground/anatomy-learner.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Playground | Arjan Singh Puniani",
    description: "Small interactive experiments in anatomy, tennis, cozy games, motorsport, and cardiovascular flow.",
    images: ["/images/playground/anatomy-learner.webp"],
  },
};

const cards = [
  {
    status: "INTERACTIVE ANATOMY",
    eyebrow: "HoloAnatomy",
    title: "Anatomy Learner",
    description: "Explore 3D anatomy, isolate structures, and test yourself.",
    href: "/playground/holoanatomy",
    button: "Open Anatomy Learner",
    image: "/images/playground/anatomy-learner.webp",
    alt: "Detailed anatomical heart cutaway used as the Anatomy Learner project thumbnail",
    tone: "dark",
  },
  {
    status: "TENNIS GAME",
    eyebrow: "Vector Tennis",
    title: "Endless Rally",
    description: "A simple one-input tennis rally game.",
    href: "/playground/vector-tennis",
    button: "Play Endless Rally",
    image: "/images/playground/endless-rally.webp",
    alt: "Tennis racket and ball in motion for the Endless Rally game",
    tone: "dark",
  },
  {
    status: "COZY GAME",
    eyebrow: "Rally House",
    title: "Rally House",
    description: "A cozy tennis life sim about hanging out, decorating, and playing.",
    href: "/playground/rally-house",
    button: "Enter Rally House",
    image: "/rally-house/preview-cozy.webp",
    alt: "Cozy Rally House tennis clubhouse with friends chatting and playing",
    tone: "light",
  },
  {
    status: "PIT STOP GAME",
    eyebrow: "Pit Stop Lab",
    title: "Pit Stop Simulator",
    description: "A fun pit-stop simulator: change the wheel and beat the clock.",
    href: "/playground/pit-stop",
    button: "Play Pit Stop",
    image: "/images/playground/pit-stop-simulator.webp",
    alt: "Race car wheel being changed during a pit stop",
    tone: "dark",
  },
  {
    status: "CARDIO FLOW",
    eyebrow: "Hemodynamic Observatory",
    title: "Navier–Stokes Cardio Visualizer",
    description: "A cardiovascular-flow visualizer inspired by Navier–Stokes fluid dynamics.",
    href: "/playground/hemodynamic-observatory",
    button: "Open Cardio Visualizer",
    image: "/images/playground/cardio-visualizer.webp",
    alt: "Heart with red and blue computational flow streamlines",
    tone: "dark",
  },
] as const;

export default function Playground() {
  return <>
    <header className={`page-hero ${styles.hero}`}>
      <div className="shell">
        <p className="eyebrow">Playground</p>
        <h1>Playground.</h1>
        <p>Small interactive experiments.</p>
      </div>
    </header>

    <section className={styles.stack}>
      <div className="shell">
        {cards.map((card) => (
          <article className={`${styles.card} ${card.tone === "light" ? styles.light : styles.dark}`} key={card.href}>
            <div className={styles.copy}>
              <span className="status">{card.status}</span>
              <p className="eyebrow">{card.eyebrow}</p>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
              <Link className="button" href={card.href}>{card.button}</Link>
            </div>
            <figure className={styles.preview}>
              <Image src={card.image} alt={card.alt} fill sizes="(max-width: 800px) 100vw, 55vw" />
            </figure>
          </article>
        ))}
      </div>
    </section>
  </>;
}
