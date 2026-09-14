# Everyday life — v14

The four members have different ways of occupying the same club. June gets absorbed in technical notes and forgets her tea. Mika rehearses small things and negotiates with her own perfectionism. Leo investigates equipment and treats small disagreements as friendly competition. Nia notices preferences and has a dry answer ready, but her care shows up in what she does.

## What changed from v13

v13 varied who shared a break. The physical activity and its one-line response were still largely interchangeable. v14 adds short authored scenes whose availability and later variants depend on world state, reservations and completed history. They run through the existing activity architecture; this is not a replacement simulation or a linear campaign.

Each scene has a destination, participants, timed beats, optional props, hand gestures, expressions, actual pauses and a completion memory. A beat can be silent. People must arrive before performing it. Only one foreground everyday scene runs at once, while tennis and other unreserved activity can continue.

## Recognizable rituals and pairings

| People | Repeated behavior / exchange | Consequence |
|---|---|---|
| June | Writes one more note instead of taking tea | Unlocks Nia's cold-tea follow-up after completion |
| Mika | Rehearses split/turn/set, then tries again | A retained everyday memory; no fabricated coaching skill gain |
| Leo | Inspects a grip, considers changing it, keeps it | Later visits acknowledge that he checked before |
| Nia | Makes time for the spare cup | Her scene establishes a habit of anticipating company |
| June + Mika | June notices a calm reset | Pair history records support rather than an invented tennis result |
| June + Leo | Equipment advice turns into footwork advice | Later conversation recalls their previous exchange |
| June + Nia | Forgotten tea, later the last cup | A completed solo routine creates an eligible relationship scene |
| Mika + Leo | Discuss the actual score; negotiate room on a bench | Score dialogue consumes a specific match ID; a built bench records visits |
| Mika + Nia | Learn, then remember extra foam | Completed prior visits select the familiar version |
| Leo + Nia | Debate whether a bonsai has a favorite player | A later visit acknowledges the earlier exchange |

Rain and closing time make additional scenes eligible. The scene catalog has 13 possible scene IDs, including conditional follow-ups. It is intentionally small. These are authored performances with systemic selection, not generated dialogue or a general social reasoning model.

## Execution contract

`EverydayLife` chooses among currently available people. Novelty, recent participants, completion counts, cooldowns, pending follow-ups, actual match history, weather and time influence selection. Failed starts back off. Ordinary circulation routes around the playing area; players leaving court take an exit route before joining club circulation. Normal repetition cooldown is 220 simulation seconds, with at least 12 seconds of breathing room after completion.

`Game` owns travel, resource reservation and beat execution. An everyday activity has the existing traveling → starting → active → resolving → completed phases. Timeout, unreachable approach, missing built object or separation cancels it without a completed memory. People following ordinary schedules can wait beside an occupied conversation spot rather than walking into its reserved approach; this is lightweight destination courtesy, not full crowd collision avoidance.

Long rallies can draw an off-court scene's attention. A rain change can interrupt an active scene. The scene holds its reservation, pauses for four simulation seconds, looks toward the source, then resumes the interrupted beat. These interruptions neither cancel the tennis activity nor grant a social reward. One such interruption is allowed per scene, preventing continual restarts.

## Acting and presentation

The existing skinned characters, clothes, lighting and tennis motion remain. Social hand targets ease over 0.24 seconds and only apply outside shots, walking and shuffling. Added gestures: shrug, point, inspect, offer, think, nod and a small laugh. Cups and notebooks attach to hands. Rackets are stowed for appropriate scenes and while drinking.

Speech follows its speaker and is clamped to the viewport. Everyday speech uses the simulation beat, so pausing the game does not advance the exchange. A small optional “Happening now” button focuses the current scene only when clicked. It disappears while a build, context or book panel is open. The main HUD describes the time of day and actual court activity or rematch intention; optional daily-intention counts remain in the Club Book. Autonomous scenes never take the camera or stop decorating.

## Persistence and pacing

Schema 6 stores completed scene receipts, counts, cooldowns, pending follow-ups, consumed match ID and the scene-ID sequence. Receipts are bounded to 32. Active scenes reset on reload; props, waiting positions and beat indices are transient. No partial-scene award is given. Malformed everyday state prevents startup rather than silently overwriting storage.

At 1×, the game now advances one in-game minute per simulation second. This lets a ten-minute visit cover morning through evening instead of rushing into a long inactive night. The existing 0.5×/1×/2× controls remain.

## Limits worth preserving in the design discussion

A well-timed authored exchange can be entertaining; event counts do not demonstrate that people enjoy it. These scenes need human testing for readability, repetition and affection. Prop interactions are stylized and do not constitute inventory simulation. Some legacy static poses and close seating need further visual work. Real-device performance remains a separate acceptance gate.

## Slow rendering and background tabs

The visible simulation can catch up through at most two seconds of fixed steps after a stall. Hidden-tab time is excluded and the accumulator resets on visibility changes. Adaptive visuals reduce only pixel resolution when frame delivery is consistently slow; scene geometry, lighting and shadows remain. Full detail is available in settings. This mitigates stalls, but does not make low-frame-rate motion as readable as fluid rendering or certify device performance.
