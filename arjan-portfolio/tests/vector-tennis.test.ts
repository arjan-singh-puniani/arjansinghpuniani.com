import { describe, expect, it } from "vitest";
import { COURT_GROUND, createArcadeBall, createBall, isFiniteArcadeBall, isFiniteBall, resolveRacketContact, stepArcadeBallInPlace, stepBall, strikeArcadeBall } from "@/lib/vector-tennis";

describe("vector tennis physics", () => {
  it("keeps a normal feed finite", () => {
    let ball = createBall();
    for (let frame = 0; frame < 900; frame += 1) ball = stepBall(ball, 1 / 120);
    expect(isFiniteBall(ball)).toBe(true);
  });

  it("recovers from invalid input", () => {
    const ball = stepBall({ ...createBall(), vx: Number.NaN }, 1 / 120);
    expect(isFiniteBall(ball)).toBe(true);
    expect(ball.active).toBe(true);
  });

  it("keeps a bounce above the court plane", () => {
    const ball = stepBall({ ...createBall(), y: COURT_GROUND + 0.01, vy: 0.4 }, 1 / 120);
    expect(ball.y).toBe(COURT_GROUND);
    expect(ball.vy).toBeLessThan(0);
  });

  it("turns an incoming ball into an outgoing shot on contact", () => {
    const result = resolveRacketContact(
      { ...createBall(), x: 0.25, y: 0.68, vx: -0.45 },
      { x: 0.25, y: 0.68, angle: -0.2, headSpeed: 1.2, mode: "topspin" },
    );
    expect(result).not.toBeNull();
    expect(result?.ball.vx).toBeGreaterThan(0);
    expect(result?.ball.spin).toBeGreaterThan(0);
  });

  it("curves a slice and keeps the arcade model finite", () => {
    const sliced = strikeArcadeBall(createArcadeBall(), "player", "slice", -0.7, 0.8, 0.9);
    const noCurve = { ...sliced, sidespin: 0 };
    for (let frame = 0; frame < 20; frame += 1) {
      stepArcadeBallInPlace(sliced, 1 / 120);
      stepArcadeBallInPlace(noCurve, 1 / 120);
    }
    expect(isFiniteArcadeBall(sliced)).toBe(true);
    expect(Math.abs(sliced.vx - noCurve.vx)).toBeGreaterThan(0.03);
  });

  it("makes topspin dip more aggressively than a flat ball", () => {
    const flat = strikeArcadeBall(createArcadeBall(), "player", "flat", 0, 0.7, 1);
    const topspin = strikeArcadeBall(createArcadeBall(), "player", "topspin", 0, 0.7, 1);
    flat.vy = topspin.vy;
    for (let frame = 0; frame < 25; frame += 1) {
      stepArcadeBallInPlace(flat, 1 / 120);
      stepArcadeBallInPlace(topspin, 1 / 120);
    }
    expect(topspin.vy).toBeLessThan(flat.vy);
  });

  it.each(["flat", "topspin", "slice"] as const)("gives a normal %s enough net clearance", (shot) => {
    const ball = strikeArcadeBall({ ...createArcadeBall(), x: 0, z: 0.48, height: 0 }, "player", shot, 0.2, 0.7, 0.75);
    while (ball.z > 0 && ball.active) stepArcadeBallInPlace(ball, 1 / 240);
    expect(ball.height).toBeGreaterThan(0.2);
  });

  it("makes the three arcade shots measurably distinct", () => {
    const source = { ...createArcadeBall(), x: 0, z: 0.55, height: 0.18 };
    const flat = strikeArcadeBall(source, "player", "flat", 0.5, 0.8, 0.9);
    const topspin = strikeArcadeBall(source, "player", "topspin", 0.5, 0.8, 0.9);
    const slice = strikeArcadeBall(source, "player", "slice", 0.5, 0.8, 0.9);
    expect(Math.abs(flat.vz)).toBeGreaterThan(Math.abs(topspin.vz));
    expect(topspin.topspin).toBeGreaterThan(10);
    expect(Math.abs(slice.sidespin)).toBeGreaterThan(8);
  });
});
