"use client";

import { useMemo, useState } from "react";
import { attemptTransformation, initialSnapshot, replayTrace, type KernelSnapshot, type Operator, type Provenance } from "@/lib/reasonos/kernel";
import { bestCandidatePath, correctedQt, frontalAxis, intervalMs } from "@/lib/reasonos/vector";

const learnerProvenance = (method: string): Provenance => ({ source: "Bundled synthetic ECG", method, verification: "user-confirmed", witnessType: "learner-derived" });
const systemProvenance = (method: string): Provenance => ({ source: "Recorded learner inputs", method, verification: "synthetic-reference", witnessType: "application-calculated" });

const wave = "M0 90 L24 90 L31 87 L38 90 L56 90 L61 76 L66 90 L80 90 L87 35 L92 132 L99 77 L105 90 L128 90 L137 84 L146 90 L178 90 L186 87 L194 90 L212 90 L218 73 L224 90 L239 90 L246 39 L251 130 L258 76 L265 90 L288 90 L298 83 L310 90 L342 90 L350 87 L358 90 L376 90 L382 75 L388 90 L403 90 L410 36 L416 131 L423 77 L430 90 L452 90 L462 84 L474 90 L510 90 L518 87 L526 90 L544 90 L550 74 L556 90 L571 90 L578 38 L584 130 L591 77 L598 90 L620 90 L630 83 L642 90 L680 90 L688 87 L696 90 L714 90 L720 75 L726 90 L741 90 L748 37 L754 131 L761 77 L768 90 L790 90 L800 84 L812 90";

const steps = ["Inspect", "Select", "Calibrate", "Measure", "Hypothesize", "Attach evidence", "Challenge", "Review trace"];

