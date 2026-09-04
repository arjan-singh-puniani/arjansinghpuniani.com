import Image from "next/image";
import Link from "next/link";
import ViewportBackgroundVideo from "@/components/ViewportBackgroundVideo";

const disciplines = ["Neural engineering", "Patient-centered design", "Clinical reasoning", "Motorsport safety"];

export default function Home() {
  return <>
    <section className="v2-hero">
      <div className="v2-orbit" aria-hidden="true"><span>01</span><i /><span>26</span></div>
      <div className="shell v2-hero-grid">
        <div className="v2-hero-copy">
          <p className="v2-label"><span /> Neural engineer pursuing medicine</p>
          <h1><span className="v2-hero-name">Arjan Singh Puniani</span>Engineering for<br />decisions that affect<br /><em>human lives.</em></h1>
          <p className="v2-intro">Arjan Singh Puniani builds evidence-aware systems across neurotechnology, clinical reasoning, rehabilitation, and motorsport safety. He is pursuing medicine to connect technical capability with responsibility for the person affected by it.</p>
          <div className="v2-actions"><Link href="/work" data-analytics-event="hero_project_click">Explore the work <b>↗</b></Link><Link href="/about">Read the approach</Link></div>
        </div>
        <div className="v2-visual">
          <div className="v2-photo-index">ASP / 001</div>
          <Image src="/images/hero/arj_kuzneski-hero.png" alt="Arjan Singh Puniani holding the Kuzneski Innovation Cup" fill priority sizes="(max-width: 800px) 100vw, 44vw" />
<div className="v2-photo-caption"><span>Kuzneski Innovation Cup</span><span>Pittsburgh, PA</span></div>
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
      <article className="v2-feature reasonos-home-feature">
        <div className="reasonos-home-visual" aria-label="ReasonOS kernel and trace diagram">
          <div className="reasonos-home-source"><span>SOURCE</span><i /></div>
          <div className="reasonos-home-chain"><div><span>01</span><strong>State</strong></div><b>→</b><div><span>02</span><strong>Transformation</strong></div><b>→</b><div><span>03</span><strong>Constraint</strong></div></div>
          <div className="reasonos-home-trace"><span>TRACE / APPEND-ONLY</span><i /><i /><i className="rejected" /><i /></div>
        </div>
        <div className="v2-feature-copy"><p>00 / Reasoning systems · Medical education</p><h3>Vector EKG + ReasonOS</h3><p className="v2-feature-lead">An educational prototype that preserves how evidence changes a model.</p><p>The system records observations, calculations, competing candidate pathways, contradictions, provenance, and revisions. It remains research software with no clinical validation.</p><dl><div><dt>Role</dt><dd>Independent designer + developer</dd></div><div><dt>State</dt><dd>Tested educational prototype</dd></div><div><dt>Year</dt><dd>2026</dd></div></dl><Link href="/work/vector-ekg-reasonos" data-analytics-event="view_project">Open the case study <span>↗</span></Link></div>
      </article>
      <article className="v2-feature v2-feature-dark">
        <div className="v2-feature-image v2-device"><Image src="/images/neurotechnology/seizefreeze-homepage-hero-v2.webp" alt="Concept visualization of the proposed SeizeFreeze implant, thermoelectric assembly, and localized cortical cooling" fill sizes="(max-width: 800px) 100vw, 50vw" /></div>
        <div className="v2-feature-copy"><p>01 / Neurotechnology</p><h3>SeizeFreeze</h3><p className="v2-feature-lead">A focal cortical-cooling concept for drug-resistant epilepsy.</p><dl><div><dt>Role</dt><dd>Founder + device lead</dd></div><div><dt>State</dt><dd>Prototype</dd></div><div><dt>Evidence</dt><dd>$12.5K documented awards</dd></div></dl><Link href="/work/seizefreeze">Open case study <span>↗</span></Link></div>
      </article>
      <article className="v2-feature v2-feature-light">
        <div className="v2-feature-copy"><p>02 / Brain-computer interfaces</p><h3>Making calibration worth finishing.</h3><p className="v2-feature-lead">Gamified psychophysics, neural recording interfaces, and patterns found across more than 940 sessions.</p><dl><div><dt>Role</dt><dd>R&amp;D neural engineer</dd></div><div><dt>State</dt><dd>Completed research</dd></div></dl><Link href="/work/bci-calibration">Open case study <span>↗</span></Link></div>
        <div className="v2-feature-image"><Image src="/images/research/rnel-gamified-bci-task.jpg" alt="Gamified brain-computer interface calibration task in a research laboratory" fill sizes="(max-width: 800px) 100vw, 56vw" /></div>
      </article>
    </section>

    <section className="v2-crossroads">
      <div className="shell"><p className="v2-section-number">[ 03 — Current trajectory ]</p><div className="v2-crossroads-grid"><h2>Medicine.<br />Engineering.<br /><em>At speed.</em></h2><div><p>Current work examines trackside neurotrauma and emergency operations: places where incomplete information, limited time, and human consequences meet.</p><p><Link href="/work/motorsport-neurotrauma-toolkit">Explore the neurotrauma toolkit ↗</Link></p><p><Link href="/work/belmont-motorsport-systems">Open the Belmont systems study ↗</Link></p></div></div><ol className="home-motorsport-sequence" aria-label="Hazard leads to decision, response, recovery, and record">{["Hazard","Decision","Response","Recovery","Record"].map((item,index)=><li key={item}><span>0{index+1}</span><strong>{item}</strong></li>)}</ol></div>
    </section>

    <section className="v2-playground-teaser"><ViewportBackgroundVideo /><div className="shell"><div><p className="v2-section-number">[ 04 — Playground ]</p><h2>Vector Tennis<br /><em>Endless Rally.</em></h2></div><div><p>A one-input arcade rally over mechanically causal contact, spin, trajectory, and bounce—with Racket Lab underneath.</p><div className="mini-causal-chain" aria-label="Read leads to timing, strike, survival, and restart">{["Read","Time","Strike","Survive","Restart"].map((item)=><span key={item}>{item}</span>)}</div><Link href="/playground/vector-tennis">Play the experiment ↗</Link></div></div></section>

    <section className="v2-contact"><div className="shell"><p>Have a difficult system worth building?</p><Link href="/contact">Let’s work on it. <span>↗</span></Link></div></section>
  </>;
}
