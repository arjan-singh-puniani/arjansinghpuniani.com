import { ANATOMY_MANIFEST, BODY_PARTS_LICENSE, LAYERS, MODULES, MODULE_MANIFESTS, validateManifest } from './anatomy/manifest.js';
import { loadManifest } from './engine/loader.js';
import { HoloRenderer } from './engine/renderer.js';
import { AdaptiveQuality, chooseQuality } from './engine/quality.js';
import { createInitialState, selectStructure, setQuality, structureVisibility } from './state/store.js';
import { setupControls } from './ui/controls.js';
import { buildQuizChoices, chooseQuizTarget, uniqueNamePool } from './learning/quiz.js';

const canvas = document.getElementById('anatomy-canvas');
const fallback = document.getElementById('fallback');
const loading = document.getElementById('loading');
const loadBar = document.getElementById('load-bar');
const loadSummary = document.getElementById('load-summary');
const loadStatus = document.getElementById('load-status');
const assetWarning = document.getElementById('asset-warning');
const debug = document.getElementById('debug');
const fallbackTitle = document.getElementById('fallback-title');
const fallbackMessage = document.getElementById('fallback-message');
const moduleSelect = document.getElementById('module-select');
const moduleTitle = document.getElementById('module-title');
const moduleSubtitle = document.getElementById('module-subtitle');
const exhibitsPanel = document.getElementById('exhibits-panel');
const exhibitList = document.getElementById('exhibit-list');
const exhibitsButton = document.getElementById('exhibits-button');
const hoverLabel = document.getElementById('hover-label');
const hoverSystem = document.getElementById('hover-system');
const hoverName = document.getElementById('hover-name');
const hoverMeta = document.getElementById('hover-meta');
const quizPanel = document.getElementById('quiz-panel');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const detectedQuality = chooseQuality({
  width: innerWidth,
  dpr: devicePixelRatio || 1,
  hardwareConcurrency: navigator.hardwareConcurrency || 4,
  deviceMemory: navigator.deviceMemory || 4,
  mobile
});
const state = createInitialState({ reducedMotion, quality: 'auto' });
const manifestById = new Map(ANATOMY_MANIFEST.map(p => [p.id,p]));
const errors = validateManifest();
if (errors.length) throw new Error(`Invalid anatomy manifest:\n${errors.join('\n')}`);

let renderer;
try {
  renderer = new HoloRenderer(canvas, state, { quality: detectedQuality });
} catch (error) {
  console.error(error);
  canvas.hidden = true;
  fallbackTitle.textContent = 'Interactive 3D is unavailable.';
  fallbackMessage.textContent = 'Your browser or graphics hardware could not start the WebGL 2 renderer. Try a current Chrome, Safari, Firefox, or Edge build with WebGL 2 enabled.';
  fallback.hidden = false;
  loading.hidden = true;
  throw error;
}

const adaptive = new AdaptiveQuality(detectedQuality);
window.addEventListener('holoanatomy:contextlost', () => {
  fallbackTitle.textContent = 'Graphics context was lost.';
  fallbackMessage.textContent = 'The browser released the WebGL context, usually because of GPU or memory pressure. Reload the page to restore the anatomy viewer.';
  fallback.hidden = false;
});

const controls = setupControls({ state, renderer, manifestById });
setupQualityControl();
setupInteraction();
setupDebug();
setupModulePicker();
const quizController = setupQuizMode();

const loadedModules = new Set();
const loadingPromises = new Map();
const controller = new AbortController();
window.addEventListener('beforeunload', () => controller.abort(), { once:true });

await switchModule(state.module, { initial:true });