export function ReasonOSLab() {
  const [snapshot, setSnapshot] = useState<KernelSnapshot>(() => initialSnapshot());
  const [points, setPoints] = useState<number[]>([]);
  const [hypothesis, setHypothesis] = useState("Regular narrow-complex rhythm");
  const [leadI, setLeadI] = useState(6);
  const [avf, setAvf] = useState(4);
  const [qt, setQt] = useState(380);
  const [rr, setRr] = useState(820);
  const [structured, setStructured] = useState(false);
  const currentStateId = snapshot.states.at(-1)?.id ?? "state-000-source";
  const completed = Math.min(snapshot.trace.length, steps.length - 1);
  const measurement = points.length === 2 ? intervalMs(points[1] - points[0], { speedMmPerSecond: 25, gainMmPerMv: 10, pixelsPerMm: 20 }) : null;
  const axis = frontalAxis(leadI, avf);
  const qtc = correctedQt(qt, rr);
  const path = bestCandidatePath({ regularity: 1, pBeforeQrs: .8, narrowQrs: measurement && measurement < 120 ? .8 : 0 });

  const record = (operator: Operator, summary: string, provenance: Provenance, options?: { accepted?: boolean; evidenceRefs?: string[]; revisionOf?: string }) => {
    setSnapshot((current) => attemptTransformation(current, {
      operator,
      actor: operator === "Calibrate" ? "system" : "learner",
      inputStateIds: [current.states.at(-1)?.id ?? "state-000-source"],
      summary,
      provenance,
      domainAccepted: options?.accepted,
      evidenceRefs: options?.evidenceRefs,
      revisionOf: options?.revisionOf,
    }));
  };

  const selectPoint = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 820);
    setPoints((current) => current.length >= 2 ? [x] : [...current, x]);
    record("Select", `Explicit cursor selection at x=${x}`, learnerProvenance("cursor-derived proxy"));
  };

  const replayMatches = useMemo(() => {
    const replayed = replayTrace(snapshot.trace);
    return replayed.states.map((state) => state.id).join("|") === snapshot.states.map((state) => state.id).join("|");
  }, [snapshot]);

  return <div className="lab-shell">
    <aside className="lab-steps" aria-label="Guided demonstration steps"><p className="reasonos-label">Guided vertical slice</p><ol>{steps.map((step, index) => <li key={step} className={index <= completed ? "complete" : ""}><span>{String(index + 1).padStart(2, "0")}</span>{step}</li>)}</ol><button className="reasonos-button secondary" onClick={() => { setSnapshot(initialSnapshot()); setPoints([]); }}>Reset demonstration</button></aside>
    <section className="ecg-workspace" aria-labelledby="workspace-title">
      <div className="lab-heading"><div><p className="reasonos-label">Synthetic source · Lead II</p><h2 id="workspace-title">Measurement workspace</h2></div><span className="prototype-badge">Not for diagnosis</span></div>
      <p>This generated waveform contains no patient information. Select two points to create a cursor-derived measurement.</p>
      <div className="ecg-canvas">
        <svg viewBox="0 0 820 180" role="img" aria-label="Synthetic electrocardiogram waveform. Click two points to measure an interval." onClick={selectPoint}>
          <defs><pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth=".6"/></pattern><pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse"><rect width="50" height="50" fill="url(#smallGrid)"/><path d="M50 0H0V50" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="1"/></pattern></defs>
          <rect width="820" height="180" fill="url(#grid)"/><path d={wave} className="ecg-wave"/>{points.map((x, index) => <g key={`${x}-${index}`}><line x1={x} x2={x} y1="15" y2="165" className="caliper"/><circle cx={x} cy="25" r="9" className="caliper-point"/><text x={x} y="29" textAnchor="middle">{index + 1}</text></g>)}</svg>
      </div>
      <div className="lab-controls">
        <button onClick={() => record("Inspect", "Inspected bundled synthetic Lead II waveform", learnerProvenance("visual inspection"))}>Record inspection</button>
        <button onClick={() => record("Calibrate", "Verified synthetic scale: 25 mm/s and 10 mm/mV", systemProvenance("bundled source metadata"))}>Verify calibration</button>
        <button disabled={measurement === null} onClick={() => record("Measure", `Cursor-derived interval: ${measurement} ms`, systemProvenance("two-point coordinate difference × 2 ms/px"), { evidenceRefs: points.map((point) => `x=${point}`) })}>Record {measurement === null ? "measurement" : `${measurement} ms`}</button>
      </div>
      <div className="hypothesis-panel">
        <label>Working hypothesis<input value={hypothesis} onChange={(event) => setHypothesis(event.target.value)} /></label>
        <div className="lab-controls"><button onClick={() => record("Hypothesize", hypothesis, learnerProvenance("learner-entered interpretation"))}>Form hypothesis</button><button onClick={() => record("AttachEvidence", "Attached measured interval and visual regularity", learnerProvenance("explicit evidence selection"), { evidenceRefs: measurement ? [`interval=${measurement}ms`, "visual-regularity"] : ["visual-regularity"] })}>Attach evidence</button><button onClick={() => record("Challenge", "Rejected unsupported claim: rhythm diagnosis without sufficient evidence", learnerProvenance("contradiction test"), { accepted: false, evidenceRefs: ["single-lead synthetic source"] })}>Test contradiction</button><button onClick={() => record("Revise", `${hypothesis}; interpretation remains provisional`, learnerProvenance("learner revision"), { revisionOf: currentStateId })}>Revise</button></div>
      </div>
      <div className="lab-derived-grid" aria-label="Deterministic ECG calculations">
        <article><p className="reasonos-label">Frontal axis</p><label>Lead I net<input type="number" value={leadI} onChange={(event) => setLeadI(Number(event.target.value))}/></label><label>aVF net<input type="number" value={avf} onChange={(event) => setAvf(Number(event.target.value))}/></label><strong>{axis.degrees}° · {axis.quadrant}</strong><button onClick={() => record("Measure", `Application-calculated frontal axis: ${axis.degrees} degrees (${axis.quadrant} quadrant)`, systemProvenance("atan2(aVF net, Lead I net)"), { evidenceRefs: [`leadI=${leadI}`, `aVF=${avf}`] })}>Record axis</button></article>
        <article><p className="reasonos-label">Corrected QT</p><label>QT, ms<input type="number" value={qt} onChange={(event) => setQt(Number(event.target.value))}/></label><label>RR, ms<input type="number" value={rr} onChange={(event) => setRr(Number(event.target.value))}/></label><strong>Bazett {qtc.bazettMs} ms · Fridericia {qtc.fridericiaMs} ms</strong><button onClick={() => record("Measure", `Application-calculated QTc: Bazett ${qtc.bazettMs} ms; Fridericia ${qtc.fridericiaMs} ms`, systemProvenance("recorded QT and RR inputs"), { evidenceRefs: [`qt=${qt}`, `rr=${rr}`] })}>Record QTc</button></article>
        <article><p className="reasonos-label">Candidate path</p><strong>{path.label}</strong><span>{Math.round(path.score * 100)}% structural match</span><small>{path.status}; {path.expertTraces} expert traces. This is not validated consensus.</small><button onClick={() => record("AttachEvidence", `Best candidate pathway: ${path.label}; structural score ${path.score.toFixed(2)}`, systemProvenance("weighted Jaccard comparison against versioned candidate path"), { evidenceRefs: [path.id, `status=${path.status}`] })}>Record comparison</button></article>
      </div>
    </section>
    <section className="trace-inspector" aria-labelledby="trace-title" aria-live="polite">
      <div className="lab-heading"><div><p className="reasonos-label">Append-only record</p><h2 id="trace-title">Reasoning trace</h2></div><button className="trace-toggle" onClick={() => setStructured((value) => !value)}>{structured ? "Timeline" : "Structured data"}</button></div>
      <div className={`replay-status ${replayMatches ? "valid" : "invalid"}`}><span /> Replay {replayMatches ? "reproduces accepted state" : "diverged"}</div>
      {snapshot.trace.length === 0 ? <div className="trace-empty"><strong>No transformations recorded.</strong><p>Begin with “Record inspection.” Every accepted and rejected attempt will appear here.</p></div> : structured ? <pre className="trace-json">{JSON.stringify(snapshot.trace, null, 2)}</pre> : <ol className="trace-timeline">{snapshot.trace.map((event) => <li key={event.id} className={event.accepted ? "accepted" : "rejected"}><span className="trace-sequence">{String(event.sequence).padStart(2, "0")}</span><div><p><strong>{event.operator}</strong><span>{event.accepted ? "Accepted" : "Rejected"}</span></p><p>{event.summary}</p><details><summary>Inspect provenance</summary><dl><div><dt>Actor</dt><dd>{event.actor}</dd></div><div><dt>Witness</dt><dd>{event.provenance.witnessType}</dd></div><div><dt>Method</dt><dd>{event.provenance.method}</dd></div><div><dt>Event</dt><dd>{event.id}</dd></div></dl></details></div></li>)}</ol>}
    </section>
  </div>;
}
