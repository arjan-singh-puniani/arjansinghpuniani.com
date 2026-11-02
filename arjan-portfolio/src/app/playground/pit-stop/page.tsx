import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/site";
import styles from "./pit-stop.module.css";

export const metadata: Metadata = {
  title: "Pit Stop Lab — Formula Racing Engineering Laboratory",
  description:
    "Watch recorded racing telemetry drive a cinematic 3D lap and event-driven pit operation, then inspect the pace model, strategy simulations and evidence.",
  alternates: { canonical: "/playground/pit-stop" },
  openGraph: {
    type: "website",
    url: `${siteUrl}/playground/pit-stop`,
    title: "Pit Stop Lab | Arjan Singh Puniani",
    description:
      "A directed 3D lap, slow-motion pit service and recorded telemetry, connected to traceable machine learning and strategy experiments.",
    images: [
      {
        url: "/pit-stop-lab/show-preview.webp",
        width: 1440,
        height: 1000,
        alt: "Original illustrative racing car on a source-derived circuit, with recorded speed, pedals and a synchronized track map",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pit Stop Lab | Arjan Singh Puniani",
    description:
      "Watch the lap, slow down the pit operation, and inspect the evidence behind each strategy.",
    images: ["/pit-stop-lab/show-preview.webp"],
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
      "Directed 3D historical telemetry replay and modeled pit service with timestamp-gated pace learning, paired Monte Carlo action comparison, a 36-scenario assumption sweep, reproducible engineering briefs, and a deterministic pit-stop simulation.",
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
