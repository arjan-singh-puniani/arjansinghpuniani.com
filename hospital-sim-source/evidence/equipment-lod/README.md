# Equipment LOD asset verification

Original Common Good equipment LOD adaptations, CC0-1.0; substantial OpenAI Codex assistance. Blender 4.0.2 was executed to produce and independently reimport these assets. Original assets and unrelated project files were preserved byte-for-byte.

| Asset | Original triangles | LOD triangles | Reduction | LOD raw bytes |
|---|---:|---:|---:|---:|
| scan | 34,292 | 20,360 | 40.6% | 572,428 |
| care | 27,620 | 16,408 | 40.6% | 492,392 |
| consult | 38,996 | 23,162 | 40.6% | 1,171,116 |

All three meet the requested 22k/18k/24k triangle limits. The editable compressed equipment_lod.blend is 4,422,534 bytes and retains original and LOD collections. Original scene/nodes/transforms, material definitions, textures and samplers are copied unchanged into the final packages. The two original embedded PNG payloads per asset are byte-identical. Draw-call/material counts are unchanged (8/8/10); no browser frame-rate improvement was measured here.

Small disconnected structures and thin supports are protected, as are diagnostic-screen geometry and textures. Four scanner-bore clearance rays remain unobstructed. Independent GLB reimport checks verify finite geometry, budgets, transforms, materials, textures and bounds. See checks.json and roundtrip-checks.json for actual counts, hashes and measurements; frozen-assets.json records final deliverable hashes.

## Matched visual comparison

The comparison renders actual original and final LOD GLBs under identical lighting and the gameplay camera direction (Three [16,16.35,23], converted to Blender [16,-23,16.35]). Orthographic scale is 4.6m, each view 480×400 pixels, Cycles 8 samples with denoising and AgX. Rendering-only ground and lights are not exported. The scanner bore, patient tables, monitors, supports, cart, task lamp and cabinet silhouettes remain readable at this scale. This is a comparison against the existing equipment, not a claim of reference-image equivalence.

Remaining loss: the scanner blue housing shows slightly coarser bevel highlights; small curved details, foliage and bevel transitions have less density at enlarged zoom. Maximum two-way sampled surface deviations are approximately 13.9mm (scan), 4.4mm (care) and 5.6mm (consult). These are sampled vertex-to-surface distances, not exact Hausdorff bounds. Maximum bounding-box drift is 5.7mm/1.1mm/2.1mm respectively. Retain original meshes for close inspection. Runtime LOD selection and mobile hardware benchmarking belong to integration verification.

## Reproduce

Run from the repository root, using a Blender executable compatible with 4.0.2:

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b --python blender/equipment_lod.py
/Applications/Blender.app/Contents/MacOS/Blender -b --python evidence/equipment-lod/verify.py
python3 evidence/equipment-lod/assemble.py
```

The final assembly needs Pillow. Render frames are temporary intermediates; retain the curated comparison PNG. The scripts do not modify original equipment GLBs, other assets, application code, or manifests.
