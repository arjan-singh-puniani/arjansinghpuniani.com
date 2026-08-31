import type { Metadata } from "next";
import Link from "next/link";
import { VectorTennisLab } from "@/components/VectorTennisLab";

export const metadata: Metadata = {
  title: "Vector Tennis — Neon Open",
  description: "A cyberpunk arcade-tennis experiment where timing, spin, curve, bounce, and positioning shape every rally.",
  alternates: { canonical: "/playground/vector-tennis" },
};

const relationships = [
  ["Flat drive", "more pace, less net clearance"],
  ["Topspin", "dips sooner, kicks after contact"],
  ["Slice", "curves sideways, skids lower"],
  ["Position", "changes reach and available angles"],
  ["Timing", "charges cleaner, faster returns"],
  ["Overdrive", "turns a rally streak into power"],
] as const;

export default function VectorTennisPage() {
  return <div className="vector-tennis-page">
    <header className="tennis-hero"><div className="shell"><Link className="back-link" href="/playground">← Playground</Link><div className="status-row"><span className="status">PLAYABLE EXPERIMENT</span><span className="status">ARCADE PHYSICS</span></div><p className="eyebrow">Vector Tennis / Neon Open</p><h1>Win the rooftop.</h1><p>A tiny cyberpunk tennis match where every shot has a personality. Move, aim, build a rally, and use spin to pull NOVA-7 off the court.</p></div></header>

    <section className="tennis-lab-section" aria-labelledby="racket-lab-heading"><div className="shell"><div className="lab-title-row"><div><p className="eyebrow">Playable vertical slice</p><h2 id="racket-lab-heading">Neon Open</h2></div><p>First to five. Best with a keyboard, completely playable by touch.</p></div><VectorTennisLab /></div></section>

    <section className="section tennis-model" aria-labelledby="causal-model-heading"><div className="shell"><p className="eyebrow">The physics is the strategy</p><h2 id="causal-model-heading">Three shots. Three different problems for your rival.</h2><div className="relationship-grid">{relationships.map(([input, output]) => <article key={input}><strong>{input}</strong><span aria-hidden="true">→</span><p>{output}</p></article>)}</div></div></section>

    <section className="section clinical-boundary"><div className="shell case-intro"><p className="eyebrow">Model boundary</p><div><h2>Designed for feel, grounded in cause and effect.</h2><p>The game deliberately exaggerates Magnus-like curve, topspin dip, and spin-sensitive bounce so the physics reads at arcade speed. Telemetry is game-relative rather than a sports-science claim.</p><Link className="text-link" href="/playground">More playground experiments →</Link></div></div></section>
  </div>;
}
