import { ket, angleTex } from "./exact.js";

export function createCalculation(host, math) {
  let data,
    reduced = false,
    selected = 0,
    timer = 0,
    revision = 0,
    animationKey = "",
    renderKey = "";
  const animations = new Set();
  const $ = (name) => host.querySelector(`[data-calc="${name}"]`);
  const draw = (element, tex, reading = "") => {
    const role = element.getAttribute("role"),
      label = element.getAttribute("aria-label");
    math(element, tex, reading, "", "", "");
    if (role) element.setAttribute("role", role);
    else if (element.tagName === "BUTTON") element.removeAttribute("role");
    if (element.tagName === "BUTTON" && label)
      element.setAttribute("aria-label", label);
    else if (!reading) element.removeAttribute("aria-label");
    if (!element.classList.contains("equation") && element.tagName !== "BUTTON")
      element.removeAttribute("tabindex");
    if (element.classList.contains("result-term")) element.tabIndex = 0;
  };
  function cancel() {
    clearTimeout(timer);
    revision++;
    for (const animation of animations) animation.cancel();
    animations.clear();
    host
      .querySelectorAll(".calculation-ghost")
      .forEach((element) => element.remove());
    $("replay") && ($("replay").textContent = "Animate calculation ↻");
  }
  function fly(source, target, duration = 650) {
    if (reduced || !source || !target) return;
    const visual = source.querySelector(".math-visual") || source;
    const from = visual.getBoundingClientRect(),
      to = target.getBoundingClientRect(),
      box = host.getBoundingClientRect();
    if (!from.width || !to.width) return;
    const ghost = visual.cloneNode(true);
    ghost.className = "calculation-ghost";
    ghost.setAttribute("aria-hidden", "true");
    ghost.style.cssText = `left:${from.left - box.left}px;top:${from.top - box.top}px;width:${from.width}px;font-size:${getComputedStyle(source).fontSize};`;
    host.append(ghost);
    const animation = ghost.animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: 0.95 },
        {
          transform: `translate(${to.left - from.left}px,${to.top - from.top}px) scale(.9)`,
          opacity: 0.95,
          offset: 0.78,
        },
        {
          transform: `translate(${to.left - from.left}px,${to.top - from.top}px) scale(.9)`,
          opacity: 0,
        },
      ],
      { duration, easing: "cubic-bezier(.25,.65,.3,1)", fill: "forwards" },
    );
    animations.add(animation);
    animation.finished
      .then(() => {
        animations.delete(animation);
        ghost.remove();
      })
      .catch(() => ghost.remove());
  }
  function phase(name) {
    host.dataset.phase = name;
    host
      .querySelectorAll("[data-calculation-phase]")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          button.dataset.calculationPhase === name,
        ),
      );
  }
  function row(index, animate = false) {
    selected = index;
    const output = data.rows[index];
    host
      .querySelectorAll("[data-matrix-row]")
      .forEach((element) =>
        element.classList.toggle(
          "selected-row",
          element.closest('[data-calc="input"]') ||
            Number(element.dataset.matrixRow) === index,
        ),
      );
    host
      .querySelectorAll("[data-row-choice]")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          Number(button.dataset.rowChoice) === index,
        ),
      );
    host
      .querySelectorAll("[data-output]")
      .forEach((element) =>
        element.classList.toggle(
          "selected-output",
          Number(element.dataset.output) === index,
        ),
      );
    $("row-title").textContent =
      `Output ${data.labels[index]}: multiply this row by the input column`;
    $("products").innerHTML = output.terms
      .map(
        (term, j) =>
          `<div class="row-product ${term.zero ? "zero-product" : ""}" data-product="${j}"><div class="product-factors"><div data-factor="matrix"></div><span aria-hidden="true">×</span><div data-factor="input"></div></div><div class="product-equals" aria-hidden="true">↓</div><div data-factor="value"></div></div>`,
      )
      .join("");
    output.terms.forEach((term, j) => {
      const product = host.querySelector(`[data-product="${j}"]`);
      draw(product.querySelector('[data-factor="matrix"]'), term.entry.tex);
      draw(product.querySelector('[data-factor="input"]'), term.input.tex);
      draw(product.querySelector('[data-factor="value"]'), term.tex);
      if (animate) {
        fly(
          host.querySelector(`[data-cell="${index}-${j}"]`),
          product.querySelector('[data-factor="matrix"]'),
        );
        fly(
          host.querySelector(`[data-input="${j}"]`),
          product.querySelector('[data-factor="input"]'),
        );
      }
    });
    const terms = output.terms
      .map((term) => term.tex)
      .join("+")
      .replaceAll("+-", "-");
    draw(
      $("sum"),
      `b_{${data.labels[index]}}=${terms}=${output.tex}`,
      "Add the products to get this output amplitude.",
    );
    draw(
      $("row-ket"),
      `b_{${data.labels[index]}}\\lvert${data.labels[index]}\\rangle=${ket([output.tex === "0" ? "0" : output.tex], 1).replace(/\\lvert0\\rangle/g, `\\lvert${data.labels[index]}\\rangle`)}`,
    );
    if (animate && !reduced) {
      const sum = $("sum");
      const animation = sum.animate(
        [
          { opacity: 0.2, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 850, easing: "ease-out" },
      );
      animations.add(animation);
      animation.finished
        .then(() => animations.delete(animation))
        .catch(() => {});
    }
  }
  function basis() {
    phase("basis");
    for (const mapping of data.mappings) {
      for (const output of mapping.targets) {
        fly(
          host.querySelector(`[data-source-ket="${mapping.source}"]`),
          host.querySelector(
            `[data-basis-image="${mapping.source}-${output.row}"]`,
          ),
          950,
        );
      }
    }
  }
  function collect() {
    phase("result");
    for (let j = 0; j < data.rows.length; j++)
      if (data.rows[j].tex !== "0")
        fly(
          host.querySelector(`[data-result-value="${j}"]`),
          host.querySelector(`[data-ket-result="${j}"]`),
          800,
        );
    if (!reduced) {
      const animation = $("result").animate(
        [{ backgroundColor: "#71d1d92b" }, { backgroundColor: "#71d1d900" }],
        { duration: 1100 },
      );
      animations.add(animation);
      animation.finished
        .then(() => animations.delete(animation))
        .catch(() => {});
    }
    $("explanation").textContent =
      "The output amplitudes are the coefficients of the transformed ket. Every other view uses this same state.";
  }
  function replay() {
    cancel();
    const token = revision;
    $("replay").textContent = "Restart animation ↻";
    basis();
    let index = 0;
    const nextRow = () => {
      if (token !== revision) return;
      phase("multiply");
      row(index, true);
      $("explanation").textContent =
        `Matrix row ${data.labels[index]} selects the contributions to the ${data.labels[index]} amplitude. Multiply each entry by its matching input, then add.`;
      index++;
      if (index < data.rows.length)
        timer = setTimeout(nextRow, reduced ? 0 : 1150);
      else
        timer = setTimeout(
          () => {
            if (token === revision) {
              collect();
              $("replay").textContent = "Animate calculation ↻";
            }
          },
          reduced ? 0 : 1150,
        );
    };
    if (reduced) {
      row(selected);
      collect();
    } else timer = setTimeout(nextRow, 1250);
  }
  function render(next, options = {}) {
    reduced = options.reduced;
    const key = JSON.stringify([
      next?.op,
      next?.inputKet,
      next?.outputKet,
      next?.u.map((r) => r.map((e) => e.tex)),
      options.live,
    ]);
    if (!next) {
      cancel();
      host.hidden = true;
      renderKey = "";
      return;
    }
    host.hidden = false;
    const nextSelected = Math.min(
      options.selected ?? selected,
      next.rows.length - 1,
    );
    if (renderKey === key) {
      if (selected !== nextSelected) {
        cancel();
        row(nextSelected);
      }
      return;
    }
    cancel();
    renderKey = key;
    data = next;
    const size = data.rows.length;
    selected = nextSelected;
    data.mappings = data.inputs.flatMap((input, source) =>
      input.tex === "0"
        ? []
        : [
            {
              source,
              input,
              targets: data.u.flatMap((entries, row) =>
                entries[source].tex === "0"
                  ? []
                  : [{ row, entry: entries[source] }],
              ),
            },
          ],
    );
    host.innerHTML = `<div class="calculation-heading"><div><p class="eyebrow">GATE → MATRIX → MULTIPLICATION → KET</p><h2>Matrix–vector calculation</h2></div><div><span class="calculation-kind">${options.live ? "PULSE EVOLUTION" : data.exact ? "EXACT CALCULATION" : "EXACT SYMBOLIC CALCULATION"}</span><button data-calc="replay">Animate calculation ↻</button></div></div><nav class="calculation-phases" aria-label="Calculation stages"><button data-calculation-phase="basis">1 · Apply to each ket</button><button data-calculation-phase="multiply">2 · Multiply the rows</button><button data-calculation-phase="result">3 · Collect the result</button></nav><div data-calc="identity" class="equation calculation-identity"></div><div class="basis-actions"><div class="basis-input"><p class="calculation-label">INPUT KET</p><div data-calc="input-ket" class="equation"></div>${data.mappings.map((mapping) => `<div class="source-ket" data-source-ket="${mapping.source}"></div>`).join("")}</div><div class="basis-images"><p class="calculation-label">THE GATE ACTS ON EACH BASIS KET</p>${data.mappings.map((mapping) => `<div class="basis-image" tabindex="0" role="region" aria-label="Gate acting on basis state ${data.labels[mapping.source]}"><div data-map-operator="${mapping.source}"></div><span class="basis-arrow" aria-hidden="true">→</span><div class="basis-image-terms">${mapping.targets.map((target) => `<div data-basis-image="${mapping.source}-${target.row}"></div>`).join('<span class="basis-plus" aria-hidden="true">+</span>')}</div></div>`).join("")}</div></div><div class="matrix-calculation-stage"><div class="calculation-matrices" data-calc="matrices" tabindex="0" role="region" aria-label="Gate matrix multiplying the input vector"><div class="matrix-object"><p class="calculation-label">UNITARY</p><div class="matrix-brackets" data-calc="unitary" role="table" aria-label="Gate matrix"></div></div><span class="matrix-sign" aria-hidden="true">×</span><div class="matrix-object"><p class="calculation-label">INPUT</p><div class="matrix-brackets" data-calc="input" role="table" aria-label="Input state vector"></div></div><span class="matrix-sign" aria-hidden="true">=</span><div class="matrix-object"><p class="calculation-label">OUTPUT</p><div class="matrix-brackets" data-calc="output" role="table" aria-label="Output state vector"></div></div></div><div class="calculation-row-choices" data-calc="choices" aria-label="Select a matrix row"></div><div class="row-working"><h3 data-calc="row-title"></h3><div class="row-products" data-calc="products" tabindex="0" role="region" aria-label="Products in the selected matrix row"></div><div data-calc="sum" class="equation row-sum"></div><div data-calc="row-ket" class="equation row-ket"></div></div></div><div class="calculation-result" data-calc="result"><p class="calculation-label">THE TRANSFORMED KET</p><div class="collected-ket" data-calc="result-ket"></div></div><p data-calc="explanation" class="calculation-explanation"></p><div data-calc="parameter" class="equation calculation-parameter"></div>`;
    draw(
      $("identity"),
      `${data.operator}\\lvert\\psi_{\\rm in}\\rangle${options.live ? "\\approx" : "="}\\lvert\\psi_{\\rm out}\\rangle`,
    );
    draw($("input-ket"), `\\lvert\\psi_{\\rm in}\\rangle=${data.inputKet}`);
    for (const mapping of data.mappings) {
      draw(
        host.querySelector(`[data-source-ket="${mapping.source}"]`),
        `\\lvert${data.labels[mapping.source]}\\rangle`,
      );
      draw(
        host.querySelector(`[data-map-operator="${mapping.source}"]`),
        `${data.operator}\\lvert${data.labels[mapping.source]}\\rangle`,
      );
      for (const target of mapping.targets)
        draw(
          host.querySelector(
            `[data-basis-image="${mapping.source}-${target.row}"]`,
          ),
          `${target.entry.tex === "1" ? "" : target.entry.tex === "-1" ? "-" : target.entry.tex}\\lvert${data.labels[target.row]}\\rangle`,
        );
    }
    for (const [name, rows] of [
      ["unitary", data.u],
      ["input", data.inputs.map((input) => [input])],
      ["output", data.rows.map((row) => [row])],
    ]) {
      const matrix = $(name);
      matrix.innerHTML = rows
        .map(
          (entries, r) =>
            `<div class="matrix-row" role="row" data-matrix-row="${r}" style="grid-template-columns:repeat(${entries.length},minmax(34px,1fr))">${entries.map((_, col) => `<div role="cell" class="matrix-entry" ${name === "unitary" ? `data-cell="${r}-${col}"` : name === "input" ? `data-input="${r}"` : `data-output="${r}" data-result-value="${r}"`}></div>`).join("")}</div>`,
        )
        .join("");
      rows.forEach((entries, r) =>
        entries.forEach((entry, col) =>
          draw(matrix.children[r].children[col], entry.tex),
        ),
      );
    }
    $("choices").innerHTML = data.labels
      .map(
        (label, j) =>
          `<button data-row-choice="${j}" aria-label="Calculate output amplitude ${label}" aria-pressed="false"></button>`,
      )
      .join("");
    host.querySelectorAll("[data-row-choice]").forEach((button, j) => {
      draw(button, `\\lvert${data.labels[j]}\\rangle`);
      button.onclick = () => {
        cancel();
        options.onInspect?.(j);
        phase("multiply");
        row(j, true);
      };
    });
    const nonzero = data.rows.filter((entry) => entry.tex !== "0");
    $("result-ket").innerHTML = nonzero
      .map(
        (entry, j) =>
          `${j ? '<span class="collected-plus" aria-hidden="true">+</span>' : ""}<div class="result-term" data-ket-result="${entry.row}" data-output="${entry.row}"></div>`,
      )
      .join("");
    nonzero.forEach((entry) =>
      draw(
        host.querySelector(`[data-ket-result="${entry.row}"]`),
        ket(
          [entry.tex.includes("+") ? `\\left(${entry.tex}\\right)` : entry.tex],
          1,
        ).replace(
          /\\lvert0\\rangle/g,
          `\\lvert${data.labels[entry.row]}\\rangle`,
        ),
      ),
    );
    if (/^R[xyz]$/.test(data.op.name))
      draw(
        $("parameter"),
        `\\eta=${angleTex(data.op.angle ?? Math.PI / 2)}\\;\\mathrm{rad}`,
      );
    else if (!data.exact)
      draw(
        $("parameter"),
        `a_j=\\langle j\\vert\\psi_{\\rm in}\\rangle`,
        "The a coefficients are the input amplitudes shown in the State view.",
      );
    $("replay").onclick = options.onReplay || replay;
    host.querySelectorAll("[data-calculation-phase]").forEach(
      (button) =>
        (button.onclick = () => {
          cancel();
          options.onPhase?.(button.dataset.calculationPhase);
          if (button.dataset.calculationPhase === "basis") basis();
          else if (button.dataset.calculationPhase === "multiply") {
            phase("multiply");
            row(selected, true);
          } else collect();
        }),
    );
    row(selected);
    phase("result");
    $("explanation").textContent =
      "Select an output ket to follow one row, or animate the complete calculation.";
    const nextAnimationKey = JSON.stringify([data.op, data.inputKet]);
    if (nextAnimationKey !== animationKey && !options.live) {
      animationKey = nextAnimationKey;
      if (!reduced && options.auto !== false) replay();
    }
  }
  function sync(progress) {
    if (!data) return;
    const name =
      progress < 0.08 ? "basis" : progress < 0.96 ? "multiply" : "result";
    const index = Math.min(
      data.rows.length - 1,
      Math.floor(progress * data.rows.length),
    );
    if (
      name === "multiply" &&
      (selected !== index || host.dataset.phase !== name)
    ) {
      phase(name);
      row(index, !reduced);
    } else if (host.dataset.phase !== name) {
      if (name === "basis") basis();
      else if (name === "result") collect();
    }
  }
  return { render, cancel, replay, sync };
}
