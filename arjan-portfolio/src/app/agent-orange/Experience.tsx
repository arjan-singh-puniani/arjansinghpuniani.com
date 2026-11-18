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
    <p className="ao-caption"><strong>{region}.</strong> {region === "Brain" ? <>Whole-brain geometry is the Allen Human Reference Atlas 3D reference organ, mirrored to form a whole brain and resized for the Visible Human body. It is a generic reference model, not a veteran scan or exposure-specific finding. <a href="https://3d.nih.gov/entries/20960?version=1">NIH 3D model ↗</a> · CC BY 4.0.</> : region.endsWith("molecule") ? `Atom coordinates and bond orders come from PubChem 3D records (${region === "2,4-D molecule" ? "CID 1486" : region === "2,4,5-T molecule" ? "CID 1480" : "CID 15625"}). Atom and bond sizes are illustrative.` : ["Substantia nigra", "Striatum", "Subcortical atlas"].includes(region) ? <>Region surfaces derive from the CIT168 1 mm MNI template label map. Surfaces are smoothed for display; this is a group template, not a person or exposure-specific scan. <a href="https://doi.org/10.1038/sdata.2018.63">Atlas paper ↗</a></> : "The dopamine pathway is a schematic orientation aid, not an observed exposure-specific finding."}</p>
  </section>;
}
