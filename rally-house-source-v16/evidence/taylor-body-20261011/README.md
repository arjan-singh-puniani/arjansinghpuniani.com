# Taylor athletic body correction — October 11

The old dress hem extended to 2.10 club units across, exceeding the head width and concealing the leg silhouette. Taylor now has a fitted gold tennis dress with a shaped ribcage, waist and pelvis, short lightly pleated skirt, indigo collar/waist accents and gold edging. Shoulders, upper arms, forearms, thighs and calves use smoother anatomical contours. The body uses soft fabric/skin lighting so its volume reads; the face and headdress retain their authored palette.

Joint bending now stays near the moving elbow/wrist instead of spreading across the entire limb. The glove's partial forearm section uses the same global weight field as the underlying arm. The skirt stays attached to the pelvis, while the bodice and its trims follow their shared spine weights. AnatomyMotion replay, actual hands, planted feet and racket contact still consume the authoritative pose.

The supplied available images informed contour and athletic styling. Private reference photos are not included in this repository. This is a stylized feline body, not a claim to recreate a photographed person's anatomy or a clinical model.

## Actual before/after

`before-front.webp` and `before-three-quarter.webp` show the original shape. `after-front.webp` / `after-three-quarter.webp` show the first fitted shape with flat shading; `after-soft-front.webp` / `after-soft-three-quarter.webp` show the final softer body materials. These are **isolated actual Character.meshes / production Renderer captures on an authored inspection stage**, not claimed gameplay screenshots. Framing and character stance are consistent. Source PNG hashes are in `capture-manifest.json`; raw PNGs remain locally preserved.

The `chromium`, `firefox` and `webkit` folders contain genuine final gameplay captures and reports. Each passes native Taylor selection, desktop/portrait club views, real Championship serve contact, match exit and saved-avatar reload, with no page/console/HTTP errors. Serve contact is .050 club units from the recorded racket centre. Final body surfaces stay opaque and the folded club stance shares the authoritative rig.

`phone-final` contains the actual final portrait MediaRecorder video, mounting/recording/review captures and report: 162 real movement samples, 10.37 ms observed video/replay discrepancy, identical paused seek times, zero Axe violations, zero runtime/HTTP errors, no overflow and zero live recording tracks after completion. `phone` retains the intermediate desktop capture with the new shape but earlier flat materials (162 samples, 8.65 ms observed discrepancy).

## Validation

- **26 game suites pass**, including existing contact, pose, topology, capture and replay checks. The new body suite recovers actual emitted GPU joint rings independently of their generator and checks **7,560 moving surface/joint pairs** across seven states and three update rates. Maximum joint-surface error is **4.23e-7 club units**. Shape bounds, normalized geometry and finite skin weights pass.
- Full portfolio verification passes **91 tests**, TypeScript, a **32-route production build**, and lint with **zero errors / 12 retained warnings**. Native production iframe entry passes. Source and served trees match across **69 runtime artifacts**.
- The refreshed **71-file** standalone ZIP passes CRC and exact source-byte comparison. Five independent fresh starts pass.

Run `npm test`, `npm run release:check`, `QA_OUT=evidence/taylor-body-20261011 QA_REFERENCE=0 QA_LABEL=after-soft node qa/taylor-proportions.mjs`, and `QA_OUT=evidence/taylor-body-20261011/chromium node qa/taylor-reference.mjs` with source port 8078. Set `QA_ENGINE=firefox` or `webkit` for the other engines. Final phone reproduction: `QA_OUT=evidence/taylor-body-20261011/phone-final QA_AVATAR=Taylor QA_WIDTH=390 node qa/phone-capture.mjs`. Portfolio entry uses port 3096; extracted standalone uses port 8079 and the packaged launcher's 128-connection queue.

Generated nondeterministic simulation reports are retained under `generated-simulation`; historical fixtures keep their original bytes. Original Desktop trees and native projects remain untouched. These checks do not establish physical-phone performance or independent human taste.
