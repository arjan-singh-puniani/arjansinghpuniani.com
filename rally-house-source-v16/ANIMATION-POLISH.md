# Rally House v4 Animation Polish

## Goal

Remove the procedural-animation tells that most reduce perceived quality: foot sliding, state snapping, floating rackets, generic faces, and swings that ignore where the ball actually is.

## Implemented

### Planted feet

Walking and court shuffling now use stance phases. When a foot enters stance, its world-space position is captured. The root can continue moving while that shoe remains fixed. The lock is released only when that foot leaves stance. Foot locks are applied after animation-state blending so crossfades cannot make a planted shoe drift.

### Blended locomotion

Each state change keeps the prior state and animation time. The character evaluates both poses and crossfades them over a short state-specific window. Shot transitions are deliberately faster than social transitions. Facing uses damped angular motion rather than instant yaw assignment.

### Hand-racket constraint

The hitting hand is the source of truth for the racket grip. The handle top and racket head are derived from that grip. During backhands, the off hand is constrained near the handle around contact. This removes the previous visual gap where the racket could appear to float away from the hand.

### Contact-aware strokes

When the incoming ball enters the receiver's strike zone, `RallySystem` stores the real ball position on that character. The next shot uses this position to create a reachable contact target. During the stroke, a narrow contact weight solves the racket head onto that target. The ball is launched from the actual racket sweet spot only when the stroke reaches its defined contact time.

### Body mechanics

Forehands, backhands, serves, and volleys now have distinct hip coil, torso coil, knee load, stance, lean, pelvis shift, weight transfer, and follow-through values. The feet remain fixed during the stroke while the body moves above them.

### Facial deformation

The lightweight face now has independently controlled eye opening, pupils, gaze, brows, cheeks, mouth width, mouth opening, smile, squint, and focus. Expression values are damped frame to frame. This is still procedural primitive geometry, but it reads much more like a face than two eyes plus a static mouth.

## Verification

The automated suite contains dedicated checks for:

- planted foot staying fixed while the root advances
- alternating planted feet during court shuffles
- racket sweet spot reaching the requested contact target
- animation transitions taking measurable time instead of snapping
- tennis ball release occurring only at the racket contact frame
- ballistic bounce and net termination

The full suite currently passes 15 checks.

## Visual-validation limitation

The local Chromium build in this execution environment cannot initialize EGL/WebGL, including SwiftShader. TypeScript and simulation behavior are verified, but a trustworthy GPU screenshot of v4 could not be captured here. Visual acceptance should be performed on a normal Mac/iPhone GPU.
