import {readFile,writeFile} from 'node:fs/promises';
const a=JSON.parse(await readFile('Documentation/shoulder-baseline/mesh-inventory.json'));
const rows=a.map(p=>`| ${p.id} | ${p.name} | ${p.vertexCount} | ${p.faceCount} | ${p.hasUV?'yes':'no'} / yes / no | ${p.layer} | ${JSON.stringify(p.bounds.min)} → ${JSON.stringify(p.bounds.max)} |`).join('\n');
await writeFile('Documentation/HOLOANATOMY-SHOULDER-2-AUDIT.md',`# HoloAnatomy Shoulder 2.0 — frozen audit

Recorded 2026-09-30 before redesign. Base commit: a9f0b9167527ffc221e17285d65c3787509f2b2e. Dedicated branch: holoanatomy-shoulder-2-20260930. Isolated worktree includes the current working changes; the original checkout remains untouched. Full status and binary diff are preserved in shoulder-baseline. Existing local changes include portfolio copy and a shoulderStudio module; deployed production still exposes the earlier Quiz/Exhibits toolbar.

## Current production inspection

Inspected https://arjansinghpuniani.com/holoanatomy/index.html in Chromium at 1440×900 and 390×844. Screenshots and serialized renderer state are in shoulder-baseline. Twenty meshes load, 53,648 triangles, no browser exceptions. Source OBJ payload: 3,749,763 bytes. Texture memory: zero (no textures). Debug reports ~650 fps; this is NOT a credible presented-frame measurement and must not be reused as a performance claim.

The default screenshot is dominated by white bone and faint ghosted muscle. The cuff is not the subject. BodyParts3D coordinates have longitudinal extent in Z (humerus Z=1029–1337), but the renderer uses Y-up without an anatomical coordinate transform. Thus existing yaw/pitch views are not dependable anatomical presets. Baseline filenames posterior/anterior/superior record the original renderer's canonical axis settings, not validated anatomical directions. A corrected anatomical axis convention is a required reconstruction task.

Normalization uses all twenty meshes including the full humerus and regional vessels. Default target is the union bounding-box center. Every muscle starts ghosted. Dissect and Table start enabled. No cuff-specific default composition exists in production.

## Baseline checks

Baseline test command initially encountered dependency-cache sandbox permissions; unrestricted retry encountered Vitest fork startup timeouts (7 unhandled worker errors). Typecheck was invoked; final result is recorded in typecheck.log. Initial copied-worktree build failed because an existing untracked homepage CSS file had not yet been copied; after copying it unchanged the baseline build is being re-run. These are recorded as failures/pending, not successful baseline tests. Logs will be finalized before release.

## Interaction audit

Based on production screenshots, loaded source, and camera state. Physical trackpad/iPhone testing is not available in this session; synthetic browser gestures will be distinguished from hardware validation.

| Interaction | Existing implementation / consequence |
|---|---|
| Left drag | In default Dissect mode, pointer-down on a mesh immediately selects and begins pulling; only empty-space drag orbits. Camera and selection compete. |
| Trackpad | Every wheel event becomes zoom; horizontal delta ignored. No intentional two-finger orbit/pan convention. |
| Pinch | Touch distance ratio drives zoom; desktop ctrl-wheel is not distinguished. |
| Pan | No pan handler. |
| Picking | GPU ID pass; pointer-down picks for dissection. Movement threshold resets per pointer-down, introducing multi-touch ambiguity. |
| Isolate | Production ghosts context. Local overrides short-circuit isolation, so the modified local studio can ignore isolate. |
| Reset | Generic camera target/distance, not shoulder composition; reassembles pieces. |
| Focus | Double click targets mesh bounds with hard clamp; F shortcut absent. |
| Mobile | Two touches pinch; no two-finger midpoint pan. Dense scrolling toolbar, small targets, default pull behavior. |

## Asset inventory

All twenty structures are BodyParts3D / ISA Release 4.0, CC BY 4.0. Attribution: BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. Source license verified against https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html on audit date. No textures, UVs, tangents, or source material slots are present. All have OBJ normal records. Each current module is shoulder. Broad classifications match the names; no muscle is classified as a separately sourced tendon. This is an engineering consistency check, not independent clinical validation. Full per-structure fields including source, license, material records, bytes and bounds are in mesh-inventory.json.

| ID | Anatomy | Vertices | Faces | UV / normals / tangents | Layer | Raw bounds (source units) |
|---|---|---:|---:|---|---|---|
${rows}

## Asset ceiling and engineering decisions

| Limitation | Category | Evidence | Decision |
|---|---|---|---|
| Cuff surface detail | A geometry | SITS: 878 / 866 / 506 / 2092 triangles | Preserve landmarks; no subdivision pretending to recover anatomy. Document asset gap. |
| Tendons, insertion footprints, capsule, labrum, cartilage, bursae, shoulder nerves | F missing anatomy | No separately labelled geometry in shoulder manifest | Text curriculum only; no invented overlays or footprints. |
| Full humerus and empty canvas | D composition | Union bounds plus wrong up axis | Cuff-based target, correct rigid axis transform, explicit camera crop. |
| Shiny pale bone / uniform soft tissue | B material, C lighting | One simple Blinn-like shader and rim term | Data-driven rough tissue materials, linear workflow, restrained studio lighting. |
| Detached vessel appearance | A geometry, H UI | Incomplete regional tree shown without qualification | Secondary regional view; disclose incomplete coverage, never add connecting tubes. |
| Pulling competes with orbit | E interaction | Default dissect=true | Explore default; click/drag threshold; deliberate Peel staging. |
| No GLB/texture path | G renderer | Position/normal/index-only pipeline | Isolated shoulder renderer with glTF support, OBJ fallback, PBR maps. |
| Toolbar complexity | H UI | Eight primary actions + exhibit picker | Four modes; secondary information/tools. |
| Misleading performance | G renderer | ~650 fps debug value | Measure rAF intervals, GPU draw calls, payload and device tier independently. |

## Baseline evidence

![Deployed default](shoulder-baseline/default.png)
![Deployed mobile](shoulder-baseline/mobile.png)

Audit gate satisfied for reconstruction: actual production inspected and captured; source inventory measured; failures and hardware limitations explicitly recorded. No claim of clinical validation or successful release.
`);
