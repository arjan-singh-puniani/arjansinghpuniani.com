# Living shoulder implementation and visual QA — October 26, 2026

The shoulder now opens as a discovery workspace. Source cuff surfaces deform locally under Forceps; deliberate Retractor holds preserve exposure. The original deltoid/cuff specimen, atlas studies, guided lesson, quiz and portfolio routes remain available. No anatomy asset, source mesh topology, global portfolio navigation, SEO, analytics or dependency was replaced.

## Implementation

- `deformation.js`: fixed-step 120 Hz XPBD surface constraints, geodesic grasp falloff, nonlinear bounded input, direction-dependent edge compliance along a **derived shape axis**, opposite-edge bending distances, closed-surface volume correction, local bone-facing contact guards and overdamped rest-shape recovery. A maximum four substeps prevents long-frame catch-up explosions. Source support particles have zero inverse mass.
- `tissue-runtime.js`: transforms source surfaces to world space, welds coincident simulation particles, joins only the source-classified infraspinatus muscle/tendon seam, updates actual visual vertex buffers, welded shading normals, bounds and BVH. Source assets on disk are unchanged. The tendon-classified region has 0.15× muscle compliance, an illustrative setting.
- `anatomy.js`: machine-readable source/curriculum definitions, explicit missing fields, coupled-source relationships and reproducible support-region rules. Source insertion-adjacent 3.5% and medial 20% near the source scapula are fixed; these are **derived approximate support patches, not measured origin/insertion footprints**. No fiber map is available or fabricated.
- Forceps releases for recovery. Retractor holds a bounded elastic exposure on cuff muscles and whole-source-mesh exposures on other supplied surfaces. It does not infer surgical separation planes. Restore, undo and original positions remain available. The tendon and its muscle share one elastic owner, including direct restore behavior.
- Pointer capture separates a grasp from camera movement. Empty-space drags orbit; unsupported tissue drags do not rotate the camera under Forceps. Cancellation covers escape, pointer cancellation, lost capture, a second touch, tool changes, reset, resize and window blur. Discrete input states are exposed to tests.
- Opening UI: anatomy, compact tool dock, names, camera/reset controls. Details contains optional stations, source notes and curriculum. Hover uses a small local contact indicator. Probe can identify ghosted bone context. Keyboard alternatives preserve focus and open disclosures. Sound/vibration are optional, off initially and never required.
- Cached preparation avoids rebuilding support data on a warm grasp. A measured automatic responsive tier reduces solver iterations from five to three when mean solver work exceeds 8 ms over 24 active frames; manual override is secondary. Both tiers preserve fixed supports, contact guards and tools. Ghost context uses one transparent draw pass.

## Evidence

Baseline freeze/plan: [baseline](HOLOANATOMY-LIVING-BASELINE.md). Full loaded mesh inventory: [mesh audit](shoulder-living/baseline/mesh-audit.json).

| View | Before | After |
|---|---|---|
| Desktop opening, 1440 × 900 | [baseline](shoulder-living/baseline/desktop.png) | [discovery](shoulder-living/after/opening.png) |
| Interaction | [rigid Peel](shoulder-living/baseline/peel.png) | [actual grasp](shoulder-living/after/infraspinatus-grasp.png), [held exposure](shoulder-living/after/retracted.png) |
| Mobile, 390 × 844 | [baseline](shoulder-living/baseline/mobile.png) | [opening](shoulder-living/after/mobile.png), [optional inquiry](shoulder-living/after/mobile-inquiry.png) |

The browser test performs genuine pointer drags against ray-picked rendered anatomy. It compares vertex buffers before/during the drag and separately verifies that the mesh object position has not changed. Fixed support error: 0. Peak displacement in this acceptance grasp: 0.1578 normalized units. After release: 0 displacement and source volume ratio 1.0000. Local guard-plane penetration is numerical roundoff; this is **not** a proof of global anatomical collision correctness.

All four actual source assemblies exercised:

| Structure | Welded particles | Fixed particles | Fixed-patch drift | Local guard-plane penetration |
|---|---:|---:|---:|---:|
| ZA_infra | 1585 | 287 | 0 | 3.2e-17 |
| ZA_supra | 717 | 160 | 0 | 2.4e-17 |
| ZA_teres | 763 | 156 | 0 | 2.7e-17 |
| ZA_subscap | 1471 | 347 | 0 | 4.7e-17 |

[Actual source-derived support data, attribution and review status](shoulder-living/after/derived-support-regions.json). [All loaded anatomical definitions](shoulder-living/after/anatomical-definitions.json). [Raw browser results](shoulder-living/after/results.json).

## Measured performance

Local Chrome, 1440 × 900, DPR 1, precision mechanics, 91 sustained manipulation samples. These are local automation measurements, not an iPhone or deployment guarantee.

| Metric | Final sample |
|---|---:|
| Mean frame interval | 16.85 ms |
| 95th percentile frame interval | 16.80 ms |
| Mean solver + geometry-update work | 4.18 ms |
| 95th percentile solver work | 5.00 ms |
| Warm grasp setup | 0.60 ms |
| Draw calls | 11 |
| Rendered triangles (includes context passes) | 44,628 |
| Source load-stage duration | 128.0 ms |

