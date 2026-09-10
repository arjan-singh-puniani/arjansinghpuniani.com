import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Technical Notes",
  description:
    "Technical notes by Arjan Singh Puniani on active inference, reasoning systems, neural engineering, and related exploratory ideas, with clear evidence boundaries.",
  alternates: { canonical: "/notes" },
  openGraph: {
    type: "website",
    url: `${siteUrl}/notes`,
    title: "Technical Notes | Arjan Singh Puniani",
    description:
      "Exploratory technical notes on active inference, reasoning systems, neural engineering, and related ideas.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Technical Notes | Arjan Singh Puniani",
    description:
      "Exploratory technical notes on active inference, reasoning systems, neural engineering, and related ideas.",
    images: ["/og.png"],
  },
};

export default function Notes() {
  return <>
    <header className="page-hero"><div className="shell"><p className="eyebrow">Explorations</p><h1>Notes</h1><p>Technical questions, working models, and ideas in progress.</p></div></header>
    <section className="section"><div className="shell">
      <article className="publication"><p className="publication-meta">Theoretical · Interdisciplinary</p><h2>Quantum dynamics and conscious active inference</h2><p>Two peer-reviewed theoretical papers explore whether quantum dynamics could provide a physical implementation for temporally deep active inference. The evidence remains theoretical.</p><p><Link className="text-link" href="/research">Read the peer-reviewed publication record →</Link></p><p><Link className="text-link" href="/work/quantum-active-inference">Open the research case study →</Link></p></article>
      <article className="publication"><p className="publication-meta">Design note · 2026</p><h2>Why preserve rejected reasoning steps?</h2><p>A system that stores only accepted conclusions erases evidence about misconception, uncertainty, and revision. ReasonOS treats rejection as an event that remains inspectable without creating a new accepted state.</p><Link className="text-link" href="/work/vector-ekg-reasonos">Open the implemented example →</Link></article>
    </div></section>
  </>;
}
