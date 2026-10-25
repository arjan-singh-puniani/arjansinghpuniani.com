# Groundstroke foot release

Before: both shoes remained flat and forward-facing while the torso unwound; the outside ankle lock persisted into follow-through. The user described the feet as unnaturally planted.

After: the shared human groundstroke pose retains flat loading/contact, releases the outside lock after contact, lifts and turns the heel around the toe, then takes a short recovery step and emits one landing event. The visible shoe rig and recorded rig use the same pitch/yaw and ankle trajectory. Forehand and backhand use opposite outside feet. The user refreshed the running game and reported **“More natural through the shot.”**

The new stroke-footwork regression fails on baseline 0cfe1eb6 because the shoes never release or turn, and passes on the candidate. It checks all six cast identities at 30/60/120 Hz, toe stability, support/impact timing, rendered shoe floor clearance, exact racket contact, recovery footfall ownership and ready return. Existing gait, rest stance, authored body/contact, garment/jersey, arm anatomy, replay, court sound and interactive match checks pass. Taylor walking and hands-on-hips landmarks match baseline exactly in the recorded comparison. Stroke torso, head, arm and pelvis landmarks also match baseline exactly.

Rejected: applying ankle motion before the body-height solve changed the upper-body contact calibration and reintroduced forehand sleeve/jersey intersections. Foot release now happens after that solve; the existing jersey intersection regression passes.

No new reference footage was required. Side and rear three-quarter full-body clips including setup, contact and recovery would help match an individual playing style. This remains a compact procedural motion, not captured biomechanics. The toe lever is fitted to the existing shoe. Loaded-stroke garment intersections remain outside this footwork fix. No fresh live-browser performance measurement or flagship-quality claim.
