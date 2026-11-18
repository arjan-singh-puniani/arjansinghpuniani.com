import type { Metadata } from "next";
import Link from "next/link";
import { education } from "@/content/education";
import { experience } from "@/content/experience";
import { links } from "@/content/links";
import { siteUrl } from "@/lib/site";

const title = "CV — Clinical Experience, Research & Education";
const description =
  "Curriculum vitae of Arjan Singh Puniani, including clinical experience, brain-computer interface research, education, teaching, and service.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/cv" },
  openGraph: {
    type: "website",
    url: `${siteUrl}/cv`,
    title: `${title} | Arjan Singh Puniani`,
    description,
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | Arjan Singh Puniani`,
    description,
    images: ["/og.png"],
  },
};

export default function CV() {
  return (
    <>
      <header className="page-hero">
        <div className="shell">
          <p className="eyebrow">Curriculum vitae</p>
          <h1>Arjan Singh Puniani — CV</h1>
          <p>Education, clinical experience, research, teaching, and service.</p>
          <div className="cv-actions">
            <a className="button" href={links.resume} download data-analytics-event="download_resume">
              Download résumé (PDF)
            </a>
          </div>
        </div>
      </header>

      <section className="section">
        <div className="shell">
          <div className="section-head"><h2>Education</h2></div>
          <div className="timeline">
            {education.map(({ institution, degree, focus, year }) => (
              <article key={institution}>
                <time>{year}</time>
                <div>
                  <h3>{degree}</h3>
                  <p><strong>{institution}</strong></p>
                  <p>{focus}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {experience.map(({ title, entries }) => (
        <section className="section" key={title}>
          <div className="shell">
            <div className="section-head"><h2>{title}</h2></div>
            <div className="timeline">
              {entries.map(({ role, organization, dates, summary, project }) => (
                <article key={role}>
                  <time>{dates}</time>
                  <div>
                    <h3>{role}</h3>
                    <p><strong>{organization}</strong></p>
                    <p>{summary}</p>
                    {project && <Link className="text-link" href={project.href}>{project.label} ↗</Link>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="section">
        <div className="shell">
          <div className="section-head"><h2>Publications and recognition</h2></div>
          <p>I co-authored two peer-reviewed reviews on conscious active inference and reported on brain-computer interfaces and neuroimaging for <em>Physics World</em>.</p>
          <p><Link className="text-link" href="/research">View publications and science writing →</Link></p>
          <p>Recognition includes the Mosaic MPH Scholarship, the Kuzneski Innovation Cup Grand Prize (2022), and third place in the Randall Family Big Idea Competition (2023).</p>
        </div>
      </section>
    </>
  );
}
