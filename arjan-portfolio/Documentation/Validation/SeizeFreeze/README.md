# SeizeFreeze release verification — October 30, 2026

This record distinguishes numerical verification, rendered browser inspection, internal agent review and experimental validation. No physical SeizeFreeze hardware, patient, clinical outcome or independent clinical expert review is represented.

## Implemented scope

- Full-screen educational application: `/seizefreeze-lab/index.html`.
- Integrated, titled iframe and launch link at `/work/seizefreeze`; direct homepage launch link.
- Original procedural titanium-like/ceramic device stack, cortical illustration, schematic head scale, anchored labels, actual mesh selection, individual component seating, exploded/complete views and keyboard rotation alternatives.
- Worker-based coupled thermal solver, synthetic detector and controller, 11 illustrative scenarios, deterministic scrubbing/replay, four linked plots, finite heat rejection and live energy ledger.
- Three explanation depths, accessible local KaTeX equations and symbol disclosures, claim map, uncertainty and development experiments.
- Original SVG fallback, explicit static mode, reduced-motion no-autoplay, sensor failure and solver-failure states.

Authorship and project stage remain concept/prototype planning. Competition awards remain team-attributed. Patent/regulatory progress is not asserted. Historical concept media are preserved; ownership/music contracts for that existing film were not newly verified. No private project documents or patient data are copied into this release.

## Reproduce

Use the portfolio's committed lockfile, with Node 20+:

```sh
npm ci
node tools/seizefreeze/model-check.mjs
npm run typecheck
npm run test:coverage
npm run build
npm run start -- --port 3212 --hostname 127.0.0.1
```

With the production server running, and Playwright browser binaries installed:

```sh
node tools/seizefreeze/browser-qa.mjs
node tools/seizefreeze/accessibility-qa.mjs
node tools/seizefreeze/regression-qa.mjs
node tools/seizefreeze/performance-qa.mjs
```

Run performance separately from other browser workloads. `SEIZEFREEZE_BASE_URL` selects the target for the browser, performance and regression scripts. The accessibility script's own environment variable is documented in that script. Recorded browser paths are this Mac's installed Playwright revisions; a different machine needs matching local binaries. The regression/performance native checks request Chromium Metal and must report the detected backend rather than assuming that request succeeded.

The production branch uses Next 15.5.28. It contains unrelated legacy HospitalSIM third-party Three.js files that fail repository-wide ESLint rules (including React-hook false positives inside renderer internals). No HospitalSIM source or lint rule was changed. New KaTeX vendor code is narrowly excluded in ESLint, consistent with the repository's existing vendor exclusions. The release lint command is:

```sh
npm run lint -- --ignore-pattern 'public/hospitalsim/vendor/**'
```

On the clean production-base checkout, TypeScript, all 150 existing coverage tests and the Next 15.5.28 production build passed. The new solver checks pass separately. The scoped lint run has zero errors and 21 existing unused-variable warnings.

The unmodified `npm run verify` command initially fails at those inherited vendor lint errors; it must not be described as passing. The explicit lint exception, TypeScript, coverage tests and production build are checked separately. Existing non-blocking unused-variable warnings remain visible.

## Three rendered review passes

### Pass 1 — scientific coherence and teaching

Inspected actual desktop assembly and 45-second lab renders (`pass1-assembly.png`, `pass1-lab.png`), including the displayed equations. Numerical accounting and the evidence boundary were reviewed by bounded internal agents. Found and corrected:

1. The cortical tint could imply a solved lateral field. Added a note directly beside the tissue view explaining that it extends a one-dimensional depth solution illustratively, with no lateral reach prediction.
2. Original historical physics imagery mislabeled P-type semiconductor. The case-study caption now explicitly corrects the original; new equations use the implemented balance.
3. Playback accumulated rounded frame indices, which could change playback speed with refresh rate. It now advances from elapsed time and explicitly labels 4× playback.
4. Recalculation cleared curves but could leave old numeric readouts visible. Readouts are now cleared until the new result arrives.

### Pass 2 — geometry, materials, framing and interaction

Inspected desktop, 390px, selected thermoelectric, seated, static and head-scale renders. Representative updated evidence: `pass2-native-opening.png`, `pass2-native-thermoelectric.png`, `pass2-native-phone.png`. Found and corrected:

1. A tissue surface intersected its depth slab. Separated the cortical surface and depth bands; replaced isolated bumps with curved gyri.
2. The opening pushed most of the device below the viewport. Tightened the masthead/intro and embedded introduction.
3. Camera presets could clip lifted parts on narrow viewports. Fit the complete stack's bounds, keeping seated and lifted layers in view.
4. Static view retained projected overlays and a low-contrast pressed control. Hide overlays with the canvas and correct pressed foreground color.
5. A head-scale illustration initially made the device too large. Set the scale to the model's assumed 10mm contact against an explicitly assumed approximately 147mm head width; no patient-specific scale claim.
6. Leader SVG paths needed explicit `fill="none"`; otherwise leaders could produce filled triangles. Corrected.

