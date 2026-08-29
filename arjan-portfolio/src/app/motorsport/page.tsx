import type { Metadata } from "next";
import Link from "next/link";
import { ProcessFlow } from "@/components/SystemVisuals";

export const metadata: Metadata = {
  title: "Motorsport Medicine & Safety Systems",
  description: "Academic and exploratory work in motorsport neurotrauma, race emergency planning, operational risk, and trackside medical systems.",
  alternates: { canonical: "/motorsport" },
  openGraph: { title: "Motorsport medicine and safety systems", description: "Evidence-labeled work in crash neurotrauma, emergency operations, and motorsport risk management.", url: "/motorsport" },
};

const work = [
  { number: "01", label: "Crash & neurotrauma", title: "Mechanism-to-Medical Center", description: "An exploratory documentation framework connecting crash mechanics, occupant protection, acute neurologic red flags, and initial disposition.", status: "EXPLORATORY", href: "/work/motorsport-neurotrauma-toolkit" },
  { number: "02", label: "Emergency operations", title: "Emergency operations at Sonoma", description: "A role-based academic proposal for coordinating medical, rescue, race-control, security, operations, public-information, and external-agency interfaces.", status: "ACADEMIC STUDY", href: "/work/sonoma-emergency-operations" },
  { number: "03", label: "Risk & organizational systems", title: "Operational risk lens", description: "Belmont analyses connected qualitative risk ranking with prevention, mitigation, documentation, staffing, incident reporting, recovery, and continuity.", status: "ACADEMIC STUDY", href: "#risk-lens" },
  { number: "04", label: "Professional learning", title: "External review before authority", description: "ICMS correspondence documents medical-student membership and external critique of the pilot draft. It does not establish endorsement or field responsibility.", status: "DOCUMENTED", href: "#learning" },
];

export default function MotorsportPage() {
  return <>
    <header className="motorsport-hero"><div className="shell"><p className="overline"><span /> Motorsport</p><h1>Medicine under velocity,<br /><em>uncertainty,</em> and consequence.</h1><div className="motorsport-intro"><p>Arjan is studying how crash information, medical observations, command relationships, and operational constraints become coordinated decisions.</p><p className="provenance-note"><strong>Current evidence level</strong> Academic systems studies and exploratory tools. No trackside employment, clinical authority, sanctioning-body approval, or operational deployment is claimed.</p></div></div></header>

    <section className="section-rule motorsport-index"><div className="shell"><p className="section-index">Selected motorsport safety work</p>{work.map((item) => <article className="motorsport-row" key={item.number}><span className="motorsport-number">{item.number}</span><div><p>{item.label}</p><h2>{item.title}</h2></div><div><p>{item.description}</p><span className="status">{item.status}</span><Link href={item.href}>Examine the work ↗</Link></div></article>)}</div></section>

    <section className="section-rule systems-bridge"><div className="shell"><div className="editorial-head"><div><p className="section-index">Shared architecture</p><h2>Different signals. The same obligation to reason carefully.</h2></div><p>A useful system preserves the evidence path from observation to action—and keeps the feedback needed to revise the next decision.</p></div><div className="bridge-grid"><article><span>BCI</span><p>Neural signal → psychophysical inference → interface adaptation</p></article><article><span>Reasoning systems</span><p>Observation → hypotheses → evidence → revision</p></article><article><span>Motorsport medicine</span><p>Crash mechanism → clinical observations → escalation → disposition</p></article><article><span>Emergency operations</span><p>Hazard → classification → coordinated response → recovery</p></article></div></div></section>

    <section id="risk-lens" className="section-rule risk-lens"><div className="shell split-intro"><div><p className="section-index">Operational risk lens</p><h2>Medicine sits inside an organization.</h2></div><div><p>Three Belmont assignments treated risk as a control system. A 16-item qualitative register ranked heat illness as critical and identified schedule disruption, fatigue and handoff failure, cross-series communications, technology failure, delayed medical transfer, fire, and pit-road injury among the high risks. Follow-on work mapped priority risks to prevention, corrective action, accountable roles, review timing, and recovery gates.</p><ProcessFlow label="Risk-control sequence evidenced in coursework" steps={[{label:"Identify",note:"define exposure and affected stakeholders"},{label:"Rank",note:"likelihood × impact as a planning tool"},{label:"Prevent",note:"staffing, access, communications, training"},{label:"Respond",note:"triggers, authority, and corrective action"},{label:"Recover",note:"positive checks before resumption"},{label:"Learn",note:"logs, hotwash, after-action correction"}]} /><p className="source-line">Academic synthesis of MM 685 Assignments 3, 4, and 6. The scores are qualitative planning judgments—not actuarial estimates, legal advice, or operational findings.</p></div></div></section>

    <section id="learning" className="section-rule direction-section"><div className="shell trajectory-grid"><p className="section-index">Current direction</p><h2>From study<br />to accountable practice.</h2><div><p>ICMS correspondence documents Arjan as a medical-student member and records external critique of the neurotrauma draft. The next steps remain conservative: revise against feedback, compare with current protocols, test through simulation, and learn under supervision before claiming operational readiness.</p><ul className="direction-list"><li>Trackside medicine</li><li>Motorsport neurotrauma</li><li>Human performance</li><li>Emergency systems</li></ul><Link className="button button-ivory" href="/contact">Discuss the work ↗</Link></div></div></section>
  </>;
}