function setupModulePicker() {
  moduleSelect.innerHTML = '';
  exhibitList.innerHTML = '';
  const countBadge = exhibitsButton.querySelector('.toolbar-count');
  if (countBadge) countBadge.textContent = String(Object.keys(MODULES).length);
  const updateActive = () => {
    exhibitList.querySelectorAll('.exhibit-card').forEach(card => {
      const active = card.dataset.module === state.module;
      card.classList.toggle('active', active);
      card.setAttribute('aria-current', active ? 'true' : 'false');
      const current = card.querySelector('.exhibit-current');
      if (current) current.textContent = active ? 'Current' : 'Open';
    });
  };

  for (const [id, cfg] of Object.entries(MODULES)) {
    const option = document.createElement('option');
    option.value = id; option.textContent = cfg.label;
    moduleSelect.append(option);

    const card = document.createElement('button');
    card.type = 'button'; card.className = 'exhibit-card'; card.dataset.module = id;
    card.innerHTML = `<div class="exhibit-meta"><span>${MODULE_MANIFESTS[id].length} verified structures</span><span class="exhibit-current">Open</span></div><strong>${cfg.label}</strong><p>${cfg.subtitle}</p>`;
    card.addEventListener('click', async () => {
      if (id === state.module) { exhibitsPanel.hidden = true; exhibitsButton.setAttribute('aria-expanded','false'); return; }
      exhibitsPanel.hidden = true; exhibitsButton.setAttribute('aria-expanded','false');
      moduleSelect.disabled = true;
      try { await switchModule(id); }
      finally { moduleSelect.disabled = false; updateActive(); }
    });
    exhibitList.append(card);
  }

  moduleSelect.value = state.module;
  updateActive();
  moduleSelect.addEventListener('change', async () => {
    const requested = moduleSelect.value;
    moduleSelect.disabled = true;
    try { await switchModule(requested); }
    finally { moduleSelect.disabled = false; updateActive(); }
  });
  exhibitsButton.addEventListener('click', () => {
    const show = exhibitsPanel.hidden;
    controls.closePopovers();
    exhibitsPanel.hidden = !show;
    exhibitsButton.setAttribute('aria-expanded', String(show));
    updateActive();
  });

  return { updateActive };
}

async function switchModule(moduleId, { initial = false } = {}) {
  const cfg = MODULES[moduleId];
  if (!cfg) throw new Error(`Unknown anatomy module: ${moduleId}`);
  state.selectedId = null; state.isolatedId = null; state.explode = false;
  renderer.hoveredId = null; renderer.quizTargetId = null; hideHoverLabel();
  renderer.reassembleAll();
  state.module = moduleId;
  renderer.setModule(moduleId);
  moduleSelect.value = moduleId;
  moduleTitle.textContent = cfg.label;
  moduleSubtitle.textContent = cfg.subtitle;
  document.title = `HoloAnatomy — ${cfg.label}`;
  controls.refreshSelection(); controls.refreshStageLabels(true);
  await loadModule(moduleId);
  renderer.setModule(moduleId);
  if (!initial) controls.renderLayers();
  exhibitList.querySelectorAll('.exhibit-card').forEach(card => card.classList.toggle('active', card.dataset.module === moduleId));
  if (state.quizMode) quizController?.resetForModule();
}


async function loadModule(moduleId) {
  if (loadedModules.has(moduleId)) return;
  if (loadingPromises.has(moduleId)) return loadingPromises.get(moduleId);
  const manifest = MODULE_MANIFESTS[moduleId];
  const promise = (async () => {
    loading.classList.remove('done'); loading.hidden = false;
    loadBar.style.width = '0%'; loadSummary.textContent = `0 / ${manifest.length}`;
    loadStatus.textContent = `Loading ${MODULES[moduleId].label}…`;
    const { loaded, failures } = await loadManifest(manifest, {
      concurrency: mobile ? 4 : 8, signal: controller.signal,
      onPart(result) { renderer.addMesh(result.part, result.geometry); },
      onProgress({ completed, total, part, failed }) {
        loadSummary.textContent = `${completed} / ${total}`;
        loadBar.style.width = `${(completed/total)*100}%`;
        loadStatus.textContent = failed ? `${part.name} checked · ${failed} unavailable` : `${part.name} ready`;
      }
    });
    if (!loaded.length) {
      assetWarning.hidden = false;
      loadStatus.textContent = 'No anatomical geometry could be loaded.';
      fallbackTitle.textContent = 'Anatomy assets are unavailable.';
      fallbackMessage.textContent = 'The renderer started correctly, but no verified BodyParts3D mesh could be loaded.';
      fallback.hidden = false;
    } else {
      loadedModules.add(moduleId);
      loadStatus.textContent = failures.length ? `${loaded.length} structures ready · ${failures.length} unavailable` : `${loaded.length} verified structures ready`;
      if (failures.length) assetWarning.hidden = false;
      window.setTimeout(() => loading.classList.add('done'), failures.length ? 2000 : 500);
    }
  })();
  loadingPromises.set(moduleId, promise);
  try { await promise; } finally { loadingPromises.delete(moduleId); }
}

