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
    <p className="ao-caption"><strong>{region}.</strong> {region === "2,4-D molecule" ? "Atom coordinates and bond order use the PubChem 3D conformer for CID 1486. Ball-and-stick sizes and materials are illustrative." : "The brain model is schematic. It is not a validated individual atlas or a depiction of exposure-specific tissue findings."}</p>
  </section>;
}
