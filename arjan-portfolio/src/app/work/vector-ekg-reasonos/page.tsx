import type { Metadata } from "next";
import Link from "next/link";
import { ReasonOSLab } from "@/components/ReasonOSLab";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Vector EKG and ReasonOS | Inspectable ECG Reasoning",
  description: "Arjan Singh Puniani's educational prototype for recording ECG observations, measurements, competing explanations, contradictions, provenance, and revisions.",
  alternates: { canonical: "/work/vector-ekg-reasonos" },
  openGraph: { title: "Vector EKG and ReasonOS", description: "An inspectable reasoning architecture applied to electrocardiography.", url: `${siteUrl}/work/vector-ekg-reasonos`, type: "article" },
};

const kernelObjects = [
  ["01", "State", "What currently exists"], ["02", "Transformation", "An attempted change"],
  ["03", "Constraint", "A rule that admits or rejects"], ["04", "Trace", "The append-only record"],
  ["05", "Provenance", "Source, method, and lineage"], ["06", "Actor", "Who or what made the change"],
] as const;

const evidenceStates = [
  ["Observed", "Directly marked or measured from the source."], ["Inferred", "Derived from admitted observations under an explicit rule."],
  ["Contradicted", "Conflicts with another admitted finding."], ["Unresolved", "Available evidence remains insufficient or discordant."],
  ["Excluded", "A candidate explanation fails a required criterion."], ["Confirmed", "A defined review process supports the claim. Not used diagnostically here."],
] as const;

function HeroInstrument() {
  return <figure className="rosx-hero-instrument" aria-label="A synthetic ECG produces observed and measured states, an accepted hypothesis, a rejected contradiction test, and an append-only trace.">
    <div className="rosx-instrument-bar"><span>REASONOS / LIVE MODEL</span><span className="rosx-live"><i /> TRACE OPEN</span></div>
    <div className="rosx-signal-panel">
      <div className="rosx-signal-meta"><span>SOURCE / SYNTHETIC LEAD II</span><span>25 mm/s</span></div>
      <svg viewBox="0 0 760 150" role="img" aria-label="Synthetic electrocardiogram waveform">
        <defs><pattern id="hero-small-grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" fill="none" stroke="currentColor" strokeOpacity=".08" /></pattern><pattern id="hero-grid" width="50" height="50" patternUnits="userSpaceOnUse"><rect width="50" height="50" fill="url(#hero-small-grid)"/><path d="M50 0H0V50" fill="none" stroke="currentColor" strokeOpacity=".16" /></pattern></defs>
        <rect width="760" height="150" fill="url(#hero-grid)" />
        <path d="M0 84 L36 84 L44 80 L51 84 L70 84 L77 67 L84 84 L101 84 L110 27 L116 126 L125 70 L136 84 L175 84 L187 78 L198 84 L232 84 L240 80 L247 84 L266 84 L273 65 L280 84 L298 84 L307 30 L313 125 L322 69 L334 84 L373 84 L384 78 L396 84 L430 84 L438 80 L445 84 L464 84 L471 66 L478 84 L496 84 L505 28 L511 126 L520 70 L532 84 L571 84 L582 78 L594 84 L628 84 L636 80 L643 84 L662 84 L669 66 L676 84 L694 84 L703 29 L709 125 L718 69 L730 84 L760 84" />
        <line x1="273" x2="273" y1="18" y2="134" className="rosx-caliper"/><line x1="307" x2="307" y1="18" y2="134" className="rosx-caliper"/>
      </svg>
      <span className="rosx-measurement">68 ms <small>learner-selected endpoints</small></span>
    </div>
    <div className="rosx-mini-trace">
      <article><span>01 / OBSERVE</span><strong>R–R intervals appear regular</strong><small>learner-derived</small></article><b aria-hidden="true">→</b>
      <article><span>02 / MEASURE</span><strong>QRS interval · 68 ms</strong><small>application-calculated</small></article><b aria-hidden="true">→</b>
      <article className="rosx-rejected"><span>03 / CHALLENGE</span><strong>Sinus origin established</strong><small>rejected · evidence absent</small></article>
    </div>
    <figcaption><span>Accepted states 02</span><span>Rejected attempts 01</span><span>Replay deterministic</span></figcaption>
  </figure>;
}

function TransitionDiagram() {
  return <figure className="rosx-transition" aria-labelledby="transition-title">
    <div className="rosx-transition-source"><span>INPUT</span><strong>State N</strong><small>Observed evidence</small></div><i aria-hidden="true">→</i>
    <div className="rosx-transition-attempt"><span>ATTEMPT</span><strong>Transformation</strong><small>Actor + provenance</small></div><i aria-hidden="true">→</i>
    <div className="rosx-transition-gate"><span>EVALUATE</span><strong>Constraints</strong><small>Pure predicates</small></div>
    <div className="rosx-transition-branches"><article><span>ADMIT</span><strong>State N+1</strong><small>New immutable state</small></article><article><span>REJECT</span><strong>No new state</strong><small>Attempt remains visible</small></article></div>
    <div className="rosx-trace-rail"><span>TRACE</span><i/><i/><i className="rejected"/><i/><strong>Nothing is erased.</strong></div>
    <figcaption id="transition-title">Both outcomes enter the trace. Only an admitted transformation adds a state.</figcaption>
  </figure>;
}

