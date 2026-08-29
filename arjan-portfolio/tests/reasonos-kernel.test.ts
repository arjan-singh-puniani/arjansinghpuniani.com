import { describe, expect, it } from "vitest";
import { attemptTransformation, initialSnapshot, replayTrace, type Provenance } from "@/lib/reasonos/kernel";

const provenance: Provenance = { source: "synthetic", method: "test", verification: "user-confirmed", witnessType: "learner-derived" };

describe("ReasonOS kernel", () => {
  it("adds state for an accepted transformation", () => {
    const snapshot = attemptTransformation(initialSnapshot(), { operator: "Inspect", actor: "learner", inputStateIds: ["state-000-source"], summary: "inspected", provenance });
    expect(snapshot.trace).toHaveLength(1);
    expect(snapshot.states).toHaveLength(2);
    expect(snapshot.trace[0].accepted).toBe(true);
  });

  it("keeps rejected attempts without adding state", () => {
    const snapshot = attemptTransformation(initialSnapshot(), { operator: "Challenge", actor: "learner", inputStateIds: ["state-000-source"], summary: "unsupported", provenance, domainAccepted: false });
    expect(snapshot.trace[0].accepted).toBe(false);
    expect(snapshot.trace[0].outputStateId).toBeUndefined();
    expect(snapshot.states).toHaveLength(1);
  });

  it("rejects missing inputs", () => {
    const snapshot = attemptTransformation(initialSnapshot(), { operator: "Inspect", actor: "learner", inputStateIds: ["missing"], summary: "invalid", provenance });
    expect(snapshot.trace[0].accepted).toBe(false);
    expect(snapshot.trace[0].kernelConstraintResults.find((result) => result.name === "InputsExist")?.passed).toBe(false);
  });

  it("replays the same accepted state identifiers", () => {
    const first = attemptTransformation(initialSnapshot(), { operator: "Inspect", actor: "learner", inputStateIds: ["state-000-source"], summary: "inspected", provenance });
    const second = attemptTransformation(first, { operator: "Measure", actor: "learner", inputStateIds: [first.states.at(-1)!.id], summary: "100 ms", provenance });
    expect(replayTrace(second.trace).states).toEqual(second.states);
  });

  it("produces deterministic identifiers from identical recorded inputs", () => {
    const attempt = { operator: "Inspect" as const, actor: "learner" as const, inputStateIds: ["state-000-source"], summary: "inspected", provenance };
    expect(attemptTransformation(initialSnapshot(), attempt)).toEqual(attemptTransformation(initialSnapshot(), attempt));
  });

  it("creates revision lineage without mutating the prior state", () => {
    const first = attemptTransformation(initialSnapshot(), { operator: "Hypothesize", actor: "learner", inputStateIds: ["state-000-source"], summary: "initial", provenance });
    const prior = first.states.at(-1)!;
    const revised = attemptTransformation(first, { operator: "Revise", actor: "learner", inputStateIds: [prior.id], summary: "revised", provenance, revisionOf: prior.id });
    expect(revised.states.find((state) => state.id === prior.id)?.summary).toBe("initial");
    expect(revised.trace.at(-1)?.revisionOf).toBe(prior.id);
  });
});
