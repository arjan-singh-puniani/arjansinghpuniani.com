# Character asset intake — v16

No professional character or animation asset was supplied. No imported professional mesh is active in this build. The procedural characters, existing skin matrices and walking system remain in use.

`src/animation/CharacterAssetIntake.ts` is a strict offline intake adapter for a deliberately limited glTF 2.0/GLB subset. It supports triangle geometry, normals, four skin influences, an explicit unique mapping into the existing rig, inverse bind matrices and named material slots. It validates buffer bounds, counts, finite values, normalized weights, joint/index ranges, triangle counts and a 120,000-vertex expanded budget. It rejects animations, morph targets, required decoder extensions and unsupported textured material activation rather than pretending to retarget them.

The CLI `tools/inspect-character.mjs` reads local files, verifies/calculates the source SHA-256 and requires provenance. It does not fetch network assets. Intake output is not automatically attached to an actor. Bind-pose compatibility, coordinate conventions, material mapping, joint deformation and motion must be reviewed before activation.

Example, from the project folder:

```sh
npm run build
node tools/inspect-character.mjs /absolute/path/character.glb /absolute/path/provenance.json
```

The provenance JSON needs `author`, `source`, `license`, `sha256`, and `boneMap`. The CLI validates the supplied SHA if present and computes the real hash. Use explicit glTF joint names as keys; supported values are `pelvis`, `spine`, `chest`, `neck`, `head`, `upperArmL`, `foreArmL`, `handL`, `upperArmR`, `foreArmR`, `handR`, `thighL`, `shinL`, `thighR`, `shinR`. Foot positions are driven by the existing rig, not new foot bones.

`tests/asset-intake.mjs` uses a synthetic weighted triangle solely to test the adapter, then rejects malformed and unsupported cases. That triangle is not a character asset or visual-quality evidence. A licensed artist-authored hero character and retarget review remain the next asset milestone.

Format reference: [Khronos glTF 2.0 specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html). This intake adapter is not a general-purpose glTF renderer or a replacement for the Khronos validator.
