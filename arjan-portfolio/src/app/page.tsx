import Image from "next/image";
import Link from "next/link";

const disciplines = ["Neural engineering", "Clinical translation", "Human performance", "Motorsport medicine"];

export default function Home() {
  return <>
    <section className="v2-hero">
      <div className="v2-orbit" aria-hidden="true"><span>01</span><i /><span>26</span></div>
      <div className="shell v2-hero-grid">
        <div className="v2-hero-copy">
          <p className="v2-label"><span /> Physician-engineer in formation</p>
          <h1>Build what<br />care needs<br /><em>next.</em></h1>
          <p className="v2-intro">Arjan Singh Puniani works where neural signals, clinical judgment, and high-performance systems meet.</p>
          <div className="v2-actions"><Link href="/work">Enter the work <b>↗</b></Link><Link href="/about">The person behind it</Link></div>
        </div>
        <div className="v2-visual">
          <div className="v2-photo-index">ASP / 001</div>
          <Image src="/images/hero/arjan-cleanroom-portrait.jpeg" alt="Arjan Puniani in a university cleanroom" fill priority sizes="(max-width: 800px) 100vw, 44vw" />
          <div className="v2-photo-caption"><span>University cleanroom</span><span>Pittsburgh, PA</span></div>
          <div className="v2-signal" aria-hidden="true"><svg viewBox="0 0 440 80" preserveAspectRatio="none"><path d="M0 44h66l12-2 8 2h36l8-20 12 46 13-64 15 38h36l8-4 10 4h70l13-12 14 27 13-36 14 21h83" /></svg></div>
        </div>
      </div>
      <div className="v2-ticker" aria-label="Areas of work">{[...disciplines, ...disciplines].map((item, i) => <span key={`${item}-${i}`}>{item}<b>✦</b></span>)}</div>
    </section>

    <section className="v2-manifesto">
      <div className="shell v2-manifesto-grid"><p className="v2-section-number">[ 01 — Thesis ]</p><div><h2>Engineering is most consequential when the system is human.</h2><p>I turn difficult signals, constrained environments, and incomplete evidence into tools people can understand and use.</p></div></div>
    </section>

    <section className="v2-work">
      <div className="shell v2-work-head"><p className="v2-section-number">[ 02 — Selected systems ]</p><h2>Work with a pulse.</h2><Link href="/work">View all projects ↗</Link></div>
      <article className="v2-feature v2-feature-dark">
        <div className="v2-feature-image v2-device"><Image src="/images/neurotechnology/seizefreeze-exploded-concept.png" alt="Exploded concept rendering of the SeizeFreeze cortical-cooling device" fill sizes="(max-width: 800px) 100vw, 50vw" /></div>
        <div className="v2-feature-copy"><p>01 / Neurotechnology</p><h3>SeizeFreeze</h3><p className="v2-feature-lead">A focal cortical-cooling concept for drug-resistant epilepsy.</p><dl><div><dt>Role</dt><dd>Founder + device lead</dd></div><div><dt>State</dt><dd>Prototype</dd></div><div><dt>Evidence</dt><dd>$12.5K documented awards</dd></div></dl><Link href="/work/seizefreeze">Open case study <span>↗</span></Link></div>
      </article>
      <article className="v2-feature v2-feature-light">
        <div className="v2-feature-copy"><p>02 / Brain-computer interfaces</p><h3>Making calibration worth finishing.</h3><p className="v2-feature-lead">Gamified psychophysics, neural recording interfaces, and patterns found across more than 940 sessions.</p><dl><div><dt>Role</dt><dd>R&amp;D neural engineer</dd></div><div><dt>State</dt><dd>Completed research</dd></div></dl><Link href="/work/bci-calibration">Open case study <span>↗</span></Link></div>
        <div className="v2-feature-image"><Image src="/images/research/rnel-gamified-bci-task.jpg" alt="Gamified brain-computer interface calibration task in a research laboratory" fill sizes="(max-width: 800px) 100vw, 56vw" /></div>
      </article>
    </section>

    <section className="v2-crossroads">
      <div className="shell"><p className="v2-section-number">[ 03 — Current trajectory ]</p><div className="v2-crossroads-grid"><h2>Medicine.<br />Engineering.<br /><em>At speed.</em></h2><div><p>Current work extends into physician training and trackside neurotrauma: places where decisions must remain rigorous under pressure.</p><Link href="/work/motorsport-neurotrauma-toolkit">Explore the motorsport toolkit ↗</Link></div></div></div>
    </section>

    <section className="v2-contact"><div className="shell"><p>Have a difficult system worth building?</p><Link href="/contact">Let’s work on it. <span>↗</span></Link></div></section>
  </>;
}
