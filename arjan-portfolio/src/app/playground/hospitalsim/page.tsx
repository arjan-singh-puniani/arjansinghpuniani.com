import type { Metadata } from "next";
import Link from "next/link";
import OrthoShowcase, { orthoPreview } from "../OrthoShowcase";
import HospitalPlayer from "./HospitalPlayer";
import styles from "./hospital.module.css";
const description = "Play Ortho Lab’s interactive 3D fracture case or build and manage a miniature hospital.";
export const metadata: Metadata = {title:"hospitalSIM",description,alternates:{canonical:"/playground/hospitalsim"},openGraph:{title:"hospitalSIM | Arjan Singh Puniani",description,images:[orthoPreview]}};
export default function HospitalPage(){return <>
<header className={`shell ${styles.hero}`}><Link className={styles.back} href="/playground">← Playground</Link><h1>hospitalSIM</h1></header>
<div className="shell"><OrthoShowcase clinicHref="#clinic" /></div>
<section className={`shell ${styles.experience}`} id="clinic" aria-labelledby="clinic-title">
  <div className={styles.sectionHead}><h2 id="clinic-title">Run the hospital</h2><p className={styles.intro}>Start with an empty clinic. Build a reception desk, hire your first team, and grow as new queues form.</p></div>
  <HospitalPlayer />
</section>
<section className={`shell ${styles.modes}`} aria-label="Ways to play">{[["01","Build","Begin with no rooms or staff and a $9,000 opening fund. Your first chapter introduces one useful choice at a time, with 16-minute shifts once you open. Land shows the whole estate when you are ready to grow."],["02","Follow","Follow everyday clothes → check-in → gown change → GP. A completed visit earns its fee. Add a pharmacist or the specific booked specialist service when a new queue forms."],["03","Investigate","Replay the same arrivals, compare a checkpoint with a new plan, or open REPLISOME at the science workstation."]].map(([n,title,text])=><article key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p></article>)}</section>
<section className={`shell ${styles.notes}`}><div><p className="eyebrow">Engineering record</p><h2>Playable.<br/>Still being evaluated.</h2></div><div><p>This is an original AI-assisted game and engineering project for Arjan Singh Puniani. Substantial AI assistance covered implementation, Blender modeling, animation, testing and documentation. The source preserves that record.</p><p>All patients, priorities, pathways, timings and budgets are fictional abstractions. This playable release candidate remains an engineering prototype, with no clinician review, learner study, validated learning benefit or accessibility conformance claim. Procedural humans and task contact remain below the supplied visual reference.</p><p><Link href="/work/hospitalsim">Project record and limitations</Link> · <a href="/hospitalsim/docs/people-presence.html">First-minute film, animations and verification</a> · <Link href="/playground/replisome">Standalone REPLISOME</Link></p><p className={styles.small}>Device-local saves. No hospital gameplay analytics. JavaScript and WebGL required. Use the in-game device check on an actual iPhone; a desktop narrow viewport is not a phone benchmark.</p></div></section></>}
