"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MathText } from "./ReasonOSLab";
import { CONDUCTOR, ELECTRODES, SOURCE_PHASES, dipolePotential, frontPolarity, leadReading, sourcePhase, syntheticLeadPath, type BipolarLead } from "@/lib/reasonos/signal-origin";
import s from "./ECGSignalOrigin.module.css";

const number = (x: number, digits = 3) => (Math.abs(x) < 0.5 * 10 ** -digits ? 0 : x).toFixed(digits);
const px = (x: number) => 200 + x * 520;
const py = (y: number) => 160 + y * 520;
const torso = "M166 24 Q200 37 234 24 L244 48 Q282 48 322 75 L344 218 Q326 236 312 214 L296 142 L293 270 Q280 303 270 350 L130 350 Q120 303 107 270 L104 142 L88 214 Q74 236 56 218 L78 75 Q118 48 156 48 Z";
const sources = {
  front: "https://www.bem.fi/book/15/15.htm#15.2",
  field: "https://www.bem.fi/book/08/08.htm#8.2.2",
  activation: "https://doi.org/10.1161/01.CIR.41.6.899",
  ionic: "https://doi.org/10.1152/ajpheart.00794.2003",
  lead: "https://doi.org/10.1016/S0006-3495(67)86571-8",
  circuit: "https://www.ti.com/lit/ds/symlink/ads1298.pdf",
};