requestAnimationFrame(frame);

let previousFrame = performance.now();
function frame(now) {
  renderer.render(now);
  const frameMs = now - previousFrame;
  previousFrame = now;
  if (state.quality === 'auto' && renderer.meshes.length) {
    const next = adaptive.sample(frameMs);
    if (next) renderer.setQuality(next);
  }
  controls.updateStageLabelPositions();
  if (!debug.hidden) updateDebug();
  requestAnimationFrame(frame);
}

function setupQualityControl() {
  const list = document.getElementById('layer-list');
  const row = document.createElement('label');
  row.className = 'quality-row';
  row.innerHTML = `<span>Render quality</span><select aria-label="Render quality"><option value="auto">Auto</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>`;
  list.parentElement.append(row);
  const select = row.querySelector('select');
  select.value = state.quality;
  select.addEventListener('change', () => {
    setQuality(state, select.value);
    const next = state.quality === 'auto' ? detectedQuality : state.quality;
    adaptive.level = next;
    renderer.setQuality(next);
  });
}

function hideHoverLabel() {
  hoverLabel.hidden = true;
  renderer.hoveredId = null;
}

function showHoverLabel(mesh, clientX, clientY) {
  if (!mesh || state.quizMode) { hideHoverLabel(); return; }
  const part = mesh.part;
  hoverSystem.textContent = LAYERS[part.layer]?.label || part.layer;
  hoverName.textContent = part.name + (part.component ? ` · component ${part.component}` : '');
  hoverMeta.textContent = `${part.fma} · click to inspect${state.dissect ? ' · drag to dissect' : ''}`;
  const rect = document.getElementById('app').getBoundingClientRect();
  hoverLabel.hidden = false;
  const box = hoverLabel.getBoundingClientRect();
  const x = Math.max(8, Math.min(rect.width - box.width - 22, clientX - rect.left));
  const y = Math.max(8, Math.min(rect.height - box.height - 22, clientY - rect.top));
  hoverLabel.style.left = `${x}px`;
  hoverLabel.style.top = `${y}px`;
}

