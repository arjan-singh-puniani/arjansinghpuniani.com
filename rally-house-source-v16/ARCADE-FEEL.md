# Championship arcade feel — 4 October 2026

The Championship player now moves at up to 7.72 court units/second, compared with 3.40 before. Acceleration, reversal and braking are sharper. Movement remains frame-rate independent and continues through swings, with a short plant and a forward contact boundary so the body cannot run through the ball.

Swing input buffers for 1.1 seconds instead of 0.62. Perfect/clean timing tolerances are wider. Intentions are checked before advancing ball physics, removing a frame of late-input loss. A close late ball uses a quicker volley. Valid returns remain playable instead of being punished with random frame errors. Physical string-bed proximity remains the authority for strike effects and ball release. Early buffered input immediately shows READY TO RETURN.

Championship-only swings use 70% of the previous preparation time and 72% of the previous duration. Point pauses are 1.05 seconds instead of 2.2. Clean/perfect balls travel slightly faster along the existing safe arcs. Left/right steering aims the outgoing ball while neutral input gives a forgiving return.

At actual contact, the racket retains its string compression and vibration, impact sound is stronger, the camera pulse is firmer, and a brief five-particle string-bed spray joins the existing contact rings. The HUD acknowledges NICE RETURN or SWEET SPOT. Reduced motion removes sparks and camera pulses. Club walking and swing timing remain unchanged, and exiting restores the player/opponent speed settings.

## Validation

- Baseline full npm test passed.
- Full suite passed after movement/contact tuning, including contact interception at 30, 60 and 120 Hz, legal shot arcs, saves, camera restoration and spatial UI regressions.
- New arcade-feel regressions cover movement/reversal/braking at three rates, intentional presses from 920 ms early to 40 ms late, live string-bed contact, directional shot aiming, and unchanged club timing after exit.
- Final queued-input acknowledgement change passed compilation plus arcade-feel and contact-interception regressions.
- Real browser keyboard and genuine touchscreen steering/swing rallies each produced a serve plus three successful early-input returns, with no injected points and no console/page errors. Both returned to club with speed restored.
- Keyboard travel in 250 ms: 1.66 units. Touch-stick travel in 250 ms: 1.84 units. Pure fixed-step travel in 350 ms: 2.43–2.47 units across frame rates.
- The earlier studio steering test assumed movement could not reach a sideline in 800 ms. Its assertion now explicitly accepts reaching the real sideline while still rejecting pauses on open court.

Browser evidence: qa/arcade-feel/results.json and desktop/touch rally screenshots. Tests: tests/arcade-feel.mjs. Full log: qa/arcade-feel/final-tests.log.

Source and served output are synced with before-hash checks. The current source and exact served files were backed up in Arcade-Feel-Backup-20261004 under the RallyHouse workspace. No save schema or dependencies changed. Satisfaction and audio taste still require human play; automated rallies establish input, contact and restoration behavior.
