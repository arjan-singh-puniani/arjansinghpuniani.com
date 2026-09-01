import type { Metadata } from "next";
import Link from "next/link";
import { VectorTennisExperience } from "@/components/VectorTennisExperience";

export const metadata: Metadata = {
  title: "Vector Tennis — Endless Rally",
  description: "A deterministic one-input arcade tennis experiment with mechanically causal contact, spin, trajectory, and bounce.",
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
    <header className="tennis-compact-hero"><div className="shell"><Link className="back-link" href="/playground">← Playground</Link><p className="eyebrow">Vector Tennis / Physics arcade</p><p>Time one swing. Survive the next ball. Inspect the mechanics when you want to go deeper.</p></div></header>

    <VectorTennisExperience />

    <section className="section tennis-model" aria-labelledby="causal-model-heading"><div className="shell"><p className="eyebrow">The physics is the strategy</p><h2 id="causal-model-heading">Three shots. Three different problems for your rival.</h2><div className="relationship-grid">{relationships.map(([input, output]) => <article key={input}><strong>{input}</strong><span aria-hidden="true">→</span><p>{output}</p></article>)}</div></div></section>

    <section className="section clinical-boundary"><div className="shell case-intro"><p className="eyebrow">Model boundary</p><div><h2>Designed for feel, grounded in cause and effect.</h2><p>The game deliberately exaggerates Magnus-like curve, topspin dip, and spin-sensitive bounce so the physics reads at arcade speed. Telemetry is game-relative rather than a sports-science claim.</p><Link className="text-link" href="/playground">More playground experiments →</Link></div></div></section>
  </div>;
}
