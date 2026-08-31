export type ShotMode = "flat" | "topspin" | "slice";

export type BallState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
  bounces: number;
  age: number;
  active: boolean;
};

export type RacketState = {
  x: number;
  y: number;
  angle: number;
  headSpeed: number;
  mode: ShotMode;
};

export type ContactResult = {
  ball: BallState;
  quality: "Sweet spot" | "Off-center" | "Frame";
  offset: number;
  contactX: number;
  contactY: number;
};

export const COURT_GROUND = 0.82;
const RACKET_HALF_LENGTH = 0.075;
const CONTACT_RADIUS = 0.035;

export function createBall(): BallState {
  return { x: 0.84, y: 0.23, vx: -0.5, vy: 0.015, spin: 0, bounces: 0, age: 0, active: true };
}

export function isFiniteBall(ball: BallState) {
  return Object.values(ball).every((value) => typeof value === "boolean" || Number.isFinite(value));
}

export function stepBall(ball: BallState, dt: number): BallState {
  return stepBallInPlace({ ...ball }, dt);
}

export function stepBallInPlace(ball: BallState, dt: number): BallState {
  if (!ball.active) return ball;
  if (!isFiniteBall(ball) || !Number.isFinite(dt) || dt <= 0) {
    Object.assign(ball, createBall());
    return ball;
  }
  const drag = Math.pow(0.9975, dt * 120);
  ball.vy += (0.46 + ball.spin * ball.vx * 0.014) * dt;
  ball.vx *= drag;
  ball.vy *= drag;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.age += dt;

  if (ball.y >= COURT_GROUND && ball.vy > 0) {
    ball.y = COURT_GROUND;
    ball.vy = -ball.vy * Math.max(0.5, 0.72 - Math.min(Math.abs(ball.spin) * 0.012, 0.14));
    ball.vx += ball.spin * 0.008;
    ball.spin *= 0.8;
    ball.bounces += 1;
  }
  if (ball.x < -0.12 || ball.x > 1.14 || ball.y < -0.25 || ball.age > 7 || ball.bounces > 3) ball.active = false;
  if (!isFiniteBall(ball)) Object.assign(ball, createBall());
  return ball;
}

export function resolveRacketContact(ball: BallState, racket: RacketState): ContactResult | null {
  if (!ball.active || !isFiniteBall(ball) || !Number.isFinite(racket.headSpeed) || racket.headSpeed < 0.12) return null;

  const tangentX = -Math.sin(racket.angle);
  const tangentY = Math.cos(racket.angle);
  const relativeX = ball.x - racket.x;
  const relativeY = ball.y - racket.y;
  const offset = Math.max(-RACKET_HALF_LENGTH, Math.min(RACKET_HALF_LENGTH, relativeX * tangentX + relativeY * tangentY));
  const closestX = racket.x + tangentX * offset;
  const closestY = racket.y + tangentY * offset;
  const distance = Math.hypot(ball.x - closestX, ball.y - closestY);
  if (distance > CONTACT_RADIUS || ball.vx > 0.1) return null;

  const normalizedOffset = offset / RACKET_HALF_LENGTH;
  const quality: ContactResult["quality"] = Math.abs(normalizedOffset) < 0.32 ? "Sweet spot" : Math.abs(normalizedOffset) < 0.76 ? "Off-center" : "Frame";
  const stability = quality === "Sweet spot" ? 1 : quality === "Off-center" ? 0.82 : 0.62;
  const modeSpeed = racket.mode === "flat" ? 1.08 : racket.mode === "topspin" ? 0.96 : 0.9;
  const speed = (0.48 + racket.headSpeed * 0.24 + Math.abs(ball.vx) * 0.16) * stability * modeSpeed;
  const launchAngle = racket.angle + normalizedOffset * 0.18 + (racket.mode === "topspin" ? -0.08 : racket.mode === "slice" ? -0.16 : 0);
  const brush = racket.mode === "topspin" ? 5.4 : racket.mode === "slice" ? -4.2 : 0.6;
  const spin = brush * (0.7 + racket.headSpeed * 0.28) + normalizedOffset * 1.6;
  const outgoing: BallState = {
    ...ball,
    x: closestX + Math.cos(launchAngle) * CONTACT_RADIUS,
    y: closestY + Math.sin(launchAngle) * CONTACT_RADIUS,
    vx: Math.max(0.22, speed * Math.cos(launchAngle)),
    vy: speed * Math.sin(launchAngle),
    spin,
    bounces: 0,
    age: 0,
  };
  return { ball: isFiniteBall(outgoing) ? outgoing : createBall(), quality, offset: normalizedOffset, contactX: closestX, contactY: closestY };
}

