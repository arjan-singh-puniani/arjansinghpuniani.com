# Championship in Rally House

Select a free member and choose **Challenge to Match**. The optional opening practice yields to this request; committed lessons and matches keep their reservations. Both players walk through the existing club to their baselines. A 1.9-second camera orbit descends into the same court.

Move with WASD or arrow keys; Space serves/swings; Escape or **Exit match** returns to the club. Touch devices have a movement pad and Swing button. First to seven, win by two. Match results offer Rematch and Return to Club.

`ActivitySystem` owns reservations. `ChampionshipController` owns scoring and phases. `InteractiveMatchSystem` consumes `MatchInput`, uses Character's animated string-bed geometry, and launches through the existing BallPhysics. The camera rig saves and restores actual/desired framing and spring velocities. The HUD owns presentation only. All tuning lives in `ChampionshipTuning.ts`; opponent differences are data in `ChampionshipOpponents.ts`.

Early returns favor rhythm and readability. Ball convergence near the strike is assisted; sound and outgoing launch still require proximity to the live animated racket. Good-contact bounce targets have safe margins. A legal first bounce followed by an unreturned escape awards the striker the point. Only compromised frame trajectories intentionally risk going out.

Club lighting eases into focused court lighting and returns afterward. Input resets on blur/visibility changes; exit works during approach as well as play. New deterministic and four-viewport browser checks cover the mode. Human enjoyment and physical-device audio/touch approval remain open in PLAYTEST-CHECKLIST.md.
