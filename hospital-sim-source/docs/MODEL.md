# Current RC9 model

See [opening, motion, pipeline and checks](FIRST_MINUTE_RC9.md). Previous model notes follow with their original context.

# Current RC8 model

See [equipment, placement, shifts and replay rules](EQUIPMENT_RC8.md). Current browser enables `kits-v1`, a32×28clinic and16-minute fresh shifts. Historical model notes below retain their original context.

---

# Current default: RC6 campus

The current clinic uses a24×20 estate, documented in [CAMPUS_RC6.md](CAMPUS_RC6.md), while retaining the RC5 service model. The following older full-hospital model remains available in advanced scenarios. The current empty-start clinic and its different reception/wardrobe/billing/booking rules are documented in [CLINIC_FLOW_RC5.md](CLINIC_FLOW_RC5.md).

# hospitalSIM model1.0.0-rc3

One tick is one fictional game second. A seeded arrival tape is independent of frame rate, appearance and layout. Initial seed431 uses an original consultation → optional imaging → care pathway; the opening map-collector visit is consultation-only. This is not a real clinical pathway or triage algorithm. Cases, priority/access flags, timings, wages and budgets are gameplay parameters. No diagnostic, dosing or treatment advice is supplied.

State, BFS navigation, operations, content, renderer, motion, input, persistence, reporting and experiments are separate ES modules. Numeric quarter-grid BFS preserves the prior neighbor order and exact path results. Construction reserves routes, doors and people. Rooms have one service reservation; care needs surgeon+RN, scan a technologist, consultation/planning MD/NP/PA. A paired PA scenario requests a physician workstation review and uses real available time. Autonomous is an explicit fictional scenario setting, not a jurisdictional rule.

Reception holds one check-in reservation. A receptionist or compatible intake colleague must be physically at the station. The medical assistant must reach the support post to shorten check-in by two ticks; alternatively preparation support may shorten a sufficiently long room reset. Facilities performs actual travel, entry, work and return. A spill pauses equipment with visit progress retained. Readiness delays are6/10/12ticks after consult/scan/care; help only applies when actual travel/work can improve them. No universal speed bonus is supplied by recruitment.

Each elapsed visit tick is classified once: waiting, walking, staffed check-in, active service, handoff/review, equipment transfer/cloth clearance, or recovery. Waiting includes access delay, yielding and unavailable teams/equipment. Walking excludes waiting and follows actual routes/door transitions. Historical saves retain an explicit timing offset. Each arrival is completed, departed or still present. Completed-only waits exclude long-waiting departures and unfinished visitors; exports show all-arrival statistics, denominators, medians and tails.

Traits affect a named speed/fatigue tradeoff. Clinical protected breaks withdraw assigned capacity and include physical travel and16resting ticks. Idle fatigue recovery is0.08 per tick multiplied by1+number of lounges; this remaining simplified global recovery rule is a gameplay abstraction. Nonclinical protected-break behavior needs fuller modeling. The experience indicator is unvalidated; it is not a patient-satisfaction measure or moral score.

Two seats per waiting garden reserve independently of services. Sitting does not erase waiting. Seat access, rotation and two safe furniture layouts follow the actual platform. Occupied furniture/modules cannot be removed. Reassignment and construction withhold service until colleagues enter through the doorway. Pickup keeps visits and arrival priority intact; the paused green map is a cache, and the committed drop still uses authoritative validation.

Saves are device-local, versioned and validated at import. Legacy v2 remains untouched when migrating to v3. A single active writer protects against background-tab overwrites; a displaced-tab snapshot can be recovered in Shift settings. Continuing sandbox periods retain unfinished visits/routes/assignments, budget and fatigue; reports identify carried visits, exact session accounting and the latest12period summaries. Export individual reports before continuing if older detail is needed.

Counterfactuals replay identical exogenous arrivals within each pair. The exact schedule plus four paired variants show sensitivity, not statistical confidence or clinical validity. Policy/model changes must be disclosed. Nothing sends gameplay or assessment records to a server. Assessment items remain an unvalidated draft requiring educator review before evaluation.

## RC3 travel and opening

Route advance is3quarter-cells per tick (approximately1.2375m/s), shared by patients and staff. Neighborhood arrivals1,5and9form an opening queue; later arrivals are unchanged. This changes model timing/outcomes. Existing saves retain current visits and schedules. See [locomotion and opening verification](LOCOMOTION_RC3.md).
