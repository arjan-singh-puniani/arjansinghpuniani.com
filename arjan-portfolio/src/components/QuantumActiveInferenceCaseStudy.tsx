import Link from "next/link";
import { publications } from "@/content/publications";
import { QaiFigureAtlas } from "@/components/QaiFigureAtlas";

const DOI = {
  tegmark: "https://doi.org/10.1103/PhysRevE.61.4194",
  hagan: "https://doi.org/10.1103/PhysRevE.65.061901",
  ma: "https://doi.org/10.1038/nn1790",
  friston2006: "https://doi.org/10.1016/j.jphysparis.2006.10.001",
  friston2017: "https://doi.org/10.1162/NECO_a_00912",
  friston2018: "https://doi.org/10.3389/fpsyg.2018.00579",
  parr2022: "https://mitpress.mit.edu/9780262045353/active-inference/",
  kerskens: "https://doi.org/10.1088/2399-6528/ac94be",
  warren: "https://doi.org/10.1088/2399-6528/acc4a8",
  kerskensReply: "https://doi.org/10.1088/2399-6528/acc636",
  khan: "https://doi.org/10.1523/ENEURO.0291-24.2024",
  wiest2025: "https://doi.org/10.1093/nc/niaf011",
  paperI: "https://doi.org/10.1016/j.csbj.2025.09.017",
  paperII: "https://doi.org/10.1016/j.csbj.2025.09.016",
  corrigendum: "https://doi.org/10.1016/j.csbj.2025.10.016",
  huang: "https://doi.org/10.1016/j.neuropharm.2026.110834",
  quantumBiology: "https://doi.org/10.1038/nphys2474",
  microtubules: "https://doi.org/10.1101/cshperspect.a022608",
  anesthetics: "https://doi.org/10.1016/j.tips.2019.05.001",
};

const references = [
  { id: 1, citation: "Tegmark M. Importance of quantum decoherence in brain processes. Physical Review E. 2000;61:4194.", href: DOI.tegmark },
  { id: 2, citation: "Hagan S, Hameroff SR, Tuszyński JA. Quantum computation in brain microtubules: Decoherence and biological feasibility. Physical Review E. 2002;65:061901.", href: DOI.hagan },
  { id: 3, citation: "Ma WJ, Beck JM, Latham PE, Pouget A. Bayesian inference with probabilistic population codes. Nature Neuroscience. 2006;9:1432–1438.", href: DOI.ma },
  { id: 4, citation: "Friston K, Kilner J, Harrison L. A free energy principle for the brain. Journal of Physiology-Paris. 2006;100:70–87.", href: DOI.friston2006 },
  { id: 5, citation: "Friston K, FitzGerald T, Rigoli F, Schwartenbeck P, Pezzulo G. Active Inference: A Process Theory. Neural Computation. 2017;29:1–49.", href: DOI.friston2017 },
  { id: 6, citation: "Friston K. Am I Self-Conscious? (Or Does Self-Organization Entail Self-Consciousness?). Frontiers in Psychology. 2018;9:579.", href: DOI.friston2018 },
  { id: 7, citation: "Parr T, Pezzulo G, Friston KJ. Active Inference: The Free Energy Principle in Mind, Brain, and Behavior. MIT Press; 2022.", href: DOI.parr2022 },
  { id: 8, citation: "Kerskens CM, López Pérez D. Experimental indications of non-classical brain functions. Journal of Physics Communications. 2022;6:105001.", href: DOI.kerskens },
  { id: 9, citation: "Warren WS. Comment on: Experimental indications of non-classical brain function. Journal of Physics Communications. 2023;7:038001.", href: DOI.warren },
  { id: 10, citation: "Kerskens CM, López Pérez D. Reply to Comment on: Experimental indications of non-classical brain function. Journal of Physics Communications. 2023;7:038002.", href: DOI.kerskensReply },
  { id: 11, citation: "Khan S et al. Microtubule-Stabilizer Epothilone B Delays Anesthetic-Induced Unconsciousness in Rats. eNeuro. 2024;11(8).", href: DOI.khan },
  { id: 12, citation: "Wiest MC. A quantum microtubule substrate of consciousness is experimentally supported and solves the binding and epiphenomenalism problems. Neuroscience of Consciousness. 2025;2025(1):niaf011.", href: DOI.wiest2025 },
  { id: 13, citation: "Wiest MC, Puniani AS. Conscious active inference I: A quantum model naturally implements the path integral needed for real-time planning and control. Computational and Structural Biotechnology Journal. 2025;30:108–121.", href: DOI.paperI },
  { id: 14, citation: "Wiest MC, Puniani AS. Conscious active inference II: Quantum orchestrated objective reduction among intraneuronal microtubules naturally accounts for discrete perceptual cycles. Computational and Structural Biotechnology Journal. 2025;30:94–107.", href: DOI.paperII },
  { id: 15, citation: "Corrigendum to Conscious active inference II. Computational and Structural Biotechnology Journal. 2025.", href: DOI.corrigendum },
  { id: 16, citation: "Huang Y et al. Brain-penetrant microtubule-stabilizer epothilone B delays isoflurane-induced unconsciousness in mice. Neuropharmacology. 2026;287:110834.", href: DOI.huang },
  { id: 17, citation: "Lambert N et al. Quantum biology. Nature Physics. 2013;9:10–18.", href: DOI.quantumBiology },
  { id: 18, citation: "Goodson HV, Jonasson EM. Microtubules and Microtubule-Associated Proteins. Cold Spring Harbor Perspectives in Biology. 2018;10:a022608.", href: DOI.microtubules },
  { id: 19, citation: "Hemmings HC Jr et al. Towards a Comprehensive Understanding of Anesthetic Mechanisms of Action: A Decade of Discovery. Trends in Pharmacological Sciences. 2019;40:464–481.", href: DOI.anesthetics },
];

