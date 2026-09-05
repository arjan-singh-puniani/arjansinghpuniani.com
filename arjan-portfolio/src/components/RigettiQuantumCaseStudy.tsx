import Link from "next/link";

const systemLayers = [
  { index: "01", title: "Room-temperature control", body: "Clocking, waveform generation, microwave synthesis, flux control, digitization, and field-programmable gate array logic coordinate the experiment." },
  { index: "02", title: "Cryogenic chain", body: "Nested thermal stages, shielding, supports, feedthroughs, and wiring carry signals toward a millikelvin environment." },
  { index: "03", title: "Processor interface", body: "A simplified transmon-like layout connects eight modeled qubits, resonators, couplers, wire bonds, and a mounted package." },
  { index: "04", title: "Drive and readout", body: "Animated pulses trace the conceptual path from control electronics to the processor and back through amplification and digitization." },
];

export function RigettiQuantumCaseStudy() {
  return <article className="rq-case">
    <header className="rq-hero">
      <div className="shell">
        <p className="rq-kicker">Rigetti Computing / 2013–2015</p>
        <h1>Operating around<br /><em>the machine.</em></h1>
        <p className="rq-deck">A retrospective case study connecting early-stage company operations with an independent interactive model of the superconducting quantum-computing stack.</p>
        <dl className="rq-facts">
          <div><dt>Documented role</dt><dd>Chief of Staff</dd></div>
          <div><dt>Company context</dt><dd>Early-stage quantum computing</dd></div>
          <div><dt>Interactive artifact</dt><dd>Independent educational model · 2026</dd></div>
        </dl>
      </div>
    </header>

    <section className="rq-boundary">
      <div className="shell"><strong>Evidence boundary</strong><p>The interactive model below was built independently in 2026. It is not a Rigetti product, proprietary design, dimensional replica, or representation of confidential hardware.</p></div>
    </section>

    <section className="rq-section rq-context">
      <div className="shell rq-two-column">
        <p className="rq-index">00 / The operating role</p>
        <div><h2>Technical companies are also coordination systems.</h2><p className="rq-lede">At Rigetti Computing, my documented role centered on early-stage company operations, investor communications, and strategic execution. The work required translating across technical ambition, organizational priorities, external stakeholders, and the practical demands of building a company around difficult hardware.</p><p>This case study does not recast that operating role as processor or cryogenic engineering. The model provides technical context for the system that the organization existed to build.</p></div>
      </div>
    </section>

    <section className="rq-lab rq-section" aria-labelledby="rq-lab-title">
      <div className="shell">
        <div className="rq-section-head"><div><p className="rq-index">01 / Interactive system</p><h2 id="rq-lab-title">Follow a gate cycle through the stack.</h2></div><p>Orbit the system, inspect components, switch camera views, expose the cryostat interior, and run a modeled drive-to-readout sequence.</p></div>
        <div className="rq-frame-shell">
          <iframe title="Interactive educational model of a superconducting quantum computer" src="/quantum-computer-lab/index.html" loading="lazy" sandbox="allow-scripts allow-same-origin" allow="fullscreen" />
        </div>
        <div className="rq-lab-actions"><p>Desktop offers the complete inspection interface. Mobile preserves the core camera and sequence controls.</p><a href="/quantum-computer-lab/index.html" target="_blank" rel="noreferrer">Open the full-screen laboratory ↗</a></div>
      </div>
    </section>

    <section className="rq-section rq-system">
      <div className="shell">
        <p className="rq-index">02 / System anatomy</p>
        <h2>Control, cool, drive, read.</h2>
        <div className="rq-system-grid">{systemLayers.map(layer => <article key={layer.index}><span>{layer.index}</span><h3>{layer.title}</h3><p>{layer.body}</p></article>)}</div>
      </div>
    </section>

    <section className="rq-section rq-record">
      <div className="shell rq-two-column">
        <div><p className="rq-index">03 / What this establishes</p><h2>Keep the record precise.</h2></div>
        <div className="rq-record-list">
          <article><span>Documented</span><h3>Company operations</h3><p>Chief of Staff at Rigetti Computing from 2013 through 2015, focused on early-stage operations, investor communications, and strategic execution.</p></article>
          <article><span>Implemented later</span><h3>Interactive explainer</h3><p>A tested Three.js educational model built independently in 2026 to make the surrounding control chain inspectable.</p></article>
          <article><span>Not claimed</span><h3>Commercial hardware authorship</h3><p>No claim that this model reproduces a Rigetti machine, contains proprietary information, or documents processor, cryostat, or control-system engineering performed at Rigetti.</p></article>
        </div>
      </div>
    </section>

    <nav className="rq-footer-nav" aria-label="Case study navigation"><div className="shell"><Link href="/work">← All work</Link><Link href="/cv">View documented experience →</Link></div></nav>
  </article>;
}
