import type { Metadata } from "next";
import Link from "next/link";
import styles from "./holoanatomy.module.css";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "HoloAnatomy | Rotator Cuff Studio",
  description:
    "Explore the right rotator cuff in 3D. Inspect source anatomy, peel layers, follow a spatial lesson, and practice identification in HoloAnatomy.",
  alternates: { canonical: "/playground/holoanatomy" },
  openGraph: {
    type: "website", url: `${siteUrl}/playground/holoanatomy`,
    title: "HoloAnatomy | Arjan Singh Puniani",
    description: "An interactive right rotator cuff prototype using BodyParts3D geometry, with layer controls, guided lessons, and identification exercises.",
    images: ["/images/playground/anatomy-learner.webp"],
  },
  twitter: {
    card: "summary_large_image", title: "HoloAnatomy | Arjan Singh Puniani",
    description: "An interactive rotator cuff prototype using BodyParts3D geometry. Learning outcomes have not been tested.",
    images: ["/images/playground/anatomy-learner.webp"],
  },
};

export default function HoloAnatomyPage() {
  return (
    <>
      <header className={`page-hero ${styles.hero}`}>
        <div className="shell">
          <Link href="/playground">← Playground</Link>
          <p className="eyebrow">HoloAnatomy · Anatomy prototype</p>
          <h1>HoloAnatomy rotator cuff studio</h1>
          <p>
            I built this anatomy prototype using BodyParts3D geometry.
            Explore the right rotator cuff, separate the available layers,
            and practice identifying structures.
          </p>
          <div className={styles.actions}>
            <a className="button" href="#anatomy">
              Explore the shoulder ↓
            </a>
            <a
              href="/holoanatomy/shoulder/index.html"
              target="_blank"
              rel="noreferrer"
            >
              Open full screen ↗
            </a>
          </div>
        </div>
      </header>
      <section
        className={styles.viewerSection}
        id="anatomy"
        aria-label="Rotator cuff studio"
      >
        <div className={styles.studioShell}>
          <iframe
            className={styles.viewer}
            src="/holoanatomy/shoulder/index.html"
            title="HoloAnatomy rotator cuff studio: explore, peel, learn and quiz"
            loading="lazy"
            allow="fullscreen"
          />
        </div>
        <div className="shell">
          <p className={styles.note}>
            Drag to orbit. Click to select. Two-finger scrolling pans; pinch
            zooms. For more room,{" "}
            <a
              href="/holoanatomy/shoulder/index.html"
              target="_blank"
              rel="noreferrer"
            >
              open the standalone studio ↗
            </a>
            .
          </p>
        </div>
      </section>
      <section className="section">
        <div className={`shell ${styles.basis}`}>
          <div>
            <p className="eyebrow">Source and scope</p>
            <h2>Geometry source and limitations</h2>
          </div>
          <div>
            <p>
              This study preserves twenty BodyParts3D surfaces. The four cuff
              muscles can be explored in context, but separate tendons,
              insertion footprints, cartilage and shoulder nerves are not
              supplied. Curriculum text is distinguished from source geometry
              throughout the studio. Learning outcomes have not been tested.
            </p>
            <p>
              BodyParts3D, © The Database Center for Life Science licensed
              under{" "}
              <a href="https://creativecommons.org/licenses/by/4.0/">
                CC Attribution 4.0 International
              </a>
              . The rendering and coordinate transforms are documented in the{" "}
              <a href="/holoanatomy/shoulder/assets/provenance.json">
                asset provenance
              </a>
              .
            </p>
            <p>
              The earlier{" "}
              <a
                href="/holoanatomy/index.html"
                target="_blank"
                rel="noreferrer"
              >
                head, neck and heart exhibits ↗
              </a>{" "}
              remain available in the original viewer.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
