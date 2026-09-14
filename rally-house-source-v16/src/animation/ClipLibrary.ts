import {Vec3, clamp, smoothstep} from '../rendering/Math3D.js';

export type ClipName=
  'idleA'|'idleB'|'walk'|'jog'|'ready'|'shuffle'|'sit'|'talk'|'drink'|'stretch'|'watch'|
  'forehand'|'backhand'|'serve'|'volley'|'celebrate'|'reactMiss'|'coachFeed'|'coachExplain'|'recover';

export interface ClipSample {
  pelvisY:number; pelvisZ:number; hipTwist:number; torsoTwist:number; lean:number; knee:number;
  headNod:number; headTurn:number; stance:number;
  handL:Vec3; handR:Vec3; footL:Vec3; footR:Vec3;
}
interface Keyframe {t:number; p?:Partial<Omit<ClipSample,'handL'|'handR'|'footL'|'footR'>>; handL?:[number,number,number];handR?:[number,number,number];footL?:[number,number,number];footR?:[number,number,number]}
interface Clip {loop:boolean;frames:Keyframe[]}

const Z=()=>new Vec3();
const empty=():ClipSample=>({pelvisY:0,pelvisZ:0,hipTwist:0,torsoTwist:0,lean:0,knee:0,headNod:0,headTurn:0,stance:0,handL:Z(),handR:Z(),footL:Z(),footR:Z()});
const F=(t:number,p:Keyframe['p']={},handL?:Keyframe['handL'],handR?:Keyframe['handR'],footL?:Keyframe['footL'],footR?:Keyframe['footR']):Keyframe=>({t,p,handL,handR,footL,footR});

