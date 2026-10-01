import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Belmont Motorsport Systems",
  description: "Belmont Abbey College coursework by Arjan Singh Puniani: a 16-item risk register, mitigation plan, and proposed emergency and medical operations annex.",
  alternates: { canonical: "/work/belmont-motorsport-systems" },
};

const riskDomains = [
  ["Heat + medical surge", "Prevent", "Capacity, monitoring, escalation, recovery"],
  ["High-energy crash", "Respond", "Scene control, rescue interface, handoff, record"],
  ["Fire + hazardous material", "Contain", "Isolation, specialist response, access control"],
  ["Weather + wildfire", "Coordinate", "Monitoring, common operating picture, decision record"],
  ["Security threat", "Protect", "Role separation, access, public information"],
  ["Communications + utility failure", "Continue", "Redundancy, read-back, time logging"],
] as const;

const owners = [
  ["Race Control", "Competition and course status", "Operational decision record"],
  ["Fire-rescue", "Hazard control and rescue interface", "Scene status"],
  ["Medical leadership", "Triage, clinical disposition, transport coordination", "Structured handoff"],
  ["Security + operations", "Access, perimeter, crowd and logistics continuity", "Resource status"],
  ["Public information", "Consistent public messaging", "Approved update"],
  ["Public agencies", "Authority defined by law and current plans", "Unified coordination"],
] as const;

const recoveryGates = ["People accounted for", "Immediate hazard controlled", "Course and containment checked", "Communications restored", "Medical/rescue coverage available", "Access and egress usable", "Required records preserved", "Decision to resume documented"];

