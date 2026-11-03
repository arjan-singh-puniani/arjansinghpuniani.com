// A body press lifts immediately; its first stationary release keeps the person held.
export function installPointerInput(view){
 const canvas=view.canvas;let down;
 canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0||!e.isPrimary)return;
  view.followId=null;
  const person=view.tool||view.carry?null:view.personAt(e);
  down={x:e.clientX,y:e.clientY,wasHeld:!!view.carry,person};
  if(!person&&!view.carry)return;
  e.stopImmediatePropagation();e.preventDefault();canvas.setPointerCapture(e.pointerId);
  if(person&&view.onLift(person.kind,person.id)){view.tile(e);view.pointerCarry()}
 },{capture:true});
 canvas.addEventListener('pointermove',e=>{
  if(!e.isPrimary)return;
  const p=view.tile(e);if(p)view.onHover(p);else if(view.carry)canvas.dataset.dropValid='false';
  if(view.carry){canvas.dataset.pointerX=e.clientX;canvas.dataset.pointerY=e.clientY;view.pointerCarry()}
  if(view.carry||down?.person){e.stopImmediatePropagation();e.preventDefault()}
 },{capture:true});
 canvas.addEventListener('pointerup',e=>{
  if(!e.isPrimary)return;
  if(view.carry){e.stopImmediatePropagation();e.preventDefault();if(down?.wasHeld||down&&Math.hypot(down.x-e.clientX,down.y-e.clientY)>10)view.onDrop(view.tile(e))}
  else if(down&&!down.person&&Math.hypot(down.x-e.clientX,down.y-e.clientY)<7)view.pick(e);
  down=null;
 },{capture:true});
 canvas.addEventListener('pointercancel',()=>{down=null});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)down=null});
}
