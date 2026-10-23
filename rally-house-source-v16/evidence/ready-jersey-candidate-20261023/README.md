# Ready-stance sleeve candidate

**Offline geometry diagnostics, not game screenshots.** Both images use the actual CPU-skinned character, identical camera and neutral materials; sleeves are blue. Textures and runtime lighting are omitted. They cannot certify in-game naturalness.

Before, the supporting sleeve crosses the torso below the chest. After, the supporting elbow rises toward the existing throat grip and clears that crossing. Hand targets, racket targets and feet remain unchanged. The hitting elbow is unchanged. The club rest/walk pose-and-palette trace matches the baseline exactly.

The focused loaded-jersey regression fails on the previous runtime (141 distant sleeve/torso triangle crossings at Taylor/30 Hz) and passes for all four women at 30/60/120 Hz. Adjacent local shoulder folds are excluded; this is not a complete collision detector. Authored-athlete/contact, replay, phone capture, gait and garment-deformation checks pass.

Rejected: moving both ready elbows disturbed the hitting wrist; a chest-anchor experiment worsened early backhand penetration. Only the supporting-ready-elbow change remains.

**Unresolved:** stroke sleeve/torso intersections and shoulder creasing remain. Live naturalness, transitions and performance need runtime visual evaluation. Browser URL policy blocked access to the live panel; no alternate UI access was attempted. This candidate remains a draft pending that evaluation. No flagship-quality claim.
