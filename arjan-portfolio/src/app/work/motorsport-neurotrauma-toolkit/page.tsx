import type { Metadata } from "next";
import Link from "next/link";
import { statusNotes } from "@/content/statuses";

export const metadata: Metadata = {
  title: "Motorsport Neurotrauma Toolkit",
  description: "An exploratory documentation and escalation framework connecting crash mechanics with acute neurologic assessment.",
  alternates: { canonical: "/work/motorsport-neurotrauma-toolkit" },
};

const workflow = [
  ["Mechanism", "What happened to the vehicle and occupant?"],
  ["Protection context", "What safety system and post-impact context are observable?"],
  ["Neurologic observations", "What acute signs can the responder record without over-interpreting them?"],
  ["Escalation / disposition", "What needs licensed clinical judgment or a higher level of care?"],
  ["Structured handoff", "Which facts must remain attached to the person and event?"],
] as const;

const critique = [
  ["Terminology", "Could “red flag” be confused with on-track flag language?"],
  ["Workflow location", "Which fields belong at the scene, during transport, or in later review?"],
  ["Intended users", "Which observations are appropriate for each responder role?"],
  ["Reliability", "Which observation-only fields require clearer definitions or training?"],
  ["Authority", "Where do clinical disposition, Race Control, and series rules remain separate?"],
] as const;

export default function MotorsportNeurotraumaToolkit() {
  return <div className="motorsport-case neurotrauma-case">
    <header className="page-hero motorsport-hero">
      <div className="shell">
        <div className="status-row" aria-label="Project status">
          <span className="status">EXPLORATORY</span>
          <span className="status">VERSION 0.2 PILOT</span>
          <span className="status status-caution">{statusNotes.notClinicallyValidated}</span>
        </div>
        <p className="eyebrow">Motorsport neurotrauma · Documentation systems · 2026</p>
        <h1>Carry the crash mechanism into the medical handoff.</h1>
        <p>An exploratory documentation and escalation framework connecting crash mechanics with acute neurologic assessment.</p>
      </div>
    </header>

    <section className="section boundary-section-light" aria-labelledby="neurotrauma-boundary">
      <div className="shell case-intro">
        <p className="eyebrow">Clinical boundary</p>
        <div>
          <h2 id="neurotrauma-boundary">A documentation structure is not a clinical protocol.</h2>
          <p>This pilot is not a validated diagnostic instrument, sanctioning-body standard, or substitute for licensed clinical judgment. Feedback was requested and received; the work has not been validated, endorsed, adopted, or deployed.</p>
        </div>
      </div>
    </section>

    <section className="section" aria-labelledby="handoff-architecture">
      <div className="shell">
        <p className="eyebrow">Handoff architecture</p>
        <h2 id="handoff-architecture">Preserve context across a changing chain of custody.</h2>
        <ol className="system-sequence" aria-label="Crash mechanism leads to occupant-protection context, neurologic observations, escalation or disposition, and structured handoff">
          {workflow.map(([title, question], index) => <li key={title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{title}</strong>
            <p>{question}</p>
          </li>)}
        </ol>
        <p className="diagram-caption dark-caption">Text equivalent: record the crash mechanism first, add observable occupant-protection context, record acute neurologic observations, defer escalation and disposition to the responsible clinical workflow, and hand the structured record forward.</p>
      </div>
    </section>

    <section className="section technical-surface" aria-labelledby="separation-heading">
      <div className="shell">
        <p className="eyebrow">Decision separation</p>
        <h2 id="separation-heading">One record; different kinds of authority.</h2>
        <div className="decision-lanes">
          <article><span>OBSERVATION</span><h3>Responder record</h3><p>Mechanism, occupant context, visible signs, stated symptoms, time, and source.</p></article>
          <article><span>CLINICAL</span><h3>Medical disposition</h3><p>Assessment, treatment, transport, and return-to-activity decisions remain with qualified clinical personnel and applicable protocols.</p></article>
          <article><span>OPERATIONS</span><h3>Competition control</h3><p>Course status, vehicle recovery, and event operations remain separate from clinical judgment.</p></article>
        </div>
      </div>
    </section>

    <section className="section" aria-labelledby="feedback-heading">
      <div className="shell case-intro">
        <div><p className="eyebrow">Review record</p><h2 id="feedback-heading">Critique changed the questions.</h2></div>
        <div>
          <div className="review-state" aria-label="Feedback received; validation, endorsement, adoption, and deployment not established">
            <div><strong>Feedback</strong><span className="yes">Received</span></div>
            <div><strong>Validation</strong><span>No</span></div>
            <div><strong>Endorsement</strong><span>No</span></div>
            <div><strong>Adoption</strong><span>No</span></div>
            <div><strong>Deployment</strong><span>No</span></div>
          </div>
          <p>March 2026 correspondence documented expert critique. The public record reports the questions raised without naming private contacts or turning review into implied approval.</p>
        </div>
      </div>
      <div className="shell critique-grid">{critique.map(([title, question]) => <article key={title}><span>{title}</span><p>{question}</p></article>)}</div>
    </section>

    <section className="section evidence-surface" aria-labelledby="evidence-heading">
      <div className="shell">
        <p className="eyebrow">Evidence and limits</p>
        <h2 id="evidence-heading">What the record supports</h2>
        <div className="evidence-table" role="table" aria-label="Project evidence and limits">
          <div role="row" className="evidence-head"><span role="columnheader">Artifact</span><span role="columnheader">Supported statement</span><span role="columnheader">Does not establish</span></div>
          <div role="row"><strong role="cell">Version 0.2 pilot card</strong><span role="cell">A structured intake artifact exists.</span><span role="cell">Reliability, clinical utility, or field use.</span></div>
          <div role="row"><strong role="cell">Pilot disposition algorithm</strong><span role="cell">An escalation structure was drafted.</span><span role="cell">A validated protocol or standard of care.</span></div>
          <div role="row"><strong role="cell">March 2026 correspondence</strong><span role="cell">External critique was requested and received.</span><span role="cell">Consensus, endorsement, adoption, or deployment.</span></div>
        </div>
      </div>
    </section>

    <section className="section clinical-boundary">
      <div className="shell case-intro">
        <p className="eyebrow">Before operational use</p>
        <div>
          <h2>Reconcile the artifact with the system that holds authority.</h2>
          <p>Any operational version would require review against current venue procedures, sanctioning-body and series rules, EMS and hospital protocols, communications plans, credentialing, user training, privacy controls, and agency authority.</p>
          <Link className="text-link" href="/work/belmont-motorsport-systems">See the related emergency-operations study →</Link>
        </div>
      </div>
    </section>
  </div>;
}
