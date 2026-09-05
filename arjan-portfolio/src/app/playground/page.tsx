import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Interactive Playground",
  description:
    "Interactive experiments by Arjan Singh Puniani in simulation, interfaces, embodied learning, and mechanically causal tennis physics.",
  alternates: { canonical: "/playground" },
  openGraph: {
    type: "website",
    url: `${siteUrl}/playground`,
    title: "Interactive Playground | Arjan Singh Puniani",
    description:
      "Interactive experiments in simulation, interfaces, embodied learning, and mechanically causal tennis physics.",
    images: ["/video/tennis-racket-background-poster.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Interactive Playground | Arjan Singh Puniani",
    description:
      "Interactive experiments in simulation, interfaces, embodied learning, and mechanically causal tennis physics.",
    images: ["/video/tennis-racket-background-poster.jpg"],
  },
};

export default function Playground() {
  return <>
    <header className="page-hero playground-hero"><div className="shell"><p className="eyebrow">Playground · Interactive experiments</p><h1>Ideas you can move.</h1><p>Small, original experiments in simulation, interfaces, and embodied learning. Playful work stays clearly separated from research, clinical evidence, and operational systems.</p></div></header>
    <section className="section"><div className="shell"><article className="playground-card"><div><span className="status">PLAYGROUND EXPERIMENT</span><p className="eyebrow">Vector Tennis / Endless Rally</p><h2>One input. Every contact counts.</h2><p>A deterministic arcade rally built over mechanically causal racket and ball physics. Start instantly, then open Racket Lab to inspect the deeper model.</p><div className="mini-causal-chain" aria-label="Read leads to timing, contact, ball state, survival, and restart">{["Read", "Time", "Strike", "Survive", "Restart"].map((item) => <span key={item}>{item}</span>)}</div><Link className="button" href="/playground/vector-tennis">Play Endless Rally</Link></div><div className="racket-mark" aria-hidden="true"><i /><b>↗</b></div></article></div></section>
  </>;
}
