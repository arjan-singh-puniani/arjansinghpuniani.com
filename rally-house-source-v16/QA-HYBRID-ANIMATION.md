# Hybrid Animation QA — v0.7

## Verified in this build environment

- `npm run build` passes under strict TypeScript.
- `npm test` passes 27/27 checks.
- Authored walk clip contains an explicit swing-foot lift arc.
- Skinning produces 15 finite 4x4 bone matrices.
- Character render output contains three GPU-skinned body surfaces.
- Existing planted-foot, shuffle, contact, serve, relationship, memory, weather and migration tests still pass.
- Static HTTP server returns 200 for `index.html`, `dist/main.js`, `dist/animation/CharacterSkin.js`, and `dist/animation/ClipLibrary.js`.

## CPU geometry sanity check

The generated skin was CPU-deformed using the same bone matrices for a forehand-near-contact pose and inspected as a point-cloud projection. The torso, arms and legs remained finite and spatially coherent; no NaNs or runaway vertices were observed.

## Not verified here

The container's Chromium cannot initialize EGL/WebGL, including SwiftShader. Therefore the actual WebGL skinning shader could not be screenshot-validated in this environment. The shader source, uniforms and TypeScript integration are present, but final on-device rendering must be checked on a normal WebGL2-capable browser.

## First Mac visual checks

When opening v0.7 on macOS, inspect these first:

1. shoulders and elbows during forehand/backhand;
2. knee continuity during walking and shuffling;
3. torso deformation during large Leo swings;
4. foot locks during camera-close lateral movement;
5. arm/racket alignment at contact;
6. transparent-window ordering around characters;
7. skin normals under morning and evening light.

If a skinning shader fails, the browser console should be inspected before any animation tuning. Do not compensate for a shader problem by changing animation data.
