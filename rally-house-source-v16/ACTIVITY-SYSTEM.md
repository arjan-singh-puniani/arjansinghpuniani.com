# Activity system — v12

`ActivitySystem` holds lightweight participant and resource reservations. `Game` supplies routes, actors, animations, actual tennis, and synchronous consequences.

Lifecycle: traveling → starting → active → resolving → completed. Interrupted/cancelled states are terminal. Each transition is validated. Completion is legal only from resolving, only while the transaction is registered, and only once. Reservations cover travel, demonstration, play, and reactions.

Court activities use one resource shared by observation, lessons, and practice games. Café tables and player-built objects have distinct resource IDs. Schedules cannot reroute reserved people. Nonparticipants inside a reserved court step aside. Player-requested lessons can wait until the court and both people are available; an observation block can be ended to begin coaching.

Arrivals require actual proximity and exhausted navigation paths. A 40-simulation-second travel timeout and a 180-second total timeout safely interrupt stuck work. Social proximity is checked during participation. Tennis activity ownership does not use proximity to the original baselines after arrival.

Lessons finish on eight student contacts. Practice games finish at three points or sixty contacts; the latter can produce a draw. Observation finishes after sixteen hits. Shared breaks require ten seconds together. Resolving allows a short reaction interval before committing effects.

No asynchronous work occurs inside a consequence callback. Its world changes and completed receipt are included in the same save snapshot. Saves are queued and immutable. The activity ledger retains the latest 48 receipts. The debug completed/interrupted counts therefore describe retained receipts, not lifetime analytics.

Reload policy is deliberate: unfinished activities and queued lessons reset without rewards. Completed history and the next ID persist. No resource is left reserved across reload. There is no networking or personal-data collection.

Limitations: generalized priority arbitration and navmesh capacity are not implemented. A small explicit director chooses opportunities for four members; this is not a general-purpose planner.
