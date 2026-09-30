import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SeizeFreezeHomeFeature } from "@/components/SeizeFreezeHomeFeature";
import { links } from "@/content/links";
import { siteUrl } from "@/lib/site";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: { absolute: "Arjan Singh Puniani | Neural Engineering" },
  description:
    "Arjan Singh Puniani: SeizeFreeze, brain-computer interface research, conscious active inference, and independent engineering projects.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Arjan Singh Puniani | Neural Engineering",
    description:
      "SeizeFreeze, brain-computer interface research, conscious active inference, and independent engineering projects.",
    images: [
      {
        url: "/images/hero/arjan-portrait-2026.jpg",
        width: 3024,
        height: 4032,
        alt: "Portrait of Arjan Singh Puniani",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Arjan Singh Puniani | Neural Engineering",
    description:
      "SeizeFreeze, brain-computer interface research, conscious active inference, and independent engineering projects.",
    images: ["/images/hero/arjan-portrait-2026.jpg"],
  },
};

export default function Home() {
  return (
    <>
      <section className={`v2-hero ${styles.heroScope}`}>
        <div className="v2-orbit" aria-hidden="true">
          <span>01</span>
          <i />
          <span>26</span>
        </div>
        <div className="shell v2-hero-grid">
          <div className="v2-hero-copy">
            <p className="v2-label">
              <span /> Neural engineering · California
            </p>
            <h1 className={styles.heroTitle}>Arjan Singh Puniani</h1>
            <p className={styles.heroFocus}>
              SeizeFreeze · BCI research · conscious active inference
            </p>
            <div className="v2-actions">
              <Link href="#selected-work" data-analytics-event="hero_project_click">
                Selected work <b>↗</b>
              </Link>
              <Link href="/research">Research</Link>
              <Link href="/cv">CV</Link>
            </div>
          </div>
          <div className="v2-visual">
            <div className="v2-photo-index">ASP / 001</div>
            <Image
              src="/images/hero/arjan-portrait-2026.jpg"
              alt="Portrait of Arjan Singh Puniani"
              fill
              priority
              sizes="(max-width: 800px) 100vw, 44vw"
            />
            <div className="v2-photo-caption">
              <span>Arjan Singh Puniani</span>
              <span>2026</span>
            </div>
            <div className="v2-signal" aria-hidden="true">
              <svg viewBox="0 0 440 80" preserveAspectRatio="none">
                <path d="M0 44h66l12-2 8 2h36l8-20 12 46 13-64 15 38h36l8-4 10 4h70l13-12 14 27 13-36 14 21h83" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section className="v2-work" id="selected-work">
        <div className="shell v2-work-head">
          <p className="v2-section-number">[ 01 — Selected work ]</p>
          <h2>Selected projects.</h2>
          <Link href="/work">View all projects ↗</Link>
        </div>

        <SeizeFreezeHomeFeature />

        <article className="v2-feature v2-feature-light">
          <div className={`v2-feature-image ${styles.projectPreviewFrame} ${styles.lightPreviewFrame}`}>
            <Image
              src="/images/home/quantum-active-inference-preview.png"
              alt="Conceptual illustration of conscious active inference, Orch OR, and a microtubule-based quantum computation motif"
              fill
              className={styles.projectPreviewImage}
              sizes="(max-width: 800px) 100vw, 56vw"
            />
          </div>
          <div className="v2-feature-copy">
            <p>02 / Active inference · Orch OR</p>
            <h3>Conscious active inference</h3>
            <p className="v2-feature-lead">
              Two peer-reviewed 2025 reviews connecting active inference with quantum dynamics and Orch OR as a candidate physical implementation.
            </p>
            <dl>
              <div>
                <dt>Role</dt>
                <dd>Co-author</dd>
              </div>
              <div>
                <dt>State</dt>
                <dd>Published</dd>
              </div>
              <div>
                <dt>Year</dt>
                <dd>2025</dd>
              </div>
            </dl>
            <Link href="/work/quantum-active-inference">Open the case study <span>↗</span></Link>
          </div>
        </article>

        <article className="v2-feature reasonos-home-feature">
          <div className={`v2-feature-image ${styles.projectPreviewFrame} ${styles.darkPreviewFrame}`}>
            <Image
              src="/images/home/reasonos-manifesto-preview.png"
              alt="ReasonOS preview showing ECG reasoning, explicit measurements, calculations, competing explanations, and visible revision history"
              fill
              className={styles.projectPreviewImage}
              sizes="(max-width: 800px) 100vw, 56vw"
            />
          </div>
          <div className="v2-feature-copy">
            <p>03 / Reasoning systems · Medical education</p>
            <h3>Vector EKG + ReasonOS</h3>
            <p className="v2-feature-lead">
              A reasoning interface for medicine that keeps source data, measurements, calculations, alternatives, and revisions visible.
            </p>
            <dl>
              <div>
                <dt>Role</dt>
                <dd>Independent designer + developer</dd>
              </div>
              <div>
                <dt>State</dt>
                <dd>Tested educational prototype</dd>
              </div>
              <div>
                <dt>Year</dt>
                <dd>2026</dd>
              </div>
            </dl>
            <Link href="/work/vector-ekg-reasonos" data-analytics-event="view_project">
              Open the case study <span>↗</span>
            </Link>
          </div>
        </article>

        <article className="v2-feature v2-feature-light">
          <div className="v2-feature-copy">
            <p>04 / Brain-computer interfaces</p>
            <h3>Gamified BCI calibration</h3>
            <p className="v2-feature-lead">
              A game-like calibration task for repeated BCI psychophysics sessions at Pitt RNEL.
            </p>
            <dl>
              <div>
                <dt>Role</dt>
                <dd>R&amp;D neural engineer</dd>
              </div>
              <div>
                <dt>State</dt>
                <dd>Completed research</dd>
              </div>
            </dl>
            <Link href="/work/bci-calibration">Open case study <span>↗</span></Link>
          </div>
          <div className="v2-feature-image">
            <Image
              src="/images/research/rnel-gamified-bci-task.jpg"
              alt="Gamified brain-computer interface calibration task in a research laboratory"
              fill
              sizes="(max-width: 800px) 100vw, 56vw"
            />
          </div>
        </article>
      </section>

      <section className={styles.contact} aria-labelledby="contact-heading">
        <div className={`shell ${styles.contactGrid}`}>
          <div>
            <p className="v2-section-number">[ 02 — Contact ]</p>
            <h2 id="contact-heading">Contact.</h2>
          </div>
          <div className={styles.contactActions}>
            <Link href="/contact">
              Get in touch <span aria-hidden="true">↗</span>
            </Link>
            <a href={links.email}>Email directly</a>
            <a href={links.resume} download>
              Download CV
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
