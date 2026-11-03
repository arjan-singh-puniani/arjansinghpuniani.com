// q0 is the most significant bit: |q0 q1 q2>. Angles are radians.
export const c = (re = 0, im = 0) => [re, im];
export const add = (a, b) => c(a[0] + b[0], a[1] + b[1]);
export const mul = (a, b) =>
  c(a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]);
export const conj = (a) => c(a[0], -a[1]);
export const abs2 = (a) => a[0] ** 2 + a[1] ** 2;
export const phase = (a) => c(Math.cos(a), Math.sin(a));
export const scale = (a, k) => c(a[0] * k, a[1] * k);
const I = [
  [c(1), c()],
  [c(), c(1)],
];
export function matrix(name, angle = Math.PI / 2) {
  const co = Math.cos(angle / 2),
    si = Math.sin(angle / 2),
    h = Math.SQRT1_2;
  switch (name) {
    case "X":
      return [
        [c(), c(1)],
        [c(1), c()],
      ];
    case "Y":
      return [
        [c(), c(0, -1)],
        [c(0, 1), c()],
      ];
    case "Z":
      return [
        [c(1), c()],
        [c(), c(-1)],
      ];
    case "H":
      return [
        [c(h), c(h)],
        [c(h), c(-h)],
      ];
    case "S":
      return [
        [c(1), c()],
        [c(), c(0, 1)],
      ];
    case "T":
      return [
        [c(1), c()],
        [c(), phase(Math.PI / 4)],
      ];
    case "Rx":
      return [
        [c(co), c(0, -si)],
        [c(0, -si), c(co)],
      ];
    case "Ry":
      return [
        [c(co), c(-si)],
        [c(si), c(co)],
      ];
    case "Rz":
      return [
        [phase(-angle / 2), c()],
        [c(), phase(angle / 2)],
      ];
    case "CNOT":
      return [
        [c(1), c(), c(), c()],
        [c(), c(1), c(), c()],
        [c(), c(), c(), c(1)],
        [c(), c(), c(1), c()],
      ];
    case "CZ":
      return Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 4 }, (_, k) =>
          c(r === k ? (r === 3 ? -1 : 1) : 0),
        ),
      );
    case "I":
      return I;
    default:
      throw new Error(`Unknown unitary ${name}`);
  }
}
export function initial(n, basis = 0) {
  if (
    !Number.isInteger(n) ||
    n < 1 ||
    n > 3 ||
    !Number.isInteger(basis) ||
    basis < 0 ||
    basis >= 2 ** n
  )
    throw new Error("Use 1–3 qubits and a valid basis state");
  return Array.from({ length: 2 ** n }, (_, j) => c(j === basis ? 1 : 0));
}
export function apply(state, op) {
  const n = Math.log2(state.length),
    { name, target = 0, control = 0, angle } = op;
  if (
    !Number.isInteger(n) ||
    n < 1 ||
    n > 3 ||
    !Number.isInteger(target) ||
    target < 0 ||
    target >= n ||
    !Number.isFinite(angle ?? 0)
  )
    throw new Error("Invalid operation");
  const controlled = name === "CNOT" || name === "CZ";
  if (
    controlled &&
    (!Number.isInteger(control) ||
      control < 0 ||
      control >= n ||
      control === target)
  )
    throw new Error("Control and target must be different valid qubits");
  const bit = 1 << (n - 1 - target),
    cb = 1 << (n - 1 - control),
    out = state.map((a) => [...a]);
  const u = matrix(controlled ? (name === "CNOT" ? "X" : "Z") : name, angle);
  for (let j = 0; j < state.length; j++) {
    if (j & bit || (controlled && !(j & cb))) continue;
    const k = j | bit;
    out[j] = add(mul(u[0][0], state[j]), mul(u[0][1], state[k]));
    out[k] = add(mul(u[1][0], state[j]), mul(u[1][1], state[k]));
  }
  return out;
}
export function rng(seed) {
  let x = Number(seed) >>> 0;
  return () => {
    x += 0x6d2b79f5;
    let t = x;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function measure(state, target, random) {
  const n = Math.log2(state.length);
  if (!Number.isInteger(target) || target < 0 || target >= n)
    throw new Error("Invalid measurement target");
  const bit = 1 << (n - 1 - target),
    p1 = state.reduce((s, a, j) => s + (j & bit ? abs2(a) : 0), 0);
  const outcome = random() >= 1 - p1 ? 1 : 0,
    probability = outcome ? p1 : 1 - p1;
  return {
    outcome,
    state: state.map((a, j) =>
      Boolean(j & bit) === Boolean(outcome)
        ? scale(a, 1 / Math.sqrt(probability))
        : c(),
    ),
  };
}
export function run(start, circuit, steps = circuit.length, seed = 42) {
  let state = start.map((a) => [...a]);
  const random = rng(seed),
    history = [state],
    results = [];
  for (const op of circuit.slice(0, steps)) {
    if (op.name === "M") {
      const m = measure(state, op.target, random);
      state = m.state;
      results.push({ target: op.target, outcome: m.outcome });
    } else state = apply(state, op);
    history.push(state);
  }
  return { state, history, results };
}
// Exact branch enumeration makes probabilities valid even after a mid-circuit measurement.
function evolveBranches(start, circuit, fraction, after) {
  let branches = [{ weight: 1, state: start }];
  for (const [index, op] of [...circuit, ...after].entries()) {
    if (index === circuit.length - 1 && fraction < 1) {
      if (op.name !== "M")
        branches = branches.map((b) => ({
          ...b,
          state: interpolate(b.state, op, fraction),
        }));
      continue;
    }
    if (op.name !== "M")
      branches = branches.map((b) => ({ ...b, state: apply(b.state, op) }));
    else
      branches = branches.flatMap((b) => {
        const bit = 1 << (Math.log2(start.length) - 1 - op.target);
        return [0, 1]
          .map((outcome) => {
            const p = b.state.reduce(
              (s, a, j) =>
                s + (Boolean(j & bit) === Boolean(outcome) ? abs2(a) : 0),
              0,
            );
            return {
              weight: b.weight * p,
              state: b.state.map((a, j) =>
                p > 1e-14 && Boolean(j & bit) === Boolean(outcome)
                  ? scale(a, 1 / Math.sqrt(p))
                  : c(),
              ),
            };
          })
          .filter((b) => b.weight > 1e-14);
      });
  }
  return branches;
}
export function distribution(start, circuit, fraction = 1, after = []) {
  const branches = evolveBranches(start, circuit, fraction, after);
  return start.map((_, j) =>
    branches.reduce((s, b) => s + b.weight * abs2(b.state[j]), 0),
  );
}
export function ensembleDensity(start, circuit, fraction = 1) {
  const branches = evolveBranches(start, circuit, fraction, []);
  return start.map((_, r) =>
    start.map((_, col) =>
      branches.reduce(
        (sum, branch) =>
          add(
            sum,
            scale(mul(branch.state[r], conj(branch.state[col])), branch.weight),
          ),
        c(),
      ),
    ),
  );
}
export function reduced(state, target) {
  const bit = 1 << (Math.log2(state.length) - 1 - target),
    rho = [
      [c(), c()],
      [c(), c()],
    ];
  for (let j = 0; j < state.length; j++) {
    if (j & bit) continue;
    for (let r = 0; r < 2; r++)
      for (let k = 0; k < 2; k++)
        rho[r][k] = add(
          rho[r][k],
          mul(state[j | (r ? bit : 0)], conj(state[j | (k ? bit : 0)])),
        );
  }
  return {
    rho,
    bloch: [2 * rho[0][1][0], -2 * rho[0][1][1], rho[0][0][0] - rho[1][1][0]],
    purity: rho.flat().reduce((s, a) => s + abs2(a), 0),
  };
}
export function shots(probabilities, count, seed, noise = 0, threshold = 0) {
  if (
    !Number.isInteger(count) ||
    count < 1 ||
    count > 4096 ||
    noise < 0 ||
    noise > 2 ||
    !Number.isFinite(threshold)
  )
    throw new Error("Invalid readout settings");
  const random = rng(seed),
    counts = probabilities.map(() => 0),
    ideal = [...counts],
    points = [];
  const n = Math.log2(probabilities.length);
  const normal = () =>
    Math.sqrt(-2 * Math.log(Math.max(1e-12, random()))) *
    Math.cos(2 * Math.PI * random());
  for (let s = 0; s < count; s++) {
    const r = random();
    let total = 0,
      index = probabilities.length - 1;
    for (let j = 0; j < probabilities.length; j++) {
      total += probabilities[j];
      if (r < total) {
        index = j;
        break;
      }
    }
    ideal[index]++;
    let classified = 0;
    for (let q = 0; q < n; q++) {
      const bit = (index >> (n - 1 - q)) & 1,
        i = (bit ? 1 : -1) + noise * normal(),
        v = noise * normal();
      const measured = i > threshold ? 1 : 0;
      classified = (classified << 1) | measured;
      if (q === 0 && s < 320) points.push({ i, q: v, bit, measured });
    }
    counts[classified]++;
  }
  return { counts, ideal, points };
}
export function pure(theta, phi, gamma = 0) {
  return [
    mul(phase(gamma), c(Math.cos(theta / 2))),
    mul(phase(gamma + phi), c(Math.sin(theta / 2))),
  ];
}
export function compile(op) {
  const a = op.angle ?? Math.PI / 2,
    q = op.target;
  const pulse = (axis, angle) => ({
    kind: "drive",
    target: q,
    axis,
    angle,
    duration: 40,
    phase: axis === "y" ? Math.PI / 2 : 0,
  });
  const frame = (angle) => ({ kind: "frame", target: q, angle, duration: 0 });
  switch (op.name) {
    case "X":
      return [pulse("x", Math.PI)];
    case "Y":
      return [pulse("y", Math.PI)];
    case "Rx":
      return [pulse("x", a)];
    case "Ry":
      return [pulse("y", a)];
    case "Z":
      return [frame(Math.PI)];
    case "Rz":
      return [frame(a)];
    case "S":
      return [frame(Math.PI / 2)];
    case "T":
      return [frame(Math.PI / 4)];
    // Chronological order: Rz(pi) then Ry(pi/2); H = i Ry(pi/2) Rz(pi).
    case "H":
      return [frame(Math.PI), pulse("y", Math.PI / 2)];
    case "CZ":
      return [
        {
          kind: "flux",
          target: q,
          control: op.control,
          angle: Math.PI,
          duration: 80,
        },
      ];
    case "CNOT":
      return [
        ...compile({ name: "H", target: q }),
        ...compile({ ...op, name: "CZ" }),
        ...compile({ name: "H", target: q }),
      ];
    case "M":
      return [{ kind: "readout", target: q, angle: 0, duration: 400 }];
    default:
      throw new Error("Cannot compile operation");
  }
}
// Track software references separately from the phases actually sent to microwave hardware.
export function compileSequence(circuit) {
  const frames = [0, 0, 0];
  return circuit.flatMap((op, step) =>
    compile(op).map((p) => {
      if (p.kind === "frame") frames[p.target] += p.angle;
      return {
        ...p,
        step,
        frame: frames[p.target],
        logicalPhase: p.phase,
        phase: p.phase === undefined ? undefined : p.phase - frames[p.target],
      };
    }),
  );
}
// The same envelope area drives the state, angle readout, and pulse visualization.
export function pulseArea(kind, fraction) {
  const t = Math.max(0, Math.min(1, fraction));
  if (kind === "flux") return t - Math.sin(2 * Math.PI * t) / (2 * Math.PI);
  if (kind !== "drive") return t;
  let numerator = 0,
    denominator = 0;
  for (let k = 0; k < 128; k++) {
    const x = (k + 0.5) / 128;
    const g = Math.exp(-0.5 * ((x - 0.5) / 0.16) ** 2);
    denominator += g;
    numerator += g * Math.max(0, Math.min(1, (t - k / 128) * 128));
  }
  return numerator / denominator;
}

// Animate the same native sequence as the pulse timeline, removing its known global phase.
export function interpolate(start, op, fraction) {
  if (fraction <= 0) return start;
  if (fraction >= 1) return op.name === "M" ? start : apply(start, op);
  if (op.name === "M") return start;
  const native = compile(op),
    duration = native.reduce((s, p) => s + p.duration, 0);
  if (duration === 0) {
    // A zero-duration frame update can be inspected by angle, not by fictitious pulse time.
    const angle = native[0].angle * fraction,
      global = op.name === "Rz" ? 0 : angle / 2;
    return apply(start, { name: "Rz", target: op.target, angle }).map((a) =>
      mul(a, phase(global)),
    );
  }
  let remaining = fraction * duration,
    state = start;
  for (const p of native) {
    if (p.kind === "frame") {
      state = apply(state, { name: "Rz", target: p.target, angle: p.angle });
      if (op.name === "H" || op.name === "CNOT")
        state = state.map((a) => mul(a, phase(p.angle / 2)));
      continue;
    }
    if (remaining <= 0) break;
    const portion = Math.min(1, remaining / p.duration);
    if (p.kind === "drive") {
      state = apply(state, {
        name: p.axis === "x" ? "Rx" : "Ry",
        target: p.target,
        angle: p.angle * pulseArea(p.kind, portion),
      });
    }
    if (p.kind === "flux") {
      const integrated = pulseArea(p.kind, portion),
        n = Math.log2(state.length),
        mask = (1 << (n - 1 - p.target)) | (1 << (n - 1 - p.control));
      state = state.map((a, j) =>
        (j & mask) === mask ? mul(a, phase(-p.angle * integrated)) : a,
      );
    }
    remaining -= p.duration;
    if (portion < 1) break;
  }
  const correction =
    {
      X: Math.PI / 2,
      Y: Math.PI / 2,
      Z: Math.PI / 2,
      H: 0,
      S: Math.PI / 4,
      T: Math.PI / 8,
      CNOT: 0,
    }[op.name] ?? 0;
  return state.map((a) => mul(a, phase(correction * fraction)));
}
