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

Contact-lens separation eases with a cosine envelope over the contact window. Rendered nodes and joint hit testing share that exact presentation offset; measured angles still use the unshifted solver geometry. On a persisted `pagehide`, lab and spatial selection close without deleting their DOM controls; a discarded page disposes them. Pointer state clears on return, lab pinch/wheel uses its own bounded zoom, and hidden world hover does not run under analysis.

Nearest-sample tolerance is 75ms. Missing gaps hide dependent replay geometry and report no sample. Charts break across gaps rather than drawing a fabricated trajectory. Gaussian court residence uses only the recorded prefix; ball trajectories remain airborne 3D paths and are never projected through a court-plane homography. The heatmap is descriptive root coverage, not foot pressure or force.

The existing game renderer keeps depth testing. The two ceiling pendants cut away during analysis so they cannot hide serve contact; they return in the club. Translucent avatar surfaces reveal the opaque rig without a global x-ray pass. Contact separation is explicitly a presentation offset, never a new measurement. Coverage clears the actual .07-high court surface while remaining below court markings; paths, foot-contact traces and event rings clear both. Left/right footsteps come from captured transitions into a planted constraint, not arbitrary time intervals.

`InteractiveMatchSystem.visibleBallPosition()` is shared by rendering and replay capture. The recorder includes the ball staged at the strings during compression, even while free-flight physics is inactive. Match launch, dwell, hold and contact authority retain their existing values. Missing intervals do not contribute invented distance, stance time or footstep transitions; cadence abstains if a clip has gaps.

Quality gates: `npm test`, `npm run qa:lab`, `npm run release:sync`, portfolio tests/lint/build, shipped match checks and standalone package/import checks. Browser reports and images live under `evidence/performance-lab-20261011`. These checks do not substitute for an actual human playtest or physical phone validation.
