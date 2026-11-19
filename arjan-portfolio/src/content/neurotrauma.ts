// Educational content only. Stage changes reveal authored information, never compute clinical advice.
export const evidenceReviewed = "19 November 2026";

export const sources = {
  rb19: {
    label: "RB19 model", kind: "3D asset & license", title: "Oracle Red Bull F1 Car RB19 2023 · Redgrund", date: "Published 21 February 2024 · license checked 19 November 2026",
    url: "https://sketchfab.com/3d-models/oracle-red-bull-f1-car-rb19-2023-e4afe46f3aab4b23a418da06fc163821",
    locator: "Creator model page and public Sketchfab API license metadata; CC BY 4.0",
    claim: "The vehicle study uses Redgrund’s attributed RB19 reconstruction and creator preview.",
    supports: "The creator shares this model under Creative Commons Attribution 4.0, allowing reuse with attribution. The interactive model remains hosted on Sketchfab; its preview is resized and compressed locally.",
    limits: "An artist’s 2023 car reconstruction, not official team CAD or a representation of 2026 hardware. No engineering compliance, loading or injury conclusion follows from this model. Livery marks remain their owners’ marks; no team, FIA or F1 endorsement is implied. Sketchfab is an external service loaded only when 3D is requested.", where: "Opening; interactive vehicle study; model credits and fallback preview",
  },
  neuroanatomy: {
    label: "NIH anatomy", kind: "NIH anatomy reference", title: "NCI Dictionary · Brain", date: "Undated reference · accessed 19 November 2026",
    url: "https://www.cancer.gov/publications/dictionaries/cancer-terms/def/brain",
    locator: "Brain definition; cerebrum, cerebellum, brainstem and cranium",
    claim: "The anatomical illustration distinguishes brain tissue from the skull around it.",
    supports: "Identifies the cerebrum, cerebellum and brainstem, the protective cranium, and continuity between the brainstem and spinal cord.",
    limits: "General anatomy, not a trauma atlas or a prediction of injury. AI-assisted anatomy and authored label anchors are illustrative, not verified individual anatomy or a depiction of pathology or calculated strain.", where: "Anatomical context and whole-head motion figure",
  },
  midline: {
    label: "Midline anatomy", kind: "Academic anatomy reference", title: "Neuroscience Online · Overview of the nervous system", date: "UT Medical School at Houston · revised 7 October 2020",
    url: "https://nba.uth.tmc.edu/neuroscience/m/s2/chapter01.html",
    locator: "Sagittal anatomy; corpus callosum, diencephalon and hindbrain",
    claim: "The detailed plate distinguishes cortical, commissural, cerebellar and brainstem structures.",
    supports: "Describes the corpus callosum as interhemispheric fibers, the midsagittal plane and the relative anatomy of cerebellum, pons and medulla.",
    limits: "Used to check gross relationships and label vocabulary, not to validate generated boundaries or provide a diagnostic atlas. No symptom-to-region or injury inference is made.", where: "Rendered midsagittal plate and authored key",
  },
  fhr: {
    label: "FIA FHR guidance", kind: "FIA equipment guidance", title: "FIA Standard Guidelines · Frontal Head Restraint system", date: "Undated public guide · accessed 19 November 2026",
    url: "https://api.fia.com/sites/default/files/fia_standard_guidelines_-_frontal_head_restrain.pdf",
    locator: "Sections 4–7; installation for HANS, harness relationship · printed pp. 16–21",
    claim: "Helmet anchorage, tether, shoulder-borne restraint and shoulder harness are distinct parts of a protective system.",
    supports: "Explains helmet/FHR compatibility and that a HANS-type restraint sits under the shoulder straps.",
    limits: "The illustration conveys relationships only. Actual models, fit, belt routing and anchorage geometry require the applicable official instructions. No compliance or protective performance can be inferred from this generic rendering.", where: "Rendered cockpit plate, key and illustration limitations",
  },
  sporting: {
    label: "F1 sporting", kind: "F1 regulation", title: "2026 F1 Regulations · Section B", date: "Issue 09 · 1 October 2026",
    url: "https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_b_sporting_-_iss_09_-_2026-10-01.pdf",
    locator: "B1.1.5 and B1.3.3 · PDF pp. 4–5",
    claim: "Medical examination and competition control have distinct, coordinated responsibilities.",
    supports: "The Race Director, CMO or Medical Delegate may require an examination. The Medical Delegate determines its appropriate time and place after an impact-warning-light referral. B1.3.3 sets out the Race Director’s sporting authority.",
    limits: "Requiring examination is not making a diagnosis. This is the 2026 F1 rule, not a universal motorsport procedure.", where: "Responsibilities; incident medical-review stage",
  },
  technical: {
    label: "F1 technical", kind: "F1 regulation", title: "2026 F1 Regulations · Section C", date: "Issue 21 · 19 October 2026",
    url: "https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_c_technical_-_iss_21_-_2026-10-19.pdf",
    locator: "C8.9–C8.10 · PDF pp. 94–96; C12–C14 · pp. 118–151",
    claim: "F1 records accident information and specifies occupant-protection structures.",
    supports: "Requires an accident data recorder, external accelerometer, high-speed camera and in-ear accelerometers. C12–C14 address the survival cell, cockpit, padding, impact structures and testing.",
    limits: "Equipment requirements do not establish real-time access to a complete clinical record, sensor validity in a particular incident, or injury status. Supplier specifications are not all public.", where: "Protection; information streams; incident unknowns",
  },
  appendixH: {
    label: "Appendix H", kind: "General FIA framework", title: "2026 ISC · Appendix H", date: "Published 19 October 2026",
    url: "https://www.fia.com/system/files/documents/appendix_h_2026_published_19102026.pdf",
    locator: "Article 2.8, especially 2.8.2.1–2.8.2.2 · PDF pp. 31–35",
    claim: "Circuit medical and rescue organisation needs medical leadership and event coordination.",
    supports: "Defines the CMO’s responsibility for organisation and administration of circuit medical and rescue services and their relationship with event officials.",
    limits: "A framework with championship-specific provisions; not a treatment checklist or a substitute for event and local emergency protocols.", where: "Responsibilities; handoff actions and receiving team",
  },
  appendixL: {
    label: "Appendix L", kind: "General FIA regulation", title: "2026 ISC · Appendix L", date: "Published 23 June 2026",
    url: "https://www.fia.com/system/files/documents/appendix_l_2026_publie_le_24_juin_2026.pdf",
    locator: "Chapter II, 2.2.1–2.2.3 · PDF pp. 40–44; Chapter III · driver equipment",
    claim: "Suspected concussion and return to competition belong to a medical process.",
    supports: "Confirmed concussion excludes a competitor until declared fit under the applicable procedure. Assessment by the next event’s CMO is required before return; F1 has additional Medical Delegate involvement in reintegration examinations.",
    limits: "International-competition framework, not a recovery timetable. National competitors must follow their ASN requirements. No fitness decision is made here.", where: "Responsibilities; assessment boundary; handoff status",
  },
  concussion: {
    label: "FIA concussion", kind: "FIA educational guidance", title: "Concussion in motorsports", date: "2024 leaflet · filename dated 12 June 2024",
    url: "https://www.fia.com/sites/default/files/concussion_leaflet_12062024_1.pdf",
    locator: "PDF pp. 2–3 · recognition and medical assessment",
    claim: "A driver can be concussed without losing consciousness or a direct head strike.",
    supports: "Describes symptoms including headache, dizziness and memory difficulty, and directs a competitor with suspected concussion to the medical team.",
    limits: "Awareness guidance, not a full emergency assessment. Symptoms are not specific to concussion; their absence on a brief observation cannot establish fitness.", where: "First report; clinical information gap; handoff observations",
  },
  amsterdam: {
    label: "Amsterdam consensus", kind: "Clinical consensus", title: "Consensus statement on concussion in sport · Amsterdam 2022", date: "Published June 2023 · BJSM 57:695–711",
    url: "https://doi.org/10.1136/bjsports-2023-106898",
    locator: "Definition; Recognise; Remove; Re-evaluate",
    claim: "Symptoms can evolve; assessment needs multiple domains and clinical context.",
    supports: "Concussion may follow an impulse transmitted to the brain after a blow to the head, neck or body. Signs and symptoms can evolve over minutes, hours or days; serial evaluation matters.",
    limits: "Consensus for sport generally, not an F1 procedure. It does not validate this handoff design or supply an individual injury probability.", where: "Information gap; incident sequence; source/time rationale",
  },
  scat: {
    label: "SCAT6", kind: "Clinical assessment resource", title: "Sport Concussion Assessment Tool 6", date: "Published June 2023 · BJSM 57:622–631",
    url: "https://bjsm.bmj.com/content/57/11/622",
    locator: "Introduction and key points · first page; accompanying introduction, doi:10.1136/bjsports-2023-106849",
    claim: "An assessment tool supports qualified clinical assessment; it does not replace it.",
    supports: "SCAT6 is for healthcare professionals assessing athletes aged 13 and older, principally acutely. It must not be used alone to make or exclude a concussion diagnosis; a normal result does not exclude concussion.",
    limits: "Linked, not reproduced or modified. This demonstration does not administer or score SCAT6 and is not an F1 clearance pathway.", where: "Clinical assessment explanation; handoff assessment field",
  },
  rescue: {
    label: "RESCUE-RACER", kind: "Peer-reviewed study protocol", title: "RESCUE-RACER · motorsport concussion research", date: "13 January 2021 · BMJ Open SEM 7:e000879",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7812087/",
    locator: "Methods and analysis; strengths and limitations",
    claim: "Motorsport-specific assessment is a research question, not a solved sensor-to-clearance pipeline.",
    supports: "Describes longitudinal baseline and post-injury evaluation across clinical, cognitive, ocular/vestibular and biomarker domains.",
    limits: "A protocol, not proof of effectiveness or a validated return-to-race threshold. Its recruited motorsport populations are not an F1-specific validation cohort.", where: "Research gap; next research question",
  },
  biomechanics: {
    label: "Biomechanics review", kind: "Peer-reviewed review", title: "Concussion in motor sport: a medical literature review and engineering perspective", date: "6 October 2017 · Journal of Concussion",
    url: "https://doi.org/10.1177/2059700217733916",
    locator: "Technical challenges; future directions",
    claim: "Vehicle motion, head motion and brain response are different quantities.",
    supports: "Discusses measurement location, in-ear sensing, linear and rotational motion, and limitations of motorsport concussion evidence.",
    limits: "Historical review, not a description of current hardware performance. Measurement and direction-comparison prompts are authored engineering interpretations, not a validated investigation protocol or diagnostic algorithm. Direction does not generate a load or injury estimate.", where: "Direction comparison; measurement chain; no single-g-value explanation",
  },
  halo: {
    label: "Halo research", kind: "FIA engineering explanation", title: "F1 · Why Halo is the best solution", date: "July 2017 · introduction for the 2018 season",
    url: "https://www.fia.com/news/f1-why-halo-best-solution",
    locator: "Accident scenarios and cockpit-protection development",
    claim: "The halo adds a protective structure around the exposed cockpit.",
    supports: "Explains development against car-to-car, car-to-environment and external-object scenarios.",
    limits: "Historical design rationale, not a promise against every impact or neurological injury. The cockpit cutaway and RB19 reconstruction do not validate equipment geometry or protective performance.", where: "Interactive vehicle study; halo annotation; protection explanation",
  },
  helmet: {
    label: "Helmet / FHR", kind: "FIA equipment guidance", title: "FIA Standard Guidelines · Helmets", date: "Undated public guide · accessed 19 November 2026",
    url: "https://www.fia.com/sites/default/files/guidelines_helmets-to_publish_bd.pdf",
    locator: "Introduction · printed pp. 6–7; FHR compatibility · pp. 12–13",
    claim: "Helmet and frontal head restraint have complementary protective roles.",
    supports: "Helmets address impacts, penetration and flame exposure. Helmet-to-FHR tethers oppose head movement and transfer forces to the harness in frontal or angled-frontal crashes.",
    limits: "Equipment guidance has no independent regulatory value. Fit, installation, condition and impact context matter. Equipment condition is not a neurological examination.", where: "Helmet and FHR annotations",
  },
  barriers: {
    label: "Circuit protection", kind: "FIA circuit guidance", title: "ISC Appendix O · circuit protection principles", date: "2022 edition · published 12 December 2022 · historical design reference",
    url: "https://www.fia.com/sites/default/files/appendix_o_2022_published_12.12.2022_-_marked_up_version_0.pdf",
    locator: "Article 7.2 · protection measures",
    claim: "Circuit protection is part of the impact environment.",
    supports: "Describes deceleration systems and energy-dissipating or stopping barriers, selected in relation to circuit geometry and impact direction.",
    limits: "Used for physical design principles only, not as the current circuit licensing rule or a claim about any named barrier in the fictional incident.", where: "Barrier annotation",
  },
  guidelines: {
    label: "2027 medical guidance", kind: "Future-year FIA guidance", title: "Medical Guidelines for Drivers 2027", date: "Published 4 November 2026 · 2027 edition",
    url: "https://www.fia.com/sites/default/files/medical_guidelines_for_drivers_2027.pdf",
    locator: "Neurological conditions · head injury section",
    claim: "Publication date and applicable season must remain distinct.",
    supports: "Provides ASN doctors with driver medical-examination guidance for the 2027 edition.",
    limits: "Reviewed for currency, not used as a 2026 F1 incident protocol. Its suggested time periods are not turned into a return-to-race countdown here.", where: "Methods and source currency note",
  },
} as const;

