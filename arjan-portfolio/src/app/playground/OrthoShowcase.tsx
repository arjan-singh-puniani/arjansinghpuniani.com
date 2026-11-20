import Image from "next/image";
import Link from "next/link";
import styles from "./playground.module.css";

export const orthoPreview = "/hospitalsim/ortho/showcase.webp";

export default function OrthoShowcase({ clinicHref }: { clinicHref: string }) {
  return (
    <section className={`${styles.showcase} project-tile`} aria-labelledby="ortho-title">
      <div className={styles.showcaseCopy}>
        <p className={styles.showcaseLabel}>hospitalSIM / Orthopedic simulation</p>
        <h2 id="ortho-title">Ortho Lab</h2>
        <p>Grab the clamp. Align the fracture in two views, secure it, and dress the site in an interactive 3D case.</p>
        <div className={styles.showcaseActions}>
          <a className={`button ${styles.orthoAction}`} href="/hospitalsim/ortho/index.html">
            Jump to Ortho Lab <span aria-hidden="true">↗</span>
          </a>
          <Link className={styles.clinicAction} href={clinicHref}>Explore the hospital</Link>
        </div>
      </div>
      <figure className={styles.showcaseImage}>
        <Image
          src={orthoPreview}
          alt="Ortho Lab gameplay showing a clamp at a displaced femur fracture and retractors holding the surrounding tissue."
          fill
          priority
          sizes="(max-width: 800px) 100vw, (max-width: 1220px) 60vw, 700px"
        />
      </figure>
    </section>
  );
}
