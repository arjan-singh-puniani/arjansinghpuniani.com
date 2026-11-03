import { mul, add, abs2, matrix } from "./simulator.js";

export function projectBloch([x, y, z]) {
  const azimuth = Math.PI / 6,
    elevation = Math.PI / 9;
  return [
    130 + 90 * (Math.cos(azimuth) * x - Math.sin(azimuth) * y),
    120 +
      90 *
        (Math.sin(azimuth) * Math.sin(elevation) * x +
          Math.cos(azimuth) * Math.sin(elevation) * y -
          Math.cos(elevation) * z),
  ];
}

// A link is a complex matrix contribution; it is never a probability flow.
export function amplitudeContributions(input, matrix) {
  return matrix.map((row, output) => {
    const terms = row.map((coefficient, source) => ({
      source,
      coefficient,
      amplitude: input[source],
      value: mul(coefficient, input[source]),
    }));
    const amplitude = terms.reduce((sum, term) => add(sum, term.value), [0, 0]);
    return { output, terms, amplitude, probability: abs2(amplitude) };
  });
}

// Bell-projector identity works for mixed ensembles as well as pure trajectories.
export function bellEvidence(rho) {
  if (rho.length !== 4 || rho.some((row) => row.length !== 4))
    throw new Error("Bell analysis requires two qubits");
  const expectation = (left, right) => {
    const p = matrix(left),
      q = matrix(right);
    let total = [0, 0];
    for (let r = 0; r < 4; r++)
      for (let col = 0; col < 4; col++) {
        const operator = mul(p[col >> 1][r >> 1], q[col & 1][r & 1]);
        total = add(total, mul(rho[r][col], operator));
      }
    return total[0];
  };
  const correlations = Object.fromEntries(
    ["X", "Y", "Z"].map((axis) => [axis, expectation(axis, axis)]),
  );
  return {
    correlations,
    crossXY: expectation("X", "Y"),
    fidelity: (1 + correlations.X - correlations.Y + correlations.Z) / 4,
    coherence: rho[0][3],
    purity: rho.flat().reduce((sum, a) => sum + abs2(a), 0),
  };
}

export function blochDepth([x, y, z]) {
  const azimuth = Math.PI / 6,
    elevation = Math.PI / 9;
  return (
    Math.sin(azimuth) * Math.cos(elevation) * x +
    Math.cos(azimuth) * Math.cos(elevation) * y +
    Math.sin(elevation) * z
  );
}
