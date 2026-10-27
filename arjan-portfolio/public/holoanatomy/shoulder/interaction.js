import { isClick } from "./model.js";
/** Pixel wheel convention: two-finger pan, ctrl/pinch zoom; line wheel zoom.
 * Shift+pixel-wheel provides explicit zoom for smooth-scrolling mouse devices. */
export function bindInteraction(
  element,
  scene,
  { select, hover, stage, canStage = () => false, canOrbit = () => true, pull, widget = false },
) {
  const points = new Map();
  let start = null,
    multi = false,
    dragId = null,
    pulling = false,
    orbitBlocked = false,
    moved = false;
  const cancel = () => {
    const wasPulling = pulling, captured = [...points.keys()];
    points.clear();start=null;dragId=null;pulling=false;multi=false;moved=false;orbitBlocked=false;element.style.cursor="";
    if(wasPulling) pull.cancel();
    for(const id of captured)if(element.hasPointerCapture(id))element.releasePointerCapture(id);
  };
  const midpoint = () => {
    const p = [...points.values()];
    return {
      x: (p[0].x + p[1].x) / 2,
      y: (p[0].y + p[1].y) / 2,
      d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y),
    };
  };
  element.addEventListener("pointerdown", (e) => {
    if (e.button > 2) return;
    if(widget) scene.onCancelGrab?.();
    element.setPointerCapture(e.pointerId);
    points.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (points.size === 1 && !multi) {
      start = { x: e.clientX, y: e.clientY };
      multi = false;
      moved = false;
      const hit = !widget && e.button === 0 && !e.shiftKey ? scene.pick(e.clientX, e.clientY) : null;
      orbitBlocked=Boolean(hit)&&!canOrbit(hit);
      pulling = Boolean(hit && pull?.begin(hit, e));
      dragId = pulling ? hit : !widget && e.button===0 && !e.shiftKey && canStage() ? scene.pick(e.clientX, e.clientY) : null;
    } else {
      multi = true;
      const wasPulling = pulling;
      pulling = false;
      dragId = null;
      if (wasPulling) pull.cancel();
    }
    scene.hover(null);
  });
  element.addEventListener("pointermove", (e) => {
    if (!points.has(e.pointerId)) {
      if (!widget && e.pointerType !== "touch") {
        const id = scene.pick(e.clientX, e.clientY);
        scene.hover(id);
        hover?.(id, e);
      }
      return;
    }
    const old = points.get(e.pointerId),
      before = points.size === 2 ? midpoint() : null;
    points.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (points.size === 2) {
      const now = midpoint();
      scene.zoom(Math.log(Math.max(before.d, 1) / Math.max(now.d, 1)), now.x, now.y);
      scene.pan(now.x - before.x, now.y - before.y);
      return;
    }
    // After a pinch, lift every finger before starting a new grab or orbit.
    if (multi || points.size > 2) return;
    if (!moved && !isClick(start, { x: e.clientX, y: e.clientY }, multi))
      moved = true;
    if (!moved) return;
    const dx = e.clientX - old.x,
      dy = e.clientY - old.y;
    if (dragId) {
      element.style.cursor = "grabbing";
      if (pulling) pull.move(e.clientX - start.x, e.clientY - start.y);
      else scene.previewPull(dragId, e.clientX - start.x, e.clientY - start.y);
      return;
    }
    if(orbitBlocked && e.buttons===1 && !e.shiftKey){element.style.cursor="not-allowed";return;}
    if (e.shiftKey || e.buttons === 2 || e.buttons === 4) scene.pan(dx, dy);
    else scene.orbit(dx, dy);
  });
  const end = (e) => {
    if (!points.has(e.pointerId)) return;
    if (e.type !== "pointerup") { cancel(); return; }
    const click =
      start && isClick(start, { x: e.clientX, y: e.clientY }, multi) && !moved;
    points.delete(e.pointerId);
    element.style.cursor = "";
    if (pulling) {
      if (e.type === "pointerup") pull.end(moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 35);
      else pull.cancel();
      pulling = false; dragId = null; start = null; multi = false;
      return;
    }
    if (e.type === "pointerup" && points.size === 0) {
      if (click && !widget && e.button===0) select?.(scene.pick(e.clientX, e.clientY));
      else if (dragId && moved) {
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 35)
          stage?.(dragId);
        scene.refresh();
      }
    }
    if (!points.size) {
      if (dragId) scene.refresh();
      start = null;
      dragId = null;
      multi = false;
    }
  };
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
    element.addEventListener(event, end);
  element.addEventListener("pointerleave", () => {
    if (!points.size) {
      scene.hover(null);
      hover?.(null);
    }
  });
  element.addEventListener("dblclick", (e) => {
    if (widget || pull?.enabled()) return;
    const id = scene.pick(e.clientX, e.clientY);
    if (id) {
      select?.(id);
      scene.focus(id);
    }
  });
  element.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      if (pulling) cancel();
      if (e.ctrlKey || e.metaKey || e.deltaMode !== 0 || e.shiftKey)
        scene.zoom(
          Math.max(
            -0.35,
            Math.min(0.35, e.deltaY * (e.deltaMode === 1 ? 0.045 : 0.008)),
          ),
          e.clientX,
          e.clientY,
        );
      else scene.pan(-e.deltaX, -e.deltaY);
    },
    { passive: false },
  );
  element.addEventListener("contextmenu", (e) => e.preventDefault());
  return {
    cancel,
    get state(){return !points.size?"idle":multi?"camera-multitouch":orbitBlocked&&!pulling?"blocked":pulling?moved?"pulling":"grasped":moved?"camera-drag":"pressed";},
    get active() {
      return points.size > 0;
    },
  };
}
