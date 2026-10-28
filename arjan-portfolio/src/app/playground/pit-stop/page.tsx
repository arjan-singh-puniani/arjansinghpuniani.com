import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/site";
import styles from "./pit-stop.module.css";

export const metadata: Metadata = {
  title: "Pit Stop Lab — Formula Racing Engineering Laboratory",
  description:
    "Interactive Formula-style pit-stop laboratory by Arjan Singh Puniani: run a four-corner pit stop, inspect center-lock mechanics, and explore timing, safe release, uncertainty, and historical-data ML race strategy.",
  alternates: { canonical: "/playground/pit-stop" },
  openGraph: {
    type: "website",
    url: `${siteUrl}/playground/pit-stop`,
    title: "Pit Stop Lab | Arjan Singh Puniani",
    description:
      "Explore an original SF-26 launch-reference recreation, perform a manual wheel change, and investigate race strategy.",
    images: [
      {
        url: "/pit-stop-lab/preview-hero.webp",
        width: 1280,
        height: 800,
        alt: "Original red-and-white Formula car recreation in an interactive engineering garage",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pit Stop Lab | Arjan Singh Puniani",
    description:
      "Inspect a Formula car, perform a safe wheel change and explore historical-data race strategy.",
    images: ["/pit-stop-lab/preview-hero.webp"],
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
      "Deterministic four-corner pit-stop simulation with a reference-driven garage, manual wheel challenge, mechanical inspection, timing analysis, historical pace-model training, and uncertain race-strategy comparisons.",
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
      <header className={styles.labHeader}>
        <Link href="/playground">← Playground</Link>
        <h1>Pit Stop Lab</h1>
        <a href="/pit-stop-lab/index.html" target="_blank" rel="noreferrer">Open full screen ↗</a>
      </header>

      <section className={styles.simSection} aria-label="Interactive pit stop laboratory">
        <div className={styles.frameShell}>
          <iframe
            className={styles.simFrame}
            src="/pit-stop-lab/index.html"
            title="Interactive Formula-style pit stop engineering laboratory"
            loading="eager"
            allow="fullscreen"
          />
        </div>
      </section>

    </>
  );
}
