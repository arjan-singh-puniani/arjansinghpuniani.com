"use client";

import { useState } from "react";
import { stages } from "@/content/neurotrauma";
import { IncidentCar } from "./IncidentCar";
import { Cite } from "./Cite";
import styles from "./neurotrauma.module.css";

export function IncidentExplorer() {
  const [selected, setSelected] = useState(0);
  const stage = stages[selected];
  return <div className={styles.explorer}>
    <div className={styles.scenarioLabel}><span>Fictional case M01</span><span>Illustrative sequence · no telemetry</span></div>
    <noscript><p className={styles.noScript}>For the full scenario without JavaScript, <a href="#incident-transcript">open the text walkthrough</a>. Use your browser’s Print command for the fictional handoff.</p></noscript>
    <div className={styles.stageControls} role="group" aria-label="Explore incident stages">
      {stages.map((item, index) => <button key={item.name} type="button" aria-pressed={selected === index} aria-controls="incident-view" onClick={() => setSelected(index)}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{item.name}<span className={styles.stageIndicator} aria-hidden="true">{selected === index ? "●" : "○"}</span></button>)}
    </div>
    <div id="incident-view" className={styles.incidentView}>
      <div className={styles.incidentGraphic}>
        <div className={styles.figureTop}><span>{stage.label}</span><span>Plan view · front →</span></div>
        <IncidentCar emphasis={selected === 0 ? "car" : "driver"}/>
        <p className={styles.graphicNote}>{selected === 0 ? "Contact location ≠ head loading" : selected === 1 ? "Driver report ≠ clinical finding" : selected === 2 ? "Assessment requested ≠ assessment complete" : "Handoff prepared ≠ handoff acknowledged"}</p>
        <div className={styles.recordPath} aria-label="Information available at this stage">{["Incident context", "Driver + responder", "Medical request", "Handoff record"].map((label,i)=><span key={label} data-available={i<=selected}>{i<=selected ? "✓" : "—"} {label}</span>)}</div>
      </div>
      <div className={styles.incidentCopy} aria-live="polite" aria-atomic="true">
        <p className={styles.overline}>Stage {selected+1} of 4 · {stage.name}</p>
        <h3>{stage.title}</h3><p>{stage.description}</p>
        <div className={styles.known}><h4>Available in this example</h4><ul>{stage.known.map(text=><li key={text}>{text}</li>)}</ul></div>
        <div className={styles.unknown}><h4>Still unknown</h4><ul>{stage.unknown.map(text=><li key={text}>{text}</li>)}</ul></div>
        <p className={styles.stageLesson}>{stage.lesson} <Cite id={stage.source}/></p>
        {selected === 3 && <a className={styles.inlineLink} href="#handoff">Inspect the fictional handoff</a>}
      </div>
    </div>
    <details id="incident-transcript" className={styles.transcript}><summary>Read the complete incident as text</summary><div>{stages.map(item=><article key={item.name}><h3>{item.name}</h3><p>{item.description}</p><p><strong>Available:</strong> {item.known.join(" ")}</p><p><strong>Unknown:</strong> {item.unknown.join(" ")}</p><p>{item.lesson} <Cite id={item.source}/></p></article>)}</div></details>
  </div>;
}

export function PrintHandoff() {
  return <button type="button" className={styles.secondaryButton} onClick={() => window.print()}>Print the fictional handoff</button>;
}
