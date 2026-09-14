# Memory retention — v16

The canonical baseline retained 1,000 injected major memories (154,674 serialized bytes in the stress fixture), although ordinary play stayed much smaller. V16 adds explicit retention classes and bounded event history.

- Foundational: the first qualifying major match/lesson/witness memory per person/topic, capped at 12.
- Other major memories: newest 24.
- Ordinary memories: newest 48.
- Witness events: newest 48.
- Completion receipts: 512; recent decision history: 32.

Low-importance repetitions with the same person, topic, place and participants compress after repeated occurrences. Their count survives compression. Shared breaks, rests and practice use modest summaries; compression does not invent a match or an outcome. Important detailed memories are not merged into those generic summaries. All classes are still bounded, so this is not an unlimited lifetime journal.

Loading a legacy save rebuilds the classes and may reduce its number of ordinary rows through compression. The browser migration check verifies occurrence counts and important details, as well as existing progress, placement, relationship and event data. It does not assert byte-identical snapshots after normalization.

Culture now decays toward a modest baseline with a 2,400-second time constant and uses diminishing reinforcement from completed behavior. It can respond to a later change in play style instead of remaining at 1.0 forever. Favorite-place logic remains based on completed visits and object history; the existing repeated-visit and moved-object tests remain active.

Generated scene IDs used for old event follow-ups are pruned from cooldown/count maps after their cooldown expires. Permanent authored scene counts remain available for repetition control. See LONG-HORIZON-QA.md for actual 1/7/30/100-day measurements and the separate adversarial stress test.
