import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Playground",
  description: "Small interactive experiments in simulation, interfaces, and embodied learning.",
  alternates: { canonical: "/playground" },
};

export default function Playground() {
  return <>
    <header className="page-hero playground-hero"><div className="shell"><p className="eyebrow">Playground · Interactive experiments</p><h1>Ideas you can move.</h1><p>Small, original experiments in simulation, interfaces, and embodied learning. Playful work stays clearly separated from research, clinical evidence, and operational systems.</p></div></header>
    <section className="section"><div className="shell"><article className="playground-card"><div><span className="status">PLAYGROUND EXPERIMENT</span><p className="eyebrow">Vector Tennis / Racket Lab</p><h2>Feel the state change at contact.</h2><p>A physics-inspired arcade interaction where timing, racket-face angle, racket-head speed, shot model, and contact offset change the ball.</p><div className="mini-causal-chain" aria-label="Input leads to racket state, contact, ball state, trajectory, and feedback">{["Input", "Racket state", "Contact", "Ball state", "Trajectory", "Feedback"].map((item) => <span key={item}>{item}</span>)}</div><Link className="button" href="/playground/vector-tennis">Open Racket Lab</Link></div><div className="racket-mark" aria-hidden="true"><i /><b>↗</b></div></article></div></section>
  </>;
}
