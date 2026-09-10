import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/site";
import styles from "./hemodynamic-observatory.module.css";

export const metadata: Metadata = {
  title: "Hemodynamic Observatory — Carotid Flow",
  description:
    "Interactive cardiovascular mechanics study of a synthetic stenosed carotid artery with explicit model provenance and reduced-order hemodynamics.",
  alternates: { canonical: "/playground/hemodynamic-observatory" },
  openGraph: {
    type: "website",
    url: `${siteUrl}/playground/hemodynamic-observatory`,
    title: "Hemodynamic Observatory | Arjan Singh Puniani",
    description:
      "Explore flow acceleration, a post-stenotic jet, recirculation, vorticity, modeled pressure, and wall shear in an explicitly synthetic carotid model.",
    images: [
      {
        url: "/hemodynamic-observatory/preview.png",
        width: 1440,
        height: 1200,
        alt: "Hemodynamic Observatory showing synthetic reduced-order flow through a stenosed carotid artery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hemodynamic Observatory | Arjan Singh Puniani",
    description: "Interactive synthetic carotid-flow observatory with explicit scientific provenance.",
    images: ["/hemodynamic-observatory/preview.png"],
  },
};

export default function HemodynamicObservatoryPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Hemodynamic Observatory",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: `${siteUrl}/playground/hemodynamic-observatory`,
    description:
      "Interactive educational visualization of a deterministic reduced-order velocity field through synthetic stenosed carotid geometry.",
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

      <header className={styles.hero}>
        <div className={`shell ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <Link className={styles.backLink} href="/playground">
              ← Playground
            </Link>
            <p className="eyebrow">Hemodynamic Observatory · Cardiovascular mechanics</p>
            <h1>See a narrowing become a jet.</h1>
            <p className={styles.deck}>
              An interactive study of how an idealized carotid stenosis reshapes flow. Rotate the
              vessel, scrub the cardiac cycle, expose the longitudinal section, and trace every
              displayed quantity back to its model assumption.
            </p>
            <div className={styles.actions}>
              <a
                className="button"
                href="/hemodynamic-observatory/index.html"
                target="_blank"
                rel="noreferrer"
              >
                Open full-screen observatory ↗
              </a>
              <a className={styles.textLink} href="#observatory">
                Inspect the model ↓
              </a>
            </div>
          </div>

          <aside className={styles.heroAside} aria-label="Model status">
            <div className={styles.signal} aria-hidden="true">
              <span />
              <i />
              <b />
            </div>
            <span className="status">SCIENTIFIC VISUALIZATION</span>
            <dl>
              <div><dt>Case</dt><dd>Idealized carotid stenosis</dd></div>
              <div><dt>Model</dt><dd>Deterministic reduced-order field</dd></div>
              <div><dt>Basis</dt><dd>Synthetic geometry · reduced-order mechanics</dd></div>
            </dl>
          </aside>
        </div>
      </header>

      <section className={styles.instrumentSection} id="observatory" aria-label="Interactive hemodynamic observatory">
        <div className="shell">
          <div className={styles.instrumentHead}>
            <div>
              <p className={styles.index}>01 / INTERACTIVE MODEL</p>
              <h2>Flow field</h2>
            </div>
            <p>
              Narrowing → acceleration → jet → near-wall reversal → recovery. The embedded view
              uses the portfolio itself as its frame; open full screen only when you want the
              complete scientific instrument.
            </p>
          </div>

          <div className={styles.modelRail} aria-label="Model provenance summary">
            <span><b>GEOMETRY</b> synthetic</span>
            <span><b>VELOCITY</b> analytic / flux-conserving</span>
            <span><b>PRESSURE</b> reduced-order approximation</span>
            <span><b>USE</b> educational</span>
          </div>

          <div className={styles.frameShell}>
            <iframe
              className={styles.simFrame}
              src="/hemodynamic-observatory/index.html?embed=1"
              title="Interactive hemodynamic observatory for an idealized stenosed carotid artery"
              loading="eager"
              allow="fullscreen"
            />
          </div>
        </div>
      </section>

      <section className={styles.explainSection}>
        <div className={`shell ${styles.explainGrid}`}>
          <div>
            <p className={styles.index}>02 / MODEL BASIS</p>
            <h2>Mechanism first.<br />Assumptions in view.</h2>
          </div>
          <div className={styles.explainCopy}>
            <p>
              The model uses synthetic geometry and a deterministic reduced-order field so every
              displayed quantity remains traceable to an explicit assumption. Geometry, velocity,
              derived quantities, and the pressure approximation stay distinct.
            </p>
            <p>
              Switch between the three-dimensional vessel, longitudinal section, and cross-sectional
              views to inspect what the model actually supports: throat acceleration, post-stenotic
              flow structure, wall shear, and the axial pressure trend.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.modelChain} aria-label="Model chain">
        <div className="shell">
          <p className={styles.index}>03 / MODEL CHAIN</p>
          <div className={styles.chainGrid}>
            <div><span>01</span><b>Geometry</b><p>Smooth procedural lumen with explicit diameter reduction.</p></div>
            <div><span>02</span><b>Field</b><p>Flux-conserving axial flow with continuity-derived radial motion.</p></div>
            <div><span>03</span><b>Derive</b><p>Reynolds, Womersley, vorticity, wall shear, and modeled pressure.</p></div>
            <div><span>04</span><b>Render</b><p>Every visual encoding inherits a quantity, unit, and provenance state.</p></div>
          </div>
        </div>
      </section>
    </>
  );
}
