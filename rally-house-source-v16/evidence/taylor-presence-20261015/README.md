# Taylor facial materials and relaxed stance

Baseline: `354e9c5f43acb169389acbb1b7b51ce9e16ac022`. This pass adds distinct human skin, hair, lip and iris materials, with filtered surface detail, restrained highlights and warm cheek pigment. Larger irises, tapered brows, lower lids, nose contours and a smile-following mouth seam improve the face. The swept hair now meets the scalp. The human neckline uses a finer circumference, and a small weight-bearing idle stance enters the authoritative pose before limb solving.

The result remains an original stylized tennis character. The skin wrap is an artistic approximation; these changes do not establish player-retention results.

## Real renders

The face and body comparisons use the production character meshes and WebGL renderer on a diagnostic stage, with the complete old compiled runtime routed for baseline captures. Both are pinned to full detail and the same viewport. These are inspection renders, not screenshots of an actual tennis rally.

| View | Before | After |
| --- | --- | --- |
| Face | [Before](face/before-three-quarter.webp) | [After](face/after-three-quarter.webp) |
| Full body | [Before](body/before-three-quarter.webp) | [After](body/after-three-quarter.webp) |

Actual Championship screenshots are retained for [Chromium](chromium/championship.webp), [Firefox](firefox/championship.webp) and [WebKit](webkit/championship.webp). The [manifest](image-manifest.json) identifies genuine captures and their lossless, unchanged-pixel WebP encodings. Raw PNGs remain local.

## Validation

- All **31 game suites** pass: [complete output](game-tests.log). The head remains below its existing 20,000-triangle budget at **19,852 triangles**. Independent face intersections check **21,384** eye/lid/lip samples through blinking and speech. Clothing-boundary checks now cover **34,560** pairs; the four human clothing batches total **6,752 triangles**.
- The adult suite retains **43,128** limb-length checks with exact world contact, **7,560** joint-surface checks and **3,800** intermediate replay samples. The **4,200-frame** arm audit still has zero failed rest checks and maximum sampled flexion **153.89 degrees**.
- Native Chromium, Firefox and WebKit pass Taylor selection, desktop and portrait club views, live Championship contact, exit and reload, with zero runtime/HTTP errors and no overflow. The configured observed ball/string spacing remains approximately **0.05 club units**; the separate exact solver error remains below **2e-16**.
- The [GPU diagnostic](lighting-report.json) renders all 12 pre-existing materials against the complete baseline in daylight and evening light. Maximum byte difference is **1** in daylight and **0** in evening light. Actual Taylor renders in [daylight](lighting-day.webp), [overcast](lighting-cloud.webp) and [evening light](lighting-evening.webp) retain readable, nonclipped cheek pixels and zero GL errors. The shader's existing rigid and skinned paths compile in all three native browsers.
- All **74** source/served release artifacts match. The **76-file** standalone passes CRC and exact source-byte comparison; its [package report](package.json) records the archive hash. [Native Metal startup/save/reload](standalone-native/report.json) passes, using the same renderer configuration as the native browser matrix.

One repeated GPU diagnostic failed because adaptive framebuffers had different sizes; [the incomplete report](lighting-repeat-incomplete.json) and [failure record](lighting-repeat-failure.json) are retained. The diagnostic now explicitly pins full detail and resizes both framebuffers, and the complete repeat passes. An initial standalone run timed out while clicking the visible avatar chooser during concurrent browser QA; [that attempt](standalone-first-attempt.json) is retained, without claiming a proven product cause.

The default-headless standalone repeat also timed out in isolation. A control using the complete **previous** compiled runtime [failed startup](standalone-baseline/report.json) in that same configuration, so this does not establish a new portrait-rendering regression. The explicit native Metal run above completes selection, members, save and reload. Default-headless startup remains an unresolved environment/renderer-path limitation; no universal compatibility or FPS claim is made.

## Reproduction

Run `npm test` and `npm run release:check` from `rally-house-source-v16`. Start `node qa/serve.mjs` on port 8078. Run `QA_ENGINE=chromium QA_OUT=/tmp/taylor-browser node qa/taylor-human.mjs`, repeating for Firefox and WebKit. Run `QA_BASELINE_RUNTIME=/path/to/complete/previous/dist QA_OUT=/tmp/taylor-lighting node qa/taylor-presence.mjs` for the GPU comparison. Use a complete compiled snapshot of the baseline commit above. `QA_REFERENCE=0 QA_DETAIL=1 QA_OUT=/tmp/taylor-face node qa/taylor-proportions.mjs` captures the face diagnostic.