function KernelMap() {
  return <div className="rosx-kernel-map"><div className="rosx-kernel-center"><span>KERNEL</span><strong>Domain-independent</strong><small>Valid if ECG disappears</small></div><div className="rosx-kernel-objects">{kernelObjects.map(([index, name, meaning]) => <article key={name}><span>{index}</span><h3>{name}</h3><p>{meaning}</p></article>)}</div></div>;
}

function BoundaryDiagram() {
  return <figure className="rosx-boundary" aria-label="ReasonOS kernel and Vector EKG plugin have separate responsibilities.">
    <div className="rosx-boundary-kernel"><p>REASONOS KERNEL / 3.0.0</p><h3>Structure</h3><ul><li>Immutable states</li><li>Attempted transformations</li><li>Constraint results</li><li>Replayable traces</li><li>Actor and provenance</li></ul></div>
    <div className="rosx-boundary-interface"><span>typed plugin contract</span><i aria-hidden="true">⇄</i><small>versioned · deterministic</small></div>
    <div className="rosx-boundary-plugin"><p>VECTOR EKG / 0.5.0</p><h3>Medical meaning</h3><ul><li>Leads and coordinates</li><li>Calibration</li><li>Intervals and axis</li><li>Candidate pathways</li><li>ECG constraints</li></ul></div>
    <figcaption>The kernel evaluates structural validity. The plugin owns ECG vocabulary and domain rules.</figcaption>
  </figure>;
}

