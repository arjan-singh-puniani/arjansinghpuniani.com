export const molecules = [
  {
    id: "cmg",
    name: "CMG helicase",
    short: "The helix opener",
    color: "#b48bea",
    role: "Separates the parental duplex so each strand can be copied.",
    detail:
      "CDC45, the six MCM subunits and GINS form the CMG complex. It translocates 3′→5′ on the leading-strand template, coupling ATP hydrolysis to fork progression.",
    pdb: "7PFO",
    evidence:
      "Experimental subunit coordinates; educational fork choreography.",
  },
  {
    id: "epsilon",
    name: "DNA polymerase ε",
    short: "The continuous copier",
    color: "#62d1e9",
    role: "Predominantly synthesizes the leading daughter strand.",
    detail:
      "Reads template 3′→5′ and adds complementary dNTPs to the daughter’s 3′ end. DNA synthesis always proceeds 5′→3′. Its association with CMG helps coordinate elongation.",
    pdb: "7PFO",
    evidence: "Experimental coordinates from the core human replisome.",
  },
  {
    id: "alpha",
    name: "Pol α–primase",
    short: "The starting point",
    color: "#77e0b9",
    role: "Builds the RNA–DNA primer that starts a new fragment.",
    detail:
      "Primase begins without a pre-existing 3′ hydroxyl. Pol α then adds a short DNA stretch. In this model, 10 RNA and 20 DNA nucleotides provide the starting junction.",
    pdb: "8QJ7",
    evidence:
      "Experimental pre-initiation assembly; placement at this fork is illustrative.",
  },
  {
    id: "delta",
    name: "DNA polymerase δ",
    short: "The fragment builder",
    color: "#6ba6f7",
    role: "Extends lagging-strand fragments away from the fork.",
    detail:
      "After the RNA–DNA primer is made and PCNA is loaded, Pol δ extends the daughter 5′→3′ toward the preceding fragment. Its exonuclease supports proofreading.",
    pdb: "6TNZ",
    evidence:
      "Experimental toolbelt assembly; its fork placement is illustrative.",
  },
  {
    id: "pcna",
    name: "PCNA sliding clamp",
    short: "The molecular tether",
    color: "#f1c07a",
    role: "Encircles DNA and keeps Pol δ engaged.",
    detail:
      "PCNA is a trimeric sliding clamp. The ATP-dependent RFC loader places it at the primer-template junction; PCNA also coordinates maturation factors.",
    pdb: "6TNZ",
    evidence: "Experimental trimer retained from biological assembly 1.",
  },
  {
    id: "rfc",
    name: "RFC clamp loader",
    short: "The clamp installer",
    color: "#d99caf",
    role: "Loads PCNA at a newly created primer junction.",
    detail:
      "RFC uses ATP binding and hydrolysis to load PCNA. The displayed 2 ATP per loading event is an illustrative accounting rule, not measured stoichiometry.",
    pdb: null,
    evidence: "Conceptual procedural model; no atomic structure is claimed.",
  },
  {
    id: "rpa",
    name: "RPA",
    short: "The template protector",
    color: "#b6cbe0",
    role: "Stabilizes exposed single-stranded DNA.",
    detail:
      "Replication protein A coats single-stranded DNA and helps prevent secondary structure. Small assemblies on the exposed template depict this protective role.",
    pdb: null,
    evidence:
      "Conceptual procedural model; binding positions are illustrative.",
  },
  {
    id: "fen1",
    name: "FEN1 nuclease",
    short: "The flap processor",
    color: "#e9ce82",
    role: "Cuts displaced primer flaps before the nick is sealed.",
    detail:
      "In the modeled short-flap pathway, Pol δ displaces the preceding primer and FEN1 cleaves the flap. RNase H2 and DNA2 can participate in other primer-processing pathways.",
    pdb: "6TNZ",
    evidence:
      "Experimental coordinates; short-flap reaction is conceptually animated.",
  },
  {
    id: "ligase",
    name: "DNA ligase I",
    short: "The final connection",
    color: "#bf9ee8",
    role: "Seals a processed nick into a continuous backbone.",
    detail:
      "Ligase joins adjacent 3′ hydroxyl and 5′ phosphate ends using ATP-dependent adenylation. It cannot replace a primer or fill a gap. A mature fragment here has no remaining nick.",
    pdb: null,
    evidence: "Conceptual procedural model; 1 ATP per ligation is counted.",
  },
];
export type MoleculeId = (typeof molecules)[number]["id"];