function TissueBoundary() {
  const [recovery, setRecovery] = useState(false), [toward, setToward] = useState(true);
  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const view = viewport.current;
    if (!view) return;
    const center = () => { view.scrollLeft = (view.scrollWidth - view.clientWidth) / 2; };
    center();
    const observer = new ResizeObserver(center);
    observer.observe(view);
    return () => observer.disconnect();
  }, []);
  const sign = frontPolarity(recovery, toward);
  return <div className={s.micro}>
    <div className={s.microHeader}><div><span className={s.eyebrow}>TISSUE CLOSE-UP · IDEALIZED ONE-DIMENSIONAL BOUNDARY</span><h3>Why a moving boundary makes a signed voltage</h3></div><p>Change the process and its direction. The lead’s positive input stays on the right.</p></div>
    <div className={s.frontControls}><fieldset><legend>Process</legend><button aria-pressed={!recovery} onClick={() => setRecovery(false)}>Depolarization</button><button aria-pressed={recovery} onClick={() => setRecovery(true)}>Repolarization</button></fieldset><fieldset><legend>Boundary sequence</legend><button aria-pressed={toward} onClick={() => setToward(true)}>Toward + input →</button><button aria-pressed={!toward} onClick={() => setToward(false)}>Away from + input ←</button></fieldset></div>
    <div className={s.microGrid}>
      <div><p className={s.scrollHint}>− input at left · + input at right. Scroll horizontally to inspect the full circuit.</p><div ref={viewport} className={s.diagramScroll} role="region" tabIndex={0} aria-label="Tissue boundary diagram; scroll horizontally on a small screen"><svg viewBox="0 0 650 280" role="img" aria-label={`${recovery ? "Recovery" : "Activation"} boundary ${toward ? "toward" : "away from"} the positive input produces an ${sign > 0 ? "upward" : "downward"} deflection in this simple tissue model.`}>
        <text x="30" y="28">− input</text><text x="545" y="28">+ input</text>
        <path d="M52 45 V190 H270 M598 45 V190 H380" fill="none" stroke="#7a8b85" strokeWidth="2"/>
        <rect x="80" y="56" width="490" height="92" rx="18" fill="#e6ebe4" stroke="#b6c6bd"/>
        {Array.from({ length: 6 }, (_, i) => {
          const passed = toward ? i < 3 : i >= 3;
          const active = recovery ? !passed : passed;
          return <g key={i}><rect x={96 + i * 78} y="76" width="66" height="51" rx="20" fill={active ? "#e0b8ab" : "#b6d1d4"} stroke={active ? "#80574c" : "#476d77"}/><text x={129 + i * 78} y="99" textAnchor="middle" fontSize="11">{active ? "Activated" : recovery && passed ? "Recovered" : "Resting"}</text><text x={129 + i * 78} y="116" textAnchor="middle" fontSize="10">{active ? "Vm ≈ +20 mV" : "Vm ≈ −90 mV"}</text></g>;
        })}
        <path d="M325 50 V155" stroke="#665096" strokeWidth="2" strokeDasharray="4 4"/><text x="325" y="42" textAnchor="middle" fontSize="11">Boundary</text>
        <text x="105" y="174" fontSize="12">{toward ? "→" : "←"} Boundary sequence</text>
        <circle cx="325" cy="193" r="29" fill="#f9faf5" stroke="#37685c"/><text x="325" y="199" textAnchor="middle" fontSize="20">{sign > 0 ? "+" : "−"}</text>
        <path d={sign > 0 ? "M400 218 H443 V188 H480 V218 H530" : "M400 198 H443 V228 H480 V198 H530"} stroke="#126b71" strokeWidth="2.5" fill="none"/>
        <text x="95" y="226" fontSize="12">Membrane voltage ≠ surface ECG voltage</text>
        <text x="95" y="261" fontSize="12">Equivalent source:</text><text x="255" y="264" fontSize="26" style={{ fill: "#64439c" }}>{sign > 0 ? "⟶" : "⟵"}</text><text x="320" y="261" fontSize="11">Opposes the spatial Vm gradient</text>
      </svg></div></div>
      <div><h4>{sign > 0 ? "Upward" : "Downward"} deflection</h4><p>{recovery ? "Recovery reverses the spatial membrane-voltage gradient for the same boundary direction. It therefore reverses the equivalent source polarity." : "Activation creates a spatial gradient between activated and resting tissue. In this simple geometry its equivalent dipole points in the direction of activation."}</p><p><strong>Opposite process + opposite direction = same sign.</strong> This explains how a T wave can be upright after an upright QRS. It does not establish a particular person’s recovery sequence.</p><a href={sources.front}>Boundary-polarity derivation · Bioelectromagnetism §15.2 ↗</a></div>
    </div>
    <details><summary>What crosses the membrane? Why are the cells not simply charged beads?</summary><div className={s.depth}>
      <p className={s.scrollHint}>Scroll horizontally to compare Na⁺, Ca²⁺ and K⁺ pathways.</p><div className={s.diagramScroll} role="region" tabIndex={0} aria-label="Ion-channel illustration; scroll horizontally on a small screen"><svg viewBox="0 0 620 170" role="img" aria-label="Sodium enters a working ventricular myocyte during its fast upstroke. Calcium influx contributes to the plateau; potassium efflux contributes to repolarization.">
        <rect x="20" y="64" width="580" height="12" rx="6" fill="#b6c9c0"/><rect x="20" y="133" width="580" height="12" rx="6" fill="#b6c9c0"/><text x="25" y="25" fontSize="13">Extracellular space</text><text x="25" y="117" fontSize="13">Cell interior · φi</text>
        <text x="168" y="42" textAnchor="middle">Na⁺</text><path d="M168 48 V96 m-6 -8 6 8 6 -8" stroke="#3f7e8c" strokeWidth="3" fill="none"/><text x="168" y="161" fontSize="11" textAnchor="middle">Fast upstroke</text>
        <text x="335" y="42" textAnchor="middle">Ca²⁺</text><path d="M335 48 V96 m-6 -8 6 8 6 -8" stroke="#3f7e8c" strokeWidth="3" fill="none"/><text x="335" y="161" fontSize="11" textAnchor="middle">Plateau contribution</text>
        <text x="495" y="42" textAnchor="middle">K⁺</text><path d="M495 98 V49 m-6 8 6 -8 6 8" stroke="#9d6d39" strokeWidth="3" fill="none"/><text x="495" y="161" fontSize="11" textAnchor="middle">Recovery contribution</text>
      </svg></div>
      <p><strong>Working ventricular muscle, simplified.</strong> Voltage-gated channels conduct ions down electrochemical gradients. Sodium influx drives the fast upstroke; calcium and potassium currents contribute to the plateau; net outward current produces repolarization. Nodal cells have different currents and timing. Adjacent cells are electrically coupled through gap junctions; activation travels as local current recruits nearby membrane, not as one ion crossing the entire heart. <a href={sources.ionic}>Human ventricular ionic model ↗</a></p>
      <MathText tex={"V_m=\\phi_i-\\phi_e"} reading="Membrane voltage equals intracellular minus extracellular potential."/>
      <p><strong>Vm, φi and φe are potentials in mV.</strong> The approximate −90 and +20 mV labels illustrate resting and activated membrane states; they are neither simulated patient values nor the ECG amplitude. Most bulk fluid remains nearly electrically neutral. Small charge separations across membranes and associated current loops matter; a surface electrode samples extracellular potential after volume conduction.</p>
    </div></details>
  </div>;
}

