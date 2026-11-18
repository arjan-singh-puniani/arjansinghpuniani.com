# Molecular asset provenance

- Source records: PubChem 3D SDF records [CID 1486](https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/1486/record/SDF?record_type=3d) (2,4-D), [CID 1480](https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/1480/record/SDF?record_type=3d) (2,4,5-T), and [CID 15625](https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/15625/record/SDF?record_type=3d) (TCDD).
- Source records are retained as V2000 SDF under `public/agent-orange/source/`.
- Atom coordinates and bond orders are read from the SDF. The generator asserts each formula count before scene creation: 2,4-D C8H6Cl2O3, 2,4,5-T C8H5Cl3O3, TCDD C12H4Cl4O2.
- Generator: `scripts/agent-orange/build_molecule.py`.
- Each compound has an editable Blender scene (`public/agent-orange/{2-4-d,2-4-5-t,tcdd}-pubchem.blend`), browser GLB, and inspected still preview under `public/agent-orange/renders/`.
- Representation: conventional ball-and-stick. Atom radii, bond radii, colors, and lighting are visual choices. These are structural models, not depictions of formulation proportions, environmental exposure, metabolism, or a Parkinson disease mechanism.

Blender 5.3.0 is the verified generator version. The downloaded official Apple Silicon disk image matched SHA-256 `2d802b54766741e612cead50b03ebbc8eb64dadc71eda932573d256b8a784720`. The existing Blender 4.0.2 app was not replaced.

## CIT168 subcortical atlas surfaces

- Source publication: Pauli WM, Nili AN, Tyszka JM. *A high-resolution probabilistic in vivo atlas of human subcortical brain nuclei*. Scientific Data (2018), [doi:10.1038/sdata.2018.63](https://doi.org/10.1038/sdata.2018.63).
- Source volume: CIT168 1 mm MNI152NLin6Asym discrete label map, downloaded from [OSF item 2qswg](https://osf.io/download/2qswg); lookup table from [OSF item 6qrcb](https://osf.io/download/6qrcb). AtlasPack records these exact files in its [CIT168 preparation script](https://github.com/PennLINC/AtlasPack/blob/main/CIT168/prepare_atlas.sh).
- Source files retained under `public/agent-orange/source/`.
- Selected labels: putamen, caudate, and substantia nigra pars compacta (SNc). The raw label image is decoded in NIfTI axis order and mapped through the file affine; left and right are split at the MNI midline.
- Generator: `scripts/agent-orange/build_cit168.py`.
- Outputs: `public/agent-orange/cit168-subcortical.blend`, `public/agent-orange/cit168-subcortical.glb`, and `public/agent-orange/renders/cit168-subcortical-preview.png`.
- The source is a 1 mm discrete group-template label map from an atlas developed from in-vivo MRI; it is not an individual brain, histology, veteran scan, or Agent Orange finding. The exported surfaces are voxel-remeshed and smoothed for display, so their visible boundaries are not a native-resolution diagnostic segmentation. The rendering omits most other CIT168 nuclei and contains no brain cortex or white matter.
- The upstream [CIT168 repository](https://github.com/jmtyszka/CIT168-SubCorticalAtlas/blob/master/LICENSE.md) includes an MIT license. The downloaded NIfTI came from an OSF file endpoint whose asset-level license was not directly visible during this audit; confirm that the license covers redistribution of the atlas data and derived meshes before deployment.

## Cinematic scene

- Editable source scene: `public/agent-orange/agent-orange-film.blend`; deterministic scene builder: `scripts/agent-orange/build_film.py`.
- The 105-second timeline has seven camera-animated 3D shots and reuses the PubChem conformers and CIT168-derived GLB described above. The aircraft and terrain are explicitly labeled illustrative, not a reconstruction of a verified aircraft or site. Neuron, mitochondrion, and pathway views are educational schematics; the candidate-mechanism shot is labeled as such.
- Preview keyframes are rendered with Blender Cycles and saved under `public/agent-orange/renders/film-preview/`. The 2,520-frame 720×405 CPU render is saved under `artifacts/agent-orange/film-frames/`; the closing 15-second confidence-interval chart is held as a deliberate static pause. The MP4 is not yet encoded or inspected.
- `public/agent-orange/captions.srt` contains draft timing based on the narration outline. It has not been aligned against a recorded voice track. Narration and sound are not present.
- The local machine has no detected Metal render device. At the observed Cycles CPU cadence, the full render is estimated to take about an hour; 4K final output is not available in this environment's current verified configuration.
