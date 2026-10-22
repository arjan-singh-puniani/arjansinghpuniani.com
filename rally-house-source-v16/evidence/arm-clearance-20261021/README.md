# Travel arm clearance — 2026-10-21

The walking and rest-transition hand path crossed the actual skirt. In the matched before image, the right hand disappears inside the garment. In the after image both hands remain visible outside it.

The shared adult pose solver now gives free hands lateral clearance as they pass the waistband, before the arm-length and elbow solve. The envelope eases to zero at the accepted hands-on-waist pose. World-owned contact retains its weight; tennis strokes, seated poses and affection are excluded. Body proportions, clothing assets and movement speed are unchanged.

`node qa/arm-clearance.mjs` reads the production vertex shader with transform feedback. It tests actual sleeves and exposed hands against skirt triangles during starts, walking, jogging, turns, stops and interpolated replay, in color and shadow passes. Set `QA_ACTOR=coach|mika|nia` for the other adult women. `QA_BASELINE` can route an earlier compiled build. Assertions require actual travel and a jog, finite vertices, zero intersections and no GL/browser errors. The original transition probe failed; the corrected cast sweep passes.

The full npm suite passed; authored-asset and interaction checks were repeated after preserving world-owned contact. The served mirror matches the source build. An actual keyboard-played eight-shot point completed with no browser/request/GL errors; its final miss was intentional.

The numerical checks support this travel fix, not a claim of overall studio quality. Tight cross-body shoulder folds still exist. The bound is fitted to the current shared skirt; a different silhouette needs a different garment bound.