// These are compact, hand-authored motion curves. They intentionally carry only the broad performance;
// contact, planted feet, gaze and object constraints remain procedural layers above them.
export const CLIPS:Record<ClipName,Clip>={
  idleA:{loop:true,frames:[F(0,{pelvisY:.002,pelvisZ:-.004,torsoTwist:-.012,headTurn:-.025}),F(.22,{pelvisY:.010,pelvisZ:.008,torsoTwist:.010,headNod:.006}),F(.50,{pelvisY:.004,pelvisZ:.012,hipTwist:.010,torsoTwist:.020,headTurn:.030}),F(.76,{pelvisY:.011,pelvisZ:-.005,hipTwist:-.010,torsoTwist:-.010,headNod:-.004}),F(1,{pelvisY:.002,pelvisZ:-.004,torsoTwist:-.012,headTurn:-.025})]},
  idleB:{loop:true,frames:[F(0,{pelvisY:.004,pelvisZ:-.006,hipTwist:.012,headTurn:.03}),F(.35,{pelvisY:.010,pelvisZ:.007,hipTwist:-.015,torsoTwist:.022,headNod:.008}),F(.7,{pelvisY:.001,pelvisZ:.004,hipTwist:.018,torsoTwist:-.015,headTurn:-.025}),F(1,{pelvisY:.004,pelvisZ:-.006,hipTwist:.012,headTurn:.03})]},
  walk:{loop:true,frames:[
    F(0,{pelvisY:.004,pelvisZ:.004,hipTwist:-.060,torsoTwist:.050,headNod:-.002},[-.01,0,-.012],[.01,.005,.012],[0,.010,.075],[0,0,-.065]),
    F(.125,{pelvisY:.012,pelvisZ:.010,hipTwist:-.040,torsoTwist:.034,headNod:.002},undefined,undefined,[0,.040,.052],[0,.004,-.028]),
    F(.25,{pelvisY:.027,pelvisZ:.012,hipTwist:0,torsoTwist:0,headNod:.004},undefined,undefined,[0,.088,.010],[0,.006,.020]),
    F(.375,{pelvisY:.015,pelvisZ:.006,hipTwist:.040,torsoTwist:-.034,headNod:.001},undefined,undefined,[0,.044,-.030],[0,.010,.056]),
    F(.5,{pelvisY:.004,pelvisZ:.004,hipTwist:.060,torsoTwist:-.050,headNod:-.002},[.01,.005,.012],[-.01,0,-.012],[0,0,-.065],[0,.010,.075]),
    F(.625,{pelvisY:.012,pelvisZ:.010,hipTwist:.040,torsoTwist:-.034,headNod:.002},undefined,undefined,[0,.004,-.028],[0,.040,.052]),
    F(.75,{pelvisY:.027,pelvisZ:.012,hipTwist:0,torsoTwist:0,headNod:.004},undefined,undefined,[0,.006,.020],[0,.088,.010]),
    F(.875,{pelvisY:.015,pelvisZ:.006,hipTwist:-.040,torsoTwist:.034,headNod:.001},undefined,undefined,[0,.010,.056],[0,.044,-.030]),
    F(1,{pelvisY:.004,pelvisZ:.004,hipTwist:-.060,torsoTwist:.050,headNod:-.002},[-.01,0,-.012],[.01,.005,.012],[0,.010,.075],[0,0,-.065])]},
  jog:{loop:true,frames:[
    F(0,{pelvisY:.030,hipTwist:-.095,torsoTwist:.078,lean:.040},undefined,undefined,[0,.035,.095],[0,.004,-.075]),
    F(.25,{pelvisY:.076,hipTwist:0,torsoTwist:0,lean:.052,headNod:.004},undefined,undefined,[0,.135,.018],[0,.020,.018]),
    F(.5,{pelvisY:.030,hipTwist:.095,torsoTwist:-.078,lean:.040},undefined,undefined,[0,.004,-.075],[0,.035,.095]),
    F(.75,{pelvisY:.076,hipTwist:0,torsoTwist:0,lean:.052,headNod:.004},undefined,undefined,[0,.020,.018],[0,.135,.018]),
    F(1,{pelvisY:.030,hipTwist:-.095,torsoTwist:.078,lean:.040},undefined,undefined,[0,.035,.095],[0,.004,-.075])]},
  ready:{loop:true,frames:[F(0,{pelvisY:-.015,knee:.035,stance:.06,lean:.025},[-.01,.01,.015],[.01,.01,.015]),F(.5,{pelvisY:-.022,knee:.045,stance:.075,lean:.03},[.01,0,-.01],[-.01,0,-.01]),F(1,{pelvisY:-.015,knee:.035,stance:.06,lean:.025},[-.01,.01,.015],[.01,.01,.015])]},
  shuffle:{loop:true,frames:[F(0,{pelvisY:-.018,knee:.04,stance:.08,hipTwist:-.025},undefined,undefined,[0,.012,.025],[0,0,-.015]),F(.25,{pelvisY:.008,knee:.025,stance:.07},undefined,undefined,[0,.065,0],[0,.01,0]),F(.5,{pelvisY:-.018,knee:.04,stance:.08,hipTwist:.025},undefined,undefined,[0,0,-.015],[0,.012,.025]),F(.75,{pelvisY:.008,knee:.025,stance:.07},undefined,undefined,[0,.01,0],[0,.065,0]),F(1,{pelvisY:-.018,knee:.04,stance:.08,hipTwist:-.025},undefined,undefined,[0,.012,.025],[0,0,-.015])]},
  sit:{loop:true,frames:[F(0,{pelvisY:0,lean:.005},[0,0,0],[0,0,0]),F(.5,{pelvisY:.006,lean:.012,headNod:.008},[0,.005,.008],[0,.004,.006]),F(1,{pelvisY:0,lean:.005},[0,0,0],[0,0,0])]},
  talk:{loop:true,frames:[F(0,{torsoTwist:-.03,headTurn:-.025},[-.025,0,.01],[.04,.02,.035]),F(.33,{torsoTwist:.025,headNod:.018},[.03,.04,.04],[-.015,.015,.01]),F(.66,{torsoTwist:.045,headTurn:.035},[-.02,.015,.025],[.05,.045,.02]),F(1,{torsoTwist:-.03,headTurn:-.025},[-.025,0,.01],[.04,.02,.035])]},
  drink:{loop:false,frames:[F(0,{headNod:0},undefined,[0,0,0]),F(.25,{headNod:-.02},undefined,[0,.045,.02]),F(.55,{headNod:.035},undefined,[0,.07,.035]),F(.78,{headNod:.045},undefined,[0,.065,.025]),F(1,{headNod:0},undefined,[0,0,0])]},
  stretch:{loop:true,frames:[F(0,{lean:-.015,torsoTwist:-.03},[-.02,0,0],[.02,0,0]),F(.5,{lean:.025,torsoTwist:.035,headNod:-.02},[.02,.05,.02],[-.02,.05,.02]),F(1,{lean:-.015,torsoTwist:-.03},[-.02,0,0],[.02,0,0])]},
  watch:{loop:true,frames:[F(0,{lean:.01,headTurn:-.025}),F(.5,{lean:.018,headTurn:.025,headNod:.008}),F(1,{lean:.01,headTurn:-.025})]},
  forehand:{loop:false,frames:[F(0,{hipTwist:-.10,torsoTwist:-.15,knee:.02,lean:.01},undefined,[.01,0,-.02]),F(.24,{hipTwist:-.16,torsoTwist:-.26,knee:.055,lean:.018},undefined,[-.025,-.01,-.04]),F(.52,{hipTwist:-.05,torsoTwist:-.06,knee:.035,pelvisZ:.018},undefined,[.02,.015,.03]),F(.66,{hipTwist:.13,torsoTwist:.22,knee:.012,pelvisZ:.035},undefined,[.04,.02,.06]),F(.86,{hipTwist:.20,torsoTwist:.30,lean:.04},undefined,[.025,.035,.035]),F(1,{hipTwist:.04,torsoTwist:.06,lean:.01})]},
  backhand:{loop:false,frames:[F(0,{hipTwist:.10,torsoTwist:.17,knee:.02},[0,0,-.015],undefined),F(.26,{hipTwist:.16,torsoTwist:.27,knee:.055},[-.02,-.01,-.035],undefined),F(.53,{hipTwist:.04,torsoTwist:.06,knee:.035,pelvisZ:.018},[.015,.01,.025],undefined),F(.68,{hipTwist:-.12,torsoTwist:-.21,pelvisZ:.035},[.03,.015,.05],undefined),F(.88,{hipTwist:-.18,torsoTwist:-.27,lean:.035},[.02,.025,.03],undefined),F(1,{hipTwist:-.03,torsoTwist:-.05})]},
  serve:{loop:false,frames:[F(0,{hipTwist:-.05,torsoTwist:-.08,knee:.02,lean:-.01}),F(.22,{hipTwist:-.13,torsoTwist:-.20,knee:.08,lean:-.035},[0,.04,.01],[-.01,-.03,-.03]),F(.44,{hipTwist:-.18,torsoTwist:-.27,knee:.15,lean:-.055},[0,.08,.015],[.01,-.08,-.05]),F(.62,{hipTwist:.02,torsoTwist:.04,knee:.055,pelvisY:.07,lean:.045},[-.01,.02,0],[.02,.06,.02]),F(.75,{hipTwist:.13,torsoTwist:.20,pelvisY:.035,lean:.08},undefined,[.035,.08,.05]),F(1,{hipTwist:.04,torsoTwist:.06,lean:.03,pelvisZ:.05})]},
  volley:{loop:false,frames:[F(0,{knee:.03,lean:.025,torsoTwist:-.04}),F(.38,{knee:.04,lean:.035,torsoTwist:-.07},undefined,[-.01,-.005,-.02]),F(.58,{knee:.02,lean:.04,torsoTwist:.04,pelvisZ:.025},undefined,[.015,.01,.035]),F(1,{lean:.02,torsoTwist:.02,pelvisZ:.015})]},
  celebrate:{loop:false,frames:[F(0,{pelvisY:0}),F(.28,{pelvisY:.09,knee:.04,headNod:-.03},[0,.06,0],[0,.06,0]),F(.52,{pelvisY:.02,torsoTwist:.08,headTurn:.03}),F(.74,{pelvisY:.075,torsoTwist:-.06,headTurn:-.03}),F(1,{pelvisY:0})]},
  reactMiss:{loop:false,frames:[F(0,{lean:.01}),F(.28,{lean:.065,headNod:.06,torsoTwist:-.025},[-.02,-.02,0],[.02,-.02,0]),F(.62,{lean:.045,headNod:.04}),F(1,{lean:.015,headNod:.015})]},
  coachFeed:{loop:true,frames:[F(0,{torsoTwist:-.04},undefined,[0,0,-.02]),F(.5,{torsoTwist:.05},undefined,[.02,.03,.045]),F(1,{torsoTwist:-.04},undefined,[0,0,-.02])]},
  coachExplain:{loop:true,frames:[F(0,{torsoTwist:-.035,headTurn:-.02},[-.01,0,0],[.02,.01,.01]),F(.4,{torsoTwist:.04,headNod:.025},[.015,.02,.025],[.05,.05,.035]),F(.7,{torsoTwist:.065,headTurn:.03},[-.005,.015,.015],[.03,.07,.02]),F(1,{torsoTwist:-.035,headTurn:-.02},[-.01,0,0],[.02,.01,.01])]},
  recover:{loop:false,frames:[F(0,{knee:.025,lean:.025}),F(.45,{knee:.04,stance:.05,lean:.015}),F(1,{knee:.02,stance:.025})]}
};

