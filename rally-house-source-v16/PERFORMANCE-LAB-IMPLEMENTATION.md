# Performance Lab implementation

| Owner | Responsibility |
|---|---|
| `Character.analysisPose()` | Detached world-space landmarks from the authoritative animation/contact solver; no gameplay pose mutation |
| `analysis/MotionCapture.ts` | Detached render/bone snapshots, 360-sample recorder, event flags, nearest timestamp timeline, joint angles and gait summaries |
| `analysis/LabDemonstrations.ts` | Isolated actual Character/Navigation/BallPhysics solvers generate one walk, forehand and serve; demo paths explicitly authored |
| `analysis/PerformanceLab.ts` | Single replay owner, UI, chart, camera framing, registered overlays, root residence coverage, trails, joint focus, lifecycle |
| `world/PerformanceStation.ts` | Object identity, real pick box, approach contact and material-specific instrument meshes |
| `Game.ts` | Contact/bounce callbacks, fixed-step capture, embodied station entry, exclusive lab input/rendering and live simulation freeze |
| `lab.css` | Desktop side instrument, compact scrollable phone instrument, 44px controls and shared transport |

Championship retains its selected heavy contact tuning, movement, input buffer, ball authority, opponent logic, audio and camera impulse. Only confirmed **player** contact callbacks mark the player's captured racket; opponent contact is not falsely drawn at the player's hand. Bounces come from actual physics callbacks. Capture is transient, local, bounded and absent from saved clubs/network requests.

Render items clone their vector transforms and skin bone matrices; geometry remains shared immutable data. Replay never drives live actor transforms. The viewer releases clip maps, cached meshes, focus references and timeline on close. One persistent DOM layer/listener set is reused, not recreated on each visit. Capture remains available until the next Championship resets it.

Slow contact changes replay speed without shifting the rig. The default overlay has zero offset at every sample. The explicitly selected Separate rig view uses a fixed .85-unit offset; rendered nodes and joint hit testing share it, while measured angles always use the captured solver geometry. Opening the lab restores registration. On a persisted `pagehide`, lab and spatial selection close without deleting their DOM controls; a discarded page disposes them. Pointer state clears on return, lab pinch/wheel uses its own bounded zoom, and hidden world hover does not run under analysis.

Nearest-sample tolerance is 75ms. Missing gaps hide dependent replay geometry and report no sample. Charts break across gaps rather than drawing a fabricated trajectory. Gaussian court residence uses only the recorded prefix; ball trajectories remain airborne 3D paths and are never projected through a court-plane homography. The heatmap is descriptive root coverage, not foot pressure or force.

World and avatar surfaces retain depth testing and their captured opacity. Only explicitly tagged analysis rods, joint nodes and angle arcs enter a final annotation pass with depth testing temporarily disabled; it is restored immediately afterward. They cast no shadows and do not move joint coordinates. The two ceiling pendants cut away during analysis so they cannot hide serve contact; they return in the club. Coverage clears the actual .07-high court surface while remaining below court markings; paths, foot-contact traces and event rings clear both. Left/right footsteps come from captured transitions into a planted constraint, not arbitrary time intervals.

Human limb and shirt surfaces use denser, smoothly tapered cross-sections. Human limb weights confine child-bone influence to the final quarter near a joint, preserving the main segment volume. Shared elbow, knee and waist endpoint rings keep matching positions and effective weights. Taylor's authored head, dress, limbs and gameplay solver are preserved. `tests/rig-registration.mjs` skins the actual emitted triangle vertices and checks ring centres against captured landmarks, rather than merely comparing two copies of a skeleton.

`InteractiveMatchSystem.visibleBallPosition()` is shared by rendering and replay capture. The recorder includes the ball staged at the strings during compression, even while free-flight physics is inactive. Match launch, dwell, hold and contact authority retain their existing values. Missing intervals do not contribute invented distance, stance time or footstep transitions; cadence abstains if a clip has gaps.

Quality gates: `npm test`, `npm run qa:lab`, `npm run release:sync`, portfolio tests/lint/build, shipped match checks and standalone package/import checks. Browser reports and images live under `evidence/performance-lab-20261011`. These checks do not substitute for an actual human playtest or physical phone validation.
