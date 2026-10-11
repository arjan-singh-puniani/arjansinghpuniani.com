import { describe, it, expect } from "vitest";
import { ReplicationEngine } from "../src/simulation/engine";

describe("manipulating a running fork", () => {
  it("keeps copying during exploration and respects pause", () => {
    const e = new ReplicationEngine();
    e.mode = "explore";
    e.advance(2);
    expect(e.fork).toBe(178);
    e.paused = true;
    e.advance(2);
    expect(e.fork).toBe(178);
  });
  it("stops new unwinding without blocking already primed DNA, then resumes without jumping", () => {
    const e = new ReplicationEngine();
    e.advance(6);
    const fork = e.fork;
    e.setHeld("cmg", true);
    e.advance(12);
    expect(e.fork).toBe(fork);
    expect(e.fragments[0].stage).toBe("MATURE_FRAGMENT");
    expect(e.fragments).toHaveLength(1);
    e.setHeld("cmg", false);
    e.advance(1);
    expect(e.fork).toBe(fork + 14);
  });
  it("leaves exposed leading template when Pol ε is removed and resumes at a bounded rate", () => {
    const e = new ReplicationEngine();
    e.advance(2);
    const leading = e.leading;
    e.setHeld("epsilon", true);
    e.advance(5);
    expect(e.leading).toBe(leading);
    expect(e.fork - 4 - e.leading).toBe(70);
    e.setHeld("epsilon", false);
    e.advance(1);
    expect(e.leading).toBe(leading + 14);
    e.setHeld("cmg", true);
    e.advance(6);
    expect(e.leading).toBe(e.fork - 4);
  });
  it("halts lagging extension and preserves the growing end when Pol δ is removed", () => {
    const e = new ReplicationEngine();
    e.advance(6);
    const tip = e.active.tip,
      dna = e.active.dna;
    e.setHeld("delta", true);
    e.advance(8);
    expect(e.fragments[0].dna).toBe(dna);
    expect(e.fragments[0].tip).toBe(tip);
    expect(e.leading).toBeGreaterThan(200);
    e.setHeld("delta", false);
    e.advance(2);
    expect(e.fragments[0].tip).toBeLessThan(tip);
  });
  it("accumulates clean unsealed nicks with ligase absent, then seals them on restoration", () => {
    const e = new ReplicationEngine();
    e.setHeld("ligase", true);
    e.advance(40);
    const unfinished = e.fragments.filter((f) => f.stage === "NICK_READY");
    expect(unfinished.length).toBeGreaterThanOrEqual(3);
    expect(e.dntpUsed).toBeGreaterThan(700);
    expect(
      unfinished.every((f) => f.primerRemoved && f.nick && f.rna === 0),
    ).toBe(true);
    e.setHeld("ligase", false);
    e.advance(2);
    expect(unfinished.every((f) => !f.nick)).toBe(true);
  });
  it("prevents fresh priming but permits an existing fragment to mature", () => {
    const e = new ReplicationEngine();
    e.advance(6);
    e.setHeld("alpha", true);
    e.advance(20);
    expect(e.fragments[0].stage).toBe("MATURE_FRAGMENT");
    expect(e.fragments.slice(1).every((f) => f.rna === 0 && f.dna === 0)).toBe(
      true,
    );
  });
  it("holds the flap before a clean nick can form when FEN1 is absent", () => {
    const e = new ReplicationEngine();
    e.setHeld("fen1", true);
    e.advance(25);
    expect(e.fragments[0].stage).toBe("PRIMER_PROCESSING");
    expect(e.fragments[0].primerRemoved).toBe(false);
    e.setHeld("fen1", false);
    e.advance(4);
    expect(e.fragments[0].stage).toBe("MATURE_FRAGMENT");
  });
  it("replays a baseline handoff while retaining the selected perturbation and clears it on reset", () => {
    const e = new ReplicationEngine();
    e.setHeld("delta", true);
    e.seek(6);
    expect(e.held.has("delta")).toBe(true);
    const dna = e.active.dna;
    e.advance(2);
    expect(e.active.dna).toBe(dna);
    e.reset();
    expect(e.held.size).toBe(0);
  });
});
