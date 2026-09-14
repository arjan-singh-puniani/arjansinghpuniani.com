# Aliveness pass — v13

The v12 build already solved the most important causal problems: activities have ownership, rewards happen after completion, coaching requires real practice, matches create future intentions, and player-built objects retain history. v13 deliberately does not replace that architecture.

The aliveness pass changes one repeated pattern: autonomous social use was anchored almost entirely on Nia. `AmbientSocialPlanner` now considers all four core members when they are free. It scores relationship warmth, existing favorite places, underused objects, character preference, deterministic variety, and recent-pair repetition. The chosen pair still enters the same `ActivitySystem`, so travel, reservations, completion, save safety, and interruption rules remain intact.

Repeated use can promote a placed object into a favorite spot for any character. That is recorded in object history and surfaced as a club memory. Dialogue also reflects the place: Mika comments on a court-view bench, Leo notices plants, June notices lighting, and competitive Mika/Leo pairs can foreshadow another court challenge.

The objective is not constant activity. Quiet periods remain. The target is that when the player watches the club, small behaviors look attributable to who the characters are, what they remember, and what the player built.

## Verification

- TypeScript build: pass
- inherited simulation checks: 44 pass
- causal/persistence/aliveness checks: 22 pass
- static HTTP serve: pass
- v13 WebGL screenshot verification: not certified in this container; system Chromium failed GPU/EGL initialization.
