# Verification record — 11 October 2026

This is a tested release candidate with a complete first level. It is not a claim that every ambitious rendering or physical-device target in the reference brief has been achieved.

## Automated results

| Check | Result | Evidence |
| --- | --- | --- |
| Strict TypeScript and Vite production build | Passed | Production browser suite rebuilds before serving `dist/` |
| Biological and structural unit tests | 22 / 22 passed | `evidence/unit-results.json` |
| Complete production browser suite | 18 / 18 passed; no skips or flaky tests | `evidence/browser-full-results.json` |
| Final visual-layout and completion regressions | 10 / 10 passed in Chromium and WebKit | `evidence/browser-results.json` |
| Dependency audit | Zero known vulnerabilities | `evidence/dependency-audit.json` |
| Molecular source validation | Passed for all three assembly assets | `python3 scripts/prepare-molecules.py --validate-only` |

The complete browser suite tests asset loading, three representations, molecular inspection and evidence, actual camera-position changes, pause/reset, mode changes, touch input, missing assets, missing WebGL, and the entire first-level pathway. The complete level deliberately tries invalid primer placement, a wrong polymerase, a mismatched dNTP, and premature ligation. It recovers, matures 150 nt, updates the replicated counter, and restarts successfully. Chromium additionally tests WebGL context loss/restoration. The normal launch test observes no uncaught page errors.

The final regression run followed CSS-only corrections for short desktop layouts and Safari range controls. It rechecks the level and every required viewport in both engines, including an assertion that the desktop introduction and HUD do not overlap. These 10 cases are a subset of the 18-case suite; they are not counted as 10 additional product capabilities.

## Visual inspection

Actual production screenshots were inspected at 390×844, 430×932, 1440×900, and 1920×1080. Each engine's PNGs are in `evidence/`; completed-level screenshots are included. A live native Codex-browser preview was also inspected repeatedly.

The scene uses the reference's slate atmosphere, dense irregular molecular beads, violet/cyan/mint/blue identities, muted coral and pale DNA, sparse nucleotide particles, vertical composition, and translucent lower-left monitoring. It preserves the molecular aesthetic without TikTok branding or social controls. Authentic CA-derived shapes replace generic geometric proxies where coordinates exist.

Inspection identified and corrected oversized beads on conceptual proteins, broken local font URLs, insufficient mobile touch targets, desktop text/HUD overlap, an overlapping completion-screen selector, and thick native Safari timeline styling. The primary gameplay buttons have at least 44 px height. Molecular inspection has a button-based alternative to canvas picking. The source dialog traps focus; motion preference is respected.

## Rendering observations

The native in-app browser on this Mac, at 618×770, showed a four-second window of 60 fps in High quality with 20 draw calls and approximately 2.42 million triangles. Under concurrent browser-test load, the final adaptive implementation switched to Mobile detail and showed 30 fps, 18 draw calls and 157,560 triangles. These observations are recorded in `evidence/performance.json`.

These are sampled local observations, not sustained benchmarks or proof of a universal target. Chromium headless/software rendering was substantially slower than native WebKit. The fix reduces geometry as well as resolution and detects software renderers at startup; browser interaction tests subsequently passed. Static molecular data are local and about 678 KB combined before compression. Runtime rendering does not download the original 4.2 MB compressed source assemblies.

## Acceptance assessment

| Area | Status |
| --- | --- |
| Animated molecular hero, irregular protein geometry, DNA and compact HUD | Implemented and visually inspected |
| Human protein identity and experimental provenance | Implemented; independently solved assemblies clearly distinguished |
| Complementarity, antiparallel orientation and opposite daughter growth directions | Unit-tested |
| Priming, clamp loading, Pol δ handoff, incremental elongation, processing and ligation | Complete deterministic state machine, unit-tested and played through in both browsers |
| Nick removal, mature daughter sequence and honest counters | Unit-tested; completed level displays 150 mature positions |
| Watch, Explore, Play, inspection, five camera options, replay, quality controls and sound toggle | Implemented; main interaction paths browser-tested |
| Multiple overlapping fragment states | Implemented in automatic simulation; two older fragment trails retained visually |
| Portrait layouts and touch controls | Browser-tested at the requested dimensions |
| Context interruption, unavailable graphics and unavailable assets | Browser-tested fallbacks |
| Source, build, tests, screenshots, provenance and startup/deployment instructions | Included |
| Existing website preservation | Only the new `replisome/` directory was changed; no existing application was modified |
| Physical iPhone/Safari, thermal behavior, VoiceOver and sustained memory/GPU profiling | Not verified on physical devices |
| Atomistic solvent surface, exact kinetic trajectories and docking of separate complexes | Outside scope; never claimed |
| Screen-space AO, depth of field, subsurface scattering and bloom | Not implemented; lighting/materials provide the current cinematic shading |
| Additional game levels | Deferred in favor of a complete first level |

The structural view preserves source assembly geometry; the hero arrangement, DNA spacing, nucleotide summary geometry, protein motion and reaction timing remain educational simplifications. See `STRUCTURES.md` and the in-app Sources & model notes dialog. The short-flap maturation pathway is illustrative and does not exclude other supported processing mechanisms.
