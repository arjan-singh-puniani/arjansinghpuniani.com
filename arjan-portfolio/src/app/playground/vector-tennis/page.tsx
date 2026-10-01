import type { Metadata } from "next";
import Link from "next/link";
import { VectorTennisExperience } from "@/components/VectorTennisExperience";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Vector Tennis — Endless Rally Physics Arcade",
  description:
    "Vector Tennis is a deterministic one-input arcade tennis experiment with racket contact, spin, trajectory, Magnus-like curve, and bounce.",
  alternates: { canonical: "/playground/vector-tennis" },
  openGraph: {
    type: "website",
    url: `${siteUrl}/playground/vector-tennis`,
    title: "Vector Tennis — Endless Rally | Arjan Singh Puniani",
    description:
      "A deterministic one-input arcade tennis experiment with racket contact, spin, trajectory, and bounce.",
    images: ["/video/tennis-racket-background-poster.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vector Tennis — Endless Rally | Arjan Singh Puniani",
    description:
      "A deterministic one-input arcade tennis experiment with racket contact, spin, trajectory, and bounce.",
    images: ["/video/tennis-racket-background-poster.jpg"],
  },
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
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Vector Tennis — Endless Rally",
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    url: `${siteUrl}/playground/vector-tennis`,
    author: { "@type": "Person", "@id": `${siteUrl}/#arjan-singh-puniani`, name: "Arjan Singh Puniani" },
    description:
      "Deterministic one-input arcade tennis experiment with racket contact, spin, trajectory, and bounce.",
    isAccessibleForFree: true,
  };

  return <div className="vector-tennis-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <header className="tennis-compact-hero"><div className="shell"><Link className="back-link" href="/playground">← Playground</Link><p className="eyebrow">Vector Tennis / Physics arcade</p><p>Time your swing to keep the rally going. Inspect the game’s spin and bounce model below.</p></div></header>

    <VectorTennisExperience />

    <section className="section tennis-model" aria-labelledby="causal-model-heading"><div className="shell"><p className="eyebrow">Shot mechanics</p><h2 id="causal-model-heading">Shot type, position, and timing</h2><div className="relationship-grid">{relationships.map(([input, output]) => <article key={input}><strong>{input}</strong><span aria-hidden="true">→</span><p>{output}</p></article>)}</div></div></section>

    <section className="section clinical-boundary"><div className="shell case-intro"><p className="eyebrow">Model boundary</p><div><h2>Arcade physics and limitations</h2><p>The game deliberately exaggerates Magnus-like curve, topspin dip, and spin-sensitive bounce so the physics reads at arcade speed. Telemetry is game-relative rather than a sports-science claim.</p><Link className="text-link" href="/playground">More playground experiments →</Link></div></div></section>
  </div>;
}