function setupQuizMode() {
  const button = document.getElementById('quiz-button');
  const score = document.getElementById('quiz-score');
  const options = document.getElementById('quiz-options');
  const feedback = document.getElementById('quiz-feedback');
  const hint = document.getElementById('quiz-hint');
  const hintButton = document.getElementById('quiz-hint-button');
  const nextButton = document.getElementById('quiz-next');
  const skipButton = document.getElementById('quiz-skip');
  const endButton = document.getElementById('quiz-end');
  let correct = 0, attempted = 0, target = null, answered = false, previousId = null;
  let previousDissect = state.dissect;

  const partsForQuiz = () => uniqueNamePool(renderer.activeMeshes()
    .filter(mesh => structureVisibility(state, mesh.part).visible)
    .map(mesh => mesh.part));

  function updateScore() { score.textContent = `${correct} / ${attempted}`; }
  function clearQuestionUI() {
    options.innerHTML = ''; feedback.textContent = ''; feedback.className = 'quiz-feedback';
    hint.hidden = true; hint.textContent = ''; nextButton.disabled = true; answered = false;
  }
  function startQuestion() {
    if (!state.quizMode) return;
    clearQuestionUI();
    const pool = partsForQuiz();
    target = chooseQuizTarget(pool, previousId);
    if (!target) {
      feedback.textContent = 'No unambiguous visible structures are available for this quiz. Turn on a layer or choose another exhibit.';
      renderer.quizTargetId = null;
      return;
    }
    previousId = target.id;
    renderer.quizTargetId = target.id;
    const mesh = renderer.activeMeshes().find(m => m.part.id === target.id);
    if (mesh) renderer.focusMesh(mesh);
    const choices = buildQuizChoices(pool, target, 4);
    if (choices.length < 2) {
      feedback.textContent = 'Not enough distinct structures are visible to build answer choices.';
      return;
    }
    for (const choice of choices) {
      const option = document.createElement('button');
      option.type = 'button'; option.className = 'quiz-option'; option.dataset.id = choice.id;
      option.textContent = choice.name;
      option.addEventListener('click', () => answer(choice, option));
      options.append(option);
    }
  }
  function answer(choice, option) {
    if (answered || !target) return;
    answered = true; attempted++;
    const isCorrect = choice.id === target.id;
    if (isCorrect) correct++;
    for (const node of options.querySelectorAll('.quiz-option')) {
      node.disabled = true;
      if (node.dataset.id === target.id) node.classList.add('correct');
    }
    if (!isCorrect) option.classList.add('incorrect');
    feedback.className = `quiz-feedback ${isCorrect ? 'good' : 'bad'}`;
    feedback.textContent = isCorrect
      ? `Correct. ${target.name} · ${target.fma}.`
      : `The highlighted structure is ${target.name} · ${target.fma}.`;
    nextButton.disabled = false;
    updateScore();
  }
  function enter() {
    if (state.quizMode) return;
    state.quizMode = true; previousDissect = state.dissect; state.dissect = false;
    button.setAttribute('aria-pressed','true'); quizPanel.hidden = false;
    document.getElementById('app').classList.add('quiz-mode');
    document.getElementById('dissect-button').setAttribute('aria-pressed','false');
    for (const id of ['dissect-button','table-button','explode-button']) document.getElementById(id).disabled = true;
    document.getElementById('gesture-hint').textContent = 'Quiz mode · identify the cyan-outlined structure · rotate and zoom to inspect';
    hideHoverLabel(); controls.closePopovers(); exhibitsPanel.hidden = true; exhibitsButton.setAttribute('aria-expanded','false');
    startQuestion();
  }
  function exit() {
    if (!state.quizMode) return;
    state.quizMode = false; state.dissect = previousDissect;
    button.setAttribute('aria-pressed','false'); quizPanel.hidden = true;
    renderer.quizTargetId = null; document.getElementById('app').classList.remove('quiz-mode');
    document.getElementById('dissect-button').setAttribute('aria-pressed',String(state.dissect));
    for (const id of ['dissect-button','table-button','explode-button']) document.getElementById(id).disabled = false;
    document.getElementById('gesture-hint').textContent = state.dissect ? (state.table ? 'Dissect + Table · pull a structure and release to stage it · drag it back to reassemble' : 'Free dissection · drag a structure anywhere · drag empty space to rotate') : 'Explore mode · drag to rotate · tap a structure';
  }
  function resetForModule() {
    correct = 0; attempted = 0; previousId = null; updateScore();
    if (state.quizMode) startQuestion();
  }

  button.addEventListener('click', () => state.quizMode ? exit() : enter());
  endButton.addEventListener('click', exit);
  nextButton.addEventListener('click', startQuestion);
  skipButton.addEventListener('click', () => { if (!state.quizMode) return; startQuestion(); });
  hintButton.addEventListener('click', () => {
    if (!target) return;
    hint.textContent = `System: ${LAYERS[target.layer]?.label || target.layer}. The highlighted geometry is a verified BodyParts3D structure.`;
    hint.hidden = false;
  });
  updateScore();
  return { enter, exit, startQuestion, resetForModule };
}

