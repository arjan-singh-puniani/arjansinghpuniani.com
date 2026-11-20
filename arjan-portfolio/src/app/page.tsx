import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SeizeFreezeHomeFeature } from "@/components/SeizeFreezeHomeFeature";
import { links } from "@/content/links";
import { profile } from "@/content/profile";
import { siteUrl } from "@/lib/site";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: { absolute: "Arjan Singh Puniani | Neural Engineer Pursuing Medicine" },
  description: profile.intro,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Arjan Singh Puniani | Neural Engineer Pursuing Medicine",
    description: profile.intro,
    images: [
      {
        url: "/images/hero/arjan-headshot.webp",
        width: 1059,
        height: 1485,
        alt: "Portrait of Arjan Singh Puniani",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Arjan Singh Puniani | Neural Engineer Pursuing Medicine",
    description: profile.intro,
    images: ["/images/hero/arjan-headshot.webp"],
  },
};

export default function Home() {
  return (
    <div className={styles.home}>
      <section className={`${styles.wrap} ${styles.intro}`} aria-labelledby="intro-title">
        <p className={styles.eyebrow}>Neural engineering · California</p>
        <div className={styles.introGrid}>
          <div>
            <h1 id="intro-title">Arjan Singh<br />Puniani<span>.</span></h1>
            <p className={styles.introLead}>I’m a neural engineer pursuing medicine.</p>
            <p className={styles.introBody}>My background includes implanted brain–computer interface research at Pitt, clinical research at UCSF, and work in emergency departments. I build research software and interactive tools for medical education, and develop neurotechnology concepts.</p>
            <nav className={styles.introLinks} aria-label="Introduction">
              <a className={styles.primaryLink} href="#selected-work" data-analytics-event="hero_project_click">Explore the work</a>
              <Link href="/research">Research &amp; publications</Link>
            </nav>
          </div>
          <figure className={styles.portrait}>
            <Image src="/images/hero/arjan-headshot.webp" alt="Arjan Singh Puniani" width={1059} height={1485} priority sizes="(max-width: 600px) 92px, (max-width: 1000px) 240px, 280px" />
            <figcaption><span>American Canyon, CA</span><Link href="/about">About me</Link></figcaption>
          </figure>
        </div>
      </section>

      <section className={`${styles.wrap} ${styles.work}`} id="selected-work" aria-labelledby="work-heading">
        <header className={styles.sectionHead}>
          <div><p className={styles.eyebrow}>Projects &amp; research</p><h2 id="work-heading">Selected work</h2></div>
          <Link href="/work">All projects</Link>
        </header>

        <SeizeFreezeHomeFeature />

        <article className={`${styles.ortho} project-tile`} aria-labelledby="ortho-home-title">
          <header className={styles.projectHeading}>
            <div><p className={styles.eyebrow}>hospitalSIM · Interactive medical education</p><h3 id="ortho-home-title"><a href="/hospitalsim/ortho/index.html">ORTHO Lab</a></h3></div>
            <a className={styles.primaryLink} href="/hospitalsim/ortho/index.html" data-analytics-event="view_project">Try the fracture case</a>
          </header>
          <figure className={styles.orthoImage}>
            <a href="/hospitalsim/ortho/index.html" aria-label="Open ORTHO Lab’s interactive fracture case">
              <Image src="/images/home/ortho-lab-capture.webp" alt="Actual ORTHO Lab interface: a clamp at a displaced femur fracture, with front and side views and alignment controls" width={2440} height={1618} unoptimized />
            </a>
            <figcaption>Gameplay capture · Fracture reduction in the operative view</figcaption>
          </figure>
          <div className={styles.projectDetails}>
            <p className={styles.projectSummary}>An interactive 3D case for exploring fracture alignment, fixation, and imaging in two views.</p>
            <div><p>I built the case around a displaced femur fracture. Move and rotate the clamp, compare projections, seat the nail, and review the result.</p><p className={styles.scopeNote}>Educational simulation. Gestures and thresholds are game rules, not operative guidance.</p></div>
            <dl className={styles.facts}><div><dt>My work</dt><dd>Design &amp; development</dd></div><div><dt>Stage</dt><dd>Playable prototype</dd></div></dl>
          </div>
        </article>

        <div className={styles.supportingGrid}>
          <article className={`${styles.supporting} project-tile`} aria-labelledby="atlas-home-title">
            <a className={styles.supportingImage} href="/atlas" aria-label="Open BODY//ATLAS">
              <Image src="/images/home/body-atlas-current.webp" alt="Current BODY//ATLAS interface showing the anatomical body surface, intervention locations, and original-source records" width={1600} height={1100} unoptimized />
            </a>
            <p className={styles.eyebrow}>Research software · Design &amp; development</p>
            <h3 id="atlas-home-title"><a href="/atlas">BODY//ATLAS</a></h3>
            <p>Explore medical interventions through anatomy, original FDA records, and linked research. Open an entry to inspect its evidence and limitations.</p>
            <a className={styles.textLink} href="/atlas">Explore the atlas</a>
          </article>
          <article className={`${styles.supporting} project-tile`} aria-labelledby="bci-home-title">
            <Link className={styles.supportingImage} href="/work/bci-calibration" aria-label="Read about gamified BCI calibration">
              <Image src="/images/home/bci-calibration.webp" alt="The real brain–computer interface calibration task running on a monitor in the Pitt research laboratory" width={1200} height={676} unoptimized />
            </Link>
            <p className={styles.eyebrow}>Pitt RNEL · R&amp;D neural engineer</p>
            <h3 id="bci-home-title"><Link href="/work/bci-calibration">Gamified BCI calibration</Link></h3>
            <p>A repeated tactile-detection task redesigned as a game for implanted BCI research. The two-choice measurement stayed intact.</p>
            <Link className={styles.textLink} href="/work/bci-calibration">Read the project record</Link>
          </article>
        </div>
        <nav className={styles.moreWork} aria-label="More of my work">
          <p>More to explore</p><Link href="/research">Publications &amp; research</Link><Link href="/playground">Games &amp; experiments</Link><Link href="/cv">Curriculum vitae</Link>
        </nav>
      </section>

      <section className={styles.contact} aria-labelledby="contact-heading">
        <div className={`${styles.wrap} ${styles.contactGrid}`}>
          <div><p className={styles.eyebrow}>Contact</p><h2 id="contact-heading">Get in touch.</h2><p>For questions about a project, research, or working together.</p></div>
          <div className={styles.contactLinks}><a href={links.email}>arjan.singh.puniani.main@gmail.com</a><Link href="/contact">Contact form</Link><a href={links.resume} download>Download CV</a></div>
        </div>
      </section>
    </div>
  );
}
