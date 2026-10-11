import { complement, type Base } from "../simulation/engine";
/** Canonical B-DNA dimensions. The cinematic spline has exaggerated spacing. */
export const B_DNA = {
  riseNm: 0.34,
  basePairsPerTurn: 10.5,
  radiusNm: 1,
  handedness: "right",
} as const;
export function nucleotidePair(index: number, base: Base) {
  const angle = (index * 2 * Math.PI) / B_DNA.basePairsPerTurn;
  return {
    template: {
      base,
      position: [
        Math.cos(angle),
        index * B_DNA.riseNm,
        -Math.sin(angle),
      ] as const,
      direction: "3′→5′",
    },
    daughter: {
      base: complement[base],
      position: [
        -Math.cos(angle),
        index * B_DNA.riseNm,
        Math.sin(angle),
      ] as const,
      direction: "5′→3′",
    },
  };
}