const evidenceGroups = [
  {
    label: "Established",
    title: "Frameworks and biology",
    items: [
      "Active inference provides a formal framework for perception, action, learning, and planning.",
      "Neuronal population activity can encode probability distributions and support approximate Bayesian computations.",
      "Quantum coherence can occur in some biological or biomolecular systems under specific physical conditions; that fact alone does not imply quantum consciousness.",
      "Microtubules are intracellular cytoskeletal structures with established structural, transport, and signaling roles.",
      "Volatile anesthetics act through multiple molecular and circuit-level targets.",
    ],
    refs: "Refs 3–7, 17–19",
  },
  {
    label: "Empirically relevant",
    title: "Perturbation results",
    items: [
      "Epothilone B delayed isoflurane-induced loss of righting reflex in a 2024 rat experiment.",
      "A 2026 mouse study reproduced the direction of the microtubule-stabilization effect.",
      "These results support a functional microtubule contribution to anesthetic action without identifying that contribution as quantum mechanical.",
    ],
    refs: "Refs 11, 16",
  },
  {
    label: "Contested",
    title: "Physical interpretation",
    items: [
      "Whether the 2022 MRI result warrants an entanglement or non-classical-mediator interpretation remains disputed.",
      "Whether biologically relevant microtubule states preserve quantum coherence for the required duration remains unresolved.",
      "Classical molecular explanations remain viable for the anesthetic perturbation results.",
    ],
    refs: "Refs 1–2, 8–10",
  },
  {
    label: "Theoretical",
    title: "Mechanistic proposal",
    items: [
      "Orchestrated objective reduction as a generator of conscious moments.",
      "Collective microtubule quantum states as a substrate of consciousness.",
      "Quantum path-integral dynamics as the physical implementation of temporally deep active inference.",
    ],
    refs: "Refs 12–15",
  },
];

const experiments = [
  "Directly measure a candidate microtubule quantum degree of freedom in living neural tissue at a behaviorally relevant timescale.",
  "Perturb that degree of freedom while preserving conventional microtubule structure and transport as far as experimentally possible.",
  "Demonstrate a reproducible change in a prespecified conscious-state measure or tightly defined neural correlate.",
  "Show that a quantum model predicts the intervention effect better than competing classical molecular and dynamical models.",
  "Replicate the result independently under preregistered conditions with explicit negative controls.",
];

function ReferenceLink({ href, children, label }: { href: string; children: React.ReactNode; label: string }) {
  return <a className="qai-ref-link" href={href} target="_blank" rel="noreferrer" aria-label={label}>{children}</a>;
}

function TheoryLevelDiagram() {
  const levels = [
    { code: "N", label: "Normative", title: "Active inference", body: "What beliefs and policies minimize variational free energy?", note: "Computational objective" },
    { code: "P", label: "Process", title: "Neural message passing", body: "How could populations encode states, prediction errors, policies, and precision?", note: "Algorithmic mapping" },
    { code: "M", label: "Mechanistic", title: "Biophysics", body: "What physical dynamics actually perform the required computation?", note: "Physical implementation" },
  ];

  return <figure className="qai-level-figure">
    <div className="qai-figure-label">Conceptual diagram</div>
    <div className="qai-levels">
      {levels.map((level, index) => <div className="qai-level-wrap" key={level.code}>
        <article className="qai-level-card">
          <span className="qai-level-code" aria-hidden="true">{level.code}</span>
          <p>{level.label}</p>
          <h3>{level.title}</h3>
          <div>{level.body}</div>
          <small>{level.note}</small>
        </article>
        {index < levels.length - 1 && <div className="qai-level-arrow" aria-hidden="true"><span>↓</span></div>}
      </div>)}
    </div>
    <figcaption>Active inference does not require quantum mechanics at the normative level. The research question begins at the mechanistic level: what physical dynamics could implement temporally deep inference?</figcaption>
  </figure>;
}

