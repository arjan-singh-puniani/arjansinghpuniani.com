# Experimental molecular assets

The local molecular representations come from biological assembly 1 coordinate
downloads from RCSB PDB, retrieved 11 October 2026. The cryo-EM entries describe
separate experimental complexes. Combining or moving these complexes in the
animated educational scene is a schematic arrangement, not an experimentally
validated complete replisome. Their deposited structures do not establish the
animation's dynamic trajectories, reaction timing, or interactions between entries.

| Asset | Experimental complex | Resolution | Modeled protein residues retained | Protein chains |
| --- | --- | --- | --- | --- |
| [7PFO](https://www.rcsb.org/structure/7PFO) | Core human replisome | 3.20 Å | 8,415 | 19 |
| [6TNZ](https://www.rcsb.org/structure/6TNZ) | Human Pol δ–FEN1–PCNA toolbelt | 4.05 Å | 2,705 | 8 |
| [8QJ7](https://www.rcsb.org/structure/8QJ7) | Human Pol α–primase, pre-initiation stage 1 | 3.07 Å | 2,330 | 4 |

## Representation and limits

Each protein bead is located at a deposited alpha-carbon (CA) atom. These beads
are an optimized residue representation; they are not complete atomistic models,
solvent-excluded molecular surfaces, or electron-density maps. No residues have
been invented to close unmodeled gaps. All small-molecule ligands, ions, solvent,
and other non-polymer atoms are omitted. DNA uses deposited C4′ sugar atom
positions, one per modeled nucleotide. 8QJ7 contains no modeled DNA polymer chain.

Only coordinate model 1 is selected. All three downloaded assemblies contain one
coordinate model; its atom count is recorded in `source.sourceModelAtomCounts`.
7PFO and 8QJ7 assembly downloads include hydrogen atoms. The heavy-atom count,
which matches the RCSB entry atom count, is `source.selectedModelHeavyAtomCount`:
68,517 for 7PFO, 22,008 for 6TNZ, and 18,912 for 8QJ7.
For the selected model, counts including modeled DNA residues are 8,469 for 7PFO,
2,755 for 6TNZ, and 2,330 for 8QJ7, matching the RCSB entry residue counts.

Missing structure is substantial for some subunits: for example, 7PFO's catalytic
Pol ε chain contains 804 modeled CA residues out of 2,286 deposited residues.
Every chain records modeled count and deposited sequence length. This model
should not be described as showing all of Pol ε's catalytic geometry.

## Chain classifications

IDs below are mmCIF label asymmetry IDs. The JSON also preserves the author chain
IDs, which differ for 7PFO and 8QJ7.

| Entry / runtime group | Label chains | Composition |
| --- | --- | --- |
| 7PFO / `cmg` | A–F, I–M | MCM2–7, CDC45, GINS1–4; all 11 CMG subunits |
| 7PFO / `epsilon` | G, H | POLE2 and catalytic POLE |
| 7PFO / `accessory` | N, O, P, Q, R, U | AND-1 trimer, TIMELESS, TIPIN, CLASPIN |
| 7PFO / `dna` | S, T | Leading strand (32 modeled nucleotides), lagging strand (22) |
| 6TNZ / `delta` | A, B, C, D | POLD1–4 |
| 6TNZ / `pcna` | E, F, G | Complete deposited PCNA trimer |
| 6TNZ / `fen1` | H | FEN1 |
| 6TNZ / `dna` | I, J | Primer (23 modeled nucleotides), template (27) |
| 8QJ7 / `alpha` | A, B, C, D | PRIM1, POLA1, POLA2, PRIM2 |

7PFO author IDs: A–F are `2`–`7`; G–R are `A`–`L`; S, T, U are `M`, `N`, `Q`.
8QJ7 label A, B, C, D map to author C, A, B, D. 6TNZ uses matching label and
author chain IDs.

Coordinates for every group in one entry share a single original coordinate
frame. They receive exactly one source-wide translation: the arithmetic centroid
of all selected representative protein and DNA atoms is subtracted. The exact
translation is stored as `originalCenter`, and units remain Å with `scale: 1`.
No rotation or per-chain/group recentering occurs during preprocessing. Therefore
the CMG/Pol ε relationship within 7PFO, the AND-1 trimer, the PCNA trimer, and the
Pol δ–PCNA–FEN1 relationship within 6TNZ are preserved.

## Runtime schema

Fetch `/molecules/7pfo.json`, `/molecules/6tnz.json`, or `/molecules/8qj7.json`.

```ts
interface MolecularAsset {
  schemaVersion: 1;
  id: '7PFO' | '6TNZ' | '8QJ7';
  title: string;
  units: 'angstrom';
  scale: 1;
  originalCenter: [number, number, number];
  source: {
    url: string;
    entryUrl: string;
    assembly: 1;
    resolutionAngstrom: number;
    sha256: string; // Uncompressed original mmCIF SHA-256
    selectedModel: 1;
    selectedModelAtomCount: number;
    sourceModelAtomCounts: Record<string, number>;
  };
  groups: Record<string, {
    points: [number, number, number][];
    center: [number, number, number]; // Group centroid in shared source frame
    lod: { low: number[]; medium: number[]; high: number[] };
    chains: {
      id: string;
      authId: string;
      entityId: number;
      name: string;
      start: number; // First index in group.points
      count: number;
      depositedResidues: number;
      residues: [number, string, string][]; // label sequence ID, author sequence ID, residue name
      breaks: number[]; // Local indices beginning a new trace segment
    }[];
  }>;
  dna: {
    id: string;
    authId: string;
    name: string;
    points: [number, number, number][];
    residues: [number, string, string][];
    breaks: number[];
  }[];
}
```

LOD indices refer to the shared `points` array. High retains every representative
atom; medium samples every second modeled residue; low samples every fourth.
All levels retain each chain's final residue. Subsets are nested and chain
boundaries are preserved. Low and medium are optimized display representations,
not alternative experimental structures. Draw separate traces for each chain;
do not connect across chain boundaries or entries in `breaks`. Any sphere radius
or enclosing visual envelope added by the renderer is a visual approximation.

## Reproducibility and validation

The source mmCIF files are gzip-compressed without timestamp variability in
`public/molecules/source/`. Each asset's provenance includes the SHA-256 of the
uncompressed source. Run:

```sh
python3 scripts/prepare-molecules.py
python3 scripts/prepare-molecules.py --validate-only
python3 scripts/prepare-molecules.py --download
```

The pipeline uses no third-party Python dependencies. Downloads use curl with
certificate verification. Preparation rejects malformed CIF loops, duplicate
representative atoms, non-finite coordinates, unexpected chain counts,
unclassified protein chains, empty protein groups, inconsistent residue counts,
and invalid or non-nested LOD indices. Residue metadata is retained for later
inspection rather than inferred from visual position.

Primary experimental publications:

- [Jones et al., *EMBO Journal* (2021), structure of a human replisome](https://doi.org/10.15252/embj.2021108819).
- [Lancey et al., *Nature Communications* (2020), structure of the processive human Pol δ holoenzyme](https://doi.org/10.1038/s41467-020-14898-6).
- [Yin et al., *FEBS Journal* (2024), RNA primer synthesis by the human primosome](https://doi.org/10.1111/febs.17082).
