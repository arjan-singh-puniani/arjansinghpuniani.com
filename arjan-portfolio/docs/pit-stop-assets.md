# Pit Stop Lab car and garage pipeline

Original visual recreation of the **SF-26 launch specification**, based on the official reference board in `pit-stop-visual-audit.md`. This is not Ferrari CAD, a licensed official Ferrari product, or an aerodynamic/structural model. No Ferrari shield, sponsor logos or photographic textures are included. The identity and runtime path are isolated in `public/pit-stop-lab/hero-car.js` (`CAR_IDENTITY`); review naming/likeness rights before external publication. No third-party car mesh was used.

## Reproduce

From `arjan-portfolio`:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python tools/pit-stop/assets/build_car.py
python3 tools/pit-stop/assets/validate.py
```

Verified Blender version: 4.0.2. The script clears only its factory-startup scene, creates metric geometry, UVs, PBR materials and original normal textures, and writes:

- `assets/pit-stop/sf26-reference.blend`: editable surfaces, subdivision modifiers, separate bodywork, four service wheel roots and fixed brakes. Packed normal images. No downloaded model or photo is embedded.
- `public/pit-stop-lab/assets/sf26-primary.glb`: evaluated subdivision level 2, for offline/high-detail inspection.
- `public/pit-stop-lab/assets/sf26-runtime.glb`: level 1 body surfaces, level 2 cockpit, full wheel profiles; browser default. Both assets retain independent wheel and brake hierarchies. The primary is deliberately not an extra automatic download: the modest subdivision difference does not justify transferring both in an ordinary session.
- `carbon-normal.png`: actual Cycles tangent-space bake of an original procedural weave.
- `rubber-normal.png`: deterministic original micro-normal texture; both are Non-Color and embedded in the GLBs.
- `provenance.json`: authoring, reference URL, estimated centers and SHA-256/bytes for exported files.

Authoring converts runtime X/right, Y/up, Z/aft to Blender coordinates at one boundary; glTF export restores Y/up. Estimated wheelbase 3.3 m; front centers ±0.8 m, rear ±0.7625 m; tire radius 0.355 m. These are **visual estimates**, not a verified chassis drawing. Mesh names retain wing, halo, cockpit, intake, suspension, floor, wheel and brake roles. Runtime wheels replace the existing station wheels and move from the same corner snapshot as the simulation. The `.blend` contains mechanical hierarchy; motion is driven by browser events, not a claimed motion-capture or baked crew rig.

The dependency-free validator checks GLB headers/lengths, buffer bounds, finite position bounds, UVs/normals, embedded textures, clearcoat, normal maps, triangle/size budgets, required roots, source existence and manifest hashes. The browser suites verify actual loading and rendering. Draco is deliberately absent: adding a decoder for a ~6.1 MB asset needs a measured net startup benefit. Texture tiling uses exported `KHR_texture_transform`; paint uses `KHR_materials_clearcoat`.

## Provenance and release status

| Item | Source / status |
| --- | --- |
| Car geometry, UVs, normal maps, materials | Original work generated for this local project by the checked-in Blender script; no acquired mesh license applies |
| Garage architecture, floor scuffs, contact approximation, room reflections | Original code/canvas geometry and textures in `garage.js`; no remote HDR or image dependency |
| Launch photographs | Official Formula 1 gallery URLs in the audit, inspected as visual reference only; copyrighted photographs are **not** bundled |
| Ferrari/sponsor graphics | Not acquired or included; no rights are asserted |
| Three.js, OrbitControls, GLTFLoader, BufferGeometryUtils | Existing repository copies, MIT; retained notice in `public/pit-stop-lab/vendor/LICENSE`. Loader imports adjusted to local modules |
| Historic race bundle | Existing OpenF1 provenance and statistical limits remain in `public/pit-stop-lab/MODEL.md`; historical observations do not become live Ferrari telemetry |
| Audio | Existing original Web Audio synthesis; no sound recordings downloaded |

External publication is not authorized in this task. Original mesh authorship does not establish Ferrari trademark/likeness rights. There is no silent substitution claim: the model is explicitly an estimated launch-reference study. Photorealistic commercial racing-game fidelity and exact SF-26 surface matching remain unverified; the evidence report identifies the remaining artistic limits.

## 27 October art review and validation

The final primary GLB is 6,861,044 bytes / 169,858 triangles; runtime is 6,125,076 bytes / 148,162 triangles, each with 65 meshes and two embedded normal images. Generated service/tire lettering uses Blender's bundled Bfont outlines converted to mesh, with no external font download. Bitstream Vera / Arev notices (and the DejaVu public-domain statement) are retained verbatim in `public/pit-stop-lab/assets/BFONT-LICENSE.txt`, copied from the installed Blender distribution. The glyphs are not claimed as original font design. All mesh rotations/scales are applied before functional batching. Panel fasteners and seams are original geometry. The nose tip uses additional rounded sections to reduce cap pinching. Asset budgets and inlet-clearance regression still pass.

The garage now includes an epoxy work zone, drawer handles, pegboard tools, sockets, air reels, overhead fixtures and an exterior pit-lane corridor. Two physical monitors share one texture populated by actual simulation corner states; they are labeled simulated service. They are not live team feeds or a substitute for the source/model audit in Race Engineer. Architecture does not cast giant ceiling-beam shadows through the open roof. Existing mechanical wheel guns are reused in the challenge, with their original rotating sockets and status indicators. The crew still uses authored procedural poses; it is not a photorealistic character asset or constrained human rig.

Additional reproduction commands:

```sh
python3 tools/pit-stop/assets/validate_geometry.py
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python tools/pit-stop/assets/render_preview.py
npm run build
npm run start -- --hostname 127.0.0.1 --port 4174
```

In another shell:

```sh
PIT_CHROME_METAL=1 PIT_STOP_URL=http://127.0.0.1:4174 PIT_RECORD_VIDEO=1 node tools/pit-stop/garage-qa.mjs
PIT_CHROME_METAL=1 PIT_STOP_URL=http://127.0.0.1:4174 node tools/pit-stop/browser-qa.mjs
PIT_CHROME_METAL=1 PIT_STOP_URL=http://127.0.0.1:4174 node tools/pit-stop/intelligence-qa.mjs
PIT_CHROME_METAL=1 PIT_STOP_URL=http://127.0.0.1:4174 node tools/pit-stop/experience-qa.mjs
```

`PIT_CHROME_METAL=1` uses the installed Google Chrome with the Metal backend on macOS, not a claim that ordinary headless software rendering represents hardware. Omit it for the default Playwright Chromium renderer. The source preview uses Cycles area lights and is explicitly a source render, not browser-performance evidence. Final browser screenshots/video, test results, measured hardware and remaining visual limits are linked in `Documentation/Validation/PitStop/2026-10-27-garage.md`. No external deployment was performed.
