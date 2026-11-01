import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/site";
import styles from "./pit-stop.module.css";

export const metadata: Metadata = {
  title: "Pit Stop Lab — Formula Racing Engineering Laboratory",
  description:
    "Historical racing telemetry, time-causal pace models, paired strategy simulations, a 36-scenario robustness map, and a manual pit-stop challenge by Arjan Singh Puniani.",
  alternates: { canonical: "/playground/pit-stop" },
  openGraph: {
    type: "website",
    url: `${siteUrl}/playground/pit-stop`,
    title: "Pit Stop Lab | Arjan Singh Puniani",
    description:
      "Replay recorded Formula racing telemetry, audit what the pace model knew, and stress-test pit decisions.",
    images: [
      {
        url: "/pit-stop-lab/pit-wall-preview.webp",
        width: 1280,
        height: 800,
        alt: "Historical pit wall showing recorded Bahrain telemetry, circuit replay and conditional strategy comparisons",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pit Stop Lab | Arjan Singh Puniani",
    description:
      "Recorded telemetry, traceable pace learning and pit-strategy stress tests.",
    images: ["/pit-stop-lab/pit-wall-preview.webp"],
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
      "Historical telemetry and location replay with timestamp-gated pace learning, paired Monte Carlo action comparison, a 36-scenario assumption sweep, reproducible engineering briefs, and a deterministic pit-stop simulation.",
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
