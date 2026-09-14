# Visual QA — v8

## What was inspected

The supplied v7 before/after screenshots and the three user-provided cozy-game references were inspected as visual targets. The largest remaining v7 weaknesses were bare perimeter floor, flat material response, generic character silhouettes, and bonsai that read as a single rounded plant rather than a signature motif.

## Automated / structural checks

`npm test` verifies:

- existing simulation, tennis, animation, save and camera behavior;
- material hierarchy is present in the world mesh data;
- five distinct bonsai areas contain authored foliage;
- the core adult women have distinct hair/outfit signatures;
- Mika emits outfit and layered-hair geometry while retaining the three GPU-skinned body surfaces;
- bonsai leaf motion is bounded and finite.

## Runtime screenshot limitation

This container's system Chromium still cannot initialize the WebGL EGL/ANGLE path. Attempts with SwiftShader and Xvfb produce `EGL_NOT_INITIALIZED` / `DisplayVkXcb xcb_connect failed` and hang before a trustworthy frame is produced.

Therefore v8 does **not** claim a rendered screenshot comparison from this environment. The shader compiles at TypeScript/source level only; browser GPU shader compilation and final visual judgement must be checked on the user's Mac.

## Required Mac review

Run the game and inspect:

1. morning, midday, golden hour, rain and evening;
2. June, Mika and Nia at medium zoom;
3. all five bonsai placements;
4. reception, matcha nook, lounge and pro shop composition;
5. ceramic/fabric/wood/skin/hair material differences;
6. court readability and whether added perimeter details remain outside play space;
7. outfit clipping during forehand, backhand, serve, sit and drink animations;
8. ponytail / bob / bun silhouettes during locomotion;
9. mobile portrait framing.

If any new outfit or hair geometry visibly clips, prioritize that over adding more props.
