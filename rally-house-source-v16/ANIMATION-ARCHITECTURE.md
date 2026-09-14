# Rally House Animation Architecture — v0.6

## Goal
Animation is layered around contact, balance, gaze, and personality. The renderer is still a lightweight procedural WebGL2 system, so this pass focuses on coherent motion rather than imported skeletal clips.

## Character pose stack
Each rendered pose is composed from:

1. **Locomotion state** — idle, walk, brisk/jog, court shuffle.
2. **Court phase** — neutral, split step, adjustment, load, stroke, recovery.
3. **Action state** — conversation, drink, stretch, coaching, tennis stroke, reaction.
4. **Body mechanics** — hip/torso coil, knee loading, pelvis shift, weight transfer.
5. **Constraints** — planted feet and racket sweet-spot contact.
6. **Gaze** — ball or explicit target first, conversation partner second.
7. **Face** — expression channels blend toward an emotion state.
8. **Secondary motion** — racket vibration, hair lag, cup steam.

State changes crossfade using the previous pose. World-space planted-foot constraints are re-applied after blending so the crossfade cannot drag a planted shoe.

## Foot planting
`Character.updateFootPlanting()` tracks stance transitions. On a new stance, the foot locks to a predicted world-space landing point. The root continues moving over that lock. Swing feet use the procedural gait trajectory until the next stance.

Court movement begins with a short split-step phase. Adjustment movement exposes lateral/forward/backward blend weights through `debugKinematics()` for QA. Recovery movement intentionally skips the split-step delay.

## Tennis contact
`RallySystem` predicts a receiver destination before launch. The receiver split-steps, adjusts, and loads. At stroke trigger, the character solves a bounded contact target. Near the contact phase only, the hitting hand is corrected so the racket sweet spot meets that target.

The incoming visual ball now travels from its captured position toward the racket during preparation instead of disappearing and reappearing. The outgoing ballistic ball launches from the live racket contact point.

## Serve
The serve has a separate toss visualization. The toss starts near the non-dominant hand, rises, and converges on the stored contact target before launch. Serve timing and body coil differ from groundstrokes.

## Stroke personality
Character IDs map to restrained stroke profiles:

- **June:** compact, economical, balanced.
- **Mika:** smoother and earlier as development rises.
- **Leo:** larger coil and follow-through.
- **Nia:** shorter recreational motion.

Mika's development value affects both visible preparation timing and calculated tennis skill.

## Facial acting and gaze
Face channels include smile, mouth opening, brow lift, squint, focus, blink, pupils, cheeks, and head orientation. Emotion states include attentive, friendly, focused, amused, pleased, disappointed, tired, surprised, proud, and frustrated.

Gaze priority in the current implementation is:

1. explicit target, including the live tennis ball;
2. conversation partner;
3. forward idle gaze.

## Known ceiling
This is still procedural geometry rather than a skinned character rig. The next major animation step should add authored skeletal clips beneath the procedural layers while retaining foot locking, gaze, contact correction, and personality modifiers.
