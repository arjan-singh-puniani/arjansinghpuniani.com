# VectorCourt capability audit — 11 October 2026

Authority: the real `wins/Vector Court/START_HERE.md` identifies `VectorCourtProject_VisionResearchV7` as the active engineering candidate. Earlier app, annotation, clamp, research and private footage folders remain preserved. This audit does not copy private footage into Rally House or treat the portfolio's separate Vector Tennis game as VectorCourt.

| Capability | Actual source and input/output | Evidence / public treatment |
|---|---|---|
| Court calibration | `Geometry/Homography.swift`, `CourtCalibration.swift`; normalized image landmarks → court-plane points and propagated covariance | Software geometry is tested. Only supported contact/bounce points may be mapped; airborne ball positions are not ground positions. |
| Ball tracking | `Vision/BallDetector.swift`, `WASBTemporalBallDetector.swift`, `Tracking/BallTracker.swift`; image observations → timestamped track with observed/predicted provenance | Experimental fallback; production guide reports no bundled trained tennis-specific model or frozen held-out accuracy report. |
| Bounce/shot candidates | `BounceDetection/BounceDetector.swift`, `Analysis/SessionAnalyzer.swift`, `ShotClassification/ShotClassifier.swift` | Heuristic events and confidence; no officiating/accuracy claim. |
| Court display | `Rendering/CourtRendererView.swift`; mapped shot/bounce points and player trajectories | Reusable court-registration and provenance principles. Browser lab uses known simulation positions, not this native CV pipeline. |
| Target estimates | `ShotClassification/TargetProbability.swift`; shot events/uncertainty → weighted descriptive success estimates | Experimental ranking, not a promise of future success. Not exposed as a measured lab product capability. |
| Player identity | `Tracking/PlayerTracker.swift`; bounding-box tracks | Not a body pose estimator or racket tracker. `production/PERSONAL_SHOT_ANALYSIS.md` explicitly calls pose and racket analysis planned work. |
| Annotation/evaluation | `tools/annotation_studio_macos`, `tools/evaluation` | Ground-truth tooling and session-separated evaluator, not proof of field accuracy. |
| Hardware | FenceBridge Beta2 and TheMakery qualification coupons | Physical contact/optical gates remain open; no mount qualification claimed. |

Rechecked today: **35 Swift core tests and 28 Python tests passed**. No native app source was changed. Native capture, physical iPhone throughput, training, frozen held-out accuracy and mount testing were not performed in this browser integration pass.

Browser adaptation: VectorCourt mode shows court-registered **game** root movement, Gaussian residence coverage, observed-in-simulation ball paths, player racket contact markers and actual bounce callbacks. Club units remain distinct from VectorCourt's real meter coordinate system. No homography, camera import or CV inference runs in the web lab.

Source hashes: `evidence/performance-lab-20261011/capability-source-manifests.json`.