function TimescaleFigure() {
  const ticks = [-20, -16, -12, -8, -4, -1];
  const xFor = (exponent: number) => 70 + ((exponent + 20) / 19) * 760;
  const tegmarkStart = xFor(-20);
  const tegmarkEnd = xFor(-13);
  const haganStart = xFor(-5);
  const haganEnd = xFor(-4);
  const neuralStart = xFor(-3);
  const neuralEnd = xFor(-1);

  return <figure className="qai-timescale">
    <div className="qai-figure-label">Model comparison · logarithmic time axis</div>
    <svg viewBox="0 0 900 350" role="img" aria-labelledby="qai-timescale-title qai-timescale-desc">
      <title id="qai-timescale-title">Comparison of modeled quantum decoherence and neural timescales</title>
      <desc id="qai-timescale-desc">A logarithmic axis from ten to the minus twenty seconds to ten to the minus one seconds. Tegmark&apos;s modeled range occupies ten to the minus twenty through ten to the minus thirteen seconds. Hagan and colleagues&apos; recalculation lies near ten to the minus five through ten to the minus four seconds, with longer values under additional assumptions. Neural and cognitive dynamics occupy approximately ten to the minus three through ten to the minus one seconds.</desc>
      <line x1="70" y1="280" x2="830" y2="280" className="qai-axis" />
      {ticks.map((tick) => <g key={tick}>
        <line x1={xFor(tick)} y1="273" x2={xFor(tick)} y2="287" className="qai-tick" />
        <text x={xFor(tick)} y="310" textAnchor="middle" className="qai-tick-label">10^{tick}</text>
      </g>)}
      <text x="830" y="335" textAnchor="end" className="qai-axis-label">seconds →</text>

      <text x="70" y="48" className="qai-band-title">TEGMARK / 2000</text>
      <rect x={tegmarkStart} y="62" width={tegmarkEnd - tegmarkStart} height="34" rx="4" className="qai-band qai-band-tegmark" />
      <text x={tegmarkStart + 10} y="84" className="qai-band-label">10⁻²⁰–10⁻¹³ s</text>
      <text x="70" y="116" className="qai-band-note">modeled environmental decoherence</text>

      <text x="70" y="158" className="qai-band-title">HAGAN ET AL. / 2002</text>
      <rect x={haganStart} y="172" width={Math.max(38, haganEnd - haganStart)} height="34" rx="4" className="qai-band qai-band-hagan" />
      <line x1={xFor(-4)} y1="189" x2={xFor(-1)} y2="189" className="qai-hagan-extension" />
      <circle cx={xFor(-1)} cy="189" r="4" className="qai-hagan-dot" />
      <text x={haganStart - 6} y="228" className="qai-band-note">recalculation; longer values depend on additional assumptions</text>

      <text x={neuralStart} y="248" textAnchor="end" className="qai-band-title">NEURAL / COGNITIVE</text>
      <rect x={neuralStart} y="258" width={neuralEnd - neuralStart} height="18" rx="4" className="qai-band qai-band-neural" />
    </svg>
    <div className="qai-timescale-mobile" aria-label="Mobile summary of modeled timescales">
      <article><span>Tegmark / 2000</span><strong>10<sup>−20</sup>–10<sup>−13</sup> s</strong><p>Modeled decoherence for the candidate neural superpositions he analyzed.</p></article>
      <article><span>Hagan et al. / 2002</span><strong>≈10<sup>−5</sup>–10<sup>−4</sup> s</strong><p>Recalculation for a different proposed microtubule superposition. Longer values require further model assumptions.</p></article>
      <article><span>Neural / cognitive</span><strong>≈10<sup>−3</sup>–10<sup>−1</sup> s</strong><p>Reference range used to frame the biological timing problem.</p></article>
    </div>
    <figcaption>The numerical gap depends on the physical model being evaluated. Tegmark and Hagan et al. modeled different candidate superpositions and reached very different estimates. These are calculations, not direct measurements of coherence in living neurons. <ReferenceLink href={DOI.tegmark} label="Open Tegmark 2000 source">[1]</ReferenceLink> <ReferenceLink href={DOI.hagan} label="Open Hagan et al. 2002 source">[2]</ReferenceLink></figcaption>
  </figure>;
}

