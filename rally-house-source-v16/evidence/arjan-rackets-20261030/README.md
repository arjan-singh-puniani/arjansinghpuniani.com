# ARJAN racket reference pass — 2026-10-30

The old equipment was an elliptical ring, a short Y and a 7×7 string grid. The first replacement received the running-game verdict “very close but it's not quite a spitting image.” The full product photographs revealed misplaced upper yellow panels and a throat/handle proportion that still followed the old short racket.

The replacement follows the Pure Aero Gen9 graphite/fluo-yellow layout, deeper aero beam, longer curved open throat, bumper, individual grommets, 16×19 bed, octagonal wrapped grip and flared butt cap. Rounded italic ARJAN outlines replace source branding on both faces, the throat, strings and grip. The string stencil is clipped to the physical strings; it does not fill their openings. All equipment displays, Build racks, the stringing bench and competitors share these surfaces.

The longer frame has one grip-to-head length through ready, strokes, recoil and observed replay. Supporting palms use a real throat attachment. Stroke weight transfer gives the wrist room beside the torso while retaining exact ball contact and anchored feet. Existing walking and hands-on-hips body/hand motion remain identical.

## Reference

[Official Pure Aero Gen9 specifications and front/three-quarter/throat photographs](https://www.babolat.com/gb/pure-aero-gen9-unstrung/101569.html?dwvar_101569_COLOR_DESCRIPTION_ERP=100). The published reference has a 27-inch length, 100-square-inch head, 16×19 pattern and 23/26/23 mm beam section. This is an authored, photo-matched game asset; no manufacturer CAD or scanned production mesh is used. The original logo and product wordmarks are not included in the game asset.

`before-after-mesh.png` is an **offline Blender comparison, not a running-game screenshot**. The left uses the previous hoop and a reconstruction of its shaft/string primitives; the right uses the final production geometry. Lighting differs from the game.

`RacketWordmark.ts` contains baked outline triangles. `author-wordmark.py` reproduces them in Blender using the installed Arial Rounded Bold font with oblique shear; the game loads no font file or dependency.

## Validation and limits

- `full-regression.log`: complete `npm test`, terminal exit 0, on the full-length frame and stance revision, including unchanged anatomy/jersey limits. Maximum residual sleeve fold: 0.0112886158 against the existing state-dependent bounds.
- `analysis-checks.log`: following the final replay attachment correction, equipment, replay smoothness, rig registration, phone capture, Performance Lab, groundstroke and serve checks passed. These cover 3,800 fractional replay samples and both avatars' registered body surfaces.
- `final-equipment.log`: final bumper/collar/butt-cap geometry, live/fractional replay grip ownership, 16×19 strings, physical reference proportions, both rigid render passes, Build preview tint/alpha and complete shop selection all passed. All 117 release artifacts match.
- `approved-presentation.log`: reconstructs commit `5cab0ad46ccf5be80fa94f047b6957122df65f10`, verifies its previously approved full-pose hash and compares all 300 idle/walking body/hand samples. Only stowed equipment fields are excluded from the equality check.

No new GPU timing or browser screenshot was collected. The final full-length revision still awaits the user's visual/play verdict. The overall Valve/Rockstar colleague-send gate remains open; the racket asset is a narrower improvement, not a claim about the whole game's quality.
