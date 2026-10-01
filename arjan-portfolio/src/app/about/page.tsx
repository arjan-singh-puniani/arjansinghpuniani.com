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
    "Biography of Arjan Singh Puniani, a neural engineer pursuing medicine. BCI research at Pitt RNEL, clinical research at UCSF, independent research software, and personal interests.",
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    url: `${siteUrl}/about`,
    title: "About Arjan Singh Puniani",
    description:
      "Neural engineer pursuing medicine, with BCI research at Pitt RNEL, clinical research at UCSF, and independent research software.",
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
      "Neural engineer pursuing medicine, with BCI research at Pitt RNEL, clinical research at UCSF, and independent research software.",
    images: ["/images/about/arjan-candid.jpg"],
  },
};

const interests = [
  "Tennis",
  "Formula 1",
  "Buffalo Bills",
  "Cooking",
  "Virtual reality",
  "Sketching",
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
          <p className="eyebrow">About</p>
          <h1>Arjan Singh Puniani</h1>
          <p>{profile.headline}</p>
        </div>
      </header>
      <section className="section">
        <div className="shell bio-grid">
          <aside>
            <p className="eyebrow">Background</p>
            <h2>{profile.descriptor}</h2>
          </aside>
          <article className={styles.biography}>{profile.biography.map((p) => <p className="large" style={{ fontSize: "22px" }} key={p}>{p}</p>)}</article>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <p className="eyebrow">Personal projects</p>
              <h2>Tennis, motorsport, and interactive models.</h2>
            </div>
            <p>Some of my independent projects grew out of tennis and motorsport.</p>
          </div>
          <div className="directions">
            <article className="direction">
              <span>01 / Tennis</span>
              <h3>Tennis</h3>
              <p>I play and teach tennis. I also built a small arcade tennis game.</p>
              <p><Link href="/playground/vector-tennis">Open Vector Tennis →</Link></p>
            </article>
            <article className="direction">
              <span>02 / Motorsport</span>
              <h3>Motorsport</h3>
              <p>I follow motorsport closely. That led to work on crash mechanics, neurological assessment, emergency operations, and medical handoff.</p>
              <p><Link href="/work/motorsport-neurotrauma-toolkit">Open the neurotrauma work →</Link></p>
            </article>
            <article className="direction">
              <span>03 / Interactive models</span>
              <h3>Interactive models</h3>
              <p>The Playground uses interactive models for anatomy, physiology, mechanical systems, and games.</p>
              <p><Link href="/playground">Explore the Playground →</Link></p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <p className="eyebrow">Science writing</p>
              <h2>Selected writing for Physics World</h2>
            </div>
            <p>I wrote reported features for <em>Physics World</em> on neural engineering, brain–computer interfaces, and neuroimaging research.</p>
          </div>
          <p><a className="text-link" href={links.physicsWorldAuthor} target="_blank" rel="noreferrer">Physics World contributor archive <span aria-hidden="true">↗</span></a></p>
          <p><Link className="text-link" href="/research">See publications and research topics →</Link></p>
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
          <div className={styles.photoStack}>
            <figure className={styles.photoWide}>
              <Image
                src="/images/about/arjan-camera-2026.jpg"
                alt="Arjan Singh Puniani holding a camera outdoors"
                width={1600}
                height={1200}
                sizes="(max-width: 900px) calc(100vw - 24px), 42vw"
              />
            </figure>
            <figure className={styles.photoWide}>
              <Image
                src="/images/about/arjan-dog-2026.jpg"
                alt="Arjan Singh Puniani relaxing on grass with a dog"
                width={1600}
                height={1200}
                sizes="(max-width: 900px) calc(100vw - 24px), 42vw"
              />
            </figure>
          </div>
          <div className={styles.personalCopy}>
            <p className="eyebrow">Outside work</p>
            <h2>Mostly tennis, cooking, sports, and making things.</h2>
            <div className={styles.personalProse}>
              <p>I play and teach tennis, cook often, follow Formula 1 and the Buffalo Bills, and spend a lot of time with interactive media and VR.</p>
              <p>I also sketch and keep a camera around.</p>
            </div>
            <div className={styles.interests}>
              <h3>Also into</h3>
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
