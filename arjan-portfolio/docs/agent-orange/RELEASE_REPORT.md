# Agent Orange release report

Status as of 2026-11-18: **BLOCKED — production release criteria are not met**

| Gate | Status | Evidence |
| --- | --- | --- |
| Evidence-backed claims | PASS, limited scope | `evidence.json`; primary JAMA article and EPA/PubChem/NINDS sources linked in route |
| Chemical identity and distinctions | PASS | Three individual PubChem SDFs; asserted formulas, atom and bond counts; separate 2,4-D, 2,4,5-T, and TCDD labels |
| Epidemiological estimate and caveats | PASS, abstract-level verification | Cohort 4,468,509 from 4,917,272 screened; mean follow-up 12.5 years; 1,035,210 (23.2%) self-reported exposure and 7,600 direct/occupational; HR 1.44 (95% CI 1.37–1.52), subgroup HR 1.99 (1.71–2.32); association, not causation or absolute risk |
| Neuroanatomy provenance | PASS, limited atlas scope | CIT168 1 mm MNI template label map; bilateral putamen, caudate, and SNc labels decoded through NIfTI affine and exported as smoothed display surfaces; not individual or veteran anatomy |
| Third-party asset licensing | PASS, attribution applied | The official OSF API declares CC BY 4.0 for the CIT168 project node; the peer-reviewed atlas paper is also CC BY 4.0. The route credits the atlas and links its license; remeshing and smoothing are disclosed in `ASSET_PROVENANCE.md` |
| Interactive route | PASS, partial | Production build served `/agent-orange` with HTTP 200. Playwright desktop (Chrome) and mobile emulation verified WebGL ready state, molecule selection, keyboard rotation, touch selection and rotation, reduced-motion default, horizontal overflow, MP4 playback, and no console/request errors. Real iOS/Safari and performance/memory measurements remain untested |
| Editable Blender assets | PASS, partial | Three molecular `.blend` files, CIT168-derived `.blend`, and `agent-orange-film.blend`; generated with Blender 5.3.0 |
| Genuine 3D animation | PASS, review cut | Seven camera-animated Blender shots; all 2,520 Cycles frames encoded and inspected at eight timeline beats; revised neuron and mitochondrial shots inspected at full frame size |
| 90–120 second film file | PARTIAL, silent visual MP4 | `public/agent-orange/agent-orange-film-silent-review.mp4` contains 2,520 Cycles frames as H.264, 24 fps, 105 seconds, 718×404, about 4.0 MB. `ffprobe` verified codec, dimensions, cadence, frame count, and duration; the encoded contact sheet and revised shots were inspected; `blackdetect=d=0.01:pix_th=0.1` found no black intervals. No audio stream is present, so this is not the finished narrated film. |
| Production master / 4K | BLOCKED | No verified GPU device; current render is 720×405 CPU. No 4K master rendered |
| Narration and synchronized audio | BLOCKED | Timed narration draft exists in `narration.md`; no approved voice recording/service, sound stems, or audio mix. Captions in `public/agent-orange/captions.srt` are draft timings and are not voice-synchronized |
| Browser/mobile/accessibility checks | PARTIAL | Automated Chrome desktop/mobile emulation covered route, WebGL, keyboard rotation, touch rotation, reduced motion, video playback, and overflow. Real devices, Safari/Firefox, broader keyboard/navigation and screen-reader review, measured performance, and memory checks remain |
| Build and existing tests | PASS | `npm run build`, `npm run typecheck`, `npm run lint`, and `npm test` passed; 7 tests passed |
| Dependency security review | BLOCKED | Install reported 33 advisories (8 moderate, 23 high, 2 critical); advisory endpoint DNS failed, so findings could not be individually reviewed |
| Existing portfolio regression | PARTIAL | Production build completed; existing routes were not comprehensively browser-tested |
| Deployment | NOT DEPLOYED | No production deployment made; preview deployment was not produced |

## Render and review record

- `public/agent-orange/renders/film-preview/` contains eight rendered representative keyframes from the actual Blender scene. The aircraft shot is explicitly an illustrative reconstruction; chemical identities are separate; CIT168 surfaces are labeled as a group template; candidate mechanisms are labeled as hypotheses; the final chart uses adjusted hazard-ratio points and confidence intervals with HR 1.0 reference.
- The 2,520-frame render is complete under `artifacts/agent-orange/film-frames/`. The neuron and mitochondrial scenes were revised and frames 1081–1800 rerendered; the encoded film and contact sheet were inspected. The final 15-second chart scene is held on a single confidence-interval frame as a deliberate evidence pause. No black intervals were detected. The aircraft, neuron, mitochondrion, and pathway geometry remain schematic and visibly short of studio-finished cinema; the creative review records concrete evidence and scores in `CREATIVE_REVIEW.md`.

## Release decision

Do not describe this work as production-ready or deploy it. Remaining release blockers include recording narration, producing a sound mix, synchronizing captions, rendering an appropriate production master, real-device/accessibility checks, measured performance, full route regression, and individual dependency advisory review. No independent scientific or clinical expert review has occurred.
