# Court start/stop posture

At 4af42d45, changing Taylor from ready to shuffle without advancing time moved the supporting elbow by 0.193398 game units and the head by 0.106246. Starting movement reset the shared ready-posture weight. Stopping mid-stride also discarded planted source feet, which changed the retargeted body's height; restarting during the stop reconstructed an earlier clip instead of the current blended pose.

The retained fix sums both ready/shuffle blend contributions and reuses the existing source-pose snapshot when leaving shuffle or entering it from ready. Two shared expressions change; no new animation state or smoothing system is introduced. Walking and hands-on-hips curves remain unchanged.

The new regression fails on 4af42d45. With the fix, 36 ready/shuffle transitions have zero upper-body landmark and skin-palette jump. Another 54 actual steering stops and immediate restarts at 30/60/120 Hz have zero landmark jump. The original 1,477 stroke-footwork samples retain their contact, toe anchors, heel release and recovery results. Source-pose snapshots remain in pre-retarget coordinates, as in the established walking exit path.

A controlled offline render of emitted geometry confirms that the earlier state change raises the hands and straightens the body while the corrected change preserves their positions. This is an isolated geometry diagnostic, not an in-game appearance or lighting comparison. Browser control remains unavailable; the user has been asked to check live starts/stops. No human acceptance or overall flagship-quality claim is inferred from these checks. Shallow sleeve folds and the broader character rendering gap remain open.
