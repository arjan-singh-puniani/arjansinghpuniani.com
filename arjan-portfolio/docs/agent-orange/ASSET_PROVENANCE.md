# 2,4-D molecule asset provenance

- Source record: PubChem CID 1486, 3D conformer ID `000005CE00000001`.
- Source file: `public/agent-orange/source/2-4-d-pubchem-cid-1486.sdf`.
- Source request: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/1486/record/SDF?record_type=3d`.
- Atom coordinates and bond orders are read directly from the V2000 SDF. The build script checks 19 atoms, 19 bonds, and formula counts C8H6Cl2O3.
- Editable Blender scene: `public/agent-orange/2-4-d-pubchem.blend`.
- Browser asset: `public/agent-orange/2-4-d-pubchem.glb`.
- Rendered preview frame: `public/agent-orange/renders/2-4-d-preview.png`.
- Generator: `scripts/agent-orange/build_molecule.py`.
- Representation: conventional ball-and-stick. Atom radii, bond radii, colors, and lighting are visual choices. This conformer is a structural model, not a depiction of biological exposure, metabolism, or a Parkinson disease mechanism.

Blender 5.3.0 is the verified generator version. The downloaded official Apple Silicon disk image matched SHA-256 `2d802b54766741e612cead50b03ebbc8eb64dadc71eda932573d256b8a784720`. The existing Blender 4.0.2 app was not replaced.
