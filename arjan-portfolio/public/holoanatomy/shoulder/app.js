import * as THREE from "three";
import { ShoulderScene } from "./scene.js";
import { bindInteraction } from "./interaction.js";
import {
  createState,
  DISSECTION, dissectionIds, dissect,
  ATLAS_GROUPS,
  ATLAS_IDS,
  ATLAS_VIEWS,
  atlasViewFor,
  PRESETS,
  SITS,
  CURRICULUM,
  CUFF_COLORS,
  LESSON,
  SOURCES,
  FUNCTION_STUDIES,
  QUIZ_LENGTH,
  quizComplete,
  quizSummary,
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
    .map(([id, p]) => `<option value="${id}" ${ATLAS_VIEWS[id] && scene.atlasError ? "disabled" : ""}>${p.label}</option>`)
    .join("");
  $("view-select").onchange = (e) => {
    if (ATLAS_VIEWS[e.target.value]) { openAtlas(e.target.value); return; }
    if (state.dissection.active) setMode("explore");
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
  $("present").onclick = () => {
    state.presenting = !state.presenting;
    if (state.presenting) {
      state.lesson = 0;
      state.study = null;
      setMode("learn");
    } else sync();
    scene.resize();
  };
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
    .map((p) => `<button data-select="${p.id}">${escape(p.name)}${ATLAS_IDS.includes(p.id) ? " · joint study" : ""}</button>`)
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
    pull: {
      enabled: () => state.mode === "peel" && state.dissection.active && state.dissection.tool === "lift",
      begin: (id, e) => {
        const d = state.dissection;
        if (state.mode !== "peel" || !d.active || d.tool !== "lift" || ATLAS_GROUPS.bones.includes(id) || d.removed.includes(id) || !dissectionIds(state).includes(id)) return false;
        scene.beginTissuePull(id);
        scene.pull.pointer = {x:e.clientX, y:e.clientY};
        $("specimen").style.cursor = "grabbing";
        $("feedback").textContent = `Holding ${name(id)}. Pull away; release a short pull to snap back.`;
        $("hover").hidden = true;
        return true;
      },
      move: (dx,dy) => {
        scene.moveTissuePull(dx,dy);
        if (!scene.pull) return;
        const rect = $("specimen").getBoundingClientRect(), badge = $("hover");
        badge.hidden = false;
        badge.textContent = `${name(scene.pull.id)} · ${Math.hypot(dx,dy) > 35 ? "Release to park" : "Pull farther"}`;
        badge.style.left = Math.max(8, Math.min(rect.width - 230, scene.pull.pointer.x + dx - rect.left + 18)) + "px";
        badge.style.top = Math.max(8, Math.min(rect.height - 45, scene.pull.pointer.y + dy - rect.top - 40)) + "px";
      },
      end: (commit) => {
        const id = scene.pull?.id;
        scene.finishTissuePull(commit);
        $("hover").hidden = true;
        if (commit && id) {
          dissect(state,id);
          $("feedback").textContent = `${name(id)} retracted. ${DISSECTION[state.dissection.step].task} Tap the lifted piece to return it.`;
          if (!matchMedia("(prefers-reduced-motion: reduce)").matches) navigator.vibrate?.(12);
        } else $("feedback").textContent = "Returned to its original position. Pull farther to keep a structure retracted.";
        scene.refresh(); renderPanel();
      },
      cancel: () => { $("hover").hidden = true; scene.finishTissuePull(false); scene.refresh(); $("feedback").textContent = "Pull cancelled; tissue returned."; },
    },
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
    canStage: () => state.mode === "peel" && !state.dissection.active && state.peel >= 2,
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
    if (state.presenting && e.key === "Escape") {
      state.presenting = false;
      sync();
      scene.resize();
    } else if (
      state.presenting &&
      state.mode === "learn" &&
      e.key === "PageDown"
    ) {
      if (LESSON[state.lesson].quiz) setMode("quiz");
      else lessonStep(state.lesson + 1);
    } else if (
      state.presenting &&
      state.mode === "learn" &&
      e.key === "PageUp"
    ) {
      lessonStep(state.lesson - 1);
    } else if (e.key === "ArrowLeft") scene.orbit(-12, 0);
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
  state.dissection = createState().dissection;
  state.study = null;
  state.selected = null;
  state.isolated = false;
  reassemble(state);
  scene.hover(null);
  $("hover").hidden = true;
  $("feedback").textContent = "";
  if (mode === "learn") lessonStep(state.lesson);
  else if (mode === "quiz") {
    state.quiz = createState().quiz;
    scene.applyView(question(state).view);
  } else if (mode === "peel") {
    state.peel = 0;
    state.dissection.active = !scene.atlasError;
    scene.applyView(state.dissection.active ? "atlas_capsule" : "posterior");
  } else scene.applyView("posterior");
  scene.refresh();
  sync();
  scene.resize();
  renderPanel();
}
function reset() {
  const mode = state.mode;
  Object.assign(state, createState());
  state.mode = mode;
  if (mode === "peel") { setMode("peel"); return; }
  if (mode === "learn") state.lesson = 0;
  scene.hover(null);
  scene.applyView(mode === "learn" ? "joint" : "posterior");
  $("feedback").textContent = "View reset.";
  sync();
  renderPanel();
}
function openAtlas(view) {
  if (!ATLAS_VIEWS[view] || scene.atlasError) return;
  state.mode = "explore";
  state.dissection.active = false;
  state.presenting = false;
  state.study = null;
  state.selected = null;
  state.isolated = false;
  reassemble(state);
  scene.hover(null);
  scene.applyView(view);
  renderPanel();
  document.querySelector(".inspector").scrollTop = 0;
}
function atlasNavigation() {
  if (scene.atlasError) return '<p class="integrity" role="status">The additional joint study could not load. The cuff study remains available. Reload to retry.</p>';
  return `<nav class="atlas-studies" aria-label="Inside the shoulder"><p class="kicker">INSIDE THE SHOULDER</p>${Object.entries(ATLAS_VIEWS).map(([id,v]) => `<button data-atlas-view="${id}" aria-pressed="${state.view === id}">${v.title}</button>`).join("")}</nav>`;
}
function select(id) {
  if (id && state.mode === "peel" && state.dissection.active) {
    if (state.dissection.tool === "lift" && state.dissection.removed.includes(id)) {
      state.dissection.undo.push([...state.dissection.removed]);
      state.dissection.removed = state.dissection.removed.filter(part => part !== id);
      state.selected = null;
      $("feedback").textContent = `${name(id)} returned to its original position.`;
      scene.refresh(); renderPanel(); return;
    }
    const changed = dissect(state, id);
    $("feedback").textContent = changed
      ? state.dissection.tool === "lift" ? `${name(id)} retracted beside the specimen.`
        : id === DISSECTION[state.dissection.step].target ? `Found it: ${name(id)}. Observation recorded.` : `${name(id)}. Keep exploring the target relationship.`
      : "This structure stays as bone context. Lift a soft-tissue structure instead.";
    scene.refresh(); renderPanel(); return;
  }
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
  if (ATLAS_IDS.includes(id)) {
    if (scene.atlasError) return;
    const preset = PRESETS[state.view];
    if (state.mode !== "explore" || !ATLAS_VIEWS[state.view] || ![...preset.visible, ...preset.ghost].includes(id))
      openAtlas(atlasViewFor(id));
  } else if (ATLAS_VIEWS[state.view]) scene.applyView(id === "FJ1504" ? "anterior" : "posterior");
  state.selected = id;
  scene.refresh();
  renderPanel();
}
function sync() {
  document.body.dataset.mode = state.mode;
  document.body.dataset.presenting = String(state.presenting);
  $("present").setAttribute("aria-pressed", String(state.presenting));
  $("present").setAttribute(
    "aria-label",
    state.presenting ? "Exit presentation" : "Start guided presentation",
  );
  $("present").innerHTML = state.presenting
    ? "× <span>Exit presentation</span>"
    : "▶ <span>Present</span>";
  document
    .querySelectorAll("#mode-controls [data-mode]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(state.mode === b.dataset.mode)),
    );
  $("view-select").value = state.view;
  document.querySelector(".view-caption h1").textContent = ATLAS_VIEWS[state.view] ? "Inside the joint." : "Rotator cuff.";
  document.querySelector(".inspector-top .lede").textContent = ATLAS_VIEWS[state.view] ? "Explore the deeper shoulder." : "Understand the cuff from every side.";
  $("structures-toggle").querySelector("span").textContent = scene.parts.size;
  $("source-summary").textContent = ATLAS_VIEWS[state.view] ? "Z-Anatomy · source-aligned joint study" : "BodyParts3D · Release 4.0";
  $("view-purpose").textContent = state.mode === "peel" && state.dissection.active ? `${state.dissection.tool === "probe" ? "◎ Probe" : "↗ Forceps"} · ${DISSECTION[state.dissection.step].title}` :
    state.mode === "learn" && state.study
      ? FUNCTION_STUDIES[state.study].title
      : PRESETS[state.view].purpose;
  $("crop-note").textContent =
    ATLAS_VIEWS[state.view]
      ? "Z-Anatomy specimen · source relationships preserved"
      : state.view === "vascular"
      ? "Regional vessels · incomplete source coverage"
      : "Proximal view · distal shaft cropped";
  $("atlas-toggle").setAttribute("aria-pressed", String(state.atlas));
  $("atlas-toggle").disabled = state.mode === "quiz";
  document.querySelector(".gesture-help").textContent = state.presenting
    ? "Page Up / Down · Tour chapters    Esc · Exit presentation"
    : "Drag to orbit · Two-finger scroll to pan · Pinch to zoom";
  $("structures-toggle").hidden = state.mode === "quiz";
  if (state.mode === "quiz") $("structure-list").hidden = true;
  scene.invalidate();
}
function detail(id) {
  const c = CURRICULUM[id],
    p = scene.parts.get(id);
  if (!p) return "";
  return `<p class="kicker">SELECTED STRUCTURE · ${p.id}</p><h2>${escape(name(id))}</h2><p class="integrity">SOURCE GEOMETRY · ${escape(p.fma || p.sourceObject)}<br>${p.triangleCount.toLocaleString()} triangles · ${escape(p.source)}</p><div class="action-row"><button data-action="focus">Focus <small>F</small></button><button data-action="isolate" aria-pressed="${state.isolated}">Isolate</button><button data-action="clear">Clear</button></div>${
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
      : p.note ? `<p>${escape(p.note)}</p><p class="integrity">${escape(p.reviewStatus)}</p><a href="./assets/atlas/provenance.json" target="_blank" rel="noreferrer">Source identity and processing ↗</a>` : `<p>${p.layer === "arteries" || p.layer === "veins" ? "A supplied segment of an incomplete regional vascular tree. No connecting vessels have been invented." : "Inspect this source structure in its anatomical context."}</p>`
  }`;
}
function renderPanel() {
  const focusedAction = $("context").contains(document.activeElement)
    ? document.activeElement?.dataset.action
    : null;
  sync();
  let html = "";
  if (state.mode === "explore")
    html = state.selected
      ? detail(state.selected)
      : `<span class="number">04</span><h2>Muscles that hold<br>the joint together.</h2><p>Turn the specimen. Follow a muscle from the scapula toward the humerus. Select one to look closer.</p><ul class="muscle-list">${SITS.map((id, i) => `<li><button data-select="${id}"><span class="dot" style="--swatch:${CUFF_COLORS[id]}"></span>${name(id)}<span class="index">0${i + 1}</span></button></li>`).join("")}</ul><p class="integrity">The cuff lesson uses the original BodyParts3D specimen. Explore the additional source-matched joint study below for deeper anatomy.</p>`;
  if (state.mode === "explore") {
    if (ATLAS_VIEWS[state.view] && !state.selected) {
      const view = ATLAS_VIEWS[state.view];
      html = `<p class="kicker">SOURCE ANATOMY · Z-ANATOMY</p><h2>${view.title}</h2><p>${view.text}</p><ul class="muscle-list">${ATLAS_GROUPS[view.group].map(id => `<li><button data-select="${id}">${escape(name(id))}</button></li>`).join("")}</ul><p class="integrity">These structures retain their matching source bones and positions. Ghosted context helps expose deeper surfaces. No cross-specimen fitting or anatomical deformation was applied.</p>`;
    }
    html += atlasNavigation();
  }
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
  if (state.mode === "peel" && state.dissection.active) html = dissectionPanel();
  else if (state.mode === "peel" && !scene.atlasError) html = '<button data-action="deep-lab">Open deep dissection lab →</button>' + html;
  if (state.mode === "learn") {
    const step = LESSON[state.lesson],
      study = FUNCTION_STUDIES[state.study];
    const tabs = `<div class="study-tabs" role="group" aria-label="Learning pathway"><button data-study="tour" aria-pressed="${!study}">Spatial tour</button>${Object.entries(
      FUNCTION_STUDIES,
    )
      .map(
        ([id, f]) =>
          `<button data-study="${id}" aria-pressed="${id === state.study}">${f.label}</button>`,
      )
      .join("")}</div>`;
    html =
      tabs +
      (study
        ? `<p class="kicker">FUNCTION STUDY · CURRICULUM</p><h2>${study.title}</h2><p>${study.text}</p><div class="observation"><span class="edition">TRY IT IN 3D</span><p>${study.task}</p></div><ul class="muscle-list">${study.ids.map((id) => `<li><button data-select="${id}"><span class="dot" style="--swatch:${CUFF_COLORS[id]}"></span>${name(id)}</button></li>`).join("")}</ul><p class="integrity">${study.boundary}</p><button data-action="sources">Read curriculum sources ↗</button>`
        : `<p class="kicker">SPATIAL TOUR · ${state.lesson + 1} / ${LESSON.length}</p><h2>${step.title}</h2><p>${step.text}</p><div class="steps"><span style="width:${((state.lesson + 1) / LESSON.length) * 100}%"></span></div><div class="lesson-nav"><button data-action="previous" ${state.lesson === 0 ? "disabled" : ""}>← Back</button><button class="primary" data-action="next">${step.quiz ? "Start quiz" : "Continue →"}</button></div><nav class="chapter-list" aria-label="Lesson chapters">${LESSON.map((chapter, i) => `<button data-chapter="${i}" ${i === state.lesson ? 'aria-current="step"' : ""}><span>${String(i + 1).padStart(2, "0")}</span>${chapter.title}</button>`).join("")}</nav>`);
    html += state.selected
      ? `<details><summary>Structure notes · ${name(state.selected)}</summary>${detail(state.selected)}</details>`
      : "";
  }
  if (state.mode === "quiz") {
    if (quizComplete(state)) {
      html = `<p class="kicker">SESSION REVIEW · 12 QUESTIONS</p><h2>What can you find now?</h2><p><span class="quiz-score">${state.quiz.score}</span> / ${QUIZ_LENGTH} correct on the first attempt</p><div class="score-breakdown">${quizSummary(
        state,
      )
        .map(
          (r) =>
            `<p><span>${r.level}</span><strong>${r.correct} / ${r.total}</strong></p>`,
        )
        .join(
          "",
        )}</div><h3>Revisit the anatomy</h3><p>Choose a structure to review its position and function.</p><ul class="muscle-list">${SITS.map((id) => `<li><button data-review="${id}">${name(id)}<small>${state.quiz.history.filter((r) => r.id === id && r.firstAttempt).length}/3 first try</small></button></li>`).join("")}</ul><button class="primary" data-action="quiz-restart">Practice again</button><p class="integrity">A practice-session result, not a validated measure of clinical competence. Results stay in this tab and reset when you reload.</p>`;
    } else {
      const q = question(state);
      html = `<p class="kicker">ACTIVE RECALL · ${q.level} · ${state.quiz.index + 1} / ${QUIZ_LENGTH}</p><h2>${q.prompt}</h2><p>Select the structure on the specimen. Orbit to inspect it from another angle.</p><div class="steps"><span style="width:${(state.quiz.index / QUIZ_LENGTH) * 100}%"></span></div><p><span class="quiz-score">${state.quiz.score}</span> <small>first-attempt points</small></p><button class="primary" data-action="quiz-next" ${!state.quiz.answered ? "disabled" : ""}>${state.quiz.index === QUIZ_LENGTH - 1 ? "Review session →" : "Next question →"}</button><details><summary>Keyboard answer controls</summary><p>Choose the structure you would select in the model.</p>${SITS.map((id) => `<button data-select="${id}">${name(id)}</button>`).join("")}</details><p class="integrity">Names → spatial relationships → function. Later rounds start from the same lateral view: rotate to find the answer. Retries support practice without adding points.</p>`;
    }
  }
  $("context").innerHTML = html;
  if (focusedAction) {
    const next = $("context").querySelector(
      `[data-action="${focusedAction}"]:not(:disabled)`,
    );
    if (next) next.focus({ preventScroll: true });
    else {
      const heading = $("context").querySelector("h2");
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }
}
function dissectionPanel() {
  const d = state.dissection, station = DISSECTION[d.step];
  const available = dissectionIds(state).filter(id => !d.removed.includes(id));
  return `<p class="kicker">DISSECTION LAB · ${d.found.length} / ${DISSECTION.length} OBSERVATIONS</p>
    <h2>${station.title}</h2><p>${station.task}</p>
    <div class="steps" role="progressbar" aria-label="Dissection observations" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${d.found.length}"><span style="width:${d.found.length / DISSECTION.length * 100}%"></span></div>
    ${d.found.length === DISSECTION.length ? '<p class="observation">All five targets found. Reassemble the specimen and explore how their positions relate. Use Reset for a fresh session.</p>' : ''}
    <nav class="study-tabs" aria-label="Dissection stations">${DISSECTION.map((step,i) => `<button data-station="${i}" aria-current="${i === d.step ? 'step' : 'false'}">${d.found.includes(i) ? '✓' : i+1} · ${step.title}</button>`).join('')}</nav>
    <div class="study-tabs" role="group" aria-label="Dissection tools"><button data-tool="probe" aria-pressed="${d.tool === 'probe'}">◎ Probe · identify</button><button data-tool="lift" aria-pressed="${d.tool === 'lift'}">↗ Forceps · grab & pull</button></div>
    <p class="integrity"> ${d.tool === 'probe' ? 'Click to identify. Drag to orbit.' : 'Grab tissue and drag to pull it aside. Release to park it; tap a parked piece to return. Drag empty space to orbit.'} Bones remain as ghosted context.</p>
    ${d.removed.some(id => dissectionIds(state).includes(id)) ? `<div class="observation"><span class="edition">WHAT DID YOU UNCOVER?</span><p>${[
      "Compare the exposed cuff surfaces with the lifted bursa. Return the piece, then pull it away again to see what it obscures.",
      "Switch to Probe and find the infraspinatus tendon region. Compare its location with the separate insertion annotations.",
      "Orbit through the opening you created. Use Probe to distinguish the labrum, cartilage surfaces and ligament structures; restore the capsule to compare.",
      "Inspect the joint rim from a second angle. Return one lifted structure at a time and observe which surfaces it covers.",
      "Switch to Probe and trace the supplied axillary nerve. Return the vessels one at a time to compare their spatial relationships."
    ][d.step]}</p><button data-tool="probe">Probe what is exposed →</button></div>` : ''}
    <div class="action-row"><button data-action="lab-undo" ${!d.undo.length ? 'disabled' : ''}>Undo lift</button><button data-action="lab-restore" ${!d.removed.length ? 'disabled' : ''}>Restore all</button></div>
    ${state.selected ? `<div class="observation"><strong>${escape(name(state.selected))}</strong><button data-action="focus">Focus structure</button><button data-action="sources">Source & provenance</button></div>` : ''}
    <details><summary>Accessible structure controls · ${available.length}</summary><div class="stage-list">${available.map(id => `<button data-select="${id}">${escape(name(id))}</button>`).join('')}</div></details>
    <details ${d.removed.length ? 'open' : ''}><summary>Retracted tissue · ${d.removed.length}</summary><p>Pieces remain visible beside the specimen. Return any piece to its original position.</p><div class="stage-list">${d.removed.map(id => `<button data-restore="${id}">↶ ${escape(name(id))}</button>`).join('')}</div></details>
    <p class="integrity">Five teaching exposures in one source-matched specimen. Whole-mesh retraction is reversible; this does not simulate incisions, tissue mechanics or a surgical approach. Insertion regions are source annotations.</p>
    <button data-action="surface-lab">Switch to deltoid & cuff specimen</button>`;
}
function lessonStep(n) {
  state.study = null;
  state.lesson = Math.max(0, Math.min(LESSON.length - 1, n));
  const s = LESSON[state.lesson];
  state.selected = s.id || null;
  state.isolated = false;
  scene.applyView(s.view);
  scene.refresh();
  renderPanel();
}
function contextClick(e) {
  const station = e.target.closest("[data-station]"), tool = e.target.closest("[data-tool]"), restore = e.target.closest("[data-restore]");
  const labAction = e.target.closest("[data-action]")?.dataset.action;
  if (station || tool || restore || ["lab-undo", "lab-restore", "surface-lab", "deep-lab"].includes(labAction)) {
    const d = state.dissection;
    if (station) { d.step = Number(station.dataset.station); state.selected = null; scene.applyView(d.step === 4 ? "atlas_neurovascular" : "atlas_capsule"); }
    if (tool) d.tool = tool.dataset.tool;
    if (restore || labAction === "lab-restore") { d.undo.push([...d.removed]); d.removed = restore ? d.removed.filter(id => id !== restore.dataset.restore) : []; }
    if (labAction === "lab-undo" && d.undo.length) { d.removed = d.undo.pop(); state.selected = null; }
    if (labAction === "deep-lab") { setMode("peel"); return; }
    if (labAction === "surface-lab") { d.active = false; state.selected = null; state.peel = 0; scene.applyView("posterior"); }
    scene.refresh(); renderPanel();
    if (station) $("context").querySelector(`[data-station="${d.step}"]`)?.focus({preventScroll:true});
    if (tool) $("context").querySelector(`[data-tool="${d.tool}"]`)?.focus({preventScroll:true});
    return;
  }
  const atlasButton = e.target.closest("[data-atlas-view]");
  if (atlasButton) {
    openAtlas(atlasButton.dataset.atlasView);
    $("context").querySelector(`[data-atlas-view="${state.view}"]`)?.focus({preventScroll:true});
    return;
  }
  const studyButton = e.target.closest("[data-study]");
  if (studyButton) {
    const id = studyButton.dataset.study;
    if (id === "tour") lessonStep(state.lesson);
    else if (FUNCTION_STUDIES[id]) {
      state.study = id;
      state.selected = null;
      state.isolated = false;
      scene.applyView(FUNCTION_STUDIES[id].view);
      scene.refresh();
      renderPanel();
    }
    $("context")
      .querySelector(`[data-study="${id}"]`)
      ?.focus({ preventScroll: true });
    return;
  }
  const chapter = e.target.closest("[data-chapter]");
  if (chapter) {
    lessonStep(Number(chapter.dataset.chapter));
    $("context")
      .querySelector(`[data-chapter="${state.lesson}"]`)
      ?.focus({ preventScroll: true });
    return;
  }
  const review = e.target.closest("[data-review]");
  if (review) {
    setMode("explore");
    if (review.dataset.review === "FJ1504") scene.applyView("anterior");
    select(review.dataset.review);
    return;
  }

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
    if (!quizComplete(state)) scene.applyView(question(state).view);
    $("feedback").textContent = "";
    renderPanel();
  }
  if (action === "quiz-restart") setMode("quiz");
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
          : state.mode === "learn" && state.study
            ? FUNCTION_STUDIES[state.study].ids
            : state.dissection.active && state.mode === "peel" ? [] : PRESETS[state.view].labels
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
    `<p>The cuff lesson contains twenty original source structures. BodyParts3D, © The Database Center for Life Science licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC Attribution 4.0 International</a>.</p><p>The additional joint study contains ${scene.atlasProvenance?.structures.length || 0} source-derived parts from Z-Anatomy, under <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>. Attribution: BodyParts3D — The Database Center for Life Science — CC BY-SA 2.1 Japan; Z-Anatomy — The libre 3D atlas of anatomy — CC BY-SA 4.0. <a href="./assets/atlas/LICENSE.txt" target="_blank">Full attribution and derivative license</a>.</p><h3>What you are seeing</h3><p>Source polygon surfaces, transformed into an upright coordinate system. Illustrative tissue colors and a camera-relative studio light rig help distinguish forms. The original cuff GLB uses Blender-derived cuff shading normals shared across coincident source positions; every triangle and vertex position is preserved. They are illustrative rendering choices, not measured tissue reflectance or muscle-fiber direction.</p><p>The distal humeral shaft is visually clipped in cuff views to concentrate on the proximal joint. The full source humerus remains available in Regional vessels. Staging separates intact meshes; it does not model tissue mechanics.</p><h3>Additional anatomy and remaining limits</h3><p>The joint study adds source-authored labrum, capsule, bursae, ligaments, shoulder nerve and vessel segments, cartilage-classified surfaces, four insertion-region overlays and an infraspinatus tendon-classified region. These use their matching Z-Anatomy bones, separately from the original cuff specimen. Four complete cuff tendons, measured footprints, volumetric cartilage thickness and fine fiber detail are still not supplied. Regional nerve and vessel trees remain incomplete. Source-authored shapes are not independently clinically validated.</p><h3>Curriculum and sources</h3><p>Origin, insertion, action, innervation and clinical notes are curriculum text, not observations extracted from the meshes. This educational reconstruction has not had an independent clinician review.</p><ul>${SOURCES.map((s) => `<li><a href="${s.url}" target="_blank" rel="noreferrer">${s.title}</a></li>`).join("")}</ul><h3>Controls</h3><p>Drag to orbit. Click to select; double-click or F to focus. Two-finger scrolling pans. Pinch zooms. Line-mode mouse wheel or Shift+wheel zooms toward the pointer. Shift/right drag pans. On touch screens, two fingers pan and pinch. Arrow keys orbit; +/− zoom; R resets; Escape clears selection. The orientation cube can be dragged independently of the anatomy.</p><h3>Canonical orientation</h3><div class="action-row">${cubeFaces.map((f, i) => `<button data-info-face="${i}">${f.letter} · ${f.name}</button>`).join("")}</div><h3>Secondary tools</h3><div class="action-row"><button id="section-toggle" aria-pressed="${state.section}">Sagittal section</button><button id="quality-toggle">${scene.renderer.getPixelRatio() > 1 ? "Use 1× DPR" : "Use device DPR"}</button></div><p>Sectioning is an uncapped viewing cut, not a segmented internal anatomical surface. Optional LOD1/LOD2 reduce only scapular context; all cuff topology is preserved. LOD0 is the default.</p><h3>Geometry provenance</h3><a href="./assets/provenance.json" target="_blank">Complete machine-readable provenance ↗</a><p><a href="./assets/atlas/provenance.json" target="_blank">Additional joint study provenance ↗</a></p><details><summary>All ${scene.parts.size} loaded structures</summary>${[...scene.parts.values()].map((p) => `<div class="provenance-row"><strong>${escape(p.name)}</strong><br>${p.id} · ${escape(p.fma || p.sourceObject)} · ${p.vertexCount.toLocaleString()} vertices · ${p.faceCount.toLocaleString()} faces<br>${escape(p.source)} · ${escape(p.license)}<br>Asset UV: ${p.hasUV ? "yes" : "no"} · Asset normals: ${p.hasNormals ? "yes" : "no"} · Textures: ${p.textures.length}<br>${escape(p.reviewStatus)}${p.runtimeShading ? `<br>LOD0 shading: ${escape(p.runtimeShading.lod0)}` : ""}</div>`).join("")}</details><details><summary>Renderer diagnostics</summary><pre>${escape(JSON.stringify(metrics, null, 2))}</pre></details>`;
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
