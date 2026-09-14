# Simulation Overview

Rally House combines several small systems rather than one monolithic AI controller.

- `GameClock`: deterministic time/day progression.
- `ScheduleSystem`: recurring member routines and destinations.
- `RelationshipSystem`: player↔member and member↔member familiarity, warmth, trust, rivalry and semantic memories.
- `EmergentSocialSystem`: state-dependent social opportunities such as Mika/Leo rallies and rain-driven indoor moments.
- `ClubLifeSystem`: authored club beats and scrapbook history.
- `DailyGoalsSystem`: optional gentle intentions without streak pressure.
- `RallySystem` + `BallPhysics`: contact-timed strokes, ballistic flight, bounce, net and errors.
- `World`: rooms, weather, lighting, interactive objects, decorations and visual life.
- `Character`: schedules/intent translated into movement, acting and tennis animation.

The design goal is readable emergence: enough autonomy for unexpected combinations, but enough authored structure that the club does not devolve into random wandering.
