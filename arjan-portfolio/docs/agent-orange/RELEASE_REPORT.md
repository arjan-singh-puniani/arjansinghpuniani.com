# Agent Orange release report

Status as of 2026-11-18: **BLOCKED — production release criteria are not met**

| Gate | Status | Evidence |
| --- | --- | --- |
| Evidence-backed claims | PASS, limited scope | `evidence.json`; primary JAMA article and EPA/PubChem/NINDS sources linked in route |
| Chemical identity and distinctions | PASS | Three individual PubChem SDFs; asserted formulas, atom and bond counts; separate 2,4-D, 2,4,5-T, and TCDD labels |
| Epidemiological estimate and caveats | PASS, abstract-level verification | Cohort 4,468,509; HR 1.44 (95% CI 1.37–1.52); direct/occupational subgroup HR 1.99 (1.71–2.32); association, not causation or absolute risk |
| Neuroanatomy provenance | PASS, limited atlas scope | CIT168 1 mm MNI template label map; bilateral putamen, caudate, and SNc labels decoded through NIfTI affine and exported as smoothed display surfaces; not individual or veteran anatomy |
| Third-party asset licensing | BLOCKED | PubChem records and project sources are recorded; the CIT168 source repository has an MIT license, but the OSF NIfTI asset-level license was not confirmed. Clear redistribution rights for the atlas and derived surfaces before deployment |
| Interactive route | PASS, partial | Three.js route at `/agent-orange`; brain schematic plus atlas and molecule GLBs; desktop selection controls inspected in browser |
| Editable Blender assets | PASS, partial | Three molecular `.blend` files, CIT168-derived `.blend`, and `agent-orange-film.blend`; generated with Blender 5.3.0 |
| Genuine 3D animation | PASS, preview only | Seven camera-animated 3D shots in Blender; representative Cycles keyframes rendered and inspected; real scene objects move across time |
| 90–120 second film file | BLOCKED | `artifacts/agent-orange/film-frames/` contains 2,520 rendered frames. `public/agent-orange/film-visual-review.webp` is a verified 105.898-second, 720×405 silent motion review assembled from those frames. MP4 delivery is unavailable: this Blender build exposes no movie file format, the Motion JPEG writer failed, and macOS `avconvert` cannot read animated WebP. The WebP is a review preview, not the requested film master. |
| Production master / 4K | BLOCKED | No verified GPU device; current render is 720×405 CPU. No 4K master rendered |
| Narration and synchronized audio | BLOCKED | Timed narration draft exists in `narration.md`; no approved voice recording/service, sound stems, or audio mix. Captions in `public/agent-orange/captions.srt` are draft timings and are not voice-synchronized |
| Browser/mobile/accessibility checks | PARTIAL | Desktop route and selection controls inspected. Dedicated mobile/touch, complete keyboard, reduced-motion, browser compatibility, performance and memory checks remain |
| Build and existing tests | PASS | `npm run build`, `npm run typecheck`, `npm run lint`, and `npm test` passed; 7 tests passed |
| Dependency security review | BLOCKED | Install reported 33 advisories (8 moderate, 23 high, 2 critical); advisory endpoint DNS failed, so findings could not be individually reviewed |
| Existing portfolio regression | PARTIAL | Production build completed; existing routes were not comprehensively browser-tested |
| Deployment | NOT DEPLOYED | No production deployment made; preview deployment was not produced |

## Render and review record

- `public/agent-orange/renders/film-preview/` contains eight rendered representative keyframes from the actual Blender scene. The aircraft shot is explicitly an illustrative reconstruction; chemical identities are separate; CIT168 surfaces are labeled as a group template; candidate mechanisms are labeled as hypotheses; the final chart uses adjusted hazard-ratio points and confidence intervals with HR 1.0 reference.
- The preview shows useful 3D depth and motion, but the assets are still stylized, text is small at phone size, and several scientific structures are simplified. This is an engineering prototype, not studio-finished cinema.
- The 2,520-frame render is complete under `artifacts/agent-orange/film-frames/`. The final 15-second chart scene is held on a single accurate confidence-interval frame as a deliberate evidence pause. The animated WebP review was verified at 720×405 and 105.898 seconds; it has no audio. An MP4 master and final encoded-video inspection remain blocked by unavailable encoders.

## Release decision

Do not describe this work as production-ready or deploy it. Remaining release blockers include completing and inspecting the encoded film, voice recording and sound mix, matching captions to final narration, CIT168 asset-license confirmation, mobile and accessibility checks, measured performance, full route regression, and individual dependency advisory review. No independent scientific or clinical expert review has occurred.