export default function BelmontSystems() {
  return <div className="motorsport-case belmont-case">
    <header className="page-hero motorsport-hero">
      <div className="shell">
        <div className="status-row" aria-label="Project status"><span className="status">ACADEMIC SYSTEMS STUDY</span><span className="status">RISK-MANAGEMENT ANALYSIS</span><span className="status">COURSE-USE PROPOSAL</span></div>
        <p className="eyebrow">Belmont Abbey College coursework · 2026</p>
        <h1>Belmont motorsport systems</h1>
        <p>For Belmont Abbey College coursework, I wrote a 16-item risk analysis, mitigation plan, and proposed emergency and medical operations annex for a road-racing weekend at Sonoma Raceway.</p>
      </div>
    </header>

    <section className="section boundary-section-light" aria-labelledby="academic-boundary">
      <div className="shell case-intro">
        <p className="eyebrow">Status boundary</p>
        <div>
          <h2 id="academic-boundary">Coursework status</h2>
          <p>This was an academic, role-based proposal. It was not commissioned, reviewed, or approved by Sonoma Raceway, NASCAR, or a public agency.</p>
        </div>
      </div>
    </section>

    <section className="section" aria-labelledby="problem-heading">
      <div className="shell case-intro">
        <p className="eyebrow">Operational problem</p>
        <div><h2 id="problem-heading">Problem: coordinating event risks and response roles</h2><p>The coursework treated a major road-racing weekend as a coupled operating environment: competition, medical response, public safety, crowd movement, temporary systems, restricted access, and recovery all affect one another. The work connected ranked risks to controls, responsible roles, communication, and return-to-operations gates.</p></div>
      </div>
    </section>

    <section className="section technical-surface" aria-labelledby="system-model-heading">
      <div className="shell">
        <p className="eyebrow">System model</p>
        <h2 id="system-model-heading">Proposed response sequence</h2>
        <ol className="system-sequence system-sequence-dark" aria-label="Hazard leads to trigger, owner, response, communication, recovery condition, and record">
          {["Hazard", "Trigger", "Owner", "Response", "Communication", "Recovery condition", "Record"].map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></li>)}
        </ol>
        <p className="diagram-caption">Text equivalent: identify a hazard, define what changes its state, assign the responsible role, execute the response, close the communication loop, verify recovery conditions, and retain the decision record.</p>
      </div>
    </section>

    <section className="section" aria-labelledby="risk-register-heading">
      <div className="shell">
        <p className="eyebrow">Risk register</p>
        <div className="section-split-heading"><h2 id="risk-register-heading">Six risk domains in the 16-item register</h2><p>The underlying coursework ranked 16 event risks with consistent likelihood and impact criteria. The table groups those risks into six domains.</p></div>
        <div className="risk-register" role="table" aria-label="Risk domains, control posture, and system connection">
          <div role="row" className="risk-head"><span role="columnheader">Risk domain</span><span role="columnheader">Control posture</span><span role="columnheader">System connection</span></div>
          {riskDomains.map(([risk, posture, connection]) => <div role="row" key={risk}><strong role="cell">{risk}</strong><span role="cell">{posture}</span><span role="cell">{connection}</span></div>)}
        </div>
        <p className="diagram-caption dark-caption">The rankings are qualitative coursework judgments; they are not current venue risk estimates.</p>
      </div>
    </section>

    <section className="section evidence-surface" aria-labelledby="escalation-heading">
      <div className="shell">
        <p className="eyebrow">Escalation ladder</p>
        <h2 id="escalation-heading">Proposed incident classifications</h2>
        <div className="escalation-ladder">
          <article><span>01</span><h3>Minor</h3><p>Managed within a routine functional response, with the event recorded.</p></article>
          <article><span>02</span><h3>Serious</h3><p>Requires cross-functional coordination and a shared operating picture.</p></article>
          <article><span>03</span><h3>Major</h3><p>Requires broader command coordination and defers to lawful public-agency authority.</p></article>
        </div>
        <p className="diagram-caption dark-caption">These incident levels belong to the coursework proposal.</p>
      </div>
    </section>

    <section className="section" aria-labelledby="ownership-heading">
      <div className="shell">
        <p className="eyebrow">Decision ownership</p>
        <h2 id="ownership-heading">Proposed responsibilities and handoffs</h2>
        <div className="ownership-map" role="table" aria-label="Proposed role interfaces">
          <div role="row" className="ownership-head"><span role="columnheader">Role</span><span role="columnheader">Decision domain</span><span role="columnheader">Handoff artifact</span></div>
          {owners.map(([role, domain, output]) => <div role="row" key={role}><strong role="cell">{role}</strong><span role="cell">{domain}</span><span role="cell">{output}</span></div>)}
        </div>
        <p className="diagram-caption dark-caption">Roles proposed in the coursework.</p>
      </div>
    </section>

    <section className="section technical-surface" aria-labelledby="medical-handoff-heading">
      <div className="shell">
        <p className="eyebrow">Medical coordination</p>
        <h2 id="medical-handoff-heading">Proposed medical response and handoff sequence</h2>
        <ol className="handoff-flow" aria-label="Incident recognition leads to scene stabilization, medical access, triage, structured handoff, transport decision, and recovery reporting">
          {["Incident recognition", "Scene stabilization", "Medical access", "Triage", "Structured handoff", "Transport decision", "Recovery + reporting"].map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></li>)}
        </ol>
        <div className="communication-loop"><div><span>Send</span><strong>Plain-language message</strong></div><i aria-hidden="true">→</i><div><span>Receive</span><strong>Read-back</strong></div><i aria-hidden="true">→</i><div><span>Confirm</span><strong>Time log + shared state</strong></div></div>
        <p className="diagram-caption">The public abstraction omits frequencies, call signs, private contacts, treatment criteria, and proposed numeric thresholds.</p>
      </div>
    </section>

    <section className="section" aria-labelledby="recovery-heading">
      <div className="shell case-intro">
        <div><p className="eyebrow">Recovery gates</p><h2 id="recovery-heading">Conditions for resuming operations</h2></div>
        <div><p>The proposal requires checks on the course, communications, medical coverage, and access before resuming operations.</p><ul className="recovery-grid">{recoveryGates.map((gate) => <li key={gate}><span aria-hidden="true">◇</span>{gate}</li>)}</ul></div>
      </div>
    </section>

    <section className="section evidence-surface" aria-labelledby="risk-lens-heading">
      <div className="shell case-intro">
        <p className="eyebrow">Operational risk lens</p>
        <div><h2 id="risk-lens-heading">Limitations and operational requirements</h2><p>The course work also considered tort exposure, contracts and waivers, insurance and risk transfer, documentation, staff training, compliance, continuity, and reputational consequences. The analysis is coursework, not legal advice. Operational use would require current venue and sanctioning-body procedures, EMS and hospital agreements, credentialing, communications plans, and agency review.</p></div>
      </div>
    </section>

    <section className="section clinical-boundary">
      <div className="shell case-intro"><p className="eyebrow">Sources and related work</p><div><h2>Mechanism-to-Medical Center</h2><p>The source assignments are the Sonoma Raceway risk analysis, mitigation plan, and proposed emergency and medical operations annex. They are coursework records; no current venue procedures are published here.</p><p>The separate Version 0.2 pilot card records crash mechanism, occupant protection, and neurologic observations for transfer to medical staff.</p><Link className="text-link" href="/work/motorsport-neurotrauma-toolkit">Open the neurotrauma toolkit →</Link></div></div>
    </section>
  </div>;
}
