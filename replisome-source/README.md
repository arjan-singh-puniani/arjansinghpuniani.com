# REPLISOME

A standalone, interactive human DNA replication exhibit. Watch the replication fork, explore experimentally informed protein shapes, or complete the first Okazaki fragment through a guided biological challenge.

## Run

Node.js 22.12+ is required. From this directory:

```sh
npm ci
npm run dev
```

Open the Local URL printed by Vite. Production output:

```sh
npm test
npm run build
```

Serve `dist/` with any static HTTPS host. The application is client-only; it needs no backend, account, or secrets. Sites deployment configuration is tracked in `.openai/hosting.json`. Keep its project ID when updating this Site. For an existing portfolio, deploy this directory separately and link to it, or serve the built assets under `/playground/replisome/` after setting Vite's `base` to that path and adjusting the font stylesheet URL. No existing portfolio files were changed.

## Browser verification

The browser suite builds the production bundle and starts its own preview server at `http://127.0.0.1:5174`:

```sh
npx playwright install chromium webkit
npm run test:e2e
```

The suite tests launch, assets, representations, inspection, camera controls, pause/restart, invalid actions, proofreading recovery, complete first-level ligation, asset failures, and four responsive viewports in Chromium and WebKit. Chromium also exercises WebGL context loss and restoration. Screenshots and the JSON test report are saved in `evidence/`.

## Controls

- **Watch:** automatic fixed-step replication. Pause, change speed, replay the first 90 seconds, select a molecule, and switch cameras or representations.
- **Explore:** freezes biological time while orbit, pan, pinch/zoom, and molecule inspection remain available. Buttons provide keyboard alternatives for orbit and zoom. Arrow keys pan; Space toggles pause, L toggles labels, and Escape closes settings or the sources dialog.
- **Play:** place a primer, load PCNA, choose Pol δ, pair four dNTPs, proofread mistakes, process the primer flap, and ligate the nick. Every button changes or validates the simulation state.
- Sound is muted initially and starts only after the user enables it. It uses brief synthesized reaction cues. Fullscreen falls back to a message on unsupported devices. The sources dialog traps keyboard focus and restores it on closing.

## Architecture

| Module | Responsibility |
| --- | --- |
| `src/simulation/engine.ts` | Seeded sequence, fixed-step engine, 11 fragment states, reaction prerequisites, nucleotide/ATP accounting, replay and gameplay validation |
| `src/experience/Scene.tsx` | Three.js WebGL2 scene, instanced bead proteins/DNA, experimental assembly view, choreography, cameras, ray-cast selection, responsive resolution and resource cleanup |
| `src/experience/dna.ts` | Canonical B-DNA dimensions, right-handed helix and complementary antiparallel nucleotide descriptors |
| `src/data/molecules.ts` | Color identities, mechanisms, evidence labels and structural references |
| `src/App.tsx` | Watch/Explore/Play controls, guided level, live HUD, inspector, sound, accessibility and browser-local preferences |
| `scripts/prepare-molecules.py` | Reproducible assembly parsing, provenance, chain classification, residue traces and LODs |
| `public/molecules/` | Local runtime coordinate assets and compressed original biological assemblies |

Render time never determines a biological reaction. `ReplicationEngine.advance()` accumulates elapsed simulation time in 0.05-second steps. Changing playback speed changes the accumulated time, not the reaction rules. Seed 7 produces the default synthetic DNA sequence. Typed events record state transitions by simulation tick and fragment ID; replay resets and advances the same deterministic model.

## Biological rules

The conceptual fork advances along increasing coordinate X. Pol ε copies toward the fork, while each Pol δ fragment extends toward decreasing X. Both daughters grow 5′→3′; their templates are antiparallel. A primer must lie on exposed lagging template no more than 30 nt behind the fork. The surrounding duplex and preceding daughter material are implicit starting context for this elongation model.

Each representative fragment is 150 nt: 10 RNA primer nucleotides, 20 Pol α DNA nucleotides, then 120 Pol δ DNA nucleotides. RFC loads PCNA only at the RNA–DNA junction. Processing follows completion; Pol δ displacement and FEN1 cleavage replace the primer with DNA. Ligation requires the processed nick. A mature fragment has no primer and no nick, and its full daughter sequence is complementary to the template.