export function ECGSignalOrigin({ standalone = false }: { standalone?: boolean }) {
  const Heading = standalone ? "h1" : "h2";
  const traceViewport = useRef<HTMLDivElement>(null);
  const id = useId().replaceAll(":", ""), [time, setTime] = useState(240), [lead, setLead] = useState<BipolarLead>("II"), [reversed, setReversed] = useState(false);
  const state = useMemo(() => leadReading(time, lead, reversed), [time, lead, reversed]);
  const trace = useMemo(() => syntheticLeadPath(lead, reversed), [lead, reversed]);
  const phase = sourcePhase(time), p = state.p;
  const active = phase.id === "P" || phase.id === "QRS" || phase.id === "T";
  const sourceLength = Math.hypot(...p), dipoleScale = 1.2e6;
  const fieldCells = useMemo(() => Array.from({ length: 26 * 30 }, (_, i) => {
    const x = 50 + (i % 26) * 12, y = 14 + Math.floor(i / 26) * 12;
    if (Math.hypot((x - 200) / 520, (y - 160) / 520) < 0.055) return null;
    const mv = dipolePotential([(x - 200) / 520, (y - 160) / 520], p) * 1000;
    return <rect key={i} x={x} y={y} width="12.5" height="12.5" fill={mv >= 0 ? "#24758b" : "#b47a3b"} opacity={Math.min(0.8, Math.abs(mv) * 0.8)}/>;
  }), [p]);
  const [minus, plus] = [state.negative, state.positive];
  const a = ELECTRODES[minus], b = ELECTRODES[plus];
  const heartColor = phase.id === "T" ? "#c4b0df" : "#e6b5a3";
  const xTrace = (t: number) => 44 + t / 820 * 992, yTrace = (v: number) => 100 - v * 60;
  useEffect(() => {
    const view = traceViewport.current;
    if (!view) return;
    const follow = () => { if (view.scrollWidth > view.clientWidth) view.scrollLeft = (44 + time / 820 * 992) / 1080 * view.scrollWidth - view.clientWidth / 2; };
    follow();
    const observer = new ResizeObserver(follow);
    observer.observe(view);
    return () => observer.disconnect();
  }, [time]);
  return <section className={s.origin} id="signal-origin" data-signal-origin aria-labelledby={`${id}heading`}>
    <Script id="signal-origin-katex" src="/quantum-computer-lab/vendor/katex.min.js" onLoad={() => window.dispatchEvent(new Event("reasonos-math-ready"))}/>
    <header className={s.heading}><div><span className={s.eyebrow}>VECTOR EKG · SIGNAL ORIGIN</span><Heading id={`${id}heading`}>From cardiac cells to the ECG</Heading><p>The heart generates the electrical source. The recorder measures voltage differences at the skin.</p></div>{standalone ? <Link href="/work/vector-ekg-reasonos/workspace">Open ECG workspace ↗</Link> : <Link href="/work/vector-ekg-reasonos/signal">Open this explanation ↗</Link>}</header>
    <div className={s.notice}><strong>Calculated teaching model</strong><span>Prescribed source · idealized conductor · original schematic anatomy. These diagrams do not reconstruct the heart from an uploaded ECG.</span></div>
    <div className={s.controls}><div className={s.phases} aria-label="Choose cardiac phase">{SOURCE_PHASES.map(item => <button key={item.id} aria-pressed={phase.id === item.id} onClick={() => setTime(item.time)}>{item.id === "rest" ? "Between beats" : item.id}</button>)}</div><label>Lead <select aria-label="Explanation lead" value={lead} onChange={e => setLead(e.target.value as BipolarLead)}>{(["I", "II", "III"] as const).map(item => <option key={item}>{item}</option>)}</select></label><button className={s.reverse} aria-pressed={reversed} onClick={() => setReversed(!reversed)}>Reverse recorder inputs</button><div className={s.timeRow}><label className={s.scrub}>Explore time <input aria-label="Cardiac cycle time" type="range" min="0" max="820" step="1" value={time} onChange={e => setTime(Number(e.target.value))}/><output>{time} ms</output></label><output className={s.compactVoltage} aria-label="Current calculated lead voltage">{reversed ? "Reversed " : ""}{lead}: {number(state.voltageMv)} mV</output></div></div>
    <div className={s.figures}>
      <figure className={s.heart}>
        <figcaption><span>01 / SOURCE</span><h3>{phase.title}</h3></figcaption>
        <svg viewBox="0 0 350 350" role="img" aria-label={`Schematic cardiac chambers and conduction system. ${phase.title}. The violet arrow is an equivalent source, not an ion trajectory.`}>
          <defs><linearGradient id={`${id}muscle`} x2="1" y2="1"><stop stopColor="#b37d6d"/><stop offset=".48" stopColor="#e4b8a5"/><stop offset="1" stopColor="#81564f"/></linearGradient><marker id={`${id}source`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 10 5 0 10Z" fill="#64439c"/></marker><clipPath id={`${id}ventricle`}><path d="M109 143 Q65 161 80 222 Q92 284 201 319 Q276 276 272 184 Q265 140 218 131 Q167 147 109 143Z"/></clipPath></defs>
          <path d="M105 78 97 27 Q113 18 126 27 L132 76 M206 92 206 39 Q216 17 237 26 L260 59 M239 71 Q269 51 286 70 L303 93" fill="none" stroke="#b9bfb4" strokeWidth="19"/>
          <path d="M112 66 Q66 50 56 98 Q43 139 82 160 L130 158 Q164 127 153 99 Q142 70 112 66Z M171 80 Q198 51 231 69 Q271 83 265 127 L232 156 169 133Z" fill={phase.id === "P" ? heartColor : "#c9b9ac"} stroke="#825e55" strokeWidth="2"/>
          <path d="M109 143 Q65 161 80 222 Q92 284 201 319 Q276 276 272 184 Q265 140 218 131 Q167 147 109 143Z" fill={`url(#${id}muscle)`} stroke="#825e55" strokeWidth="2"/>
          <g clipPath={`url(#${id}ventricle)`}><path d="M166 140 Q139 184 156 231 Q173 264 201 307" fill="none" stroke="#f3ddd0" strokeWidth="16"/>
            {phase.id === "QRS" && <path d={`M${90 + (time - 200) * .8} 135 Q${65 + (time - 200) * .8} 215 ${130 + (time - 200) * .8} 305`} fill="none" stroke="#f7edd7" strokeWidth="16" opacity=".8"/>}
            {phase.id === "T" && <path d="M111 151 Q80 233 201 305 Q263 250 251 177" fill="none" stroke={heartColor} strokeWidth="26" opacity=".8"/>}
          </g>
          <path d="M92 84 Q142 80 143 135 L166 164 Q172 194 195 227 Q226 253 236 190 M166 164 Q125 179 118 223 Q130 249 160 266" stroke="#546d62" strokeWidth="3" fill="none"/>
          <circle cx="92" cy="84" r="5" fill="#d9bb74" stroke="#61593d"/><circle cx="143" cy="135" r="5" fill="#d9bb74" stroke="#61593d"/>
          <text x="104" y="114" fontSize="12">RA</text><text x="211" y="112" fontSize="12">LA</text><text x="102" y="209" fontSize="12">RV</text><text x="230" y="210" fontSize="12">LV</text>
          <path d="M91 83 37 63 M142 135 31 151 M196 227 283 243" stroke="#6f8276" fill="none"/>
          <text x="15" y="55" fontSize="12">SA node</text><text x="13" y="169" fontSize="12">AV node</text><text x="254" y="261" fontSize="11">His–Purkinje</text>
          {sourceLength > 1e-10 && <path d={`M175 207 l${number(p[0] * dipoleScale, 2)} ${number(p[1] * dipoleScale, 2)}`} stroke="#64439c" strokeWidth="4" markerEnd={`url(#${id}source)`}/>}
          <circle cx="175" cy="207" r="4" fill="#64439c"/>
          <text x="18" y="327" fontSize="10">Patient’s right</text><text x="254" y="327" fontSize="10">Patient’s left</text>
        </svg>
        <div className={s.dipoleValue}>p = ({number(p[0] * 1e6, 1)}, {number(p[1] * 1e6, 1)}) µA m<br/><small>Leftward, inferior components · prescribed source</small></div><p>{phase.text} <a href={phase.id === "T" ? sources.front : sources.activation}>Source ↗</a></p><small>Cutaway schematic; chamber geometry and activation boundary are illustrative. The arrow’s chosen origin is a drawing convention.</small>
      </figure>
      <figure className={s.field}>
        <figcaption><span>02 / VOLUME CONDUCTION</span><h3>Potential at the electrodes</h3></figcaption>
        <svg viewBox="0 0 400 375" role="img" aria-label={`Calculated frontal slice of a three-dimensional point-dipole field. ${minus} is the negative input and ${plus} the positive input. Blue indicates positive potential; amber negative, relative to infinity.`}>
          <defs><clipPath id={`${id}torso`}><path d={torso}/></clipPath><marker id={`${id}lead`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 10 5 0 10Z" fill="#8a6930"/></marker></defs>
          <path d={torso} fill="#e9eee8"/>
          <g clipPath={`url(#${id}torso)`}>{fieldCells}</g><path d={torso} fill="none" stroke="#a9b8ae" strokeWidth="1.2"/>
          <circle cx="200" cy="160" r="29" fill="#f2f5ee" stroke="#aab5ac" strokeDasharray="3 3"/>
          <path d={`M${px(a[0])} ${py(a[1])} L${px(b[0])} ${py(b[1])}`} stroke="#8a6930" strokeWidth="2" strokeDasharray="5 5" markerEnd={`url(#${id}lead)`}/>
          {sourceLength > 1e-10 && <path d={`M200 160 l${number(p[0] * dipoleScale, 2)} ${number(p[1] * dipoleScale, 2)}`} stroke="#64439c" strokeWidth="4" markerEnd={`url(#${id}source)`}/>}
          <circle cx="200" cy="160" r="4" fill="#64439c"/>
          {Object.entries(ELECTRODES).map(([name, position]) => <g key={name} transform={`translate(${px(position[0])} ${py(position[1])})`}><circle r="7" fill="#f9faf5" stroke="#49675b" strokeWidth="2"/><rect x="-38" y={name === "LL" ? 14 : -44} width="76" height="33" rx="4" fill="#f9faf5"/><text y={name === "LL" ? 27 : -30} textAnchor="middle" fontSize="11">{name} {name === plus ? "+" : name === minus ? "−" : ""}</text><text y={name === "LL" ? 41 : -16} textAnchor="middle" fontSize="10">{number(state.potentials[name as keyof typeof ELECTRODES])} mV</text></g>)}
          <text x="200" y="365" textAnchor="middle" fontSize="10">Limb sites represented by idealized triangle vertices</text>
        </svg>
        <div className={s.legend}><span><i style={{ background: "#64439c" }}/>Source dipole</span><span><i className={s.dashed}/>Lead axis → +</span></div><div className={s.scale}><span>−1 mV</span><i/><span>+1 mV</span></div>
        <small>Relative to zero at infinity. Color saturates at ±1 mV. An authored 55 mm radius mask hides the central singularity; it is not an accuracy boundary. A 2D slice of a 3D analytic field; the torso outline imposes no boundary.</small>
      </figure>
      <div className={s.reading}>
        <span className={s.eyebrow}>03 / MEASUREMENT</span><h3>{reversed ? "Reversed inputs" : `Lead ${lead}`}</h3><div className={s.voltage} data-voltage-mv={state.voltageMv}>{number(state.voltageMv)}<small> mV</small></div>
        <div className={s.subtract}><span>φ{plus} <b>{number(state.potentials[plus])}</b></span><span>− φ{minus} <b>{number(state.potentials[minus])}</b></span><span>= V <b>{number(state.voltageMv)} mV</b></span></div><small>Readings rounded; subtraction uses full precision.</small>
        <svg viewBox="0 0 260 135" role="img" aria-label="Two sensing electrodes connect to the positive and negative inputs of a high-input-impedance differential amplifier."><path d="M15 32 H95 M15 96 H95 M95 18 178 64 95 112Z M178 64 H248" stroke="#52756b" strokeWidth="2" fill="none"/><circle cx="15" cy="32" r="5" fill="#f5f8ef" stroke="#52756b"/><circle cx="15" cy="96" r="5" fill="#f5f8ef" stroke="#52756b"/><text x="107" y="47">+</text><text x="107" y="91">−</text><text x="28" y="24" fontSize="11">{plus}</text><text x="28" y="88" fontSize="11">{minus}</text><text x="179" y="48" fontSize="10">To digitizer</text><text x="102" y="132" fontSize="10">High input impedance</text></svg>
        <p>{reversed ? "Swapping the inputs flips the trace. The source and body-potential map stay unchanged." : "The recorder subtracts the two electrode potentials. It does not create the source dipole or pull ions through the heart."}</p><a href={sources.circuit}>Example acquisition electronics ↗</a>
        <small>This ideal measurement draws no input current. Real front ends have finite input impedance and may use bias or common-mode feedback circuits; those are not the mechanism generating the ECG.</small>
      </div>
    </div>
    <figure className={s.trace}>
      <figcaption><div><span>04 / SYNTHETIC DIFFERENCE OVER TIME</span><h3>Synthetic lead {lead}{reversed ? " · reversed inputs" : ""}</h3></div><p>The cursor, source arrow, body field and electrode readings use the same time.</p></figcaption>
      <p className={s.scrollHint}>Scrollable cycle. Use the time slider to follow the cursor.</p><div ref={traceViewport} className={s.traceScroll} role="region" tabIndex={0} aria-label="Synthetic ECG cycle; scroll horizontally on a small screen"><svg viewBox="0 0 1080 205" role="img" aria-label={`Synthetic lead ${lead} waveform. At ${time} milliseconds, ${phase.title.toLowerCase()}, voltage is ${number(state.voltageMv)} millivolts.`}>
        <defs><pattern id={`${id}grid`} x="44" y="10" width={992 * 50 / 820} height="30" patternUnits="userSpaceOnUse"><path d={`M${992 * 50 / 820} 0 H0 V30`} fill="none" stroke="#cedcd0" strokeWidth=".7"/></pattern></defs>
        <rect x="44" y="26" width="992" height="145" fill={`url(#${id}grid)`}/><path d="M44 100 H1036" stroke="#b6c7bb"/>
        {(["P", "QRS", "T"] as const).map((item, i) => <text key={item} x={xTrace([80, 240, 530][i])} y="18" textAnchor="middle" fontSize="12">{item}</text>)}
        <path data-synthetic-wave d={trace.map(([t, v], i) => `${i ? "L" : "M"}${number(xTrace(t), 2)} ${number(yTrace(v), 2)}`).join(" ")} fill="none" stroke="#24594f" strokeWidth="2.5"/>
        <path d={`M${xTrace(time)} 27 V172`} stroke="#64439c" strokeWidth="1.5"/><circle cx={xTrace(time)} cy={yTrace(state.voltageMv)} r="5" fill="#64439c" stroke="#f8faf2" strokeWidth="2"/>
        <text x="5" y="43" fontSize="10">1 mV</text><text x="13" y="103" fontSize="10">0</text>{[0, 200, 400, 600, 800].map(t => <text key={t} x={xTrace(t)} y="191" fontSize="11" textAnchor="middle">{t} ms</text>)}
      </svg></div>
      <p className={s.traceNote}><strong>Grid spacing: 50 ms horizontally · 0.5 mV vertically.</strong> Prescribed P/QRS/T source functions, not a cellular simulation or measured heartbeat. Changing a lead or reversing inputs changes the measurement; it does not change cardiac activity.</p>
    </figure>
    <div className={s.takeaway}><strong>Where does the vector start?</strong><p>The violet arrow is drawn near the heart for reference. Its length and direction represent an equivalent current dipole, <b>p</b>, summarizing the distributed source in this model. It is not emitted by an electrode. The dashed lead axis represents measurement sensitivity. Neither arrow is a stream of ions.</p></div>
    <TissueBoundary/>
    <details className={s.equations}><summary>Inspect the equations, units, assumptions and source evidence</summary><div className={s.depth}>
      <h3>One forward calculation drives the diagrams</h3>
      <MathText tex={"\\phi(\\mathbf r,t)=\\frac{\\mathbf p(t)\\cdot\\mathbf r}{4\\pi\\sigma|\\mathbf r|^3},\\qquad V_{\\rm lead}=\\phi(\\mathbf r_+)-\\phi(\\mathbf r_-)"} reading="Potential equals the dipole moment dotted with the source-to-electrode position, divided by four pi times conductivity times distance cubed. Lead voltage equals positive-input potential minus negative-input potential."/>
      <p><strong>Exact for the selected idealization.</strong> A quasistatic point current dipole in an infinite homogeneous isotropic conductor, with φ → 0 at infinity. This is a closed-form calculation, not a numerical torso solution. Each field tile and electrode uses this equation. The trace repeats the electrode subtraction across time. The chamber boundary and cellular illustrations explain mechanisms; they are not inputs to this calculation. <a href={sources.field}>Source-field derivation ↗</a></p>
      <dl className={s.symbols}><div><dt>p(t) · A m</dt><dd>Current dipole moment; prescribed synthetic source. Current times source–sink separation, directed from sink to source. It is not a charge dipole in C m.</dd></div><div><dt>r · m</dt><dd>Position from source origin to field point. Frontal slice z = 0; axes point to the patient’s left and inferiorly.</dd></div><div><dt>σ · S/m</dt><dd>{CONDUCTOR.conductivity} S/m, a chosen illustrative uniform conductivity; not fitted to an individual torso.</dd></div><div><dt>φ · V</dt><dd>Potential relative to infinity. Labels convert volts to mV. Only differences enter the lead reading.</dd></div><div><dt>R · m</dt><dd>{CONDUCTOR.electrodeRadius} m, chosen equal electrode radius. RA = (−√3 R/2, −R/2), LA = (√3 R/2, −R/2), LL = (0, R).</dd></div><div><dt>p scale</dt><dd>The existing synthetic source components are multiplied by 4πσR²/(1000√3) A m per numerical source unit, explicitly chosen to retain the teaching waveform’s mV scale. No physiological fit is implied.</dd></div></dl>
      <MathText tex={"V_{\\rm lead}=\\mathbf p\\cdot\\mathbf L,\\qquad\\mathbf L=\\frac1{4\\pi\\sigma}\\left(\\frac{\\mathbf r_+}{|\\mathbf r_+|^3}-\\frac{\\mathbf r_-}{|\\mathbf r_-|^3}\\right)"} reading="Lead voltage equals the dipole dotted with the lead field at the source. In this conductor, the lead field is the scaled difference of the two electrode position vectors divided by their cubed lengths."/>
      <p><strong>L · V/(A m)</strong> is measurement sensitivity at the fixed source. In this particular centered equilateral geometry, it is parallel to the dashed negative-to-positive lead axis. A general torso lead field varies spatially and need not follow a straight wire between electrodes. A perpendicular dipole can give zero in one lead while remaining visible in another. The potential-difference definition is exact; a single cardiac vector describing a distributed heart is an approximation. <a href={sources.lead}>Distributed sources and volume-conductor theory · Geselowitz (1967) ↗</a></p>
      <h3>What this explanation does and does not establish</h3><ul><li><strong>Cellular mechanism:</strong> the ionic close-up summarizes working ventricular muscle. It omits detailed channel kinetics, calcium handling, fiber anisotropy and nodal differences. <a href={sources.ionic}>ten Tusscher et al. (2004), human ventricular model ↗</a></li><li><strong>Activation:</strong> Durrer et al. mapped activation in seven isolated human hearts. That supports multiple ventricular breakthrough sites and organized activation; it does not validate this illustrative chamber shape or source waveform. <a href={sources.activation}>Durrer et al. (1970) ↗</a></li><li><strong>Recovery:</strong> the tissue-boundary sign exercise is a one-dimensional explanation. Recovery timing follows regional action-potential duration and activation time; it is not generally a traveling excitation wave. A real T wave cannot be explained by reversing one arrow alone. Mapping in nine perfused pig hearts found contributions from multiple anatomical recovery gradients, not only one transmural direction. <a href="https://doi.org/10.1161/CIRCEP.113.001622">Meijborg et al. (2014), animal preparation ↗</a> · <a href={sources.front}>Local polarity derivation ↗</a></li><li><strong>Inference limit:</strong> a single voltage difference cannot uniquely recover a spatial source vector. Real torso conductivity, lungs, blood, geometry, electrode contact, filtering and distributed sources affect the recording. This view is a forward teaching model and never fits an uploaded record.</li><li><strong>Instrumentation:</strong> surface ECG acquisition senses differential potentials with high input impedance. Some electronics use right-leg common-mode feedback, input bias return or lead-off detection currents. Those circuits are distinct from pacing and do not explain the origin of normal cardiac excitation. <a href={sources.circuit}>ADS129x acquisition datasheet ↗</a></li></ul>
      <p>Original SVG illustrations and source code by this project. Scientific references support the stated principles; they do not constitute external review of this implementation. Recorded source measurements remain in the <Link href="/work/vector-ekg-reasonos/workspace">ECG workspace</Link>.</p>
    </div></details>
    {!active && <p className={s.quiet}>The equivalent source is zero at this teaching-model instant; the heart and membrane remain biologically active.</p>}
  </section>;
}
