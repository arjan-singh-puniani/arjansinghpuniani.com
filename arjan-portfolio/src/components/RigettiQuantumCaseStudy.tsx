import Link from "next/link";

const systemLayers = [
  {
    index: "01",
    title: "Room-temperature control",
    body: "Clocking, waveform generation, microwave synthesis, flux control, digitization, and field-programmable gate array logic coordinate the experiment.",
  },
  {
    index: "02",
    title: "Cryogenic chain",
    body: "Nested thermal stages, shielding, supports, feedthroughs, and wiring carry signals toward a millikelvin environment.",
  },
  {
    index: "03",
    title: "Processor interface",
    body: "An original processor close-up shows capacitive pads, Josephson junctions, a coupling bus, resonators, interconnects, and a cold package.",
  },
  {
    index: "04",
    title: "Drive and readout",
    body: "A complex-valued simulator links one to three qubits, exact gate matrices, Bloch geometry, compiled pulses, and seeded readout statistics.",
  },
];

export function RigettiQuantumCaseStudy() {
  return (
    <article className="rq-case">
      <header className="rq-hero">
        <div className="shell">
          <p className="rq-kicker">Rigetti Computing / 2013–2015</p>
          <h1>Quantum systems operations</h1>
          <p className="rq-deck">
            I worked in company operations at Rigetti Computing from 2013 to
            2015. This independent educational model, built in 2026, connects
            superconducting hardware, gate calculations, control pulses, and
            measurement statistics.
          </p>
          <dl className="rq-facts">
            <div>
              <dt>Documented role</dt>
              <dd>Chief of Staff</dd>
            </div>
            <div>
              <dt>Company context</dt>
              <dd>Early-stage quantum computing</dd>
            </div>
            <div>
              <dt>Interactive artifact</dt>
              <dd>Independent educational model · 2026</dd>
            </div>
          </dl>
        </div>
      </header>

      <section className="rq-boundary">
        <div className="shell">
          <strong>Artifact context</strong>
          <p>
            The 2026 interactive model is an independent educational
            reconstruction built to explain the superconducting stack around the
            documented operating role.
          </p>
        </div>
      </section>

      <section className="rq-lab rq-section" aria-labelledby="rq-lab-title">
        <div className="shell">
          <div className="rq-section-head">
            <div>
              <p className="rq-index">01 / Interactive system</p>
              <h2 id="rq-lab-title">
                Quantum computation laboratory
              </h2>
            </div>
            <p>
              Twelve assembly modules lead into a synchronized circuit,
              state-vector, geometry, control, and hardware workspace. Run a
              Bell experiment or build an inspectable circuit of your own.
            </p>
          </div>
          <div className="rq-frame-shell">
            <iframe
              title="Interactive educational model of a superconducting quantum computer"
              src="/quantum-computer-lab/index.html"
              loading="eager"
              sandbox="allow-scripts allow-same-origin allow-top-navigation-by-user-activation"
              allow="fullscreen"
            />
          </div>
          <div className="rq-lab-actions">
            <p>
              Keyboard, touch, reduced motion, and a complete HTML cutaway are
              supported. Use the full-screen laboratory for the most room.
            </p>
            <a
              href="/quantum-computer-lab/index.html"
              target="_blank"
              rel="noreferrer"
            >
              Open the full-screen laboratory ↗
            </a>
          </div>
        </div>
      </section>

      <section className="rq-section rq-context">
        <div className="shell rq-two-column">
          <p className="rq-index">00 / The operating role</p>
          <div>
            <h2>My operations role at Rigetti</h2>
            <p className="rq-lede">
              At Rigetti Computing, my documented role centered on early-stage
              company operations, investor communications, and strategic
              execution. The résumé records this role; it does not establish
              processor, cryostat, or control-hardware engineering.
            </p>
            <p>
              The later model is a separate software project. It depicts generic
              hardware and uses simulated telemetry; it is not a Rigetti product
              or a reconstruction of confidential designs.
            </p>
          </div>
        </div>
      </section>

      <section className="rq-section rq-system">
        <div className="shell">
          <p className="rq-index">02 / System anatomy</p>
          <h2>Components in the educational model</h2>
          <div className="rq-system-grid">
            {systemLayers.map((layer) => (
              <article key={layer.index}>
                <span>{layer.index}</span>
                <h3>{layer.title}</h3>
                <p>{layer.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rq-section rq-record">
        <div className="shell rq-two-column">
          <div>
            <p className="rq-index">03 / Record</p>
            <h2>Evidence and limitations</h2>
          </div>
          <div className="rq-record-list">
            <article>
              <span>Documented</span>
              <h3>Company operations</h3>
              <p>
                Chief of Staff at Rigetti Computing from 2013 through 2015,
                focused on early-stage operations, investor communications, and
                strategic execution.
              </p>
            </article>
            <article>
              <span>Implemented later</span>
              <h3>Interactive explainer</h3>
              <p>
                A tested Three.js educational model built independently in 2026
                to make the surrounding control chain inspectable.
              </p>
            </article>
            <article>
              <span>Connection</span>
              <h3>Model scope</h3>
              <p>
                The model source and build records support the software
                artifact. Its simulated operation does not demonstrate quantum
                processor performance.
              </p>
            </article>
          </div>
        </div>
      </section>

      <nav className="rq-footer-nav" aria-label="Case study navigation">
        <div className="shell">
          <Link href="/work">← All work</Link>
          <Link href="/cv">View documented experience →</Link>
        </div>
      </nav>
    </article>
  );
}
