import { describe, expect, it } from "vitest";
import {
  DEFAULT_MODEL,
  LEADS,
  LEAD_FIELDS,
  bump,
  componentsAt,
  electrodePotentials,
  landmarks,
  leadVoltages,
  narrowQrsRule,
  qrsArea,
  validateModel,
  vectorAt,
} from "@/lib/reasonos/model";
import { frontalAxis, intervalMs } from "@/lib/reasonos/vector";

describe("shared frontal ECG source", () => {
  it("satisfies electrode algebra, augmented-lead identities and projections", () => {
    for (let x = -4; x <= 4; x++)
      for (let y = -4; y <= 4; y++) {
        const vector = [x / 3, y / 3] as const,
          p = electrodePotentials(vector),
          v = leadVoltages(vector);
        expect(p.RA + p.LA + p.LL).toBeCloseTo(0, 12);
        expect(v.I + v.III).toBeCloseTo(v.II, 12);
        expect(v.aVR + v.aVL + v.aVF).toBeCloseTo(0, 12);
        LEADS.forEach((lead) =>
          expect(v[lead]).toBeCloseTo(
            vector[0] * LEAD_FIELDS[lead][0] + vector[1] * LEAD_FIELDS[lead][1],
            12,
          ),
        );
      }
  });
  it("uses finite support and identical cycle timing for every representation", () => {
    const m = landmarks(DEFAULT_MODEL);
    expect(m.qrsEnd - m.qrsStart).toBe(DEFAULT_MODEL.qrs);
    expect(m.tEnd - m.qrsStart).toBe(DEFAULT_MODEL.qt);
    expect(m.qrsStart - m.pStart).toBe(DEFAULT_MODEL.pr);
    for (const t of [0, 50, 200, 235, 275, 320, 530, 800]) {
      expect(vectorAt(t, DEFAULT_MODEL)).toEqual(
        vectorAt(t + 2 * DEFAULT_MODEL.rr, DEFAULT_MODEL),
      );
      const c = componentsAt(t, DEFAULT_MODEL),
        v = vectorAt(t, DEFAULT_MODEL);
      expect(v[0]).toBeCloseTo(c.P[0] + c.QRS[0] + c.T[0], 12);
      expect(v[1]).toBeCloseTo(c.P[1] + c.QRS[1] + c.T[1], 12);
    }
    expect(bump(-1, 0, 80)).toBe(0);
    expect(bump(80, 0, 80)).toBe(0);
    expect(bump(40, 0, 80)).toBe(1);
    expect(() => validateModel({ ...DEFAULT_MODEL, rr: 400 })).toThrow();
  });
  it("rotates the entire QRS area without inventing an axis from one instantaneous sample", () => {
    const first = qrsArea(DEFAULT_MODEL),
      next = qrsArea({
        ...DEFAULT_MODEL,
        rotation: DEFAULT_MODEL.rotation + 90,
      });
    expect(next[0]).toBeCloseTo(-first[1], 10);
    expect(next[1]).toBeCloseTo(first[0], 10);
    const volts = leadVoltages(first);
    expect(frontalAxis(volts.I, volts.aVF).degrees).toBe(
      Math.round((Math.atan2(first[1], first[0]) * 180) / Math.PI),
    );
  });
  it("preserves the measured physical interval when paper speed changes", () => {
    for (const speed of [25, 50]) {
      const dx = (DEFAULT_MODEL.qrs * speed * 12) / 1000;
      expect(
        intervalMs(dx, {
          speedMmPerSecond: speed,
          gainMmPerMv: 10,
          pixelsPerMm: 12,
        }),
      ).toBe(90);
    }
  });
  it("admits only claims supported by current calibrated intervals and their full error bound", () => {
    const evidence = {
      duration: 90,
      uncertainty: 4,
      calibrated: true,
      currentSource: true,
    };
    expect(narrowQrsRule(evidence).accepted).toBe(true);
    expect(narrowQrsRule({ ...evidence, duration: 119 }).accepted).toBe(false);
    expect(narrowQrsRule({ ...evidence, calibrated: false }).accepted).toBe(
      false,
    );
    expect(narrowQrsRule({ ...evidence, currentSource: false }).accepted).toBe(
      false,
    );
    expect(narrowQrsRule({ ...evidence, uncertainty: -2 }).accepted).toBe(
      false,
    );
  });
});
