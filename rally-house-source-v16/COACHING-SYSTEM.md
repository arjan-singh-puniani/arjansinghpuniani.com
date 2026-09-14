# Coaching System

The current coaching loop is centered on Mika's forehand preparation.

The player can open Mika's coaching panel and choose a drill. Drills have a named technical fit, a progress value and descriptive cue. A drill that matches the active technical problem yields the stronger result.

Starting a lesson:

1. raises Mika's persistent development value;
2. updates her live `Character` development parameter;
3. raises coach XP;
4. records a coaching interaction/memory;
5. moves June and Mika to court;
6. starts the live RallySystem once they are in position;
7. focuses the camera gently on court;
8. creates a breakthrough story beat when Mika crosses the configured progress threshold.

Mika's development affects actual tennis skill and forehand timing through `Character.tennisSkill()` and `strokeStyle()`, so coaching changes more than UI text.

The current limitation is that diagnosis is still mostly menu-authored rather than inferred from a large history of measured shot errors. That remains the highest-value gameplay expansion after visual validation of v8.
