# HoloAnatomy: shoulder conference increment

2026-10-24. Branch `codex/holoanatomy-conference-20261024`, based on portfolio commit `5ac9db16`. Isolated from pending Rally House edits in the primary checkout. No deployment or remote push.

## Product direction

The flagship remains the right shoulder: anatomy, function and spatial learning. The supplied screenshots set a visual ambition; they are neither licensed source assets nor proof of this project's anatomical accuracy. This increment improves the demonstration and learning loop. It does not resolve the source geometry ceiling or claim parity with the references.

## Implemented

- Present enters the existing spatial tour with a quieter, high-contrast notes panel, larger desktop text, direct chapter navigation, Page Up/Down controls and Escape to exit. The specimen remains interactive. The existing fullscreen button is separate.
- Learn includes elevation, external rotation, internal rotation and stability studies. These highlight relevant source muscles and ghost other cuff surfaces, preserve bone context, and provide a spatial observation task. Highlighting is not force, activation or fiber-orientation data.
- Quiz now ends after twelve questions: four identification, four relationships and four function. Each correct first attempt scores once; retries never add points. Completed sessions cannot accept more answers. Review includes a three-part breakdown and per-muscle links back to the specimen. Results are in-memory only; reload resets them.
- Keyboard focus survives lesson/quiz navigation. Mobile panels retain independent scrolling, source disclosures and the visible specimen.
- No new package, anatomical structure, remote service or analytics event was added. The existing renderer now uses a camera-relative studio light rig. The default GLB was rebuilt with shading-only changes. Existing portfolio routes, other projects and legacy anatomy viewer remain in place.

The changed surface is the standalone shoulder app, domain model, local CSS/HTML and its tests. The existing portfolio iframe consumes the change directly. The smoke-test script accepts an explicit preview URL and output directory to keep this release's evidence separate.

## Scientific basis and limits

