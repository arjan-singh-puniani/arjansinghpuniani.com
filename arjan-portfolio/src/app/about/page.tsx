import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { profile } from "@/content/profile";
import { links } from "@/content/links";
import { scienceWriting } from "@/content/publications";
import { siteUrl } from "@/lib/site";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About Arjan Singh Puniani",
  description:
    "Biography of Arjan Singh Puniani (Arjan Puniani), a neural engineer and medical-school applicant working across brain-computer interfaces, rehabilitation, clinical reasoning, neurotechnology, and motorsport safety.",
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    url: `${siteUrl}/about`,
    title: "About Arjan Singh Puniani",
    description:
      "Neural engineer and medical-school applicant working across brain-computer interfaces, rehabilitation, clinical reasoning, neurotechnology, and motorsport safety.",
    images: [
      {
        url: "/images/about/arjan-candid.jpg",
        width: 1200,
        height: 1600,
        alt: "Candid portrait of Arjan Singh Puniani",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Arjan Singh Puniani",
    description:
      "Neural engineer and medical-school applicant working across brain-computer interfaces, rehabilitation, clinical reasoning, neurotechnology, and motorsport safety.",
    images: ["/images/about/arjan-candid.jpg"],
  },
};

const interests = [
  "Formula 1",
  "Tennis",
  "Buffalo Bills",
  "Whole Foods",
  "Virtual reality",
  "Pickleball",
  "Bonsai",
  "Metal detecting",
  "LEGO",
  "Sketching",
  "Terrence Malick",
] as const;

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
          <p><Link className="text-link" href="/research">See peer-reviewed research and current research themes →</Link></p>
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
      <section className={`section outside-lab ${styles.personalSection}`}>
        <div className={`shell ${styles.personalGrid}`}>
          <figure className={styles.portrait}>
            <Image
              src="/images/about/arjan-candid.jpg"
              alt="Candid portrait of the site author seated at a restaurant"
              width={1200}
              height={1600}
              sizes="(max-width: 900px) calc(100vw - 24px), 40vw"
            />
            <figcaption>Outside research and engineering.</figcaption>
          </figure>
          <div className={styles.personalCopy}>
            <p className="eyebrow">Outside the lab</p>
            <h2>A few things I genuinely like.</h2>
            <div className={styles.personalProse}>
              <p>I cook a lot, especially bánh mì, bulgogi cheesesteaks, and sloppy joes. I play and teach tennis, play pickleball, follow Formula 1 and the Buffalo Bills, and spend a lot of time in virtual reality.</p>
              <p>Whole Foods is, inexplicably, one of my hobbies.</p>
              <p>When I want something quieter, I work on my bonsai, build LEGO sets, sketch, go metal detecting, or put on a Terrence Malick film.</p>
            </div>
            <div className={styles.interests}>
              <h3>Currently into</h3>
              <ul className={styles.interestList}>
                {interests.map((interest, index) => (
                  <li key={interest}>
                    <span className={styles.interestNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    <span>{interest}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
