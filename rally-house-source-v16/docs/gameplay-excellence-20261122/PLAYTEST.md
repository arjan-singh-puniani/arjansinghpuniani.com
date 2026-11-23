# Uncoached ten-minute playtest

## Status

Arjan can arrange 3–5 people who have never played Rally House. No participant results have been collected. Run each person separately on a fresh preview save. Do not give them the mechanic matrix or the intended findings before play.

## Participant instruction — read only this

“Please open this game and spend about ten minutes with it as you normally would. You can choose what to do. I’m observing the game, not testing you. If something is unclear, do what seems natural. You can stop whenever you want.”

At ten minutes: “That is all the time I needed. You may stop or keep playing, whichever you prefer.”

Do not demonstrate controls, tell them to lob, suggest a rematch, praise intended actions, or explain an opponent. If a blocker requires assistance, record the exact time and help given; subsequent completion is assisted. Ask permission before recording screen/audio. Use anonymous IDs; do not collect personal information unnecessary to the test.

## Observer sheet (one copy per participant)

- Participant ID / date / build commit:
- Device, browser, orientation, input method:
- Prior tennis/game experience (ask after play):
- Start timestamp:
- First match entered:
- First successful rally (one return by each side after serve):
- First deliberate different shot choice, if any:
- Match completed / time:
- Voluntary rematches (exclude instructions/automation):
- Voluntary club interaction / what happened:
- Continued after required period? Minutes:
- Stopped early? Observed reason / participant’s own words:

| Time | Observable action or exact words | Game state / clip reference | Interpretation (after session) | Assistance given |
|---|---|---|---|---|
| | | | | |

Track every apparent failed command, confusing cue, unreachable ball, accidental button, camera occlusion, freeze and sound interruption. Record what happened before explaining why. Do not label every miss a bug.

## Neutral questions after play

1. What did you enjoy, if anything? What did you dislike?
2. Tell me about a point or moment you remember.
3. What did you think your controls did? Was anything unexpected?
4. How did you decide where or how to hit?
5. What, if anything, seemed different about the people you played?
6. What would you choose to do next? Why?
7. How did the sounds feel during play? Anything you would change?

After this uncoached portion, ask them to compare a few gentle and stronger contacts at the same comfortable volume. Record descriptions before revealing which mix was intended. Headphones and phone speakers are separate conditions, not interchangeable results.

## Provisional targets, not results

- Most first-time participants complete a first rally within 90 seconds.
- Zero major unexplained control failures in the cohort.
- At least two tactically distinct return choices are demonstrated.
- Opponent-style differences are noticed without explanation.
- A majority voluntarily starts another match after the introductory match.

With 3–5 people, report counts (e.g. 3/5), raw times and incidents, not broad population claims. A missed target is a reason to inspect video and revise a hypothesis. Re-test with fresh participants after an onboarding change.

## Physical iPhone follow-up (separate from first-time session)

On the user’s iPhone, test Safari and Chrome separately. Record the actual model/OS, starting battery, brightness, volume, case, charging state, ambient conditions and refresh time. Use consistent settings and no screen recording for the battery comparison; recording changes load. Run 20–30 minutes of normal matches, replays, club returns and avatar switching. Note battery at 0/10/20/30 minutes, frame pacing if Web Inspector is available, perceived warmth and any thermal warning, audio distortion/dropouts and unintended touch cancellations. Do not invent temperature from touch or equate Mac WebKit performance with the phone. Stop if the device warns or becomes uncomfortable. Repeat against baseline under comparable conditions before attributing battery change to this slice.

## Triage and release

Control lockout, save loss, broken contact, unreadable ball or a reproducible major frame-pacing regression blocks release. Prioritize observed incidents by severity and frequency. Cosmetic preference is recorded separately. Keep preview/production storage separate (new schema 12). Export a valued save before manually moving it between builds. No automatic production deployment from a playtest result.
