import {
  CASES, DEFAULT_CASE, FLUID, NORMALIZED_PULSE, radiusAt, cylindricalVelocity,
  velocityAt, vorticityAt, axialPressurePa, wallShearPa, computeMetrics,
  pulseMultiplier, flowRateM3s, reynoldsNumber, womersleyNumber, lerp, clamp,
  provenanceForMetric,
} from './physics.js';
import { HemodynamicRenderer } from './renderer.js';

const $ = (id) => document.getElementById(id);
const state = {
  case: DEFAULT_CASE,
  phase: 0.28,
  mode: 'streamlines',
  view: '3d',
  playing: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  displayRate: 0.27,
  lastFieldBuild: 0,
};

const glCanvas = $('glCanvas');
const sectionCanvas = $('sectionCanvas');
const failure = $('failure');
let glFailure = null;
const renderer = new HemodynamicRenderer(glCanvas, (message) => {
  glFailure = message;
  $('failureText').textContent = message;
  if (state.view === '3d') failure.style.display = 'grid';
});

const MODE_META = {
  streamlines: {label:'streamlines', legend:'Velocity magnitude', unit:'m/s'},
  velocity: {label:'velocity', legend:'Velocity magnitude', unit:'m/s'},
  vorticity: {label:'vorticity', legend:'Vorticity magnitude', unit:'s⁻¹'},
  pressure: {label:'pressure', legend:'Gauge pressure', unit:'Pa'},
  wall: {label:'wall shear', legend:'Wall shear magnitude', unit:'Pa'},
};

