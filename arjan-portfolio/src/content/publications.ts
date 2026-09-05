import type { Publication, ScienceArticle } from "@/types/content";

export const publications: Publication[] = [
  {
    title: "Conscious active inference I: A quantum model naturally implements the path integral needed for real-time planning and control",
    authors: "Michael C. Wiest and Arjan Singh Puniani",
    authorNames: ["Michael C. Wiest", "Arjan Singh Puniani"],
    venue: "Computational and Structural Biotechnology Journal, 30, 108–121",
    year: 2025,
    type: "Peer-reviewed review article",
    summary: "A theoretical argument that quantum dynamics may provide a biologically plausible implementation of the path integration required for temporally deep active inference.",
    href: "https://doi.org/10.1016/j.csbj.2025.09.017",
    doi: "10.1016/j.csbj.2025.09.017",
    pubmed: "https://pubmed.ncbi.nlm.nih.gov/41036467/",
    pmc: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12481606/",
    role: "Co-author",
    evidence: [
      { label: "Publisher PDF", sourceFile: "_Arjan_SP_ConsciousnessPaper.pdf", verified: true },
      { label: "PubMed record", url: "https://pubmed.ncbi.nlm.nih.gov/41036467/", verified: true },
    ],
  },
  {
    title: "Conscious active inference II: Quantum orchestrated objective reduction among intraneuronal microtubules naturally accounts for discrete perceptual cycles",
    authors: "Michael C. Wiest and Arjan Singh Puniani",
    authorNames: ["Michael C. Wiest", "Arjan Singh Puniani"],
    venue: "Computational and Structural Biotechnology Journal, 30, 94–107",
    year: 2025,
    type: "Peer-reviewed review article",
    summary: "A companion theoretical review arguing that Orch OR microtubule dynamics could provide discrete perceptual cycles for conscious active inference. It does not constitute experimental proof of a quantum mechanism for consciousness.",
    href: "https://doi.org/10.1016/j.csbj.2025.09.016",
    doi: "10.1016/j.csbj.2025.09.016",
    pubmed: "https://pubmed.ncbi.nlm.nih.gov/41019231/",
    pmc: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12475526/",
    correction: {
      label: "2025 corrigendum correcting equations on page 102",
      href: "https://doi.org/10.1016/j.csbj.2025.10.016",
    },
    role: "Co-author",
    evidence: [
      { label: "PubMed record", url: "https://pubmed.ncbi.nlm.nih.gov/41019231/", verified: true },
      { label: "PubMed Central full text", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12475526/", verified: true },
    ],
  },
  {
    title: "Making routine psychophysical calibration tasks for bidirectional brain-computer interfaces more fun",
    authors: "Arjan Singh Puniani, Chantal Verbaarschot, Charles Greenspon, Hannah Higgins, Sliman Bensmaia, and Robert Gaunt",
    authorNames: ["Arjan Singh Puniani", "Chantal Verbaarschot", "Charles Greenspon", "Hannah Higgins", "Sliman Bensmaia", "Robert Gaunt"],
    venue: "Manuscript / preprint",
    year: 2024,
    type: "Preprint manuscript",
    summary: "A comparison of a Space Invaders-like intracortical stimulation calibration task with a standard psychophysical task, focused on engagement and threshold validity.",
    role: "First author",
    evidence: [{ label: "Supplied manuscript", sourceFile: "Gamifying BCI Calibration v8 _ preprint.pdf", verified: true }],
  },
];

export const scienceWriting: ScienceArticle[] = [
  {
    title: "Deep neural networks track eye movements during MRI scans",
    venue: "Physics World",
    publishedAt: "25 January 2022",
    publishedAtISO: "2022-01-25",
    summary: "A reported research feature on DeepMReye, a neural-network approach that reconstructs gaze behaviour directly from MRI signals without a camera.",
    href: "https://physicsworld.com/a/deep-neural-networks-track-eye-movements-during-mri-scans/",
  },
  {
    title: "Novel decoder helps people with paralysis click-and-drag a computer cursor using just their thoughts",
    venue: "Physics World",
    publishedAt: "8 October 2021",
    publishedAtISO: "2021-10-08",
    summary: "A reported research feature on a brain–computer-interface decoder designed to make point-and-click and click-and-drag computer control more accessible.",
    href: "https://physicsworld.com/a/novel-decoder-helps-people-with-paralysis-click-and-drag-a-computer-cursor-using-just-their-thoughts/",
  },
];

export const researchProjects = [
  "Psychophysical calibration for intracortical brain-computer interfaces",
  "Signal degradation and possible electrode-interface biofouling",
  "Intracortical microstimulation and sensorimotor integration",
  "Focal cortical cooling for drug-resistant epilepsy",
];
