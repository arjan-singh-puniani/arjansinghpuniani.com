import { describe, it, expect } from "vitest";
import {
  ReplicationEngine,
  complement,
  validPrimer,
  strandPosition,
  STAGES,
  STEP,
  type Stage,
} from "../src/simulation/engine";
function until(e: ReplicationEngine, stage: Stage) {
  for (let i = 0; i < 4000 && e.active.stage !== stage; i++) e.advance(STEP);
  expect(e.active.stage).toBe(stage);
}
function game() {
  const e = new ReplicationEngine();
  e.mode = "play";
  return e;
}
function delta() {
  const e = game();
  e.act("prime");
  until(e, "RFC_PCNA_LOADING");
  e.act("clamp");
  e.act("delta");
  return e;
}
function paired() {
  const e = delta();
  for (let i = 0; i < 4; i++)
    expect(e.act(complement[e.template(e.active.start - 31 - i)])).toBe(true);
  return e;
}
describe("human fork biology", () => {
  it("pairs A–T and G–C involutively", () => {
    expect(complement).toEqual({ A: "T", T: "A", C: "G", G: "C" });
    for (const b of Object.keys(complement) as (keyof typeof complement)[])
      expect(complement[complement[b]]).toBe(b);
  });
  it("synthesizes leading 5′→3′ toward increasing fork coordinates", () => {
    const e = new ReplicationEngine();
    e.advance(1);
    expect(e.leading).toBeGreaterThan(146);
    expect(e.leading).toBeLessThan(e.fork);
    expect(strandPosition(100, 20, "leading")).toBe(120);
  });
  it("synthesizes lagging 5′→3′ away from increasing fork coordinates", () => {
    const e = paired();
    e.advance(1);
    expect(e.active.tip).toBeLessThan(e.active.start);
    expect(strandPosition(150, 40, "lagging")).toBe(110);
  });
  it("gives antiparallel daughters opposite growth signs", () => {
    expect(Math.sign(strandPosition(0, 1, "leading"))).toBe(
      -Math.sign(strandPosition(0, 1, "lagging")),
    );
  });
  it("requires newly exposed template behind the fork", () => {
    expect(validPrimer(150, 150)).toBe(true);
    expect(validPrimer(300, 310)).toBe(true);
    expect(validPrimer(320, 310)).toBe(false);
    expect(validPrimer(250, 310)).toBe(false);
    expect(validPrimer(149, 150)).toBe(false);
    expect(game().act("prime", 200)).toBe(false);
  });
  it("repeatedly initiates 150 nt Okazaki fragments", () => {
    const e = new ReplicationEngine();
    e.advance(45);
    expect(e.fragments.length).toBeGreaterThan(3);
    expect(e.fragments.map((f) => f.start)).toEqual([150, 300, 450, 600, 750]);
  });
  it("rejects polymerase handoff before primer and clamp", () => {
    const e = game();
    expect(e.act("delta")).toBe(false);
    expect(e.active.polymerase).toBe(null);
    expect(() => e.transition(e.active, "POL_DELTA_ELONGATION")).toThrow();
  });
  it("loads PCNA only at an RNA–DNA junction", () => {
    const e = game();
    expect(e.act("clamp")).toBe(false);
    e.act("prime");
    until(e, "RFC_PCNA_LOADING");
    expect(e.active.rna).toBe(10);
    expect(e.active.dna).toBe(20);
    expect(e.act("clamp")).toBe(true);
    expect(e.active.pcna).toBe(true);
    expect(e.reactionATP).toBe(2);
    expect(e.act("clamp")).toBe(false);
    expect(e.reactionATP).toBe(2);
  });
  it("requires Pol δ for the lagging handoff", () => {
    const e = game();
    e.act("prime");
    until(e, "RFC_PCNA_LOADING");
    e.act("clamp");
    expect(e.act("epsilon")).toBe(false);
    expect(e.act("alpha")).toBe(false);
    expect(e.act("delta")).toBe(true);
  });
  it("extends incrementally without stretching DNA", () => {
    const e = paired(),
      before = e.active.dna;
    e.advance(0.5);
    expect(e.active.dna).toBeGreaterThan(before);
    expect(e.active.dna).toBeLessThan(140);
    expect(e.active.sequence.length).toBe(e.active.dna);
  });
  it("rejects premature processing and ligation", () => {
    const e = game();
    expect(e.act("process")).toBe(false);
    expect(e.act("ligate")).toBe(false);
    expect(e.active.nick).toBe(true);
    expect(e.active.primerRemoved).toBe(false);
  });
  it("makes mismatch a recoverable stall with proofreading", () => {
    const e = delta(),
      correct = complement[e.template(e.active.start - 31)];
    expect(e.act(correct === "A" ? "C" : "A")).toBe(false);
    const before = e.active.dna;
    e.advance(8);
    expect(e.active.dna).toBe(before);
    expect(e.act(correct)).toBe(false);
    expect(e.act("proofread")).toBe(true);
    expect(e.act(correct)).toBe(true);
    expect(e.paired).toBe(1);
  });
  it("converts the processed nick into a continuous complementary daughter", () => {
    const e = paired();
    until(e, "FRAGMENT_COMPLETED");
    expect(e.active.rna + e.active.dna).toBe(150);
    expect(e.act("ligate")).toBe(false);
    expect(e.act("process")).toBe(true);
    until(e, "NICK_READY");
    expect(e.active.rna).toBe(0);
    expect(e.active.primerRemoved).toBe(true);
    expect(e.active.nick).toBe(true);
    expect(e.act("ligate")).toBe(true);
    until(e, "MATURE_FRAGMENT");
    expect(e.active.nick).toBe(false);
    expect(e.active.sequence).toEqual(
      Array.from(
        { length: 150 },
        (_, i) => complement[e.template(e.active.start - i - 1)],
      ),
    );
    expect(e.replicated).toBe(150);
    expect(e.finished).toBe(true);
    expect(e.reactionATP).toBe(3);
  });
  it("computes fragment progress from substrate counts", () => {
    const e = game();
    expect(e.percent).toBe(0);
    e.act("prime");
    until(e, "RFC_PCNA_LOADING");
    expect(e.percent).toBe(20);
  });
  it("does not count dNTPs as ATP or double-count daughters", () => {
    const e = new ReplicationEngine();
    e.advance(18);
    expect(e.dntpUsed).toBeGreaterThan(e.atp * 3);
    expect(e.replicated).toBe(150);
    expect(e.replicated).not.toBe(300);
    expect(e.atp).toBe(e.motorATP + e.reactionATP);
  });
  it("replays deterministic events independently of frame partitioning", () => {
    const a = new ReplicationEngine(33),
      b = new ReplicationEngine(33);
    a.advance(30);
    for (let i = 0; i < 300; i++) b.advance(0.1);
    expect(a.events).toEqual(b.events);
    expect(a.fragments).toEqual(b.fragments);
    expect(a.atp).toBe(b.atp);
    expect(a.leading).toBe(b.leading);
    a.seek(30);
    expect(a.events).toEqual(b.events);
  });
  it("pauses and resumes without advancing while paused", () => {
    const e = new ReplicationEngine();
    e.paused = true;
    e.advance(10);
    expect(e.time).toBe(0);
    e.paused = false;
    e.advance(1);
    expect(e.time).toBe(1);
    e.reset();
    expect(e.time).toBe(0);
  });
  it("emits the full ordered pathway and rejects skipped stages", () => {
    const e = new ReplicationEngine();
    e.advance(18);
    expect(e.events.filter((x) => x.fragment === 1).map((x) => x.kind)).toEqual(
      STAGES.slice(1),
    );
    expect(() => e.transition(e.active, "LIGATION")).toThrow();
  });
});
