const fs=require('fs'),vm=require('vm'),assert=require('assert');
const elements={};function el(id){return elements[id]??=( {value:id==='lens'?'normal':'neighborhood',textContent:'',innerHTML:'',style:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},getBoundingClientRect(){return{width:800,height:470}},getContext(){return{setTransform(){}}},open:false,showModal(){this.open=true},close(){this.open=false}})}
const context=vm.createContext({document:{getElementById:el,querySelectorAll:()=>[],addEventListener(){}},localStorage:{getItem:()=>null,setItem(){}},ResizeObserver:class{observe(){}},devicePixelRatio:1,requestAnimationFrame(){},setTimeout(){},clearTimeout(){},console,Blob,URL});
vm.runInContext(fs.readFileSync('dist/game.js','utf8'),context);
const run=code=>vm.runInContext(code,context);
assert(run('s.rooms.every(r=>path({x:5,y:8},door(r))!==null)'),'initial rooms reachable');
assert.equal(run('valid(1,1)'),false,'overlap rejected');
assert.equal(run('valid(5,4)'),true,'open placement allowed');
assert.equal(run('valid(4,3)'),false,'door obstruction rejected');
run('for(let i=0;i<480;i++)tick()');
assert(run('s.ended'),'shift terminates');assert(run('s.served>0'),'patients complete pathway');assert(run('Number.isFinite(s.cash)&&s.energy>=18&&s.energy<=100'),'finite budget and energy bounds');
const baseline=run('JSON.stringify({served:s.served,left:s.left,cash:s.cash,records:s.records})');
run('s=initial();for(let i=0;i<480;i++)tick()');assert.equal(run('JSON.stringify({served:s.served,left:s.left,cash:s.cash,records:s.records})'),baseline,'seed replay matches');
run('s=initial();s.access=true;for(let i=0;i<480;i++)tick()');assert(run('s.records.filter(r=>r.barrier).length>0'),'access cohort represented');
run('s=initial();s.rooms=s.rooms.filter(r=>r.type!=="care");for(let i=0;i<200;i++)tick()');assert.equal(run('s.served'),0,'missing service blocks completion');
console.log('PASS: routing, placement, obstruction, full shift, deterministic replay, access cohort, missing-service constraint');console.log('Baseline shift:',JSON.parse(baseline).served,'helped;',JSON.parse(baseline).left,'left.');
