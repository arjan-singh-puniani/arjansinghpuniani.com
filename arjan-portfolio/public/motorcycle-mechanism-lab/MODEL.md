# Motorcycle Mechanism Lab

An independent component-interaction prototype by Arjan Singh Puniani for the Mechanism-to-Medical Center project. First implementation: 19 November 2026.

## Asset and rights

This work is based on **[(FREE) Honda CRF 450](https://sketchfab.com/3d-models/free-honda-crf-450-c80f0e732e844580af412958c9d67315)** by [Jacobdesigns](https://sketchfab.com/Jacobdesigns), published 20 March 2023, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The creator describes it as a rigged 2022 Honda CRF450 made in Blender. The creator's public model API and the asset's embedded license metadata agree on the author and license.

The editable package was obtained from the [public redistribution](https://github.com/qkrakswo/portfoli/tree/ff08d26dd538d6549cdd234e53a47c8312e72ec1/honda/honda_main/honda_sub/free_honda_crf_450) at immutable commit `ff08d26dd538d6549cdd234e53a47c8312e72ec1`. Its [license file](./model/license.txt) is retained. The package contains 81 mesh surfaces, a 49-joint source rig and nine texture images. Source rig joints are not physical joint specifications.

Changes: textures converted to WebP (color at quality 92; normal and metallic/roughness maps lossless), source pose baked into editable mesh coordinates at runtime, surfaces separated by source rig assignments and grouped into 15 authored assemblies, local mesh dents and visual assembly-release behavior added. The 81 source surfaces become 83 editable surfaces, retaining 179,747 triangles. This keeps front and rear bodywork independent even where the source shares a mesh/material. The preview is a render of this model. No generated replacement motorcycle was used. File hashes and source URLs are in [provenance.json](./provenance.json).

This is a Honda artist reconstruction, **not a DR650**, official manufacturer CAD, a service manual, a toleranced assembly or a validated structural model. The Suzuki DR650 candidates investigated were paid packages or viewing-only assets; simpler free generic candidates were rendered and rejected. No purchase was made. Honda and other depicted marks remain their owners' marks; no affiliation or endorsement is implied.

DR650 candidates reviewed: [yarankepang's 1993 SP43](https://sketchfab.com/3d-models/suzuki-1993-dr650-motorcycle-sp43-f381256deeca4872966ba0cd5460f457) has no public download/reuse license in its API metadata; [gonzo_3d's 2015 DR650SE](https://3dexport.com/3d-model-suzuki-dr650se-2015-113631) is a paid package whose listing describes named objects and detailed textures. Neither editable package was obtained or verified for this implementation. The Honda was selected because its licensed geometry, rig assignments and rendered result could be inspected directly.

## Interaction model

- **Orbit:** drag, pinch or scroll. On the focused canvas, arrow keys orbit and +/− zoom. Camera buttons provide a three-quarter view, side view, controls view and fit-to-assembly view.
- **Pull apart:** raycast a visible surface, select its authored assembly and move it in the camera-facing plane. The parent-child scene hierarchy keeps attached child assemblies together. A travel of 0.48 model units releases the visual connection; this is an interaction setting, not a physical failure threshold. The Pull slider and Release button provide keyboard alternatives.
- **Dent:** a pointer contact defines a local center and normal. Dragging downward, or using the Local deformation slider, moves nearby vertices inward with a smooth finite-radius falloff. The maximum edit depth is 0.24 model units over a radius of 0.3, with a small crease term. Positions, normals and bounds update together. This is surface sculpting, not finite-element analysis or a material constitutive law. It does not create new fracture surfaces.
- **Release:** detached assemblies retain their child geometry. A bounded visual velocity, gravity and damped ground contact make them fall and settle. There is no collision solver between assemblies. These settings are for interaction, not calibrated crash dynamics. Reduced-motion mode places released assemblies directly on the ground and removes easing.
- **Assembly separation:** the slider moves assemblies along authored display directions to reveal their relationships. These directions are not a service disassembly procedure. Restore and Reset recover the original hierarchy, pose and vertex positions.

No Newton-valued force, stress, strain, fracture threshold, rider loading, injury, imaging finding, clinical decision or recovery time is calculated. Mouse and touch gestures are not force sensors. A convincing appearance does not validate the mechanical response. The source reconstruction has no supplied material laws, fastener specifications, load cases or calibration data.

## Information captured

The downloadable JSON contains asset credit, the latest 100 actions and their relative time, selected assembly, input source and pointer type, surface contact point and normal where available, coordinate frame, deformation setting, assembly separation and final positions in model coordinates. It is generated in the browser. It contains no patient fields and is not transmitted or saved to a server. The record is an interaction-design demonstration, not an accident data recorder or clinical form.

This connects to the project's handoff question: preserve mechanism context, provenance, timing and unknowns. The [existing toolkit](../work/motorsport-neurotrauma-toolkit) retains its evidence ledger and fixed fictional handoff; the motorcycle study does not infer medical findings from vehicle appearance.

## Implementation references

- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html): loading the licensed glTF scene and textures.
- [Three.js BufferGeometry](https://threejs.org/docs/pages/BufferGeometry.html): editable vertex attributes, normal updates and geometry bounds.
- [Three.js Object3D](https://threejs.org/docs/pages/Object3D.html): scene hierarchy and preserving world transforms during reparenting.
- [Three.js Raycaster](https://threejs.org/docs/pages/Raycaster.html): selecting a surface contact from a pointer.
- [Pointer Events](https://www.w3.org/TR/pointerevents3/): pointer capture and cancellation for mouse/touch interaction.

The implementation reuses the repository's MIT-licensed Three.js r186, GLTFLoader, OrbitControls and RoomEnvironment under `/hospitalsim/vendor/`. No npm dependency, hosted model service, tracking or external runtime API was added. WebGL or asset-loading failure leaves a local preview, native source links and methods available. Model behavior requires separate material, structural and biomechanical validation before any engineering or clinical use.
