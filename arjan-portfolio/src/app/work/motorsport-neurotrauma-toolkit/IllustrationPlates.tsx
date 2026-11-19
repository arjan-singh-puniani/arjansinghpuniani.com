import Image from "next/image";
import styles from "./neurotrauma.module.css";

export function CockpitImage({ hero = false }: { hero?: boolean }) {
  return <Image src="/images/neurotrauma/cockpit-cutaway-plate.webp" width={1536} height={1024}
    alt="Illustrated three-quarter cutaway of a helmeted driver, with a shoulder-borne frontal head restraint, helmet tether, teal harness, headrest padding and sectioned composite cockpit beneath a halo. Generic equipment relationships, not an installation drawing."
    sizes={hero ? "(max-width: 800px) 92vw, 600px" : "(max-width: 800px) 90vw, 820px"}
    priority={hero}/>;
}

const cockpitKey = [
  { x: 925, y: 80, name: "Halo", detail: "Structure above and around the exposed cockpit." },
  { x: 530, y: 155, name: "Helmet", detail: "Shell and visor shown as protective equipment." },
  { x: 319, y: 491, name: "FHR yoke", detail: "Shoulder-borne device beneath the shoulder straps." },
  { x: 287, y: 363, name: "Helmet tether", detail: "Connection between helmet anchorage and restraint." },
  { x: 528, y: 613, name: "Harness", detail: "Shoulder straps and central buckle are distinguished." },
  { x: 97, y: 655, name: "Composite tub", detail: "Sectioned wall and seat context; geometry is illustrative." },
] as const;

const brainKey = [
  { x: 1040, y: 193, name: "Cerebrum", detail: "Medial cortical surface with gyri and sulci." },
  { x: 771, y: 269, name: "Corpus callosum", detail: "White-matter arch above the central deep structures." },
  { x: 488, y: 586, name: "Cerebellum", detail: "Posterior folia and branching white matter in section." },
  { x: 726, y: 614, name: "Brainstem", detail: "Pons and medulla continuing toward the spinal cord." },
  { x: 780, y: 64, name: "Cranial bone", detail: "Cut edge of the skull enclosing the cranial cavity." },
] as const;

function PlateMarkers({ items }: { items: typeof cockpitKey | typeof brainKey }) {
  return <svg className={styles.plateMarkers} viewBox="0 0 1536 1024" aria-hidden="true">
    {items.map((item,index)=><g key={item.name} transform={`translate(${item.x} ${item.y})`}>
      <circle r="26" fill="#173342" stroke="#f2f6f5" strokeWidth="3"/>
      <text textAnchor="middle" dominantBaseline="central" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" fontSize="26" fontWeight="700">{index+1}</text>
    </g>)}
  </svg>;
}

export function CockpitPlate() {
  return <>
    <div className={styles.plateImage}><CockpitImage/><PlateMarkers items={cockpitKey}/></div>
    <ol className={styles.plateKey}>{cockpitKey.map(item=><li key={item.name}><strong>{item.name}</strong><span>{item.detail}</span></li>)}</ol>
    <a className={styles.plateLink} href="/images/neurotrauma/cockpit-cutaway-plate.webp">View full-size cockpit illustration</a>
  </>;
}

export function BrainPlate() {
  return <>
    <div className={styles.plateImage}>
      <Image src="/images/neurotrauma/brain-sagittal-plate.webp" width={1536} height={1024}
        alt="AI-assisted educational midsagittal head illustration facing right: cortical folds, corpus callosum, deep midline structures, cerebellar folia and branching white matter, pons, medulla, upper spinal cord and cranial cut edge. No lesion, patient imaging or measured tissue response is depicted."
        sizes="(max-width: 800px) 90vw, 760px"/>
      <PlateMarkers items={brainKey}/>
    </div>
    <ol className={styles.plateKey}>{brainKey.map(item=><li key={item.name}><strong>{item.name}</strong><span>{item.detail}</span></li>)}</ol>
    <a className={styles.plateLink} href="/images/neurotrauma/brain-sagittal-plate.webp">View full-size anatomical illustration</a>
  </>;
}
