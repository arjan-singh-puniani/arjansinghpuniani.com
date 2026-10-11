export type Question = {
  id: string;
  prompt: string;
  options: string[];
  correct: number;
  reasons: string[];
  takeaway: string;
};

export const chapters = [
  {
    id: "polarity",
    number: "01",
    title: "Follow the direction",
    subtitle: "Polarity · origins · leading vs. lagging",
  },
  {
    id: "chemistry",
    number: "02",
    title: "Find the reactive end",
    subtitle: "3′ OH · primers · nucleotide energy",
  },
  {
    id: "perturbation",
    number: "03",
    title: "Break one function",
    subtitle: "Enzyme inhibition · causal predictions",
  },
  {
    id: "inheritance",
    number: "04",
    title: "Read the evidence",
    subtitle: "Semiconservative copying · density bands",
  },
  {
    id: "ends",
    number: "05",
    title: "Reach the chromosome end",
    subtitle: "Linear DNA · telomerase · RNA templates",
  },
  {
    id: "transfer",
    number: "06",
    title: "Try a new problem",
    subtitle: "Sequence · data · experimental controls",
  },
] as const;
export type Chapter = (typeof chapters)[number]["id"];

export const questions: Record<
  Exclude<Chapter, "perturbation" | "transfer">,
  Question
> = {
  polarity: {
    id: "polarity",
    prompt:
      "At the right-moving fork, the upper parental strand runs 5′ → 3′ from left to right. Which template supports continuous daughter synthesis toward that fork?",
    options: [
      "Upper template",
      "Lower template",
      "Both templates continuously",
      "Neither: synthesis must run 3′ → 5′",
    ],
    correct: 1,
    reasons: [
      "Moving right on the upper template would read it 5′ → 3′. Polymerase must read the template in the opposite direction.",
      "The lower template runs 3′ → 5′ toward the right-moving fork. Its daughter can therefore grow 5′ → 3′ toward that fork.",
      "Antiparallel templates cannot both be read 3′ → 5′ in the same direction. One daughter must be made in fragments.",
      "Both daughters grow 5′ → 3′. Fragmented synthesis solves the direction problem without reversing polymerase chemistry.",
    ],
    takeaway:
      "Leading is defined relative to fork motion, not by whether a strand appears at the top of a picture.",
  },
  chemistry: {
    id: "chemistry",
    prompt:
      "A DNA primer is correctly paired to its template, but its terminal sugar has 3′ H instead of 3′ OH. All enzymes and dNTPs are present. What happens at this primer?",
    options: [
      "Extension continues because pairing is correct",
      "Ligase substitutes for polymerase",
      "Extension stops at the blocked 3′ end",
      "Polymerase extends the primer’s 5′ end",
    ],
    correct: 2,
    reasons: [
      "Pairing alone is insufficient. The terminal 3′ OH is required to form the next backbone bond.",
      "Ligase seals an existing nick between suitable ends; it does not copy a template by adding dNTPs.",
      "The missing hydroxyl prevents the next nucleotide from being attached. This is the logic of chain termination.",
      "DNA polymerase adds to the 3′ end; it cannot rescue this primer by extending its 5′ end.",
    ],
    takeaway:
      "Ask separately: Is there a template? Is there a primer? Does that primer have an available 3′ OH?",
  },
  inheritance: {
    id: "inheritance",
    prompt:
      "All parental DNA is initially heavy (¹⁵N). Cells then complete two synchronous replication rounds in light (¹⁴N) medium, with no label recycling. What bands should intact duplex DNA produce?",
    options: [
      "One intermediate band",
      "Heavy and light bands, 50% each",
      "Intermediate and light bands, 50% each",
      "One light band",
    ],
    correct: 2,
    reasons: [
      "That is the first-round result. In round two, light template strands make fully light duplexes.",
      "The original heavy strands separate in round one. A fully heavy duplex does not persist under semiconservative copying.",
      "Two hybrid duplexes retain the two original heavy strands. Two other duplexes are fully light: 50% of each type.",
      "The two original heavy strands remain in hybrid duplexes. Their fraction falls; they do not vanish after two rounds.",
    ],
    takeaway:
      "Count old strands first, then duplexes. A hybrid duplex is not a strand containing mixed patches of old and new DNA.",
  },
  ends: {
    id: "ends",
    prompt:
      "After terminal RNA-primer removal at a linear chromosome end, which activity provides extra template for complementary-strand synthesis?",
    options: [
      "Telomerase extends a DNA 3′ end using RNA",
      "Ligase synthesizes DNA across the missing segment",
      "DNA polymerase begins without a primer",
      "Telomerase adds RNA to the daughter’s 5′ end",
    ],
    correct: 0,
    reasons: [
      "Telomerase is an RNA-templated DNA polymerase. It adds DNA repeats to the G-rich 3′ end, enabling priming and complementary fill-in.",
      "Ligase joins adjacent DNA ends. A missing stretch is not a nick that ligase can simply seal.",
      "Replicative DNA polymerase still requires a primer with a 3′ OH. It does not start a chain de novo.",
      "Telomerase makes DNA, not an RNA extension, and extends a 3′ end rather than a 5′ end.",
    ],
    takeaway:
      "Telomerase extends the template end; ordinary priming and DNA synthesis then fill in the complement. A normal 3′ overhang remains.",
  },
};

