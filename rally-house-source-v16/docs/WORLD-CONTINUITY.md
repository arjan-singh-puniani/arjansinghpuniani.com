# Rally House has one persistent physical world

Championship, Performance Lab and phone capture use the existing World, court, characters, objects, time, weather, lighting and social simulation. They may own camera, controls, participant animation, overlays and reversible presentation. They must not replace the club with an arena or inspection scene, manufacture a crowd, recolor the court, reset the world, or interrupt unrelated activities to make a mode available.

References inform physical principles, animation, camera, game feel and social behavior. Visible reference objects are not requests to reproduce those assets. Improve movement on the existing character system; preserve recognizable identities.

## Corrective audit

| Item | Decision | Implementation |
| --- | --- | --- |
| Generated 24-person gallery, chairs, tier and backboard | Remove | Delete ChampionshipArena and its compiled/served modules. No replacement audience. |
| Blue court overlay | Remove | Render the existing green court and permanent markings in every mode. |
| Match lighting boost and suppression of practicals | Remove | Time, weather and existing lamp state alone drive physical lighting. |
| Wholesale pendant exclusion | Rework | All fixtures remain. Any low camera receives the same smooth reversible opacity cutaway, independent of mode. Original transforms remain untouched. |
| Hiding nonparticipants in Lab | Remove | One shared world composition always renders all existing club members. |
| Lab replay body | Rework | Replay is a read-only pose presentation of the existing player within that composition, plus registered annotations. It does not create a second live actor or world. Historical poses do not alter physical collision or social state. |
| Stopping the whole club for analysis/capture | Remove | Existing NPCs, activities, objects and time continue. Phone capture owns only the recording participant. Explicit player pause remains respected. |
| Cancelling an existing practice to accept a challenge | Remove | Busy courts retain their reservation; the player can challenge later. |
| Existing court reservation, real participants, arcade ball and sports HUD | Keep | These control play on the existing court; exit releases ownership, input and temporary ball effects. |
| Camera establishment, orbit, behind-player framing and exact return | Keep | The same camera transforms visibly around the same place. |
| Existing physicality and shared rig | Keep/improve | Preserve contact solving, split step, torso/hip turn and recovery. Add a world-space support foot during stationary stroke loading/contact; release it smoothly for recovery or running strokes. |

The permanent detailed net belongs to the original shared court and is present before, during and after play. It is not instantiated on challenge. Registered Lab paths, heat maps, joint markers and replay ball are analysis overlays, not new environment assets. Authored demo clips sample the same procedural character/animation system and are explicitly labeled; they are never another club scene.

## Acceptance

`qa/same-world.mjs` captures club, court transition, gameplay and returned club, then checks the Lab in the same living environment. It compares World, object and character references; object transforms; permanent court/net; rendered NPCs; normal lighting rules; social activity causality; camera restoration; court/input release; and absence of generated crowds or extra court layers. It exercises ordinary exit, completed-result exit and early cancellation. A pre-existing court reservation must survive a rejected challenge. Native browser evidence must show the same recognizable physical place throughout.

`tests/championship-detail.mjs` now protects persistent court/net and lighting, reversible camera-only fixture visibility and support-foot registration. Release checks reject orphan compiled modules and mismatched source/served module sets so removed scenery cannot survive in an archive or served tree.