function setupInteraction() {
  const pointers = new Map();
  let gestureMoved = false;
  let pinchDistance = 0;
  let downAt = null;
  let dissectMesh = null;
  let dissectMoved = false;
  let hoverTimer = null;
  let hoverPoint = null;
  let lastHoverPick = 0;

  const normalizedPointer = e => {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX-r.left)/r.width*2-1, -((e.clientY-r.top)/r.height*2-1)];
  };

  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture?.(e.pointerId);
    pointers.set(e.pointerId, { x:e.clientX, y:e.clientY });
    gestureMoved = false;
    downAt = { x:e.clientX, y:e.clientY, time:performance.now() };
    dissectMesh = null;
    dissectMoved = false;
    hideHoverLabel();

    if (state.dissect && pointers.size === 1) {
      const mesh = renderer.pick(e.clientX,e.clientY);
      if (mesh) {
        dissectMesh = mesh;
        selectStructure(state, mesh.part.id);
        controls.refreshSelection();
        canvas.classList.add('pulling');
      }
    }

    if (pointers.size === 2) {
      dissectMesh = null;
      canvas.classList.remove('pulling');
      const pts=[...pointers.values()];
      pinchDistance=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
    }
  });

  canvas.addEventListener('pointermove', e => {
    const n = normalizedPointer(e);
    renderer.camera.parallax = [n[0], n[1]];
    if (!pointers.has(e.pointerId)) {
      if (!mobile && !state.quizMode) queueHoverPick(e.clientX, e.clientY);
      return;
    }
    const previous = pointers.get(e.pointerId);
    pointers.set(e.pointerId, {x:e.clientX,y:e.clientY});
    if (pointers.size === 1) {
      const dx=e.clientX-previous.x, dy=e.clientY-previous.y;
      if (Math.abs(dx)+Math.abs(dy)>1) gestureMoved=true;
      if (dissectMesh) {
        if (Math.abs(dx)+Math.abs(dy)>1) dissectMoved=true;
        renderer.pullMesh(dissectMesh, dx, dy);
        controls.refreshStageLabels(true);
        controls.refreshSelection();
      } else {
        renderer.camera.orbit(-dx*0.0065,-dy*0.0065);
      }
    } else if (pointers.size === 2) {
      const pts=[...pointers.values()];
      const d=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
      if (pinchDistance>0) renderer.camera.zoom(Math.log(d/pinchDistance));
      pinchDistance=d; gestureMoved=true;
    }
  });

  function queueHoverPick(x, y) {
    hoverPoint = { x, y };
    if (hoverTimer) return;
    const wait = Math.max(0, 55 - (performance.now() - lastHoverPick));
    hoverTimer = window.setTimeout(() => {
      hoverTimer = null; lastHoverPick = performance.now();
      if (!hoverPoint || pointers.size || state.quizMode) return;
      const point = hoverPoint;
      const mesh = renderer.pick(point.x, point.y);
      renderer.hoveredId = mesh?.part.id || null;
      if (mesh) showHoverLabel(mesh, point.x, point.y); else hideHoverLabel();
    }, wait);
  }

  const endPointer = e => {
    const wasTap = downAt && !gestureMoved && Math.hypot(e.clientX-downAt.x,e.clientY-downAt.y)<7 && performance.now()-downAt.time<650;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchDistance=0;
    if (wasTap && !dissectMesh) chooseAt(e.clientX,e.clientY,false);
    else if (wasTap && dissectMesh) {
      selectStructure(state, dissectMesh.part.id);
      controls.refreshSelection();
    } else if (dissectMesh && dissectMoved) {
      if (renderer.pullDistance(dissectMesh) < 0.18) renderer.returnMesh(dissectMesh);
      else if (state.table) renderer.stageMesh(dissectMesh);
      controls.refreshStageLabels(true);
      controls.refreshSelection();
    }
    dissectMesh = null; dissectMoved=false;
    canvas.classList.remove('pulling');
    if (!pointers.size) downAt=null;
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', e => {
    pointers.delete(e.pointerId);
    if (dissectMesh && dissectMoved && state.table && renderer.pullDistance(dissectMesh)>=0.18) renderer.stageMesh(dissectMesh);
    dissectMesh=null; dissectMoved=false; controls.refreshStageLabels(true); canvas.classList.remove('pulling');
  });
  canvas.addEventListener('wheel', e => { e.preventDefault(); const delta = e.ctrlKey ? -e.deltaY : e.deltaY; renderer.camera.zoom(delta*0.00125); }, { passive:false });
  canvas.addEventListener('dblclick', e => { e.preventDefault(); chooseAt(e.clientX,e.clientY,true); });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('pointerleave', () => { hoverPoint = null; hideHoverLabel(); });

  async function chooseAt(x,y,focus) {
    const mesh=renderer.pick(x,y);
    selectStructure(state,mesh?.part.id || null);
    if (!mesh) state.isolatedId=null;
    controls.refreshSelection();
    if (mesh && focus) renderer.focusMesh(mesh);
  }

  window.addEventListener('keydown', e => {
    const tag=document.activeElement?.tagName;
    if (tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA') return;
    if (e.key==='ArrowLeft') renderer.camera.orbit(0.055,0);
    else if (e.key==='ArrowRight') renderer.camera.orbit(-0.055,0);
    else if (e.key==='ArrowUp') renderer.camera.orbit(0,-0.055);
    else if (e.key==='ArrowDown') renderer.camera.orbit(0,0.055);
    else if (e.key==='+'||e.key==='=') renderer.camera.zoom(-0.09);
    else if (e.key==='-') renderer.camera.zoom(0.09);
    else if (e.key.toLowerCase()==='r') { renderer.camera.reset(); renderer.reassembleAll(); state.explode=false; controls.refreshStageLabels(true); controls.refreshSelection(); }
    else if (e.key.toLowerCase()==='t') { document.getElementById('table-button').click(); }
    else if (e.key.toLowerCase()==='d') {
      state.dissect=!state.dissect;
      document.getElementById('dissect-button').setAttribute('aria-pressed',String(state.dissect));
      document.getElementById('app').classList.toggle('dissect-mode',state.dissect);
      document.getElementById('gesture-hint').textContent = state.dissect ? (state.table ? 'Dissect + Table · pull a structure and release to stage it · drag it back to reassemble' : 'Free dissection · drag a structure anywhere · drag empty space to rotate') : 'Explore mode · drag to rotate · tap a structure';
    }
    else if (e.key.toLowerCase()==='q') { document.getElementById('quiz-button').click(); }
    else if (e.key.toLowerCase()==='e') { document.getElementById('exhibits-button').click(); }
    else if (e.key.toLowerCase()==='n' && state.quizMode) { document.getElementById('quiz-next').click(); }
    else if (e.key==='Escape') { controls.closePopovers(); exhibitsPanel.hidden=true; exhibitsButton.setAttribute('aria-expanded','false'); state.selectedId=null; state.isolatedId=null; controls.refreshSelection(); }
    else return;
    e.preventDefault();
  });
}

