# Source-backed shoulder anatomy integrated into HoloAnatomy

2026-10-25. Local branch `codex/holoanatomy-conference-20261024`. This change is integrated into the existing shoulder application and portfolio iframe; it has not been deployed or pushed.

## Use the actual app

Open `/playground/holoanatomy`, then choose a new entry under **Point of view**, or use **Inside the shoulder** in Explore:

- Joint surfaces & ligaments: glenoid labrum, humeral/scapular cartilage-classified surfaces, six shoulder ligaments.
- Capsule & bursae: joint capsule, subacromial bursa and subdeltoid bursa.
- Shoulder nerves & vessels: axillary, suprascapular, superior/inferior subscapular nerves; anterior/posterior circumflex humeral and suprascapular artery/vein segments.
- Tendon & insertion regions: source-classified infraspinatus tendon region and four source-authored cuff insertion regions.

The new assembly has **34 selectable parts**: 27 additional joint/attachment/neurovascular parts and seven matching context bones/muscles. Combined with the original twenty structures, the application loads 54 parts. Each additional part has a source detail card, focus, isolate, picking and provenance. Explore, Peel, Learn and Quiz remain the four primary modes.

## Source verification and geometry handling

The archive SHA-256 is `e029688545627bd0214b269e1063143abb580aad72b2c2445d6d8a9a0d9da736`. The importer refuses a Blender master that differs from the previously audited SHA-256. Source objects are explicitly allowlisted in `tools/blender/shoulder_atlas.json`; unrelated atlas components are not imported.

The current atlas and original BodyParts3D specimen have different bone surfaces and positions. No registration to the old specimen is claimed. New structures retain their original matching atlas bones and relative positions in dedicated views of the same viewer. Tests prevent mixing the two specimens, including through selection and mode changes.

`tools/blender/export_shoulder_atlas.py` evaluates existing source modifiers and curve bevels, extracts source-assigned material regions, applies one shared translation and uniform scale, and exports indexed GLB plus OBJ fallbacks. An inverse-transform check verifies all exported positions against their source positions within 1 micrometre. This is a numerical conversion tolerance, not an anatomical accuracy claim. Two zero-area scapular triangles are omitted; no nonzero surface is removed for aesthetic cleanup. The asset provenance records every operation.

Material names were checked against assigned faces: only infraspinatus supplies a nonempty Tendon region. Empty tendon material slots on other cuff muscles were not interpreted as geometry. Cartilage entries are classified surfaces, not measured volumetric layers. Insertion entries are authored source overlays, not validated patient-specific footprints. Nerves and vessels are source curve paths with the source's bevel, not newly drawn connecting branches.

No independent anatomical expert has validated these authored surfaces. The source names and topology/processing have been checked; these are different claims. No FMA identifiers were invented for the newly imported parts; the manifest explicitly leaves unmapped FMA values null and identifies exact source object names instead.

## Licensing

The source is [Z-Anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy). The additional geometry derivative is distributed under **CC BY-SA 4.0**, with the project's requested BodyParts3D (CC BY-SA 2.1 Japan) and Z-Anatomy attribution. The full downloaded attribution file and change disclosure ship at `/holoanatomy/shoulder/assets/atlas/LICENSE.txt`; the About panel links it and the new provenance manifest. The original BodyParts3D 4.0 asset license remains separate.

The atlas lists some noncommercial third-party components such as inner ear and kidney. None of those are in the explicit shoulder export. Its definitions and application scripts are not incorporated. Source auto-execution remains disabled throughout processing. No paid model or vendor subscription was acquired.

## Validation and performance

- 95 portfolio tests and 20 shoulder domain/asset tests pass; typecheck, production build and changed-file lint pass.
- New browser checks pass source separation, selection of all 27 added non-context parts, actual mesh picking, focus/isolate, desktop/mobile layout, attribution, forced OBJ fallback and intentional additional-asset failure. A failure leaves the original cuff usable rather than breaking the page.
- Existing browser regression passes camera controls, mesh picking, orbit suppression, pan/pinch, Peel, lesson, quiz, portrait/landscape, touch emulation, legacy OBJ and LOD2.
- Desktop and mobile axe checks report zero violations in the tested new states. This is not complete accessibility certification.
- The added GLB is **1,423,532 bytes**, containing **77,730 triangles**, without source textures. It is loaded once; changing views does not refetch geometry. The old default cuff composition and its source mesh remain unchanged.

The browser measurement below is a local desktop sample, not a physical-iPhone or GPU-time measurement:

{
  "transport": "glb",
  "lod": 0,
  "loadMs": 109.10000002384186,
  "atlasTransport": "glb",
  "atlasError": null,
  "drawCalls": 16,
  "triangles": 83240,
  "vertices": 27287,
  "textures": 1,
  "shadowMapTextureBytes": 4194304,
  "shadowDepthAttachmentEstimatedBytes": 4194304,
  "sourceTextureBytes": 0,
  "dpr": 1,
  "samples": 119,
  "meanFrameMs": 16.665831932773106,
  "p95FrameMs": 16.700000000000728
}

## Evidence

- [Actual app: joint](shoulder-integration-qa/atlas_joint.png)
- [Actual app: capsule/bursae](shoulder-integration-qa/atlas_capsule.png)
- [Actual app: nerves/vessels](shoulder-integration-qa/atlas_neurovascular.png)
- [Actual app: attachment regions](shoulder-integration-qa/atlas_attachments.png)
- [Mobile capsule/bursae](shoulder-integration-qa/mobile-atlas_capsule.png)
- [Mobile nerves/vessels](shoulder-integration-qa/mobile-atlas_neurovascular.png)
- [Browser check results](shoulder-integration-qa/results.json)
- [Portfolio smoke results](shoulder-integration-qa/portfolio-smoke.json)
- [Existing interaction regression](shoulder-integration-qa/regression/browser-results.json)

## Reproduce

With the audited Blender master available, run Blender with `--background --factory-startup --disable-autoexec --python tools/blender/export_shoulder_atlas.py -- /tmp/holo-z-anatomy.blend` from arjan-portfolio. This writes local assets only. Run `npm run test:shoulder`, `node tools/shoulder/atlas-qa.mjs` with preview port 4190, and the portfolio tests/build. The local production preview for this integration uses port 4195.

Still missing: four complete separately segmented cuff tendons, measured insertion footprints, source fiber data, complete neurovascular trees and independent clinical review. Physical-device iPhone testing remains outstanding.
