import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Belmont Motorsport Systems",
  description: "An academic systems study of risk, mitigation, emergency operations, medical coordination, and recovery under race-day constraints.",
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
        <h1>Planning under race-day constraints.</h1>
        <p>An academic study of how risk information becomes mitigation, decision ownership, medical coordination, communication, recovery conditions, and an accountable record.</p>
      </div>
    </header>

    <section className="section boundary-section-light" aria-labelledby="academic-boundary">
      <div className="shell case-intro">
        <p className="eyebrow">Status boundary</p>
        <div>
          <h2 id="academic-boundary">Academic analysis, not an operating plan.</h2>
          <p>This was an academic, role-based proposal. It was not commissioned, reviewed, or approved by Sonoma Raceway, NASCAR, or a public agency.</p>
          <p>Operational use would require reconciliation with current venue procedures, sanctioning-body rules, EMS protocols, hospital procedures, communications plans, credentialing, and agency authority.</p>
        </div>
      </div>
    </section>

    <section className="section" aria-labelledby="problem-heading">
      <div className="shell case-intro">
        <p className="eyebrow">Operational problem</p>
        <div><h2 id="problem-heading">A risk matrix matters only when it changes an owned decision.</h2><p>The coursework treated a major road-racing weekend as a coupled operating environment: competition, medical response, public safety, crowd movement, temporary systems, restricted access, and recovery all affect one another. The work connected ranked risks to controls, responsible roles, communication, and return-to-operations gates.</p></div>
      </div>
    </section>

    <section className="section technical-surface" aria-labelledby="system-model-heading">
      <div className="shell">
        <p className="eyebrow">System model</p>
        <h2 id="system-model-heading">From hazard to accountable record</h2>
        <ol className="system-sequence system-sequence-dark" aria-label="Hazard leads to trigger, owner, response, communication, recovery condition, and record">
          {["Hazard", "Trigger", "Owner", "Response", "Communication", "Recovery condition", "Record"].map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></li>)}
        </ol>
        <p className="diagram-caption">Text equivalent: identify a hazard, define what changes its state, assign the responsible role, execute the response, close the communication loop, verify recovery conditions, and retain the decision record.</p>
      </div>
    </section>

    <section className="section" aria-labelledby="risk-register-heading">
      <div className="shell">
        <p className="eyebrow">Risk register</p>
        <div className="section-split-heading"><h2 id="risk-register-heading">Six coupled domains within a 16-item analysis.</h2><p>The underlying coursework ranked 16 event risks with consistent likelihood and impact criteria. This public view groups the strongest operational themes without publishing unsupported current thresholds.</p></div>
        <div className="risk-register" role="table" aria-label="Risk domains, control posture, and system connection">
          <div role="row" className="risk-head"><span role="columnheader">Risk domain</span><span role="columnheader">Control posture</span><span role="columnheader">System connection</span></div>
          {riskDomains.map(([risk, posture, connection]) => <div role="row" key={risk}><strong role="cell">{risk}</strong><span role="cell">{posture}</span><span role="cell">{connection}</span></div>)}
        </div>
        <p className="diagram-caption dark-caption">Qualitative academic planning judgments—not actuarial predictions, venue findings, or current operating thresholds.</p>
      </div>
    </section>

    <section className="section evidence-surface" aria-labelledby="escalation-heading">
      <div className="shell">
        <p className="eyebrow">Escalation ladder</p>
        <h2 id="escalation-heading">Escalate by consequence and coordination need.</h2>
        <div className="escalation-ladder">
          <article><span>01</span><h3>Minor</h3><p>Managed within a routine functional response, with the event recorded.</p></article>
          <article><span>02</span><h3>Serious</h3><p>Requires cross-functional coordination and a shared operating picture.</p></article>
          <article><span>03</span><h3>Major</h3><p>Requires broader command coordination and defers to lawful public-agency authority.</p></article>
        </div>
        <p className="diagram-caption dark-caption">These are course-use classifications. They are not Sonoma Raceway, NASCAR, or public-agency incident levels, and no numeric operating thresholds are asserted.</p>
      </div>
    </section>

    <section className="section" aria-labelledby="ownership-heading">
      <div className="shell">
        <p className="eyebrow">Decision ownership</p>
        <h2 id="ownership-heading">Separate roles; explicit interfaces.</h2>
        <div className="ownership-map" role="table" aria-label="Proposed role interfaces">
          <div role="row" className="ownership-head"><span role="columnheader">Role</span><span role="columnheader">Decision domain</span><span role="columnheader">Handoff artifact</span></div>
          {owners.map(([role, domain, output]) => <div role="row" key={role}><strong role="cell">{role}</strong><span role="cell">{domain}</span><span role="cell">{output}</span></div>)}
        </div>
        <p className="diagram-caption dark-caption">Portfolio abstraction of the academic proposal, not a staffing chart, credential, or grant of authority.</p>
      </div>
    </section>

    <section className="section technical-surface" aria-labelledby="medical-handoff-heading">
      <div className="shell">
        <p className="eyebrow">Medical coordination</p>
        <h2 id="medical-handoff-heading">The handoff is a controlled transition.</h2>
        <ol className="handoff-flow" aria-label="Incident recognition leads to scene stabilization, medical access, triage, structured handoff, transport decision, and recovery reporting">
          {["Incident recognition", "Scene stabilization", "Medical access", "Triage", "Structured handoff", "Transport decision", "Recovery + reporting"].map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></li>)}
        </ol>
        <div className="communication-loop"><div><span>Send</span><strong>Plain-language message</strong></div><i aria-hidden="true">→</i><div><span>Receive</span><strong>Read-back</strong></div><i aria-hidden="true">→</i><div><span>Confirm</span><strong>Time log + shared state</strong></div></div>
        <p className="diagram-caption">The public abstraction omits frequencies, call signs, private contacts, treatment criteria, and proposed numeric thresholds.</p>
      </div>
    </section>

    <section className="section" aria-labelledby="recovery-heading">
      <div className="shell case-intro">
        <div><p className="eyebrow">Recovery gates</p><h2 id="recovery-heading">Hazard control is necessary, not sufficient.</h2></div>
        <div><p>Return to operations was modeled as a positive decision that requires multiple conditions, not simply the absence of an active incident.</p><ul className="recovery-grid">{recoveryGates.map((gate) => <li key={gate}><span aria-hidden="true">◇</span>{gate}</li>)}</ul></div>
      </div>
    </section>

    <section className="section evidence-surface" aria-labelledby="risk-lens-heading">
      <div className="shell case-intro">
        <p className="eyebrow">Operational risk lens</p>
        <div><h2 id="risk-lens-heading">Safety decisions sit inside organizational constraints.</h2><p>The course work also considered tort exposure, contracts and waivers, insurance and risk transfer, documentation, staff training, compliance, continuity, and reputational consequences. This is a risk-management lens, not legal advice or a claim of legal expertise.</p></div>
      </div>
    </section>

    <section className="section clinical-boundary">
      <div className="shell case-intro"><p className="eyebrow">Related work</p><div><h2>Mechanism-to-Medical Center</h2><p>The separate exploratory toolkit asks how crash mechanism, occupant protection, neurologic observations, escalation, and handoff can remain connected without collapsing clinical and operational authority.</p><Link className="text-link" href="/work/motorsport-neurotrauma-toolkit">Open the neurotrauma toolkit →</Link></div></div>
    </section>
  </div>;
}
