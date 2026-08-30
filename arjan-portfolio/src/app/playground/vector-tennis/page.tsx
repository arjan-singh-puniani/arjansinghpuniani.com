import type { Metadata } from "next";
import Link from "next/link";
import { VectorTennisLab } from "@/components/VectorTennisLab";

export const metadata: Metadata = {
  title: "Vector Tennis — Racket Lab",
  description: "An original physics-inspired arcade tennis interaction exploring racket state, contact, spin, trajectory, and feedback.",
  alternates: { canonical: "/playground/vector-tennis" },
};

const relationships = [
  ["Swing direction", "changes outgoing direction"],
  ["Racket-face angle", "changes launch angle"],
  ["Racket-head speed", "changes outgoing speed"],
  ["Brushing model", "changes spin"],
  ["Timing + offset", "change contact quality"],
  ["Spin", "changes flight and bounce"],
] as const;

export default function VectorTennisPage() {
  return <div className="vector-tennis-page">
    <header className="tennis-hero"><div className="shell"><Link className="back-link" href="/playground">← Playground</Link><div className="status-row"><span className="status">PLAYGROUND EXPERIMENT</span><span className="status">PHYSICS-INSPIRED</span></div><p className="eyebrow">Vector Tennis / Racket Lab</p><h1>Contact changes everything.</h1><p>Move the racket. Choose a shot model. Time the swing. Learning mode exposes why the ball leaves differently.</p></div></header>

    <section className="tennis-lab-section" aria-labelledby="racket-lab-heading"><div className="shell"><div className="lab-title-row"><div><p className="eyebrow">Interactive vertical slice</p><h2 id="racket-lab-heading">Racket physics lab</h2></div><p>Mechanically coherent, not physically validated. Values are model-relative.</p></div><VectorTennisLab /></div></section>

    <section className="section tennis-model" aria-labelledby="causal-model-heading"><div className="shell"><p className="eyebrow">Causal model</p><h2 id="causal-model-heading">The controls are connected to the outcome.</h2><div className="relationship-grid">{relationships.map(([input, output]) => <article key={input}><strong>{input}</strong><span aria-hidden="true">→</span><p>{output}</p></article>)}</div></div></section>

    <section className="section clinical-boundary"><div className="shell case-intro"><p className="eyebrow">Model boundary</p><div><h2>An interaction experiment, not a sports-science claim.</h2><p>The simulation exaggerates contact feedback for readability and uses a compact arcade model. It has not been validated against racket, ball, or player measurement data. Its purpose is to make cause and effect legible while keeping the interaction responsive.</p><Link className="text-link" href="/work">Return to selected work →</Link></div></div></section>
  </div>;
}
