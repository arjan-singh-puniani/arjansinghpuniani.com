import type { Metadata } from "next";
import Link from "next/link";
import { evidenceReviewed, handoffFields, sources } from "@/content/neurotrauma";
import { MotionDrawing } from "./Drawings";
import { BrainPlate, CockpitPlate } from "./IllustrationPlates";
import { VehiclePoster } from "./VehiclePoster";
import { IncidentExplorer, PrintHandoff } from "./IncidentExplorer";
import { Cite } from "./Cite";
import styles from "./neurotrauma.module.css";

export const metadata: Metadata = {
  title: "From Impact to Informed Care · Motorsport Neurotrauma",
  description: "Arjan Singh Puniani’s independent motorsport neurotrauma project: explore an F1-focused fictional incident, protection systems, evidence gaps and an educational medical handoff.",
  alternates: { canonical: "/work/motorsport-neurotrauma-toolkit" },
};

export default function MotorsportNeurotraumaToolkit() {
  return <div className={styles.page}>
    <header className={styles.hero}>
      <div className={styles.wrap}>
        <div className={styles.projectMasthead}><Link href="/work">Selected work</Link><span>Independent · F1 research</span></div>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.overline}>Mechanism-to-Medical Center</p>
            <h1>From impact<br/>to <em>informed</em><span className={styles.titleEnd}> care.</span></h1>
            <p className={styles.heroDescription}>An independent F1-focused study of incident evidence and neurological handoff.</p>
            <div className={styles.actions}><a className={styles.primaryButton} href="#incident">Explore the incident <span aria-hidden="true">＋</span></a><a className={styles.heroSourceLink} href="#methods">Methods & sources</a></div>
          </div>
          <figure className={styles.heroFigure}>
            <div className={styles.figureTop}><span>Red Bull RB19</span><span>2023 · vehicle study</span></div>
            <div className={styles.heroCar} data-hero-illustration><VehiclePoster hero/></div>
            <div className={styles.heroCallout}><span className={styles.crosshair} aria-hidden="true">＋</span><div><strong>Protected cockpit.<br/>Unresolved clinical picture.</strong><p>A safety system manages a hazard.<br/>It does not examine a person.</p></div></div>
            <figcaption>Model by Redgrund · CC BY 4.0. Rotate, inspect and compare impact directions in the study below. <Cite id="rb19"/></figcaption>
          </figure>
        </div>
        <div className={styles.heroFooter}><span>Independent educational prototype</span><span>Research, information design & development by Arjan Singh Puniani</span><span>No FIA or F1 affiliation</span></div>
      </div>
    </header>

    <nav className={styles.sectionNav} aria-label="Project sections"><div className={styles.wrap}><a href="#incident">The incident</a><a href="#protection">Protection</a><a href="#information">Information gap</a><a href="#handoff">The handoff</a><a href="#contribution">My contribution</a><a href="#methods">Evidence</a></div></nav>

    <section className={`${styles.section} ${styles.introduction}`} aria-labelledby="project-question">
      <div className={`${styles.wrap} ${styles.introGrid}`}>
        <div><p className={styles.overline}>The design question</p><h2 id="project-question">What survives<br/>the handoff?</h2></div>
        <div><p className={styles.lead}>Between an impact and a receiving medical team, information changes hands. Its source, timing and uncertainty need to travel with it.</p><p>I designed a pilot intake card and draft disposition flow for grassroots and regional four-wheeled motorsport. This interactive overview extends that documentation question into an F1 research context, for medical teams, safety engineers and potential collaborators.</p><p className={styles.boundary}>Educational communication design. Not a diagnostic instrument, approved event form or tool for determining fitness to race.</p><a className={styles.secondaryButton} href="/motorcycle-mechanism-lab/index.html">Open the motorcycle mechanism lab <span aria-hidden="true">↗</span></a></div>
      </div>
    </section>

    <section id="incident" className={`${styles.section} ${styles.incidentSection}`} aria-labelledby="incident-heading">
      <div className={styles.wrap}>
        <div className={styles.sectionHeading}><div><p className={styles.overline}>Follow the information</p><h2 id="incident-heading">One incident.<br/>A changing picture.</h2></div><p>Choose an impact direction, inspect the car, then follow the information from first report to handoff. The sequence is fictional; no forces or injury outcomes are calculated.</p></div>
        <IncidentExplorer/>
      </div>
    </section>

    <section id="protection" className={styles.section} aria-labelledby="protection-heading">
      <div className={styles.wrap}>
        <div className={styles.sectionHeading}><div><p className={styles.overline}>Protection & mechanism</p><h2 id="protection-heading">Layers of protection.<br/>Different jobs.</h2></div><p>Protection acts on specific hazards and loading paths. Its presence cannot establish the driver’s neurological state.</p></div>
        <div className={styles.protectionGrid}>
          <figure className={styles.occupant}><div className={styles.figureTop}><span>Occupant protection</span><span>Illustrative cutaway</span></div><CockpitPlate/><figcaption>Helmet, tether, frontal head restraint and harness in context. Conceptual cutaway, not an equipment-installation guide. <Cite id="fhr"/></figcaption></figure>
          <div className={styles.protectionNotes}>
            <article><h3>Halo</h3><p>Adds a structure around the exposed cockpit to address external-object and collision scenarios. It is not a neurological shield. <Cite id="halo"/></p></article>
            <article><h3>Helmet & frontal head restraint</h3><p>The helmet addresses impact, penetration and flame hazards. In frontal or angled-frontal crashes, the FHR links helmet forces to the harness and limits head excursion. Neither proves concussion is absent. <Cite id="helmet"/></p></article>
            <article><h3>Survival cell, cockpit & impact structures</h3><p>Manage intrusion, occupant space and impact loading through prescribed structures, padding and tests. Structural performance is not a clinical finding. <Cite id="technical"/></p></article>
            <article><h3>The circuit is part of the system</h3><p>Run-off and barriers influence how a vehicle slows or is contained. Impact direction and installation matter; a barrier’s appearance cannot quantify head loading. <Cite id="barriers"/></p></article>
          </div>
        </div>
      </div>
    </section>

    <section id="information" className={`${styles.section} ${styles.information}`} aria-labelledby="information-heading">
      <div className={styles.wrap}>
        <div className={styles.sectionHeading}><div><p className={styles.overline}>The clinical information gap</p><h2 id="information-heading">A signal is only useful<br/>with its context.</h2></div><p>My neural-engineering lens: preserve the measurement, its origin and its limits before interpreting it.</p></div>
        <div className={styles.measurementChain} aria-label="Distinct quantities, not an automatic diagnostic pipeline"><span>Vehicle motion</span><b aria-hidden="true">≠</b><span>Head motion</span><b aria-hidden="true">≠</b><span>Tissue response</span><b aria-hidden="true">≠</b><span>Clinical diagnosis</span></div>
        <div className={styles.motionGrid}>
          <figure className={styles.neuralFigure}><div className={styles.figureTop}><span>Neuroanatomical context</span><span>Midsagittal illustration</span></div><BrainPlate/><figcaption>Midsagittal anatomy: cortex, corpus callosum, cerebellum and brainstem. Boundaries are schematic; no injury or tissue strain is depicted. <Cite id="neuroanatomy"/> <Cite id="midline"/></figcaption></figure>
          <div><h3>Why there is no “concussion g-value” here</h3><p>A peak without its sensor location, coordinate frame, direction, duration and measurement quality is incomplete. Translation and rotation describe different motion; vehicle acceleration is not a direct measure of brain loading. <Cite id="biomechanics"/></p><p>This is an engineering interpretation of the measurement problem. The page performs no injury-risk calculation.</p><div className={styles.motionComponents}><MotionDrawing/><p>Conceptual whole-head motion only. The arrows do not describe movement of brain tissue within the skull. Real incidents can combine several axes.</p></div></div>
        </div>
        <div className={styles.streams}>
          <div className={styles.streamHead}><span>Information stream</span><span>What it contributes</span><span>What it leaves open</span></div>
          <article><h3>Vehicle & event</h3><p><span className={styles.streamLabel}>What it contributes</span>F1 requires an accident recorder, external and in-ear accelerometers, and a high-speed camera. <Cite id="technical"/></p><p><span className={styles.streamLabel}>What it leaves open</span>Data access, validity, timing and interpretation. Required equipment does not mean every record is immediately available.</p></article>
          <article><h3>Driver & observer</h3><p><span className={styles.streamLabel}>What it contributes</span>Reported symptoms and observed behaviour add information that vehicle data cannot supply. <Cite id="concussion"/></p><p><span className={styles.streamLabel}>What it leaves open</span>A brief apparently reassuring observation cannot exclude injury. Symptoms may develop later. <Cite id="amsterdam"/></p></article>
          <article><h3>Qualified assessment</h3><p><span className={styles.streamLabel}>What it contributes</span>History, examination and assessment tools interpreted by healthcare professionals. <Cite id="scat"/></p><p><span className={styles.streamLabel}>What it leaves open</span>SCAT6 alone cannot diagnose or exclude concussion. No test result or fitness decision is generated here.</p></article>
        </div>
        <aside className={styles.researchNote}><p className={styles.overline}>Research, not a shortcut to clearance</p><p>RESCUE-RACER’s 2021 protocol brings clinical, cognitive, ocular/vestibular and biomarker measures into longitudinal motorsport research. It is a study protocol, not an F1-validated clearance algorithm. <Cite id="rescue"/></p></aside>
      </div>
    </section>

    <section className={styles.section} aria-labelledby="authority-heading">
      <div className={`${styles.wrap} ${styles.authorityGrid}`}>
        <div><p className={styles.overline}>Responsibilities</p><h2 id="authority-heading">Coordinate the response.<br/>Keep the decisions clear.</h2><p>Medical care and competition operations need each other. Their decisions are not interchangeable.</p></div>
        <div className={styles.authorityLanes}>
          <article><span>Record</span><div><h3>Describe the event and the person</h3><p>The demonstration preserves observations, source and time. It uses “medical warning signs” rather than racing-flag terminology.</p></div></article>
          <article><span>Assess</span><div><h3>Medical leadership & clinical judgment</h3><p>The CMO leads circuit medical and rescue organisation. Diagnosis and care require qualified medical assessment. <Cite id="appendixH"/> <Cite id="concussion"/></p></div></article>
          <article><span>Control</span><div><h3>Sporting authority & medical referral</h3><p>In 2026 F1, the Race Director, CMO or Medical Delegate can require an examination. The Race Director’s session-control powers are separately specified. <Cite id="sporting"/></p></div></article>
          <article><span>Return</span><div><h3>A separate medical process</h3><p>Appendix L governs assessment and return after suspected concussion for international competitors. This page issues no clearance or return date. <Cite id="appendixL"/></p></div></article>
        </div>
      </div>
    </section>

    <section id="handoff" className={`${styles.section} ${styles.handoffSection}`} aria-labelledby="handoff-heading">
      <div className={styles.wrap}>
        <div className={styles.sectionHeading}><div><p className={styles.overline}>The educational artifact</p><h2 id="handoff-heading">Carry the uncertainty<br/>forward.</h2></div><div><p>A populated demonstration of the information structure. Open any field to inspect why it exists. Nothing here collects or stores patient information.</p><PrintHandoff/></div></div>
        <div className={styles.handoffPaper}>
          <div className={styles.paperHeader}><div><p className={styles.overline}>Mechanism-to-Medical Center</p><h3>Incident → medical handoff</h3></div><span>Fictional case<br/><strong>M01</strong></span></div>
          <p className={styles.paperBoundary}>EDUCATIONAL PROTOTYPE · FICTIONAL EXAMPLE · NOT AN APPROVED CLINICAL FORM</p>
          <dl className={styles.handoffFields}>{handoffFields.map(field=><div key={field.label}><dt>{field.label}</dt><dd><p>{field.value}</p><span className={styles.fieldSource}>{field.source}</span><details><summary>Why this field?</summary><p>{field.why} <Cite id={field.citation}/></p></details></dd></div>)}</dl>
          <div className={styles.paperStatus}><strong>Assessment pending.<br/>Receipt not confirmed.</strong><p>No diagnosis, treatment instruction, transport decision or fitness determination is supplied. Use event medical services and local emergency procedures for actual care.</p></div>
          <div className={styles.printSources}><p>Designed by Arjan Singh Puniani · Independent communication prototype · Evidence reviewed {evidenceReviewed}.</p><p>Sources and field rationale: arjansinghpuniani.com/work/motorsport-neurotrauma-toolkit#methods</p><p>Core references: FIA Appendix H (2026), Art. 2.8; Appendix L (2026), Ch. II 2.2; FIA concussion leaflet (2024); Amsterdam consensus (2023), doi:10.1136/bjsports-2023-106898.</p></div>
        </div>
        <p className={styles.handoffCaption}>A new educational reconstruction of the original pilot’s information architecture. It does not reproduce or approve the Version 0.2 disposition algorithm. No real incident or patient record is used.</p>
      </div>
    </section>

    <section id="contribution" className={styles.section} aria-labelledby="contribution-heading">
      <div className={`${styles.wrap} ${styles.contributionGrid}`}>
        <div><p className={styles.overline}>Arjan Singh Puniani / My contribution</p><h2 id="contribution-heading">Engineering the<br/>communication.</h2><p className={styles.lead}>I work on the boundary between a signal and a decision.</p><p>My background spans chemical engineering at UC Berkeley, an M.S. in Bioengineering with a neural-engineering focus at Pitt, BCI research, and emergency-department volunteering and scribing. Here, I bring that perspective to information design.</p><Link className={styles.inlineLink} href="/about">Background & experience</Link></div>
        <div className={styles.projectRecord}>
          <article><span>Original work · Version 0.2</span><h3>A pilot card and draft flow</h3><p>I designed and wrote a four-domain intake structure and companion disposition draft for grassroots and regional four-wheeled racing. The repository’s content audit records the original PDFs and their scope.</p></article>
          <article><span>March 2026 · Documented critique</span><h3>Questions that changed the presentation</h3><p>The audit records expert feedback on terminology, responder roles, observation reliability, workflow location and series rules. This overview makes sources, unknowns and decision responsibilities explicit. Critique is not validation or endorsement.</p></article>
          <article><span>This iteration · Interactive overview</span><h3>Make the reasoning inspectable</h3><p>I translated that architecture into original diagrams, a fictional incident explorer, an annotated printable handoff and a dated claim-to-source ledger. These are authored communication choices, not tested improvements in patient outcomes.</p></article>
          <article><span>Current status · Unvalidated</span><h3>A research and discussion prototype</h3><p>No clinical validation, operational adoption, FIA/F1 affiliation or deployment into medical care is established. F1 is this overview’s research focus; the original pilot was not an F1 project.</p></article>
        </div>
      </div>
      <div className={`${styles.wrap} ${styles.nextQuestion}`}><p className={styles.overline}>The next question</p><p>Which minimum set of source-tagged observations helps a receiving medical team understand an incident without implying more certainty than the evidence allows?</p><Link href="/contact" className={styles.primaryButton}>Discuss a research collaboration</Link><Link href="/work/belmont-motorsport-systems" className={styles.inlineLink}>Related emergency-operations study</Link></div>
    </section>

    <section id="methods" className={`${styles.section} ${styles.methods}`} aria-labelledby="methods-heading">
      <div className={styles.wrap}>
        <div className={styles.sectionHeading}><div><p className={styles.overline}>Methods, evidence & limitations</p><h2 id="methods-heading">Follow every claim<br/>back to its source.</h2></div><p>Evidence reviewed {evidenceReviewed}. Regulations describe requirements; guidance explains practice; research describes evidence; the interface and handoff are my design interpretation.</p></div>
        <div className={styles.methodsIntro}><p><strong>Season matters.</strong> This overview cites 2026 F1 Sporting Issue 09 and Technical Issue 21. The newly published 2027 medical guidance is listed for transparency, not applied as a 2026 incident protocol. Regulations and guidance can change. The 3D vehicle is a 2023 RB19 artist reconstruction, not a 2026 chassis reference.</p><p><strong>Scope matters.</strong> No telemetry, incident video, patient data or tissue model was supplied. There is no injury probability, clinical scoring, emergency triage algorithm or return-to-race timetable. The fictional sequence is not a timing standard.</p></div>
        <div className={styles.sourceLedger}>{Object.entries(sources).map(([id, source])=><details id={`source-${id}`} key={id}><summary><span className={styles.sourceKind}>{source.kind}</span><span className={styles.sourceTitle}>{source.title}<small>{source.date}</small></span><span className={styles.expandLabel} aria-hidden="true">＋</span></summary><div className={styles.sourceBody}><p><strong>Claim / design decision</strong>{source.claim}</p><p><strong>What the source supports</strong>{source.supports}</p><p><strong>Applicability & limits</strong>{source.limits}</p><p><strong>Locator</strong>{source.locator}</p><p><strong>Appears in</strong>{source.where}</p><a href={source.url}>Read the original source</a></div></details>)}</div>
        <details className={styles.provenance}><summary>Project provenance & what could be verified</summary><div><p>The repository’s <a href="https://github.com/arjan-singh-puniani/arjansinghpuniani.com/blob/main/arjan-portfolio/CONTENT_AUDIT.md">content audit</a> records “Mechanism to Medical Center Crash and Concussion Card.pdf,” “Red Flag and Dispo Algorithm.pdf” and private March 2026 review correspondence. It documents the pilot’s four domains, original grassroots/regional scope and critique.</p><p>The original PDFs are not available as public downloads in this checkout. Their contents and correspondence have not been independently re-reviewed for this iteration; no private correspondence or reviewer identities are reproduced. The new fictional handoff is a reconstruction, not the historical PDF.</p><p>The brain and cockpit plates were produced with image-generation tools and authored annotations; gross relationships were checked against the linked references. Their production prompts remain in the repository. The vehicle is Redgrund’s credited RB19 reconstruction, shared under CC BY 4.0 and hosted by Sketchfab. The opening and fallback use a static render of that model with a closer camera and a navy background. Livery marks identify the depicted car; no team, FIA or F1 affiliation is implied. Labels, comparison prompts and motion components are authored in code. The artwork does not establish individual anatomy, exact equipment geometry, installation compliance, tissue loading or protective performance.</p><p>The next research step is to evaluate field definitions, responder roles, comprehension and handoff completeness with qualified motorsport medical and safety professionals. Operational use would require separate clinical, regulatory, local-protocol and privacy review.</p></div></details>
      </div>
    </section>
  </div>;
}