The final source-viewer interactive mark was 239.0 ms after navigation. Source-resource decoded bytes: 2,680,902; transferred bytes: 2,018,324. These are localhost values, not portfolio-wide TTI or internet-load estimates. The 95th-percentile input-event-to-render-submit proxy was 17.10 ms across the interaction suite; it includes CPU submission, not GPU/display photon latency. Solver typed-array byte counts are reported per structure; they exclude JavaScript object overhead, renderer buffers and driver memory. Source texture memory remains zero; the renderer separately accounts for shadow-map memory. Across runs, desktop cadence varied between roughly 16.7 and 33.4 ms. Uniform desktop 60 fps and physical iPhone performance are **not established**.

## Verification

- 95 existing portfolio tests pass.
- 30 shoulder tests pass, including nine new solver tests: real source deformation, fixed patches, convergence, extension bounds, variable 30/60/120 Hz timing, extreme alternating input, repeated grasps, recovery, contact guards, coordinate translation and responsive quality.
- Production build and sequential typecheck pass; changed runtime JavaScript passes ESLint.
- Real-browser tests cover direct deformation, deliberate holding/restoration, camera separation, escape/tool/resize cancellation, two-finger touch cancellation, keyboard inquiry and shortcuts, mobile width, source definitions and all four cuff surfaces. Desktop/mobile axe checks report no tested violations.
- Original viewer regressions pass: camera presets, rendered picking, orbit suppression, pan, pinch, legacy Peel/undo, lesson, actual 3D quiz, mobile portrait/landscape, OBJ fallback and LOD2.
- Supplemental atlas selection/provenance/OBJ/failure-isolation tests and complete guided presentation/quiz session pass.
- Compatibility: chrome-obj 156.0.8078.48 (PASS), firefox 153.0 (PASS), webkit 26.6 (PASS). Firefox uses the already-installed browser path supplied through `QA_FIREFOX_EXECUTABLE`; no dependency/browser download was added. [Results](shoulder-living/compatibility/results.json).
- 14 portfolio routes, embedded viewer, legacy viewer and sitemap smoke checks pass. [Report](shoulder-living/after/portfolio-smoke.json).

## Five significant defects corrected during refinement

1. Rigid-object pulling: replaced by local source-vertex deformation with fixed support patches; source muscle and tendon share seam particles.
2. Ambiguous release behavior: Forceps recovery and deliberate Retractor holding are mechanically distinct, reversible actions.
3. Leaking gesture state: cancellation and multitouch restore the active grab, suppress accidental selection, and preserve separate camera control.
4. Interface obstruction: opening drawer removed, mobile framing/overflow corrected, bone probing and keyboard focus/disclosures restored.
5. Drift and frame spikes: exact rest restoration, bounded steps, cached preparation, lower-allocation constraint loops, cached orientation UI, single-pass ghost rendering and measured quality adaptation.

## Scientific and validation boundary

The numerical tests verify this simplified model, not human tissue mechanics. Support patches and the longitudinal axis are geometrically derived and require independent anatomical landmark review. Contact guards are local source-surface half-spaces; there is no global bone signed-distance field, full inter-tissue collision solver or self-collision solver. Volume correction acts on a closed **surface**, not a validated volumetric muscle model. Recovery is an overdamped rest-shape interpolation, not a measured relaxation experiment. No cutting, incision mechanics, patient-specific constitutive law, force output, fluid bursa model, or surgical validation is claimed. Other source meshes retain whole-mesh exposure behavior because deformable attachment definitions are unavailable.

Four complete cuff tendons, measured footprints, true fiber data and clinically reviewed ligament/nerve pathways remain asset/review gaps. Existing source surface detail remains the rendering ceiling. No missing anatomy or physiological coupling was invented. Adjacent structures respond only where a common source surface actually provides a shared seam.

Physical-phone manipulation, hardware vibration/audio behavior, expert landmark review and first-time usability studies remain unverified. Browser automation demonstrates interactions and layout; it cannot establish that every first-time visitor finds the experience intuitive or that medical educators validate it.

## Reproduce

Run the portfolio production preview on 127.0.0.1:4195, then:

```sh
npm test
npm run test:shoulder
npm run build
npm run typecheck
node tools/shoulder/living-qa.mjs
node tools/shoulder/dissection-qa.mjs
```

`specimen=legacy` opens the original specimen directly. Existing browser suites accept their recorded local URL/environment options. Run typecheck after build, because Next regenerates `.next/types` during a build.

Method: [XPBD — Macklin, Müller & Chentanez, 2016](https://mmacklin.com/xpbd.pdf). Anatomical cross-check: [peer-reviewed shoulder anatomy study](https://pmc.ncbi.nlm.nih.gov/articles/PMC11142962/), [infraspinatus curriculum reference](https://www.ncbi.nlm.nih.gov/books/NBK513255/). Source identity, license and model geometry remain distinct from curriculum and illustrative mechanics.

Source-derived atlas visuals/data: BodyParts3D — The Database Center for Life Science — CC BY-SA 2.1 Japan; Z-Anatomy — The libre 3D atlas of anatomy — CC BY-SA 4.0. The atlas license/attribution is preserved at `public/holoanatomy/shoulder/assets/atlas/LICENSE.txt`. The original specimen retains its original CC BY 4.0 provenance.
