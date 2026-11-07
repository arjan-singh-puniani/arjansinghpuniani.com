import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ECGWorkspace } from "@/components/ECGWorkspace";
import { DigitalECGScene } from "@/components/DigitalECGScene";
import { ReferenceECGs } from "@/components/ReferenceECGs";
import { RecordedECG } from "@/components/RecordedECG";
import { RECORDINGS } from "@/lib/reasonos/recordings";
import { ReasonOSLab } from "@/components/ReasonOSLab";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Vector EKG and ReasonOS",
  description:
    "Practice systematic ECG interpretation on paired source photographs and four native digital reference recordings, with evidence-linked observations and feedback.",
  alternates: { canonical: "/work/vector-ekg-reasonos" },
  openGraph: {
    title: "Vector EKG and ReasonOS",
    description:
      "An educational ECG prototype that records measurements, calculations, rejected claims, and revisions.",
    url: `${siteUrl}/work/vector-ekg-reasonos`,
    type: "article",
  },
};

const kernelObjects = [
  ["01", "State", "What currently exists"],
  ["02", "Transformation", "An attempted change"],
  ["03", "Constraint", "A rule that admits or rejects"],
  ["04", "Trace", "The append-only record"],
  ["05", "Provenance", "Source, method, and lineage"],
  ["06", "Actor", "Who or what made the change"],
] as const;

const evidenceStates = [
  ["Observed", "Directly marked or measured from the source."],
  ["Inferred", "Derived from admitted observations under an explicit rule."],
  ["Contradicted", "Conflicts with another admitted finding."],
  ["Unresolved", "Available evidence remains insufficient or discordant."],
  ["Excluded", "A candidate explanation fails a required criterion."],
  [
    "Confirmed",
    "A defined review process supports the claim. Not used diagnostically here.",
  ],
] as const;

function TransitionDiagram() {
  return (
    <figure className="rosx-transition" aria-labelledby="transition-title">
      <div className="rosx-transition-source">
        <span>INPUT</span>
        <strong>State N</strong>
        <small>Observed evidence</small>
      </div>
      <i aria-hidden="true">→</i>
      <div className="rosx-transition-attempt">
        <span>ATTEMPT</span>
        <strong>Transformation</strong>
        <small>Actor + provenance</small>
      </div>
      <i aria-hidden="true">→</i>
      <div className="rosx-transition-gate">
        <span>EVALUATE</span>
        <strong>Constraints</strong>
        <small>Pure predicates</small>
      </div>
      <div className="rosx-transition-branches">
        <article>
          <span>ADMIT</span>
          <strong>State N+1</strong>
          <small>New immutable state</small>
        </article>
        <article>
          <span>REJECT</span>
          <strong>No new state</strong>
          <small>Attempt remains visible</small>
        </article>
      </div>
      <div className="rosx-trace-rail">
        <span>TRACE</span>
        <i />
        <i />
        <i className="rejected" />
        <i />
        <strong>Accepted and rejected events retained.</strong>
      </div>
      <figcaption id="transition-title">
        Both outcomes enter the trace. Only an admitted transformation adds a
        state.
      </figcaption>
    </figure>
  );
}

