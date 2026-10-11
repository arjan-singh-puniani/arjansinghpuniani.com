# AnatomyMotion capability audit — 11 October 2026

Actual root: `wins/AnatomyMotion`, whose saved Codex project happens to be labeled “Rally House.” It is distinct from HoloAnatomy's portfolio shoulder exhibit. The newest supplied candidate is `AnatomyMotion_0.6_DeviceReady.zip`; extracted source was inspected and tested in an isolated temporary audit copy. Earlier 0.5/0.5.2 projects and archives remain untouched. No root entry point declares a single canonical extracted 0.6 checkout.

Archive SHA-256: `23cfb9181802864b66099b2333a6dc172b650ffd2f4219bca06726392847f568`.

| Capability | Actual source / contract | Evidence / lab use |
|---|---|---|
| Camera and pose adapter | `Capture`, `Pose/AppleVision3DPoseProvider.swift`; Apple Vision joint estimates | Native adapter exists. Camera runtime and physical-device accuracy were not validated here; not running in the browser. |
| Joint kinematics | `Sources/AnatomyMotionCore/KinematicsEngine.swift`; torso-local upper-arm elevation, segment-relative elbow flexion | These geometry conventions inform the TypeScript adaptation. Sparse joints do not resolve scapular motion. |
| Filtering/calibration | `PoseTemporalFilter.swift`, `OneEuroFilter.swift`, `BodyCalibration.swift` | Confidence/provenance, missingness and fixed-length calibration are represented in native core. Browser inputs are deterministic rig landmarks and require no fictitious tracking confidence. |
| Shoulder repetition analysis | `ShoulderMotionLab.swift`, `MovementSegmentation.swift` | Core estimates/quality gates exist; not labeled clinical or forced into a gait diagnosis. |
| Replay | `ReplayTimeline.swift`; timestamped pose/metric/event records → nearest-sample snapshot | Browser timeline adopts the no-gap-bridging rule and one-clock synchronization. |
| Anatomy/muscle knowledge | `AnatomyKnowledge.swift`, `MuscleModel.swift`, `ScientificProvenance.swift` | Educational source catalog, not measured activation or a validated force solver. No activation percentages displayed. |
| Pain/session records | `PainModels.swift`, `SessionModels.swift`, local persistence | User-reported context, not camera diagnosis. Browser lab does not collect pain or health data. |
| Gait/ankle angles | Not the native flagship supported metric surface | Browser gait uses actual animated foot constraints. No toe/heel axis exists, so ankle focus reports landmark height, not dorsiflexion. |

Rechecked today: **77 Swift core tests passed**, including temporal filtering, calibration, shoulder quality, provenance, replay missingness and marker validation. The archive's older validation summary predates this test count. This is software evidence, not a clinical, camera or iPhone performance result.

The browser lab extends simulated geometry with knee flexion, trunk–thigh angle, cadence, average same-foot stride distance and left/right stance percentages. Every one is derived from captured rig samples; none describes a measured human subject.

Primary reference: [Apple's 3D body-pose documentation](https://developer.apple.com/documentation/vision/identifying-3d-human-body-poses-in-images). The native API supplies estimated joints; ground reaction forces and muscle activation require a separate supported measurement/model workflow.
