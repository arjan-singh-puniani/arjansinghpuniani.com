# Hair material review

1. Wrong: Taylor's ponytail reads as a hard cap, with artificial directional surface noise and a broad plastic highlight. The hairline itself is also too hard.
2. Cause: procedural color stripes and normal waves overlay an already authored strand texture. The material adds a strong generic gloss and grazing sheen. Geometry and coverage remain a separate problem.
3. Smallest retained fix: skip the artificial stripe/normal overlays on textured hair and reduce the generic highlight. Preserve the current ponytail, alpha masks, geometry, expressions, gaze and recordings. No new asset or runtime dependency.
4. Regression: full npm test passes. Six native portraits at three matched angles compile/render with no page or GL errors. Actual unpaused championship ABBA samples retain 16.7 ms medians and 16.7–16.8 ms p95; draw calls (878), triangles (373,506) and nine authored parts are identical. All 106 source/mirror artifacts match. These checks cover Chromium/Metal on this Mac.
5. Actual perceptual result: slightly softer, less shiny ponytail with clearer authored strands. The change is small: image deltas are confined to the hair/brow/lash region. `comparison.webp` crops actual matching runtime captures, not generated art. The hard hairline remains. A partial fringe, complete side-swept bob and parted bob were also fitted and inspected in isolated native views; they were rejected for floating roots, face occlusion or shell-like volume and are not shipped.
6. Colleague-send: marginally closer in material response, still no. This pass does not solve the main silhouette/likeness gap or prove human visual approval. The goal remains active.

Baseline: c8f81a01, frozen compiled runtime with identical current character assets. `QA_BASELINE=/path/to/frozen-runtime QA_OUT=/tmp/hair-review node qa/hair-presence.mjs` reproduces the comparison. That directory contains dist and assets trees. The portraits use the production actor and renderer on a diagnostic stage; `live-performance.json` separately covers real championship play. Pixel difference bounds are in `pixel-delta.json`.

Limits: no new groom, hairline geometry, strand motion or reference-matched sculpt is delivered here. Character appearance and overall studio-caliber quality remain unapproved. The accepted travel and decoration implementations are unchanged.
