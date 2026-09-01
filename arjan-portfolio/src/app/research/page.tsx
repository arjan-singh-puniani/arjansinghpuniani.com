import type { Metadata } from "next";
import { CitationButton } from "@/components/CitationButton";
import { publications, researchProjects, scienceWriting } from "@/content/publications";
import { links } from "@/content/links";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Research",
  description: "Research by Arjan Singh Puniani: publications, brain-computer interface work, neurotechnology projects, and selected science writing.",
  alternates: { canonical: "/research" }
};

export default function Research() {
  const personId = `${siteUrl}/#arjan-singh-puniani`;
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
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(scienceWritingSchema) }} />
    <header className="page-hero"><div className="shell"><p className="eyebrow">Research record</p><h1>Research by Arjan Singh Puniani</h1><p>Published work, active research themes, and technical writing. Bibliographic details appear only when the source record supports them.</p></div></header>
    <section className="section"><div className="shell"><div className="section-head"><div><p className="eyebrow">Publications</p><h2>Peer-reviewed work</h2></div></div>{publications.map((publication) => {
      const citation = `${publication.authors} (${publication.year}). ${publication.title}. ${publication.venue}.`;
      return <article className="publication" key={publication.title}><p className="publication-meta">{publication.type} · {publication.year}</p><h3>{publication.title}</h3><p><strong>{publication.authors}</strong></p><p>{publication.summary}</p><p><strong>Role:</strong> {publication.role}</p><CitationButton citation={citation}/></article>;
    })}</div></section>
    <section className="section"><div className="shell"><div className="section-head"><div><p className="eyebrow">Science journalism</p><h2>Selected science writing</h2></div><p>Research features written by Arjan Singh Puniani for Physics World. These articles report on other researchers’ work and are listed separately from Arjan’s own research publications.</p></div><p><a className="text-link" href={links.physicsWorldAuthor} target="_blank" rel="noreferrer">Physics World contributor archive <span aria-hidden="true">↗</span></a></p>{scienceWriting.map((article) => <article className="publication" key={article.href}><p className="publication-meta">By Arjan Singh Puniani · {article.venue} · {article.publishedAt}</p><h3>{article.title}</h3><p>{article.summary}</p><a className="text-link" href={article.href} target="_blank" rel="noreferrer">Read at Physics World <span aria-hidden="true">↗</span><span className="sr-only">: {article.title}</span></a></article>)}</div></section>
    <section className="section"><div className="shell bio-grid"><div><p className="eyebrow">Research projects</p><h2>Questions under active development</h2></div><div>{researchProjects.map((project, index) => <article className="publication" key={project}><span className="publication-meta">0{index + 1}</span><h3>{project}</h3></article>)}</div></div></section>
    <section className="section"><div className="shell"><div className="notice">A final publication PDF, DOI, or publisher record is still required before the site publishes exact author order, venue, volume, pages, or contribution language.</div></div></section>
  </>;
}