function tupleToVec(v?:[number,number,number]){return v?new Vec3(v[0],v[1],v[2]):new Vec3();}
function frameSample(k:Keyframe):ClipSample{const e=empty();Object.assign(e,k.p??{});e.handL=tupleToVec(k.handL);e.handR=tupleToVec(k.handR);e.footL=tupleToVec(k.footL);e.footR=tupleToVec(k.footR);return e;}
function lerpSample(a:ClipSample,b:ClipSample,t:number):ClipSample{const n=(k:keyof Omit<ClipSample,'handL'|'handR'|'footL'|'footR'>)=>(a[k] as number)+((b[k] as number)-(a[k] as number))*t;return {pelvisY:n('pelvisY'),pelvisZ:n('pelvisZ'),hipTwist:n('hipTwist'),torsoTwist:n('torsoTwist'),lean:n('lean'),knee:n('knee'),headNod:n('headNod'),headTurn:n('headTurn'),stance:n('stance'),handL:Vec3.lerp(a.handL,b.handL,t),handR:Vec3.lerp(a.handR,b.handR,t),footL:Vec3.lerp(a.footL,b.footL,t),footR:Vec3.lerp(a.footR,b.footR,t)};}

export function sampleClip(name:ClipName,t:number):ClipSample{
  const clip=CLIPS[name];if(clip.loop)t=((t%1)+1)%1;else t=clamp(t,0,1);
  const frames=clip.frames;if(t<=frames[0].t)return frameSample(frames[0]);if(t>=frames[frames.length-1].t)return frameSample(frames[frames.length-1]);
  for(let i=0;i<frames.length-1;i++){const a=frames[i],b=frames[i+1];if(t>=a.t&&t<=b.t){const u=smoothstep(0,1,(t-a.t)/(b.t-a.t));return lerpSample(frameSample(a),frameSample(b),u);}}
  return empty();
}

export function clipForState(state:string,seed=0):ClipName{
  switch(state){
    case 'walk':return 'walk';case 'jog':return 'jog';case 'ready':return 'ready';case 'shuffle':return 'shuffle';case 'sit':return 'sit';case 'talk':return 'talk';case 'drink':return 'drink';case 'stretch':return 'stretch';case 'watch':return 'watch';case 'swingForehand':return 'forehand';case 'swingBackhand':return 'backhand';case 'serve':return 'serve';case 'volley':return 'volley';case 'celebrate':return 'celebrate';case 'reactMiss':return 'reactMiss';case 'coachFeed':return 'coachFeed';case 'coachExplain':return 'coachExplain';default:return seed%2?'idleB':'idleA';
  }
}
