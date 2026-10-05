# Rally House — World as interface

Implemented 4 October 2026 against the current filesystem, including the existing uncommitted Championship and studio-polish work.

## Interaction model

The miniature stays in view when selecting a member. Selection gently nudges the existing camera instead of zooming to a fixed close-up. A warm paper card follows the selected person or object. A ground ring acknowledges selection; pointer hover uses a quieter ring. At most two small, clickable labels identify committed activities. The player can tap the ground to dismiss and walk, close the card, or press Escape.

Character cards show name, play style, actual mood and energy, relationship tier, current activity, and a relevant recorded memory or club match. Lucresia can show coaching development when there is no memory or match to display. Cards expose two to four available actions. Existing reservations determine whether conversation, tea, coaching, spectating, or Championship challenge is available. Availability is checked again when an action is invoked.

Objects share the same card language. Bell, tea, strings, journal, bonsai, water, lounge, ball machine, and placed decorations use the existing tactile activity transactions. The avatar approaches a reachable position, performs the animation, triggers the world effect and material sound, and nearby eligible members witness it. Completion records the existing receipt and history. Spectator row now offers its existing sitting ritual as well as watching a rally. Placed furniture shows recorded visits, favorites and moves; arrangement opens the existing editing sheet.

Happening Now links an active everyday scene or court activity to its actual participants. Clicking opens a participant's spatial card and gently frames the group. It does not manufacture events or save a second feed.

## Architecture

`simulation owners → ClubContextPresenter → SpatialInteractionSystem → WorldAnchor`

- `WorldAnchor.ts`: pure finite positioning and viewport-bound checks. Chooses right, left or above the entity. Uses CSS pixels and reserves top and bottom controls.
- `ClubContextPresenter.ts`: read-only presentation models and availability rules. No independent simulation state or save fields.
- `SpatialInteractionSystem.ts`: one reusable card, delegated action routing, an SVG attachment line, selection/hover ring and a maximum of two activity markers. Position resolvers handle entity disappearance. Offscreen selection becomes a small Find button. Camera projection remains in CameraController.
- `Game.ts`: adapters into existing actions and render/update lifecycle. Challenges dismiss the card before the Championship camera begins; the spatial layer stays suppressed throughout the match and return transition. Club UI returns once Championship releases its transaction. Existing exact camera restoration remains authoritative.
- `HUD.ts`: narrow hooks dismiss selection when opening a global panel or closing an interaction. Club Book, coaching sheets, building and settings keep their existing flows.
- `CameraController.ts`: projection accepts a cached viewport and includes canvas offsets. The spatial layer converts to local coordinates; picking uses client coordinates.
- `spatial.css` and `index.html`: scoped visual language, responsive dimensions, touch targets, safe-area margins and reduced-motion styles.

## State sources

| Information | Authoritative source |
| --- | --- |
| Name, role, play style | Character.spec |
| Current activity, location | Character and ActivitySystem |
| Mood, energy, personal memory | CharacterMind.mood, states, recall |
| Relationship descriptor | RelationshipSystem.label and existing relationshipTiers |
| Club match result | ClubHistory.matches, only when the member is in the recorded score |
| Forehand development | Game.mikaProgress from completed coaching |
| Furniture visits, favorites, moves | ObjectAffordances.objects |
| Available furniture rituals | ObjectAffordances.affordances and touchForDecor |
| Built-in object rituals and sounds | CLUB_TOUCHES, existing Game tactile transactions and AudioManager |
| Club scrapbook | ClubLifeSystem.memories, displayed as recorded entries |
| Happening Now | Existing active lifeRuns and court reservations |
| Championship lifecycle | ChampionshipController, InteractiveMatchSystem, ChampionshipCameraRig, ChampionshipHUD |

Relationship labels use the existing tier mapping unchanged. No new numerical relationship meter was introduced. No `EverydayOwnership.ts` exists in this filesystem; possession ownership lives in CharacterMind.possessions and remains unchanged.

## Performance and lifecycle

Card content refreshes at most every 350 ms and only mutates when the model changes. Action buttons are reused. Canvas bounds are cached on selection/resize; card dimensions use ResizeObserver and ignore hidden zero-size reports. Per-frame work projects only selected/visible items and changes transforms. No per-frame DOM construction occurs. Activity candidates refresh every half-second and are limited to two visible markers with overlap rejection.

Selection resolves its entity each frame and releases when it disappears. Suppression removes marker nodes. Page teardown disconnects ResizeObserver, removes the resize listener and spatial DOM. Pointer/key events inside the layer stop before gameplay handlers while native button activation and Tab remain available. Focus returns to the canvas on dismissal. Reduced motion removes card entry motion and retains interaction functionality.

## Scope and recovery

Authoritative repository: `/Users/arjan/Desktop/arjansinghpuniani.com`.
Source: `rally-house-source-v16`. Served build: `arjan-portfolio/public/rally-house`.

A complete Rally House source snapshot was taken before edits in `World-Interface-Backup-20261004` under the RallyHouse workspace. Exact served files touched by this pass are also backed up there. Implementation was developed and tested in `World-Interface-20261004`, then copied by a file manifest with baseline hash preconditions. Existing uncommitted work was preserved; no reset, clean, checkout, dependency change, save migration or unrelated project edit was used.

The precise copy list and before hashes are in `WORLD-AS-INTERFACE-SYNC.json`. Changes include the three new UI modules, their compiled outputs, Game/HUD/camera integration, one CSS file, HTML stylesheet reference, test script/regression file, browser QA scripts, screenshots and these handoff documents. Existing PLAYTEST-CHECKLIST content is retained below the new spatial checklist.
