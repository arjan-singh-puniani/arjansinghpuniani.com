import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Notes — Arjan Singh Puniani",
  description:
    "Notes by Arjan Singh Puniani on BCI experiments, research software, motorsport safety, anatomy, and design choices from his projects.",
  alternates: { canonical: "/notes" },
  openGraph: {
    type: "website",
    url: `${siteUrl}/notes`,
    title: "Notes | Arjan Singh Puniani",
    description:
      "Notes from neural engineering, research software, motorsport safety, and interactive scientific tools.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Notes | Arjan Singh Puniani",
    description:
      "Notes from neural engineering, research software, motorsport safety, and interactive scientific tools.",
    images: ["/og.png"],
  },
};

const notes = [
  {
    id: "interface-is-part-of-measurement",
    meta: "Neural engineering · Experimental design",
    title: "BCI calibration: interface effects",
    body: [
      "Sensors are not the only thing shaping a measurement. Instructions, feedback, pacing, fatigue, attention, and task effort can change the conditions under which data are collected.",
      "That was the challenge in my BCI calibration work. We could make a repetitive task easier to stay with, but we could not quietly change what the experiment measured. The public record supports real-time neural and behavioral interfaces and analysis across more than 940 sessions; I leave unreleased engagement and validity results out.",
    ],
    takeaway: "Decide what must stay fixed before redesigning the task. Then improve the experience around that constraint.",
    href: "/work/bci-calibration",
    linkLabel: "Open the BCI calibration case study",
  },
  {
    id: "preserve-rejected-reasoning",
    meta: "Research software · Reasoning",
    title: "ReasonOS: preserving rejected paths",
    body: [
      "If a system stores only the final answer, you lose the record of what changed and why. That matters when someone needs to review the reasoning later.",
      "ReasonOS keeps accepted and rejected steps separate. A path you ruled out can stay in the record without being mistaken for the answer.",
    ],
    takeaway: "Keep the steps you ruled out, but label them clearly. The history should help a reviewer, not create another puzzle.",
    href: "/work/vector-ekg-reasonos",
    linkLabel: "Open Vector EKG + ReasonOS",
  },
  {
    id: "handoff-is-a-data-structure",
    meta: "Motorsport safety · Human factors",
    title: "Motorsport handoff: facts vs interpretation",
    body: [
      "A handoff gets muddy when observations, interpretation, and decision authority are blended together. The next person should be able to tell what was seen, what was inferred, and who made the call.",
      "My motorsport neurotrauma draft separates crash mechanics, occupant-protection context, neurological observations, disposition, and the boundary between medical decisions and Race Control authority.",
    ],
    takeaway: "Record what was observed, what was inferred, what happened next, and who owns the next decision.",
    href: "/work/motorsport-neurotrauma-toolkit",
    linkLabel: "Open the neurotrauma toolkit",
  },
  {
    id: "spatial-learning-needs-relationships",
    meta: "Interactive anatomy · Spatial interfaces",
    title: "HoloAnatomy: spatial context",
    body: [
      "A labeled structure can still be hard to understand when its neighbors disappear. In anatomy, the relationships around a structure are often part of what makes it make sense.",
      "HoloAnatomy lets you separate structures, inspect their neighbors, identify them, and test your recall. It is an interactive learning exhibit; I have not tested whether it improves learning outcomes.",
    ],
    takeaway: "Let people pull structures apart without losing the context around them, then move straight into identification and recall.",
    href: "/playground/holoanatomy",
    linkLabel: "Explore HoloAnatomy",
  },
] as const;

export default function Notes() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${siteUrl}/notes#field-notes`,
    url: `${siteUrl}/notes`,
    name: "Notes by Arjan Singh Puniani",
    description: metadata.description,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: notes.map((note, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}/notes#${note.id}`,
        name: note.title,
      })),
    },
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <header className="page-hero"><div className="shell"><p className="eyebrow">Notes</p><h1>Project notes.</h1><p>Short write-ups tied to specific projects. Private implementation details stay private.</p></div></header>
    <section className="section"><div className="shell">
      <div className="section-head"><div><p className="eyebrow">Four notes</p><h2>Four project notes.</h2></div><p>Each note stays within what the public work supports.</p></div>
      {notes.map((note, index) => (
        <article className="publication" id={note.id} key={note.id} style={{ scrollMarginTop: "96px" }}>
          <p className="publication-meta">0{index + 1} · {note.meta}</p>
          <h2>{note.title}</h2>
          {note.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <p><strong>Takeaway:</strong> {note.takeaway}</p>
          <p><Link className="text-link" href={note.href}>{note.linkLabel} →</Link></p>
        </article>
      ))}
    </div></section>
    <section className="section"><div className="shell bio-grid"><div><p className="eyebrow">Scope</p><h2>Limits.</h2></div><div><p className="large" style={{ fontSize: "22px" }}>These are project notes, not claims of clinical validation. I leave unpublished implementation details out.</p><p><Link className="text-link" href="/work">Browse the projects →</Link></p></div></div></section>
  </>;
}
