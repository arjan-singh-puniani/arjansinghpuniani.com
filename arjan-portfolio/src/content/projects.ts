import type { Project } from "@/types/content";
export const projects: Project[] = [
  {
    slug: "seizefreeze", title: "SeizeFreeze", shortDescription: "An early-stage focal cortical-cooling device concept for drug-resistant epilepsy.",
    category: ["Neurotechnology", "Clinical Research"], status: "Prototype", yearStart: 2022, yearEnd: "Present", role: "Founder and device lead",
    problem: "Many people with drug-resistant epilepsy continue to experience seizures despite medication and may not qualify for resective surgery.",
    approach: ["Developed a thermoelectric focal-cooling architecture.", "Modeled heat transfer and candidate materials.", "Explored neurosurgical integration, power, safety, and regulatory constraints.", "Filed provisional intellectual property; final patent status requires confirmation."],
    results: ["Won $5,000 for third place in the 2023 Randall Family Big Idea Competition.", "Won the $7,500 Kuzneski Innovation Cup.", "Advanced from concept framing into engineering and prototype planning."],
    limitations: ["No claim of clinical validation, human testing, seizure suppression in patients, or regulatory clearance.", "Exact patent and cumulative funding language remains private until primary documents are approved."],
    collaborators: ["Academic and clinical advisors listed only after public approval"], featured: true,
    media: [{ src: "/images/neurotechnology/seizefreeze-exploded-concept.png", alt: "Exploded rendering of the layered SeizeFreeze focal cortical-cooling device concept", caption: "Concept rendering. The device has not been clinically validated." }, { src: "/images/awards/randall-competition-5000-award.jpeg", alt: "Arjan Puniani holding a third-place five-thousand-dollar award check for Cyberpunk Reality", caption: "Third place and $5,000 in the 2023 Randall Family Big Idea Competition." }, { src: "/images/awards/kuzneski-7500-winner-graphic.jpg", alt: "Cyberpunk Reality team shown as winners of the seventy-five-hundred-dollar Kuzneski Innovation Cup", caption: "Cyberpunk Reality won the $7,500 Kuzneski Innovation Cup." }],
    evidence: [{ label: "Competition records and official winner materials", sourceFile: "Meet-the-Randall-2023-Winners-PDF.pdf; Kuzneski winner graphic", verified: true }, { label: "Portfolio résumé and application essays", sourceFile: "ArjanSinghPuniani_2026.pdf; HCOP Essay.pdf", verified: true }]
  },
  {
    slug: "bci-calibration", title: "Gamified BCI calibration", shortDescription: "Experimental interfaces that made repetitive neural-perception calibration easier to complete and analyze.",
    category: ["Neurotechnology", "Software and Simulation"], status: "Completed research", yearStart: 2022, yearEnd: 2024, role: "R&D neural engineer",
    problem: "Brain-computer interface calibration can be repetitive, cognitively demanding, and vulnerable to disengagement.",
    approach: ["Redesigned psychophysical tasks as game-like experimental paradigms.", "Built real-time interfaces for neural recording and behavioral response.", "Analyzed more than 940 calibration sessions for longitudinal patterns."],
    results: ["Produced reusable experimental software and structured calibration datasets.", "Identified systematic signal degradation that warranted further multi-site investigation."],
    limitations: ["Engagement and validity metrics require release approval before public numerical claims beyond session count."], featured: true,
    media: [{ src: "/images/research/rnel-gamified-bci-task.jpg", alt: "A research participant using a tablet beside a robotic arm while a gamified calibration task runs on a monitor", caption: "Gamified psychophysical calibration task in the Rehab Neural Engineering Labs." }],
    evidence: [{ label: "Portfolio résumé", sourceFile: "ArjanSinghPuniani_2026.pdf", verified: true }]
  },
  {
    slug: "rigetti-quantum-operations", title: "Quantum systems operations", shortDescription: "A retrospective Rigetti operating case study paired with an independent interactive model of a superconducting quantum-computing control chain.",
    category: ["Software and Simulation"], status: "Tested educational prototype", yearStart: 2026, yearEnd: 2026, role: "Independent model designer; former Rigetti Chief of Staff",
    problem: "Superconducting quantum computers depend on a tightly coordinated stack of room-temperature control, cryogenics, processor interfaces, signal delivery, and readout. The surrounding system is difficult to understand from isolated component diagrams.",
    approach: ["Built a procedural Three.js model of a superconducting quantum-computing control chain.", "Connected room-temperature control hardware, five cryogenic stages, a simplified transmon-like processor, microwave drive, and readout paths.", "Added inspection controls, camera presets, cutaway views, component labels, simulated telemetry, and a timed gate-cycle sequence.", "Separated the documented 2013–2015 Rigetti operating role from the independently built 2026 educational artifact."],
    results: ["Produced a tested interactive educational model with six camera presets and a wall-clock-driven operation sequence.", "Created a system-level explanation that makes the control chain inspectable without presenting commercial or confidential hardware."],
    limitations: ["The model is not a Rigetti product, proprietary design, dimensional replica, or representation of confidential hardware.", "Displayed telemetry is illustrative and simulated; it is not measured device performance.", "The model provides educational context and does not imply processor, cryostat, or control-system engineering performed during the documented Rigetti role."],
    featured: true,
    links: [{ label: "Open the full-screen interactive laboratory", href: "/quantum-computer-lab/index.html" }],
    evidence: [{ label: "Documented Rigetti role", sourceFile: "Portfolio résumé", verified: true }, { label: "Three.js model source, production build, and QA record", sourceFile: "Quantum-Computer-ThreeJS.zip", verified: true }]
  },
  {
    slug: "quantum-active-inference", title: "Conscious active inference", shortDescription: "Peer-reviewed theoretical research on active inference, quantum dynamics, and conscious planning.",
    category: ["Neurotechnology"], status: "Published", yearStart: 2025, yearEnd: 2025, role: "Co-author",
    problem: "The relationship between physical dynamics, inference, and conscious experience remains unresolved.",
    approach: ["Contributed to a cross-disciplinary theoretical framework.", "Connected concepts from neuroscience, active inference, and mathematical physics."],
    results: ["Published in Computational and Structural Biotechnology Journal in 2025."],
    limitations: ["This is a theoretical model, not experimental proof that consciousness depends on quantum microtubule dynamics."], featured: true,
    links: [{ label: "Read the open-access paper", href: "https://doi.org/10.1016/j.csbj.2025.09.017" }],
    evidence: [{ label: "Publisher PDF", sourceFile: "_Arjan_SP_ConsciousnessPaper.pdf", verified: true }]
  },
  {
    slug: "doctors-without-reservations", title: "Doctors Without Reservations", shortDescription: "A proposed community-led clinical and public-health learning model with tribal nations.",
    category: ["Public Health", "Education"], status: "Proposal", yearStart: 2025, yearEnd: "Present", role: "Concept originator",
    problem: "Clinical education often treats tribal health as a short module rather than a sustained relationship shaped by sovereignty and local priorities.",
    approach: ["Outlined a longitudinal, culturally humble rotation model.", "Centered tribal sovereignty and community-defined needs.", "Sought faculty guidance and external dialogue before implementation."],
    results: ["Developed an initial concept and educational rationale."],
    limitations: ["This is not presented as an operating program, formal partnership, or completed clinical rotation."], featured: true,
    evidence: [{ label: "HCOP essay", sourceFile: "HCOP Essay.pdf", verified: true }]
  },
  {
    slug: "ucsf-eureka", title: "Clinical research systems at UCSF Eureka", shortDescription: "Operational tools and protocols for remote and digital clinical studies.",
    category: ["Clinical Research", "Public Health"], status: "Completed research", yearStart: 2021, yearEnd: 2021, role: "Clinical research coordinator",
    problem: "Digital studies need reliable participant operations, clear protocols, and rapid deployment without sacrificing research integrity.",
    approach: ["Supported study operations and participant workflows.", "Authored and refined standard operating procedures.", "Coordinated cross-functional deployment work."],
    results: ["Improved operational readiness; exact percentage and adoption claims remain withheld pending primary evidence."],
    limitations: ["No confidential study data or participant information is disclosed."], featured: true,
    evidence: [{ label: "Portfolio résumé", sourceFile: "ArjanSinghPuniani_2026.pdf", verified: true }]
  },
  {
    slug: "motorsport-neurotrauma-toolkit", title: "Mechanism-to-Medical Center", shortDescription: "An exploratory documentation and escalation framework connecting crash mechanics with acute neurologic assessment.",
    category: ["Motorsport Medicine", "Education"], status: "Exploratory", yearStart: 2026, yearEnd: "Present", role: "Designer and technical writer",
    problem: "Concussion tools document symptoms and medical warning signs, while motorsport safety records document the crash and occupant-protection system. Those records often remain disconnected during the handoff from trackside response to medical care.",
    approach: ["Designed a four-domain intake structure covering crash mechanism, occupant protection, acute neurological observations, and initial disposition.", "Built a companion pilot disposition algorithm for four-wheeled racing, separating clinical decisions from Race Control authority.", "Mapped fields and terminology against cited concussion and motorsport-safety references while preserving local-protocol constraints.", "Sought criticism from motorsport physicians and safety professionals, then recorded unresolved questions about terminology, users, observation reliability, workflow location, and series rules."],
    results: ["Produced a Version 0.2 pilot intake card and disposition algorithm.", "External expert critique was requested and received through documented March 2026 correspondence.", "The critique identified design questions for a future revision; it did not validate, endorse, adopt, or deploy the toolkit."],
    limitations: ["Unvalidated pilot material. It is not a clinical protocol, sanctioning-body standard, or substitute for trained medical judgment.", "The current scope is four-wheeled racing only; motorcycle events require different governance and return-to-competition rules.", "Operational use would require review by the responsible medical director, sanctioning body, venue, emergency medical services agency, and local protocol authority."], featured: true,
    evidence: [{ label: "Version 0.2 pilot documentation toolkit", sourceFile: "Mechanism to Medical Center Crash and Concussion Card.pdf", verified: true }, { label: "Version 0.2 pilot disposition algorithm", sourceFile: "Red Flag and Dispo Algorithm.pdf", verified: true }, { label: "March 2026 expert-review correspondence", sourceFile: "Trackside toolkit grassroots motorsports email chain.pdf", verified: true }]
  },
  {
    slug: "belmont-motorsport-systems", title: "Belmont motorsport systems", shortDescription: "Academic risk, mitigation, and emergency-operations studies for a major road-racing weekend.",
    category: ["Motorsport Medicine", "Public Health"], status: "Academic systems study", yearStart: 2026, yearEnd: 2026, role: "Risk analyst and plan author",
    problem: "A major road-racing weekend combines high-energy crashes, heat exposure, hillside crowds, restricted competition areas, temporary systems, and limited emergency-access routes. A useful plan must coordinate those risks without obstructing Race Control or public-safety authority.",
    approach: ["Built and ranked a 16-item event risk register using consistent likelihood and impact criteria.", "Developed controls for heat illness, medical surge, high-energy crashes, fire, hazardous materials, severe weather, security threats, and technology failure.", "Assigned decision roles across Race Control, fire-rescue, medical leadership, security, operations, and public information.", "Defined recovery gates for track condition, containment, communications, medical coverage, responder access, security, and required records."],
    results: ["Produced an integrated academic portfolio consisting of a risk analysis, mitigation plan, and proposed emergency and medical operations annex.", "Converted a static risk matrix into triggers, decision ownership, communications requirements, and conditions for resuming operations."],
    limitations: ["Academic, role-based proposal developed through Belmont Abbey College coursework.", "Not commissioned, reviewed, or approved by Sonoma Raceway, NASCAR, or any public agency.", "Any operational version would require reconciliation with current venue plans, sanctioning-body procedures, hospital agreements, credentialing rules, radio assignments, and private contact lists."], featured: true,
    evidence: [{ label: "Belmont Abbey College risk-analysis assignment", sourceFile: "Assignment_3_Analyzing_Risk_Sonoma_Raceway_Exceptional.pdf", verified: true }, { label: "Belmont Abbey College mitigation assignment", sourceFile: "ARJAN Assignment_4_Techniques_in_Mitigation_Sonoma_Raceway.pdf", verified: true }, { label: "Proposed emergency and medical operations annex", sourceFile: "Assignment_6_Emergency_Disaster_Planning_Sonoma_Raceway_Exceptional.pdf", verified: true }]
  },
  {
    slug: "vector-ekg-reasonos", title: "Vector EKG and ReasonOS", shortDescription: "An educational prototype that preserves ECG observations, calculations, competing pathways, contradictions, provenance, and revisions.",
    category: ["Software and Simulation", "Education"], status: "Tested educational prototype", yearStart: 2026, yearEnd: "Present", role: "Independent product designer and developer",
    problem: "Electrocardiogram teaching tools often show conclusions without preserving measurement provenance or the reasoning path.",
    approach: ["Separated a domain-independent event-sourced kernel from ECG-specific meaning.", "Built calibration, axis, corrected QT, lead-group, comparison, provenance, and evidence-ledger modules.", "Preserved accepted and rejected transformations for deterministic replay.", "Represented alternative candidate pathways without labeling them validated expert consensus."],
    results: ["The archived v0.5.0 source reports 15 kernel tests, 8 ECG-plugin tests, 27 integrated application tests, TypeScript checks, and a production build passing on August 2, 2026.", "The portfolio includes a smaller independently tested executable vertical slice."],
    limitations: ["Educational research software only. It is not a diagnostic medical device and has not been clinically validated.", "The archive reports no validated expert-trace corpus, educational-efficacy study, clinical-outcome evidence, or production multi-tenant security."], featured: true,
    links: [{ label: "Open the flagship case study", href: "/work/vector-ekg-reasonos" }, { label: "Run the synthetic laboratory", href: "/work/vector-ekg-reasonos#laboratory" }],
    evidence: [{ label: "ReasonOS v0.5.0 source and release records", sourceFile: "EKG Vector.zip", verified: true }, { label: "Portfolio kernel tests and production build", sourceFile: "src/lib/reasonos; tests/reasonos-kernel.test.ts", verified: true }]
  }
];
export const categories = ["All", "Neurotechnology", "Clinical Research", "Public Health", "Education", "Motorsport Medicine", "Software and Simulation"] as const;
export const getProject = (slug: string) => projects.find((project) => project.slug === slug);
