import type { Metadata } from "next";
import Link from "next/link";
import { CitationButton } from "@/components/CitationButton";
import { publications, researchProjects, scienceWriting } from "@/content/publications";
import { links } from "@/content/links";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Research in Neural Engineering & Active Inference",
  description:
    "Research by Arjan Singh Puniani across brain-computer interfaces, neural engineering, active inference, neurotechnology, and selected science writing.",
  alternates: { canonical: "/research" },
  openGraph: {
    type: "website",
    url: `${siteUrl}/research`,
    title: "Research in Neural Engineering & Active Inference | Arjan Singh Puniani",
    description:
      "Peer-reviewed publications, brain-computer-interface research, active-inference theory, neurotechnology work, and science writing.",
    images: [
      {
        url: "/images/research/rnel-gamified-bci-task.jpg",
        alt: "Gamified brain-computer interface calibration task in a research laboratory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Research in Neural Engineering & Active Inference | Arjan Singh Puniani",
    description:
      "Peer-reviewed publications, brain-computer-interface research, active-inference theory, neurotechnology work, and science writing.",
    images: ["/images/research/rnel-gamified-bci-task.jpg"],
  },
};

export default function Research() {
  const personId = `${siteUrl}/#arjan-singh-puniani`;

  const publicationSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${siteUrl}/research#publications`,
    name: "Research publications by Arjan Singh Puniani",
    itemListElement: publications.map((publication, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "ScholarlyArticle",
        headline: publication.title,
        name: publication.title,
        ...(publication.href ? { url: publication.href } : {}),
        ...(publication.doi ? { identifier: `https://doi.org/${publication.doi}` } : {}),
        ...(publication.pubmed || publication.pmc
          ? { sameAs: [publication.pubmed, publication.pmc].filter(Boolean) }
          : {}),
        author: (publication.authorNames ?? ["Arjan Singh Puniani"]).map((name) =>
          name === "Arjan Singh Puniani"
            ? { "@type": "Person", "@id": personId, name }
            : { "@type": "Person", name }
        ),
        isPartOf: publication.venue.startsWith("Computational and Structural Biotechnology Journal")
          ? { "@type": "Periodical", name: "Computational and Structural Biotechnology Journal" }
          : undefined,
        description: publication.summary,
      },
    })),
  };

  const scienceWritingSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${siteUrl}/research#physics-world-writing`,
    name: "Physics World articles by Arjan Singh Puniani",
    itemListElement: scienceWriting.map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Article",
        headline: article.title,
        url: article.href,
        datePublished: article.publishedAtISO,
        author: { "@id": personId },
        publisher: { "@type": "Organization", name: "Physics World", url: "https://physicsworld.com/" },
        isPartOf: { "@type": "Periodical", name: "Physics World", url: "https://physicsworld.com/" },
      },
    })),
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(publicationSchema) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(scienceWritingSchema) }} />
    <header className="page-hero"><div className="shell"><p className="eyebrow">Research record</p><h1>Research by Arjan Singh Puniani</h1><p>Published work, active research themes, and technical writing. Bibliographic details appear only when the source record supports them.</p></div></header>

    <section className="section"><div className="shell"><div className="section-head"><div><p className="eyebrow">Publications</p><h2>Peer-reviewed work and manuscripts</h2></div></div>{publications.map((publication) => {
      const citation = `${publication.authors} (${publication.year}). ${publication.title}. ${publication.venue}.`;
      const relatedHref = publication.title.includes("active inference")
        ? "/work/quantum-active-inference"
        : publication.title.includes("psychophysical calibration")
          ? "/work/bci-calibration"
          : undefined;
      return <article className="publication" key={publication.title}>
        <p className="publication-meta">{publication.type} · {publication.year}</p>
        <h3>{publication.title}</h3>
        <p><strong>{publication.authors}</strong></p>
        <p>{publication.summary}</p>
        <p><strong>Role:</strong> {publication.role}</p>
        {(publication.href || publication.pubmed || publication.pmc || publication.correction) && <p>
          {publication.href && <><a className="text-link" href={publication.href} target="_blank" rel="noreferrer">DOI / publisher record ↗</a>{" "}</>}
          {publication.pubmed && <><a className="text-link" href={publication.pubmed} target="_blank" rel="noreferrer">PubMed ↗</a>{" "}</>}
          {publication.pmc && <><a className="text-link" href={publication.pmc} target="_blank" rel="noreferrer">PubMed Central ↗</a>{" "}</>}
          {publication.correction && <a className="text-link" href={publication.correction.href} target="_blank" rel="noreferrer">Corrigendum ↗</a>}
        </p>}
        {publication.correction && <p className="publication-meta">{publication.correction.label}.</p>}
        {relatedHref && <p><Link className="text-link" href={relatedHref}>Related project context →</Link></p>}
        <CitationButton citation={citation}/>
      </article>;
    })}</div></section>

    <section className="section"><div className="shell"><div className="section-head"><div><p className="eyebrow">Science journalism</p><h2>Selected science writing</h2></div><p>Research features written by Arjan Singh Puniani for Physics World. These articles report on other researchers’ work and are listed separately from Arjan’s own research publications.</p></div><p><a className="text-link" href={links.physicsWorldAuthor} target="_blank" rel="noreferrer">Physics World contributor archive <span aria-hidden="true">↗</span></a></p>{scienceWriting.map((article) => <article className="publication" key={article.href}><p className="publication-meta">By Arjan Singh Puniani · {article.venue} · {article.publishedAt}</p><h3>{article.title}</h3><p>{article.summary}</p><a className="text-link" href={article.href} target="_blank" rel="noreferrer">Read at Physics World <span aria-hidden="true">↗</span><span className="sr-only">: {article.title}</span></a></article>)}</div></section>

    <section className="section"><div className="shell bio-grid"><div><p className="eyebrow">Research projects</p><h2>Questions under active development</h2></div><div>{researchProjects.map((project, index) => <article className="publication" key={project}><span className="publication-meta">0{index + 1}</span><h3>{project}</h3></article>)}</div></div></section>

    <section className="section"><div className="shell"><div className="notice">Peer-reviewed records link to DOI, PubMed, or PubMed Central when a public record is available. The BCI calibration manuscript remains labeled as a preprint until a public journal or publisher record supports a different status.</div></div></section>
  </>;
}
