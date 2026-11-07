import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SeizeFreezeHomeFeature } from "@/components/SeizeFreezeHomeFeature";
import { links } from "@/content/links";
import { siteUrl } from "@/lib/site";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: { absolute: "Arjan Singh Puniani | Neural Engineer Pursuing Medicine" },
  description:
    "Arjan Singh Puniani is a neural engineer pursuing medicine. Explore his brain-computer interface work, clinical research, research software, and medical-device concepts.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Arjan Singh Puniani | Neural Engineer Pursuing Medicine",
    description:
      "Neural engineer pursuing medicine. Brain-computer interface research, clinical research, research software, and early medical-device development.",
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
    description:
      "Neural engineer pursuing medicine. Brain-computer interface research, clinical research, research software, and early medical-device development.",
    images: ["/images/hero/arjan-headshot.webp"],
  },
};

export default function Home() {
  return (
    <>
      <section className={`v2-hero ${styles.heroScope}`}>
        <div className="shell v2-hero-grid">
          <div className="v2-hero-copy">
            <p className="v2-label">
              Neural engineering · California
            </p>
            <h1 className={styles.heroTitle}>Arjan Singh Puniani</h1>
            <p className={styles.heroFocus}>
              I am a neural engineer pursuing medicine. I have worked on human brain-computer interfaces, clinical research, and research software.
            </p>
            <nav className={styles.resourceLinks} aria-label="Explore research resources">
              <Link href="/work/vector-ekg-reasonos/workspace">
                <strong>Measure an ECG interval</strong>
                <span>Work through a real recording in ReasonOS</span>
              </Link>
              <a href="/atlas">
                <strong>Inspect a medical intervention</strong>
                <span>Explore anatomy and original sources in BODY//ATLAS</span>
              </a>
              <Link href="/research">
                <strong>Read my research</strong>
                <span>Publications and research experience</span>
              </Link>
            </nav>
            <div className="v2-actions">
              <Link href="#selected-work" data-analytics-event="hero_project_click">
                Selected work <b>↗</b>
              </Link>
              <Link href="/cv">CV</Link>
            </div>
          </div>
          <figure className={styles.heroPortrait}>
            <Image
              src="/images/hero/arjan-headshot.webp"
              alt="Arjan Singh Puniani smiling in a black quarter-zip"
              width={1059}
              height={1485}
              priority
              sizes="(max-width: 480px) calc(100vw - 48px), 400px"
            />
            <figcaption>
              <span>Arjan Singh Puniani</span>
              <Link href="/about">About me ↗</Link>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="v2-work" id="selected-work">
        <div className="shell v2-work-head">
          <p className="v2-section-number">[ 01 — Selected work ]</p>
          <h2>Selected projects.</h2>
          <Link href="/work">View all projects ↗</Link>
        </div>

        <SeizeFreezeHomeFeature />

        <article className="v2-feature" aria-labelledby="body-atlas-home-title">
          <div className={`v2-feature-image ${styles.projectPreviewFrame} ${styles.darkPreviewFrame}`}>
            <Image
              src="/images/home/body-atlas-neuralink-preview.webp"
              alt="BODY//ATLAS research preview: Neuralink recording mechanism and source-linked anatomy"
              fill
              className={styles.projectPreviewImage}
              sizes="(max-width: 800px) 100vw, 56vw"
            />
          </div>
          <div className="v2-feature-copy">
            <p>02 / Research software · Biomedical evidence</p>
            <h3 id="body-atlas-home-title"><Link href="/work/body-atlas">BODY//ATLAS</Link></h3>
            <p className="v2-feature-lead">
              Explore medical interventions through human anatomy, original FDA records, and linked research.
            </p>
            <dl>
              <div><dt>Role</dt><dd>Independent designer + developer</dd></div>
              <div><dt>State</dt><dd>Working research prototype</dd></div>
              <div><dt>Coverage</dt><dd>92 explained entries · dated original sources</dd></div>
            </dl>
            <a href="/atlas">Launch BODY//ATLAS <span aria-hidden="true">↗</span></a>
          </div>
        </article>

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
            <p>03 / Active inference · Orch OR</p>
            <h3>Conscious active inference</h3>
            <p className="v2-feature-lead">
              Two peer-reviewed theoretical reviews, co-authored with Michael C. Wiest in 2025, on quantum dynamics as a possible implementation of active inference.
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
          <div className={`v2-feature-image ${styles.projectPreviewFrame} ${styles.lightPreviewFrame}`}>
            <Image
              src="/images/home/reasonos-interval-review.webp"
              alt="A recorded ECG with two calipers and a note flagged for review after the interval was revised"
              fill
              className={styles.projectPreviewImage}
              sizes="(max-width: 800px) 100vw, 56vw"
            />
          </div>
          <div className="v2-feature-copy">
            <p>04 / Research software · ECG education</p>
            <h3>Vector EKG + ReasonOS</h3>
            <p className="v2-feature-lead">
              Measure the gap between two beats and save a note. Change the measurement to see which note needs review.
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
                <dt>Recording source</dt>
                <dd><a href="https://physionet.org/content/ptb-xl/1.0.3/">PTB-XL v1.0.3 on PhysioNet</a> · Wagner et al. · CC BY 4.0</dd>
              </div>
            </dl>
            <div className={styles.ecgActions}>
              <Link href="/work/vector-ekg-reasonos/workspace">Try the ECG workspace <span aria-hidden="true">↗</span></Link>
              <Link href="/work/vector-ekg-reasonos" data-analytics-event="view_project">Read the case study</Link>
            </div>
          </div>
        </article>

        <article className="v2-feature v2-feature-light">
          <div className="v2-feature-copy">
            <p>05 / Brain-computer interfaces</p>
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
        <article className="v2-feature" aria-labelledby="rally-house-home-title">
          <div className={`v2-feature-image ${styles.projectPreviewFrame}`}>
            <Image
              src="/rally-house/media/guide-club.webp"
              alt="Rally House clubhouse beside the tennis court"
              fill
              className={styles.projectPreviewImage}
              sizes="(max-width: 800px) 100vw, 56vw"
            />
          </div>
          <div className="v2-feature-copy">
            <p>06 / Browser game</p>
            <h3 id="rally-house-home-title"><Link href="/playground/rally-house">Rally House</Link></h3>
            <p className="v2-feature-lead">
              A browser tennis game with a clubhouse and a swing analysis view.
            </p>
            <dl>
              <div><dt>Role</dt><dd>Independent designer + developer</dd></div>
              <div><dt>State</dt><dd>Playable prototype</dd></div>
            </dl>
            <Link href="/playground/rally-house">Play Rally House <span aria-hidden="true">↗</span></Link>
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
