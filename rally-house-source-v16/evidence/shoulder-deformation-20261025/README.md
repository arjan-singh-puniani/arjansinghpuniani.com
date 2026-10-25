# Shoulder deformation: rejected shortcuts and editable fixture

Human feedback after removing the ponytail experiment: the shoulder/clothing defect stands out **equally in backhand preparation and serve follow-through**. The running game remains at `994298b3`; no experiment from this pass was shipped.

`shoulder-deformation.blend` contains the existing licensed game mesh, its original 19-bone rig and packed textures. Its three discrete frames are source bind, actual backhand preparation at .20 seconds, and actual serve recovery at .70 seconds. They are reference poses, not an animation. Blender-evaluated garment vertices match exported CPU-skinned runtime geometry to within 0.00000114 game units. The fixture omits runtime lighting, GPU skirt collision projection and rigid racket parts.

## Subsequent human approval

The user supplied the October 25, 4:05 PM Performance Lab screenshot (replay 9.02 / 11.90 seconds, AnatomyMotion, right elbow 21°), then clarified: **“no i like it keep it up.”** This frame is an approved visual reference, not a new defect report. Preserve its pose/look and the accepted walking, hands-on-hips and stroke footwork. The rejected deformation experiments remain rejected. Do not treat this screenshot as a request to replace the character asset or as proof that the entire quality gate has passed. Screenshot metadata is in `human-frame-approval.json`; private browser chrome is not committed.

## What failed

| Candidate | Observed failure | Decision |
| --- | --- | --- |
| Transfer medial garment arm weights to chest | Serve penetration decreased (.0611 → .0396), but ready penetration appeared (0 → .0195); minimal visual improvement | Reject |
| Volume-preserving dual-quaternion blend | Serve penetration remained .0503; matched image did not show a convincing improvement | Reject renderer expansion |
| Move shoulder around a fixed clavicle arc | Backhand .20 depth increased .0218 → .0758; serve .70 increased .0611 → .1135 | Reject |
| Separate proximal shoulder support from humeral rotation | Sampled backhand crossings cleared, but a visibly raised shoulder cap appeared and ready penetration increased 0 → .0095 | Reject |

Depths are approximate geometric ray measurements, not perceptual quality scores. Full values are in `checks.json`. Shoulder-support classification includes its extra joints; it does not silently count affected sleeve panels as torso.

## Additional surface tests

Blender Corrective Smooth (shoulder/underarm region only, factor .5, five iterations, pinned garment boundaries) softened the visible fold but increased sampled backhand .20 penetration from .0218 to .0263 and serve .70 from .0611 to .0710. Rejected.

An offline contact projection used the measured posed torso triangles, with .003 clearance, and retained the original skeleton. It reduced sampled depth to .0111/.0321, but created additional triangle crossings and a visible contact ridge. Backhand crossings increased 272 → 489 and serve crossings 281 → 546 using the same classifier. Rejected; no proxy collider, renderer expansion or runtime contact system was added.

A capability search found no Blender or Meshy integration. The available image/video generator is not a replacement for an editable, weighted garment mesh. No new plugin was suggested or installed.

## Next required garment change

Author the shoulder cap and underarm transition as a continuous fitted surface against these actual poses, with appropriate skin weights and pose correctives. Simply increasing reach or removing humeral influence does not preserve the desired silhouette. The fixture makes the failing geometry directly editable; it is not proof that the garment has been repaired.

Keep the accepted shoulder width, walking, hands-on-hips, heel pivot/recovery, hand/wrist lengths and exact racket contact. Retain the blue shirt with lime collar/cuffs. A replacement must be checked throughout preparation, impact, follow-through and recovery at 30/60/120 Hz, including ready/idle/walking transitions and recorded replay; two good stills alone do not satisfy the gate. Restore the checksum-verified native authoring inputs before regenerating `taylor.glb`, then update provenance and source/public mirrors. Preserve the existing facial/grip/skirt channels unless an explicitly reviewed adapter changes them.

The source bake merges shoulder and upper-arm influences. The upstream source has separate clavicle, shoulder and upper-arm bones: [pinned MakeHuman skeleton](https://raw.githubusercontent.com/makehumancommunity/makehuman/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/makehuman/data/rigs/default.mhskel). This supports investigating that loss of distinction; it does not prove that adding a joint alone will repair the current garment.

The whole hero/tennis sequence remains below the requested quality gate. No perceptual improvement is claimed for this pass.
