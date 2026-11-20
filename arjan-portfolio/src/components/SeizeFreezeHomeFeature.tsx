import Image from "next/image";
import Link from "next/link";
import styles from "./SeizeFreezeHomeFeature.module.css";

export function SeizeFreezeHomeFeature() {
  return (
    <article className={styles.feature} aria-labelledby="seizefreeze-home-title">
      <div className={styles.copy}>
        <div className={styles.brand} aria-label="Cyberpunk Reality">
          <Image className={styles.brandMark} src="/images/home/cyberpunk-reality-mark.webp" alt="" width={142} height={160} unoptimized />
          <span>Cyberpunk<br />Reality</span>
        </div>
        <p className={styles.eyebrow}>Neurotechnology · Device concept</p>
        <h3 id="seizefreeze-home-title"><Link href="/work/seizefreeze">SeizeFreeze</Link></h3>
        <p className={styles.lead}>Exploring focal cortical cooling for drug-resistant epilepsy.</p>
        <p className={styles.description}>I developed the proposed thermoelectric architecture and thermal models, built early prototypes, and filed a provisional patent. The interactive lab lets you inspect the assembly, explore its placement, and change the model’s assumptions.</p>
        <nav className={styles.actions} aria-label="Explore SeizeFreeze">
          <a href="/seizefreeze-lab/index.html" data-analytics-event="view_project">Explore the interactive lab</a>
          <Link href="/work/seizefreeze">Read the project record</Link>
        </nav>
      </div>
      <figure className={styles.visual}>
        <Image src="/images/home/cyberpunk-reality-team.webp" alt="The Cyberpunk Reality team with the Kuzneski Innovation Cup" width={1600} height={1200} unoptimized />
        <figcaption>Cyberpunk Reality team<br /><span>Kuzneski Innovation Cup</span></figcaption>
      </figure>
      <dl className={styles.facts}>
        <div><dt>My role</dt><dd>Founder &amp; device lead</dd></div>
        <div><dt>Stage</dt><dd>Early prototypes</dd></div>
        <div><dt>Scope</dt><dd>Not clinically validated</dd></div>
      </dl>
    </article>
  );
}
