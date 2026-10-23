# Poised walk

The authored female arms were nearly straight: lateral skirt clearance extended the hand beyond the intended relaxed-arm reach. The walking stance also held each shoe too long, causing a deep repeated body dip; the hips and shoulders turned opposite to their respective leg and arm motion.

Reuse the existing foot cycle with a shorter support fraction, quieter walking breathing, correctly phased hip/shoulder counter-rotation, and a vertical hand adjustment that preserves the existing soft-elbow reach after garment clearance. Travel speed, cadence, destinations and championship approach speed are unchanged.

The native before/after movies show the same real club walk, front camera, character and lighting, including starts and stops. Stills are taken during that route; they are not identical pose samples. The baseline is the merged PR #43 build. No reference photographs or generated motion are included.

The new regression loads the real authored athlete. Its previous fallback-only audit missed the near-locked elbows. It now checks relaxed elbows, actual limb lengths, leg/hip and opposing-arm/shoulder phase, and bounded head motion at 30/60/120 Hz across the four women. The baseline fails. Existing planted-foot, low-lift, obstacle, start/stop, match approach and replay checks remain.

Rejected: exempting the airborne walking leg from body loading raised shoes above the existing low-step bound. That variant was removed. Reducing lateral hand clearance also reintroduced skirt contact on three women, so it was rejected. Remaining: this is procedural club locomotion; it does not establish an authored runway animation or resolve every social-pose clothing fold.
