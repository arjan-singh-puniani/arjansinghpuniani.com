# Rally House human and device playtest

No independent human playtest or physical-phone test was collected for this branch. Browser automation, inspected runtime images and deterministic measurements establish correctness within their fixtures. They do not establish pleasure, attachment, acoustic quality or studio-reviewer appeal.

## Unprompted session

Recruit at least three people unfamiliar with Rally House. Record browser/device, input method, speaker/headphone setup, frame setting, reduced-motion preference and prior tennis-game experience. Ask them to explore for one minute, then try a match, then return and inspect a person/object. Do not tell them the intended reaction sequence or explain the new landing cue first. Record time to first meaningful interaction, Challenge discovery, first legal return and voluntary rematch. Capture observed confusion separately from answers.

Ask after play, in this order:

1. What did you think this was when it opened? What changed that impression?
2. Could you see the ball throughout a rally? Where did you lose it?
3. How did you decide where to move and when to swing?
4. Did any reachable-looking ball feel unfair? Show the moment if possible.
5. Did movement, stopping or reversal feel awkward? Did the swing follow your intention?
6. What did a good contact feel and sound like? How did a poor one differ?
7. Why did the last point end? Did the feedback agree with what you saw?
8. Did you choose another point or rematch? Why?
9. What did the club notice? Did you find evidence of something you actually did?
10. Which object invited a click but disappointed you? Which made you want another interaction?
11. Did a person appear to remember something? What was the event?
12. Did you notice sliding, clipping, a missed hand contact or a sudden pose change?
13. Would you show this exact build to a game developer? What would you fix first?

Retain exact answers and examples. Do not convert a contact count into an enjoyment rating. Repeat with the same saved club on another day to verify remembered events remain understandable.

## Physical hardware

Test Safari on a recent iPhone and Chrome on an Android phone, plus desktop Safari/Chromium. Run portrait → landscape → portrait during a rally and after return. Check stick reach, thumb occlusion, Swing placement, accidental scrolling/zooming, browser chrome changes, audio unlock, pause and focus. Run 15 minutes with repeated matches and objects, then background/foreground the tab. Verify old/new saves and same-origin storage behavior. Check that blocked fullscreen still provides the direct-game link. Observe heat, dropped frames and memory using actual device tools where available.

Listen on laptop speakers, phone speakers and headphones. Compare clean/perfect/defensive/frame hits without looking at labels. Check that strings/body do not sound like a UI beep, that ambience recedes during Championship, that footwear is restrained and that repeated sound variants do not fatigue. Current automated peak/cache checks are structural safeguards, not listening approval.

## Authored-motion review

Inspect real-time starts/stops, slow/fast diagonals, reversals, corners and recovery at 30/60/120 Hz where supported. Review serve, forehand, backhand, turn, sit, conversation, spectator gaze and object reach frame by frame. Include furniture and another actor in the view; isolated pose fixtures are insufficient for seating/crowd contact. Reject conspicuous garment seams, hands through the body, inaccurate seating, racket/head intersection or feet skating under load. The current procedural meshes have coarse shoulders/hands and clothing limits; improved authored assets must pass existing contact and planting tests before adoption.

## Acceptance record

| Gate | Current state | Evidence required |
|---|---|---|
| First rally understandable | Automated delayed-cue cases pass | Unprompted players explain movement/swing and achieve a return |
| Movement pleasurable | Continuous and rate-tested | Human starts/stops/reversals without perceived skating or awkward lag |
| Contact satisfying | Physical capture/release, sound cache and visual feedback pass | Listening and play comparison with exact comments |
| Camera/ball excellent | Nine projected court views pass | Real phone tracking and unprompted ball visibility |
| World feels dense and alive | Coherent actions, receipts and truthful result cards | Players notice multiple consequences without explanatory prompting |
| Characters embodied | Proxy and selected visual checks pass | Artist review of moving meshes, seating, props and dense scenes |
| Return to Club reliable | 32 accelerated cycles pass | Extended physical-device play, background/foreground and orientation |
| Portfolio communicates quickly | Real captures, manual scenes, deferred game and Axe pass | Ten-second thesis recall, 30-second transformation recognition, voluntary play |

A bad human/device result calls for another bounded iteration, not a claim that automation already established the intended experience.
