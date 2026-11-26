# Rally House motion pass — 23 November 2026

Local preview: http://127.0.0.1:18132/  
Matched comparison: http://127.0.0.1:18132/evidence/motion-direction-20261123/comparison.html  
Branch: `feature/rally-house-motion-20261123`  
Baseline / production: `382163c1896e1447c6534c1f4baea1f62c8138b5`. No deployment or merge performed.

## Accepted changes

1. **Arjan steps during moving groundstrokes.** `Character.ts` continues the existing world-space shuffle cycle during forehands/backhands. `TaylorBody.ts` applies those feet after the calibrated upper-body/contact solve and resolves the knees against them. A state-exit blend preserves the current shoes before settling into ready. Stationary shots retain their existing toe pivots and approved serves retain their motion.
2. **Preparation loads more continuously.** The old loading target subtracted the rotating preparation racket from a future contact point, making the body chase a target unrelated to the actual hand. Early Arjan groundstroke loading now approaches the actual hand path. A smooth blend restores the original solve before the earliest contact window, preserving dwell and release. In the fixed 60 Hz fixture, maximum per-frame head displacement fell from 0.120391 to 0.067352 units for forehand (44% reduction), and from 0.078806 to 0.062597 for backhand (21%). These measure that fixture, not every possible rally.
3. **Coherent split step.** The old source-pose hop lifted the torso but omitted hip joints and then lost shoe lift to planted-foot overrides. A small eased translation now lifts the completed body, hands, racket and shoes together, preserving their relative geometry. Movement delay, root motion and input timing are unchanged.

The changes use the existing procedural pose and two-bone IK system. No new animation assets, dependencies, menus, effects or gameplay mechanics were introduced. Code comments explain the contact/foot-placement ordering.

## Evidence and verification

- Five main controlled scenarios: footwork/split/reversal, planted forehand, planted backhand, running forehand/backhand, serve. Identical 60 Hz inputs and fixed three-quarter camera; normal-speed and quarter-speed playback; timestamp-matched frame comparisons. Desktop Chromium 1200×900; desktop WebKit at 402×874. A sixth, emergency-volley study is captured separately in desktop Chromium and remains unchanged. Portrait study camera is pulled back in the QA harness to keep the complete athlete visible; production camera code is untouched.
- Independent real-browser play in Chromium and WebKit: pointer-driven drive and lob returns, pause, recent-play Analyze Swing entry, playback, selectable serve phases, scrubbing, portrait layout, exit and immediate keyboard movement. No page or console errors. `live-*/report.json` records the assertions. The study clips are controlled replay fixtures; the live recordings are genuine automated matches and are not synchronized before/after matches.
- **Exact gameplay preservation:** 12 deterministic points (drive/lob against Leo/Mika at 30/60/120 Hz), 19,854 sampled frames, 187 contacts. Before/after JSON traces are exactly equal: both character roots, ball positions/velocities, active state, cues, contact frames, qualities, shot type and outcomes. Full traces are compressed alongside `physics-comparison.json`.
- The complete existing test command passed during iteration (68 test scripts including the new regression). After the final changes, nine directly affected suites were rerun successfully: motion direction, court footwork, stroke footwork, stroke sequence, replay deformation, arm anatomy, Arjan shorts, upper body and neck attachment. See `tests.log` and `final-tests.json`.
- New regression fails on the baseline's 0.120391-unit forehand head jump and passes on the new build. It checks coherent split-step translation, 156 running-shot support-anchor comparisons, 272 airborne-foot samples, floor clearance, flat recovery shoes and zero-time stop continuity at 30/60/120 Hz. Largest measured leg scale in those samples: 1.03394 (3.4% above nominal).
- Existing replay deformation coverage: 210,600 deformed-vertex samples; maximum endpoint jump about 3.7e-7. Stationary contact continuity and exact contact remain within existing tolerances. Source/public release synchronization passes for all 133 artifacts.

## Rejected experiments

Applying the loading correction throughout contact/release or broadly to the other fitted rigs changed full-rally traces despite passing single-contact tests. Those versions were removed. Wider recovery-foot landing targets caused body-height jolts in ordinary court movement and were also removed. Final accepted traces match the baseline exactly.

## Remaining limits

- Reversal steps can still crowd or cross; the existing stepping model is not a full athletic foot-placement planner.
- Hips and chest remain closely coupled. Broad rotation choreography was deferred to protect the successful racket path and timing.
- Some low, moving reaches still look stylized and lean backward; the existing body constraint solve remains in the protected contact/release interval. This pass reduces the reproduced preparation pop rather than claiming every stroke is physically natural.
- Running-foot changes apply to Arjan. Other rigs keep their existing calibration; expanding the correction needs their own matched visual/kinematic checks.
- A small amount of leg extension remains (3.4% in the new fixture); this is not a rigid-length biomechanical simulation.
- No physical iPhone test, heat or battery measurement, new external playtest, motion capture or athlete-derived animation. Browser captures cannot prove performance on a phone.

## Reproduction

Run `npm test`, or `node tests/motion-direction.mjs` after building. `QA_RUNTIME` can point that regression and `qa/motion-physics-trace.mjs` to a baseline tree with `dist` and assets. The trace script writes raw JSON; equality is checked before compressing the deliverables.

`qa/motion-direction.mjs LABEL BASE OUTPUT` captures the studies; `QA_MOBILE=1 QA_ENGINE=webkit` selects the portrait browser study, and `QA_RUNTIME` routes compiled modules from the baseline. `QA_VIDEO=1 node qa/tester-readiness.mjs BASE OUTPUT ENGINE` records genuine play. Original PNG captures are retained locally at `/private/tmp/rally-motion-original-captures`; the comparison uses smaller JPEG copies. Video startup/capture overhead varies, so use matched stills for exact phase comparison.

Performance results are recorded separately in `performance.json`; see the final measurement note below.

## Final frame-pacing measurements

Apple M2 Mac; native Metal Chromium and desktop WebKit. Two 15-second active-play samples per build per browser, ordered before/after/after/before, after warm-up. No video capture or test-suite workload during the samples. Every accepted run recorded 10–12 contacts. Rallies and sampled match phase vary with browser scheduling, so the internal CPU/heap snapshots are contextual rather than a controlled CPU benchmark.

| Browser / viewport | Before p50 / p95 | After p50 / p95 | Frames >50 ms |
|---|---|---|---|
| chromium / 1200×900 | 16.7 / 16.7–16.7 ms | 16.7 / 16.7–16.8 ms | 0 |
| webkit / 402×874 | 17.0 / 19.0–20.0 ms | 17.0 / 19.0–20.0 ms | 0 |

No frame-pacing regression was detected in these short samples. This does not establish sustained phone performance or absence of rare stalls. Chromium end-of-sample reported heap values overlap between builds; WebKit supplies no heap value. No long-session leak, heat or battery claim is made.
An initial harness run was discarded because it failed to queue some opening serves, leaving unmatched idle samples. The final harness retries serve input and rejects samples with fewer than five contacts.
