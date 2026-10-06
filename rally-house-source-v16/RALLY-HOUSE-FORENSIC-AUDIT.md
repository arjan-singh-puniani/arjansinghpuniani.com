# Rally House forensic audit — 6 October 2026

The active game is `rally-house-source-v16`, compiled with TypeScript 5.9.3 into its own `dist`, then mirrored into `arjan-portfolio/public/rally-house`. The portfolio is Next.js 15.5.24. This work starts from main `db9bb1e3d650f6094e40140b358424b841f10450` and is isolated on `rally-house-experience-20261006`.

## Repository custody

The Desktop checkout was on `portfolio-human-copy-20260930`, behind its upstream by eight commits, with valuable HoloAnatomy and Rally House modifications. Its status and complete tracked diff were backed up outside the repository before implementation. A narrowly scoped Rally House source archive was also retained. No blanket reset, clean, restore, deletion, or overwrite was used. The separate hardening checkout contained older work and an existing character-life witness assertion failure; it was not adopted as the baseline. Unrelated projects were excluded from edits.

Folder names were treated as clues. Git ancestry, package scripts, module imports and hashes establish authority. Historical RC3.2/RC3.4 material is empty or partial patch material, rather than a complete replacement for the imported runtime. Existing archives and experimental directories remain preserved.

| Class | Paths / disposition |
|---|---|
| A — canonical source | `src/**/*.ts`, active HTML/CSS, package/TypeScript configuration in `rally-house-source-v16` |
| B — generated | Game `dist`, served `public/rally-house/dist`, generated QA telemetry/screenshots; synchronize, never independently author JS |
| C — portfolio | Rally House route/client/CSS, its Playground card, relevant shared layout/header/footer and integration tests |
| D — QA | Current `tests`, portable `qa/runtime.mjs`, serve/release/browser harnesses, packaging and character intake tooling |
| E — documentation | Current and historical Markdown; claims reconciled against code and this run rather than accepted as execution evidence |
| F — historical backup | ZIPs, old source copies, legacy prototype, prior screenshots and pose captures; preserve |
| G — historical patch | `qa/*-v16.py` string-replacement scripts; inspect but do not execute over current code |
| H — obsolete experiment | Historical harnesses requiring absent reference folders or `/home/claude` tooling; preserve and do not count as current passes |
| I — unrelated | HoloAnatomy, Vector Court, SeizeFreeze, Hemodynamic Observatory, ReasonOS and research assets |
| J — uncertain | Unmapped RC/hotfix fragments; preserve until a complete dependency/build path establishes authority |

The committed evidence inventory records 412 baseline scoped files with sizes and SHA-256 hashes. Its `kind` field is an inventory grouping, interpreted through the table above. All 53 canonical TypeScript modules, deterministic suites, active presentation files, current QA harnesses, first-party build/packaging scripts and relevant design/persistence documentation were examined. Historical JSON telemetry and binaries were inventoried and selected views inspected; generated output and dependencies were traced rather than treated as separately authored architecture. This is a Rally House audit, not a claim that every unrelated portfolio source file or every pixel in every historical archive was reviewed.

## Source and deployment

`npm run build` invokes `tsc`; `qa/check-release.mjs` checks 57 mirrored artifacts and resolves their relative imports. Source and served trees matched at baseline and after the final sync. No historical RC is imported by the active module graph. Existing package names retain `v16` while the active package version is `0.20.0-studio`; the filename alone does not describe the feature set.

Public route and game returned HTTP 200. The route still described a “Cozy Tennis Life Sim,” although the game already contained Championship tennis. Two fetched public owner modules, `Game.js` and `InteractiveMatchSystem.js`, were byte-identical to baseline main. Their hashes are in `evidence/before/public-build.json`. This verifies those two deployed owners, not every public file or a deployment of this new branch.

## Ownership map

`Game` coordinates fixed-step simulation, lifecycle, saves and UI. `ActivitySystem` owns reservation and completion receipts. `ChampionshipController` owns scores/phases; `InteractiveMatchSystem` owns legal bounce, buffered input and ball flights. Character contact frames own ball capture/release. `Character` combines authored clip curves, foot planting, court motion, gaze and procedural reach. `World` owns geometry, interactive anchors and static navigation; `Navigation` owns path/segment clearance. Renderer and camera own presentation, not results. `MatchInput` owns keyboard/touch intent. Audio plays on authoritative events. Relationship, mind, scrapbook, history and affordance modules own distinct bounded records. Spatial UI reads those owners.

Persistence uses schema 8 with validation, migration and multi-tab conflict protection. This change adds an optional event `sourceId`; it does not discard older saves or change the schema. Invalid storage remains protected. A legacy player position blocked by the new net constraint follows the existing safe-entrance recovery behavior.

## Baseline and prioritized findings

Baseline: 16 game suites, 88 portfolio tests, 31 generated routes, 17 lint warnings and no lint errors. The existing studio browser matrix passed after correcting its portrait focus/pin race. Baseline screenshots and logs are retained selectively in `evidence/before`.

| Finding | Consequence | Resolution |
|---|---|---|
| Net absent from navigation; A* checked cells without every connecting segment | Ordinary walking could cross the mesh, including obstacles thinner than a grid cell | Body-clearance net obstacle and segment validation |
| Object floor centers doubled as interaction surfaces | Effects/gaze/reach appeared away from the physical object | Separate surface anchors, reachable approach selection, bounded hand reach |
| Bell initially obscured by counter props | A correct interaction remained hard to see | Visitor-facing placement, inspected again after two placement alternatives |
| Swing cue withheld until the bounce | Delayed input could miss the first return despite an early-input buffer | Anticipatory cue selected through measured sweeps |
| Championship completion had no persistent player-result card | Return lost an important social consequence | Exact-once completed-round records and saved member context |
| Portrait court small | Ball and athletic silhouettes consumed too few pixels | Camera B, with all corners preserved |
| Portfolio led with copy and an eager iframe | Initial visitors saw loading instead of the game’s transformation | Real captures, manual scenes, continuous footage and deliberate game entry |
| Playtest ZIP omitted two linked stylesheets | Standalone Championship/spatial UI could differ from the website | Include all styles, CRC check and extracted browser boot |

