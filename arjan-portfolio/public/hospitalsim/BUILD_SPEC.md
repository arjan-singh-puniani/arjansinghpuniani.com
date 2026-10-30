# Common Good: comprehensive Codex execution prompt

## Mission and working agreement

You are the lead game designer, simulation engineer, interaction designer and implementation owner for Common Good, an original browser hospital management game. Deliver working software, not a design presentation. Treat the attached Materialise screenshot as a visual reference for pale blue modular medical dioramas, floating platforms, miniature clinicians, imaging equipment, clean materials and generous white space. Do not reproduce its logo, screenshot, proprietary models or page chrome. Take inspiration from the management appeal of Two Point Hospital without copying its name, characters, diseases, assets, writing or interface.

The owner is Arjan Singh Puniani, with chemical engineering, neural engineering, clinical research and teaching experience. The project should become a credible example of human-centered medical education engineering. Its admissions value must follow from real work, external feedback and measured usefulness. Do not invent clinician involvement, users, results, publications, service hours or the owner's contributions. Preserve an honest record of substantial AI assistance.

Inspect the repository, AGENTS.md instructions, current deployment and existing REPLISOME integration before changing anything. Archive the existing project and preserve its route or redirect behavior before an authorized replacement. Develop the hospital game on an isolated route or branch first. Do not overwrite unrelated portfolio content. If no portfolio checkout is available, deliver a standalone game and an explicit integration patch plan. Keep the hospital game independent enough to embed in a portfolio.

## Product thesis

Build a delightful miniature hospital where the player can see, understand and improve the relationships between layout, queues, communication, access, staff workload and patient experience. A patient is a person moving through a system, with understandable goals and constraints. The player should laugh at situations and characters without mocking illness, disability or people needing care.

Retain the pleasures of building, animation, mastery, colorful staff personalities, escalating challenges and satisfying expansion. Improve the experience with meaningful short-session decisions, legible causal explanations, bounded automation, humane incentives and rapid experimentation. Do not claim these are proven improvements over Two Point Hospital until player testing supports that conclusion.

The core differentiator is a living causal model: the player sees why a queue formed, changes one constraint, and discovers where the bottleneck moves. Educational value should emerge from play before explanation.

## First-session experience

Within 15 seconds, show an attractive, moving hospital and one obvious action. Within 60 seconds, let the player place a useful room, watch someone use it, and understand the consequence. Within three minutes, introduce a manageable surge or bottleneck. A complete shift lasts about eight real minutes at normal speed; offer pause and faster speeds. Make a second attempt immediately appealing.

Use progressive guidance tied to the player's actual state. Avoid an opening lecture. Start with a viable hospital, money to experiment, and a concrete goal. Provide undo for planning actions when simulation consequences have not begun. Distinguish safe sandbox experimentation from scored scenarios. Explain failures without shaming the player.

## Visual and interaction direction

Create an isometric miniature world with blue and cyan platforms, warm white walls, teal scrubs, soft shadows, rounded equipment and restrained peach patient accents. Preserve depth, overlap, scale consistency and believable equipment silhouettes. Include recognizable scanners, beds, monitors, carts, desks, lounge furniture and plants. Characters need readable walking, waiting, working and resting states. Use depth sorting to avoid drawing patients through walls.

Prefer procedural geometry or licensed original assets that remain sharp under zoom. If migrating from Canvas to WebGL, use a small orthographic scene and efficient instancing. Maintain a fallback or graceful failure message. Do not replace a functioning renderer merely for technology prestige. Use warm editorial typography for hospital names and highly legible sans serif UI labels. Keep the hospital visually dominant. Avoid a generic dashboard obscuring the game.

Support mouse, touch and keyboard. Build mode needs a placement ghost, valid/invalid state, visible doors and clear cancellation. Zoom must not trap users off-screen. Include a room list for non-pointer inspection and a non-spatial placement mode for users unable to use the map. Never encode urgency or success through color alone. Honor reduced motion, provide adequate contrast, large touch targets and pause-on-background behavior. Test actual narrow viewports, not only CSS breakpoints. Include all scenario and policy controls on mobile.

## Simulation architecture

Separate simulation state, rendering, input, content definitions, persistence and reporting. Implement a seeded random generator and fixed timestep. Rendering frame rate must not change simulation outcomes. Record seed, scenario version, policy decisions, layout actions and simulation timestamps. Never use wall-clock time as the sole source of truth. Save/load must preserve current visits, assignments and queues without duplication or lost capacity.