function seqColor(t, alpha=1){
  const stops=[[20,41,47],[20,89,94],[49,143,133],[184,194,142],[194,77,41]];
  t=clamp(t,0,1);const x=t*(stops.length-1),i=Math.min(stops.length-2,Math.floor(x)),f=x-i;
  const c=stops[i].map((v,k)=>Math.round(v+(stops[i+1][k]-v)*f));
  return `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
}

function populateCases(){
  $('caseSelect').innerHTML = CASES.map(c=>`<option value="${c.id}" ${c.id===state.case.id?'selected':''}>${c.label}</option>`).join('');
}

function format(v,d=2){return Number.isFinite(v)?v.toFixed(d):'—';}

function updateMetrics(){
  const m=computeMetrics(state.phase,state.case);
  $('mInlet').textContent=format(m.inletVelocityMps,2);
  $('mThroat').textContent=format(m.throatMeanVelocityMps,2);
  $('mPressure').textContent=format(m.modeledPressureSpanMmHg,1);
  $('mRe').textContent=Math.round(m.reynoldsInlet).toLocaleString();
  $('mRecirc').textContent=format(m.recirculationLengthMm,1);
  $('mWss').textContent=format(m.peakWallShearPa,1);
  $('rRe').textContent=Math.round(m.reynoldsInlet).toLocaleString();
  $('rWo').textContent=format(m.womersley,1);
  $('flowRateLabel').textContent=`Q ${format(m.flowRateMlS,1)} mL/s`;
  $('phaseValue').textContent=`${Math.round(state.phase*100)}%`;
}

function resizeCanvas(canvas,heightCss){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const rect=canvas.getBoundingClientRect();
  const cssW=Math.max(2,rect.width), cssH=Math.max(2,heightCss ?? rect.height);
  const pixelW=Math.max(2,Math.floor(cssW*dpr)), pixelH=Math.max(2,Math.floor(cssH*dpr));
  if(canvas.width!==pixelW||canvas.height!==pixelH){canvas.width=pixelW;canvas.height=pixelH;}
  const ctx=canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return {ctx,w:cssW,h:cssH,dpr};
}

function plotFrame(ctx,w,h,{left=28,right=8,top=8,bottom=19}={}){
  const x0=left,y0=top,x1=w-right,y1=h-bottom;
  ctx.strokeStyle='rgba(90,92,87,.22)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(x0,y1+.5);ctx.lineTo(x1,y1+.5);ctx.moveTo(x0-.5,y0);ctx.lineTo(x0-.5,y1);ctx.stroke();
  return {x0,y0,x1,y1,W:x1-x0,H:y1-y0};
}
function label(ctx,text,x,y,align='left'){
  ctx.fillStyle='#777a74';ctx.font='9px ui-monospace, SFMono-Regular, Menlo, monospace';ctx.textAlign=align;ctx.fillText(text,x,y);
}

function drawLinePlot(canvas, series, xDomain, yDomain, opts={}){
  const {ctx,w,h}=resizeCanvas(canvas);
  ctx.clearRect(0,0,w,h);ctx.save();
  const f=plotFrame(ctx,w,h,{left:32,top:8,right:8,bottom:20});
  const sx=x=>f.x0+(x-xDomain[0])/(xDomain[1]-xDomain[0])*f.W;
  const sy=y=>f.y1-(y-yDomain[0])/(yDomain[1]-yDomain[0])*f.H;
  if(yDomain[0]<0&&yDomain[1]>0){ctx.strokeStyle='rgba(90,92,87,.18)';ctx.beginPath();ctx.moveTo(f.x0,sy(0));ctx.lineTo(f.x1,sy(0));ctx.stroke();}
  series.forEach((s,idx)=>{
    ctx.strokeStyle=s.color||seqColor((idx+.4)/(series.length+.3));ctx.lineWidth=s.width||1.5;ctx.beginPath();
    s.points.forEach((p,i)=>{const x=sx(p[0]),y=sy(p[1]);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
    if(s.dash)ctx.setLineDash([]);
  });
  label(ctx,opts.xLeft??format(xDomain[0],0),f.x0,f.y1+14,'left');label(ctx,opts.xRight??format(xDomain[1],0),f.x1,f.y1+14,'right');
  label(ctx,opts.yMax??format(yDomain[1],1),f.x0-5,f.y0+8,'right');label(ctx,opts.yMin??format(yDomain[0],1),f.x0-5,f.y1,'right');
  if(opts.markerX!=null){ctx.strokeStyle='#913f24';ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(sx(opts.markerX),f.y0);ctx.lineTo(sx(opts.markerX),f.y1);ctx.stroke();ctx.setLineDash([]);}
  ctx.restore();
}

function drawCharts(){
  const c=state.case,p=state.phase;
  const profileLocations=[
    {z:c.axialMinM+2e-3,label:'inlet'},
    {z:c.stenosisCenterM,label:'throat'},
    {z:c.recirculationCenterM+3e-3,label:'post'},
  ];
  let ymax=0;
  const profiles=profileLocations.map((loc,idx)=>{
    const R=radiusAt(loc.z,c),points=[];
    for(let i=0;i<=70;i++){const xi=-1+2*i/70;const u=cylindricalVelocity(Math.abs(xi)*R,loc.z,p,c).uz;points.push([xi,u]);ymax=Math.max(ymax,u);}
    return {points,color:seqColor((idx+.4)/3.4)};
  });
  drawLinePlot($('velocityChart'),profiles,[-1,1],[Math.min(-.1,Math.min(...profiles.flatMap(s=>s.points.map(q=>q[1])))),ymax*1.08],{xLeft:'−R',xRight:'+R',yMax:`${format(ymax,1)} m/s`,yMin:'uᶻ'});

  const pressure=[],wss=[];let pmin=Infinity,pmax=-Infinity,wmax=0;
  for(let i=0;i<=160;i++){const z=lerp(c.axialMinM,c.axialMaxM,i/160),pm=axialPressurePa(z,p,c)/133.322,tw=wallShearPa(z,p,c);pressure.push([z*1e3,pm]);wss.push([z*1e3,tw]);pmin=Math.min(pmin,pm);pmax=Math.max(pmax,pm);wmax=Math.max(wmax,tw);}
  drawLinePlot($('pressureChart'),[{points:pressure,color:'#174f52'}],[c.axialMinM*1e3,c.axialMaxM*1e3],[Math.min(pmin*1.08,-.1),Math.max(pmax*1.08,.1)],{xLeft:`${format(c.axialMinM*1e3,0)} mm`,xRight:`${format(c.axialMaxM*1e3,0)} mm`,yMax:`${format(pmax,1)} mmHg`,yMin:`${format(pmin,1)}`});
  drawLinePlot($('wssChart'),[{points:wss,color:'#913f24'}],[c.axialMinM*1e3,c.axialMaxM*1e3],[0,wmax*1.08],{xLeft:`${format(c.axialMinM*1e3,0)} mm`,xRight:`${format(c.axialMaxM*1e3,0)} mm`,yMax:`${format(wmax,1)} Pa`,yMin:'0'});

  const pulse=[];for(let i=0;i<=160;i++){const ph=i/160;pulse.push([ph,pulseMultiplier(ph)]);}
  const pmaxPulse=Math.max(...pulse.map(q=>q[1]));
  drawLinePlot($('pulseChart'),[{points:pulse,color:'#174f52'}],[0,1],[0,pmaxPulse*1.08],{xLeft:'0%',xRight:'100%',yMax:'normalized',yMin:'0',markerX:p});
}

function sectionScalar(x,z){
  if(state.mode==='pressure') return axialPressurePa(z,state.phase,state.case);
  if(state.mode==='wall') return wallShearPa(z,state.phase,state.case);
  if(state.mode==='vorticity') return vorticityAt(x,0,z,state.phase,state.case).magnitude;
  return velocityAt(x,0,z,state.phase,state.case).speed;
}

function sectionScalarRange(){
  const c=state.case;let min=Infinity,max=-Infinity;
  if(state.mode==='wall'){
    for(let i=0;i<120;i++){const z=lerp(c.axialMinM,c.axialMaxM,i/119),s=wallShearPa(z,state.phase,c);min=Math.min(min,s);max=Math.max(max,s);}return[min,max];
  }
  for(let iz=0;iz<96;iz++){
    const z=lerp(c.axialMinM,c.axialMaxM,iz/95),R=radiusAt(z,c);
    for(let ir=0;ir<30;ir++){
      const x=lerp(-.97*R,.97*R,ir/29),s=sectionScalar(x,z);if(Number.isFinite(s)){min=Math.min(min,s);max=Math.max(max,s);}
    }
  }
  return Number.isFinite(min)&&max>min?[min,max]:[0,1];
}

function drawSection(){
  if(state.view!=='section')return;
  const {ctx,w,h}=resizeCanvas(sectionCanvas);const c=state.case;
  ctx.clearRect(0,0,w,h);ctx.fillStyle='rgba(246,245,241,.01)';ctx.fillRect(0,0,w,h);
  const padX=48,padY=45,plot={x0:padX,x1:w-padX,y0:padY,y1:h-padY};plot.W=plot.x1-plot.x0;plot.H=plot.y1-plot.y0;
  const maxR=c.nominalRadiusM*1.17;
  const sx=z=>plot.x0+(z-c.axialMinM)/(c.axialMaxM-c.axialMinM)*plot.W;
  const sy=x=>plot.y0+(1-(x+maxR)/(2*maxR))*plot.H;
  const [smin,smax]=sectionScalarRange();
  const nz=170,nr=76,dz=plot.W/nz,dy=plot.H/nr;

  if(state.mode!=='wall'){
    for(let iz=0;iz<nz;iz++){
      const z=lerp(c.axialMinM,c.axialMaxM,(iz+.5)/nz),R=radiusAt(z,c);
      for(let iy=0;iy<nr;iy++){
        const x=lerp(-maxR,maxR,(iy+.5)/nr);if(Math.abs(x)>R)continue;
        const s=sectionScalar(x,z),t=(s-smin)/Math.max(1e-12,smax-smin);
        ctx.fillStyle=seqColor(t,.78);ctx.fillRect(plot.x0+iz*dz,plot.y0+iy*dy,dz+1,dy+1);
      }
    }
  } else {
    ctx.fillStyle='rgba(23,79,82,.045)';ctx.beginPath();
    for(let i=0;i<=180;i++){const z=lerp(c.axialMinM,c.axialMaxM,i/180),pt=[sx(z),sy(radiusAt(z,c))];i?ctx.lineTo(...pt):ctx.moveTo(...pt);}for(let i=180;i>=0;i--){const z=lerp(c.axialMinM,c.axialMaxM,i/180);ctx.lineTo(sx(z),sy(-radiusAt(z,c)));}ctx.closePath();ctx.fill();
    ctx.lineWidth=6;
    for(let side of [-1,1]){
      for(let i=1;i<=180;i++){
        const z0=lerp(c.axialMinM,c.axialMaxM,(i-1)/180),z1=lerp(c.axialMinM,c.axialMaxM,i/180);const sm=wallShearPa((z0+z1)/2,state.phase,c);ctx.strokeStyle=seqColor((sm-smin)/Math.max(1e-12,smax-smin),.9);ctx.beginPath();ctx.moveTo(sx(z0),sy(side*radiusAt(z0,c)));ctx.lineTo(sx(z1),sy(side*radiusAt(z1,c)));ctx.stroke();
      }
    }
  }

  // Meridional streamlines derived from the same axisymmetric reduced-order field.
  if(state.mode!=='wall'){
    const seeds=[-.82,-.64,-.46,-.28,0,.28,.46,.64,.82];ctx.lineWidth=1;ctx.strokeStyle='rgba(250,250,245,.60)';
    for(const frac of seeds){
      let z=c.axialMinM+1e-3,x=frac*radiusAt(z,c);ctx.beginPath();ctx.moveTo(sx(z),sy(x));
      for(let k=0;k<420;k++){
        const r=Math.abs(x),cv=cylindricalVelocity(r,z,state.phase,c);if(!cv.inside||Math.abs(cv.uz)<1e-5)break;
        const sign=x<0?-1:1;const dt=.00030; x += sign*cv.ur*dt; z += cv.uz*dt;
        if(z>=c.axialMaxM||Math.abs(x)>=radiusAt(z,c)*.995)break;ctx.lineTo(sx(z),sy(x));
      }
      ctx.stroke();
    }
  }

  // Vessel boundary and throat reference.
  ctx.lineWidth=1.35;ctx.strokeStyle='#535650';
  for(const side of [-1,1]){ctx.beginPath();for(let i=0;i<=220;i++){const z=lerp(c.axialMinM,c.axialMaxM,i/220),x=sx(z),y=sy(side*radiusAt(z,c));i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
  ctx.setLineDash([4,4]);ctx.strokeStyle='rgba(145,63,36,.55)';ctx.beginPath();ctx.moveTo(sx(c.stenosisCenterM),plot.y0);ctx.lineTo(sx(c.stenosisCenterM),plot.y1);ctx.stroke();ctx.setLineDash([]);
  label(ctx,'PROXIMAL',plot.x0,plot.y0-15,'left');label(ctx,'STENOSIS THROAT',sx(c.stenosisCenterM),plot.y0-15,'center');label(ctx,'POST-STENOTIC',plot.x1,plot.y0-15,'right');
  label(ctx,`${format(c.axialMinM*1e3,0)} mm`,plot.x0,plot.y1+18,'left');label(ctx,`${format(c.axialMaxM*1e3,0)} mm`,plot.x1,plot.y1+18,'right');
  updateLegendRange(smin,smax);
}


function drawCrossSections(){
  if(state.view!=='cross')return;
  const {ctx,w,h}=resizeCanvas(sectionCanvas);const c=state.case;
  ctx.clearRect(0,0,w,h);
  const sections=[
    {label:'INLET',z:c.axialMinM+2e-3},
    {label:'THROAT',z:c.stenosisCenterM},
    {label:'POST-STENOTIC',z:c.recirculationCenterM},
    {label:'DISTAL',z:c.axialMaxM-4e-3},
  ];
  let smin=Infinity,smax=-Infinity;
  for(const sec of sections){
    const R=radiusAt(sec.z,c);
    for(let iy=0;iy<26;iy++)for(let ix=0;ix<26;ix++){
      const x=lerp(-R,R,ix/25),y=lerp(-R,R,iy/25);if(Math.hypot(x,y)>R)continue;
      let s;
      if(state.mode==='pressure')s=axialPressurePa(sec.z,state.phase,c);
      else if(state.mode==='wall')s=wallShearPa(sec.z,state.phase,c);
      else if(state.mode==='vorticity')s=vorticityAt(x,y,sec.z,state.phase,c).magnitude;
      else s=velocityAt(x,y,sec.z,state.phase,c).speed;
      if(Number.isFinite(s)){smin=Math.min(smin,s);smax=Math.max(smax,s);}
    }
  }
  if(!Number.isFinite(smin)||smax<=smin){smin=0;smax=1;}
  const cols=w>900?4:2,rows=Math.ceil(sections.length/cols),cellW=w/cols,cellH=h/rows;
  sections.forEach((sec,index)=>{
    const col=index%cols,row=Math.floor(index/cols),cx=col*cellW+cellW/2,cy=row*cellH+cellH*.54;
    const R=radiusAt(sec.z,c),rp=Math.min(cellW*.31,cellH*.31),N=state.mode==='vorticity'?44:70;
    if(state.mode==='wall'){
      ctx.fillStyle='rgba(23,79,82,.045)';ctx.beginPath();ctx.arc(cx,cy,rp,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=seqColor((wallShearPa(sec.z,state.phase,c)-smin)/Math.max(1e-12,smax-smin),.95);ctx.lineWidth=Math.max(4,rp*.07);ctx.beginPath();ctx.arc(cx,cy,rp-ctx.lineWidth/2,0,Math.PI*2);ctx.stroke();
    } else {
      const step=2*rp/N;
      for(let iy=0;iy<N;iy++)for(let ix=0;ix<N;ix++){
        const dx=-rp+(ix+.5)*step,dy=-rp+(iy+.5)*step;if(dx*dx+dy*dy>rp*rp)continue;
        const x=dx/rp*R,y=-dy/rp*R;let v;
        if(state.mode==='pressure')v=axialPressurePa(sec.z,state.phase,c);
        else if(state.mode==='vorticity')v=vorticityAt(x,y,sec.z,state.phase,c).magnitude;
        else v=velocityAt(x,y,sec.z,state.phase,c).speed;
        ctx.fillStyle=seqColor((v-smin)/Math.max(1e-12,smax-smin),.92);ctx.fillRect(cx-rp+ix*step,cy-rp+iy*step,step+1,step+1);
      }
      ctx.strokeStyle='#535650';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(cx,cy,rp,0,Math.PI*2);ctx.stroke();
    }
    label(ctx,sec.label,cx,cy-rp-18,'center');label(ctx,`${format(sec.z*1e3,1)} mm`,cx,cy+rp+22,'center');
    if(index<sections.length-1&&cols===4){ctx.strokeStyle='rgba(90,92,87,.15)';ctx.beginPath();ctx.moveTo((index+1)*cellW,18);ctx.lineTo((index+1)*cellW,h-18);ctx.stroke();}
  });
  updateLegendRange(smin,smax);
}

function updateLegendRange(min,max){
  const meta=MODE_META[state.mode];$('legendName').textContent=meta.legend;$('legendUnit').textContent=meta.unit;
  const digits=state.mode==='vorticity'?0:state.mode==='pressure'?0:2;
  $('legendMin').textContent=format(min,digits);$('legendMax').textContent=format(max,digits);
}

function updateLegendFrom3D(){
  const meta=MODE_META[state.mode];$('legendName').textContent=meta.legend;$('legendUnit').textContent=meta.unit;
  const range=renderer?.lines?.scalarRange||[0,1];updateLegendRange(range[0],range[1]);
}

function setMode(mode){
  state.mode=mode;
  document.querySelectorAll('#fieldButtons button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  $('modeLabel').textContent=MODE_META[mode].label;
  renderer?.setState(state.case,state.phase,state.mode);updateMetrics();drawCharts();if(state.view==='section')drawSection();else if(state.view==='cross')drawCrossSections();else updateLegendFrom3D();
}

function setView(view){
  state.view=view;document.querySelectorAll('#viewButtons button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
  glCanvas.style.display=view==='3d'?'block':'none';sectionCanvas.style.display=view==='3d'?'none':'block';
  $('viewLabel').textContent=view==='3d'?'3D flow field':view==='section'?'longitudinal section':'cross-sectional field';failure.style.display=(view==='3d'&&glFailure)?'grid':'none';$('probe').style.display='none';
  if(view==='section')drawSection();else if(view==='cross')drawCrossSections();else updateLegendFrom3D();
}

function rebuildField(now=performance.now()){
  renderer?.setState(state.case,state.phase,state.mode);state.lastFieldBuild=now;updateMetrics();drawCharts();if(state.view==='section')drawSection();else if(state.view==='cross')drawCrossSections();else updateLegendFrom3D();
}

function bind(){
  populateCases();
  $('caseSelect').addEventListener('change',e=>{state.case=CASES.find(c=>c.id===e.target.value)||DEFAULT_CASE;rebuildField();});
  $('fieldButtons').addEventListener('click',e=>{const b=e.target.closest('button[data-mode]');if(b)setMode(b.dataset.mode);});
  $('viewButtons').addEventListener('click',e=>{const b=e.target.closest('button[data-view]');if(b)setView(b.dataset.view);});
  $('phase').addEventListener('input',e=>{state.phase=Number(e.target.value);rebuildField();});
  $('play').addEventListener('click',()=>{state.playing=!state.playing;$('play').textContent=state.playing?'Pause':'Play';$('play').setAttribute('aria-pressed',String(state.playing));});
  $('resetView').addEventListener('click',()=>renderer?.resetCamera());
  window.addEventListener('resize',()=>{drawCharts();if(state.view==='section')drawSection();else if(state.view==='cross')drawCrossSections();});
  sectionCanvas.addEventListener('pointermove',probeSection);sectionCanvas.addEventListener('pointerleave',()=>{$('probe').style.display='none';});sectionCanvas.addEventListener('pointerdown',probeSection);
}

function probeSection(e){
  if(state.view!=='section')return;const rect=sectionCanvas.getBoundingClientRect(),c=state.case;
  const px=e.clientX-rect.left, py=e.clientY-rect.top;
  const padX=48, padY=45;
  const z=lerp(c.axialMinM,c.axialMaxM,clamp((px-padX)/Math.max(1,rect.width-2*padX),0,1));
  const maxR=c.nominalRadiusM*1.17;const x=lerp(maxR,-maxR,clamp((py-padY)/Math.max(1,rect.height-2*padY),0,1));
  if(Math.abs(x)>radiusAt(z,c)){$('probe').style.display='none';return;}
  const v=velocityAt(x,0,z,state.phase,c),w=vorticityAt(x,0,z,state.phase,c).magnitude,p=axialPressurePa(z,state.phase,c),tau=wallShearPa(z,state.phase,c);
  const probe=$('probe');probe.innerHTML=`<b>SECTION PROBE</b><br>z ${format(z*1e3,1)} mm · r ${format(Math.abs(x)*1e3,1)} mm<br>|u| ${format(v.speed,3)} m/s<br>|ω| ${format(w,0)} s⁻¹<br>p−pᵢₙ ${format(p,0)} Pa <span style="color:#913f24">APPROX</span><br>|τw| ${format(tau,2)} Pa`;
  probe.style.display='block';probe.style.left=`${clamp(e.clientX-rect.left+12,8,rect.width-175)}px`;probe.style.top=`${clamp(e.clientY-rect.top+12,8,rect.height-110)}px`;
}

let lastFrame=performance.now(),frameCount=0,fpsStart=lastFrame,lastDiag=lastFrame,lastStats={};
function animate(now){
  const dt=Math.min(.05,(now-lastFrame)/1000);lastFrame=now;
  if(state.playing){state.phase=(state.phase+dt/state.case.cyclePeriodS*state.displayRate)%1;$('phase').value=String(state.phase);$('phaseValue').textContent=`${Math.round(state.phase*100)}%`;if(now-state.lastFieldBuild>125)rebuildField(now);}
  if(state.view==='3d')lastStats=renderer?.draw(now/1000)||{};
  frameCount++;
  if(now-fpsStart>1000){
    const fps=frameCount*1000/(now-fpsStart);frameCount=0;fpsStart=now;
    const diag={status:'running',fps:Number(fps.toFixed(1)),case:state.case.id,mode:state.mode,view:state.view,phase:Number(state.phase.toFixed(3)),...lastStats,webgl2:Boolean(renderer?.gl),synthetic:true,numericalCFD:false};
    $('diagnostics').textContent=JSON.stringify(diag);$('diagnostics').dataset.ready='true';window.__hemoDiagnostics=diag;
  }
  requestAnimationFrame(animate);
}

bind();rebuildField();setView('3d');$('play').textContent=state.playing?'Pause':'Play';$('play').setAttribute('aria-pressed',String(state.playing));
requestAnimationFrame(animate);