export type SourceId = keyof typeof sources;

export const impactDirections = [
  {
    id: "front-left", name: "Front-left", context: "Front-left approach selected.",
    camera: [3.2,-2.7,1.9],
    questions: ["Which surfaces contacted first, and in what sequence?", "Is there a view of vehicle rotation or any subsequent contact?", "What did the driver or responder report, and was head contact witnessed?"],
    unknown: "The actual approach angle, order of contacts and any subsequent rotation.",
  },
  {
    id: "front", name: "Front", context: "An approach from ahead of the car is selected.",
    camera: [1.5,-3.5,1.45],
    questions: ["Which front structures and barrier surfaces were involved?", "If vehicle data exist, where was the sensor and what are its axes, timing and quality?", "What did the driver or responder report, with what source and observation time?"],
    unknown: "Whether the occupant or helmet contacted another surface.",
  },
  {
    id: "left-side", name: "Left side", context: "An approach from the driver’s left is selected.",
    camera: [4.1,-.5,1.8],
    questions: ["Which left-side area was contacted, and did another contact follow?", "Are there views of the cockpit context or an equipment inspection?", "Was head contact witnessed, reported later or simply not observed?"],
    unknown: "Whether there was cockpit intrusion or helmet contact; the model establishes neither.",
  },
  {
    id: "rear", name: "Rear", context: "An approach from behind the car is selected.",
    camera: [2.4,3.1,1.5],
    questions: ["Where was rear contact, and what happened in the complete incident sequence?", "If vehicle data exist, what are their source, axes, timing and measurement quality?", "What did the driver or responder report, and did symptoms change over time?"],
    unknown: "Whether rotation, rebound or a second contact followed.",
  },
] as const;

