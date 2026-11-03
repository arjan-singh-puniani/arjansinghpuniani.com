import { apply, initial } from "./simulator.js";

// (a + b√2 + i(c + d√2)) / 2^p keeps Clifford+T calculations exact.
export const zero = () => [0, 0, 0, 0, 0];
export const one = () => [1, 0, 0, 0, 0];
export function normalize(z) {
  const out = [...z];
  if (out.slice(0, 4).every((v) => v === 0)) return zero();
  while (out[4] > 0 && out.slice(0, 4).every((v) => v % 2 === 0)) {
    for (let j = 0; j < 4; j++) out[j] /= 2;
    out[4]--;
  }
  return out;
}
export function sum(a, b) {
  const p = Math.max(a[4], b[4]);
  return normalize([
    ...a
      .slice(0, 4)
      .map((v, j) => v * 2 ** (p - a[4]) + b[j] * 2 ** (p - b[4])),
    p,
  ]);
}
export function product(a, b) {
  const quadratic = (x, y, u, v) => [x * u + 2 * y * v, x * v + y * u];
  const rr = quadratic(a[0], a[1], b[0], b[1]),
    ii = quadratic(a[2], a[3], b[2], b[3]);
  const ri = quadratic(a[0], a[1], b[2], b[3]),
    ir = quadratic(a[2], a[3], b[0], b[1]);
  return normalize([
    rr[0] - ii[0],
    rr[1] - ii[1],
    ri[0] + ir[0],
    ri[1] + ir[1],
    a[4] + b[4],
  ]);
}
export function value(z) {
  return [
    (z[0] + z[1] * Math.SQRT2) / 2 ** z[4],
    (z[2] + z[3] * Math.SQRT2) / 2 ** z[4],
  ];
}
const empty = (z) => z.slice(0, 4).every((v) => v === 0);
const h = [0, 1, 0, 0, 1];
const imaginary = [0, 0, 1, 0, 0];
const phaseTable = [
  one(),
  product(h, [1, 0, 1, 0, 0]),
  imaginary,
  product(h, [-1, 0, 1, 0, 0]),
  [-1, 0, 0, 0, 0],
  product(h, [-1, 0, -1, 0, 0]),
  [0, 0, -1, 0, 0],
  product(h, [1, 0, -1, 0, 0]),
];
function eighth(angle) {
  const integer = Math.round(angle / (Math.PI / 4));
  return angle === integer * (Math.PI / 4)
    ? phaseTable[((integer % 8) + 8) % 8]
    : null;
}
function known(z) {
  const candidates = [
    zero(),
    ...phaseTable,
    h,
    product(h, imaginary),
    product(h, [-1, 0, 0, 0, 0]),
    product(h, [0, 0, -1, 0, 0]),
  ];
  return candidates.find((v) =>
    value(v).every((x, j) => Math.abs(x - z[j]) < 1e-12),
  );
}
export function scalar(z) {
  z = normalize(z);
  if (empty(z)) return "0";
  const denominator = 2 ** z[4];
  function real(a, b) {
    if (!a && !b) return "0";
    if (a <= 0 && b <= 0) return "-" + real(-a, -b);
    if (!a && Math.abs(b) === 1 && z[4] === 1)
      return `${b < 0 ? "-" : ""}\\frac{1}{\\sqrt{2}}`;
    const radical = b
      ? `${b < 0 ? "-" : a ? "+" : ""}${Math.abs(b) === 1 ? "" : Math.abs(b)}\\sqrt{2}`
      : "";
    const numerator = `${a || ""}${radical}`;
    return denominator === 1
      ? numerator
      : `\\frac{${numerator}}{${denominator}}`;
  }
  if (z[1] === 0 && z[3] === 0 && z[0] !== 0 && z[2] !== 0) {
    const numerator = `${z[0]}${z[2] < 0 ? "-" : "+"}${Math.abs(z[2]) === 1 ? "" : Math.abs(z[2])}i`;
    return denominator === 1
      ? `\\left(${numerator}\\right)`
      : `\\frac{${numerator}}{${denominator}}`;
  }
  if (
    z[0] === 0 &&
    z[1] === 0 &&
    z[2] === 0 &&
    Math.abs(z[3]) === 1 &&
    z[4] === 1
  )
    return `${z[3] < 0 ? "-" : ""}\\frac{i}{\\sqrt{2}}`;
  const re = real(z[0], z[1]),
    im = real(z[2], z[3]);
  if (im === "0") return re;
  const imagTerm =
    im === "1" ? "i" : im === "-1" ? "-i" : `\\left(${im}\\right)i`;
  return re === "0"
    ? imagTerm
    : `\\left(${re}+${imagTerm}\\right)`.replaceAll("+-", "-");
}
export function angleTex(angle) {
  for (let d = 1; d <= 16; d++) {
    const n = Math.round((angle * d) / Math.PI);
    if (angle === (n * Math.PI) / d) {
      if (!n) return "0";
      const numerator = `${n < 0 ? "-" : ""}${Math.abs(n) === 1 ? "" : Math.abs(n)}\\pi`;
      return d === 1 ? numerator : `\\frac{${numerator}}{${d}}`;
    }
  }
  return String(angle).replace(
    /e([+-]?\d+)$/i,
    (_, exponent) => `\\times 10^{${Number(exponent)}}`,
  );
}
export function preparedExact(theta, phi, gamma = 0) {
  const polar = eighth(theta / 2),
    relative = eighth(phi),
    global = eighth(gamma);
  if (!polar || !relative || !global) return null;
  return [
    product(global, [polar[0], polar[1], 0, 0, polar[4]]),
    product(product(global, relative), [polar[2], polar[3], 0, 0, polar[4]]),
  ];
}
export function exactMatrix(n, op) {
  const size = 2 ** n;
  const columns = Array.from({ length: size }, (_, j) =>
    apply(initial(n, j), op),
  );
  const rotation = /^R[xyz]$/.test(op.name);
  const fieldRotation =
    !rotation || eighth((op.angle ?? Math.PI / 2) / 2) !== null;
  const targetBit = 1 << (n - 1 - op.target);
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => {
      const numerical = columns[col][row];
      let exact = fieldRotation ? known(numerical) : null;
      let tex;
      if (exact) tex = scalar(exact);
      else if (row !== col && (row ^ col) !== targetBit) {
        exact = zero();
        tex = "0";
      } else if (op.name === "Rz") {
        if (row !== col) {
          exact = zero();
          tex = "0";
        } else tex = `e^{${row & targetBit ? "" : "-"}i\\eta/2}`;
      } else if (row === col) tex = "\\cos\\frac{\\eta}{2}";
      else
        tex = `${op.name === "Rx" ? "-i" : row & targetBit ? "" : "-"}\\sin\\frac{\\eta}{2}`;
      return { value: numerical, exact, tex };
    }),
  );
}
export function runExact(n, basis, circuit, start = undefined) {
  let current =
    start === undefined
      ? Array.from({ length: 2 ** n }, (_, j) => (j === basis ? one() : zero()))
      : start;
  for (const op of circuit) {
    if (!current || op.name === "M") return null;
    const u = exactMatrix(n, op);
    if (u.some((row) => row.some((entry) => !entry.exact))) return null;
    current = u.map((row) =>
      row.reduce(
        (total, entry, j) => sum(total, product(entry.exact, current[j])),
        zero(),
      ),
    );
  }
  return current;
}
export function ket(entries, n) {
  return (
    entries
      .map((entry, j) => {
        const tex = typeof entry === "string" ? entry : scalar(entry);
        if (tex === "0") return "";
        const factor = tex === "1" ? "" : tex === "-1" ? "-" : tex;
        return `${factor}\\lvert${j.toString(2).padStart(n, "0")}\\rangle`;
      })
      .filter(Boolean)
      .join("+")
      .replaceAll("+-", "-") || "0"
  );
}
export function calculation(n, op, before, exactBefore, matrix = undefined) {
  const u = matrix ?? exactMatrix(n, op),
    labels = before.map((_, j) => j.toString(2).padStart(n, "0"));
  const inputs = before.map((amplitude, j) => ({
    value: amplitude,
    exact: exactBefore?.[j] ?? null,
    tex: exactBefore ? scalar(exactBefore[j]) : `a_{${labels[j]}}`,
  }));
  const rows = u.map((entries, row) => {
    const terms = entries.map((entry, source) => {
      const input = inputs[source],
        exact =
          entry.exact && input.exact ? product(entry.exact, input.exact) : null;
      const zeroTerm = entry.tex === "0" || input.tex === "0";
      return {
        source,
        entry,
        input,
        exact,
        zero: zeroTerm,
        tex: exact
          ? scalar(exact)
          : zeroTerm
            ? "0"
            : entry.tex === "1"
              ? input.tex
              : `\\left(${entry.tex}\\right)\\left(${input.tex}\\right)`,
      };
    });
    const exact = terms.every((t) => t.exact)
      ? terms.reduce((total, term) => sum(total, term.exact), zero())
      : null;
    return {
      row,
      terms,
      exact,
      tex: exact
        ? scalar(exact)
        : terms
            .filter((t) => !t.zero)
            .map((t) => t.tex)
            .join("+")
            .replaceAll("+-", "-") || "0",
    };
  });
  const operator = ["CNOT", "CZ"].includes(op.name)
    ? `\\mathrm{${op.name}}_{q${op.control}\\to q${op.target}}`
    : Array.from({ length: n }, (_, q) =>
        q === op.target ? op.name.replace(/^R([xyz])$/, "R_{$1}(\\eta)") : "I",
      ).join("\\otimes ");
  return {
    n,
    op,
    labels,
    u,
    inputs,
    rows,
    operator,
    inputKet: ket(
      inputs.map((i) => i.tex),
      n,
    ),
    outputKet: ket(
      rows.map((row) =>
        row.tex.includes("+") ? `\\left(${row.tex}\\right)` : row.tex,
      ),
      n,
    ),
    exact: rows.every((row) => row.exact),
  };
}
