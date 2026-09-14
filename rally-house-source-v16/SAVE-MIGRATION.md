# v15 save migration — schema 7

v14/v14.1 used schema 6. v15 writes schema 7. The storage key (`rally-house-save-v2`) and IndexedDB database (`rally-house`) remain unchanged. Saves are browser-origin-specific: a different hostname or port is a different club unless an explicit transfer is performed.

Existing money, equipment, placements, relationships, coaching development, activity sequence, match history, intentions, object history, major memories and everyday follow-ups remain. The new mind layer stores six internal states per member, memories/events and pending follow-ups, recent choices, ritual day stamps, possessions, culture and coaching emphasis. Old schema-6 saves initialize that new layer without fabricated past witnesses or rewards. Queued player lesson requests now persist.

## Partial work

Reload during a social scene, lesson, walking, match or build interaction safely resets transient performance, routes, props and reservations. Completed consequences remain. It does not resume the exact animation frame or point. Stable IDs and completion-only mutation prevent replaying an unfinished result. The queued lesson can restart when people become available, including outside autonomous opening hours.

## Validation and storage

Migration rejects future versions, invalid clock/world/relationship/history data, non-finite nested numbers, forbidden prototype keys, excessive nesting and invalid queued lesson types. CharacterMind and ObjectAffordances validate their own fields before the game loop/autosave starts. Missing optional legacy object fields receive defaults. An invalid existing club is reported visibly and is not silently replaced.

Immutable snapshots enter a serialized write queue. IndexedDB is primary; a failed write falls back to localStorage. Reads choose the newest supported envelope. Failure to read primary storage with no usable fallback refuses to create a new club. Blocked/open timeouts reject instead of hanging forever. A WebGL context loss pauses and attempts saving; successful save enables explicit reload, while failure keeps a visible explanation.

Deterministic tests include legacy migration, invalid nested data, state round trips, unavailable storage and immutable queued writes. Browser QA covers five partial reload cases, completed favorite/mind persistence, visible corrupt-save rejection and context-loss recovery. This is not cross-tab conflict resolution, transaction-level timeout coverage on every browser, repair of arbitrary corruption or proof against a full disk on every device.
