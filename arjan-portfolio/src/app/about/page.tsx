import type { Metadata } from "next";
import Image from "next/image";
import { profile } from "@/content/profile";
import { links } from "@/content/links";
import { scienceWriting } from "@/content/publications";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Arjan Singh Puniani",
  description:
    "Biography of Arjan Singh Puniani (Arjan Puniani), a neural engineer and medical-school applicant working across rehabilitation, clinical reasoning, neurotechnology, and motorsport safety.",
  alternates: { canonical: "/about" },
};

export default function About() {
  const personId = `${siteUrl}/#arjan-singh-puniani`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${siteUrl}/about#profile`,
    url: `${siteUrl}/about`,
    name: "About Arjan Singh Puniani",
    mainEntity: {
      "@type": "Person",
      "@id": personId,
      name: profile.name,
      givenName: "Arjan",
      additionalName: "Singh",
      familyName: "Puniani",
      alternateName: ["Arjan Puniani", "Arjan Singh Puniani"],
      url: siteUrl,
      description: profile.descriptor,
      sameAs: [links.github, links.physicsWorldAuthor],
      alumniOf: [
        { "@type": "CollegeOrUniversity", name: "University of Pittsburgh" },
        { "@type": "CollegeOrUniversity", name: "University of California, Berkeley" },
      ],
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <header className="page-hero">
        <div className="shell">
          <p className="eyebrow">Biography</p>
          <h1>Arjan Singh Puniani</h1>
          <p>{profile.headline}</p>
        </div>
      </header>
      <section className="section">
        <div className="shell bio-grid">
          <aside>
            <p className="eyebrow">Current position</p>
            <h2>{profile.descriptor}</h2>
          </aside>
          <article>{profile.biography.map((p) => <p className="large" style={{ fontSize: "22px" }} key={p}>{p}</p>)}</article>
        </div>
      </section>
      <section className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <p className="eyebrow">Science writing</p>
              <h2>Selected writing for Physics World</h2>
            </div>
            <p>Arjan Singh Puniani was a student contributor to <em>Physics World</em>, writing reported features about neural engineering, brain–computer interfaces, and neuroimaging research.</p>
          </div>
          <p><a className="text-link" href={links.physicsWorldAuthor} target="_blank" rel="noreferrer">Physics World contributor archive <span aria-hidden="true">↗</span></a></p>
          {scienceWriting.map((article) => (
            <article className="publication" key={article.href}>
              <p className="publication-meta">By Arjan Singh Puniani · {article.venue} · {article.publishedAt}</p>
              <h3>{article.title}</h3>
              <p>{article.summary}</p>
              <a className="text-link" href={article.href} target="_blank" rel="noreferrer">Read at Physics World <span aria-hidden="true">↗</span><span className="sr-only">: {article.title}</span></a>
            </article>
          ))}
        </div>
      </section>
      <section className="section outside-lab">
        <div className="shell case-intro">
          <figure>
            <Image src="/images/about/tennis-portrait.jpeg" alt="Arjan Singh Puniani on a tennis court" width={900} height={1100} />
            <figcaption>Outside research and engineering.</figcaption>
          </figure>
          <div>
            <p className="eyebrow">Outside the lab</p>
            <h2>Cooking is another form of iterative design.</h2>
            <p>Arjan cooks bánh mì and experiments with playful recipes, including his own approach to the Crunchwrap Supreme. The appeal is practical: understand the ingredients, control the sequence, notice what fails, and make something worth sharing.</p>
            <p>He also plays and teaches tennis.</p>
          </div>
        </div>
      </section>
    </>
  );
}
