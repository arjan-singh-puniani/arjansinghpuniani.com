# v14 architecture update

`EverydayLife` owns scene eligibility, completed habit counts, cooldowns, follow-ups and bounded receipts. `Game` owns physical activity execution: routes, reservations, timed acting beats, brief attention interruptions and completion consequences. This preserves `ActivitySystem` as the single owner of committed members/resources. No new dialogue service or network dependency was introduced.

`Character` adds an eased social gesture layer outside tennis/locomotion and hand-attached props. `Navigation.clubPath` provides perimeter circulation and court exits. `HUD` renders optional scene focus and pause-aware, viewport-clamped speech. `GameClock` retains fixed updates while the game chooses a slower day. The frame loop provides bounded catch-up and adaptive render resolution; `Renderer` retains the existing geometry and lighting pipelines.

Schema 6 adds optional validated everyday state. Partial activities reset on reload. Context loss pauses, saves, and offers recovery. See EVERYDAY-LIFE-v14.md, SAVE-MIGRATION.md and QA-v14.md for current contracts and verified limits.

Earlier architecture notes below are historical.

# v12 architecture update

`ActivitySystem` owns committed people and resources. `Game.updateFixed` advances phases and runs physical tennis or shared time. `Game.completeActivity` applies results once and then persists them. `CoachingEvidence`, `ClubHistory` and `ObjectAffordances` retain bounded evidence and consequences. Schedules run only for unreserved members. The original `EmergentSocialSystem` implementation and saved data remain for compatibility; its old event executor is no longer the live activity owner.

See ACTIVITY-SYSTEM.md, COACHING-vNEXT.md, SOCIAL-SIMULATION.md, BUILDING-AFFORDANCES.md and SAVE-MIGRATION.md for current contracts. The architecture notes below describe inherited systems and should be read in that context.

# Rally House Living Club v2 Architecture

## Design boundary

The simulation, renderer, UI, persistence, and content remain separate. The browser DOM never owns game state. Render meshes do not own gameplay state.

The project stays dependency-free at runtime to keep iteration transparent.

## Game loop

`Game.ts` is the composition root.

- `requestAnimationFrame` drives rendering.
- Simulation advances in fixed 1/60 second steps.
- `GameClock` owns academy time and simulation speed.
- Frame catch-up is bounded to avoid runaway work after stalls.

## Rendering

`rendering/Renderer.ts` is a compact WebGL2 renderer.

Primitive vocabulary:

- box
- rounded box
- sphere
- cylinder
- cone
- torus

The shader provides soft wrapped directional light, hemisphere tint, restrained rim light, and a golden-hour warmth parameter. Device pixel ratio is capped for mobile performance.

The renderer accepts simple world-space `Mesh` records. It has no knowledge of coaching, relationships, schedules, or saves.

## World

`world/World.ts` defines the academy as a handcrafted miniature scene.

Static scene data includes:

- architectural plinth and cutaway walls
- court and net
- reception
- matcha café
- training nook
- water/towels
- lounge
- bonsai corner
- pro shop/stringing bench
- lockers
- club board
- decoration anchors

Dynamic environment meshes include matcha steam, fan motion, leaf movement, rain behind the window, and evening light pools.

## Characters

`entities/Character.ts` owns locomotion and procedural pose state.

The character API is deliberately asset-agnostic. A future skeletal/GLTF adapter can retain the same high-level states:

- idle
- walk / jog
- sit
- talk
- drink
- stretch
- watch
- coaching poses
- tennis strokes
- celebrate / miss reaction

Characters navigate to semantic destinations rather than random coordinates.

## Navigation

`world/Navigation.ts` provides lightweight obstacle-aware routing for the small academy scale.

This is intentionally simpler than a full navmesh. It is easier to debug and currently sufficient for the room size.

## Schedule simulation

`simulation/ScheduleSystem.ts` reads data-driven member schedules from `content/content.ts`.

The schedule declares intention:

- where a member should go
- what they are doing
- what animation state should follow arrival

It does not manipulate rendering directly.

## Autonomous club life

`simulation/ClubLifeSystem.ts` introduces authored-but-systemic club moments.

A moment has:

- day/time trigger
- speaker
- target
- semantic destination
- short duration
- scrapbook text

The system is deterministic and persisted, so a moment does not repeatedly fire after reload.

## Relationships

`simulation/RelationshipSystem.ts` stores:

- familiarity
- warmth
- trust
- rivalry
- remembered interactions

Interactions use named strategies such as greet, coach, rally, matcha, compliment, listen, and help. Relationship labels are derived from familiarity thresholds.

## Gentle intentions

`simulation/DailyGoalsSystem.ts` supplies three rotating low-pressure goals per in-game day.

The system deliberately has no streak concept. Completion can be claimed once. The next game day gets a fresh rotation.

## Tennis

`tennis/BallPhysics.ts` owns continuous ball integration, gravity, court bounce, and net interaction.

`tennis/RallySystem.ts` owns:

- hitter/receiver roles
- shot target variation
- receiver repositioning
- contact rhythm
- rally count
- best rally
- visual ball trail
- impact pulse
- stroke animation state

The simulation is intentionally readable and lightweight rather than biomechanically exhaustive.

## Coaching

Drills are content records. They define name, description, problem fit, and progression amount.

`Game.ts` applies drill fit to Mika’s persistent progression and coaching XP. This keeps the mechanic understandable and makes the player’s judgment matter.

## Persistence

`persistence/SaveSystem.ts` stores a versioned envelope in IndexedDB with localStorage fallback.

Schema v3 persists social state, scrapbook state, daily intentions, progression, equipment, placement, weather, and rally history.

The storage key stays compatible with the earlier vertical slice so older saves can be default-filled instead of abandoned.

## UI

`ui/HUD.ts` is a DOM presentation layer.

It owns:

- HUD chips
- objective card
- contextual action sheet
- build panel
- Club Book
- transient story cards
- anchored speech bubble
- toast feedback

It receives data from `Game` and emits user intent through callbacks.

## Next architectural milestones

1. Skeletal character adapter with authored blended clips
2. Real room graph and camera-aware wall cutaway
3. Staff work/task planner
4. Court booking/capacity simulation
5. Event framework and multi-member activities
6. Facility unlock graph and physical academy expansion
7. Expanded tennis shot selection, serve flow, and recovery logic
8. Spatial audio and licensed/owned ambient asset pipeline


## v3 polish architecture

### Animation-driven tennis

`RallySystem` schedules a pending stroke, waits for the procedural `Character` pose to reach a defined contact instant, samples `racketContactPoint()`, and only then launches `BallPhysics`. The ball simulation remains independent from render frame rate. Court locomotion uses a dedicated shuffle/ready path rather than ordinary walking.

### Camera-aware cutaway

`CameraController` exposes bounded, damped curated dollhouse angles. `World.dynamicMeshes()` receives camera position and continuously interpolates side-wall heights so the near wall lowers while the far wall retains architectural context.

### Local lighting

`Renderer` supports a directional source, hemispheric ambient contribution, and four compact point lights. The world computes their strength from time and weather. Transparent meshes are sorted back-to-front.

### Character expression

`Character` owns locomotion, pose timing, gaze, blink phase, facial state, tennis stroke phase, and racket geometry. This is still a procedural rig, deliberately isolated so a later skeletal/GLTF animation controller can replace the pose generator without rewriting simulation logic.
