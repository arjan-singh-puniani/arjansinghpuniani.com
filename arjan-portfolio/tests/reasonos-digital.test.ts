import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DIGITIZED_ECG_SHA256,
  compatibleVector,
  decodeDigitizedECG,
  digitalInterval,
  digitalValueAt,
} from "@/lib/reasonos/digital-ecg";
import { LEADS } from "@/lib/reasonos/model";
import { CHEST_LEADS } from "@/lib/reasonos/connections";
const file = readFileSync("public/ecg-digitized/recording-b.json");
const raw = JSON.parse(file.toString());
const data = decodeDigitizedECG(raw);
describe("image-derived digital ECG", () => {
  it("pins the digitization and original image to their unchanged source bytes", () => {
    expect(createHash("sha256").update(file).digest("hex")).toBe(
      DIGITIZED_ECG_SHA256,
    );
    expect(
      createHash("sha256")
        .update(readFileSync(`public${data.sourceImage}`))
        .digest("hex"),
    ).toBe(data.sourceSHA256);
    expect(data.records).toHaveLength(12);
  });
  it("independently reproduces paper time and voltage from the stored original pixel coordinates", () => {
    for (const r of data.records) {
      const f = r.sourceMatrixMmPerPixel,
        source = r.guide[r.landmarkGuideIndices[2]],
        origin = f[0][0] * source[0] + f[0][1] * source[1];
      const base = r.baselineGuideIndices.map((i) => {
        const g = r.guide[i];
        return [
          f[0][0] * g[0] + f[0][1] * g[1],
          f[1][0] * g[0] + f[1][1] * g[1],
        ];
      });
      for (const [time, voltage, x, y] of r.points) {
        const u = f[0][0] * x + f[0][1] * y,
          v = f[1][0] * x + f[1][1] * y;
        expect(time).toBeCloseTo(((u - origin) / 25) * 1000, 2);
        const frac = Math.max(
          0,
          Math.min(1, (u - base[0][0]) / (base[1][0] - base[0][0])),
        );
        const baseline = base[0][1] + frac * (base[1][1] - base[0][1]);
        expect(voltage).toBeCloseTo((baseline - v) / 10, 4);
      }
    }
  });
  it("interpolates stored observations without prescribing a template waveform", () => {
    for (const r of data.records) {
      const a = r.points[35],
        b = r.points[36],
        t = (a[0] + b[0]) / 2,
        value = digitalValueAt(r, t);
      expect(value.voltageMv).toBeCloseTo((a[1] + b[1]) / 2, 12);
      expect(value.sourceX).toBeCloseTo((a[2] + b[2]) / 2, 10);
      expect(digitalValueAt(r, -1e6).voltageMv).toBe(r.points[0][1]);
      expect(digitalValueAt(r, 1e6).voltageMv).toBe(r.points.at(-1)![1]);
      expect(() => digitalValueAt(r, NaN)).toThrow();
      expect(digitalInterval(r, "PR")).toEqual([r.landmarksMs.pStart, 0]);
      expect(digitalInterval(r, "QT")).toEqual([0, r.landmarksMs.tEnd]);
    }
  });
  it("rejects malformed source identities, invalid coordinates, reversed clocks and duplicated leads", () => {
    for (const mutate of [
      (d: typeof raw) => {
        d.sourceSHA256 = "0".repeat(64);
      },
      (d: typeof raw) => {
        d.records[0].points[2][0] = d.records[0].points[1][0];
      },
      (d: typeof raw) => {
        d.records[0].points[0][2] = -1;
      },
      (d: typeof raw) => {
        d.records[0].lead = d.records[1].lead;
      },
      (d: typeof raw) => {
        d.records[0].sourceMatrixMmPerPixel = [
          [0, 0],
          [0, 0],
        ];
      },
    ]) {
      const altered = structuredClone(raw);
      mutate(altered);
      expect(() => decodeDigitizedECG(altered)).toThrow();
    }
  });
  it("keeps every limb-lead projection fixed while the unobserved perpendicular component changes", () => {
    for (const lead of LEADS)
      for (const v of [-0.9, -0.01, 0, 0.3, 1.2])
        for (const q of [-1.25, -0.4, 0, 0.8, 1.25]) {
          const vector = compatibleVector(lead, v, q)!;
          // Independently reconstruct electrode potentials and their voltage differences.
          const [x, y] = vector.vector,
            ra = -x / 2 - y / (2 * Math.sqrt(3)),
            la = x / 2 - y / (2 * Math.sqrt(3)),
            ll = y / Math.sqrt(3);
          const measured = {
            I: la - ra,
            II: ll - ra,
            III: ll - la,
            aVR: ra - (la + ll) / 2,
            aVL: la - (ra + ll) / 2,
            aVF: ll - (ra + la) / 2,
          };
          expect(measured[lead]).toBeCloseTo(v, 12);
          expect(vector.value).toBeCloseTo(v, 12);
        }
    for (const lead of CHEST_LEADS)
      expect(compatibleVector(lead, 0.4, 0.8)).toBeNull();
  });
});