Represent patients as a state machine: arrival, navigation, waiting, service, next service, discharge or departure. For the prototype, use an explicitly fictional consultation → optional imaging → care pathway. Do not imply every real patient follows this pathway. Track waiting time separately from walking and service time in the next version. Show definitions in reports. Respect conservation: each arrival must be completed, departed or still in the hospital. Never count a person twice.

Rooms require a type, footprint, doorway, capacity, service model, staffing requirement and upgrade level. Validate bounds, overlaps, doors, corridor connectivity and access to exits. Use breadth-first search or A* on a walkable grid. Recompute routes after construction changes. Do not strand patients when rooms are removed; prevent removal while occupied or provide a safe reassignment path. Prevent construction over a moving person. Keep elevators, multi-floor routing and complex infection models outside the first stable release.

Model capacity and workload transparently. A second room should not create free clinicians in the mature version. Assign staff explicitly, with role-compatible skills, shifts, breaks and fatigue. Explain capacity loss from breaks and its recovery benefit. Avoid an unexplained universal performance bonus. Model budgets with clear construction costs, wages and operating expenses. Budget rates are gameplay parameters, not estimates of hospital economics.

Queue policies should be understandable and inspectable: arrival order versus a fictional urgency flag in the prototype. Label urgency as scenario data, not a clinical triage algorithm. No medication dosing, diagnosis decisions or actual clinical recommendations. Access barriers are environmental constraints; never assign worse intrinsic worth or ability to a demographic group. Support services should change a specific modeled obstacle rather than magically curing inequity.

## Fun, depth and novelty

Deliver the following in stages, preserving a playable game at each stage:

1. **Neighborhood shift:** room building, walking routes, consultations, imaging, care, queues, basic operating costs, upgrades, pauses, speeds, saves and a shift debrief.
2. **People and team:** staff assignments, readable personalities, patient goals, protected breaks, a handoff mechanic and communication/access support. Personality modifiers should create choices without reducing staff to stereotypes.
3. **Causal view:** click a queue to see its actual causes, show room utilization and travel paths, and preview plausible consequences with uncertainty. Derive explanations from recorded state rather than fabricated LLM narration.
4. **Experiment lab:** restart the same seed, branch from a checkpoint, compare two layouts or policies and inspect tradeoffs. Counterfactual runs must replay identical exogenous arrivals. A/B comparisons must identify any changed model parameters.
5. **Campaign:** neighborhood clinic, evening surge, limited staffing and access-focused scenarios, each with distinct constraints. Unlock equipment and space through demonstrated mastery, not grinding.
6. **Longer-term stretch:** community continuity, preventive investments, specialist services and procedural room decoration. Add only after the core game is compelling.

Make humor come from original staff dialogue, surprising but logical operational events and affectionate environmental details. Give upgrades visible changes. Use subtle optional sound feedback. Add satisfying completion animation and a specific end-of-shift story. Avoid using death, poverty or disability as slapstick.

Use multiple outcome dimensions: people helped, wait distribution, access barriers, team well-being, patient experience and budget. Do not collapse them into an opaque morality score. Let players discover tradeoffs. Detect dominant strategies through automated runs and playtests. Ensure the default scenario is winnable without hidden knowledge; harder scenarios should require planning rather than frantic clicking.

## Evaluation and medical school relevance

Frame this as an engineering and educational design project unless evidence supports stronger claims. The AAMC competencies provide a useful map, not a guarantee of admission. Connect scientific inquiry to a real question and evaluation; teamwork to actual collaborators and feedback; learning and growth to documented revisions; communication to learner comprehension; and service orientation to sustained work meeting an identified community need.

A polished AI-assisted game alone does not establish clinical experience, community service or improved learning. Distinguish building, usability testing, educational evaluation and research. Label each accurately in the portfolio. Report only contributions the owner can explain and defend.

Before claiming educational benefit, choose one focused objective: for example, whether players can identify a capacity constraint and explain why increasing unrelated capacity fails. Create brief scenario-based pre/post items and a transfer task that uses a different hospital layout. Do not measure only memorized facts from the tutorial. Have a qualified educator review the assessment. A small usability pilot can identify usability defects; it cannot establish broad efficacy.

Proposed sequence, not completed work:

- Ask two or three willing frontline clinicians or educators to review the model's assumptions and misleading simplifications. Record dated comments, consent for attribution, and resulting changes.
- Run five to eight formative usability sessions with consenting adult learners. Record task completion, misunderstood controls, time to the first successful action, explanations of bottlenecks and qualitative feedback. Treat these as exploratory observations.
- Revise the game and assessment before a larger evaluation. Determine the sample size from the research question and expected precision with a qualified mentor. Do not declare an arbitrary small sample sufficient.
- If conducting systematic human-subjects research or planning publication, obtain the institution's research oversight determination before recruitment or data collection. Do not self-declare exemption. Follow the approved protocol and avoid collecting unnecessary identifiers.
- For a comparative study, use a suitable control or randomized allocation where feasible, report missing data and attrition, assess transfer or retention where the design allows, and provide effect sizes with uncertainty. Do not infer causal learning gains from uncontrolled self-selected pre/post scores.
- Publish an honest case study covering the problem, intended audience, model, personal contributions, AI assistance, feedback, revisions, methods, findings and limitations. Cite reviewers only with permission. Share code/assets under appropriate licenses.

A defensible eventual application description has this structure: “I identified [documented need], designed and implemented [specific contribution], collaborated with [actual people], tested [actual sample and method], changed [specific feature] after feedback, and learned [specific insight about people or care systems].” Leave unearned fields blank. Do not ghostwrite completed accomplishments from a plan.

## Data, privacy and reporting

Default to device-local state and no analytics. Use only fictional patients. Export a readable JSON report with scenario/model version, seed, layout, decisions, timing definitions, completed/departed/unfinished counts and results. Do not include personal health information. If feedback collection is later added, specify purpose, consent, retention, access and deletion behavior before enabling it. Never silently transmit gameplay records to a third party.

Show means, medians and tail waits where appropriate. Include denominators for access comparisons and distinguish completed-patient statistics from all-arrival statistics. Explain selection bias when long-waiting patients leave. Use uncertainty and sample counts for comparisons. A game's experience score is not a validated satisfaction measure. Avoid false precision.

## Acceptance and verification

Test invariants, not only implementation details. Verify room occupancy limits, arrival accounting, blocked-route rejection, occupied-room removal, reassignment after edits, no negative wait/service duration, bounded fatigue, finite money, fixed-seed replay, save/load equivalence and end-of-shift termination. Compare actual simulation runs under capacity changes to detect unintentional effects. Report limitations rather than assuming monotonic improvement.

Run browser checks on build/select/inspect/upgrade/remove, pause/resume/speed, scenario reset, policy changes, autosave/reload, debrief and export. Check narrow and wide layouts, keyboard-only use and reduced motion. Inspect screenshots for overlapping UI, unreadable labels and canvas clipping. Target smooth animation on a midrange device and report measured performance rather than invented benchmarks. Do not claim accessibility conformance without an audit.

Before delivery, list what is implemented, tested, deferred and unvalidated. Include reproducible run instructions, source, asset provenance, known issues, a design/model note, a changelog and the evaluation protocol draft. Publish the working build using the environment's supported hosting workflow and verify the returned deployment result. Keep existing access settings. Never claim a portfolio replacement was completed when only a standalone build was published.

## Current implementation handoff

A buildless Canvas/JavaScript prototype exists as Common Good — Hospital Works. It implements four room types, grid routes, three parameterized scenarios, fictional urgency and access flags, a simplified shared-energy model, upgrades, surge events, local saves, keyboard placement and JSON reports. Initial headless simulation checks cover reachability, placement collisions, door obstruction, shift completion, repeatable seeded outcomes, access-cohort representation and missing-service constraints. Browser checks have confirmed rendering and keyboard placement. This is a vertical slice, not the full specification above.

Known limitations to improve: staff are implicitly supplied by rooms; float clinicians apply a shared speed bonus; walking is included in the displayed queue time; patient movement uses simplified grid steps; accessibility needs fuller non-spatial placement and assistive-technology testing; no clinician review or learner study has occurred. Counterfactual branching, richer characters, campaign progression, undo and actual 3D rendering are not implemented. Keep these distinctions in all descriptions.

## Source references

- AAMC, The Premed Competencies for Entering Medical Students: https://students-residents.aamc.org/real-stories-demonstrating-premed-competencies/premed-competencies-entering-medical-students
- AAMC, Premed Competencies: Self-Assessment: https://students-residents.aamc.org/media/15366/download
- Two Point Studios, Two Point Hospital official description: https://www.twopointstudios.com/en/two-point-county/two-point-hospital
- User-supplied Materialise screenshot: visual reference only; not evidence of this game's performance or educational validity.

These sources support the competency framework and original game's general premise. The proposed mechanics, development roadmap and evaluation design are design recommendations, not findings established by those sources.
