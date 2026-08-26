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
    category: ["Neurotechnology", "Software and Simulation"], status: "Completed", yearStart: 2022, yearEnd: 2024, role: "R&D neural engineer",
    problem: "Brain-computer interface calibration can be repetitive, cognitively demanding, and vulnerable to disengagement.",
    approach: ["Redesigned psychophysical tasks as game-like experimental paradigms.", "Built real-time interfaces for neural recording and behavioral response.", "Analyzed more than 940 calibration sessions for longitudinal patterns."],
    results: ["Produced reusable experimental software and structured calibration datasets.", "Identified systematic signal degradation that warranted further multi-site investigation."],
    limitations: ["Engagement and validity metrics require release approval before public numerical claims beyond session count."], featured: true,
    media: [{ src: "/images/research/rnel-gamified-bci-task.jpg", alt: "A research participant using a tablet beside a robotic arm while a gamified calibration task runs on a monitor", caption: "Gamified psychophysical calibration task in the Rehab Neural Engineering Labs." }],
    evidence: [{ label: "Portfolio résumé", sourceFile: "ArjanSinghPuniani_2026.pdf", verified: true }]
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
    category: ["Public Health", "Education"], status: "Proposed", yearStart: 2025, yearEnd: "Present", role: "Concept originator",
    problem: "Clinical education often treats tribal health as a short module rather than a sustained relationship shaped by sovereignty and local priorities.",
    approach: ["Outlined a longitudinal, culturally humble rotation model.", "Centered tribal sovereignty and community-defined needs.", "Sought faculty guidance and external dialogue before implementation."],
    results: ["Developed an initial concept and educational rationale."],
    limitations: ["This is not presented as an operating program, formal partnership, or completed clinical rotation."], featured: true,
    evidence: [{ label: "HCOP essay", sourceFile: "HCOP Essay.pdf", verified: true }]
  },
  {
    slug: "ucsf-eureka", title: "Clinical research systems at UCSF Eureka", shortDescription: "Operational tools and protocols for remote and digital clinical studies.",
    category: ["Clinical Research", "Public Health"], status: "Completed", yearStart: 2021, yearEnd: 2021, role: "Clinical research coordinator",
    problem: "Digital studies need reliable participant operations, clear protocols, and rapid deployment without sacrificing research integrity.",
    approach: ["Supported study operations and participant workflows.", "Authored and refined standard operating procedures.", "Coordinated cross-functional deployment work."],
    results: ["Improved operational readiness; exact percentage and adoption claims remain withheld pending primary evidence."],
    limitations: ["No confidential study data or participant information is disclosed."], featured: true,
    evidence: [{ label: "Portfolio résumé", sourceFile: "ArjanSinghPuniani_2026.pdf", verified: true }]
  },
  {
    slug: "motorsport-neurotrauma-toolkit", title: "Mechanism-to-Medical Center", shortDescription: "A draft crash and concussion documentation toolkit for grassroots motorsport.",
    category: ["Motorsport Medicine", "Education"], status: "Under development", yearStart: 2026, yearEnd: "Present", role: "Designer and technical writer",
    problem: "Local motorsport response teams need concise documentation that connects crash mechanism, occupant protection, neurological red flags, and disposition.",
    approach: ["Mapped fields to the operational sequence from incident to medical handoff.", "Used FIA Appendix H, SCAT6 concepts, and venue safety rules as reference points.", "Requested review from experienced motorsport physicians and safety professionals."],
    results: ["Draft materials were circulated by the International Council of Motorsport Sciences executive director for expert feedback."],
    limitations: ["Not validated, not a sanctioning-body standard, and not a substitute for trained clinical judgment."], featured: true,
    evidence: [{ label: "ICMS correspondence", sourceFile: "Trackside crash and concussion toolkit in grassroots motorsports.pdf", verified: true }]
  },
  {
    slug: "reasonos-vector-ecg", title: "ReasonOS Vector ECG", shortDescription: "A working educational interface for structured electrocardiogram measurement and reasoning.",
    category: ["Software and Simulation", "Education"], status: "Prototype", yearStart: 2026, yearEnd: "Present", role: "Product designer and developer",
    problem: "Electrocardiogram teaching tools often show conclusions without preserving measurement provenance or the reasoning path.",
    approach: ["Built calibration, axis, QT, lead-group, comparison, and evidence-ledger modules.", "Added structured reporting and a teaching workspace.", "Separated the reasoning kernel from the interface."],
    results: ["Source repository includes automated unit tests and a production build configuration."],
    limitations: ["Educational software only. It is not a diagnostic medical device and has not been clinically validated."], featured: false,
    links: [{ label: "Architecture notes", href: "/documents/reasonos-architecture.md" }],
    evidence: [{ label: "Uploaded source repository", sourceFile: "reasonos-vector-ecg-integrated-v0.4.0.zip", verified: true }]
  }
];
export const categories = ["All", "Neurotechnology", "Clinical Research", "Public Health", "Education", "Motorsport Medicine", "Software and Simulation"] as const;
export const getProject = (slug: string) => projects.find((project) => project.slug === slug);
