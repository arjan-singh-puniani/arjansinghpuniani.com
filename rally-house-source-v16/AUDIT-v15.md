# v15 source and baseline audit

Canonical source: Rally-House-Grounded-Walking-v14.1.zip, extracted to a separate Character-Life-v15 folder. Original archives are preserved under reference-v14/. No v14 source is merged over v14.1.

A hash comparison of all source files finds differences only in Character.ts, CharacterSkin.ts, Navigation.ts and the added WalkCycle.ts. The everyday scenes, activity lifecycle, relationship graph, semantic memories, intentions, building affordances, object history, match history, coaching, saves, sound and UI are otherwise identical. v14.1 owns the stronger locomotion implementation.

## Ownership and execution

- Game coordinates reservation, travel, performance, resolution and completion. Activities own both people and resources throughout the transaction.
- EverydayLife supplies 13 authored scene families, returning lines, cold-tea and score follow-ups. Its selection primarily reflects counts and availability.
- RelationshipSystem stores the player graph and member-pair graph, with tagged memories and existing warmth/trust/rivalry biases.
- ClubHistory persists matches, first-win/breakthrough flags and a short intention list. Completion is the authoritative event source.
- ObjectAffordances persists IDs, visits and favorites. AmbientSocialPlanner already varies initiator and partner for ordinary built-object breaks.
- CoachingEvidence uses actual contacts, timing, spacing and recovery. It must remain authoritative for skill progress.
- ClubLifeSystem and EmergentSocialSystem contain older schedulers that are retained as compatibility data but are not the active v14 director. Do not mistake their dialogue definitions for observed events.
- SaveSystem serializes immutable snapshots, queues writes and falls back from IndexedDB to localStorage. Migration currently uses schema 6.
- WalkCycle supplies distance-driven feet. Character owns upper-body performance and court constraints. Renderer owns WebGL, shadows and adaptive resolution.

## Defect inventory before implementation

P0 — route sweep found a blocked entrance and ten unreachable scheduled transitions involving the entrance/lobby seat. The expanded bench footprints leave only a one-centimetre gap around the current lobby-seat target. Fix valid standing/access points; retain obstacle safety.

P0 — malformed nested legacy save data is not comprehensively validated. Invalid finite/range/type data can reach history, object or relationship consumers.

P0 — moving furniture validates floor placement but does not check whether its new footprint occupies a member's position. Reserved-object checks exist in UI actions but should also protect the underlying mutation.

P0 — startBreak consumes the post-court intention when travel starts, so interruption can erase an unfinished intention. Move consumption to successful completion.

P1 — source inspection found the queue is only serviced inside autonomous opening hours. The baseline harness initially appeared to request a lesson, but later review showed it had only opened the menu; that session is not evidence of a queued request. An explicit player request must remain actionable, and its queued status should survive reload.

P1 — no compact persistent internal-state model. The same schedule and availability generally produce the same choices regardless of fatigue or confidence.

P1 — authored-scene lifetime count penalties eventually select for least-played content rather than current motives. They do not explain why a person seeks a specific other person or place.

P1 — match observers are chosen by a broad distance check and display a line, but have no persistent witnessed event or resulting personal follow-up.

P1 — unrelated silent schedule poses can imply coaching or conversation even when no partner is present. Quiet context should carry an appropriate prop/gaze/micro-action without inventing completed lessons.

P1 — live speech is 9px in the desktop stylesheet. Important character dialogue needs a more readable size without covering the club.

P2 — favorite status follows visit count, but does not distinguish positive context, comfort or a specific generated personal ritual. Moving an established place has no one-time acknowledgment.

P2 — no lightweight possessions continuity, club culture or inferred coaching philosophy.

P2 — normal Club Book foregrounds numerical relationships and generic goals over current intentions, personal favorites and meaningful historical causes.

P3 — procedural character art remains a ceiling. No professional mesh, motion-capture footage or facial rig is supplied. Preserve the current identity and document the integration contract; do not claim imported assets.

## Baseline verification

Original test suite, real-time observation, and browser interaction findings are recorded in QA.md and PLAYTEST.md once completed. Source findings above are not fabricated playtest observations.
