type Experience = {
  organization: string;
  role: string;
  dates: string;
  summary: string;
  project?: { href: string; label: string };
};

export const experience: { title: string; entries: Experience[] }[] = [
  {
    title: "Clinical experience",
    entries: [
      { organization: "UPMC Presbyterian and VA Pittsburgh", role: "Interventional Cardiology Shadowing", dates: "2025", summary: "Observed coronary and structural heart procedures, hemodynamic assessment, and mechanical circulatory support." },
      { organization: "Fresno VA Medical Center", role: "Emergency Department Volunteer", dates: "Oct 2018–Aug 2021", summary: "Volunteered approximately 400 hours, transporting patients and assisting with vital signs, procedures, and documentation." },
      { organization: "Saint Agnes Medical Center / Vituity", role: "Emergency Department Medical Scribe", dates: "Dec 2017–May 2018", summary: "Documented patient encounters alongside more than 20 emergency physicians over approximately 600 hours." },
    ],
  },
  {
    title: "Research experience",
    entries: [
      { organization: "Wellesley College Neuroscience Department", role: "Theoretical Neuroscience Researcher", dates: "2025", summary: "Co-authored two peer-reviewed companion articles on active inference and neural computation.", project: { href: "/work/quantum-active-inference", label: "Read the research overview" } },
      { organization: "Rehab Neural Engineering Labs, University of Pittsburgh", role: "Brain-Computer Interface Researcher", dates: "Jan 2022–May 2024", summary: "Completed 3,024 hours of research. Redesigned a repeated stimulation-detection task for implanted BCI participants, studied engagement and detection thresholds, and submitted a first-author manuscript.", project: { href: "/work/bci-calibration", label: "Read the BCI case study" } },
      { organization: "Sensorimotor Integration Laboratory, University of Pittsburgh", role: "Neurophysiology Data Analyst", dates: "Aug 2021–Jul 2022", summary: "Developed a MATLAB microsaccade detector and applied hidden Markov modeling to laminar neural recordings." },
      { organization: "UCSF Eureka Digital Clinical Trials", role: "Clinical Research Coordinator", dates: "Jan–Jul 2021", summary: "Translated protocols and consent materials into participant-facing workflows, wrote training materials, and supported usability." },
    ],
  },
  {
    title: "Community and teaching",
    entries: [
      { organization: "Independent", role: "Interactive Medical Education", dates: "2026–Present", summary: "Built VECTOR ECG for clinical reasoning and Ortho Lab, an educational 3D fracture simulation.", project: { href: "/playground", label: "Explore the educational tools" } },
      { organization: "Napa, California", role: "Tennis Coach", dates: "2025–Present", summary: "Provide individualized tennis instruction." },
      { organization: "Altius Test Prep", role: "MCAT Instructor and Mentor", dates: "2018–2021, 2024–2025", summary: "Completed approximately 3,870 hours of instruction and mentoring and guided more than 40 students individually." },
      { organization: "Community service", role: "Medical Education Equity", dates: "2019", summary: "Co-founded a nonprofit for low-income premedical students." },
    ],
  },
  {
    title: "Leadership and professional experience",
    entries: [
      { organization: "Independent project", role: "Motorsport Neurotrauma Toolkit", dates: "2026–Present", summary: "Developed a trackside neurotrauma handoff framework and revised crash and extrication criteria after physician and safety-professional review through the International Council of Motorsport Sciences.", project: { href: "/work/motorsport-neurotrauma-toolkit", label: "Explore the toolkit" } },
      { organization: "Cyberpunk Reality / SeizeFreeze", role: "Founder and Neurotechnology Developer", dates: "2022–Present", summary: "Designed a proposed focal-cooling implant for epilepsy, modeled heat transfer, built prototypes, and filed a provisional patent.", project: { href: "/work/seizefreeze", label: "Read the SeizeFreeze case study" } },
      { organization: "Rigetti Computing", role: "Chief of Staff", dates: "2013–2015", summary: "Supported fundraising, product planning, and operations at an early-stage quantum computing company.", project: { href: "/work/rigetti-quantum-operations", label: "Explore the quantum systems case study" } },
      { organization: "Goldman Sachs", role: "Investment Management Summer Analyst", dates: "2012", summary: "Conducted discounted cash flow analysis in private wealth management." },
    ],
  },
];
