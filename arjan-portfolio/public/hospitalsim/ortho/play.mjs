import {makeCase, openingSeed, challengeSeed, views, limits, aligned, error, changeView, startReduction, confirmImage, begin, move, cancel, release, returnToReduction, dress, score} from './model.mjs';
import {makeScene} from './scene.mjs';

const steps = {
  inspect:['01 / Orientation','Find the break','Find the fracture in the thigh. Toggle Fluoro to compare front and side images.','Take the clamp'],
  reduce:['02 / Fracture reduction','Line up the fragments','Press the clamp handles to close the jaws. Drag to move the fragment. In Rotate, drag sideways for tilt and vertically for twist.','Check this view'],
  seat:['03 / Implant','Advance the nail','Drag the handle down in short strokes. Pull back or refine alignment if the nail stops.',''],
  fix:['04 / Fixation','Match the locking target','Drag the crosshair into the ring, then release. The upper and lower targets each need a lock.',''],
  image:['05 / Verification','Save the final images','Inspect the implant and both locks in each projection. Save both images.','Save this image'],
  dress:['06 / Dressing','Cover the site','Place the dressing to finish the case.','Place dressing'],
  review:['Case complete','Compare your result','Switch projections to compare the same framing before and after.','Replay same setup']
};
const timeline = Object.keys(steps).slice(0, 6);
const degrees = n => (n * 180 / Math.PI).toFixed(1) + '°';

