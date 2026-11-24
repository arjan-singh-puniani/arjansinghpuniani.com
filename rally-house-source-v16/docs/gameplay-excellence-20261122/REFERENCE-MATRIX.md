# Reference principles and decisions

Sources are primary descriptions, not copied assets. Costs are relative to this codebase (S: localized; M: multiple connected systems; L: new subsystem). Measurements below are hypotheses/targets unless RESULTS explicitly records an observation.

| Reference mechanic | Function / why satisfying | Rally House adaptation | Decision / cost | Risk | Measurement |
|---|---|---|---|---|---|
| Mario Tennis: topspin, flat, slice, lob and drop have different uses [1] | Shot choice changes an opponent’s available space/time | Keep direct return; add one high/deep lob, wider safety margin and slower flight | BUILD / M | Lob could dominate or feel cosmetic | Both contact reliably; measured height/time/depth differ; testers choose both for a reason |
| Mario Tennis: charging improves power but restricts movement; timing has risk [2] | Readable commitment creates a decision | Preserve buffered aim and meaningful contact quality; avoid adding a charge meter now | BUILD existing / S; charge DEFER / M | Too much forgiveness removes positioning | Moving beats stationary policy in traces; record unexplained misses |
| Mario Tennis: watch opponent positioning; Simple Rules is available [1] | Readable competitive positioning without mandatory spectacle | Forward pressure vs deep retrieval; restrained cues, no energy economy | BUILD / M | Names differ but behavior feels identical | Trace court depth/recovery; unprompted player descriptions |
| The Sims: context-sensitive short desires and longer aspirations [3] | Goals connect present actions to a character’s continuing story | Real match result changes one opponent’s motives, practice/reflection, then rematch | BUILD / M | Decorative lines without consequences | Save/reload, actual travel/animation/scene completion and one pending follow-up |
| The Sims: selectable aspirations and visible progress [3] | Players choose what to pursue and see consequences | Reuse challenge, existing practice/build activities; optional post-match club objective | BUILD existing / S; campaign DEFER / L | Forced checklist competes with play | Voluntary interaction and remembered event during ten minutes |
| Valve: design hypotheses, observation and iteration [4] | Behavior exposes confusion that creators miss | Neutral ten-minute sessions, timestamped observations separate from interpretation | BUILD protocol / S | Coaching or leading questions invalidate conclusions | First rally, missed-control incidents, voluntary rematch and continuation |
| Valve: combine observation with telemetry [4] | Quantitative patterns point to moments worth watching | Input/contact/AI traces plus browser captures, not a synthetic “fun score” | BUILD / M | Automated success mistaken for enjoyment | Cross-reference incidents with video; report cohort counts, not invented percentages |
| Extra shot variants and spin | Could add tactical depth | Slice/drop/aggressive-drive controls only if two-shot play proves insufficient | DEFER / M–L | Clutter, unreliable mobile mapping | Repeated tester requests or a demonstrated missing counter |
| Continuous perfect interception / unlimited dialogue | Easy implementation can conceal weak systems | Periodic reads, bounded memory, authored scenes | REJECT | Unfair AI / incoherent stories | Trace bounded motion; persistence and reservation checks |
| Borrowed recognizable voices or assets | Recognition is not original game quality | Remove unverified TV recording; use procedural feedback | REJECT borrowed sample / S | Distribution permission and inconsistent tone | Source/public asset parity and manifest audit |
| More dramatic effects | Could strengthen a genuinely earned moment | Existing original impact cues; lob has a softer high-frequency mix and smaller camera response | EXPERIMENT tuning / S | Masked ball, fatigue, sensory overload | Reduced-motion checks, ball visibility, unprimed audio comparison |

[1] [Nintendo — Mario Tennis Aces gameplay](https://www.nintendo.com/en-gb/games/oms/mario-tennis-aces/gameplay/?a=gameplay): shot variety, positioning, energy options and Simple Rules.

[2] [Nintendo — tips and tricks](https://play.nintendo.com/news-tips/tips-tricks/mario-tennis-aces-tips-tricks/): charge commitment/cancellation and timing.

[3] [EA / Maxis, SimGuruGrant — Whims, Aspirations and Goals](https://www.ea.com/games/the-sims/the-sims-4/news/whims-aspirations-goals): contextual goals, longer aspirations, feedback and player choice.

[4] [Valve, Mike Ambinder — Valve’s Approach to Playtesting, GDC 2009](https://cdn.fastly.steamstatic.com/apps/valve/2009/GDC2009_ValvesApproachToPlaytesting.pdf): iterative hypotheses, unobtrusive observation, neutral follow-up, bias and multiple evidence types. Listed on [Valve’s publications page](https://www.valvesoftware.com/en/publications).

## Priority and investment gates

1. Contact/intent correctness: fixed opponent-dependent player scatter; preserve buffered contact. Any observed unexplained control failure blocks release.
2. Tactical minimum: direct return + lob, two opponent styles. Tune only from trace/video evidence; do not add more buttons until this choice is understood.
3. Sensory clarity: compare contact sound strength, high ball visibility and touch layout. Keep reduced-motion/mute reliable.
4. Living consequence: bounded championship memories, practice/reflection and rematch. Expand only if players notice a story arising from their match.
5. First ten minutes: existing immediate Play, readable serve cue, brief Lob suggestion after a return, optional club follow-up. No long tutorial.
6. Release gate: relevant regressions, browser/mobile captures and soak, then physical phone and uncoached sessions. Fix observed failures, retest changed paths, authorize production only after reviewing evidence.