The **DNA replicated** counter counts unique template positions whose leading copy is present and whose lagging fragment has matured. It counts a genomic position once, rather than adding both daughter syntheses. The engine separately tracks dNTP substrates. Displayed **modeled ATP** follows explicitly illustrative accounting: 1 motor ATP per 10 nt of fork progress, 2 ATP per PCNA loading, and 1 ATP per ligation. Motor/RFC values are not calibrated experimental stoichiometries. Primase nucleotide substrates and other cellular energy expenditure are outside this accounting. Initial leading synthesis starts at 146 nt; the counter only reports newly matured fragments.

Correct decisions earn 100 game points. Rejected actions subtract 10 points, with a floor of zero. Proofreading recovers a stalled mismatch without awarding repeatable points. This is a game score, not a biochemical measurement. Best score and reduce-motion preference persist locally when browser storage is available. The first level is complete; levels 2 and 3 are intentionally outside this release.

## Structural evidence

Runtime assets use author-deposited biological assembly 1 for [7PFO](https://www.rcsb.org/structure/7PFO), [6TNZ](https://www.rcsb.org/structure/6TNZ), and [8QJ7](https://www.rcsb.org/structure/8QJ7). The cinematic scene places these independently solved structures into an illustrative fork arrangement. Structural evidence mode preserves source coordinates within each assembly and includes deposited DNA and 7PFO accessory factors. It does not claim that separate complexes were experimentally docked together.

[STRUCTURES.md](docs/STRUCTURES.md) records exact chain mappings, modeled residues, unresolved gaps, source checksums, assembly provenance, reproduction commands, redistribution terms and the runtime schema. Supporting references are [6TNY](https://www.rcsb.org/structure/6TNY), [8YJZ](https://www.rcsb.org/structure/8YJZ), [Eukaryotic DNA Replication Fork](https://doi.org/10.1146/annurev-biochem-061516-044709), and the [NCBI replication chapter](https://www.ncbi.nlm.nih.gov/books/NBK26850/). The NCBI page was inaccessible to the research tool during this build; conclusions rely on the accessible structure records and review.

## Representation and performance limits

The bead view approximates residue-level protein shape. It is **not** a solvent-excluded atomic surface. Decorative bead offsets in high/ultra view improve surface texture; structural view uses deposited CA positions without those offsets. The cartoon is a smoothed CA backbone trace that respects chain breaks, rather than a secondary-structure assignment. RFC, RPA and ligase are explicitly conceptual procedural shapes. Unresolved residues and active sites are not reconstructed.

DNA geometry uses a right-handed 10.5 bp twist. Canonical geometry defines 0.34 nm rise and approximately 1 nm radius; cinematic spline spacing, size and reaction timing are exaggerated. Several visual beads summarize a nucleotide interval. The scene is a fork-centered explanatory view rather than an atomistic trajectory. Protein fluctuations, diffusion, flap motion and positioning are illustrative. The short-flap pathway is one supported maturation route; RNase H2 and DNA2-related routes are not simulated.

Ultra and High use dense instancing; Balanced and Mobile subsample residues. Device pixel ratio is capped by quality, and a sustained render rate below 26 fps reduces geometry and resolution; detected software renderers start at Mobile detail. Shared sphere geometry and per-protein instancing limit draw calls. Expensive coordinate processing runs offline; opening uses local JSON, not large remote PDB downloads. Only two older fragment trails remain in the visible scene, and rendering resources are disposed on resets and representation changes. A session pauses after 10 minutes to bound state/event growth; restart begins a fresh session. A production bundle includes the complete Three.js renderer, so its approximately 515 KB uncompressed vendor chunk exceeds Vite's default 500 KB advisory; compressed transfer is about 129 KB.

Measured desktop rendering and browser outcomes are documented in [VERIFICATION.md](docs/VERIFICATION.md). Physical iPhone performance, thermal behavior, VoiceOver, and prolonged GPU memory profiling remain release-validation work. No claim of universally achieved 60 fps or mistake-free production readiness is made. The experience uses cinematic PBR lighting; it does not implement screen-space ambient occlusion, subsurface scattering, depth of field or bloom. Those effects were omitted to preserve readability and compatibility.

Fonts are bundled locally with their SIL Open Font License files under `public/fonts/`. There are no runtime external font requests. All scientific simplifications are also accessible through the in-app Sources & model notes dialog.
