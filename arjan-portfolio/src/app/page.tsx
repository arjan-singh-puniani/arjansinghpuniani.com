import Image from "next/image";
import Link from "next/link";
import { OrbitField } from "@/components/OrbitField";

const disciplines = ["Medicine", "Neural engineering", "Reasoning systems", "Human performance"];

export default function Home() {
  return <>
    <section className="home-hero">
      <OrbitField />
      <div className="hero-axis" aria-hidden="true"><span>OBSERVE</span><span>ACT</span></div>
      <div className="shell home-hero-inner">
        <p className="overline"><span /> Physician-engineer in formation</p>
        <h1>Systems for decisions<br /><em>under uncertainty.</em></h1>
        <p className="home-deck">Arjan Singh Puniani works across neural engineering, clinical translation, and high-consequence human performance.</p>
        <div className="hero-actions"><Link className="button" href="/work">Explore selected work <span aria-hidden="true">↗</span></Link><Link className="quiet-link" href="/motorsport">Motorsport systems <span aria-hidden="true">→</span></Link></div>
      </div>
      <div className="discipline-rail shell" aria-label="Areas of work">{disciplines.map((item, index) => <span key={item}><b>{String(index + 1).padStart(2, "0")}</b>{item}</span>)}</div>
    </section>

    <section className="thesis-section section-rule"><div className="shell split-intro"><p className="section-index">01 / Working architecture</p><div><h2>Signal becomes useful only when it changes a decision.</h2><div className="logic-chain" aria-label="Shared systems architecture"><span>Signal</span><i>→</i><span>Interpretation</span><i>→</i><span>Decision</span><i>→</i><span>Action</span><i>→</i><span>Feedback</span></div></div></div></section>

    <section className="selected-work section-rule"><div className="shell">
      <header className="editorial-head"><div><p className="section-index">02 / Selected work</p><h2>Evidence, not adjectives.</h2></div><Link href="/work">Complete project index ↗</Link></header>
      <div className="home-projects">
        <article className="home-project home-project-featured"><div className="project-visual device-visual"><Image src="/images/neurotechnology/seizefreeze-exploded-concept.png" alt="Exploded concept rendering of the SeizeFreeze focal cortical-cooling device" fill sizes="(max-width: 800px) 100vw, 55vw" /></div><div className="home-project-copy"><div className="project-kicker"><span>Neurotechnology</span><span className="status">PROTOTYPE</span></div><h3>SeizeFreeze</h3><p>An early-stage focal cortical-cooling concept for drug-resistant epilepsy.</p><dl><div><dt>Role</dt><dd>Founder + device lead</dd></div><div><dt>Evidence</dt><dd>$12.5K in documented competition awards</dd></div></dl><Link href="/work/seizefreeze">Open case study ↗</Link></div></article>
        <article className="home-project motorsport-feature"><div className="home-project-copy"><div className="project-kicker"><span>Motorsport / safety systems</span><span className="status status-gold">ACADEMIC STUDY</span></div><h3>Emergency operations at Sonoma</h3><p>A role-based system for coordinating response during a complex road-course race weekend.</p><dl><div><dt>Role</dt><dd>Systems analysis / academic study</dd></div><div><dt>Status</dt><dd>Course-use proposal</dd></div></dl><Link href="/work/sonoma-emergency-operations">View case study ↗</Link></div><div className="command-mini" aria-label="Compact coordination schematic"><span>Race control</span><span>Rescue</span><strong>Shared operating picture</strong><span>Medical</span><span>Operations</span></div></article>
        <article className="home-project research-feature"><div className="project-visual"><Image src="/images/research/rnel-gamified-bci-task.jpg" alt="Gamified brain-computer interface calibration task in a research laboratory" fill sizes="(max-width: 800px) 100vw, 48vw" /></div><div className="home-project-copy"><div className="project-kicker"><span>Brain-computer interfaces</span><span className="status">COMPLETED</span></div><h3>Calibration worth finishing</h3><p>Gamified psychophysics, neural-recording interfaces, and analysis across more than 940 sessions.</p><Link href="/work/bci-calibration">Open case study ↗</Link></div></article>
      </div>
    </div></section>

    <section className="trajectory section-rule"><div className="shell trajectory-grid"><p className="section-index">03 / Current trajectory</p><h2>Medicine<br />at speed.</h2><div><p>Current study focuses on crash and neurotrauma documentation, emergency operations, risk systems, and human performance—without presenting academic work as field authority.</p><Link className="button button-ivory" href="/motorsport">Enter the motorsport work ↗</Link></div></div></section>
    <section className="contact-band"><div className="shell"><p>Have a difficult system worth structuring?</p><Link href="/contact">Start with the problem. <span aria-hidden="true">↗</span></Link></div></section>
  </>;
}
