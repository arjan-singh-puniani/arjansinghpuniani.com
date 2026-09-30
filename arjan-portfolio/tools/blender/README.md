# Shoulder pipeline

Run from `arjan-portfolio`:

```
node tools/shoulder/audit.mjs
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python tools/blender/prepare_shoulder.py
```

The single deterministic script performs inspection, named-node creation, coordinate normalization, source normal preservation, non-manifold reporting, material assignment, GLB export, context LOD generation, master `.blend` saving and five neutral reference renders. It preserves UVs and exports tangents when input UVs exist. Current assets have neither UVs nor tangent data. Source hierarchy is a flat named structure collection; no biological substructure hierarchy is fabricated.

No mesh smoothing/remeshing or vertex movement is performed. Exact duplicate-vertex cleanup is intentionally disabled because coincident points may preserve intentional seams. Zero-length normals are reported, not silently repaired into asserted anatomical detail. LOD1 and LOD2 reduce only the scapula; they remain opt-in context variants. Source-normal validity, bound consistency, named nodes and topology are verified by the asset tests. Master and reference renders are stored outside public deployment assets.

World mapping: source `(x,y,z)` → `((x+130)*.01,(z-1275)*.01,-(y+45)*.01)` in the browser. The transform is a rigid rotation plus uniform scale/translation. Source landmarks are preserved. Right remains negative X; superior becomes positive Y; anterior becomes positive Z.

The camera crops the distal humerus in the browser. No cap, footprint, tendon, cartilage or otherwise absent structure is generated. The material palette is illustrative. No muscle-fiber data is claimed.