function setupDebug() {
  const params = new URLSearchParams(location.search);
  debug.hidden = params.get('debug') !== '1';
}

function updateDebug() {
  const s=renderer.stats;
  debug.textContent = [
    `HOLOANATOMY DEBUG`,
    `fps          ${s.fps.toFixed(1)}`,
    `frame        ${s.frameMs.toFixed(2)} ms`,
    `draw calls   ${s.drawCalls}`,
    `triangles    ${Math.round(s.triangles).toLocaleString()}`,
    `geometries   ${s.geometries}`,
    `dpr          ${(canvas.width/canvas.clientWidth).toFixed(2)}`,
    `quality      ${state.quality === 'auto' ? `${renderer.quality} (auto)` : renderer.quality}`,
    `module       ${MODULES[state.module]?.shortLabel || state.module}`,
    `loaded       ${renderer.activeMeshes().length}/${MODULE_MANIFESTS[state.module].length}`,
    `cached       ${loadedModules.size}/${Object.keys(MODULES).length} modules`,
    `staged       ${renderer.stagedMeshes().length}`,
    `table        ${state.table ? 'on' : 'off'}`,
    `hover        ${renderer.hoveredId || '-'}`,
    `quiz         ${state.quizMode ? 'on' : 'off'}`,
    `license      ${BODY_PARTS_LICENSE.short}`
  ].join('\n');
}
