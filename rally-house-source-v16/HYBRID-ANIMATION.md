# Rally House Hybrid Character Animation — v0.7

## What changed

This release introduces the first true hybrid character-animation path in Rally House.
The old procedural intelligence is retained, but it is no longer the only source of body motion.

The final pose is now conceptually:

1. **Authored keyframe clip underlay** — hand-authored motion curves for idle, walk, jog, ready stance, shuffle, sit, talk, drink, stretch, watch, forehand, backhand, serve, volley, reactions, celebration, coaching, and recovery.
2. **Simulation state** — schedule, court target, incoming ball, conversation partner, emotion and coaching context choose the clip/state and its timing.
3. **Procedural correction** — planted feet, body balance, racket contact, serve toss, gaze and interaction constraints are applied after the broad performance.
4. **GPU skinning** — the torso, arms and legs are rendered as weighted surfaces driven by a 15-bone character rig instead of only rigid cylinder limbs.
5. **Secondary attachments** — face, hair, hands, shoes, racket and props remain expressive procedural pieces attached to the solved body.

This is the architecture we wanted: authored motion provides rhythm and human-looking arcs; procedural logic makes that motion actually meet the tennis ball, floor, cup and other characters.

## 15-bone rig

The current lightweight rig contains:

- pelvis
- spine
- chest
- neck
- head
- left upper arm
- left forearm
- left hand
- right upper arm
- right forearm
- right hand
- left thigh
- left shin
- right thigh
- right shin

Feet remain explicit interaction/contact objects because the existing foot-lock system owns their world-space contact points.

## GPU skinning

`Renderer.ts` now has a separate WebGL2 skinning shader. Character surfaces carry:

- bind-space position
- bind-space normal
- four bone indices per vertex
- four bone weights per vertex

Each character uploads 15 skin matrices per frame. The shader linearly blends the bones and then applies the normal Rally House lighting path.

The generated skin is intentionally simple and stylized. It is a functional bridge to externally authored GLTF characters, not a claim of AAA production topology.

## Authored clips

`src/animation/ClipLibrary.ts` contains hand-authored normalized keyframe curves. The clips intentionally describe broad performance rather than exact world interaction.

Examples:

- walk/jog clips provide pelvis rhythm, counter-rotation and swing-foot lift;
- shuffle adds a low athletic base and lateral step rhythm;
- forehand/backhand add loading and kinetic-chain timing;
- serve adds a deeper load, upward drive and landing bias;
- talk/drink/coaching clips provide readable acting beats.

These are sampled beneath the existing state-specific procedural motion.

## Procedural layers retained

The important v0.6 systems still win when necessary:

- planted foot world locks
- court split-step / adjustment / recovery
- racket sweet-spot correction at real contact
- serve toss convergence
- gaze priority
- facial emotional state
- racket vibration
- secondary hair/cup motion

This matters because prerecorded clips alone cannot know where a dynamically simulated tennis ball will actually be.

## Current limitation

The project now has real GPU skinning and authored keyframe clips, but the skin is generated procedurally inside the project. It is not yet an artist-made GLTF character with sculpted topology, blendshapes, finger bones, cloth, or motion-captured animation.

The next visual jump should therefore be **asset substitution, not another animation rewrite**:

1. import a consistent stylized GLTF character family;
2. map its skeleton to the current semantic rig;
3. import professionally authored clips for locomotion, tennis and social actions;
4. keep Rally House's procedural correction layers on top.

The simulation and contact architecture can survive that swap.
