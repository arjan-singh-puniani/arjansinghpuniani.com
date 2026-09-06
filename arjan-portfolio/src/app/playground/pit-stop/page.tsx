import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/site";
import styles from "./pit-stop.module.css";

export const metadata: Metadata = {
  title: "Pit Stop Lab — Formula Racing Wheel Change",
  description:
    "Interactive Formula-style pit-stop laboratory by Arjan Singh Puniani: inspect a center-lock wheel change, wheel gun, retained nut, hub, brake, replacement wheel, and jack sequence.",
  alternates: { canonical: "/playground/pit-stop" },
  openGraph: {
    type: "website",
    url: `${siteUrl}/playground/pit-stop`,
    title: "Pit Stop Lab | Arjan Singh Puniani",
    description:
      "An interactive educational visualization of a Formula-style center-lock wheel change.",
    images: [
      {
        url: "/pit-stop-lab/preview.png",
        width: 1200,
        height: 800,
        alt: "Procedural Formula-style pit wheel and center-lock service assembly in the Pit Stop Lab",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pit Stop Lab | Arjan Singh Puniani",
    description:
      "Inspect a Formula-style center-lock wheel change as an interactive mechanical system.",
    images: ["/pit-stop-lab/preview.png"],
  },
};

export default function PitStopLabPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Pit Stop Lab",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: `${siteUrl}/playground/pit-stop`,
    description:
      "Interactive educational visualization of a Formula-style center-lock pit wheel change.",
    author: {
      "@type": "Person",
      "@id": `${siteUrl}/#arjan-singh-puniani`,
      name: "Arjan Singh Puniani",
      url: siteUrl,
    },
    isAccessibleForFree: true,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <header className={`page-hero ${styles.hero}`}>
        <div className="shell">
          <Link className={styles.backLink} href="/playground">
            ← Playground
          </Link>
          <p className="eyebrow">Formula systems · Mechanical simulation</p>
          <h1>Pit Stop Lab</h1>
          <p>
            Inspect a Formula-style center-lock wheel change as a mechanical sequence: wheel gun,
            retained nut, hub, brake, outgoing wheel, replacement wheel, and jack release.
          </p>
          <div className={styles.actions}>
            <a className="button" href="/pit-stop-lab/index.html" target="_blank" rel="noreferrer">
              Open full-screen lab ↗
            </a>
            <Link className="button-secondary" href="/playground">
              Back to Playground
            </Link>
          </div>
        </div>
      </header>

      <section className={styles.simSection} aria-label="Interactive pit stop laboratory">
        <div className={styles.frameShell}>
          <div className={styles.frameBar}>
            <span>FORMULA SYSTEMS / PIT STOP LAB</span>
            <span>INTERACTIVE · PROCEDURAL · EDUCATIONAL</span>
          </div>
          <iframe
            className={styles.simFrame}
            src="/pit-stop-lab/index.html"
            title="Interactive Formula-style pit stop wheel-change laboratory"
            loading="eager"
            allow="fullscreen"
          />
        </div>
      </section>

      <section className="section">
        <div className="shell case-intro">
          <div>
            <p className="eyebrow">What to inspect</p>
            <h2>A pit stop as a timed mechanical handoff.</h2>
          </div>
          <div>
            <p>
              Scrub the timeline or run the sequence continuously. Camera presets isolate the gun,
              center-lock hub, brake, and wheel-transfer path. Cutaway and exploded views expose
              geometry that is difficult to see during normal playback.
            </p>
            <p>
              The model is intentionally generic and educational. It is not an official Formula 1
              model, team procedure, dimensional replica, or representation of proprietary hardware.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
