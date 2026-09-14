# Character System

Rally House uses a hybrid character stack.

## Base motion

Each character selects authored motion curves from `src/animation/ClipLibrary.ts` for idle, locomotion, tennis, social and coaching states.

## Skeleton and skin

`src/animation/CharacterSkin.ts` defines a 15-bone semantic rig. Weighted body surfaces are GPU-skinned by the WebGL2 renderer. v8 adds a restrained adult feminine torso variant used by the feminine-presenting core women while preserving the same rig and motion logic.

## Procedural correction

`src/entities/Character.ts` layers world-aware corrections after the authored motion:

- planted feet;
- court-specific locomotion phases;
- racket sweet-spot correction near contact;
- serve toss hand positioning;
- gaze and conversation targeting;
- facial emotion state;
- hair/racket secondary motion;
- prop attachment.

## v8 visual identities

- Coach June: adult coach, bun, skort, muted sage, economical posture.
- Mika: adult member, ponytail, headband, tennis skirt, warm peach, energetic learner silhouette.
- Leo: adult member, crop hair, shorts, blue-green equipment-focused silhouette.
- Nia: adult host, bob, host outfit, terracotta warmth, socially relaxed silhouette.

The intent is recognition from silhouette and behavior, not labels alone.