function PolicyFigure() {
  return <figure className="qai-policy-figure">
    <div className="qai-figure-label">Conceptual diagram</div>
    <svg viewBox="0 0 1080 500" role="img" aria-labelledby="qai-policy-title qai-policy-desc">
      <title id="qai-policy-title">Temporally deep active inference and alternative policies</title>
      <desc id="qai-policy-desc">Observed outcomes lead to inferred hidden states. From the current state, multiple candidate policies branch into alternative expected futures, illustrating the computational problem discussed in the two companion reviews.</desc>
      <defs>
        <marker id="qai-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" className="qai-arrow-head" />
        </marker>
      </defs>
      <text x="70" y="54" className="qai-svg-overline">OBSERVATIONS</text>
      {[0,1,2,3].map((i) => <g key={`o-${i}`}>
        <circle cx={88 + i * 70} cy="112" r="15" className="qai-node qai-node-observation" />
        <text x={88 + i * 70} y="118" textAnchor="middle" className="qai-node-text">o{i + 1}</text>
        {i < 3 && <line x1={104 + i * 70} y1="112" x2={142 + i * 70} y2="112" className="qai-flow-line" />}
      </g>)}
      <path d="M 330 112 C 370 112, 400 112, 438 112" className="qai-flow-line qai-flow-arrow" markerEnd="url(#qai-arrow)" />

      <text x="450" y="54" className="qai-svg-overline">HIDDEN STATES</text>
      {[0,1,2].map((i) => <g key={`s-${i}`}>
        <rect x={450 + i * 80} y="94" width="48" height="36" rx="18" className="qai-node-state" />
        <text x={474 + i * 80} y="118" textAnchor="middle" className="qai-node-text-dark">s{i + 1}</text>
      </g>)}
      <line x1="498" y1="112" x2="530" y2="112" className="qai-flow-line" />
      <line x1="578" y1="112" x2="610" y2="112" className="qai-flow-line" />
      <path d="M 660 112 C 730 112, 730 210, 780 210" className="qai-flow-line qai-flow-arrow" markerEnd="url(#qai-arrow)" />

      <text x="690" y="54" className="qai-svg-overline">CANDIDATE POLICIES</text>
      <circle cx="780" cy="210" r="17" className="qai-branch-origin" />
      <text x="780" y="216" textAnchor="middle" className="qai-node-text">π</text>
      <path d="M 798 204 C 860 160, 910 120, 1000 105" className="qai-trajectory qai-trajectory-a" />
      <path d="M 798 210 C 875 210, 920 210, 1000 210" className="qai-trajectory qai-trajectory-b" />
      <path d="M 798 216 C 860 260, 910 300, 1000 315" className="qai-trajectory qai-trajectory-c" />
      <circle cx="1000" cy="105" r="12" className="qai-future-node" />
      <circle cx="1000" cy="210" r="12" className="qai-future-node" />
      <circle cx="1000" cy="315" r="12" className="qai-future-node" />
      <text x="1000" y="83" textAnchor="middle" className="qai-policy-label">π₁</text>
      <text x="1000" y="188" textAnchor="middle" className="qai-policy-label">π₂</text>
      <text x="1000" y="293" textAnchor="middle" className="qai-policy-label">π₃</text>

      <text x="70" y="420" className="qai-svg-callout">Observed outcomes constrain hidden-state beliefs.</text>
      <text x="555" y="420" className="qai-svg-callout">Policies extend those beliefs into counterfactual futures.</text>
      <text x="70" y="458" className="qai-svg-small">The companion reviews ask what physical dynamics could implement this temporally deep computation in real time.</text>
    </svg>
    <div className="qai-policy-mobile" aria-label="Mobile conceptual sequence for temporally deep active inference">
      <article><span>01</span><div><strong>Observations</strong><p>o₁, o₂, … oₜ</p></div></article>
      <i aria-hidden="true">↓</i>
      <article><span>02</span><div><strong>Hidden states</strong><p>s₁, s₂, … sₜ</p></div></article>
      <i aria-hidden="true">↓</i>
      <article><span>03</span><div><strong>Candidate policies</strong><p>π₁ · π₂ · π₃ · … · πₙ</p></div></article>
      <i aria-hidden="true">↓</i>
      <article><span>04</span><div><strong>Expected futures</strong><p>Alternative trajectories weighted under the generative model.</p></div></article>
    </div>
    <figcaption>Paper I argues that the integration over alternative future trajectories has a natural formal correspondence with quantum path-integral dynamics. This is a proposed mechanistic implementation, not an empirical demonstration that neurons perform quantum path integration. <ReferenceLink href={DOI.paperI} label="Open Conscious active inference I">[13]</ReferenceLink></figcaption>
  </figure>;
}


function OrchORInlineFigure() {
  return <figure className="qai-orch-figure" aria-labelledby="qai-orch-title">
    <div className="qai-orch-figure-topline">
      <span>Mechanistic candidate / Paper II</span>
      <small>Conceptual diagram · theoretical proposal</small>
    </div>
    <div className="qai-orch-figure-grid">
      <div className="qai-orch-copy">
        <p className="qai-figure-label">Where Orch OR enters the argument</p>
        <h3 id="qai-orch-title">A deliberately narrow mechanistic bridge.</h3>
        <p>Paper II evaluates Orch OR as one candidate physical mechanism for discrete perceptual cycles. It is not a requirement of active inference and is not presented as an established substrate of consciousness.</p>
        <div className="qai-orch-boundary"><strong>Evidence boundary</strong><span>Tubulin quantum states, orchestrated coherence, and objective reduction remain theoretical propositions. The schematic visualizes the hypothesis rather than an experimental observation.</span></div>
      </div>
      <div className="qai-orch-visual" aria-hidden="true">
        <svg viewBox="0 0 780 520">
          <defs>
            <linearGradient id="qai-orch-glow" x1="0" x2="1"><stop offset="0" stopColor="#45d0ff"/><stop offset="1" stopColor="#bd79ff"/></linearGradient>
            <radialGradient id="qai-orch-node"><stop offset="0" stopColor="#d8f8ff"/><stop offset="0.35" stopColor="#5bb6ff"/><stop offset="1" stopColor="#234179"/></radialGradient>
            <filter id="qai-orch-soft"><feGaussianBlur stdDeviation="8"/></filter>
          </defs>
          <g className="qai-orch-neuron">
            <circle cx="155" cy="254" r="52"/>
            <circle cx="155" cy="254" r="18" className="qai-orch-nucleus"/>
            {[[155,202,120,145],[120,218,54,180],[112,250,34,252],[120,284,62,338],[149,306,132,400],[188,222,258,158],[202,250,288,244],[190,286,272,342]].map((d,i)=><path key={i} d={`M ${d[0]} ${d[1]} C ${(d[0]+d[2])/2} ${d[1]}, ${(d[0]+d[2])/2} ${d[3]}, ${d[2]} ${d[3]}`} />)}
          </g>
          <rect x="268" y="208" width="42" height="42" className="qai-orch-focus"/>
          <path d="M310 210 L365 160 M310 250 L365 360" className="qai-orch-guide"/>
          <g transform="translate(365 102)">
            <rect x="0" y="0" width="365" height="322" rx="18" className="qai-orch-mt-panel"/>
            <text x="24" y="34" className="qai-orch-svg-title">MICROTUBULE LATTICE · SCHEMATIC</text>
            {Array.from({length:9}).map((_,row)=>Array.from({length:6}).map((__,col)=>{
              const x=62+col*38+(row%2?19:0), y=82+row*26;
              return <circle key={`${row}-${col}`} cx={x} cy={y} r="18" fill={col%2?"#7056b8":"#3478bd"} stroke="#8bd8ff" strokeWidth="0.8"/>;
            }))}
            <path d="M58 105 C130 45 172 192 252 112 S305 176 326 130" className="qai-orch-coherence"/>
            {[105,176,247,318].map((y,i)=><g key={y}><circle cx="265" cy={y} r="6" className="qai-orch-label-dot"/><line x1="271" y1={y} x2="322" y2={y} className="qai-orch-label-line"/><text x="330" y={y+5} className="qai-orch-label-text">{["candidate tubulin state","coherent evolution","orchestration / context","objective reduction"][i]}</text></g>)}
          </g>
          <g transform="translate(380 442)">
            <text x="0" y="0" className="qai-orch-cycle-label">PROPOSED DISCRETE UPDATE</text>
            {[0,1,2,3].map(i=><g key={i} transform={`translate(${i*112} 32)`}><circle cx="22" cy="22" r="19" fill="url(#qai-orch-node)"/><text x="22" y="60" textAnchor="middle" className="qai-orch-cycle-text">{["superposition","orchestration","reduction","update"][i]}</text>{i<3&&<path d="M46 22 H96" className="qai-orch-cycle-arrow"/>}</g>)}
          </g>
        </svg>
      </div>
    </div>
    <figcaption>Orch OR is shown here as a candidate physical mechanism proposed in Paper II, not as established microtubule physiology. <ReferenceLink href={DOI.paperII} label="Open Conscious active inference II">[14]</ReferenceLink></figcaption>
  </figure>;
}

