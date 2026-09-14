# Character Life implementation contract (audit-stage design)

This records the intended integration boundaries. Implementation and verification status are reported separately in QA.md.

Character state will contain energy, confidence, social appetite, practice drive, comfort and emotional tone. It will update at low frequency, recover naturally, react only to actual events and never create player maintenance chores. Four compact personality profiles will change utility weights and event response.

Candidate selection will keep the authored EverydayLife catalogue and add parameterized opportunities. Each candidate carries a motive, actor, optional partner, place/object, motif, eligibility and optional causal event. A scored debug explanation will distinguish schedule, state, personality, relationship, memory, proximity, weather, culture and repetition. Busy actors and reserved places are excluded before ranking. Intentions remain pending until their activity succeeds.

Consequences enter through activity completion. Witnesses are collected from actual event position, available attention and an obstacle-aware visibility approximation. An observed event may enable a later reassurance, congratulations or advice scene; an unseen event cannot produce an eyewitness line. Cancelled activity and reload never award the missing consequence.

Repetition tracks recent scene family, participant pair, location and motif. Penalties decay; strong current relationships and salient unfinished consequences can outweigh them. The small catalogue's lifetime counts must not grow into an unbounded negative score.

Favorites retain existing object IDs and completed-visit history. Contextual positive visits increase comfort and destination utility. Moving preserves history and yields at most one mild acknowledgment per move; removal invalidates references without punishment. Plants, baskets and benches keep distinct behaviors rather than all becoming tea tables.

Culture is a compact result of completed play and meaningful placements, not a class selection. Coaching identity derives from completed evidence-bearing lessons; choosing a menu item alone does nothing. Both gently influence opportunities and appear in ordinary language in the Club Book.

Possessions are a few identity anchors, not inventory management. Owner, current location/use and completed usage history persist. Props have one visible owner at a time, return safely on cancellation/reload, and do not clone through interrupted performances.

The locomotion module and tests are preserved. Personality may influence upper-body expression and deliberate destinations; no behavior utility may directly overwrite foot anchors, court contact corrections or reservations.

Validation will combine deterministic unit/integration tests with baseline and final real-time browser sessions. Agent-driven UI automation will be explicitly distinguished from independent human attachment testing. Software-rendered timing is not device FPS evidence.
