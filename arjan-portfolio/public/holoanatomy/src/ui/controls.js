import { LAYERS } from '../anatomy/manifest.js';
import { cycleLayerState, setSectionAxis, setSectionPosition, toggleIsolation } from '../state/store.js';

export function setupControls({ state, renderer, manifestById, onStateChange = () => {} }) {
  const $ = id => document.getElementById(id);
  const layersPanel=$('layers-panel'), sectionPanel=$('section-panel');
  const selectionCard=$('selection-card');
  const layerList=$('layer-list');
  const labels=$('stage-labels');
  const leaders=$('stage-leaders');
  const tableSummary=$('table-summary');
  let stageSignature='';

  const closePopovers = except => {
    if (except !== 'layers') { layersPanel.hidden=true; $('layers-button').setAttribute('aria-expanded','false'); }
    if (except !== 'section') { sectionPanel.hidden=true; $('section-button').setAttribute('aria-expanded','false'); }
    const exhibitsPanel=$('exhibits-panel'), exhibitsButton=$('exhibits-button');
    if (except !== 'exhibits' && exhibitsPanel) { exhibitsPanel.hidden=true; exhibitsButton?.setAttribute('aria-expanded','false'); }
  };

  const renderLayers = () => {
    layerList.innerHTML='';
    for (const [id,cfg] of Object.entries(LAYERS)) {
      const button=document.createElement('button');
      button.type='button'; button.className='layer-row'; button.dataset.state=state.layers[id];
      button.innerHTML=`<span>${cfg.label}</span><span class="state">${state.layers[id]}</span>`;
      button.addEventListener('click',()=>{ cycleLayerState(state,id); renderLayers(); onStateChange(); });
      layerList.append(button);
    }
  };
  renderLayers();

  $('layers-button').addEventListener('click',()=>{
    const show=layersPanel.hidden; closePopovers(show?'layers':null); layersPanel.hidden=!show; $('layers-button').setAttribute('aria-expanded',String(show));
  });
  $('section-button').addEventListener('click',()=>{
    const show=sectionPanel.hidden; closePopovers(show?'section':null); sectionPanel.hidden=!show; $('section-button').setAttribute('aria-expanded',String(show));
  });

  for (const b of sectionPanel.querySelectorAll('[data-plane]')) {
    b.classList.toggle('active',b.dataset.plane===state.section.axis);
    b.addEventListener('click',()=>{
      setSectionAxis(state,b.dataset.plane);
      sectionPanel.querySelectorAll('[data-plane]').forEach(x=>x.classList.toggle('active',x===b)); onStateChange();
    });
  }
  $('clip-position').addEventListener('input',e=>{ setSectionPosition(state,e.target.value); onStateChange(); });
  $('toggle-section').addEventListener('click',e=>{ state.section.enabled=!state.section.enabled; e.currentTarget.textContent=state.section.enabled?'Disable section':'Enable section'; onStateChange(); });
  $('flip-section').addEventListener('click',()=>{ state.section.flip=!state.section.flip; onStateChange(); });

  function updateHint() {
    const hint=$('gesture-hint');
    if (!state.dissect) hint.textContent='Explore mode · drag to rotate · tap a structure';
    else if (state.table) hint.textContent='Dissect + Table · pull a structure and release to stage it · drag it back to reassemble';
    else hint.textContent='Free dissection · drag a structure anywhere · drag empty space to rotate';
  }

  $('dissect-button').addEventListener('click',e=>{
    state.dissect=!state.dissect;
    e.currentTarget.setAttribute('aria-pressed',String(state.dissect));
    document.getElementById('app').classList.toggle('dissect-mode',state.dissect);
    updateHint(); onStateChange();
  });
  document.getElementById('app').classList.toggle('dissect-mode',state.dissect);

  $('table-button').addEventListener('click',e=>{
    state.table=!state.table;
    e.currentTarget.setAttribute('aria-pressed',String(state.table));
    if (state.table) renderer.stagePulledMeshes(); else renderer.unstageAll({ keepPosition:true });
    updateHint(); refreshStageLabels(true); refreshSelection(); onStateChange();
  });

  $('explode-button').addEventListener('click',e=>{ state.explode=!state.explode; e.currentTarget.setAttribute('aria-pressed',String(state.explode)); e.currentTarget.textContent=state.explode?'Assemble systems':'Spread'; onStateChange(); });
  $('focus-button').addEventListener('click',e=>{ state.focusMode=!state.focusMode; document.getElementById('app').classList.toggle('focus-mode',state.focusMode); e.currentTarget.setAttribute('aria-pressed',String(state.focusMode)); onStateChange(); });

  function resetAll() {
    renderer.camera.reset(); renderer.reassembleAll();
    state.selectedId=null; state.isolatedId=null; state.explode=false;
    selectionCard.hidden=true;
    $('explode-button').setAttribute('aria-pressed','false'); $('explode-button').textContent='Spread';
    refreshStageLabels(true); onStateChange();
  }
  $('reset-view').addEventListener('click',resetAll);
  $('return-all').addEventListener('click',resetAll);

  $('fullscreen').addEventListener('click',async()=>{
    try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.(); else await document.exitFullscreen?.(); }
    catch { /* unsupported or denied */ }
  });

  function refreshSelection() {
    const part=state.selectedId?manifestById.get(state.selectedId):null;
    if (!part) { selectionCard.hidden=true; return; }
    $('selection-system').textContent=LAYERS[part.layer]?.label || part.layer;
    $('selection-name').textContent=part.name + (part.component ? ` · component ${part.component}` : '');
    $('selection-id').textContent=`${part.fma} · ${part.id}`;
    $('isolate').textContent=state.isolatedId===part.id?'Restore context':'Isolate';
    const mesh=renderer.meshes.find(m=>m.part.id===part.id);
    const pulled=renderer.isPulled(mesh);
    $('pull-status').textContent=mesh?.staged ? 'On dissection table' : pulled ? 'Pulled from anatomical position' : 'In anatomical position';
    $('pull-selection').textContent=state.table ? 'Place on table' : 'Pull out';
    $('return-selection').disabled=!pulled;
    selectionCard.hidden=false;
  }

  $('close-selection').addEventListener('click',()=>{ state.selectedId=null; state.isolatedId=null; refreshSelection(); onStateChange(); });
  $('pull-selection').addEventListener('click',()=>{
    const mesh=renderer.meshes.find(m=>m.part.id===state.selectedId);
    if(mesh) { if (state.table) renderer.stageMesh(mesh); else renderer.pullMeshRadially(mesh); }
    refreshStageLabels(true); refreshSelection(); onStateChange();
  });
  $('return-selection').addEventListener('click',()=>{
    const mesh=renderer.meshes.find(m=>m.part.id===state.selectedId);
    if(mesh) renderer.returnMesh(mesh);
    refreshStageLabels(true); refreshSelection(); onStateChange();
  });
  $('isolate').addEventListener('click',()=>{ toggleIsolation(state); refreshSelection(); onStateChange(); });
  $('focus-selection').addEventListener('click',()=>{
    const mesh=renderer.meshes.find(m=>m.part.id===state.selectedId); if(mesh) renderer.focusMesh(mesh);
  });

  function refreshStageLabels(force=false) {
    const staged=renderer.stagedMeshes();
    const signature=staged.map(m=>`${m.part.id}:${m.stageSide}:${m.stageIndex}`).join('|');
    if (!force && signature===stageSignature) return;
    stageSignature=signature;
    labels.innerHTML=''; leaders.innerHTML='';
    tableSummary.hidden=staged.length===0;
    $('table-count').textContent=String(staged.length);

    for (const mesh of staged) {
      const item=document.createElement('div');
      item.className='stage-label'; item.dataset.id=mesh.part.id; item.dataset.side=mesh.stageSide; item.dataset.layer=mesh.part.layer;
      const select=document.createElement('button');
      select.type='button'; select.className='stage-select';
      select.innerHTML=`<span class="stage-system">${LAYERS[mesh.part.layer]?.label || mesh.part.layer}</span><strong>${mesh.part.name}</strong>`;
      select.addEventListener('click',()=>{ state.selectedId=mesh.part.id; refreshSelection(); onStateChange(); });
      const ret=document.createElement('button');
      ret.type='button'; ret.className='stage-return'; ret.setAttribute('aria-label',`Return ${mesh.part.name} to anatomical position`); ret.textContent='↩';
      ret.addEventListener('click',()=>{ renderer.returnMesh(mesh); if(state.selectedId===mesh.part.id) refreshSelection(); refreshStageLabels(true); onStateChange(); });
      item.append(select,ret); labels.append(item);
      const line=document.createElementNS('http://www.w3.org/2000/svg','line');
      line.dataset.id=mesh.part.id; line.setAttribute('class','stage-leader'); leaders.append(line);
    }
    updateStageLabelPositions();
  }

  function updateStageLabelPositions() {
    const staged=renderer.stagedMeshes();
    if (!staged.length) return;
    const rect=document.getElementById('app').getBoundingClientRect();
    leaders.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
    for (const mesh of staged) {
      const pos=renderer.projectMeshCenter(mesh);
      const item=labels.querySelector(`[data-id="${mesh.part.id}"]`);
      const line=leaders.querySelector(`[data-id="${mesh.part.id}"]`);
      if (!pos || !pos.visible || !item || !line) { if(item) item.hidden=true; if(line) line.setAttribute('visibility','hidden'); continue; }
      item.hidden=false; line.setAttribute('visibility','visible');
      const itemRect=item.getBoundingClientRect();
      const xLocal=pos.x-rect.left, yLocal=pos.y-rect.top;
      const gap=26;
      let left=mesh.stageSide==='left' ? xLocal-itemRect.width-gap : xLocal+gap;
      let top=yLocal-itemRect.height/2;
      left=Math.max(10,Math.min(rect.width-itemRect.width-10,left));
      top=Math.max(110,Math.min(rect.height-itemRect.height-86,top));
      item.style.left=`${left}px`; item.style.top=`${top}px`;
      const anchorX=mesh.stageSide==='left' ? left+itemRect.width : left;
      const anchorY=top+itemRect.height/2;
      line.setAttribute('x1',String(xLocal)); line.setAttribute('y1',String(yLocal));
      line.setAttribute('x2',String(anchorX)); line.setAttribute('y2',String(anchorY));
    }
  }

  updateHint();
  return { refreshSelection, refreshStageLabels, updateStageLabelPositions, renderLayers, closePopovers };
}
