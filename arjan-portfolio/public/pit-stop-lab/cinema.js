import {telemetryAt,brakingZones} from './pit-wall.js';
import {snapshot} from './simulation.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>t*t*(3-2*t);
const mix=(a,b,t)=>a+(b-a)*t;

export function cinematicTrack(driver){
    const xs=driver.locations.map(p=>p.x),ys=driver.locations.map(p=>p.y);
    const center=[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2],scale=.01;
    let distance=0;
    const points=driver.locations.map((p,i)=>{
        const x=(p.x-center[0])*scale,z=-(p.y-center[1])*scale;
        if(i){const last=driver.locations[i-1];distance+=Math.hypot(p.x-last.x,p.y-last.y)*scale;}
        return {time:p.time,x,z,distance};
    });
    // GPS timing jitter is unsuitable for animation velocity. Compile a smoothed source
    // centerline, then advance by normalized integrated speed; this is a visual alignment.
    const filtered=points.map((p,i)=>{const rows=points.slice(Math.max(0,i-2),Math.min(points.length,i+3));return {x:rows.reduce((n,r)=>n+r.x,0)/rows.length,z:rows.reduce((n,r)=>n+r.z,0)/rows.length};});
    const path=[];let length=0;
    for(let i=0;i<filtered.length-1;i++)for(let step=0;step<4;step++){
        const u=step/4,a=filtered[i],b=filtered[i+1],before=filtered[Math.max(0,i-1)],after=filtered[Math.min(filtered.length-1,i+2)];
        const curve=k=>.5*((2*a[k])+(-before[k]+b[k])*u+(2*before[k]-5*a[k]+4*b[k]-after[k])*u*u+(-before[k]+3*a[k]-3*b[k]+after[k])*u*u*u);
        const x=curve('x'),z=curve('z'),last=path.at(-1);if(last)length+=Math.hypot(x-last.x,z-last.z);path.push({x,z,distance:length});
    }
    const end=filtered.at(-1),last=path.at(-1);length+=Math.hypot(end.x-last.x,end.z-last.z);path.push({...end,distance:length});
    return {driver,points,path,length,scale,center,bounds:[Math.max(...xs.map(x=>(x-center[0])*scale)),Math.max(...ys.map(y=>(y-center[1])*scale))],braking:brakingZones(driver)};
}
function indexAt(points,value,key='time'){let a=0,b=points.length-1;while(a<b){const m=Math.floor((a+b)/2);if(points[m][key]<value)a=m+1;else b=m;}return Math.max(0,a-1);}
function samplePosition(track,distance){
    const p=track.path,i=indexAt(p,distance,'distance'),a=p[i],b=p[Math.min(i+1,p.length-1)],u=b.distance===a.distance?0:clamp((distance-a.distance)/(b.distance-a.distance),0,1);
    return {x:mix(a.x,b.x,u),z:mix(a.z,b.z,u)};
}
export function cinematicFrame(track,time){
    if(!Number.isFinite(time))throw new Error('Invalid replay clock.');
    const t=clamp(time,0,track.driver.duration),samples=track.driver.samples,i=indexAt(samples,t),a=samples[i],b=samples[Math.min(i+1,samples.length-1)],u=b.time===a.time?0:clamp((t-a.time)/(b.time-a.time),0,1),distance=mix(a.progress,b.progress,u)*track.length;
    const p=samplePosition(track,distance),back=samplePosition(track,Math.max(0,distance-.25)),front=samplePosition(track,Math.min(track.length,distance+.25));
    const heading=Math.atan2(-(front.x-back.x),-(front.z-back.z)),speed=telemetryAt(track.driver,t),c=samplePosition(track,Math.min(track.length,distance+.8));
    const future=Math.atan2(-(c.x-p.x),-(c.z-p.z)),angle=Math.atan2(Math.sin(future-heading),Math.cos(future-heading));
    return {...p,distance,heading,steer:clamp(angle*.5,-.32,.32),roll:-distance/(.355*.38),telemetry:speed,time:t};
}

export function raceCamera(track,time,choice='director'){
    const p=cinematicFrame(track,time),forward=[-Math.sin(p.heading),-Math.cos(p.heading)],right=[Math.cos(p.heading),-Math.sin(p.heading)];
    let shot=choice;
    if(choice==='director'){
        const zone=track.braking.findIndex(b=>time>=b.time-1.3&&time<b.time+2.5);
        shot=zone>=0?['front','drone','chase'][zone%3]:time>65&&time<78?'oncar':time>42&&time<53?'drone':'chase';
    }
    const local=(side,height,ahead)=>[p.x+right[0]*side+forward[0]*ahead,height,p.z+right[1]*side+forward[1]*ahead];
    const phase=time*.12;
    const definitions={chase:[local(2.6,1.4,-4.4),local(0,.28,.8),38],front:[local(-2.5,.95,4.8),local(0,.23,0),36],drone:[local(9+Math.sin(phase)*1.4,11,-8),local(0,0,1.8),42],oncar:[local(0,.52,.2),local(0,.24,13),65],overview:[[95,125,110],[0,0,0],46]};
    const [position,target,fov]=definitions[shot]??definitions.chase;
    return {shot,position,target,fov};
}
export function pitFilmShot(sim,time,car=null){
    if(!car){const state=snapshot(sim,time);car=state.cars[state.activeCar-1];}
    const stop=sim.stops[car.number-1],arrival=stop.stopAt,z=car.position,x=4.8*smooth(clamp((-z-7)/8,0,1));
    if(time<arrival-.15)return {shot:'arrival',position:[x+4.3,1.9,z-5],target:[x,.5,z],fov:40};
    if(time<arrival+.65)return {shot:'coordination',position:[3.7,2.65,-4.1],target:[0,.3,-.1],fov:44};
    if(time<stop.mechanicalEnd-.2){const u=smooth(clamp((time-arrival-.65)/Math.max(.01,stop.mechanicalEnd-arrival-.85),0,1));return {shot:'wheel',position:[1.7+u*.15,.72,-3.9+u*.15],target:[.8,.44,-1.6],fov:40};}
    if(stop.held)return {shot:'hold',position:[3.8,2.6,-4.7],target:[0,.5,0],fov:42};
    if(time<stop.releaseAt+.35)return {shot:'release',position:[4.2,2.35,-4.5],target:[0,.4,0],fov:42};
    return {shot:'departure',position:[x+4.4,2.2,z+6.8],target:[x,.4,z-1],fov:40};
}
export const pitFilmStart=sim=>Math.max(0,sim.stops[0].stopAt-.55);
export const pitFilmDuration=sim=>Math.min(sim.duration,(sim.stops.at(-1).releaseAt??sim.duration)+1.45);
export function advanceReel(state,delta,lapDuration,pitDuration){
    if(!state.playing||!Number.isFinite(delta)||delta<=0)return state;
    const rate=state.chapter==='lap'?state.speed:.35,time=state.time+Math.min(delta,.1)*rate,duration=state.chapter==='lap'?lapDuration:pitDuration;
    if(time<duration)return {...state,time};
    if(!state.loop||(state.chapter==='pit'&&state.blocked))return {...state,time:duration,playing:false};
    return {...state,chapter:state.chapter==='lap'?'pit':'lap',time:0};
}
