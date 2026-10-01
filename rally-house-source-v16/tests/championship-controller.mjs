import {CHAMPIONSHIP_TUNING as tuning} from '../dist/tennis/ChampionshipTuning.js';
import assert from 'node:assert/strict';
import { ChampionshipController } from '../dist/tennis/ChampionshipController.js';
import { CHAMPIONSHIP_OPPONENTS } from '../dist/tennis/ChampionshipOpponents.js';

function advance(controller, seconds, reducedMotion = false) {
  const dt = 1 / 60;
  const steps = Math.ceil(seconds / dt);
  for (let i = 0; i < steps; i += 1) controller.update(dt, reducedMotion);
}

{
  const c = new ChampionshipController();
  assert.equal(c.phase, 'inactive');
  assert.equal(c.cameraMode, 'club');

  assert.equal(c.beginChallenge(CHAMPIONSHIP_OPPONENTS.leo), true);
  assert.equal(c.phase, 'challenge');
  assert.equal(c.beginChallenge(CHAMPIONSHIP_OPPONENTS.mika), false);

  assert.equal(c.acceptChallenge(), true);
  assert.equal(c.phase, 'intro');
  assert.equal(c.cameraMode, 'matchIntro');

  advance(c, tuning.introSeconds+.05);
  assert.equal(c.phase, 'ready');
  assert.equal(c.cameraMode, 'behindPlayer');

  advance(c, 0.85);
  assert.equal(c.phase, 'serving');

  assert.equal(c.markServeStarted(), true);
  assert.equal(c.phase, 'rally');

  for (let i = 0; i < 12; i += 1) c.recordRallyContact();
  assert.equal(c.currentRally, 12);
  assert.equal(c.bestRally, 12);

  assert.equal(
    c.resolvePoint({ winner: 'player', reason: 'winner', rallyLength: 12 }),
    true,
  );
  assert.deepEqual(c.score, { player: 1, opponent: 0 });
  assert.equal(c.phase, 'pointResult');

  advance(c, tuning.pointResultSeconds+.05);
  assert.equal(c.phase, 'serving');

  // Complete a 7-1 match.
  for (let point = 0; point < 6; point += 1) {
    c.markServeStarted();
    c.recordRallyContact();
    c.resolvePoint({ winner: 'player', reason: 'winner', rallyLength: 1 });
    if (point < 5) advance(c, tuning.pointResultSeconds+.05);
  }

  assert.equal(c.phase, 'matchResult');
  assert.deepEqual(c.score, { player: 7, opponent: 0 });

  assert.equal(c.rematch(), true);
  assert.equal(c.phase, 'ready');
  assert.deepEqual(c.score, { player: 0, opponent: 0 });

  assert.equal(c.requestExit(), true);
  assert.equal(c.phase, 'exiting');
  advance(c, 0.9);
  assert.equal(c.phase, 'inactive');
  assert.equal(c.cameraMode, 'club');
  assert.equal(c.opponent, null);
}

{
  // Reduced motion should collapse the cinematic wait without skipping states.
  const c = new ChampionshipController();
  c.beginChallenge(CHAMPIONSHIP_OPPONENTS.mika);
  c.acceptChallenge();
  advance(c, 0.1, true);
  assert.equal(c.phase, 'ready');
}

console.log('ChampionshipController tests passed.');