export async function mount() {
  const $ = id => document.getElementById(id);
  const setText = (id,text) => {
    const el=$(id);
    if(el.textContent!==text)el.textContent=text;
  };
  const field = $('field'), grip = $('grip'), target = $('target');
  const scene = await makeScene($('scene'));
  const requested = new URLSearchParams(location.search).get('seed');
  let state = makeCase(requested && /^\d{1,10}$/.test(requested) ? Number(requested) : openingSeed);
  let pointer, keyboard, frame = 0, audio, muted = true, reviewView = '', fluoro = false, dressing = false;
  let elapsed = 0, runningSince = null;
  let closure = 0, lastDraw = 0;
  const stopClock = () => {
    if (runningSince === null) return;
    elapsed += performance.now() - runningSince;
    runningSince = null;
  };
  const metrics = $('metrics');
  const cards = {};
  for (const [key, label] of Object.entries({offset:'Offset',gap:'Gap error',tilt:'Tilt',twist:'Twist'})) {
    const box = document.createElement('div'), term = document.createElement('dt'), value = document.createElement('dd');
    term.textContent = label;
    box.append(term, value);
    metrics.append(box);
    cards[key] = {box,value};
  }
  const stages = [...$('stages').children];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  function cue(kind) {
    if (muted || !audio || audio.state !== 'running') return;
    const now = audio.currentTime;
    const tones = {grab:[178], bite:[318,126], settle:[395,605], engaged:[402], check:[435, 573], seated:[280, 480, 680], locked:[393, 610, 785], done:[490, 620, 820]};
    tones[kind].forEach((frequency, index) => {
      const oscillator = audio.createOscillator(), gain = audio.createGain();
      const time = now + .058 * index;
      oscillator.frequency.value = frequency;
      if (kind === 'bite') oscillator.type = 'triangle';
      gain.gain.setValueAtTime(.0001, time);
      gain.gain.exponentialRampToValueAtTime(.062, time + .013);
      gain.gain.exponentialRampToValueAtTime(.0001, time + .13);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(time);
      oscillator.stop(time + .135);
    });
  }

  function place(element, point) {
    element.hidden = !point;
    if (!point) return;
    const inset = element === grip ? 27 : 15;
    const x = Math.min(field.clientWidth - inset, Math.max(inset, point.x));
    const y = Math.min(field.clientHeight - inset, Math.max(inset, point.y));
    element.style.translate = x + 'px ' + y + 'px';
  }

  function redraw() {
    if (frame || dressing) return;
    frame = requestAnimationFrame(now => {
      frame = 0;
      const {stage, view, mode, pose} = state;
      if($('workbench').dataset.stage!==stage)$('workbench').dataset.stage=stage;
      const reducing = stage === 'reduce', fixing = stage === 'fix', reviewing = stage === 'review';
      const active = reducing || fixing || stage === 'seat';
      const beforeClosure = closure;
      const held = reducing && Boolean(state.grip);
      const dt = Math.min(28,Math.max(10,now-lastDraw));
      lastDraw = now;
      if (!reducing || reduced.matches || pointer?.moved || keyboard?.moved) closure = Number(held);
      else closure = held ? Math.min(1,closure+dt/102) : Math.max(0,closure-dt/154);
      if (held && closure === 1 && beforeClosure < 1) cue('bite');
      const gripState = $('grip-state');
      gripState.hidden = !reducing;
      const gripStatus = held ? (closure < 1 ? 'Closing jaws' : 'Grip locked')
        : closure > 0 ? 'Opening jaws' : 'Jaws open';
      if (gripState.textContent !== gripStatus) gripState.textContent = gripStatus;
      gripState.toggleAttribute('data-locked',held&&closure===1);
      const previousAction = document.activeElement === $('action');
      const wasGrip = document.activeElement === grip;
      const [tag, title, directions, action] = steps[stage];
      setText('seed','SETUP ' + state.seed);
      setText('stage-label',tag);
      setText('step',title);
      setText('directions',directions);
      $('fluoro').hidden = stage !== 'inspect' && !reducing;
      $('fluoro').setAttribute('aria-pressed', fluoro);
      setText('view-label',stage === 'seat' || fixing ? 'EDUCATIONAL CUTAWAY'
        : stage === 'image' || reviewing || ((stage === 'inspect' || reducing) && fluoro) ? 'SIMULATED FLUOROSCOPY' : 'OPERATIVE FIELD');
      $('modes').hidden = !reducing;
      $('keyboard').hidden = !active;
      $('comparison').hidden = !reviewing;
      field.hidden = reviewing;
      const phase = reviewing ? timeline.length : timeline.indexOf(stage);
      stages.forEach((item, index) => {
        item.toggleAttribute('data-done', index < phase);
        if (index === phase) item.setAttribute('aria-current','step');
        else item.removeAttribute('aria-current');
      });
      for (const choice of views) {
        $(choice).disabled = fixing || stage === 'dress';
        $(choice).setAttribute('aria-pressed', choice === view);
      }
      for (const choice of ['move','rotate']) $(choice).setAttribute('aria-pressed', choice === mode);
      $('action').hidden = !action;
      const checked = reducing ? state.checked[view] : stage === 'image' && state.reviewed[view];
      setText('action',checked ? (reducing ? 'View checked ✓' : 'Image saved ✓') : action);
      $('action').disabled = Boolean(checked || state.grip);
      const alternate = reviewing
        ? (state.seed === openingSeed ? 'Try harder setup' : 'Try another setup')
        : stage === 'seat' ? 'Refine alignment' : '';
      setText('secondary',alternate);
      $('secondary').hidden = !alternate;
      $('restart').hidden = reviewing || stage === 'inspect';
      $('travel').hidden = stage !== 'seat';
      $('travel').value = state.nail;
      metrics.hidden = !reducing;
      if (reducing) for (const [key, value] of Object.entries(error(pose, view))) {
        const good = value <= limits[key];
        const reading = (key === 'tilt' || key === 'twist' ? degrees(value) : value.toFixed(2)) + (good ? ' ✓' : '');
        if (cards[key].value.textContent !== reading) cards[key].value.textContent = reading;
        cards[key].box.toggleAttribute('data-good', good);
      }
      const aimGood = Math.hypot(state.aim.x,state.aim.y) <= (state.expert ? .052 : .092);
      let notice = state.notice;
      if (reducing && fluoro && !notice) notice = 'Orthographic view. Tap Fluoro again to return to the clamp.';
      if (reducing && !notice) notice = held
        ? (aligned(pose,view) ? 'Aligned in this view. Release to hold.' : 'Jaws engaged. Drag against the pull.')
        : (aligned(pose,view) ? 'Alignment held. Check this view.' : 'Offset and gap are in game units. ✓ marks the game band.');
      if (stage === 'seat' && !notice) notice = state.grip ? 'Travel preview. Release to hold position.' : Math.round(state.nail * 100) + '% seated';
      if (fixing && !notice) notice = aimGood ? 'Target acquired. Release to confirm.' : (state.locks ? 'Lower locking target' : 'Upper locking target');
      if (reviewing) {
        const points = score(state);
        notice = 'Alignment ' + points.alignment + '/60 · Fixation ' + points.fixation + '/30 · Corrections ' + points.correction + '/10. '
          + state.corrections + ' alignment or advance corrections and ' + state.misses + ' missed locking attempts.';
        if (points.alignment < 60) {
          const residual = views.flatMap(view => Object.entries(error(pose,view)))
            .sort(([a,x],[b,y]) => y/limits[b]-x/limits[a])[0][0];
          notice += ' Largest remaining error: ' + residual + '.';
        }
        if (points.fixation < 30) notice += ' Lock centers were within tolerance but off center.';
        notice += ' Time ' + Math.round(elapsed / 1000) + ' s (unscored).';
        if (reviewView !== view) {
          $('before').src = scene.snapshot(state, state.baseline, false);
          $('after').src = scene.snapshot(state, pose, true);
          reviewView = view;
        }
      } else {
        const points = scene.draw(state,{film:(stage === 'inspect' || reducing) && fluoro,closure});
        place(grip, points.handle);
        place(target, reducing ? null : points.contact);
        grip.toggleAttribute('data-active', Boolean(state.grip));
        target.toggleAttribute('data-good', fixing ? aimGood : reducing && aligned(pose,view));
        place($('offset-reticle'), pointer?.touch && (fixing||reducing) && points.handle ? {x:points.handle.x,y:points.handle.y - 36} : null);
        grip.setAttribute('aria-label', reducing ? 'Grab reduction clamp' : fixing ? 'Grab locking reticle' : 'Grab nail handle');
      }
      if ($('notice').textContent !== notice) $('notice').textContent = notice;
      if (previousAction && active && $('action').hidden) grip.focus({preventScroll:true});
      if (wasGrip && !active && !$('action').hidden) $('action').focus({preventScroll:true});
      if (reducing && closure !== Number(held)) redraw();
    });
  }

  function stopPointer(commit = false) {
    const id = pointer?.id;
    const moved = pointer?.moved || keyboard?.moved;
    pointer = keyboard = undefined;
    if (id !== undefined && grip.hasPointerCapture(id)) grip.releasePointerCapture(id);
    if (commit && moved) {
      const feedback = release(state);
      if (feedback) cue(feedback);
      else if(state.stage==='reduce' && aligned(state.pose,state.view)) cue('settle');
    } else cancel(state);
    redraw();
  }

  function apply(x, y, control) {
    if (!control.moved && Math.hypot(x,y) < 2) return;
    control.moved = true;
    const ready = () => state.stage === 'fix' ? Math.hypot(state.aim.x,state.aim.y) <= (state.expert ? .052 : .092)
      : state.stage === 'reduce' && aligned(state.pose,state.view);
    const before = ready();
    move(state,...scene.modelDelta(x,y));
    if (!before && ready()) cue('engaged');
    redraw();
  }

  grip.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary || !begin(state)) return;
    event.preventDefault();
    pointer = {id:event.pointerId, x:event.clientX, y:event.clientY, touch:event.pointerType === 'touch', moved:false};
    grip.setPointerCapture(event.pointerId);
    cue('grab');
    redraw();
  });
  grip.addEventListener('pointermove', event => {
    if (event.pointerId === pointer?.id) apply(event.clientX - pointer.x,event.clientY - pointer.y,pointer);
  });
  grip.addEventListener('pointerup', event => {
    if (event.pointerId !== pointer?.id) return;
    apply(event.clientX - pointer.x,event.clientY - pointer.y,pointer);
    stopPointer(true);
  });
  for (const event of ['pointercancel','lostpointercapture']) grip.addEventListener(event, e => {
    if (e.pointerId === pointer?.id) stopPointer();
  });
  window.addEventListener('blur', () => stopPointer());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopPointer();
      stopClock();
    } else if (!['inspect','review'].includes(state.stage)) runningSince = performance.now();
  });

  field.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      stopPointer();
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && keyboard) {
      event.preventDefault();
      stopPointer(true);
      return;
    }
    const vector = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
    if (!vector || pointer || (fluoro && state.stage==='reduce')) return;
    if (!keyboard && begin(state)) {
      keyboard = {x:0,y:0,moved:false};
      cue('grab');
    }
    if (!keyboard) return;
    event.preventDefault();
    const step = event.shiftKey ? 2.5 : 11;
    keyboard.x += vector[0] * step;
    keyboard.y += vector[1] * step;
    apply(keyboard.x, keyboard.y, keyboard);
  });

  $('fluoro').onclick = () => {stopPointer(); fluoro = !fluoro; redraw();};
  for (const choice of views) $(choice).onclick = () => {
    stopPointer();
    changeView(state,choice);
    redraw();
  };
  for (const choice of ['move','rotate']) $(choice).onclick = event => {
    stopPointer();
    state.mode = choice;
    redraw();
    if (event.detail === 0) grip.focus();
  };

  function restart(seed = state.seed) {
    stopPointer();
    state = makeCase(seed, $('difficulty').value === 'expert');
    reviewView = '';
    fluoro = dressing = false;
    closure = 0;
    elapsed = 0;
    runningSince = null;
    redraw();
    requestAnimationFrame(() => $('action').focus({preventScroll:true}));
  }
  $('difficulty').onchange = () => restart();
  $('restart').onclick = () => restart();
  $('action').onclick = () => {
    if (dressing) return;
    if (state.stage === 'inspect') {
      startReduction(state);
      fluoro = false;
      runningSince = performance.now();
      if (!reduced.matches) field.animate([{opacity:.78},{opacity:1}],{duration:185});
    }
    else if (state.stage === 'review') restart();
    else if (state.stage === 'dress' && dress(state)) {
      stopClock();
      cue('done');
      if (!reduced.matches) {
        field.animate([{filter:'brightness(1)'},{filter:'brightness(1.18)'},{filter:'brightness(1)'}],{duration:450});
        dressing = true;
        $('action').disabled = true;
        window.setTimeout(() => { if (dressing) {dressing = false; redraw();} },450);
        scene.draw(state);
        return;
      }
    } else if (confirmImage(state)) cue('check');
    redraw();
  };
  $('secondary').onclick = () => {
    if (state.stage === 'review') restart(state.seed === openingSeed ? challengeSeed
      : (Math.imul(state.seed,1664525)+1013904223) >>> 0);
    else {
      stopPointer();
      returnToReduction(state);
      redraw();
    }
  };
  $('sound').onclick = async () => {
    if (muted) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) {
        $('sound').textContent = 'Sound unavailable';
        return;
      }
      try {
        audio ||= new Audio();
        await audio.resume();
      } catch {
        $('sound').textContent = 'Sound unavailable';
        return;
      }
    }
    muted = !muted;
    $('sound').textContent = muted ? 'Sound off' : 'Sound on';
    $('sound').setAttribute('aria-pressed',muted);
    if (!muted) cue('grab');
  };

  $('scene').addEventListener('webglcontextlost', event => {
    event.preventDefault();
    stopPointer();
    $('workbench').hidden = true;
    $('recovery').hidden = false;
    $('loading').textContent = 'The graphics connection was interrupted. Reload to start a fresh case.';
    $('retry').hidden = false;
  });
  $('workbench').hidden = false;
  $('recovery').hidden = true;
  const resize = () => {
    if (!field.clientWidth || !field.clientHeight) return;
    stopPointer();
    scene.size(field.clientWidth,field.clientHeight);
  };
  new ResizeObserver(resize).observe(field);
  resize();
}
