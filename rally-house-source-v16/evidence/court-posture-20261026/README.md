# Court start/stop posture

At 4af42d45, changing Taylor from ready to shuffle without advancing time moved the supporting elbow by 0.193398 game units and the head by 0.106246. Starting movement reset the shared ready-posture weight. Stopping mid-stride also discarded planted source feet, which changed the retargeted body's height; restarting during the stop reconstructed an earlier clip instead of the current blended pose.

The retained fix sums both ready/shuffle blend contributions and reuses the existing source-pose snapshot when leaving shuffle or entering it from ready. Two shared expressions change; no new animation state or smoothing system is introduced. Walking and hands-on-hips curves remain unchanged.

The new regression fails on 4af42d45. With the fix, 36 ready/shuffle transitions have zero upper-body landmark and skin-palette jump. Another 54 actual steering stops and immediate restarts at 30/60/120 Hz have zero landmark jump. The original 1,477 stroke-footwork samples retain their contact, toe anchors, heel release and recovery results. Source-pose snapshots remain in pre-retarget coordinates, as in the established walking exit path.

A controlled offline render of emitted geometry confirms that the earlier state change raises the hands and straightens the body while the corrected change preserves their positions. This is an isolated geometry diagnostic, not an in-game appearance or lighting comparison. Browser control remains unavailable; the user has been asked to check live starts/stops. No human acceptance or overall flagship-quality claim is inferred from these checks. Shallow sleeve folds and the broader character rendering gap remain open.

## Follow-up after the user still saw a pop

The zero-time regression above was insufficient: actual steering could leave a support shoe over a unit behind the moving root. Filtered-speed phase advancement delayed the shoe release, the leg-length solver crouched the body to preserve the anchor, and the old swing path then teleported the foot. A captured ready torso also remained behind in world space during the transition.

The follow-up reuses WalkCycle for a separate receiving shuffle, advancing by actual distance and court-travel direction. It seeds from the current shoes, releases the trailing foot first, preserves the receiving hip hinge and carries the source body snapshot with the traveling root. Airborne receiving shoes no longer pull the pelvis down. The approved walking instance and curves remain intact. Merely increasing cadence was rejected because the release still jumped.

A new actual-InteractiveMatchSystem regression covers 72 cast/rate/direction cases with repeated starts, stops and reversal. Maximum head-height range is .047387 units, maximum vertical head speed 2.297277 units/s; 2,616 overlapping support checks retain world anchors. Those bounds catch the reproduced jolt and are not a physiological motion standard. The earlier 36 static/54 moving transition checks still pass. The sampled approved walking/idle hash remains identical. This follow-up awaits a specific human start/stop acceptance; the next user report instead identified the serve.

The accepted Homer take A was also reduced from .45 to .22 gain (~6.2 dB) after the user found it too loud. Asset identity is unchanged; quieter playback still awaits listening acceptance.