The curriculum uses the existing [NCBI rotator-cuff reference](https://www.ncbi.nlm.nih.gov/books/NBK441844/), checked on 2026-10-24. Actions are described as contributions; the four muscles are not treated as independent on/off actuators. No simulated humeral rotation, deformation, injury, pressure or force is shown. No tendon, footprint, nerve, capsule, cartilage or fiber data has been invented.

The source surfaces still have the previously audited 878 / 866 / 506 / 2,092 triangles for supraspinatus / infraspinatus / teres minor / subscapularis respectively. They have no source texture coordinates or texture maps. See SHOULDER-ASSET-GAP.md for the complete inventory and provenance.

## Evidence

- [Before](shoulder-conference-qa/before.png)
- [Presentation](shoulder-conference-qa/presentation.png)
- [Functional comparison](shoulder-conference-qa/function-study.png)
- [Session review](shoulder-conference-qa/session-review.png)
- [Mobile function study](shoulder-conference-qa/mobile-function.png)
- [New interaction and accessibility results](shoulder-conference-qa/results.json)
- [Existing browser regression](shoulder-conference-qa/regression/browser-results.json)
- [Production portfolio smoke](shoulder-conference-qa/portfolio-smoke.json)

Validation: 95 portfolio tests, 18 shoulder tests, typecheck, production build and changed-JavaScript lint passed. Chrome verifies presentation entry/exit, keyboard chapter control, grouped visibility, twelve-question completion, retry scoring, review links, reset and narrow layout. Axe reports zero violations in the tested desktop and mobile function-study states. The prior shoulder suite passes camera/picking/touch/Peel/lesson/quiz/OBJ/LOD checks. Fourteen production routes, embedded studio, legacy viewer and sitemap pass smoke checks.

These results are not a fresh physical-iPhone test, Safari certification, clinician review or educational-effectiveness study. Existing frame-time figures from September must not be presented as a new hardware measurement.

## Next visual gate: anatomy assets

The decisive upgrade is a registered, rights-cleared shoulder assembly with separate tendons, source texture maps and finer source surfaces. Do not subdivide the current meshes and call them more accurate.

The [official BodyParts3D archive](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html), rechecked 2026-10-24, still labels its downloadable 4.0 polygon packages as 99% reduced. The archive does not establish the availability of an unreduced textured shoulder. Investigate exact source versions before replacing geometry.

[Zygote's official licensing FAQ](https://www.zygote.com/help) distinguishes illustration licenses from real-time software licenses. The latter may permit distribution inside software with contract-specific conditions. A model purchase or a viewer subscription alone is not evidence of permission to ship downloadable GLB assets. Evaluate a written web-use grant, covered structures, registration, texture channels and anatomical review before ingestion. No vendor has been contacted and no purchase made.

Acceptance for the next asset increment: verified structure identities; explicit browser-redistribution rights; documented registration/units; landmark review; unchanged source masters; measured mobile payload/render cost; reviewer-approved coverage. Missing anatomy must stay visibly disclosed until supplied.

## Conference demonstration and evaluation

A short demonstration can progress from joint context to posterior cuff, anterior cuff, external/internal rotation groups, then a live identification question. Finish with source limitations and a practice-session review. The audience should see both the useful spatial interaction and the boundary of the model.

Before claiming improved learning, have an anatomy educator review the content and task wording. A proposed pilot should compare equivalent pre/post spatial questions, include unfamiliar viewpoints, record errors as well as completion time, and collect usability feedback. This is a proposal; no participants, results or efficacy claims exist yet.

## Run locally

From arjan-portfolio: `node tools/shoulder/serve.mjs` serves port 4190. Run `node tools/shoulder/conference-qa.mjs` for the new browser checks. `npm run test:shoulder` includes the finite-session and functional-group tests. Build normally with `npm run build`; the portfolio iframe remains `/holoanatomy/shoulder/index.html`.

## Blender visual increment

Blender 4.0.2 was used, not just proposed. `tools/blender/bake_shoulder_study.py` loads the original normalized master, compares source shading with derived shading, bakes four 512×512 self-occlusion maps as an experiment, exports both textured and normals-only GLBs, and verifies all original vertex coordinates and polygon connectivity by hash.

The underlying OBJ meshes contain repeated positions: supraspinatus 843 vertices / 445 unique positions; infraspinatus 743 / 435; teres minor 392 / 255; subscapularis 2,775 / 990. The accepted variant shares area-weighted shading normals across exact coincident positions. It does not weld vertices, remesh, subdivide, displace or invent tissue. A domain test compares the complete triangle-position multiset of all twenty deployed structures against the frozen original GLB, exactly at exported float precision. Source artifacts and low-poly silhouettes remain visible; this is a rendering improvement, not an accuracy upgrade.

The web renderer's key/fill/rim rig follows camera orientation around the specimen target. This makes anterior and posterior surfaces more consistently readable. Muscle roughness/specular parameters are illustrative material choices. Bone and all anatomical source identities stay intact.

The AO experiment is rejected for default use: it adds four textures (approximately 5.3 MiB of estimated RGBA+mipmap memory) and UV seam overhead for insufficient visible benefit. Those textures remain in Documentation, outside public assets. The accepted GLB adds no texture memory. All three tested variants ran at approximately 16.7 ms average rAF interval in the local desktop orbit comparison; these are not physical-phone or universal performance results. See [comparison measurements](shoulder-conference-qa/blender/web-comparison.json).

- [Blender source posterior](shoulder-conference-qa/blender/source-normals-posterior.png)
- [Blender derived posterior](shoulder-conference-qa/blender/derived-shading-posterior.png)
- [Accepted web posterior](shoulder-conference-qa/blender/web-smooth-posterior.png)
- [Accepted web anterior](shoulder-conference-qa/blender/web-smooth-anterior.png)
- [Geometry hashes and bake record](shoulder-conference-qa/blender/bake-report.json)

Regenerate candidates with Blender `--background --factory-startup --python tools/blender/bake_shoulder_study.py`. After visual review, append `-- --publish` to copy the normals-only export to the local public assets and update provenance. Here “publish” only means local asset promotion, never deployment. LOD1/2 and OBJ fallback retain the original normals. The provenance panel distinguishes derived runtime shading from source normals. `node tools/shoulder/blender-qa.mjs` compares the frozen source, AO experiment and accepted variant in Chrome.

## Assessment integrity increment

The original session repeated the same four targets in the same order. Each of the three rounds now shuffles all four muscles exactly once and prevents repetition across round boundaries. Identification retains helpful framing; relationship/function rounds all start laterally, so camera choice does not identify the answer. The user-facing instructions explain that rotation is required. Keyboard answer controls remain available.

The domain suite checks coverage, boundaries and shared later-round framing over 100 sessions. Browser tests read the generated deck instead of assuming a hardcoded answer sequence. These checks validate mechanics, not learning efficacy. See [educator review protocol](SHOULDER-EDUCATOR-REVIEW.md) for the outstanding independent review, formative pilot and a concise conference demonstration.
