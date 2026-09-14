# Dialogue composition — v16

The existing finite authored scenes remain the foundation. `DialogueComposer.ts` can append at most one compatible clause to a core line. It records the evidence IDs used and suppresses recently repeated compositions for 360 simulation seconds, retaining 32 keys. A key is committed only when the line is actually spoken.

The live shared-break hook can refer to a real shared-cup memory or an actual favorite bench. Familiarity can produce a shorter warm clause. A score-aware challenge branch is implemented and unit tested, but is not yet connected to every live challenge line. No clause is chosen from an unrelated topic merely to add variety. The composer does not use an external language model.

A new three-person reflection requires a recorded match, a recorded Contessa/Barbara witness who still has a pending response, and sufficient Lucresia–Leo familiarity. It uses that result to choose the participants’ lines. Completion consumes the host’s pending response; cancellation does not fabricate it. A real-match integration test verifies this sequence.

The existing bench-room joke now leaves a small, bounded mood/relationship consequence and a pending reconciliation. Only completion creates that pending scene. A later exchange lets Leo make room before being asked; it consumes the follow-up only on completion. This is mild everyday friction, not a new drama meter or punishment system.

Limits: the catalogue is still finite, dialogue keys are session-local, there is no general multi-speaker procedural language engine, and there is no independent evidence yet that players perceive the added subtext.
