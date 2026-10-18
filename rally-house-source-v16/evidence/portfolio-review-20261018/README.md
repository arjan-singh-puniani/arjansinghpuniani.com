# Portfolio review — October 18, 2026

**Verdict: not yet at the requested “a senior Valve or Rockstar developer would voluntarily share it” standard.** This is an artistic/product assessment, not a conclusion drawn from passing tests.

The before/after game views show that correcting the squat court, oversized racket and obstructed near baseline materially improves readability. Keep those changes. The adult faces, hands and stroke silhouettes still read as procedural mannequins. The dominant remaining visual limitation is the absence of a cohesive authored character-performance asset set. Achieving the intended fidelity needs a sculpted and rigged adult character, authored tennis clips and artistic review of the resulting motion, while retaining the current world and contact registration. Additional shader tuning alone does not resolve that limitation. This is the requested asset/specialist boundary, not a claim that the portfolio goal has been achieved.

## One achievable interaction improvement

Previously, a player had to leave the match and find the Lab to inspect recent motion. **Analyze last swing** now appears after a real contact while that contact remains in the recent-play recording, and in pause/results. It remains accessible during the following rally so an opponent's automatic serve cannot dismiss it just as a player clicks. It releases the match, opens the same recording at its latest racket contact, pauses on the body, and offers quarter-speed playback. The camera and overlay change around the existing club. VectorCourt is one click away.

The first visual iteration opened too wide, making the body hard to inspect. The retained version starts in the body view. Native captures compare the [previous live match](../gait-20261016/chromium/C-gameplay.webp), the [corrected live match](../realism-20261016/chromium/C-gameplay.webp), the [new review invitation](chromium-1440/after-rally.webp), and the [contact inspection](chromium-1440/contact-review.webp). This improves the play → inspect interaction; it does not by itself change the overall portfolio verdict to “yes.”

## Posture defect found by inspecting the replay

The contact view exposed an additional fixable defect: anticipatory body loading and the exact-hand reach solver each lowered the pelvis, allowing an adult stroke to collapse into a seated pose. The upright groundstroke racket also forced the wrist below a low ball. Loading and reach now share one total lowering budget, and a human groundstroke's racket head drops beside the wrist with its rendered handle aligned to the grip-to-head axis. Racket contact and the shared skin/analysis pose remain authoritative. The new six-adult, low-ball forehand/backhand regression fails against the previous solver and passes after this correction, with the minimum pelvis height 0.86 club units and unchanged anatomical segment lengths.

Compare [before the posture correction](before-posture-desktop.webp) with the [retained contact view](chromium-1440/contact-review.webp); the [phone baseline](before-posture-phone.webp) is retained too. This was a procedural-motion defect, not something deferred to new assets.

## Reproduction and evidence limits

`node qa/rally-review.mjs` uses actual browser challenge, movement, serve, attempted return, review and playback controls after a controlled availability/camera fixture. The recorded contact comes from the live solver; no point or contact is manufactured. Reports include successful/missed return attempts, recording identity, exact contact time, body framing and match release. These are automated input playtests, not independent human artistic validation. `QA_WIDTH=390` exercises the portrait layout; `QA_ENGINE` chooses the native browser. Captures are lossless WebP with decoded pixel equality checked during curation.

The final direct-review flow is checked in Chromium desktop and portrait. Earlier three-engine same-world/match checks are in the realism evidence. The new flow's Firefox startup timed out and the installed WebKit runner failed navigation with a protocol/frame error; those runs do not establish cross-browser success for this addition.

Physical motion-capture markers are not required to proceed. Real-person video fitting/retargeting is not implemented; the current analysis measures known simulated motion.
