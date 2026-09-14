# Character mind — v15

CharacterMind owns six hidden, bounded values for June, Mika, Leo and Nia: energy, confidence, social appetite, practice drive, comfort and emotional tone. These are autonomous choice inputs, never bars the player must refill. There is no offline depletion or punishment for leaving.

Game samples activity once per simulation second. Walking and practice cost some energy; restful activities recover it. Social appetite falls during company and grows gradually while alone. Confidence, comfort and tone drift gently toward personality baselines. Actual completed lessons, matches and everyday activities add their own consequences. Starting an activity never grants its outcome.

## How a choice becomes action

The existing director gathers authored EverydayLife scenes and SceneGrammar candidates. CharacterMind ranks eligible opportunities using named factors: personality, state, relationship, schedule, intention, recent event, favorite, weather, time, culture and proximity. Recent family, pair, place and motif apply finite penalties. Busy people, reserved resources and absent objects are excluded before selection. Game and ActivitySystem still own travel, performance, interruption and completion.

June favors reflection, advice and watching. Mika favors rehearsal and asking for help; low confidence lowers her willingness to challenge. Leo favors gear and competition, and can redirect toward recovery practice. Nia favors care and shared time. The model is deterministic; it does not replace intention with random wandering. Authored activities, scheduled movement, object visits and explicit lessons retain their existing directors, so not every action uses exactly the same scoring function.

Debug mode (`?debug=1`) exposes `window.__rh.report().mind` and the Game mind's chosen/top candidate factor breakdowns. Raw state and scores are not normal player UI. The Club Book describes a mood, current intention, favorite and meaningful memory in prose.

## Causal memory

Completion records carry stable event/receipt IDs. Witness eligibility requires distance of at most 7.5 world units, a clear navigation segment and available attention. A member deliberately watching a match can witness its result. Committed unrelated activities are not interrupted to manufacture witnesses. A stored event can generate a later reassurance, congratulations, rehearsal or moved-favorite visit. Pending follow-ups are consumed only on completion.

Personal memory retrieval supports person, topic, place and partner. Major memories (importance at least .95) survive ordinary compression; ordinary personal memories retain the most recent 48. Event history retains 40 ordinary entries plus major events. Recent-choice history retains 32 entries; completion receipts retain 512, supported by the persisted monotonically increasing scene sequence. These bounds are not a distributed replay-protection protocol.

## Limits

State affects choices and visible quiet emotion/gaze. It does not yet produce a bespoke gait or facial animation for every combination. The model has intentionally few traits, and repeated play can reveal its authored vocabulary. Important memories can grow over a very long club lifetime; storage limits and long-horizon tuning remain release risks.