export type ImpactDirection = typeof impactDirections[number];

export const stages = [
  {
    name: "Impact", label: "The mechanism", title: "The car has stopped. The clinical picture hasn’t formed.",
    description: "Compare how contact context changes the questions, while head motion and clinical findings remain unknown.",
    known: ["Direction chosen by the visitor; no incident recording supplied.", "Fictional driver report held constant across all four directions."],
    unknown: ["Head motion, tissue loading and injury status.", "Sensor recordings, barrier response and full impact sequence."],
    lesson: "Mechanism starts a question. It does not answer whether a driver is injured.",
    source: "biomechanics" as SourceId,
  },
  {
    name: "First report", label: "The person", title: "A symptom adds information that the vehicle cannot supply.",
    description: "In this fictional report, the driver says their head hurts and repeats a question about what happened. A responder records the report and its source.",
    known: ["Driver reports headache at first contact.", "Responder reports a repeated question; timing is relative to contact."],
    unknown: ["Whether there was a direct head strike or loss of consciousness.", "Baseline, other injuries and findings of a full examination."],
    lesson: "A spoken reply is an observation. It is not evidence of neurological clearance.",
    source: "concussion" as SourceId,
  },
  {
    name: "Medical review", label: "The assessment", title: "Bring the information together. Keep judgment with the medical team.",
    description: "The fictional event medical team is informed of the symptoms and requested to assess the driver. No examination result, diagnosis or fitness decision is invented.",
    known: ["Symptoms and incident context have been communicated.", "Assessment has been requested; the result is pending."],
    unknown: ["Clinical findings, diagnosis, treatment and disposition.", "Whether later symptoms or additional incident evidence will emerge."],
    lesson: "Requesting an examination and diagnosing an injury are different acts.",
    source: "sporting" as SourceId,
  },
  {
    name: "Handoff", label: "The transfer", title: "A useful handoff preserves what is still unresolved.",
    description: "The fictional record is prepared for the event medical team. The intended recipient is listed, but acknowledgement has not been confirmed.",
    known: ["Context, symptoms, source and actions are carried forward.", "Receiving team is identified; acknowledgement is pending."],
    unknown: ["Confirmation that the receiving clinician has accepted the handoff.", "Assessment outcome and any competition eligibility decision."],
    lesson: "Sent is not received. Unknown is not normal.",
    source: "appendixH" as SourceId,
  },
] as const;

