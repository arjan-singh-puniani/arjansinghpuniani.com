# Match entry and court integrity

- **Wrong:** tapping Play tennis on a busy court promised a future match but discarded the request. A pedestrian also crossed the service box during a live Championship.
- **Cause:** no queued match state; crowd detours used a new Navigation without the court reservation and could choose temporary waypoints inside the court.
- **Fix:** reuse Play tennis as a cancellable queue, yield an autonomous rally after its next point, and service the request before autonomous bookings. Preserve a lesson already in progress. Crowd detours respect reservations while allowing actual incoming participants onto court.
- **Regression:** the new arrival assertion fails before the queue change; the new crowd-route assertion fails before the navigation change. A stationary blocker must be passed completely without entering the court. Existing 36 opponent entries at 30/60/120 Hz and idle-court shortcuts pass. Correct the pre-existing caption test double to implement classList.toggle, which production HUD already uses.
- **Live result:** in Codex's browser at 1280×720, the old busy-court toast never initiated a match. The updated queue visibly handed an observation rally over to Taylor vs Lucresia without a second Play tap. A separate request was cancelled and remained in the club after the activity ended. Real serve/return/scoring/pause worked; five sampled frames during a subsequent 25-second rally check contained no pedestrian on court. Browser warning/error log was empty. These are live captures, not generated renders.
- **Rejected:** carrying the court restriction into participants' crowd routes delayed one baseline entry. A first escape filter could stall beside a stationary blocker. Both were corrected before retention.
- **Remaining:** bounded runtime sampling cannot establish that every club route is clear. This pass does not improve character assets or prove the overall flagship quality target.
- **Colleague-send:** closer because match entry now honors its promise and court circulation is less disruptive; still no claim of Valve/Rockstar caliber.

Screenshots: [queued request](queued.jpg), [automatic match entry](match-entry.jpg), [live return](live-return.jpg).