Actual mesh raycasting, per-component seating, reset, keyboard rotation and anchored label projection were exercised. Dragging rotates the view; drag-to-seat was deliberately omitted, with direct click/keyboard seating providing the assembly action.

### Pass 3 — accessibility, responsiveness, performance and failures

Inspected Chromium, Firefox and WebKit renders with reduced motion at phone and desktop sizes; Chromium also at 768px and 1920px. `browser-results.json` contains versions, viewports, errors and adapters. All eight viewport/engine runs completed without page exceptions, failing requests or horizontal overflow. All scenario selectors executed on each desktop engine. Numeric readouts were compared with the shared frame, and all six equations rendered with local KaTeX/MathML.

Found and corrected:

1. Labeled generic containers needed group/image roles. Added the roles.
2. Playback rewrote unchanged live teaching text dozens of times. Announcements now change only when the explanation changes; repeated unchanged mutations dropped to zero.
3. Restoring 3D after scrubbing in static mode retained the old thermal field. Restoring 3D now updates from the current frame. The regression script compares actual canvas hashes at 45 seconds, restored zero seconds and explicitly redrawn zero seconds.
4. Integrated iframe review found duplicate unnamed landmarks across the portfolio and laboratory. Named the laboratory’s main, banner and footer landmarks distinctly.
5. Preserved a suspended page's resources for browser back/forward cache; real page exits dispose the worker, renderer and observers.

`accessibility-results.json` records zero confirmed axe violations in assembly and lab/model views at 1440px and 390px, keyboard selection/seating/chapter/scrubbing, visible focus, reduced-motion idle/no-autoplay, static fallback when WebGL creation fails, and a disabled/honest state when the worker fails. Some SVG/canvas contrast checks remain automated incompletes. No physical-phone, screen-reader, vestibular-sensitivity or human usability testing is claimed. Browser viewport emulation is explicitly not physical-device testing.

## Numerical results

`numerical-results.json` records all scenarios and asserts the full ledger. Maximum residual approximately **1.59×10⁻¹² J**, against a **1×10⁻⁸ J** tolerance. Refining the default 0.01s step against 0.0025s changes the first-cell trajectory by at most approximately **0.00656°C**; refining 0.5mm cells against 0.25mm changes the reconstructed surface by approximately **0.0575°C**. These are implementation/refinement differences, not physiological confidence intervals.

Checks cover equilibrium, zero-current passive conduction/relaxation, symmetric passive perturbations, independent neural waveform, deterministic replay, finite rejection, parameter sensitivity, current limits, sensor failure, latched thermal interlocks, shutdown, invalid input and time/space refinement. See `public/seizefreeze-lab/MODEL.md` for all parameters, units, signs, boundary/initial conditions and omissions; `EVIDENCE.md` maps claims to primary sources.

## Performance and budget

Recorded unthrottled Chromium on this desktop host; device scale factor 1. Native backend was **ANGLE Metal / Apple M2**. The final uncontended 3-second update workload rendered approximately **60.1 fps** at both 1440×1000 and 390×844; 95th percentile animation interval approximately **16.8ms**. Native startup to model availability was approximately **0.54s / 0.41s**, respectively. These are local results, not a cross-device performance guarantee.

Explicit SwiftShader software rendering measured approximately **4.3 fps desktop / 9.6 fps phone-width emulation**, with startup approximately **6.0s / 3.5s**. It is slower and should use the static mode for comfortable exploration. Rendering occurs on demand and stops after pending work settles; no decorative idle loop runs. A single queued render may complete after the test stops requesting updates.

The scene uses about **59 base draw calls**, **26.2K native / 16.5K software triangles**, four textures, and a DPR cap of 1.6 (1.0 software). CPU render-submission time is not GPU execution time. The frame interval workload includes model-to-visual updates and compositor scheduling; no hardware GPU timer query is claimed.

The public laboratory, all local KaTeX fonts/licenses/docs and the reused Three.js runtime total about **2.82MB raw / 0.814MB per-file gzip** in the measured inventory. This is a conservative complete inventory, not initial network transfer: fonts load only when used and documentation is linked. No video, downloaded texture, patient mesh, external font or remote script is required by the laboratory. `performance-results.json` contains the per-asset inventory and exact measurement configuration. Hosting compression may differ.

## Release boundary

Release source is prepared on `codex/seizefreeze-experience-20261030`, based on production `main` at `63d29b1646fc83a84ac3c9f34fa0092b067390e4`, rather than the older working branch. Only the laboratory, its checks/evidence, SeizeFreeze case/home integration and the narrow vendor lint exclusion belong in the release. Other projects, package versions, routing, domain, contact delivery and analytics retain production's current state.

The hosting target is the existing Vercel project **arjan3 / arjansinghpuniani-com**, domain **arjansinghpuniani.com**, reached through its existing GitHub integration. Push the scoped release branch, inspect the resulting Vercel preview, then merge/promote only after deployed checks. Do not substitute another hosting provider, project or domain. Deployment-specific URLs, commit IDs and final smoke results are recorded separately in the release handoff.
