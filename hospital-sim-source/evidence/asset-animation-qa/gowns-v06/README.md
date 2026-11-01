# Original adult appearances and staged bed transfer

Executed with Blender 4.0.2. Original CC0-1.0 procedural assets with substantial OpenAI Codex assistance. All patients are fictional; appearance changes no simulation parameter.

The eleven appearances vary actual torso stature, breadth, facial planes and hair geometry, alongside skin, hair and gown colors. Measured heights span 1.637–1.837 m. The lower-body anchors and stride are shared. Gowns have overlapping rear panels, ties and a tiny plain skin edge; hidden internal pelvis/upper-thigh geometry is omitted to prevent wardrobe intersections.

Both transfer clips remain 3.00 seconds. Entry perches at the near edge, lifts feet outside the mattress, swings legs above it, turns, and reclines the chest after the pelvis. Exit reverses this order, with the chest sitting up first and feet taking weight before standing. The common standing anchor, Rest rebase and mattress offsets are unchanged. No appearance-specific offsets are required.

Final checks:

- All 11 appearances: 91-frame mattress sweeps, planted feet, continuous transfer/Rest endpoints, 39 bones, nine clips and one primitive per GLB.
- Worst soft mattress overlap: 8.425 mm; tolerance 15 mm. This is a soft-contact approximation, not mattress deformation.
- Highest covered surface: mattress +0.243506 m, below the occupied drape peak.
- Fourteen staff actions outside the two transfer clips are numerically unchanged.
- All 26 staff/appearance GLBs reimported and played in Blender, including actual eyelid, jaw and distal finger motion.
- Patient assets: 11,342–12,972 high-detail triangles; 3,856–4,410 LOD triangles. Embedded roughness images have no external dependencies.

Run the canonical generator with `Blender -b --python blender/characters.py`. For faster isolated exports, append `-- --patient patient-01` (or another stable appearance ID). Append `-- --source-only` to rebuild the combined compressed editable source and manifest without re-exporting GLBs. Run `gown_transfer_qa.py -- --render`, `variant_roundtrip.py`, then `gowns-v06/assemble.py` to reproduce the curated evidence. Raw render frames and diagnostic logs are deliberately omitted from this source package.

Remaining limits: original stylized figures, shared lower-body proportions/stride, skinned gowns without cloth simulation, and authored support gestures rather than a live body/bed contact solver. Faces and hair remain below the supplied reference's realism. There is no motion-capture or clinical validation.