function PublicationCard({ publication, index }: { publication: (typeof publications)[number]; index: number }) {
  return <article className="qai-publication-card" data-paper={index === 0 ? "I" : "II"}>
    <div className="qai-publication-topline">
      <span>Paper {index === 0 ? "I" : "II"}</span>
      <span>{publication.type}</span>
    </div>
    <h3>{publication.title}</h3>
    <p className="qai-publication-authors">{publication.authors}</p>
    <p className="qai-publication-venue">{publication.venue} · {publication.year}</p>
    <p className="qai-publication-summary">{publication.summary}</p>
    <dl>
      <div><dt>Role</dt><dd>{publication.role}</dd></div>
      <div><dt>DOI</dt><dd>{publication.doi}</dd></div>
    </dl>
    <div className="qai-publication-links">
      {publication.href && <a href={publication.href} target="_blank" rel="noreferrer">Open article ↗</a>}
      {publication.pubmed && <a href={publication.pubmed} target="_blank" rel="noreferrer">PubMed ↗</a>}
      {publication.pmc && <a href={publication.pmc} target="_blank" rel="noreferrer">Full text ↗</a>}
    </div>
    {publication.correction && <p className="qai-correction"><strong>Correction record:</strong> <a href={publication.correction.href} target="_blank" rel="noreferrer">{publication.correction.label} ↗</a></p>}
  </article>;
}

