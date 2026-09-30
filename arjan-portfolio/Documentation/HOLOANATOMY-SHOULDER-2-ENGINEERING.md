# Shoulder 2.0 engineering handoff

## Entry points

- Portfolio route: `/playground/holoanatomy`
- Standalone studio: `/holoanatomy/shoulder/index.html`
- Original multi-exhibit viewer: `/holoanatomy/index.html`
- Reconstructed source: `public/holoanatomy/shoulder/`
- Source masters: unchanged OBJ files in `public/holoanatomy/anatomy/`

Only the HoloAnatomy route and its local styles connect the studio to the portfolio. Global navigation, the other Playground applications, work pages, contact handling, analytics and sitemap are unchanged by this reconstruction. Pre-existing local edits remain separate and uncommitted; their original status and diff are in `shoulder-baseline`.

The worktree copied the original checkout's pending work to make baseline tests representative, including its untracked homepage CSS and older shoulderStudio module. Those unrelated edits are not part of the reconstruction commits. Do not use `git add .`, `git reset --hard` or deploy the dirty worktree indiscriminately.

## Runtime boundaries

`model.js` contains pure curriculum, visibility, material classes, presets, staging/quiz reducers and label layout. `scene.js` owns the isolated Three renderer, glTF/OBJ paths, texture/material preservation, clipping, spatially accelerated picking and measured rendering. `interaction.js` arbitrates click/drag/multi-touch and camera commands. `app.js` binds semantic controls, mode panels, the original orientation cube and atlas labels.

The shoulder code uses local vendored Three 0.180.0 and three-mesh-bvh 0.9.1 with their MIT notices. Nothing is fetched from a runtime CDN. Build/development dependencies are pinned in `tools/runtime/package-lock.json`; portfolio runtime dependencies did not change. The test runner uses two threads because baseline fork workers timed out in this environment.

UI colors, lighting and selection emphasis are illustrative. There is no invented fiber texture, anisotropy data, tendon, capsule, labrum or insertion overlay. Clinical content is text with source links; it is not extracted from the mesh.

## Asset regeneration

```
npm ci --prefix tools/runtime
node tools/shoulder/audit.mjs
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python tools/blender/prepare_shoulder.py
node tools/shoulder/verify-source.mjs
node tools/runtime/compare-compression.mjs
npm run test:shoulder
```

The verification script uses the saved official source mapping tables. Refresh those files from their documented DBCLS URLs when deliberately upgrading the source release. The checked-in source SHA-256 hashes establish which masters produced the current assets.

`shoulder-lod0.glb` is the unquantized GLB master and default runtime asset. LOD1/2 decimate scapular context only; all cuff triangles remain unchanged. They are opt-in (`?lod=1`, `?lod=2`), not automatic quality downgrades. `?format=obj` exercises the compatibility path. Failed GLB loading also falls back to the original local OBJ masters.

The source mesh importer preserves UVs and custom normals and requests tangent export when UV data exists. Duplicate cleanup, remeshing and geometry-smoothing modifiers are intentionally disabled to avoid altering unreviewed anatomical landmarks. Non-manifold edges and zero normals are reported. GLB source materials may contain multiple primitives and textures; runtime tests cover this using a synthetic calibration fixture stored only under Documentation.

## Validation

```
npm test
npm run test:shoulder
npm run typecheck
npm run build
npm run start -- --hostname 127.0.0.1 --port 4192
```

For standalone regression scripts, start `node tools/shoulder/serve.mjs` in another terminal (port 4190), then:

```
node tools/shoulder/browser-qa.mjs
node tools/shoulder/orientation-qa.mjs
node tools/runtime/make-texture-fixture.mjs
node tools/shoulder/capability-qa.mjs
node tools/shoulder/portfolio-smoke.mjs
node tools/shoulder/webkit-qa.mjs
node tools/shoulder/write-qa-report.mjs
```

The scripts require installed Playwright browser binaries and may require execution outside a restricted macOS process sandbox. No contact form is submitted, and no production deployment is made. `browser-qa.mjs` accepts `SHOULDER_URL`; portfolio smoke and WebKit currently use the local production preview on 4192. Screenshots and measurements are saved to `Documentation/shoulder-qa/`.

## Camera and interaction rationale

The source transform is `(x,y,z) -> ((x+130)*.01,(z-1275)*.01,-(y+45)*.01)`. The target is near cuff mass, not the twenty-structure union center. Presets were compared to Blender silhouettes: posterior exposes the scapular spine and posterior muscles; anterior exposes the costal surface; superior follows the supraspinatus passage; lateral shows the proximal humeral relationship without drawing a footprint. Context views disclose incomplete vascular coverage.

Default orbit precision is direct, with no inertia. Preset changes ease over 500 ms unless reduced motion is requested. Pitch is limited to ±1.48 radians; distance to 1.4–7.5 normalized units. One-finger movement and left drag orbit; clicks select only below a six-pixel threshold and never after multi-touch. A 35-pixel Peel drag commits a whole-mesh move to a bounded table slot; a shorter drag returns it. The table follows the camera and can be reassembled or undone.

Two-finger pixel scrolling pans. Ctrl/pinch zooms. A line-mode mouse wheel zooms; Shift+wheel is the explicit zoom option for pixel-mode smooth mouse wheels, which browsers cannot reliably distinguish from trackpads. Pan is also available through Shift/right drag. The gesture convention is shown in the information panel.

## Review and rollback

Audit, asset gap, reference renders and visual QA are separate evidence files. Remaining acceptance work is listed in `SHOULDER-VISUAL-QA.md`; do not represent emulation as physical-device performance or engineering checks as clinical approval.

To roll back only the new experience, revert the reconstruction integration commit on its dedicated branch or restore the HoloAnatomy route's iframe to `/holoanatomy/index.html`. Existing legacy anatomy assets and other portfolio applications are retained. No external deployment, remote branch push or production overwrite has been performed.
