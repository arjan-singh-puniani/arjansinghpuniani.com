import assert from 'node:assert/strict';
import {installPointerInput} from '../dist/input.mjs';

globalThis.document=new EventTarget();
function fixture(){
 const canvas=new EventTarget();canvas.dataset={};canvas.setPointerCapture=id=>calls.push(['capture',id]);
 const calls=[],v={canvas,carry:null,tool:null,followId:12,hit:{kind:'staff',id:9},valid:true,liftAllowed:true,
  personAt(){return this.hit},onPick(p){calls.push(['select',p])},
  onLift(kind,id){calls.push(['lift',kind,id]);if(this.liftAllowed)this.carry={kind,id};return this.liftAllowed},
  tile(e){return{x:e.clientX,y:e.clientY}},pointerCarry(){calls.push(['pin'])},onHover(p){calls.push(['hover',p])},
  onDrop(p){calls.push(['drop',p]);if(this.valid)this.carry=null},pick(){calls.push(['pick'])}};
 installPointerInput(v);
 function send(type,x=10,y=10,pointerType='mouse',extra={}){const e=new Event(type,{cancelable:true});Object.assign(e,{button:0,isPrimary:true,pointerId:1,clientX:x,clientY:y,pointerType,...extra});canvas.dispatchEvent(e);return e}
 return{v,calls,send};
}
for(const type of ['mouse','touch','pen']){
 const{v,calls,send}=fixture();assert(send('pointerdown',10,10,type).defaultPrevented);assert.equal(v.carry.id,9,'one press immediately lifts, without a timer or minimum drag');assert.equal(v.followId,null);assert(!calls.some(c=>c[0]==='select'),'pickup must not open an inspector over the body');
 send('pointerup',10,10,type);assert(v.carry,'the pickup click/tap must not immediately drop');assert.equal(calls.filter(c=>c[0]==='lift').length,1);assert(!calls.some(c=>c[0]==='drop'));
 v.hit=null;send('pointermove',40,45,type);assert.equal(v.canvas.dataset.pointerX,40);send('pointerdown',40,45,type);send('pointerup',40,45,type);assert.equal(v.carry,null,'the next floor click/tap puts down');assert.equal(calls.filter(c=>c[0]==='drop').length,1);
}
{
 const{v,calls,send}=fixture();send('pointerdown');send('pointermove',80,60);send('pointerup',80,60);assert.equal(v.carry,null,'a normal press-drag-release still drops');assert.equal(calls.filter(c=>c[0]==='drop').length,1);
}
{
 const{v,calls,send}=fixture();v.valid=false;v.hit={kind:'patient',id:1001};send('pointerdown');send('pointermove',80,60);send('pointerup',80,60);assert.equal(v.carry.id,1001,'rejected drops keep the patient held');assert.deepEqual(calls.find(c=>c[0]==='lift'),['lift','patient',1001]);
 send('pointercancel');send('pointerup',90,90);assert.equal(calls.filter(c=>c[0]==='drop').length,1,'cancelled pointer cannot trigger a delayed drop');
}
{
 const{v,calls,send}=fixture();v.hit=null;assert(!send('pointerdown').defaultPrevented);send('pointerup');assert.equal(calls.filter(c=>c[0]==='pick').length,1,'floor and room click selection survives');
 send('pointerdown');send('pointermove',70,60);send('pointerup',70,60);assert.equal(calls.filter(c=>c[0]==='pick').length,1,'panning does not select or lift');
 v.tool='consult';v.hit={kind:'staff',id:9};send('pointerdown');send('pointerup');assert(!calls.some(c=>c[0]==='lift'),'building keeps its own input');
}
{
 const{v,calls,send}=fixture();send('pointerdown',10,10,'mouse',{button:2});send('pointerdown',10,10,'touch',{isPrimary:false});assert(!v.carry);assert.equal(calls.length,0);
 v.liftAllowed=false;send('pointerdown');send('pointermove',70,60);send('pointermove',90,70);send('pointerup',90,70);assert.equal(calls.filter(c=>c[0]==='lift').length,1,'blocked pickup explains once rather than retrying every move');assert(!v.carry);
}
console.log('PASS: mouse/touch/pen immediate body pickup; sticky first release; next-tap and drag drop; patient pickup; rejected/cancelled drops; floor selection/pan/build preserved; secondary pointers ignored; blocked pickups attempted once');
