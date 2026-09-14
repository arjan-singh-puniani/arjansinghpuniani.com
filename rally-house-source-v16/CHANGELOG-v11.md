## v11 — Living Light

- Kept the v10 brighter living-boutique palette, character appeal pass, and richer décor.
- Added a second interior lamp shadow map so the main court fixture casts visible evening shadows.
- Exposed `window.__rh.setLampShadows()` and `window.__rh.lockCamera()` for controlled A/B review.
- Restyled the court pendants with clearer housing, reflector, emissive tube, and spill.
- Rebuilt the spectator row with varied furniture instead of three cloned benches.
- Verified the merged build with 44 deterministic automated checks.


## v9 — Color & Character Charm

- Brighter palette/value separation and softer premium lighting.
- Core-character visual signatures strengthened.
- Re-authored locomotion timing, personality, acceleration, head stabilization and shoe roll.
- Preserved all simulation systems and v8 visual motifs.
- 44 automated checks.

# Changelog

## 0.6.0 — Alive polish pass

### Animation and tennis
- Added explicit court phases: split, adjust, load, stroke, recover.
- Improved world-space foot locking with predicted landing points.
- Added directional locomotion blend diagnostics.
- Added soft jog behavior on longer paths.
- Added character-specific stroke timing, coil, follow-through, and tempo.
- Made Mika's stroke timing respond to persistent development.
- Added serve toss tracking from the non-dominant hand.
- Added continuous pre-contact ball visualization.
- Added deterministic skill-weighted frames, net errors, and long misses.
- Added recovery footwork after strokes.
- Added racket vibration and ball squash illusion on bounce.
- Added net-ripple response.

### Character acting
- Added explicit emotional states and facial targets.
- Added conversation-partner tracking.
- Added contextual memory-based dialogue.
- Added hair lag and cup steam secondary motion.

### Social simulation
- Added member-to-member relationship graph.
- Added structured semantic memories with people/tags/sentiment/strength.
- Added state-driven emergent social rules.
- Added a real autonomous Mika ↔ Leo social rally.
- Added rain-driven indoor behavior.

### Environment and interaction
- Added responsive café, bonsai, water, training, and stringing visual effects.
- Added curtain sway, towel motion, and a rolling loose court ball.
- Added richer procedural interaction sounds for shoes, cups, UI paper, stringing, racket quality, bounce, and net.

### Camera and performance
- Replaced simple exponential camera interpolation with spring-based damping.
- Added gentle coaching focus bias.
- Added optional runtime performance telemetry with `?debug=1`.

### Persistence
- Save schema upgraded to v4.
- Added pure v3→v4 migration normalization.
- Persisted emergent-social cooldown/seen state.

### Verification
- Strict TypeScript build passes.
- Automated suite expanded from 15 to 24 checks, all passing in the build sandbox.
- GPU screenshot validation remains unavailable in the sandbox because Chromium cannot initialize EGL/ANGLE.

## v0.7 — Hybrid Motion

- Added data-driven authored motion clips underneath procedural character logic.
- Added a 15-bone semantic character rig.
- Added WebGL2 linear-blend skinning with weighted character surfaces.
- Replaced rigid torso/limb cylinder rendering with skinned torso, arms and legs.
- Added explicit elbows and improved joint continuity.
- Kept planted feet, racket sweet-spot correction, gaze, face and prop constraints as procedural override layers.
- Added three hybrid-animation automated checks; suite now totals 27 passing checks.
- Preserved all v0.6 life-simulation, tennis, persistence and club systems.

## v7 — Light and Ground

Rendering and framing milestone. No simulation behaviour was changed.

Added
- Directional shadow mapping with PCF, stable texel-snapped frustum, normal-offset bias,
  and caster filtering (`src/rendering/Renderer.ts`).
- `orthographic()` and `sunViewProjection()` in `src/rendering/Math3D.ts`.
- Sun / sky / bounce colour and a `shadowStrength` curve in `World.lighting()`.
- Aspect-aware camera framing, including a wider lens and tighter subject radius in
  portrait, plus `frameAcademy()` and framing-relative zoom bounds.
- `window.__rh` local debug hook (time, weather, speed, focus, metrics report).
- `tools/shoot.mjs`, a headless Chromium capture harness used for the visual QA matrix.
- Six new tests covering the orthographic projection, shadow frustum coverage across the
  whole day, texel snapping, landscape and portrait framing, and zoom bounds.

Changed
- Rigid and skinned fragment shaders now share one lighting body instead of being copies.
- Camera button refits the academy instead of snapping to a hard-coded distance.

Fixed
- Portrait viewports framed roughly 13 world units of a 22 unit club, so phones opened on
  a bare court. They now frame the academy.

Tests: 33 passing (27 inherited, 6 new).

## v8 — Boutique Diorama

Dedicated art-direction pass built on v7 rather than replacing simulation systems.

### Characters
- Added distinct adult visual signatures for June, Mika and Nia.
- Added ponytail, bob and improved bun/waves geometry.
- Added Mika headband, skirts/skorts/host silhouettes and individual shoe colors.
- Added a subtle feminine skinned torso variant.
- Increased face readability with slightly larger eyes, catchlights, skin-relative blush/nose tones, lashes and layered hair.
- Added material tags for skin, hair, fabric and racket parts.

### Environment
- Rebuilt bonsai as a signature motif with five distinct procedural silhouettes: windswept, pine, cascade, maple and flowering.
- Added boutique floor runners, reception cubbies and a court-side racket/towel vignette.
- Reduced legacy fake shadow blobs now that v7 has actual shadow mapping.
- Strengthened evening practical-light contribution.

### Renderer
- Added a stylized material taxonomy (wood, fabric, ceramic, metal, glass, court, skin, hair, leaf, matte).
- Added restrained roughness/specular/soft-grazing response in the shared lighting shader.

### Verification
- Strict TypeScript build passes.
- Automated suite expanded to 38 checks, all passing.
- Browser visual verification remains blocked in this container by Chromium EGL/ANGLE initialization.