export default function VectorEkgReasonOSPage() {
  const schema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Vector EKG and ReasonOS", applicationCategory: "EducationalApplication", operatingSystem: "Web", author: { "@type": "Person", name: "Arjan Singh Puniani", url: siteUrl }, url: `${siteUrl}/work/vector-ekg-reasonos`, description: "Educational research prototype for inspectable ECG reasoning.", isAccessibleForFree: true };
  return <div className="vector-case rosx-case">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}/>
    <header className="rosx-hero"><div className="shell rosx-hero-grid"><div className="rosx-hero-copy"><p className="eyebrow">Reasoning systems · Electrocardiography · 2026</p><h1>Make the reasoning inspectable.</h1><p className="vector-deck">ReasonOS records how evidence changes a model. Vector EKG applies that architecture to electrocardiographic interpretation.</p><div className="actions"><a className="button" href="#laboratory">Run the synthetic laboratory</a><a className="button-secondary" href="#architecture">Inspect the architecture</a></div></div><HeroInstrument /></div><div className="shell"><dl className="vector-facts"><div><dt>Status</dt><dd>Tested educational prototype</dd></div><div><dt>Role</dt><dd>Independent designer and developer</dd></div><div><dt>Clinical use</dt><dd>None</dd></div><div><dt>Core record</dt><dd>Append-only reasoning trace</dd></div></dl></div></header>

    <section className="section rosx-thesis"><div className="shell rosx-thesis-grid"><p className="eyebrow">01 / The problem</p><div><p className="rosx-pullquote">A correct answer can conceal weak reasoning. A wrong answer can conceal a nearly correct process.</p><div className="rosx-problem-grid"><article><span>CONVENTIONAL EXERCISE</span><strong>Final interpretation</strong><div className="rosx-score">✓</div><p>Stores the endpoint. The path disappears.</p></article><article><span>REASONOS</span><strong>Inspectable state change</strong><div className="rosx-path"><i/><i/><i className="rejected"/><i/></div><p>Preserves evidence, operations, failed attempts, and revision.</p></article></div><p>Conventional ECG exercises cannot distinguish a missed region from a faulty measurement, an unsupported inference, or a contradiction the learner never tested. ReasonOS makes those differences explicit.</p></div></div></section>

    <section className="section technical-surface rosx-runtime" id="architecture" aria-labelledby="architecture-heading"><div className="shell"><p className="eyebrow">02 / Runtime model</p><h2 id="architecture-heading">Expertise becomes transformation under constraint.</h2><p className="section-lede">Every attempted change names its inputs, actor, evidence, provenance, and governing rules. History remains intact whether the attempt succeeds or fails.</p><TransitionDiagram /></div></section>

    <section className="section rosx-kernel"><div className="shell"><div className="rosx-section-head"><div><p className="eyebrow">03 / Kernel</p><h2>Six objects. No ECG anatomy.</h2></div><p>The kernel knows how reasoning is recorded. It does not know what a P wave, lead, interval, or diagnosis means.</p></div><KernelMap /></div></section>

    <section className="section technical-surface rosx-boundary-section"><div className="shell"><div className="rosx-section-head"><div><p className="eyebrow">04 / Separation of concerns</p><h2>Meaning belongs to the plugin.</h2></div><p>A histology or radiology plugin should attach without teaching the kernel new medical vocabulary.</p></div><BoundaryDiagram /></div></section>

    <section className="section rosx-provenance"><div className="shell"><div className="rosx-section-head"><div><p className="eyebrow">05 / Epistemic discipline</p><h2>A number must disclose how it came to exist.</h2></div><p>The interface keeps the source, the witness, and the calculation separate. A cursor selection is never relabeled as gaze. A machine output never becomes a learner observation.</p></div><div className="rosx-ledger" role="table" aria-label="Provenance ledger example"><div className="rosx-ledger-head" role="row"><span role="columnheader">Value</span><span role="columnheader">Witness</span><span role="columnheader">Method</span><span role="columnheader">Status</span></div><div role="row"><strong role="cell">Two selected points</strong><span role="cell">Learner-derived</span><span role="cell">Explicit cursor selection</span><b role="cell">Observed input</b></div><div role="row"><strong role="cell">68 ms</strong><span role="cell">Application-calculated</span><span role="cell">Δx × calibrated scale</span><b role="cell">Derived value</b></div><div role="row"><strong role="cell">Sinus origin</strong><span role="cell">Learner claim</span><span role="cell">Required evidence absent</span><b role="cell" className="rejected">Rejected</b></div></div></div></section>

    <section className="section technical-surface rosx-trace-story"><div className="shell"><p className="eyebrow">06 / Synthetic reasoning trace</p><h2>Contradiction should change the model without erasing its history.</h2><div className="rosx-trace-graph"><article><span>STATE 01 · OBSERVED</span><strong>R–R intervals appear regular</strong><p>Direct visual observation from one synthetic lead.</p></article><i aria-hidden="true">→</i><article><span>STATE 02 · INFERRED</span><strong>Regular narrow-complex rhythm</strong><p>Provisional synthesis of admitted evidence.</p></article><i aria-hidden="true">→</i><article className="contradiction"><span>ATTEMPT 03 · REJECTED</span><strong>Sinus origin established</strong><p>P-wave relation has not been demonstrated.</p></article><i aria-hidden="true">↘</i><article className="revision"><span>STATE 03 · REVISED</span><strong>Origin remains unresolved</strong><p>The new state retains lineage to the earlier claim.</p></article></div><p className="diagram-caption">Synthetic educational example. It is not a patient interpretation or validated diagnostic workflow.</p></div></section>

    <section className="section rosx-state-model"><div className="shell"><div className="rosx-section-head"><div><p className="eyebrow">07 / Evidence states</p><h2>Uncertainty has an explicit place in the model.</h2></div><p>These labels describe the status of evidence in a trace. They are not diagnostic confidence scores.</p></div><div className="evidence-state-grid">{evidenceStates.map(([state, meaning], index) => <article key={state}><span>{String(index + 1).padStart(2, "0")}</span><h3>{state}</h3><p>{meaning}</p></article>)}</div></div></section>

    <section className="section lab-embed rosx-lab" id="laboratory" data-analytics-event="open_reasoning_trace"><div className="shell rosx-lab-intro"><div><p className="eyebrow">08 / Executable vertical slice</p><h2>Do not take the architecture on faith.</h2></div><p className="section-lede">Use the synthetic waveform. Record an inspection, select endpoints, calculate an interval, test a claim, and switch the trace between its human-readable and structured representations.</p></div><div className="reasonos-theme"><ReasonOSLab/></div></section>

    <section className="section rosx-spec" id="specification"><div className="shell"><div className="rosx-section-head"><div><p className="eyebrow">09 / Engineering record</p><h2>What the current implementation establishes.</h2></div><p>Implemented behavior, research hypotheses, and future clinical requirements remain separate.</p></div><div className="spec-grid"><article><span>ACCEPTS</span><h3>Inputs</h3><ul><li>Synthetic ECG coordinates</li><li>Manual calibration metadata</li><li>Learner observations and measurements</li><li>Versioned candidate paths</li></ul></article><article><span>EMITS</span><h3>Outputs</h3><ul><li>Immutable accepted states</li><li>Accepted and rejected events</li><li>Interval, axis, and QTc calculations</li><li>Candidate-path structural comparison</li></ul></article><article><span>ENFORCES</span><h3>Invariants</h3><ul><li>Referenced inputs exist</li><li>Writes remain append-only</li><li>Actor and provenance are present</li><li>Causal ancestry remains acyclic</li><li>Witness identity is preserved</li></ul></article><article><span>CAN FAIL</span><h3>Known failure modes</h3><ul><li>Incorrect manual calibration</li><li>Poor source quality</li><li>Incompatible paths combined</li><li>Candidate models mistaken for consensus</li><li>Single-lead evidence overinterpreted</li></ul></article></div></div></section>

    <section className="section clinical-boundary rosx-limitations"><div className="shell rosx-thesis-grid"><p className="eyebrow">10 / What remains unproven</p><div><h2>This system does not diagnose patients.</h2><p>Vector EKG is educational research software. It has no clinical validation, regulatory clearance, expert-trace reliability study, demonstrated learning benefit, or authorization for patient care.</p><p>Clinical use would require a defined intended use, expert-reviewed ontology, representative datasets, human-factors testing, prospective validation, security and privacy controls, regulatory analysis, and independent clinical governance.</p><Link className="text-link" href="/research">See the documented research record →</Link></div></div></section>
  </div>;
}
