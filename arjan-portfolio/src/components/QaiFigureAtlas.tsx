"use client";

import { useId, useState } from "react";

type FigureId = "levels" | "policy" | "orch" | "experiments";

const figures: { id: FigureId; number: string; label: string; status: string }[] = [
  { id: "levels", number: "01", label: "Levels of explanation", status: "Conceptual" },
  { id: "policy", number: "02", label: "Quantum policy space", status: "Theoretical" },
  { id: "orch", number: "03", label: "Orch OR mechanism", status: "Theoretical" },
  { id: "experiments", number: "04", label: "Decisive experiments", status: "Roadmap" },
];

function LevelsPlate() {
  const rows = [
    ["NORMATIVE", "What should be computed?", "Variational free-energy minimization", "Optimality principles"],
    ["PROCESS", "How is it computed?", "Neural message passing / population codes", "Algorithms and dynamics"],
    ["MECHANISTIC", "What is the physical substrate?", "Candidate physical implementation", "Biophysics and materials"],
  ];
  return <div className="qai-atlas-plate qai-atlas-levels">
    <div className="qai-atlas-plate-head"><strong>2. Levels of explanation</strong><span>From principle to implementation.</span></div>
    <div className="qai-atlas-level-stack">
      {rows.map((row,i)=><article key={row[0]} data-level={i}><div className="qai-atlas-level-icon">{["◎","⌘","◉"][i]}</div><div><h4>{row[0]}</h4><p>{row[1]}</p><strong>{row[2]}</strong></div><em>{row[3]}</em></article>)}
    </div>
    <p className="qai-atlas-foot">Quantum active inference concerns a proposed mechanistic implementation, not a requirement of active inference itself.</p>
  </div>;
}

function PolicyPlate() {
  return <div className="qai-atlas-plate qai-atlas-policy">
    <div className="qai-atlas-plate-head"><strong>3. Quantum policy space</strong><span>Counterfactual trajectories under a candidate quantum implementation.</span></div>
    <svg viewBox="0 0 900 420" role="img" aria-label="Alternative candidate policies branch from a present state into possible futures">
      <defs><filter id="atlasGlow"><feGaussianBlur stdDeviation="6"/></filter></defs>
      <text x="46" y="74" className="atlasSvgLabel">PRESENT STATE</text><circle cx="92" cy="196" r="20" className="atlasOrigin"/>
      {[0,1,2,3,4,5,6,7,8].map(i=><path key={i} d={`M112 196 C ${260+i*5} ${68+i*28}, ${500-i*7} ${82+i*26}, 716 ${82+i*32}`} className={`atlasPath atlasPath${i%3}`}/>) }
      {[0,1,2,3].map(i=><g key={i}><circle cx="770" cy={106+i*72} r="18" className={`atlasFuture atlasFuture${i}`}/><text x="808" y={112+i*72} className="atlasSvgSmall">π{i+1}</text></g>)}
      <line x1="44" y1="365" x2="850" y2="365" className="atlasAxis"/><text x="450" y="396" textAnchor="middle" className="atlasSvgSmall">possible future trajectories / conceptual</text>
    </svg>
    <p className="qai-atlas-foot">Paper I argues for a formal correspondence between integration over alternative futures and quantum path-integral dynamics. This remains a mechanistic proposal.</p>
  </div>;
}

function OrchPlate() {
  return <div className="qai-atlas-plate qai-atlas-orch">
    <div className="qai-atlas-plate-head"><strong>4. Orch OR candidate mechanism</strong><span>Candidate mechanism for discrete perceptual cycles.</span></div>
    <div className="qai-atlas-orch-grid">
      <div className="qai-atlas-neuron" aria-hidden="true"><span className="qai-atlas-soma"/><i/><i/><i/><i/><b>microtubule network<br/>in dendrites and soma</b></div>
      <div className="qai-atlas-microtubule" aria-hidden="true">{Array.from({length:42}).map((_,i)=><span key={i} data-alt={i%2}/>) }<svg viewBox="0 0 300 300"><path d="M38 218 C88 72 112 252 176 112 S238 180 264 72"/></svg></div>
      <div className="qai-atlas-orch-labels"><p><strong>Candidate tubulin state</strong><span>proposed quantum degree of freedom</span></p><p><strong>Coherent evolution</strong><span>theoretical</span></p><p><strong>Orchestration</strong><span>context-dependent dynamics</span></p><p><strong>Objective reduction</strong><span>hypothesized discrete update</span></p></div>
    </div>
    <div className="qai-atlas-cycle"><span>superposition</span><i>→</i><span>orchestration</span><i>→</i><span>reduction</span><i>→</i><span>conscious update</span></div>
    <p className="qai-atlas-foot">The entire plate is a conceptual rendering of the Orch OR hypothesis, not an experimental image or established account of consciousness.</p>
  </div>;
}

function ExperimentPlate() {
  const steps=["Measure a candidate quantum degree of freedom in living neural tissue.","Perturb it while preserving conventional microtubule function as far as possible.","Test prespecified conscious-state measures or tightly defined neural correlates.","Compare quantum and classical model predictions on intervention outcomes.","Replicate independently under preregistered conditions and negative controls."];
  return <div className="qai-atlas-plate qai-atlas-experiments"><div className="qai-atlas-plate-head"><strong>8. What would move the field</strong><span>A roadmap for discriminating experiments.</span></div><div className="qai-atlas-exp-list">{steps.map((step,i)=><article key={step}><span>{i+1}</span><p>{step}</p></article>)}</div><div className="qai-atlas-decision"><strong>Falsifiability</strong><p>A quantum account should earn explanatory status only if it predicts intervention outcomes that viable classical models do not, and those predictions replicate.</p></div></div>;
}

export function QaiFigureAtlas() {
  const [active,setActive]=useState<FigureId>("levels");
  const id=useId();
  return <section id="qai-atlas" className="qai-section qai-atlas" aria-labelledby={`${id}-title`}>
    <div className="shell qai-atlas-heading"><div><p className="qai-index">Visual appendix / Figure atlas</p><h2 id={`${id}-title`}>Selected figures, <em>without turning the page into a gallery.</em></h2></div><p>A restrained visual appendix for conceptual figures that survive the publication check. Experimental-result graphics stay native HTML/SVG so every label and number remains auditable.</p></div>
    <div className="shell qai-atlas-layout">
      <div className="qai-atlas-tabs" role="tablist" aria-label="Figure atlas">
        {figures.map(fig=><button key={fig.id} type="button" role="tab" aria-selected={active===fig.id} onClick={()=>setActive(fig.id)}><span>{fig.number}</span><b>{fig.label}</b><small>{fig.status}</small></button>)}
      </div>
      <div className="qai-atlas-stage" role="tabpanel">
        {active==="levels"&&<LevelsPlate/>}{active==="policy"&&<PolicyPlate/>}{active==="orch"&&<OrchPlate/>}{active==="experiments"&&<ExperimentPlate/>}
        <div className="qai-atlas-caption"><span>{figures.find(f=>f.id===active)?.status} diagram</span><p>{active==="levels"?"Normative, process, and mechanistic levels are kept distinct; the quantum proposal enters only at the mechanistic level.":active==="policy"?"A conceptual visualization of temporally deep policy evaluation, not a literal measurement of neural quantum trajectories.":active==="orch"?"A schematic of the candidate Orch OR mechanism. All quantum microtubule elements shown are theoretical.":"A falsifiability roadmap: the central requirement is a reproducible intervention effect that discriminates quantum from classical accounts."}</p></div>
      </div>
    </div>
  </section>;
}
