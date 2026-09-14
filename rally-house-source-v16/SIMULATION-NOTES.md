# Rally House Simulation Notes — v0.6

## What changed
The club simulation now distinguishes **player-to-member relationships** from **member-to-member relationships**. Pair relationships affect autonomous social choices.

Relationships retain the familiar numeric dimensions but now also store semantic events:

- type
- day
- people
- tags
- sentiment
- strength
- detail

Legacy human-readable memory strings remain for the Club Book and old saves.

## Emergent social system
`EmergentSocialSystem` evaluates current state rather than relying only on a clock script. Current rules can create:

- Mika asking Leo for a crosscourt rally when the court is free;
- June noticing Mika's footwork when her development is still incomplete;
- a rain-driven tea ritual between Nia and June;
- Nia teasing Leo at the bonsai;
- Leo giving Mika quiet encouragement.

Rules depend on availability, court use, weather, progress, relationship bias, and cooldown state. The state is persisted so reloading does not immediately repeat the same event.

The Mika/Leo rally is a real second `RallySystem`, not only a text event. When the event wins eligibility, both members walk to the baselines and the autonomous rally system takes over until the social moment ends.

## Memory affects later behavior
Semantic memories can be queried by tag. Current dialogue uses prior coaching, rally, and matcha memories to produce contextual follow-up lines on later interactions.

## Weather behavior
Rain now has behavioral consequences in addition to lighting and window effects. Leo and Nia temporarily move inward toward the lounge/café, and the emergent social system can select rain-specific activity.

## Tennis variability
Shot outcome uses deterministic pseudo-randomness plus character skill. Lower skill increases the chance of a frame, net error, or long miss. Errors visibly end rallies and produce facial/body reactions.

## Coaching progression
Mika's persistent development affects:

- calculated tennis skill;
- forehand preparation/contact timing;
- stroke profile;
- miss likelihood through skill.

This makes the coaching number alter observable behavior instead of existing only in UI.

## Save compatibility
Save schema version is now 4. A pure migration function normalizes older relationship records by adding missing semantic-event arrays while preserving old memory strings and equipment/state values.
