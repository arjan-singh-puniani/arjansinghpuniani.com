# Rally House implementation report

The club now routes people around the net, places interaction feedback on real surfaces, gives completed Championships a saved social consequence, and announces incoming swings early enough to use the existing input buffer. The portfolio shows the actual club-to-court experience before asking a visitor to load the game.

## Changes and boundaries

**Navigation.** `World` adds the net with body clearance; `Navigation` checks every A* edge against continuous obstacles. This closes the case where both grid endpoints were clear but the connecting segment crossed a thin mesh. Ordinary characters walk around the posts. No teleport or unverified net-hop animation was added.

**Embodiment.** Object floor centers continue to own selection/navigation, while `interactionPoint` identifies bell, cup, stringing, bonsai, water, journal and lounge surfaces. Approach selection considers clearance, crowd spacing, reach and travel. Effects and gaze use the surface. Bell/string/paper actions can apply a bounded right-hand correction when no carried prop or stroke owns the hand. The racket is stowed. Release retains and decays the previous target before clearing it, avoiding a one-frame drop. Existing prop motion still owns cups, notebooks and cans.

**Causality.** Completed Championship rounds enter the opponent relationship record and scrapbook once, with the actual player/opponent score. A source event ID distinguishes equal-score rematches. The coordinator rereads the phase after match callbacks so a final point cannot miss its record. Return completes an activity receipt if a round actually finished; unfinished-only sessions cancel. Canceling a later rematch preserves earlier real results. Selecting a member shows their last Championship with the player, and the record survives schema-8 save/reload. No autonomous witnessed-conversation chain is invented for this new result type. Built-in object cards show the latest completed touch receipt, never a canceled attempt.

**Tennis information.** `BallPhysics.firstLanding` follows the existing discrete integration. A cached floor ring visualizes the incoming first landing in the legal court and is cleared on stop/result. The swing prompt may appear before the bounce with a centralized .65-second lead; the actual return still requires a legal bounce and physical racket contact. Existing buffer, movement speeds, aiming, ball compression, strings, impact/audio, hit-stop and opponent identities remain authoritative. Opponent spread now reads its existing tuning value rather than a duplicate literal.

**Camera.** Centralized portrait values use the tested B profile; landscape behavior and restoration remain intact. Nine sizes retain all projected court corners. The same scene and actors perform both club and Championship activities.

**Presentation.** A client component provides manual scene buttons, real images, optional captioned continuous footage and an iframe created on intent. Keyboard entry, focus, fullscreen failure guidance, direct-game alternative and reduced-motion layout were tested. New metadata and the Rally House Playground card describe the living club and arcade tennis. Other cards and projects were not redesigned. Captures are from this executable build; the bell close-up is explicitly a controlled paused runtime view.

**Packaging.** Both package scripts include the three linked stylesheets. The standalone Python launcher's accept queue is increased to 128 for parallel ES-module requests. Its original small queue intermittently reset a module request during QA. Five reloads using the actual revised embedded server code passed without failed requests. The ZIP contains 59 files, is approximately 180 KiB, and passes its CRC check. The ZIP is generated locally, not committed as a second source of truth.

## Maintainability and integration

Game constants live in `ChampionshipTuning`; outcomes remain outside UI/camera/audio. New deterministic coverage is included in `npm test`. Browser and tuning harnesses live in `qa`, never in the served module graph. Build output is synchronized through the existing release checker, including the portfolio mirror. New media has no proprietary asset dependencies.

The six reports and selected baseline/candidate evidence live alongside canonical source. Original dirty-tree backups are retained outside Git. Historical telemetry overwritten by existing tests was restored narrowly to its previous tracked version after copying this run's selected results; user backups were not deleted.

## Remaining ceiling

The procedural characters still show coarse hands, garment seams and limited shoulder deformation in close views. Reach is bounded rather than full-body IK. Pose proxies cannot establish that all meshes remain clear in every transition or dense custom layout. Quiet motion, cup pickup and seating merit artist-led work. Headless timing and a tracking bot cannot establish movement pleasure, satisfying sound or “one more point” motivation. Physical iOS/Android browsers, Safari, real touch ergonomics and speaker/headphone listening remain open gates documented in the human-playtest report. The branch is reviewable and tested; no claim of commercial studio quality or public deployment follows from that.
