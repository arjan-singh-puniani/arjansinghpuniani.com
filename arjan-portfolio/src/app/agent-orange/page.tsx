import type { Metadata } from "next";
import { Experience } from "./Experience";
import "./agent-orange.css";

export const metadata: Metadata = {
  title: "Agent Orange: The Long Shadow",
  description: "An evidence-led exploration of Agent Orange, Parkinson disease, and the limits of observational research.",
  alternates: { canonical: "/agent-orange" },
};

const claims = [
  { id: "STUDY-01", claim: "The cohort included 4,468,509 US veterans who served during the Vietnam War era.", source: "Scott et al., JAMA Neurology, 2026", href: "https://doi.org/10.1001/jamaneurol.2026.4219", status: "Verified" },
  { id: "STUDY-02", claim: "Self-reported Agent Orange exposure was associated with Parkinson disease diagnosis (adjusted HR 1.44, 95% CI 1.37–1.52).", source: "Scott et al., JAMA Neurology, 2026", href: "https://doi.org/10.1001/jamaneurol.2026.4219", status: "Verified; observational association" },
  { id: "STUDY-03", claim: "A direct or occupational exposure subgroup had an adjusted HR of 1.99 (95% CI 1.71–2.32).", source: "Scott et al., JAMA Neurology, 2026", href: "https://doi.org/10.1001/jamaneurol.2026.4219", status: "Verified; subgroup estimate" },
  { id: "CHEM-01", claim: "Agent Orange was a formulation of 2,4-D and 2,4,5-T. TCDD was a contaminant associated with 2,4,5-T manufacture.", source: "US EPA; PubChem", href: "https://www.epa.gov/ingredients-used-pesticide-products/24-d", status: "Verified" },
  { id: "LIMIT-01", claim: "These veteran study estimates do not isolate 2,4-D or prove that exposure caused Parkinson disease.", source: "Study design and exposure definition", href: "https://jamanetwork.com/journals/jamaneurology/article-abstract/2856723", status: "Interpretive limitation" },
];

export default function AgentOrangePage() {
  return <div className="ao-page">
    <header className="ao-hero"><div className="ao-wrap"><p className="ao-eyebrow">A scientific evidence experience</p><h1>AGENT ORANGE:<br/><span>THE LONG SHADOW</span></h1><p className="ao-deck">Exposure, epidemiology, and the vulnerable dopaminergic neuron</p><p className="ao-intro">A new study of more than 4.4 million veterans reports an association between Agent Orange exposure and later Parkinson disease diagnosis. What the evidence shows matters as much as what it cannot tell us.</p><a className="ao-button" href="#evidence">Read the evidence <span aria-hidden="true">↓</span></a><span className="ao-index">01 / 04&nbsp;&nbsp; EVIDENCE · ANATOMY · LIMITS</span></div></header>
    <div className="ao-wrap"><Experience/></div>
    <section className="ao-study" id="evidence"><div className="ao-wrap ao-study-grid"><div><p className="ao-eyebrow">The veteran cohort · 2026</p><h2>An association<br/>with uncertainty.</h2><p>The electronic health record cohort included 4,468,509 veterans. Exposure was defined by self-report. The researchers adjusted for competing risk of death, age, traumatic brain injury, and frailty.</p><p>The hazard ratios compare rates over follow-up between exposure groups. They are not an individual’s absolute probability of developing Parkinson disease.</p></div><div className="ao-estimates"><article><span>ALL REPORTED EXPOSURE</span><strong>1.44</strong><p>Adjusted hazard ratio for Parkinson disease diagnosis</p><small>95% CI&nbsp; 1.37–1.52</small></article><article><span>DIRECT / OCCUPATIONAL SUBGROUP</span><strong>1.99</strong><p>Adjusted hazard ratio in subgroup analysis</p><small>95% CI&nbsp; 1.71–2.32</small></article></div></div></section>
    <section className="ao-science"><div className="ao-wrap ao-science-grid"><div><p className="ao-eyebrow">Molecular identity</p><h2>One name.<br/>Distinct chemicals.</h2><p>Agent Orange was a historical mixture of 2,4-D and 2,4,5-T. TCDD was a contaminant formed during 2,4,5-T manufacture. Modern use of 2,4-D is a separate exposure question and is not measured by the veteran cohort’s Agent Orange estimate.</p></div><div className="ao-chemicals"><a href="https://pubchem.ncbi.nlm.nih.gov/compound/1486"><span>01</span><strong>2,4-D</strong><small>PubChem CID 1486 · herbicide</small></a><a href="https://pubchem.ncbi.nlm.nih.gov/compound/1480"><span>02</span><strong>2,4,5-T</strong><small>PubChem CID 1480 · herbicide</small></a><a href="https://pubchem.ncbi.nlm.nih.gov/compound/15625"><span>03</span><strong>TCDD</strong><small>PubChem CID 15625 · contaminant</small></a></div></div></section>
    <section className="ao-evidence"><div className="ao-wrap"><p className="ao-eyebrow">Claim register</p><h2>What supports each statement</h2><div className="ao-claims">{claims.map(item=><article key={item.id}><small>{item.id} · {item.status}</small><p>{item.claim}</p><a href={item.href}>{item.source} ↗</a></article>)}</div><p className="ao-note">The 44-million-pound annual-use estimate and paraquat comparison in the supplied reference images are excluded pending verification against a current primary data source.</p></div></section>
    <footer className="ao-footer"><div className="ao-wrap"><span>AGENT ORANGE: THE LONG SHADOW</span><a href="https://jamanetwork.com/journals/jamaneurology/article-abstract/2856723">Read the primary study ↗</a><p>Educational visualization. Observational findings do not establish causation. The interactive model is schematic.</p></div></footer>
  </div>;
}