export function predictTrajectory(ball: BallState, steps = 70, dt = 1 / 60) {
  const points: Array<{ x: number; y: number }> = [];
  let projected = { ...ball };
  for (let index = 0; index < steps && projected.active; index += 1) {
    projected = stepBall(projected, dt);
    points.push({ x: projected.x, y: projected.y });
  }
  return points;
}

export function fillTrajectory(ball: BallState, buffer: Float32Array, steps = 70, dt = 1 / 60) {
  const projected = { ...ball };
  const limit = Math.min(steps, Math.floor(buffer.length / 2));
  let count = 0;
  for (let index = 0; index < limit && projected.active; index += 1) {
    stepBallInPlace(projected, dt);
    buffer[index * 2] = projected.x;
    buffer[index * 2 + 1] = projected.y;
    count += 1;
  }
  return count;
}

export type ArcadeSide = "player" | "rival";
export type ArcadeShot = "flat" | "topspin" | "slice";

export type ArcadeBallState = {
  x: number;
  z: number;
  height: number;
  vx: number;
  vz: number;
  vy: number;
  topspin: number;
  sidespin: number;
  bounces: number;
  lastHit: ArcadeSide;
  active: boolean;
};

export function createArcadeBall(server: ArcadeSide = "rival"): ArcadeBallState {
  const direction = server === "player" ? -1 : 1;
  return {
    x: server === "player" ? -0.18 : 0.18,
    z: server === "player" ? 0.7 : -0.7,
    height: 0.5,
    vx: 0.16 * direction,
    vz: 1.42 * direction,
    vy: 0.82,
    topspin: 1.1,
    sidespin: 0,
    bounces: 0,
    lastHit: server,
    active: true,
  };
}

export function isFiniteArcadeBall(ball: ArcadeBallState) {
  return Object.values(ball).every((value) => typeof value === "boolean" || typeof value === "string" || Number.isFinite(value));
}

export function stepArcadeBallInPlace(ball: ArcadeBallState, dt: number) {
  if (!ball.active) return ball;
  if (!isFiniteArcadeBall(ball) || !Number.isFinite(dt) || dt <= 0) {
    Object.assign(ball, createArcadeBall());
    return ball;
  }

  // Compact arcade model: Magnus-like curve, topspin dip, drag, and spin-sensitive bounce.
  const drag = Math.pow(0.998, dt * 120);
  ball.vx += ball.sidespin * 0.075 * dt;
  ball.vy -= (3.05 + Math.max(0, ball.topspin) * 0.12) * dt;
  ball.vx *= drag;
  ball.vz *= drag;
  ball.x += ball.vx * dt;
  ball.z += ball.vz * dt;
  ball.height += ball.vy * dt;

  if (ball.height <= 0 && ball.vy < 0) {
    ball.height = 0;
    ball.vy = -ball.vy * Math.max(0.52, 0.72 - Math.abs(ball.topspin) * 0.018);
    ball.vx += ball.sidespin * 0.045;
    ball.vz *= 1 + Math.max(0, ball.topspin) * 0.012;
    ball.topspin *= 0.74;
    ball.sidespin *= 0.76;
    ball.bounces += 1;
  }

  if (Math.abs(ball.x) > 1.32 || Math.abs(ball.z) > 1.38 || ball.bounces > 1) ball.active = false;
  if (!isFiniteArcadeBall(ball)) Object.assign(ball, createArcadeBall());
  return ball;
}

export function strikeArcadeBall(
  ball: ArcadeBallState,
  side: ArcadeSide,
  shot: ArcadeShot,
  aimX: number,
  charge: number,
  timing: number,
): ArcadeBallState {
  const direction = side === "player" ? -1 : 1;
  const cleanTiming = Math.max(0, Math.min(1, timing));
  const cleanCharge = Math.max(0, Math.min(1, charge));
  const pace = (1.58 + cleanCharge * 0.72 + cleanTiming * 0.28) * (shot === "flat" ? 1.12 : shot === "slice" ? 0.9 : 1);
  const target = Math.max(-0.84, Math.min(0.84, aimX));
  const distance = side === "player" ? ball.z + 0.76 : 0.76 - ball.z;
  const travel = Math.max(1.15, Math.abs(distance));
  const next = {
    ...ball,
    vx: (target - ball.x) * (pace / travel) + (shot === "slice" ? (side === "player" ? -0.22 : 0.22) : 0),
    vz: pace * direction,
    vy: shot === "flat" ? 0.62 : shot === "topspin" ? 0.9 : 0.72,
    topspin: shot === "topspin" ? 7.2 + cleanCharge * 3.2 : shot === "slice" ? -2.8 : 1.1,
    sidespin: shot === "slice" ? (side === "player" ? 4.7 : -4.7) : (target - ball.x) * 1.2,
    bounces: 0,
    lastHit: side,
    active: true,
  } satisfies ArcadeBallState;
  return isFiniteArcadeBall(next) ? next : createArcadeBall(side);
}
