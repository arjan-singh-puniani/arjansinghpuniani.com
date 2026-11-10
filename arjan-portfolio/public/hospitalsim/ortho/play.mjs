import {makeCase, openingSeed, challengeSeed, views, stations, limits, dressingTolerance, aligned, error, changeView, startReduction, confirmImage, begin, move, cancel, release, returnToReduction, dress, score, nextAdjustment, nudgeAlignment} from './model.mjs';
import {makeScene} from './scene.mjs';

const steps = {
  inspect:['01 / Orientation','Find the break','Follow a simplified antegrade nailing case for a simple oblique midshaft fracture. Check both views before and after locking.','Take the clamp'],
  reduce:['02 / Fracture reduction','Line up the fragments','Drag the clamp in Move for offset and gap, or Rotate for tilt and twist. Get four checkmarks, then verify this view.','Check this view'],
  seat:['03 / Implant','Advance the nail','Entry, guidewire passage and canal preparation are represented as already complete. Drag the virtual handle down in short strokes to seat the nail.',''],
  prelock:['04 / Before locking','Review the seated nail','Compare nail position and shaft alignment in Front and Side. Rotation assessment in the real procedure requires anatomical references beyond this model.','Confirm this view'],
  fix:['05 / Fixation','Match the locking target','',''],
  image:['06 / Verification','Save the final images','Inspect the nail and all three modeled locks in each projection. Save both images.','Save this image'],
  dress:['07 / Dressing','Cover the site','Drag the dressing onto the dashed outline and release. You can also use Place dressing.','Place dressing'],
  review:['Case complete','Compare your result','Switch projections to compare the same framing before and after.','Replay same setup']
};
const timeline = Object.keys(steps).slice(0, -1);
const degrees = n => (n * 180 / Math.PI).toFixed(1) + '°';
const otherView = view => view === 'front' ? 'side' : 'front';
const viewName = view => view === 'front' ? 'Front' : 'Side';
const viewChecks = s => ({reduce:s.checked, prelock:s.prelock, image:s.reviewed})[s.stage];

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
  let closure = 0, lastDraw = 0, nextGesture;
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
  const metricNames = {offset:'offset', gap:'gap', tilt:'tilt', twist:'twist'};
  const arrows = {left:'←', right:'→', up:'↑', down:'↓'};
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
    return {x,y};
  }

  function drawGuide(next, origin) {
    const track = $('guide-track'), end = $('guide-end');
    nextGesture = undefined;
    if (origin && next && state.mode === next.mode) {
      const [x,y] = [Math.sign(next.dx), Math.sign(next.dy)];
      const available = x > 0 ? field.clientWidth-origin.x : x < 0 ? origin.x
        : y > 0 ? field.clientHeight-origin.y : origin.y;
      nextGesture = {next,origin,x,y,length:Math.min(54,available-13)};
    }
    const gesture = pointer ? pointer.guide : keyboard ? undefined : nextGesture;
    track.hidden = end.hidden = !gesture;
    if (!gesture) return;
    const {origin:start,x,y,length} = gesture;
    track.style.width = length + 'px';
    track.style.transform = `translate(${start.x}px,${start.y}px) rotate(${Math.atan2(y,x)}rad)`;
    end.style.translate = `${start.x+x*length}px ${start.y+y*length}px`;
    end.toggleAttribute('data-good',Boolean(pointer?.guideReady));
  }

  function redraw() {
    if (frame || dressing) return;
    frame = requestAnimationFrame(now => {
      frame = 0;
      if (dressing) return;
      const {stage, view, mode, pose} = state;
      if($('workbench').dataset.stage!==stage)$('workbench').dataset.stage=stage;
      const reducing = stage === 'reduce', fixing = stage === 'fix', reviewing = stage === 'review';
      const distalTarget = fixing && stations[state.locks].view === 'side';
      const placing = stage === 'dress', active = reducing || fixing || placing || stage === 'seat';
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
      const previousNext = document.activeElement === $('secondary') && $('secondary').classList.contains('primary');
      const wasGrip = document.activeElement === grip;
      const [tag, title, directions, action] = steps[stage];
      setText('seed','SETUP ' + state.seed);
      setText('stage-label',fixing ? '05 / ' + stations[state.locks].label : tag);
      setText('step',title);
      setText('directions',fixing ? (distalTarget
        ? 'Side shows the distal opening end-on. Align the virtual reticle to its center and release.'
        : 'The proximal aiming jig is attached to the insertion handle. Center the virtual reticle on the guide sleeve and release.')
        : directions);
      $('fluoro').hidden = stage !== 'inspect' && !reducing;
      $('fluoro').setAttribute('aria-pressed', fluoro);
      setText('view-label',stage === 'seat' || (fixing && !distalTarget) ? 'EDUCATIONAL CUTAWAY'
        : stage === 'image' || stage === 'prelock' || distalTarget || reviewing || ((stage === 'inspect' || reducing) && fluoro) ? 'SIMULATED FLUOROSCOPY' : 'OPERATIVE FIELD');
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
      const checked = viewChecks(state)?.[view];
      setText('action',checked ? (reducing || stage === 'prelock' ? 'View checked ✓' : 'Image saved ✓') : action);
      $('action').disabled = Boolean(checked || state.grip);
      const next = reducing ? nextAdjustment(pose,view) : null;
      const help = reducing && !checked && !state.expert && next && !fluoro;
      const guide = $('reduction-progress');
      guide.hidden = !reducing;
      if (reducing) {
        setText('reduction-progress',views.map(choice =>
          viewName(choice) + (state.checked[choice] ? ' ✓' : ' to check')
        ).join(' · '));
      }
      const alternate = checked ? 'Next · ' + viewName(otherView(view))
        : help ? 'Nudge ' + metricNames[next.key] + ' ' + arrows[next.direction]
        : reviewing
        ? (state.seed === openingSeed ? 'Try harder setup' : 'Try another setup')
        : stage === 'seat' || stage === 'prelock' ? 'Refine alignment' : '';
      setText('secondary',alternate);
      $('secondary').hidden = !alternate;
      $('secondary').disabled = Boolean(held);
      $('secondary').toggleAttribute('data-nudge',Boolean(help));
      $('secondary').classList.toggle('primary',Boolean(checked));
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
      if (reducing) {
        if (checked) notice = 'This view is checked.';
        else if (fluoro) notice = 'Tap Fluoro again to return to the clamp.';
        else if (!next) notice = held ? 'All four readings are in range. Release the clamp.'
          : 'All four readings are in range. Select Check this view.';
        else if (help) {
          const modeName = next.mode === 'move' ? 'Move' : 'Rotate';
          const instruction = pointer?.guideReady ? 'Release to keep this correction.'
            : pointer?.guide ? 'Bring your drag to the dashed marker and release.'
            : mode !== next.mode ? 'Select ' + modeName + ' to adjust ' + metricNames[next.key] + '.'
            : 'Drag the clamp ' + next.direction + ' to the dashed marker to adjust ' + metricNames[next.key] + '.';
          notice = (notice ? notice + ' ' : '') + instruction;
        } else if (!notice) notice = 'Use Move for offset and gap, and Rotate for tilt and twist.';
      }
      if (stage === 'seat' && !notice) notice = state.grip ? 'Travel preview. Release to hold position.' : Math.round(state.nail * 100) + '% seated';
      if (fixing && !notice) notice = aimGood ? 'Target acquired. Release to confirm.' : stations[state.locks].label + ' locking target';
      const dressingReady = placing && Math.hypot(state.dressing.x,state.dressing.y) <= dressingTolerance;
      if (placing && dressingReady) notice = 'Dressing centered. Release to place it.';
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
        const handle = place(grip, points.handle);
        place(target, reducing ? null : points.contact);
        drawGuide(help ? next : null,handle);
        grip.toggleAttribute('data-active', Boolean(state.grip));
        target.toggleAttribute('data-good', fixing ? aimGood : dressingReady);
        place($('offset-reticle'), pointer?.touch && (fixing||reducing) && points.handle ? {x:points.handle.x,y:points.handle.y - 36} : null);
        grip.setAttribute('aria-label', reducing ? 'Grab reduction clamp' : fixing ? 'Grab locking reticle' : placing ? 'Grab dressing' : 'Grab nail handle');
      }
      if ($('notice').textContent !== notice) $('notice').textContent = notice;
      if (previousAction && checked) $('secondary').focus({preventScroll:true});
      if (previousNext && !checked) (reducing ? grip : $('action')).focus({preventScroll:true});
      if (previousAction && active && $('action').hidden) grip.focus({preventScroll:true});
      if ((wasGrip || previousAction) && !active && !$('action').hidden) $('action').focus({preventScroll:true});
      if (reducing && closure !== Number(held)) redraw();
    });
  }

  function finishDressing() {
    stopClock();
    cue('done');
    if (reduced.matches) return;
    dressing = true;
    $('action').disabled = true;
    scene.draw(state);
    grip.hidden = target.hidden = true;
    field.animate([{filter:'brightness(1)'},{filter:'brightness(1.18)'},{filter:'brightness(1)'}],{duration:450});
    window.setTimeout(() => {
      if (!dressing) return;
      dressing = false;
      redraw();
      requestAnimationFrame(() => $('action').focus({preventScroll:true}));
    },450);
  }

  function stopPointer(commit = false) {
    const id = pointer?.id;
    const moved = pointer?.moved || keyboard?.moved;
    pointer = keyboard = undefined;
    if (id !== undefined && grip.hasPointerCapture(id)) grip.releasePointerCapture(id);
    if (commit && moved) {
      const feedback = release(state);
      if (feedback === 'done') finishDressing();
      else if (feedback) cue(feedback);
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
    const gesture = control.guide;
    const along = gesture ? x*gesture.x+y*gesture.y : 0;
    const across = gesture ? Math.abs(x*gesture.y-y*gesture.x) : 0;
    const guided = gesture && along > 0 && across <= along;
    control.guideReady = Boolean(guided && along >= gesture.length-2);
    if (guided) {
      const progress = control.guideReady ? 1 : along/gesture.length;
      move(state,gesture.next.dx*progress,gesture.next.dy*progress);
    } else move(state,...scene.modelDelta(x,y));
    if (!before && ready()) cue('engaged');
    redraw();
  }

  grip.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary || !begin(state)) return;
    event.preventDefault();
    pointer = {id:event.pointerId, x:event.clientX, y:event.clientY, touch:event.pointerType === 'touch', moved:false, guide:nextGesture};
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
  function selectView(choice) {
    stopPointer();
    changeView(state,choice);
    redraw();
  }
  for (const choice of views) $(choice).onclick = () => selectView(choice);
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
    else if (state.stage === 'dress' && dress(state)) finishDressing();
    else if (confirmImage(state)) cue('check');
    redraw();
  };
  $('secondary').onclick = () => {
    if (viewChecks(state)?.[state.view]) {
      fluoro = false;
      const next = otherView(state.view);
      selectView(next);
      $(next).scrollIntoView({block:'nearest'});
    } else if (state.stage === 'reduce') {
      if (!fluoro && nudgeAlignment(state)) cue('settle');
      redraw();
    }
    else if (state.stage === 'review') restart(state.seed === openingSeed ? challengeSeed
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
