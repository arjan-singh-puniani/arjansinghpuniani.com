import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  attemptTransformation,
  initialSnapshot,
  replayTrace,
  type Provenance,
} from "@/lib/reasonos/kernel";
import { canonicalize, sha256 } from "@/lib/reasonos/core/canonical";
import { matchEvidencePath } from "@/lib/reasonos/reference-ecg-plugin";
import type { StateId } from "@/lib/reasonos/core/types";

const p: Provenance = {
  source: "Synthetic test",
  method: "Source coordinate measurement",
  verification: "synthetic-reference",
  witnessType: "application-calculated",
};
const key = JSON.stringify({ speed: 25, gain: 10, pixelsPerMm: 12 });
function calibrated() {
  return attemptTransformation(initialSnapshot(), {
    operator: "Calibrate",
    actor: "system",
    domain: "ecg",
    inputStateIds: ["state-000-source"],
    summary: "25 mm/s",
    provenance: p,
    evidenceRefs: [`source=${key}`],
  });
}
function measured(duration = 90) {
  const c = calibrated();
  return attemptTransformation(c, {
    operator: "Measure",
    actor: "system",
    domain: "ecg",
    inputStateIds: [c.states.at(-1)!.id],
    summary: "Recorded QRS",
    provenance: p,
    evidenceRefs: [
      `source=${key}`,
      "kind=QRS",
      "startMs=200",
      `endMs=${200 + duration}`,
      "intervalMs=90",
      "uncertaintyMs=4",
    ],
  });
}
describe("supplied ReasonOS kernel and ECG plugin", () => {
  it("rejects invalid calibration scales at the domain boundary", () => {
    for (const scale of [
      { speed: -25, gain: 10, pixelsPerMm: 12 },
      { speed: 25, gain: 0, pixelsPerMm: 12 },
      { speed: 25, gain: 10 },
      { speed: 25, gain: 10, pixelsPerMm: null },
    ]) {
      const snapshot = attemptTransformation(initialSnapshot(), {
        operator: "Calibrate",
        actor: "system",
        domain: "ecg",
        inputStateIds: ["state-000-source"],
        summary: "Invalid calibration",
        provenance: p,
        evidenceRefs: [`source=${JSON.stringify(scale)}`],
        domainAccepted: true,
      });
      expect(snapshot.trace.at(-1)?.accepted).toBe(false);
      expect(snapshot.states).toHaveLength(1);
    }
  });
  it("matches an independent SHA-256 implementation and freezes nested trace records", () => {
    const value = { b: [1, 2], a: "source" };
    expect(sha256(value)).toBe(
      createHash("sha256").update(canonicalize(value)).digest("hex"),
    );
    const snapshot = measured();
    expect(Object.isFrozen(snapshot.journal.entries[0].event)).toBe(true);
    expect(() => {
      snapshot.trace[0].summary = "altered";
    }).toThrow();
  });
  it("allows the original ECG plugin to reject a measurement even if the UI requests admission", () => {
    const snapshot = attemptTransformation(initialSnapshot(), {
      operator: "Measure",
      actor: "system",
      domain: "ecg",
      inputStateIds: ["state-000-source"],
      summary: "Unsupported interval",
      provenance: p,
      domainAccepted: true,
      evidenceRefs: [`source=${key}`, "startMs=200", "endMs=290"],
    });
    expect(snapshot.trace[0].accepted).toBe(false);
    expect(
      snapshot.trace[0].domainConstraintResults.find(
        (c) => c.name === "ECG.MeasurementReady",
      )?.passed,
    ).toBe(false);
    const changed = structuredClone(snapshot.trace);
    changed[0].summary = "altered rejected attempt";
    expect(() => replayTrace(changed)).toThrow();
  });
  it("recomputes duration from raw endpoints and rejects an unsupported narrow-QRS claim", () => {
    const s = measured(150);
    expect(s.trace.at(-1)?.accepted).toBe(true);
    const claim = attemptTransformation(s, {
      operator: "Hypothesize",
      actor: "system",
      domain: "ecg",
      inputStateIds: [s.states.at(-1)!.id],
      summary: "QRS below 120",
      provenance: p,
      domainAccepted: true,
      evidenceRefs: [`source=${key}`],
    });
    expect(claim.trace.at(-1)?.accepted).toBe(false);
    expect(claim.states).toHaveLength(s.states.length);
  });
  it("verifies the actual journal and rejects altered record projections and hash chains", () => {
    const s = measured();
    expect(replayTrace(s.trace, s.journal).states).toEqual(s.states);
    const changed = structuredClone(s.trace);
    changed[0].summary = "altered";
    expect(() => replayTrace(changed)).toThrow();
    const journal = structuredClone(s.journal);
    const first = journal.entries[0] as unknown as { eventHash: string };
    first.eventHash = "0".repeat(64);
    expect(() => replayTrace(s.trace, journal)).toThrow();
  });
  it("gives full coverage to a disjoint complete alternative path from the supplied graph", () => {
    const available = [
      {
        stateId: "i" as StateId,
        assertions: [
          { conceptId: "lead-i-polarity", polarity: "present" as const },
        ],
      },
      {
        stateId: "f" as StateId,
        assertions: [
          { conceptId: "avf-polarity", polarity: "present" as const },
        ],
      },
      {
        stateId: "a" as StateId,
        assertions: [{ conceptId: "axis-angle", polarity: "present" as const }],
      },
    ];
    const quadrant = matchEvidencePath({
      patternId: "normal axis",
      available,
      selectedStateIds: ["i", "f"] as StateId[],
    });
    const angle = matchEvidencePath({
      patternId: "normal axis",
      available,
      selectedStateIds: ["a"] as StateId[],
    });
    expect(quadrant.score).toBe(1);
    expect(angle.score).toBe(1);
    expect(quadrant.matchedPathId).not.toBe(angle.matchedPathId);
    expect(angle.matchedPathValidationStatus).toBe("candidate");
  });
});
