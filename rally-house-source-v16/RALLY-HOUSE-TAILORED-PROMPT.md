# Rally House — event demo execution brief

Apply this brief to the existing Rally House game and its portfolio page. The goal is a memorable, reliable SF Tech Week demonstration: a living miniature tennis club reveals itself, responds to the visitor, and turns the same court into satisfying arcade tennis. Preserve the club reveal, the Championship camera orbit, and the user's selected heavier contact pauses and camera punch.

Work sequentially as architect, engineer, reviewer, and optimizer. Each role must use evidence from the previous role. An independent review should challenge the implementation before it is pushed.

## Architect

Verify the canonical source, compiled game, portfolio embed, branch, release path, and existing validation. Preserve unrelated dirty work. Map the actual data flow from input through fixed-step simulation, racket contact, presentation, UI, and local persistence. Identify concrete root causes in the current product, with file references and reproducible triggers. Rank them by player impact, frequency, event-demo value, regression risk, and implementation cost. Use the existing client architecture; introduce services, APIs, accounts, caching, or schemas only if a demonstrated requirement needs them.

## Engineer

Reproduce the highest-value failures before fixing them. Make focused, readable changes at their source. Preserve authoritative contact, completed-event memory, character identity, and original assets. Keep simulation, input, camera, audio, rendering, and UI responsibilities clear. Handle interruption, loading, recovery, responsive layouts, keyboard, touch, focus, and reduced motion wherever the changed flow requires them. Extend shared components only where actual reuse warrants it. Research unresolved technical choices using primary documentation, then run and inspect the result.

## Reviewer

Review the actual diff and running product independently. Challenge assumptions, edge cases, and claims. Check lifecycle cleanup, physical contact, input ownership, camera restoration, saved data, accessible controls, and deployment artifacts. Report actionable findings with precise triggers and file references. Fix material findings and rerun the affected checks.

## Optimizer

Measure actual frame times and repeated-session resource behavior. Inspect hot paths and lifecycle work, and optimize only bottlenecks supported by evidence. Compare meaningful alternatives when tuning changes the experience. Preserve the chosen game feel. Explain the limits of short browser trials, automated play, and device coverage.

## Execution and delivery

Use the loop: audit → reproduce → implement → run → inspect → compare → review → repair → validate. Keep an evidence-based decision log. Run the game suites, portfolio checks, release synchronization, and browser flows appropriate to the changes. Capture actual gameplay, including the opening club, Championship, return, and relevant phone layouts. Record baseline and final results separately.

Push changes only after the required checks pass, and update the reviewable pull request. Report what improved, why it improved, what was tested, and remaining human/device gates. Do not equate passing tests with fun or promise studio hiring. A human playtest judges whether the experience earns another rally.
