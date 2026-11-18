# Agent Orange: The Long Shadow

## Portfolio introduction draft

This project turns a 2026 observational study of Parkinson disease diagnoses in 4,468,509 US veterans into an interactive explanation of chemical identity, neuroanatomy, and statistical uncertainty. The study reported an adjusted hazard ratio of 1.44 for reported Agent Orange exposure and 1.99 for its direct or occupational subgroup. Those are relative associations; they do not establish causation, estimate personal risk, or isolate 2,4-D.

## Blender-to-browser pipeline

PubChem 3D SDF records supply atom coordinates and bond orders for 2,4-D, 2,4,5-T, and TCDD. The licensed Human Reference Atlas brain GLB provides a whole-brain reference, while the CIT168 1 mm MNI group-template label map supplies display surfaces for the putamen, caudate, and substantia nigra pars compacta. The separate atlases are not registered together. Blender Python scripts generate editable `.blend` scenes and portable GLB assets. For the browser, the preserved NIH source GLB is decimated per named mesh at ratio 0.5, reducing the brain transfer asset by about 47% while retaining 283 named meshes. A Next.js route loads the assets in Three.js. The cinematic Blender scene reuses the chemical and CIT168 assets across a seven-shot, 105-second camera timeline.

## Engineering decisions and limits

The chemical models retain separate identities and source records. The HRA brain is a generic mirrored reference model, not a veteran or patient scan. The CIT168 surfaces are smoothed display surfaces from a group template, also not individual or exposure-specific anatomy. Both are CC BY 4.0 with source records and modifications documented in `ASSET_PROVENANCE.md`. The neuron, mitochondrion, pathway, and exposure scenes are educational schematics; candidate mechanisms are labeled as hypotheses. The current silent H.264 review is 105 seconds at 1920×1080 and 24 fps, rendered with Blender Cycles on CPU because no Metal render device was detected. The cut has no narration or sound, and the SRT timings remain drafts.

## Authorship note

This working version was created with agent-assisted research support, code editing, procedural asset generation, and testing. Confirm and describe the author's personal contributions accurately before publishing this as an admissions or professional portfolio project. No independent expert review is claimed.