export const handoffFields = [
  { label: "Incident & mechanism", value: "Fictional case M01 · angled barrier contact, front-left suggested by one video view. Complete sequence unavailable.", source: "Video account · incident", why: "Keep the account separate from a reconstruction. Direction and sequence add context without asserting the load on the driver’s head.", citation: "biomechanics" as SourceId },
  { label: "Protection context", value: "Open cockpit with halo, helmet and frontal head restraint depicted. Fit, damage and performance not assessed.", source: "Scenario drawing · not an equipment inspection", why: "Record what the source actually establishes. A protective system being present does not establish its condition or an uninjured occupant.", citation: "helmet" as SourceId },
  { label: "Symptoms & observations", value: "Headache reported by driver. Repeated question reported by responder. Head strike and loss of consciousness unknown.", source: "Driver + responder · first contact", why: "A symptom is reported by the driver; a sign is observed by someone else. Keep that distinction, and do not convert an unwitnessed event into an absent finding.", citation: "concussion" as SourceId },
  { label: "Time & information source", value: "Relative sequence only: incident → first contact → medical request. Clock times and intervals not supplied.", source: "Scenario sequence · no synchronised clock", why: "Symptoms and evidence can change. An event time, observation time and reporting time may differ; the source and timing belong with each statement.", citation: "amsterdam" as SourceId },
  { label: "Actions & assessment", value: "Event medical team informed; assessment requested. Examination, treatment, transport and disposition not documented.", source: "Fictional responder report · after first contact", why: "Separate completed communication from a requested action and a clinical outcome. This prototype does not prescribe treatment or decide transport.", citation: "appendixH" as SourceId },
  { label: "Unknowns to carry forward", value: "Other injuries; baseline; complete incident sequence; sensor data; clinical findings; symptom progression.", source: "Explicit gaps · unresolved at handoff", why: "Missing data must travel with the record. A blank field is ambiguous; an explicit unknown communicates an unresolved question.", citation: "amsterdam" as SourceId },
  { label: "Recipient & acknowledgement", value: "Intended recipient: event medical team. Named receiving clinician and acceptance: not confirmed.", source: "Handoff prepared · receipt pending", why: "This is an authored communication safeguard: identify the recipient and distinguish sending from acknowledged receipt. It is not an FIA-approved form field.", citation: "appendixH" as SourceId },
] as const;