export const perturbations: (Question & { enzyme: string; effect: string })[] =
  [
    {
      id: "ligase",
      enzyme: "Ligase",
      effect: "Unsealed backbone nicks",
      prompt:
        "In a short, purified replication assay, ligase alone is inhibited. Primers are removed and the missing DNA is filled in. Which product accumulates?",
      options: [
        "DNA fragments separated by nicks",
        "Intact RNA primers only",
        "Unwound DNA with no daughter synthesis",
        "A daughter made in the 3′ → 5′ direction",
      ],
      correct: 0,
      reasons: [
        "DNA synthesis can occur, but adjacent fragments cannot be covalently joined. Nicks remain after gap filling.",
        "Primer processing is explicitly intact in this assay. Ligase acts after removal and DNA replacement.",
        "Ligase inhibition does not directly disable helicase or polymerase. Later cellular effects are outside this short assay.",
        "No inhibition reverses the direction of DNA synthesis.",
      ],
      takeaway:
        "A nick lacks one backbone bond. A gap lacks nucleotides. They require different repairs.",
    },
    {
      id: "helicase",
      enzyme: "Helicase",
      effect: "No new template exposed",
      prompt:
        "Helicase is acutely stopped in an active fork. Already exposed template can still be copied. Which event is directly prevented?",
      options: [
        "Sealing existing nicks",
        "Separating additional parental strands",
        "Pairing any free nucleotide with a base",
        "Removing all incorrect nucleotides",
      ],
      correct: 1,
      reasons: [
        "Ligase seals nicks. Helicase does not catalyze that bond-forming step.",
        "Without further strand separation, the fork cannot expose new template ahead of the polymerases.",
        "Base pairing is not abolished. Polymerases may finish copying template that is already exposed.",
        "Proofreading is a separate polymerase activity.",
      ],
      takeaway:
        "Helicase separates paired strands; it does not cut the DNA backbone to relieve torsional stress.",
    },
    {
      id: "topoisomerase",
      enzyme: "Topoisomerase",
      effect: "Torsional stress builds ahead",
      prompt:
        "A torsionally constrained DNA substrate continues to unwind after topoisomerase inhibition. What initially accumulates ahead of the fork?",
      options: [
        "Extra RNA primers only",
        "Negative charge from missing ligase",
        "Positive supercoiling and torsional stress",
        "Reversed daughter-strand polarity",
      ],
      correct: 2,
      reasons: [
        "Primer synthesis is a primase function. It is not the direct consequence of failing to relax DNA topology.",
        "Ligase is not inhibited here, and this is a mechanical winding problem rather than a charge assay.",
        "Unwinding a constrained helix increases positive supercoiling ahead of the fork. Topoisomerases relieve this through transient backbone cleavage and resealing.",
        "Template topology does not change the 5′ → 3′ chemistry of synthesis.",
      ],
      takeaway:
        "Use the constraint in the passage: a freely rotating end changes the torsional-stress prediction.",
    },
    {
      id: "primase",
      enzyme: "Primase",
      effect: "No new fragments initiated",
      prompt:
        "Primase is inhibited after a leading strand and one Okazaki fragment are already primed. Polymerase is intact. What is the most direct short-term effect?",
      options: [
        "All existing primers disappear",
        "New Okazaki fragments cannot start",
        "Existing daughters grow from their 5′ ends",
        "Only proofreading stops",
      ],
      correct: 1,
      reasons: [
        "Inhibition prevents new primer synthesis; it does not erase primers already present.",
        "New fragments lack a primer. Already primed chains may continue until other constraints intervene.",
        "Polymerase cannot extend a 5′ end. Existing chains still grow at their 3′ OH.",
        "Primase initiates RNA primers; it does not provide polymerase proofreading.",
      ],
      takeaway:
        "Distinguish initiation from extension. Primase starts RNA de novo; DNA polymerase extends an existing primer.",
    },
    {
      id: "proofreading",
      enzyme: "Proofreading",
      effect: "Higher substitution error frequency",
      prompt:
        "A mutation selectively abolishes a replicative polymerase’s 3′ → 5′ exonuclease activity while preserving polymerization. What is the best direct prediction?",
      options: [
        "Synthesis changes to 3′ → 5′",
        "All primer removal stops",
        "More incorrect bases remain in new DNA",
        "Every replication fork immediately stalls",
      ],
      correct: 2,
      reasons: [
        "The exonuclease direction describes removal from a chain end. DNA synthesis remains 5′ → 3′.",
        "Proofreading is not the same as RNA-primer removal. For example, E. coli Pol I uses a distinct 5′ → 3′ exonuclease activity in primer processing.",
        "Loss of proofreading reduces removal of newly incorporated errors. Other repair mechanisms may still correct some errors.",
        "Polymerization is explicitly preserved. Universal immediate arrest is not supported by the stated mutation.",
      ],
      takeaway:
        "Proofreading during synthesis and mismatch repair after synthesis are distinct safeguards.",
    },
  ];

