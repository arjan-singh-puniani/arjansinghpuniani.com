# Original assistant/facilities assets

Executed Blender 4.0.2. Original CC0-1.0 procedural wardrobes, badge glyphs and props with substantial OpenAI Codex assistance. Appearance is visual only; no game/health/ability parameters are defined here.

- Assistant: mint short tunic with 2.5 mm clothing shell, pale-blue trousers, MA badge and pen pocket.
- Facilities: graphite/ochre workshirt and utility panels, work gloves/cuffs, empty toolbelt pouches and FAC badge. Distinct skin/hair tones and a restrained lower-face variation retain adult proportions and the exact shared rig.

Both roles use the unchanged **clinician** 39-joint bind and nine existing clips. The four new GLBs contain zero animation clips, one primitive per human, one PBR UV channel, and embedded color/roughness/metallic data.

| File | Triangles | Raw bytes |
| --- | ---: | ---: |
| staff-assistant.glb | 12,644 | 483,384 |
| staff-assistant-lod.glb | 3,664 | 156,380 |
| staff-facilities.glb | 13,228 | 505,852 |
| staff-facilities-lod.glb | 3,832 | 163,932 |

The two LODs total 320,312 bytes; all four high/LOD files total 1,309,548 bytes. The full-detail pair was retained rather than claim the entire four-file set meets a 0.6 MB target.

`service-props.glb` is 44,712 bytes and contains independent, floor-centered roots:

| Root | Width × depth × height (m) | Triangles |
| --- | --- | ---: |
| FloorSpill | 0.60 × 0.60 × 0.01 | 192 |
| CleaningCaddy | 0.32 × 0.25 × 0.48 | 408 |
| Mop | 0.30 × 0.12 × 1.25 | 160 |

Tools are never bound/carried by the human skeleton. The renderer should show/place them only during the relevant job. The spill is a thin, opaque amber game abstraction, not a fluid simulation.

`verify.py` imports the actual clinician GLB clips and all four new humans, checks identical bind matrices, plays all nine clips, evaluates real scene skinned meshes, and verifies weighted facial/finger joints. All four passed with bind-matrix error zero. All three prop dimensions/origins and unchanged prior source/assets were verified. The curated renders use the exported GLBs; the studio floor is QA-only and is absent from delivered assets.

Rebuild with Blender `-b --python blender/service_staff.py`; run `evidence/service-staff-asset/verify.py`, then `assemble.py` with Pillow. Editable source is compressed `blender/service_staff.blend`. No other character, wardrobe, lobby, app or simulation files are modified.

Limits: inherited stylized anatomy/faces and authored motions; shared proportions, no cloth/fluid physics or clinical validation. Mop-to-hand placement and cleaning behavior remain renderer integration work; small badges need the accessible role labels at distant zoom.
