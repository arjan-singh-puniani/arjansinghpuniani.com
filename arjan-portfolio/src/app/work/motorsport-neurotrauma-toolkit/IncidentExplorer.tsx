"use client";

import { useEffect, useState } from "react";
import { impactDirections, stages } from "@/content/neurotrauma";
import { IncidentCar } from "./IncidentCar";
import { Cite } from "./Cite";
import styles from "./neurotrauma.module.css";

export function IncidentExplorer() {
  const [selected, setSelected] = useState(0);
  const [directionIndex, setDirectionIndex] = useState(0);
  const [interactive, setInteractive] = useState(false);
  useEffect(() => setInteractive(true), []);
  const stage = stages[selected];
  const direction = impactDirections[directionIndex];
  return <div className={styles.explorer}>
    <div className={styles.scenarioLabel}><span>Incident study · Red Bull RB19</span><span>Choose a direction. Follow the information.</span></div>
    <noscript><p className={styles.noScript}>Without JavaScript, <a href="#direction-transcript">read all four direction comparisons</a> and <a href="#incident-transcript">the full incident walkthrough</a>. Use your browser’s Print command for the fixed M01 handoff.</p></noscript>
    <div className={styles.stageControls} role="group" aria-label="Explore incident stages">
      {stages.map((item, index) => <button key={item.name} disabled={!interactive} type="button" aria-pressed={selected === index} aria-controls="incident-view" onClick={() => setSelected(index)}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{item.name}<span className={styles.stageIndicator} aria-hidden="true">{selected === index ? "●" : "○"}</span></button>)}
    </div>
    <div id="incident-view" className={styles.incidentView}>
      <div className={styles.incidentGraphic}>
        <fieldset id="impact-directions" className={styles.directionControls} disabled={!interactive}>
          <legend>Choose impact direction</legend>
          <div className={styles.directionChoices}>{impactDirections.map((item,index)=><label key={item.id} data-selected={directionIndex === index}>
            <input type="radio" name="impact-direction" value={item.id} checked={directionIndex === index} aria-controls="direction-information" onChange={()=>setDirectionIndex(index)}/>{item.name}
          </label>)}</div>
          <div className={styles.directionHint}><p>Fictional driver report held constant.</p><a href="#direction-information">Information ↓</a></div>
        </fieldset>
        <IncidentCar direction={direction} interactive={interactive}/>
        <p className={styles.graphicNote}>{selected === 0 ? "Contact location ≠ head loading" : selected === 1 ? "Driver report ≠ clinical finding" : selected === 2 ? "Assessment requested ≠ assessment complete" : "Handoff prepared ≠ handoff acknowledged"}</p>
        <div className={styles.recordPath} aria-label="Information available at this stage">{["Incident context", "Driver + responder", "Medical request", "Handoff record"].map((label,i)=><span key={label} data-available={i<=selected}>{i<=selected ? "✓" : "—"} {label}</span>)}</div>
      </div>
      <div className={styles.incidentCopy} aria-live="polite" aria-atomic="true">
        <p className={styles.overline}>Stage {selected+1} of 4 · {stage.name}</p>
        <h3>{stage.title}</h3><p>{selected === 0 ? `${direction.context} ${stage.description}` : stage.description}</p>
        <section id="direction-information" className={styles.directionInformation} tabIndex={-1} aria-labelledby="direction-information-heading"><h4 id="direction-information-heading">Information to seek · {direction.name}</h4><ul>{direction.questions.map(text=><li key={text}>{text}</li>)}</ul><p>Engineering prompts for discussion. <Cite id="biomechanics"/> <a href="#impact-directions">Change direction ↑</a></p></section>
        <div className={styles.known}><h4>{selected === 0 ? "Set in this comparison" : "Available in this example"}</h4><ul>{stage.known.map(text=><li key={text}>{text}</li>)}</ul></div>
        <div className={styles.unknown}><h4>Still unknown</h4><ul>{[...stage.unknown,direction.unknown].map(text=><li key={text}>{text}</li>)}</ul></div>
        <p className={styles.stageLesson}>{stage.lesson} <Cite id={stage.source}/></p>
        {selected === 3 && <><p className={styles.fixedExample}>The printable M01 worksheet below is a fixed front-left example. Direction controls do not rewrite that record.</p><a className={styles.inlineLink} href="#handoff">Inspect the fictional handoff</a></>}
      </div>
    </div>
    <details id="incident-transcript" className={styles.transcript}><summary>Read the complete incident as text</summary><div>{stages.map(item=><article key={item.name}><h3>{item.name}</h3><p>{item.description}</p><p><strong>Available:</strong> {item.known.join(" ")}</p><p><strong>Unknown:</strong> {item.unknown.join(" ")}</p><p>{item.lesson} <Cite id={item.source}/></p></article>)}</div></details>
    <details id="direction-transcript" className={`${styles.transcript} ${styles.directionTranscript}`}><summary>Read all four direction comparisons</summary><div>{impactDirections.map(item=><section key={item.id}><h3>{item.name}</h3><p>{item.context}</p><p><strong>Information to seek:</strong> {item.questions.join(" ")}</p><p><strong>Still unknown:</strong> {item.unknown} Direction alone does not establish head loading or neurological status.</p></section>)}</div><p className={styles.directionTextBoundary}>These are authored information prompts, not a validated investigation or clinical protocol. <Cite id="biomechanics"/> <Cite id="concussion"/></p></details>
  </div>;
}

export function PrintHandoff() {
  return <button type="button" className={styles.secondaryButton} onClick={() => window.print()}>Print the fictional handoff</button>;
}
