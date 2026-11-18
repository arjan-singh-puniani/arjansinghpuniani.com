# Cinematic quality review

Review date: 2026-11-18. Review target: encoded H.264 1080p silent review cut, plus representative Blender Cycles renders. Evidence: `artifacts/agent-orange/encoded-contact-sheet-1080p.png`, `artifacts/agent-orange/encoded-contact-sheet.png`, and decoded full-size samples from the atlas, neuron, mitochondrion, and final chart shots. A separate 4K opening-title review is recorded below.

The current full cut is encoded at 1920×1080, 24 fps, 105 seconds. The full decode and black-frame scan passed. The atlas caption was moved below the surfaces after a contact-sheet review, and the cell interval was rerendered after removing an erroneous static-frame fallback. The final neuron pose is held for one frame at its boundary to avoid a black flash. The render cache is outside the repository at `/Users/arjan/.codex/visualizations/2026/11/18/01a1edbe-04d2-7a00-94ad-7e11f9376d15/agent-orange-film-frames-1080p/`.

| Dimension | Score | Evidence and remaining defect |
| --- | ---: | --- |
| Scientific accuracy | 7/10 | Chemical identities are separated; the study chart shows adjusted hazard ratios and uncertainty; observational limits and schematic anatomy are labeled. Primary-paper verification remains abstract-level, and no independent expert review occurred. |
| Anatomical fidelity | 4/10 | The CIT168-derived subcortical group-template surfaces have documented provenance. The neuron, mitochondrial folds, and pathway are original educational schematics, not validated anatomical meshes. |
| Cinematography | 4/10 | The camera changes scale and reveals the molecular, atlas, cellular, and cohort scenes. The aircraft and cellular shots use simple centered compositions and limited depth staging. |
| Animation quality | 5/10 | The Blender scene has deterministic camera and object animation; the full 105-second sequence contains all seven shots. The evidence chart intentionally holds still, and motion in several scenes is basic. |
| Lighting and materials | 4/10 | Materials distinguish the major objects and the black environment preserves contrast. The cell structures remain smooth, simplified, and somewhat toy-like. |
| Narrative clarity | 6/10 | Labels and timed narration draft distinguish formulation, hypothesis, and association. There is no recorded narration in the film, so audio-driven comprehension is unverified. |
| Sound design | 0/10 | No narration, sound stems, mix, or audio stream exists in the current review MP4. |
| Accessibility | 6/10 | The site has reduced-motion support, keyboard interaction, labels, and mobile layout checks. Captions remain unsynchronized drafts; screen-reader and real-device review are incomplete. |
| Technical reliability | 7/10 | All 2,520 frames encoded at 24 fps; `ffprobe` confirms 105 seconds, H.264, 1920×1080; full decode and black-frame scan passed. The verified build, tests, and browser sample do not cover all browsers or devices. |
| Originality | 5/10 | The Blender-to-Three.js experience and original procedural scenes provide a coherent technical demonstration. The visual language and procedural geometry are still early-stage. |

## Revisions completed

- Full-resolution inspection found the opening's last title line touching the bottom edge. The Blender source now uses a smaller title and moves the block upward; frame 85 at 3840 × 2160 was rerendered and inspected with all three lines inside the frame. The side-by-side before/after is `artifacts/agent-orange/opening-title-before-after-4k.png`. The corrected 4K sequence is in progress; this correction is not yet in the published 1080p review MP4.
- Replaced the neuron wireframe with a cutaway soma, branched dendrites, segmented myelin, and terminal vesicles.
- Enlarged and opened the mitochondrial model to show simplified inner-membrane folds; removed most decorative candidate markers.
- Rerendered frames 1081–1800, re-encoded the complete film, inspected the updated encoded samples, and confirmed no black intervals.
- Rerendered frames 721–1080 after moving the CIT168 caption clear of the atlas, re-encoded all 2,520 frames, and inspected the updated contact sheet and encoded frame samples.
- Replaced the erroneous 10-second static cell fallback with the actual camera-animated Blender frames; held the last valid neuron pose for one boundary frame after confirming Blender rendered the exact endpoint black.

## Remaining visual defects

- The historical aircraft and terrain are illustrative low-detail models.
- The neuron and mitochondrion are schematic and do not meet medical-illustration fidelity.
- On-frame text remains small, the pathway/evidence shots have limited motion, and the film has no audio; it is a review cut, not a delivery master.
- A final creative pass would need rebuilt hero assets, richer shot-specific lighting/composition, full-size typography review, narration, and sound mastering.

The work is not an 11/10 result and is not production-ready. These scores describe inspected evidence, not a prediction of future quality.
