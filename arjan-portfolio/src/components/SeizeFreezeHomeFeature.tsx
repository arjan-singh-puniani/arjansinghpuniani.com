import Image from "next/image";
import Link from "next/link";
import styles from "./SeizeFreezeHomeFeature.module.css";

export function SeizeFreezeHomeFeature() {
  return <article className={`v2-feature v2-feature-dark ${styles.feature}`}>
    <div className={`v2-feature-image v2-device ${styles.visual}`}>
      <Image
        src="/images/neurotechnology/seizefreeze-homepage-hero-v2.webp"
        alt="Concept visualization of the proposed SeizeFreeze implant, thermoelectric assembly, and localized cortical cooling"
        fill
        sizes="(max-width: 900px) calc(100vw - 24px), 52vw"
      />
    </div>
    <div className="v2-feature-copy">
      <p>01 / Neurotechnology</p>
      <h3>SeizeFreeze</h3>
      <p className="v2-feature-lead">A focal cortical-cooling concept for drug-resistant epilepsy.</p>
      <dl>
        <div><dt>Role</dt><dd>Founder + device lead</dd></div>
        <div><dt>State</dt><dd>Concept + prototype planning</dd></div>
        <div><dt>Output</dt><dd>Architecture diagrams + thermal models</dd></div>
      </dl>
      <Link href="/work/seizefreeze">Open case study <span>↗</span></Link>
    </div>
  </article>;
}
