import type { Metadata } from "next";
import Link from "next/link";
import { CitationButton } from "@/components/CitationButton";
import { publications, researchProjects, scienceWriting } from "@/content/publications";
import { links } from "@/content/links";
import { experience } from "@/content/experience";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Research in Neural Engineering, Active Inference & Clinical Trials",
  description:
    "Research by Arjan Singh Puniani at Wellesley, Pitt, and UCSF, spanning active inference, implanted brain-computer interfaces, neurophysiology, and clinical trials.",
  alternates: { canonical: "/research" },
  openGraph: {
    type: "website",
    url: `${siteUrl}/research`,
    title: "Research in Neural Engineering, Active Inference & Clinical Trials | Arjan Singh Puniani",
    description:
      "Research experience at Wellesley, Pitt, and UCSF, two peer-reviewed theoretical reviews, a first-author BCI manuscript, and science writing.",
    images: [
      {
        url: "/images/research/rnel-gamified-bci-task.jpg",
        alt: "Gamified brain-computer interface calibration task in a research laboratory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Research in Neural Engineering, Active Inference & Clinical Trials | Arjan Singh Puniani",
    description:
      "Research experience at Wellesley, Pitt, and UCSF, two peer-reviewed theoretical reviews, a first-author BCI manuscript, and science writing.",
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
    <header className="page-hero">
      <div className="shell">
        <p className="eyebrow">Research record</p>
        <h1>Research by Arjan Singh Puniani</h1>
        <p>My research spans theoretical neuroscience at Wellesley, implanted brain-computer interfaces and neural data analysis at Pitt, and digital clinical trials at UCSF. I co-authored two peer-reviewed theoretical reviews, submitted a first-author BCI calibration manuscript, and wrote about neuroscience for Physics World.</p>
        <div className="cv-actions">
          <Link className="button" href="/cv">View CV</Link>
          <a className="button-secondary" href={links.resume} download data-analytics-event="download_resume">Download résumé (PDF)</a>
        </div>
      </div>
    </header>

    {experience.filter(({ title }) => title === "Research experience").map(({ title, entries }) => (
      <section className="section" key={title}>
        <div className="shell">
          <div className="section-head"><h2>{title}</h2></div>
          <div className="timeline">
            {entries.map(({ organization, role, dates, summary, project }) => (
              <article key={organization}>
                <time>{dates}</time>
                <div>
                  <h3>{role}</h3>
                  <p><strong>{organization}</strong></p>
                  <p>{summary}</p>
                  {project && <Link className="text-link" href={project.href}>{project.label} →</Link>}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    ))}

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

    <section className="section"><div className="shell"><div className="section-head"><div><p className="eyebrow">Science journalism</p><h2>Selected science writing</h2></div><p>Research features written by Arjan Singh Puniani for Physics World. These articles report on other researchers’ work.</p></div><p><a className="text-link" href={links.physicsWorldAuthor} target="_blank" rel="noreferrer">Physics World contributor archive <span aria-hidden="true">↗</span></a></p>{scienceWriting.map((article) => <article className="publication" key={article.href}><p className="publication-meta">By Arjan Singh Puniani · {article.venue} · {article.publishedAt}</p><h3>{article.title}</h3><p>{article.summary}</p><a className="text-link" href={article.href} target="_blank" rel="noreferrer">Read at Physics World <span aria-hidden="true">↗</span><span className="sr-only">: {article.title}</span></a></article>)}</div></section>

    <section className="section"><div className="shell bio-grid"><div><p className="eyebrow">Research projects</p><h2>Research topics</h2></div><div>{researchProjects.map((project, index) => <article className="publication" key={project}><span className="publication-meta">0{index + 1}</span><h3>{project}</h3></article>)}</div></div></section>

  </>;
}