export const transferQuestions: Question[] = [
  {
    id: "sequence",
    prompt:
      "A template segment is written 5′-AGTC-3′. What is the complementary daughter sequence when it is also written 5′ → 3′?",
    options: ["TCAG", "GACT", "CTGA", "AGTC"],
    correct: 1,
    reasons: [
      "TCAG is the aligned complement written 3′ → 5′. The question requires the daughter in 5′ → 3′ order.",
      "Pair antiparallel: 3′-TCAG-5′. Reverse the written order to give 5′-GACT-3′.",
      "This does not satisfy both antiparallel orientation and correct base pairing.",
      "A copied complementary strand is not generally the same written sequence as its template.",
    ],
    takeaway:
      "Complement first, label the ends, then rewrite in the requested direction.",
  },
  {
    id: "third-round",
    prompt:
      "Heavy-labeled DNA undergoes three complete replication rounds in light medium. For intact, equal-length duplexes, which comparison is correct?",
    options: [
      "50% hybrid duplexes; 50% heavy strands",
      "25% hybrid duplexes; 12.5% heavy strands",
      "12.5% hybrid duplexes; 25% heavy strands",
      "No hybrid duplexes remain",
    ],
    correct: 1,
    reasons: [
      "These fractions do not describe the third round. Heavy strands are diluted with every doubling.",
      "Eight duplexes contain sixteen strands. Two duplexes are hybrid, carrying the original two heavy strands: 2/8 and 2/16.",
      "This swaps the denominators. Hybrid-duplex fraction is twice the heavy-strand fraction after the first round.",
      "The original heavy strands persist in two hybrid duplexes under the stated ideal conditions.",
    ],
    takeaway:
      "Read the measured quantity: duplex fraction, strand fraction, and band position are different variables.",
  },
  {
    id: "control",
    prompt:
      "A drug lowers DNA synthesis in a purified fork assay. Adding a pre-unwound, correctly primed template restores synthesis. Which claim is best supported by this rescue?",
    options: [
      "The drug must bind helicase directly",
      "The drug targets ligase exclusively",
      "An upstream template-access step is impaired; the exact target needs another assay",
      "Polymerase cannot use a 3′ OH",
    ],
    correct: 2,
    reasons: [
      "Rescue is consistent with an unwinding defect, but cannot identify a unique binding target by itself.",
      "The intervention bypasses template exposure and priming. It does not specifically rescue nick sealing.",
      "The rescue shows polymerase can synthesize on a ready substrate. Separate controls must distinguish helicase, priming, and other upstream mechanisms.",
      "Restored synthesis on a correctly primed template argues against this claim.",
    ],
    takeaway:
      "A rescue narrows a mechanism. It does not automatically prove which protein a drug binds.",
  },
];

/** Ideal synchronous semiconservative replication, no isotope recycling. */
export function inheritance(round: number) {
  if (!Number.isInteger(round) || round < 0 || round > 3)
    throw new RangeError("Round must be 0–3");
  const duplexes = 2 ** round;
  return {
    duplexes,
    heavy: round === 0 ? 1 : 0,
    hybrid: round === 0 ? 0 : 2,
    light: round === 0 ? 0 : duplexes - 2,
    heavyStrandFraction: 1 / duplexes,
  };
}