Impact ranking used 1–5 estimates for perceptibility, frequency, distinctiveness and portfolio value divided by risk and implementation cost. Net safety (5×4×3×4 / 2 / 2 = 60), cue readability (5×5×4×4 / 2 / 3 ≈ 67), truthful match memory (4×4×5×5 / 2 / 3 ≈ 67), embodied bell reach (4×3×5×5 / 2 / 3 = 50) and presentation (5×5×4×5 / 2 / 4 ≈ 63) outranked speculative new content. These are planning estimates, not measured enjoyment scores.

## Interaction coverage and density

Density means coherent perceptible responses per unit of attention. Count an effect, sound, pose, eligible glance, completed receipt and later truthful context separately; do not count repeated toasts or promise a witness when nobody is eligible. Bell: one action can yield five immediate/completion layers and a sixth on later inspection. Duration includes actual travel plus preparation, 1.7 seconds of use and resolution. No human attention-rate measurement was collected.

All 17 built-in selections and all 16 catalog types were mapped. In the table, P = transient physical effect, A = sound, M = character animation, S = conditional nearby acknowledgement, R = completed saved receipt, C = context. “Shared” means a place-level ritual, not separate ownership/pickup for each visible mesh.

| Object / place | Visible / selectable | P / A / M / S / R / C | Follow-up and limits |
|---|---|---|---|
| Front desk / bell | Yes / yes | Yes / yes / targeted reach / conditional / yes / yes | Latest completed visit; actual bell anchor |
| Matcha nook / cups | Yes / yes | Steam / cup / drink / conditional / yes / yes | Separate shared-member tea; cups remain stylized carried props |
| Pro shop / stringing | Yes / yes | Strings / strings / reach-inspect / conditional / yes / yes | Equipment customization; bounded arm reach |
| Gear wall / bags / rackets | Yes / place-level | Shared / yes / inspect / conditional / yes / yes | Not individual bag inventory |
| Ball machine | Yes / yes | Ball / motor-bounce / feed / conditional / yes / yes | Separate coaching drill requires free court and people |
| Equipment trolley / cones | Yes / place-level | Shared / yes / feed / conditional / yes / yes | Cones are scenery within this selection |
| Water station / towels | Yes / yes | Water / cup / drink / conditional / yes / yes | Surface spigot anchor; no hydration meter |
| West water / towels | Yes / place-level | Shared / yes / drink / conditional / yes / yes | Fallback contact height rather than a bespoke hand solver |
| Bonsai corner / plants | Yes / yes | Leaves-water / water / care / conditional / yes / yes | Real surface effect; can reach uses inherited prop motion |
| Player lounge / benches | Yes / yes | Comfort / fabric-wood / sit / conditional / yes / yes | Sitting at inherited furniture remains an artist/device review gate |
| Entrance lounge | Yes / yes | Shared / yes / sit / conditional / yes / yes | Same place-level limitation |
| Spectator row / hoppers | Yes / yes | Comfort / fabric / sit / conditional / yes / yes | Watch action follows authoritative active ball |
| Journal / magazines | Yes / journal | Paper / paper / notebook / conditional / yes / yes | Actual scrapbook and visit; magazines are shared scenery |
| History shelf / trophies | Yes / shelf | Comfort / wood / inspect / conditional / yes / yes | Real scrapbook fact; no new trophy earning system |
| Club board | Yes / yes | Paper / paper / notebook / conditional / yes / yes | Saved club fact, not invented booking history |
| Warm-up bay | Yes / yes | Comfort / fabric / stretch / conditional / yes / yes | Not a separate click target for each mat |
| Main court | Yes / yes | Real tennis / tennis / athletic / watchers / completed result / yes | Watching/coaching/challenges remain separate reservations |
| Net / posts | Yes / navigation constraint | Ripple on real net hit / net / route-around / — / no visit / no card | Deliberately no casual hop or new touch menu |
| Doors, windows, lamps, clocks, walls | Yes / scenery | Ambient or none / ambient / — / — / — / — | Communicate place; no claim of independent interaction |
| Built bench, stool | On placement / yes | Comfort / yes / sit / conditional / visits / yes | Actual favorites and retained move history |
| Built café/side table | On placement / yes | Café / yes / drink / conditional / visits / yes | Actual visits; not world-owned cup pickup |
| Built plant, planter | On placement / yes | Care / yes / watering / conditional / visits / yes | Favorite behavior conditional on completed autonomous use |
| Built lamp, lantern | On placement / yes | Light / wood / offer / conditional / visits / yes | Cozy ritual; no extra progression |
| Built racket rack, bag | On placement / yes | Strings / yes / inspect / conditional / visits / yes | Shared equipment response |
| Built hopper, basket, cone set | On placement / yes | Training / yes / feed / conditional / visits / yes | Uses shared training ritual |
| Built scoreboard, trophy, towel rack | On placement / yes | Paper/comfort / yes / notebook-inspect-stretch / conditional / visits / yes | Saved visits, favorites and move history; no fabricated score |

Completed built-in visit context is bounded by the 48-entry activity ledger. It is a recent receipt, not an unlimited lifetime counter. Decor uses its separate saved affordance visits. Championship relationships are bounded separately. Shared effects and approximate props are explicit limits; making every mesh a separate button would increase administration without improving this small club.
