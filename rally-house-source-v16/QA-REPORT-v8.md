# Rally House v8 — Verification Report

## Build

- `npm run build`: PASS
- strict TypeScript compilation: PASS

## Automated suite

- `npm test`: **38/38 PASS**
- Inherited behavior remained passing.
- v8 added structural visual-identity checks for materials, bonsai repetition, character differentiation, skirt/ponytail geometry, and bounded bonsai motion.

## Static serving

The final compiled project was served locally with Python's HTTP server and requested directly:

- `index.html`: HTTP 200
- `dist/main.js`: HTTP 200
- `dist/animation/CharacterSkin.js`: HTTP 200

## Measured scene structure

A fresh `World` instance contains:

- 337 authored static world meshes
- 9 interactive world objects
- 40 wood-tagged meshes
- 20 ceramic-tagged meshes
- 13 fabric-tagged meshes
- 38 leaf-tagged meshes
- 11 metal-tagged meshes
- 2 glass-tagged meshes
- 1 court material surface

Core character render-item counts at default pose:

- Coach June: 39 items / 3 GPU-skinned surfaces
- Mika: 41 items / 3 GPU-skinned surfaces
- Leo: 33 items / 3 GPU-skinned surfaces
- Nia: 36 items / 3 GPU-skinned surfaces

These counts verify structure, not beauty or frame rate.

## Runtime visual limitation

A trustworthy v8 screenshot could not be captured in this container. System Chromium repeatedly fails its EGL/ANGLE/WebGL process with `EGL_NOT_INITIALIZED` and `DisplayVkXcb xcb_connect failed`, including SwiftShader/Xvfb attempts. No rendered v8 screenshot or FPS claim is made.