function KernelMap() {
  return (
    <div className="rosx-kernel-map">
      <div className="rosx-kernel-center">
        <span>KERNEL</span>
        <strong>Domain-independent</strong>
        <small>Independent of ECG vocabulary</small>
      </div>
      <div className="rosx-kernel-objects">
        {kernelObjects.map(([index, name, meaning]) => (
          <article key={name}>
            <span>{index}</span>
            <h3>{name}</h3>
            <p>{meaning}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function BoundaryDiagram() {
  return (
    <figure
      className="rosx-boundary"
      aria-label="ReasonOS kernel and Vector EKG plugin have separate responsibilities."
    >
      <div className="rosx-boundary-kernel">
        <p>REASONOS KERNEL / 0.3.0</p>
        <h3>Structure</h3>
        <ul>
          <li>Immutable states</li>
          <li>Attempted transformations</li>
          <li>Constraint results</li>
          <li>Replayable traces</li>
          <li>Actor and provenance</li>
        </ul>
      </div>
      <div className="rosx-boundary-interface">
        <span>typed plugin contract</span>
        <i aria-hidden="true">⇄</i>
        <small>versioned · deterministic</small>
      </div>
      <div className="rosx-boundary-plugin">
        <p>VECTOR EKG / 0.5.0 + laboratory extension</p>
        <h3>ECG calculations</h3>
        <ul>
          <li>Leads and coordinates</li>
          <li>Calibration</li>
          <li>Intervals and axis</li>
          <li>Candidate pathways</li>
          <li>ECG constraints</li>
        </ul>
      </div>
      <figcaption>
        The kernel evaluates structural validity. The plugin owns ECG vocabulary
        and domain rules.
      </figcaption>
    </figure>
  );
}

const pairedMachineOutput = RECORDINGS.map(({ id, report }) => [
  id,
  `${report.rate} bpm`,
  `${report.pr} ms`,
  `${report.qrs} ms`,
  `${report.qt} / ${report.qtc} ms`,
  report.axes.map((value) => `${value}°`).join(" / "),
]);

function PairedSourceCase() {
  return (
    <div className="rosx-paired-case">
      <div className="rosx-source-header">
        <div>
          <span>CASE ASP-001</span>
          <strong>Paired 12-lead source recording</strong>
        </div>
        <p>
          Self-contributed · de-identified derivative · waveform pixels
          preserved
        </p>
      </div>
      <div className="rosx-recording-grid">
        <figure>
          <div className="rosx-recording-label">
            <span>RECORDING A</span>
            <small>12 leads + long lead II</small>
          </div>
          <Image
            src="/images/reasonos/asp-001-recording-a.webp"
            alt="De-identified first 12-lead ECG source recording with a long lead II rhythm strip"
            width={2200}
            height={1180}
            sizes="(max-width: 800px) 100vw, 50vw"
          />
        </figure>
        <figure>
          <div className="rosx-recording-label">
            <span>RECORDING B</span>
            <small>12 leads + long lead II</small>
          </div>
          <Image
            src="/images/reasonos/asp-001-recording-b.webp"
            alt="De-identified second 12-lead ECG source recording with a long lead II rhythm strip"
            width={2110}
            height={1220}
            sizes="(max-width: 800px) 100vw, 50vw"
          />
        </figure>
      </div>
      <div
        className="rosx-machine-ledger"
        role="table"
        aria-label="Unconfirmed machine-generated measurements transcribed from the two source recordings"
      >
        <div className="rosx-machine-head" role="row">
          <span role="columnheader">Recording</span>
          <span role="columnheader">Rate</span>
          <span role="columnheader">PR</span>
          <span role="columnheader">QRS</span>
          <span role="columnheader">QT / QTc</span>
          <span role="columnheader">P / QRS / T axes</span>
        </div>
        {pairedMachineOutput.map((row) => (
          <div role="row" key={row[0]}>
            {row.map((value, index) =>
              index === 0 ? (
                <strong role="cell" key={value}>
                  {value}
                </strong>
              ) : (
                <span role="cell" key={value}>
                  {value}
                </span>
              ),
            )}
          </div>
        ))}
      </div>
      <div className="rosx-source-provenance">
        <span>MACHINE-DERIVED · UNCONFIRMED</span>
        <p>
          The values above are transcribed from the device report. They are
          comparison inputs, not adjudicated measurements or diagnostic truth.
        </p>
      </div>
    </div>
  );
}

const references = [
  {
    title: "Malmivuo & Plonsey · Bioelectromagnetism, chapter 15",
    url: "https://www.bem.fi/book/15/15.htm",
    scope:
      "Limb-lead definitions, ideal lead fields, Einthoven identity, and the distinction between algebraic lead relations and a spatial dipole approximation.",
  },
  {
    title: "AHA/ACCF/HRS · ECG technology (2007)",
    url: "https://doi.org/10.1161/CIRCULATIONAHA.106.180200",
    scope:
      "Acquisition, calibration, signal fidelity, and measurement definitions. Model fiducials here are prescribed rather than detected from a clinical recording.",
  },
  {
    title: "AHA/ACCF/HRS · ST, T, U waves and QT interval (2009)",
    url: "https://doi.org/10.1161/CIRCULATIONAHA.108.191096",
    scope:
      "QT measurement and the rate-dependent limitations of correction formulas. The laboratory shows Bazett and Fridericia as mathematical comparisons.",
  },
  {
    title: "AHA/ACCF/HRS · Intraventricular conduction disturbances (2009)",
    url: "https://doi.org/10.1161/CIRCULATIONAHA.108.191095",
    scope:
      "QRS duration terminology. The executable rule tests a bounded duration statement; it does not classify a rhythm or establish a patient diagnosis.",
  },
];

export default function VectorEkgReasonOSPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Vector EKG and ReasonOS",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    author: { "@type": "Person", name: "Arjan Singh Puniani", url: siteUrl },
    url: `${siteUrl}/work/vector-ekg-reasonos`,
    description:
      "Guided ECG interpretation, native 12-lead reference cases, calibrated calipers, source-linked observations, feedback, and replayable evidence.",
    isAccessibleForFree: true,
  };
  return (
    <div className="vector-case rosx-case rosx-scientific">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <header className="rosx-hero">
        <div className="shell">
          <p className="eyebrow">Vector EKG / ReasonOS</p>
          <h1>Measure an ECG interval</h1>
          <p className="vector-deck">Try a real recording. Measure the gap between two beats, then see what happens to your note when you revise the measurement.</p>
        </div>
      </header>
      <section className="lab-embed rosx-lab" id="ecg-workspace" aria-label="ECG evidence workspace">
        <ECGWorkspace />
      </section>
      <div className="shell rosx-study-links" id="signal-origin"><Link href="/work/vector-ekg-reasonos/signal">How an ECG forms →</Link></div>
      <details className="rosx-model-explanation rosx-study-details">
        <summary>Project background, other exercises and sources</summary>
      <details className="rosx-model-explanation" id="heart-leads">
        <summary>How the recording connects to heart activity and lead geometry</summary>
        <DigitalECGScene />
      </details>
      <details className="rosx-model-explanation" id="measurement-workbench">
        <summary>
          Independent calipers, interpretation worksheet, and reference cases
        </summary>
        <section
          className="lab-embed rosx-lab"
          id="laboratory"
          aria-label="Interactive ECG and reasoning laboratory"
        >
          <div className="reasonos-theme">
            <RecordedECG />
          </div>
        </section>
        <ReferenceECGs />
      </details>
      <details className="rosx-model-explanation" id="model-explanation">
        <summary>How a lead works · separate idealized vector model</summary>
        <div className="reasonos-theme">
          <ReasonOSLab />
        </div>
      </details>
      <section className="section rosx-source-case" id="source-case">
        <div className="shell">
          <div className="rosx-section-head">
            <div>
              <p className="eyebrow">Source comparison</p>
              <h2>Paired 12-lead recordings</h2>
            </div>
            <p>
              The original waveform images and transcribed device values are
              paired below. Measurements made above retain their own image
              coordinates, calibration, and source identity.
            </p>
          </div>
          <PairedSourceCase />
        </div>
      </section>
      <section
        className="section technical-surface rosx-runtime"
        id="architecture"
      >
        <div className="shell">
          <div className="rosx-section-head">
            <div>
              <p className="eyebrow">
                ReasonOS 0.3.0 · Vector EKG 0.5.0 + laboratory extension
              </p>
              <h2>What ReasonOS can establish</h2>
            </div>
            <p>
              The source-connected example tests a bounded QRS-duration
              statement. It preserves the pixels and assumptions behind a
              finding and rejects the unsupported jump from a short QRS to a
              normal ECG.
            </p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Evidence in this implementation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Can a reviewer reproduce the calculation?</td>
                  <td>
                    Source identity, ruler, raw endpoints, placement bound, and
                    accepted or rejected events are retained and replayed.
                  </td>
                </tr>
                <tr>
                  <td>Are the boundaries clinically correct?</td>
                  <td>
                    They are learner-selected. Reproducible arithmetic does not
                    adjudicate an onset, a baseline, or an interpretation.
                  </td>
                </tr>
                <tr>
                  <td>Does the rule establish a normal ECG?</td>
                  <td>
                    No. The connected workflow implements a duration-only rule.
                    Rhythm, morphology, ST–T findings and clinical context
                    require their own evidence.
                  </td>
                </tr>
                <tr>
                  <td>Does this improve clinical care?</td>
                  <td>
                    Not yet measured. The next test is a comparative
                    clinician-reader study of accuracy, omissions, time,
                    confidence and review burden.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            <a href="/reasonos/CLINICAL_EVALUATION.md">
              Read the concrete capability assessment and evaluation protocol
            </a>
            . It distinguishes software tests from clinical benefit and
            specifies the evidence needed to evaluate usefulness.
          </p>
          <details className="rosx-technical-detail">
            <summary>How the evidence engine records its decisions</summary>
            <TransitionDiagram />
          </details>
          <details className="rosx-technical-detail">
            <summary>Kernel objects and the ECG plugin boundary</summary>
            <KernelMap />
            <BoundaryDiagram />
            <p>
              Snapshots and their nested records are frozen. Input states must
              exist and precede their output; revision targets must be named
              inputs. Actor and witness types are checked. The example has no
              expert-authored observations or attention-tracking channel.
            </p>
          </details>
          <details className="rosx-technical-detail">
            <summary>Replay guarantees and evidence vocabulary</summary>
            <p>
              The supplied kernel verifies a SHA-256 event chain. Replay reruns
              the transformation rules and ECG plugin and compares the resulting
              event, identifiers, constraints, and state with the recorded
              event. The ECG plugin recomputes its verdict from recorded inputs.
              Medical observations still require independent review; the hash
              chain is not an authenticated signature or clinical validation.
            </p>
            <div className="evidence-state-grid">
              {evidenceStates.map(([name, meaning]) => (
                <article key={name}>
                  <h3>{name}</h3>
                  <p>{meaning}</p>
                </article>
              ))}
            </div>
            <p>
              The executable duration rule requires calibration for the current
              source, an admitted QRS measurement, ordered endpoints, and an
              uncertainty interval entirely below the stated cutoff. A source
              change invalidates reuse for the new source; it never rewrites the
              old record.
            </p>
          </details>
        </div>
      </section>
      <section className="section rosx-spec" id="model-references">
        <div className="shell">
          <div className="rosx-section-head">
            <div>
              <p className="eyebrow">Scientific model</p>
              <h2>Definitions and approximations</h2>
            </div>
            <p>
              Recorded-image measurements and report-derived calculations retain
              their source inputs. The expandable vector lesson uses a separate
              mathematical model of lead geometry.
            </p>
          </div>
          <div className="spec-grid">
            <article>
              <h3>Source</h3>
              <p>
                The primary workspace uses the contributed ECG photographs and
                values transcribed from their printed device reports. Calipers
                operate on the unchanged waveform pixels. The separate vector
                lesson generates its own P, QRS, and T components.
              </p>
            </article>
            <article>
              <h3>Geometry</h3>
              <p>
                The six limb leads use two scaled frontal signal coordinates and
                fixed lead fields. A real torso is neither an equilateral
                triangle nor a uniform conductor. Chest leads require additional
                measurements.
              </p>
            </article>
            <article>
              <h3>Measurement</h3>
              <p>
                Image calipers retain source-pixel coordinates. A local grid
                ruler supplies paper direction and pixels per millimetre. The
                recorded endpoint bound propagates through both interval
                placement and grid calibration. The model lesson uses its own
                declared SVG scale.
              </p>
            </article>
            <article>
              <h3>Inference</h3>
              <p>
                The domain rule evaluates a duration statement against recorded
                evidence. Path overlap is a weighted set comparison, not a
                diagnostic probability or an expert consensus score.
              </p>
            </article>
          </div>
          <p className="rosx-implementation-source">
            The browser kernel (0.3.0) and ECG plugin (0.5.0) are carried
            forward from the supplied ReasonOS master source. The laboratory
            adds the synchronized signal model, calibrated measurement display,
            and a bounded-duration rule.{" "}
            <a
              href="https://github.com/arjan-singh-puniani/arjansinghpuniani.com/blob/main/arjan-portfolio/Documentation/Validation/ReasonOS/source-provenance.json"
              target="_blank"
              rel="noreferrer"
            >
              Source checksums and adaptations
            </a>
          </p>
          <div className="rosx-reference-list">
            {references.map((reference) => (
              <article key={reference.url}>
                <a href={reference.url} target="_blank" rel="noreferrer">
                  {reference.title}
                </a>
                <p>{reference.scope}</p>
              </article>
            ))}
          </div>
          <details className="rosx-technical-detail">
            <summary>Scope and clinical-use status</summary>
            <p>
              This is educational research software with synthetic calculations
              and an independently contributed source case. Clinical validity,
              learning benefit, regulatory clearance, and authorization for
              patient care have not been established. The source images,
              simulated signals, learner observations, and application
              calculations retain distinct provenance.
            </p>
            <Link className="text-link" href="/research">
              Documented research record
            </Link>
          </details>
        </div>
      </section>
      </details>
    </div>
  );
}
