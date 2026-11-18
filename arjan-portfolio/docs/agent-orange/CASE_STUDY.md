# Agent Orange: The Long Shadow

## Portfolio introduction draft

This project turns a 2026 observational study of Parkinson disease diagnoses in 4,468,509 US veterans into an interactive explanation of chemical identity, neuroanatomy, and statistical uncertainty. The study reported an adjusted hazard ratio of 1.44 for reported Agent Orange exposure and 1.99 for its direct or occupational subgroup. Those are relative associations; they do not establish causation, estimate personal risk, or isolate 2,4-D.

## Blender-to-browser pipeline

PubChem 3D SDF records supply the atom coordinates and bond orders for 2,4-D, 2,4,5-T, and TCDD. The CIT168 1 mm MNI group-template label map supplies display surfaces for the putamen, caudate, and substantia nigra pars compacta. Blender Python scripts generate editable `.blend` scenes and portable GLB assets. A Next.js route loads those GLBs in Three.js and presents them alongside a separately labeled schematic brain overview. The cinematic Blender scene reuses the chemical and atlas assets across a seven-shot, 105-second camera timeline.

## Engineering decisions and limits

The chemical models retain separate identities and source records. The atlas is a smoothed display surface derived from a group template, not an individual brain or veteran scan. The CIT168 paper and OSF project node declare CC BY 4.0; the source files and modifications are documented in `ASSET_PROVENANCE.md`. The neuron, mitochondrion, pathway, and exposure scenes are educational schematics; candidate mechanisms are labeled as hypotheses. The existing silent H.264 review is an earlier 105-second cut at 718×404, encoded from 720×405 Cycles CPU frames because no Metal render device was detected. A revised 1080p CPU render is in progress; neither cut has narration or sound, and the SRT timings remain drafts.

## Authorship note

This working version was created with agent-assisted research support, code editing, procedural asset generation, and testing. Confirm and describe the author's personal contributions accurately before publishing this as an admissions or professional portfolio project. No independent expert review is claimed.