export function QuantumActiveInferenceCaseStudy() {
  const quantumPapers = publications.filter((publication) => publication.doi === "10.1016/j.csbj.2025.09.017" || publication.doi === "10.1016/j.csbj.2025.09.016");

  return <article className="qai-case">
    <header className="qai-hero">
      <div className="qai-hero-field" aria-hidden="true">
        <svg viewBox="0 0 1200 720" preserveAspectRatio="none">
          <path d="M-80 510 C160 430 240 590 430 455 C620 320 680 150 860 220 C1035 285 1090 130 1280 80" />
          <path d="M-100 580 C170 505 255 630 455 505 C650 385 735 290 900 340 C1050 385 1120 260 1280 230" />
          <path d="M-100 440 C120 360 260 430 410 355 C575 270 675 90 850 145 C1035 205 1100 45 1275 20" />
        </svg>
      </div>
      <div className="qai-hero-equations" aria-hidden="true">
        <span><b>F[q]</b><small>variational free energy</small></span>
        <span><b>q(s, π)</b><small>beliefs over states + policies</small></span>
        <span><b>π₁ · π₂ · π₃</b><small>counterfactual futures</small></span>
      </div>
      <div className="qai-lattice" aria-hidden="true">
        <span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span />
      </div>
      <div className="shell qai-hero-content">
        <p className="qai-kicker">02 / Theoretical neuroscience · Peer-reviewed research</p>
        <div className="qai-hero-status"><span>Published 2025</span><span>Two companion reviews</span><span>Open-access record</span></div>
        <h1>Conscious<br /><em>active inference.</em></h1>
        <p className="qai-deck">A two-paper theoretical program asking whether quantum dynamics could provide a mechanistic implementation for the probabilistic planning and discrete perceptual cycles required by temporally deep active inference.</p>
        <div className="qai-hero-links">
          <a href={DOI.paperI} target="_blank" rel="noreferrer">Read Paper I ↗</a>
          <a href={DOI.paperII} target="_blank" rel="noreferrer">Read Paper II ↗</a>
        </div>
        <dl className="qai-facts">
          <div><dt>Role</dt><dd>Co-author</dd></div>
          <div><dt>Publication</dt><dd>Computational and Structural Biotechnology Journal</dd></div>
          <div><dt>Papers</dt><dd>Two companion reviews · 2025</dd></div>
          <div><dt>Framework</dt><dd>Active inference × quantum dynamics × Orch OR</dd></div>
        </dl>
        <p className="qai-hero-caption"><span>Argument arc</span> objection → perturbation → mechanistic hypothesis → discriminating experiment</p>
      </div>
    </header>

    <aside className="qai-boundary" aria-label="Evidence boundary">
      <div className="shell"><strong>Evidence boundary</strong><p>This is peer-reviewed theoretical work. The papers argue that quantum dynamics may provide a biologically plausible implementation of conscious active inference and evaluate Orch OR as a candidate mechanism. They do not establish that consciousness depends on quantum microtubule dynamics.</p></div>
    </aside>

    <nav className="qai-argument-nav" aria-label="Case study argument map">
      <div className="shell">
        <a href="#qai-question"><span>00</span>Question</a>
        <a href="#qai-objection"><span>01</span>Objection</a>
        <a href="#qai-anesthesia"><span>02</span>Perturbation</a>
        <a href="#qai-contribution"><span>03</span>Our work</a>
        <a href="#qai-mri"><span>04</span>Controversy</a>
        <a href="#qai-map"><span>05</span>Evidence</a>
        <a href="#qai-falsifiability"><span>06</span>Test</a>
        <a href="#qai-publications"><span>07</span>Papers</a>
      </div>
    </nav>

    <section className="qai-thesis" aria-label="Research posture">
      <div className="shell">
        <article><span>Formal level</span><strong>What must be computed?</strong><p>Active inference specifies belief updating and policy selection under variational free-energy minimization.</p></article>
        <article><span>Mechanistic candidate</span><strong>What could implement it?</strong><p>The papers evaluate quantum dynamics and Orch OR as candidate physical implementations, not prerequisites of active inference itself.</p></article>
        <article><span>Standard of proof</span><strong>What would count?</strong><p>A quantum account must outperform viable classical alternatives on discriminating, reproducible intervention predictions.</p></article>
      </div>
    </section>

    <section id="qai-question" data-section="00" className="qai-section qai-question" aria-labelledby="qai-question-title">
      <div className="shell qai-two-column">
        <p className="qai-index">00 / From process to mechanism</p>
        <div>
          <h2 id="qai-question-title">Active inference says what the system must compute.<br /><em>What physical system actually computes it?</em></h2>
          <p className="qai-lede">The project begins by separating three levels of explanation. Active inference supplies a normative objective. Process theories map belief updating onto neuronal populations and message passing. Mechanistic models must still explain how real biophysics realizes those computations.</p>
          <p className="qai-source-line">Scientific basis: Ma et al. 2006; Friston et al. 2006, 2017; Friston 2018; Parr, Pezzulo &amp; Friston 2022. <ReferenceLink href={DOI.ma} label="Open Ma et al. 2006">[3]</ReferenceLink> <ReferenceLink href={DOI.friston2006} label="Open Friston et al. 2006">[4]</ReferenceLink> <ReferenceLink href={DOI.friston2017} label="Open Friston et al. 2017">[5]</ReferenceLink> <ReferenceLink href={DOI.friston2018} label="Open Friston 2018">[6]</ReferenceLink> <ReferenceLink href={DOI.parr2022} label="Open Parr, Pezzulo and Friston 2022">[7]</ReferenceLink></p>
        </div>
      </div>
      <div className="shell"><TheoryLevelDiagram /></div>
    </section>

    <section id="qai-objection" data-section="01" className="qai-section qai-objection" aria-labelledby="qai-objection-title">
      <div className="shell qai-two-column">
        <p className="qai-index">01 / The decoherence challenge</p>
        <div>
          <h2 id="qai-objection-title">The original objection was brutally simple:<br /><em>the brain is warm, wet, and noisy.</em></h2>
          <p className="qai-lede">Tegmark calculated extremely short decoherence times for candidate neural quantum states, roughly 10<sup>−13</sup> to 10<sup>−20</sup> seconds, compared with neural dynamics on roughly 10<sup>−3</sup> to 10<sup>−1</sup> second scales. The calculation became a central physical objection to quantum models of cognition. <ReferenceLink href={DOI.tegmark} label="Open Tegmark 2000">[1]</ReferenceLink></p>
        </div>
      </div>
      <div className="shell"><TimescaleFigure /></div>
      <div className="shell qai-model-dispute">
        <article>
          <span>Tegmark / 2000</span>
          <h3>One physical model</h3>
          <p>Environmental interactions rapidly decohere the superpositions he modeled, leaving a large separation from neural processing times.</p>
          <a href={DOI.tegmark} target="_blank" rel="noreferrer">Primary source ↗</a>
        </article>
        <article>
          <span>Hagan, Hameroff &amp; Tuszyński / 2002</span>
          <h3>A different model</h3>
          <p>They argued that Tegmark had modeled a different superposition from the Orch OR proposal and obtained longer estimates under altered assumptions.</p>
          <a href={DOI.hagan} target="_blank" rel="noreferrer">Primary source ↗</a>
        </article>
        <p className="qai-dispute-status"><strong>Model dispute:</strong> calculation alone could not determine which physical description, if either, applies in living neurons.</p>
      </div>
    </section>

    <section id="qai-anesthesia" data-section="02" className="qai-section qai-anesthesia" aria-labelledby="qai-anesthesia-title">
      <div className="shell qai-two-column">
        <p className="qai-index">02 / Anesthesia as a perturbation</p>
        <div>
          <h2 id="qai-anesthesia-title">Instead of asking whether microtubules look quantum,<br /><em>ask whether changing them changes consciousness-related behavior.</em></h2>
          <p className="qai-lede">Volatile anesthetics act through multiple targets. Microtubules are one candidate. The useful question is therefore narrower: does selectively stabilizing microtubules alter a standard behavioral endpoint of anesthesia?</p>
        </div>
      </div>
      <div className="shell qai-anesthesia-grid">
        <article className="qai-result-card">
          <div className="qai-figure-label">Values reported in cited source</div>
          <span className="qai-result-year">2024 · rats</span>
          <strong>+69 s</strong>
          <p>Mean delay in loss of righting reflex after epothilone B under 4% isoflurane.</p>
          <dl><div><dt>Animals</dt><dd>Male rats</dd></div><div><dt>Endpoint</dt><dd>Loss of righting reflex</dd></div><div><dt>Effect size</dt><dd>Cohen&apos;s d ≈ 1.9</dd></div></dl>
          <a href={DOI.khan} target="_blank" rel="noreferrer">Khan et al., eNeuro ↗</a>
        </article>
        <article className="qai-result-card">
          <div className="qai-figure-label">Values reported in cited source</div>
          <span className="qai-result-year">2026 · mice</span>
          <strong>+29 s</strong>
          <p>Within-subject increase in loss-of-righting-reflex latency reported after 8 mg/kg epothilone B.</p>
          <dl><div><dt>Animals</dt><dd>Male and female mice</dd></div><div><dt>Endpoint</dt><dd>Loss of righting reflex</dd></div><div><dt>Effect size</dt><dd>Cohen&apos;s d ≈ 0.8</dd></div></dl>
          <a href={DOI.huang} target="_blank" rel="noreferrer">Huang et al., Neuropharmacology ↗</a>
        </article>
      </div>
      <div className="shell">
        <p className="qai-endpoint-note"><strong>Endpoint note:</strong> loss of righting reflex is a standard rodent behavioral proxy for anesthetic-induced unconsciousness. It is not a direct measurement of phenomenal consciousness.</p>
        <div className="qai-evidence-ladder" aria-label="Interpretive limits of the anesthesia experiments">
          <article><span>Observation</span><h3>Microtubule stabilization changes anesthetic sensitivity.</h3><p>The rat and mouse experiments report delayed loss of righting reflex after epothilone B. <ReferenceLink href={DOI.khan} label="Open Khan et al. 2024">[11]</ReferenceLink> <ReferenceLink href={DOI.huang} label="Open Huang et al. 2026">[16]</ReferenceLink></p></article>
          <article><span>Supports</span><h3>A functional microtubule contribution to anesthetic action.</h3><p>The cross-species direction of effect makes microtubules harder to dismiss as irrelevant to the anesthetic phenotype.</p></article>
          <article><span>Does not establish</span><h3>A quantum mechanism of consciousness.</h3><p>The experiments do not by themselves demonstrate quantum coherence, entanglement, objective reduction, or a microtubular substrate of phenomenal consciousness.</p></article>
        </div>
      </div>
    </section>

    <section id="qai-contribution" data-section="03" className="qai-section qai-contribution" aria-labelledby="qai-contribution-title">
      <div className="shell qai-two-column">
        <p className="qai-index">03 / Our contribution</p>
        <div>
          <h2 id="qai-contribution-title">The question we asked was computational:<br /><em>how does a biological system evaluate possible futures quickly enough?</em></h2>
          <p className="qai-lede">The two companion reviews connect temporally deep active inference to a candidate physical implementation. Paper I focuses on integration over possible future trajectories. Paper II focuses on discrete perceptual cycles and evaluates Orch OR as a proposed mechanism.</p>
        </div>
      </div>
      <div className="shell"><PolicyFigure /></div>
      <div className="shell qai-paper-claims">
        <article>
          <span>Paper I / theoretical claim</span>
          <h3>Planning across possible futures</h3>
          <p>We argued that temporally deep active inference requires integration over alternative future trajectories and that quantum path-integral dynamics offer a natural candidate implementation of that computation.</p>
          <a href={DOI.paperI} target="_blank" rel="noreferrer">Read Paper I ↗</a>
        </article>
        <article>
          <span>Paper II / theoretical claim</span>
          <h3>Discrete perceptual cycles</h3>
          <p>We evaluated Orch OR as a candidate physical mechanism for temporally structured conscious updating. The paper proposes a mechanistic correspondence; it does not experimentally establish objective reduction in neurons.</p>
          <a href={DOI.paperII} target="_blank" rel="noreferrer">Read Paper II ↗</a>
        </article>
      </div>
      <div className="shell"><OrchORInlineFigure /></div>
    </section>

    <section id="qai-mri" data-section="04" className="qai-section qai-mri" aria-labelledby="qai-mri-title">
      <div className="shell qai-two-column">
        <p className="qai-index">04 / A disputed signal</p>
        <div>
          <h2 id="qai-mri-title">Some evidence is intriguing precisely because<br /><em>it is contested.</em></h2>
          <p className="qai-lede">A 2022 MRI study interpreted multiple-quantum-coherence measurements as possible evidence of a non-classical mediator associated with brain function. A published 2023 comment argued that the measurements did not justify an entanglement claim. The original authors published a reply.</p>
        </div>
      </div>
      <div className="shell qai-mri-split">
        <article>
          <span>Interpretation</span>
          <h3>Possible non-classical mediator</h3>
          <p>Kerskens and López Pérez reported an MRI signal they interpreted as consistent with a non-classical mediator and entanglement-related behavior.</p>
          <a href={DOI.kerskens} target="_blank" rel="noreferrer">Original paper ↗</a>
        </article>
        <div className="qai-versus" aria-hidden="true">vs.</div>
        <article>
          <span>Critique</span>
          <h3>Classical alternatives remain</h3>
          <p>Warren argued that multiple-quantum-coherence MRI can arise through classical spin dynamics and that the reported result did not establish entanglement.</p>
          <a href={DOI.warren} target="_blank" rel="noreferrer">Published comment ↗</a>
        </article>
      </div>
      <div className="shell qai-mri-status">
        <div><strong>Status</strong><span>Contested</span></div>
        <p>Independent replication and stronger exclusion of classical alternatives are required. The original authors&apos; published reply is part of that record. <ReferenceLink href={DOI.kerskens} label="Open Kerskens and López Pérez 2022">[8]</ReferenceLink> <ReferenceLink href={DOI.warren} label="Open Warren 2023 comment">[9]</ReferenceLink> <ReferenceLink href={DOI.kerskensReply} label="Open Kerskens and López Pérez 2023 reply">[10]</ReferenceLink></p>
      </div>
    </section>

    <section id="qai-map" data-section="05" className="qai-section qai-map" aria-labelledby="qai-map-title">
      <div className="shell">
        <p className="qai-index">05 / What survives scrutiny</p>
        <h2 id="qai-map-title">A useful theory should make it easy to see what is known,<br /><em>what is suggestive, and what remains conjecture.</em></h2>
        <div className="qai-figure-label qai-map-label">Evidence map</div>
        <div className="qai-evidence-map">
          {evidenceGroups.map((group) => <article key={group.label} data-evidence={group.label.toLowerCase().replace(" ", "-")}>
            <span>{group.label}</span>
            <h3>{group.title}</h3>
            <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
            <small>{group.refs}</small>
          </article>)}
        </div>
      </div>
    </section>

    <section id="qai-falsifiability" data-section="06" className="qai-section qai-falsifiability" aria-labelledby="qai-falsifiability-title">
      <div className="shell qai-two-column">
        <p className="qai-index">06 / Falsifiability</p>
        <div>
          <h2 id="qai-falsifiability-title">The next advance is not another argument.<br /><em>It is a discriminating experiment.</em></h2>
          <p className="qai-lede">The decisive experiment must separate a specifically quantum mechanism from conventional microtubule biology and classical network dynamics.</p>
        </div>
      </div>
      <div className="shell qai-experiment-list">
        {experiments.map((experiment, index) => <article key={experiment}><span>{String(index + 1).padStart(2, "0")}</span><p>{experiment}</p></article>)}
      </div>
      <div className="shell qai-falsifiability-rule"><strong>Decision rule</strong><p>A quantum account should earn explanatory status only if it predicts intervention outcomes that viable classical models do not, and those predictions replicate.</p></div>
    </section>

    <QaiFigureAtlas />

    <section id="qai-publications" data-section="07" className="qai-section qai-publications" aria-labelledby="qai-publications-title">
      <div className="shell">
        <p className="qai-index">07 / Published work</p>
        <h2 id="qai-publications-title">Two companion reviews.<br /><em>One mechanistic question.</em></h2>
        <div className="qai-publication-grid">
          {quantumPapers.map((publication, index) => <PublicationCard publication={publication} index={index} key={publication.doi} />)}
        </div>
      </div>
    </section>

    <aside className="qai-coda" aria-label="Research position">
      <div className="shell"><span>Research position</span><p>The scientifically useful claim is deliberately narrow: quantum active inference is a mechanistic hypothesis with emerging experimentally addressable consequences, not an established account of consciousness.</p></div>
    </aside>

    <section className="qai-section qai-references" aria-labelledby="qai-references-title">
      <div className="shell qai-two-column">
        <p className="qai-index">References / Primary record</p>
        <div>
          <h2 id="qai-references-title">Sources behind the argument.</h2>
          <ol>{references.map((reference) => <li key={reference.id}><span>{reference.id}</span><a href={reference.href} target="_blank" rel="noreferrer">{reference.citation} ↗</a></li>)}</ol>
          <p className="qai-reference-note">The social-media carousel that motivated this redesign is not used as evidence. Scientific claims on this page are tied to the primary literature, the peer-reviewed reviews, and the published comment/reply record.</p>
        </div>
      </div>
    </section>

    <nav className="qai-footer-nav" aria-label="Case study navigation"><div className="shell"><Link href="/work">← All work</Link><Link href="/research">Research record →</Link></div></nav>
  </article>;
}
