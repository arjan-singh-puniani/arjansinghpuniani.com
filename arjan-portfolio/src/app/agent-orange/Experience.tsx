"use client";

import { useEffect, useState } from "react";
import { regions, Scene } from "./Scene";

export function Experience() {
  const [region, setRegion] = useState<(typeof regions)[number]>("Brain");
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => { setReducedMotion(matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);
  return <section className="ao-experience" aria-labelledby="ao-explore-title">
    <div className="ao-experience-heading"><div><p className="ao-eyebrow">Interactive anatomy</p><h2 id="ao-explore-title">Explore the pathway</h2></div><label><input type="checkbox" checked={reducedMotion} onChange={event => setReducedMotion(event.target.checked)} /> Pause ambient motion</label></div>
    <div className="ao-viewer"><Scene region={region} reducedMotion={reducedMotion}/><div className="ao-controls" aria-label="Anatomical regions">{regions.map(item=><button key={item} type="button" aria-pressed={region===item} onClick={()=>setRegion(item)}>{item}</button>)}</div></div>
    <p className="ao-caption"><strong>{region}.</strong> The model is a schematic orientation aid and does not represent a validated individual brain atlas or exposure-specific tissue findings.</p>
  </section>;
}
