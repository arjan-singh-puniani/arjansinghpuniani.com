# Agent Orange release report

Status as of 2026-11-18: **BLOCKED — production release criteria are not met**

| Gate | Status | Evidence |
| --- | --- | --- |
| Evidence-backed claims | PASS, limited scope | `evidence.json`; primary JAMA abstract and EPA/PubChem/NINDS sources linked in route. It records the related-diagnosis estimates, direct-exposure RBD subgroup, cohort age/sex, covariates named in the abstract, and explicit full-text/absolute-event-count gaps. |
| Chemical identity and distinctions | PASS | Three individual PubChem SDFs; asserted formulas, atom and bond counts; separate 2,4-D, 2,4,5-T, and TCDD labels |
| Epidemiological estimate and caveats | PASS, primary-abstract scope only | Cohort 4,468,509 from 4,917,272 screened; mean follow-up 12.5 years; 98% male, mean age 60.6; 1,035,210 (23.2%) self-reported exposure and 7,600 direct/occupational; PD HR 1.44 (95% CI 1.37–1.52), direct/occupational PD HR 1.99 (1.71–2.32); abstract also reports RBD HR 1.78 and DLB HR 1.66. Abstract states cumulative-incidence analyses account for death as a competing risk, age, TBI, and frailty. Estimates are associations, not absolute risk or proof of causation; study does not isolate 2,4-D. Full article methods and limitations not accessed. |
| Neuroanatomy provenance | PASS, limited atlas scope | CIT168 1 mm MNI template label map; bilateral putamen, caudate, and SNc labels decoded through NIfTI affine and exported as smoothed display surfaces; not individual or veteran anatomy |
| Third-party asset licensing | PASS, attribution applied | The official OSF API declares CC BY 4.0 for the CIT168 project node; the peer-reviewed atlas paper is also CC BY 4.0. The route credits the atlas and links its license; remeshing and smoothing are disclosed in `ASSET_PROVENANCE.md` |
| Interactive route | PASS, partial | Production build served `/agent-orange`; current Chrome review confirmed the Substantia nigra surface and its atlas provenance update. Existing desktop/mobile browser checks cover molecule selection, keyboard/touch rotation, reduced motion, MP4 playback, horizontal overflow, and console/request errors. Real iOS/Safari and performance/memory measurements remain untested |
| Editable Blender assets | PASS, partial | Three molecular `.blend` files, CIT168-derived `.blend`, and `agent-orange-film.blend`; generated with Blender 5.3.0 |
| Genuine 3D animation | PASS, review cut | Seven camera-animated Blender shots; all 2,520 Cycles frames encoded and inspected at eight timeline beats; revised neuron and mitochondrial shots inspected at full frame size |
| 90–120 second film file | BLOCKED, current source revision rendering | The existing `public/agent-orange/agent-orange-film-silent-review.mp4` is a previously verified 718×404 silent review cut and does not include the revised opening. The current source is rendering at 1920×1080, 24 fps, 4 Cycles samples in `artifacts/agent-orange/film-frames-1080p/`; at 06:26 PST, frames 1–48 of 2,520 existed. It is not encoded or fully reviewed yet. |
| Production master / 4K | BLOCKED | No verified GPU device; current render is 720×405 CPU. No 4K master rendered |
| Narration and synchronized audio | BLOCKED | Timed narration draft exists in `narration.md`; no approved voice recording/service, sound stems, or audio mix. Captions in `public/agent-orange/captions.srt` are draft timings and are not voice-synchronized |
| Browser/mobile/accessibility checks | PARTIAL | Automated Chrome desktop/mobile emulation covered route, WebGL, keyboard rotation, touch rotation, reduced motion, video playback, and overflow. Real devices, Safari/Firefox, broader keyboard/navigation and screen-reader review, measured performance, and memory checks remain |
| Build and existing tests | PASS | Clean-install `npm run build`, `npm run typecheck`, `npm run lint`, and `npm test` passed; 7 tests passed. `/agent-orange` first-load JS is 265 kB. Build warns that a parent lockfile causes Next.js to infer `/Users/arjan` as the workspace root. |
| Dependency security review | PARTIAL | `npm audit --omit=dev`: 0 vulnerabilities. Full audit: 20 high-severity findings in development dependencies through Picomatch, with no patched version listed; npm's offered forced fix downgrades Vitest across a breaking major. |
| Existing portfolio regression | PARTIAL | Production build completed; existing routes were not comprehensively browser-tested |
| Deployment | NOT DEPLOYED | No production deployment made; preview deployment was not produced |

## Render and review record

- `public/agent-orange/renders/film-preview/` contains eight rendered representative keyframes from the Blender scene. The opening was subsequently rebuilt as a C-123 Provider-inspired schematic and re-rendered at preview size; its aircraft and spray remain illustrative. Chemical identities are separate; CIT168 surfaces are labeled as a group template; candidate mechanisms are labeled as hypotheses; the final chart uses adjusted hazard-ratio points and confidence intervals with HR 1.0 reference.
- The old 2,520-frame 720×405 render and encoded contact sheet are retained as review evidence for the previous scene revision. The new 1080p render is incomplete, so no updated encoded-film inspection or black-frame scan has been performed. The aircraft, neuron, mitochondrion, and pathway geometry remain schematic and visibly short of studio-finished cinema; see `CREATIVE_REVIEW.md` for the scope and evidence of each review.

## Release decision

Do not describe this work as production-ready or deploy it. Remaining release blockers include recording narration, producing a sound mix, synchronizing captions, rendering an appropriate production master, real-device/accessibility checks, measured performance, full route regression, and individual dependency advisory review. No independent scientific or clinical expert review has occurred.
