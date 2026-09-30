import * as THREE from "three";
import { ShoulderScene } from "./scene.js";
import { bindInteraction } from "./interaction.js";
import {
  createState,
  PRESETS,
  SITS,
  CURRICULUM,
  CUFF_COLORS,
  LESSON,
  SOURCES,
  stage,
  undoStage,
  reassemble,
  question,
  answer,
  nextQuestion,
  layoutLabels,
} from "./model.js";
const $ = (id) => document.getElementById(id),
  state = createState();
let scene;
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const name = (id) => CURRICULUM[id]?.name || scene?.parts.get(id)?.name || id;
function fail(message) {
  $("loading").hidden = true;
  $("error").hidden = false;
  $("error-message").textContent = message;
}
window.addEventListener("shoulder-error", (e) => fail(e.detail));

function initialize() {
  $("view-select").innerHTML = Object.entries(PRESETS)
    .map(([id, p]) => `<option value="${id}">${p.label}</option>`)
    .join("");
  $("view-select").onchange = (e) => {
    state.selected = null;
    state.isolated = false;
    reassemble(state);
    scene.applyView(e.target.value);
    renderPanel();
  };
  document
    .querySelectorAll("#mode-controls [data-mode]")
    .forEach((b) => (b.onclick = () => setMode(b.dataset.mode)));
  $("reset").onclick = reset;
  $("atlas-toggle").onclick = () => {
    state.atlas = !state.atlas;
    sync();
  };
  $("structures-toggle").onclick = () => {
    const show = $("structure-list").hidden;
    $("structure-list").hidden = !show;
    $("structures-toggle").setAttribute("aria-expanded", String(show));
  };
  $("structure-list").innerHTML = [...scene.parts.values()]
    .map((p) => `<button data-select="${p.id}">${escape(p.name)}</button>`)
    .join("");
  $("structure-list").onclick = (e) => {
    const b = e.target.closest("[data-select]");
    if (b) select(b.dataset.select);
  };
  $("context").onclick = contextClick;
  $("context").oninput = (e) => {
    if (e.target.id === "peel-range") {
      state.peel = Number(e.target.value);
      if (state.peel < 3) reassemble(state);
      scene.refresh();
      renderPanel();
    }
  };
  $("zoom-in").onclick = () => scene.zoom(-0.18);
  $("zoom-out").onclick = () => scene.zoom(0.18);
  $("fullscreen").onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      $("feedback").textContent =
        "Full screen is unavailable here. Open the standalone viewer for more room.";
    }
  };
  $("information").onclick = openInformation;
  $("source-link").onclick = (e) => {
    e.preventDefault();
    openInformation();
  };
  $("close-info").onclick = () => $("info-dialog").close();
  bindInteraction($("specimen"), scene, {
    select,
    hover: (id, e) => {
      const node = $("hover");
      node.hidden = !id || state.mode === "quiz";
      if (!node.hidden) {
        const rect = $("specimen").getBoundingClientRect();
        node.textContent = name(id);
        node.style.left =
          Math.min(rect.width - 210, Math.max(8, e.clientX - rect.left + 14)) +
          "px";
        node.style.top =
          Math.min(rect.height - 45, e.clientY - rect.top + 16) + "px";
      }
    },
    stage: (id) => {
      stage(state, id);
      state.selected = id;
      scene.refresh();
      renderPanel();
    },
    canStage: () => state.mode === "peel" && state.peel >= 2,
  });
  bindInteraction($("orientation"), scene, { widget: true });
  setupCube();
  window.addEventListener("keydown", (e) => {
    if ($("info-dialog").open) return;
    if (
      ["INPUT", "SELECT", "TEXTAREA", "BUTTON", "A"].includes(
        document.activeElement?.tagName,
      ) &&
      e.key !== "Escape"
    )
      return;
    if (e.key === "ArrowLeft") scene.orbit(-12, 0);
    else if (e.key === "ArrowRight") scene.orbit(12, 0);
    else if (e.key === "ArrowUp") scene.orbit(0, 12);
    else if (e.key === "ArrowDown") scene.orbit(0, -12);
    else if (e.key === "+" || e.key === "=") scene.zoom(-0.12);
    else if (e.key === "-") scene.zoom(0.12);
    else if (e.key.toLowerCase() === "f" && state.selected)
      scene.focus(state.selected);
    else if (e.key.toLowerCase() === "r") reset();
    else if (e.key === "Escape") {
      state.selected = null;
      state.isolated = false;
      scene.hover(null);
      $("hover").hidden = true;
      renderPanel();
      scene.refresh();
    } else return;
    e.preventDefault();
  });
  sync();
  renderPanel();
  // Read-only inspection surface plus explicit actions used by visual and interaction regression tests.
  window.shoulderStudio = {
    state,
    scene,
    select,
    setMode,
    reset,
    applyView: (id) => {
      scene.applyView(id, false);
      sync();
    },
    metrics: () => scene.metrics(),
    ready: true,
  };
  performance.mark("shoulder-interactive");
}
function setMode(mode) {
  if (!["explore", "peel", "learn", "quiz"].includes(mode)) return;
  state.mode = mode;
  state.selected = null;
  state.isolated = false;
  reassemble(state);
  scene.hover(null);
  $("hover").hidden = true;
  $("feedback").textContent = "";
  if (mode === "learn") lessonStep(state.lesson);
  else if (mode === "quiz") {
    state.quiz = {
      index: 0,
      score: 0,
      answered: false,
      retried: false,
      previous: null,
    };
    scene.applyView(question(state).view);
  } else if (mode === "peel") {
    state.peel = 0;
    scene.applyView("posterior");
  } else scene.applyView("posterior");
  scene.refresh();
  sync();
  renderPanel();
}
function reset() {
  const mode = state.mode;
  Object.assign(state, createState());
  state.mode = mode;
  if (mode === "peel") state.peel = 0;
  if (mode === "learn") state.lesson = 0;
  scene.hover(null);
  scene.applyView(mode === "learn" ? "joint" : "posterior");
  $("feedback").textContent = "View reset.";
  sync();
  renderPanel();
}
function select(id) {
  if (!id) {
    state.selected = null;
    state.isolated = false;
    scene.refresh();
    renderPanel();
    return;
  }
  if (state.mode === "quiz") {
    const result = answer(state, id);
    if (result === "answered") return;
    $("feedback").textContent =
      result === "correct"
        ? `Correct. ${name(id)}. ${CURRICULUM[id].relationship}${state.quiz.retried ? " Retry completed; no point added." : " First-attempt point earned."}`
        : "Not yet. Reconsider the spatial relationship, then try again. This question will not earn a first-attempt point.";
    if (result === "correct") state.selected = id;
    scene.refresh();
    renderPanel();
    return;
  }
  state.selected = id;
  scene.refresh();
  renderPanel();
}
function sync() {
  document.body.dataset.mode = state.mode;
  document
    .querySelectorAll("#mode-controls [data-mode]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(state.mode === b.dataset.mode)),
    );
  $("view-select").value = state.view;
  $("view-purpose").textContent = PRESETS[state.view].purpose;
  $("crop-note").textContent =
    state.view === "vascular"
      ? "Regional vessels · incomplete source coverage"
      : "Proximal view · distal shaft cropped";
  $("atlas-toggle").setAttribute("aria-pressed", String(state.atlas));
  $("atlas-toggle").disabled = state.mode === "quiz";
  $("structures-toggle").hidden = state.mode === "quiz";
  if (state.mode === "quiz") $("structure-list").hidden = true;
  scene.invalidate();
}
function detail(id) {
  const c = CURRICULUM[id],
    p = scene.parts.get(id);
  if (!p) return "";
  return `<p class="kicker">SELECTED STRUCTURE · ${p.id}</p><h2>${escape(name(id))}</h2><p class="integrity">SOURCE GEOMETRY · ${escape(p.fma)}<br>${p.faceCount.toLocaleString()} source faces · BodyParts3D 4.0</p><div class="action-row"><button data-action="focus">Focus <small>F</small></button><button data-action="isolate" aria-pressed="${state.isolated}">Isolate</button><button data-action="clear">Clear</button></div>${
    c
      ? `<p class="kicker">CURRICULUM TEXT</p><dl>${[
          ["Origin", c.origin],
          ["Insertion", c.insertion],
          ["Action", c.action],
          ["Innervation", c.innervation],
          ["Relationship", c.relationship],
          ["Clinical connection", c.clinical],
        ]
          .map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`)
          .join(
            "",
          )}</dl><p class="integrity">The muscle surface is sourced. Separate tendon and insertion-footprint geometry are not provided. No fiber-direction data is available.</p><button data-action="sources">Curriculum sources ↗</button>`
      : `<p>${p.layer === "arteries" || p.layer === "veins" ? "A supplied segment of an incomplete regional vascular tree. No connecting vessels have been invented." : "Inspect this source structure in its anatomical context."}</p>`
  }`;
}
function renderPanel() {
  sync();
  let html = "";
  if (state.mode === "explore")
    html = state.selected
      ? detail(state.selected)
      : `<span class="number">04</span><h2>Muscles that hold<br>the joint together.</h2><p>Turn the specimen. Follow a muscle from the scapula toward the humerus. Select one to look closer.</p><ul class="muscle-list">${SITS.map((id, i) => `<li><button data-select="${id}"><span class="dot" style="--swatch:${CUFF_COLORS[id]}"></span>${name(id)}<span class="index">0${i + 1}</span></button></li>`).join("")}</ul><p class="integrity">An atlas of the available source surfaces. Tendons, cartilage and insertion footprints are not separately modeled.</p>`;
  if (state.mode === "peel") {
    const titles = [
      "Surface context",
      "Through the deltoid",
      "The exposed cuff",
      "Separate and compare",
      "Bone relationship",
    ];
    html = `<p class="kicker">PEEL · STAGE ${state.peel + 1} OF 5</p><h2>${titles[state.peel]}</h2><label class="field-label" for="peel-range">EXPOSURE DEPTH</label><input id="peel-range" aria-label="Anatomy exposure stage" type="range" min="0" max="4" step="1" value="${state.peel}"><p class="peel-stages">${state.peel < 2 ? "Move the slider to ghost, then remove the three supplied deltoid parts." : state.peel === 4 ? "Context is ghosted around your selected cuff muscle. The model does not map a separate tendon footprint." : "Select a cuff muscle and use Separate, or drag it deliberately to the staging area. Its source shape stays unchanged."}</p><select id="peel-muscle" aria-label="Cuff muscle to separate">${SITS.map((id) => `<option value="${id}" ${id === state.selected ? "selected" : ""}>${name(id)}</option>`).join("")}</select><div class="action-row"><button data-action="separate" ${state.peel < 2 ? "disabled" : ""}>Separate</button><button data-action="undo" ${!state.undo.length ? "disabled" : ""}>Undo</button></div><button data-action="reassemble" ${!state.staged.length ? "disabled" : ""}>Reassemble all</button><div class="stage-list">${state.staged.map((id) => `<button data-return="${id}">↶ Return ${name(id)}</button>`).join("")}</div><p class="integrity">Staging moves whole source meshes for study. It does not simulate cutting, tissue deformation, or surgical planes.</p>`;
  }
  if (state.mode === "learn") {
    const s = LESSON[state.lesson];
    html = `<p class="kicker">GUIDED LESSON · ${state.lesson + 1} / ${LESSON.length}</p><h2>${s.title}</h2><p>${s.text}</p><div class="steps"><span style="width:${((state.lesson + 1) / LESSON.length) * 100}%"></span></div><div class="lesson-nav"><button data-action="previous" ${state.lesson === 0 ? "disabled" : ""}>← Back</button><button class="primary" data-action="next">${s.quiz ? "Start quiz" : "Continue →"}</button></div>${state.selected ? `<details><summary>Structure notes · ${name(state.selected)}</summary>${detail(state.selected)}</details>` : ""}`;
  }
  if (state.mode === "quiz") {
    const q = question(state);
    html = `<p class="kicker">ACTIVE RECALL · ${q.level}</p><h2>${q.prompt}</h2><p>Select the structure on the specimen. Orbit to inspect it from another angle.</p><p><span class="quiz-score">${state.quiz.score}</span> <small>first-attempt points / ${state.quiz.index + 1} questions</small></p><button class="primary" data-action="quiz-next" ${!state.quiz.answered ? "disabled" : ""}>Next question →</button><details><summary>Keyboard answer controls</summary><p>Choose the structure you would select in the model.</p>${SITS.map((id) => `<button data-select="${id}">${name(id)}</button>`).join("")}</details><p class="integrity">Retries explain the anatomy but do not add points. Questions progress from names to spatial relationships.</p>`;
  }
  $("context").innerHTML = html;
}
function lessonStep(n) {
  state.lesson = Math.max(0, Math.min(LESSON.length - 1, n));
  const s = LESSON[state.lesson];
  state.selected = s.id || null;
  state.isolated = false;
  scene.applyView(s.view);
  scene.refresh();
  renderPanel();
}
function contextClick(e) {
  const selectButton = e.target.closest("[data-select]");
  if (selectButton) {
    const id = selectButton.dataset.select;
    if (state.mode !== "quiz" && id === "FJ1504") scene.applyView("anterior");
    select(id);
    return;
  }
  const ret = e.target.closest("[data-return]");
  if (ret) {
    state.undo.push([...state.staged]);
    state.staged = state.staged.filter((id) => id !== ret.dataset.return);
    scene.refresh();
    renderPanel();
    return;
  }
  const action = e.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  if (action === "focus") scene.focus(state.selected);
  if (action === "isolate") {
    state.isolated = !state.isolated;
    scene.refresh();
    renderPanel();
  }
  if (action === "clear") select(null);
  if (action === "separate") {
    const id = $("peel-muscle").value;
    stage(state, id);
    state.selected = id;
    scene.refresh();
    renderPanel();
  }
  if (action === "undo") {
    undoStage(state);
    scene.refresh();
    renderPanel();
  }
  if (action === "reassemble") {
    reassemble(state);
    scene.refresh();
    renderPanel();
  }
  if (action === "previous") lessonStep(state.lesson - 1);
  if (action === "next") {
    if (LESSON[state.lesson].quiz) setMode("quiz");
    else lessonStep(state.lesson + 1);
  }
  if (action === "quiz-next" && nextQuestion(state)) {
    state.selected = null;
    scene.applyView(question(state).view);
    $("feedback").textContent = "";
    renderPanel();
  }
  if (action === "sources") openInformation();
}
let labelSignature = "";
function updateOverlays() {
  if (!scene?.ready) return;
  updateCube();
  const ids =
    state.atlas && state.mode !== "quiz"
      ? state.staged.length
        ? state.staged
        : state.selected
          ? [state.selected]
          : PRESETS[state.view].labels
      : [];
  const signature = ids.join() + ":" + state.selected;
  if (signature !== labelSignature) {
    labelSignature = signature;
    $("atlas").innerHTML = ids
      .map(
        (id, i) =>
          `<button class="atlas-label ${state.selected === id ? "selected" : ""}" data-label="${id}" style="--swatch:${CUFF_COLORS[id] || "#8b8168"}"><span class="index">0${i + 1}</span>${escape(name(id))}</button>`,
      )
      .join("");
    $("atlas")
      .querySelectorAll("button")
      .forEach((b) => (b.onclick = () => select(b.dataset.label)));
  }
  const w = $("specimen").clientWidth,
    h = $("specimen").clientHeight;
  const points = ids
    .map((id) => scene.labelAnchor(id))
    .filter(
      (p) => p?.visible && p.x > 0 && p.x < w && p.y > 70 && p.y < h - 60,
    );
  const layout = layoutLabels(points, w, h);
  let lines = "";
  for (const b of $("atlas").children) b.hidden = true;
  for (const item of layout) {
    const b = $("atlas").querySelector(`[data-label="${item.id}"]`);
    if (!b) continue;
    b.hidden = false;
    const left = item.labelX < w / 2;
    const labelWidth = w < 450 ? 118 : w < 730 ? 135 : 158;
    const x = left ? 12 : w - labelWidth - 12;
    b.style.transform = `translate(${x}px,${item.labelY - 22}px)`;
    lines += `<line x1="${left ? x + labelWidth : x}" y1="${item.labelY}" x2="${item.x}" y2="${item.y}"/><circle cx="${item.x}" cy="${item.y}" r="2"/>`;
  }
  $("leaders").innerHTML = lines;
}
const cubeFaces = [
  { letter: "A", name: "Anterior", normal: [0, 0, 1], yaw: 0, pitch: 0 },
  {
    letter: "P",
    name: "Posterior",
    normal: [0, 0, -1],
    yaw: Math.PI,
    pitch: 0,
  },
  { letter: "S", name: "Superior", normal: [0, 1, 0], yaw: 0, pitch: 1.48 },
  { letter: "I", name: "Inferior", normal: [0, -1, 0], yaw: 0, pitch: -1.48 },
  { letter: "L", name: "Left", normal: [1, 0, 0], yaw: Math.PI / 2, pitch: 0 },
  {
    letter: "R",
    name: "Right",
    normal: [-1, 0, 0],
    yaw: -Math.PI / 2,
    pitch: 0,
  },
];
let cubeStart = null;
function setupCube() {
  const holder = $("cube-faces");
  holder.innerHTML =
    cubeFaces
      .map(
        (f, i) =>
          `<button data-face="${i}" aria-label="${f.name} anatomical view">${f.letter}</button>`,
      )
      .join("") +
    Array.from(
      { length: 8 },
      (_, i) =>
        `<button class="corner" data-corner="${i}" aria-label="Oblique view ${i + 1}"></button>`,
    ).join("");
  $("orientation").addEventListener(
    "pointerdown",
    (e) => (cubeStart = [e.clientX, e.clientY]),
  );
  $("orientation").addEventListener("click", (e) => {
    if (
      e.detail > 0 &&
      cubeStart &&
      Math.hypot(e.clientX - cubeStart[0], e.clientY - cubeStart[1]) > 6
    )
      return;
    const b =
      e.target.closest("button") ||
      document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest("#cube-faces button");
    if (!b) return;
    let yaw, pitch;
    if (b.dataset.face !== undefined) {
      ({ yaw, pitch } = cubeFaces[Number(b.dataset.face)]);
    } else {
      const i = Number(b.dataset.corner),
        x = i & 1 ? 1 : -1,
        z = i & 4 ? 1 : -1;
      yaw = Math.atan2(x, z);
      pitch = i & 2 ? 0.62 : -0.62;
    }
    const from = {
        yaw: scene.yaw,
        pitch: scene.pitch,
        distance: scene.distance,
        target: scene.target.clone(),
      },
      to = {
        yaw,
        pitch,
        distance: scene.distance,
        target: scene.target.clone(),
      };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches)
      scene.orient(yaw, pitch);
    else {
      scene.transition = { from, to, start: performance.now() };
      scene.invalidate();
    }
  });
}
function updateCube() {
  if (!$("cube-faces").children.length) return;
  const inv = scene.camera.quaternion.clone().invert();
  const project = (v) => {
    const p = new THREE.Vector3(...v).applyQuaternion(inv);
    return { x: 70 + p.x * 31, y: 68 - p.y * 31, z: p.z };
  };
  let polygons = [];
  cubeFaces.forEach((f, i) => {
    const n = f.normal,
      center = project(n),
      b = $("cube-faces").querySelector(`[data-face="${i}"]`);
    b.hidden = center.z < -0.05;
    b.style.left = center.x + "px";
    b.style.top = center.y + "px";
    const axis = n.findIndex((v) => v !== 0),
      others = [0, 1, 2].filter((a) => a !== axis);
    const pts = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].map((pair) => {
      const v = [...n];
      v[others[0]] = pair[0];
      v[others[1]] = pair[1];
      return project(v);
    });
    if (center.z >= -0.05)
      polygons.push({
        z: center.z,
        svg: `<polygon points="${pts.map((p) => `${p.x},${p.y}`).join(" ")}" fill="${center.z > 0.65 ? "#e1e4d9" : "#eef0e8"}" stroke="#a8b09d" stroke-width=".8"/>`,
      });
  });
  for (let i = 0; i < 8; i++) {
    const p = project([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1]);
    const b = $("cube-faces").querySelector(`[data-corner="${i}"]`);
    b.hidden = p.z < 0;
    b.style.left = p.x + "px";
    b.style.top = p.y + "px";
  }
  $("cube").innerHTML = polygons
    .sort((a, b) => a.z - b.z)
    .map((p) => p.svg)
    .join("");
}
function openInformation() {
  const metrics = scene.metrics();
  $("information-body").innerHTML =
    `<p>Twenty source structures form this right-shoulder study. BodyParts3D, © The Database Center for Life Science licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC Attribution 4.0 International</a>.</p><h3>What you are seeing</h3><p>Source polygon surfaces, transformed into an upright coordinate system. Restrained tissue colors and studio lighting help distinguish forms. They are illustrative rendering choices, not measured tissue reflectance or muscle-fiber direction.</p><p>The distal humeral shaft is visually clipped in cuff views to concentrate on the proximal joint. The full source humerus remains available in Regional vessels. Staging separates intact meshes; it does not model tissue mechanics.</p><h3>What is not represented</h3><p>Separate cuff tendons, insertion footprints, labrum, capsule, bursae, cartilage, ligaments and shoulder nerves are not supplied. The vascular tree is incomplete. Small cuff meshes cannot support fine musculotendinous detail. No missing structures have been invented.</p><h3>Curriculum and sources</h3><p>Origin, insertion, action, innervation and clinical notes are curriculum text, not observations extracted from the meshes. This educational reconstruction has not had an independent clinician review.</p><ul>${SOURCES.map((s) => `<li><a href="${s.url}" target="_blank" rel="noreferrer">${s.title}</a></li>`).join("")}</ul><h3>Controls</h3><p>Drag to orbit. Click to select; double-click or F to focus. Two-finger scrolling pans. Pinch zooms. Line-mode mouse wheel or Shift+wheel zooms toward the pointer. Shift/right drag pans. On touch screens, two fingers pan and pinch. Arrow keys orbit; +/− zoom; R resets; Escape clears selection. The orientation cube can be dragged independently of the anatomy.</p><h3>Canonical orientation</h3><div class="action-row">${cubeFaces.map((f, i) => `<button data-info-face="${i}">${f.letter} · ${f.name}</button>`).join("")}</div><h3>Secondary tools</h3><div class="action-row"><button id="section-toggle" aria-pressed="${state.section}">Sagittal section</button><button id="quality-toggle">${scene.renderer.getPixelRatio() > 1 ? "Use 1× DPR" : "Use device DPR"}</button></div><p>Sectioning is an uncapped viewing cut, not a segmented internal anatomical surface. Optional LOD1/LOD2 reduce only scapular context; all cuff topology is preserved. LOD0 is the default.</p><h3>Geometry provenance</h3><a href="./assets/provenance.json" target="_blank">Complete machine-readable provenance ↗</a><details><summary>All 20 structures</summary>${[...scene.parts.values()].map((p) => `<div class="provenance-row"><strong>${escape(p.name)}</strong><br>${p.id} · ${p.fma} · ${p.vertexCount.toLocaleString()} source vertices · ${p.faceCount.toLocaleString()} faces<br>UV: ${p.hasUV ? "yes" : "no"} · Source normals: ${p.hasNormals ? "yes" : "no"} · Textures: ${p.textures.length}<br>${escape(p.reviewStatus)}</div>`).join("")}</details><details><summary>Renderer diagnostics</summary><pre>${escape(JSON.stringify(metrics, null, 2))}</pre></details>`;
  $("information-body")
    .querySelectorAll("[data-info-face]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          const f = cubeFaces[Number(b.dataset.infoFace)];
          scene.orient(f.yaw, f.pitch);
          $("info-dialog").close();
        }),
    );
  $("section-toggle").onclick = (e) => {
    state.section = !state.section;
    e.target.setAttribute("aria-pressed", String(state.section));
    scene.refresh();
  };
  $("quality-toggle").onclick = () => {
    scene.renderer.setPixelRatio(
      scene.renderer.getPixelRatio() > 1 ? 1 : Math.min(devicePixelRatio, 2),
    );
    scene.resize();
    scene.invalidate();
    openInformation();
  };
  if (!$("info-dialog").open) $("info-dialog").showModal();
}

try {
  scene = new ShoulderScene($("specimen"), state, updateOverlays);
  await scene.load();
  $("loading").hidden = true;
  initialize();
} catch (e) {
  console.error(e);
  fail(
    "The source anatomy or WebGL renderer is unavailable. Check your connection, then reload. " +
      e.message,
  );
}
