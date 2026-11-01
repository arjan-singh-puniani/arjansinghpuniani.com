# Original lobby props

Executed Blender 4.0.2. Original CC0-1.0 geometry/materials with substantial OpenAI Codex assistance. No external assets, branding, patient information, floors or characters.

`dist/assets/lobby.glb` contains four independent, floor-centered roots. Front faces +Z in the browser (−Y in Blender). Dimensions below are width × depth × total height in metres.

| Root | Dimensions | Triangles |
| --- | --- | --- |
| WaitingBench | 2 × 0.65 × 0.919451 | 1,744 |
| PaperAccordion | 0.28 × 0.10 × 0.12 | 172 |
| IntakeTray | 0.22 × 0.28 × 0.06 | 444 |
| ReceptionCounter | 1 × 0.48 × 0.965 | 1,060 |

Bench seat tops are 0.45 m high; their browser centers are (−0.64, 0.45, 0.055), (0, 0.45, 0.055), (0.64, 0.45, 0.055). Counter writing top is 0.75 m high; its integrated monitor reaches 0.965 m.

Total: 3,420 triangles, four primitives, 165,152 raw bytes. A single embedded palette preserves deliberate fabric/paper roughness, ivory powder coating and brushed-metal metallic/roughness values. The export has only its required PBR UV channel and no animation payload.

`verify.py` reimports the actual GLB, checks all four dimensions, floor/center origins, finite vertices, required PBR UV and embedded dependencies, then renders those imported meshes. All checks passed. Preview placements are illustrative and never saved/exported; all source/export roots remain at zero.

Reproduce with Blender `-b --python blender/lobby.py`; validate with `-b --python evidence/lobby-asset/verify.py`. Editable sources are retained in compressed `blender/lobby.blend`.

Limits: static paper folds and fictional monitor graphics; no cloth/paper dynamics, moving drawers or embedded game behavior. Character seating alignment and simulation integration remain renderer responsibilities.
