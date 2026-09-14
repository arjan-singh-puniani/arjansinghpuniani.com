import {DialogueComposer} from '../dist/simulation/DialogueComposer.js';
// Runs the actual Game activity/director code without a renderer or browser storage.
import {Game} from '../dist/Game.js';
import {Character} from '../dist/entities/Character.js';
import {World} from '../dist/world/World.js';
import {GameClock} from '../dist/core/GameClock.js';
import {ScheduleSystem} from '../dist/simulation/ScheduleSystem.js';
import {RelationshipSystem} from '../dist/simulation/RelationshipSystem.js';
import {EverydayLife} from '../dist/simulation/EverydayLife.js';
import {CharacterMind} from '../dist/simulation/CharacterMind.js';
import {SceneGrammar} from '../dist/simulation/SceneGrammar.js';
import {LifeTelemetry} from '../dist/simulation/LifeTelemetry.js';
import {ActivitySystem} from '../dist/simulation/ActivitySystem.js';
import {ClubHistory} from '../dist/simulation/ClubHistory.js';
import {ClubLifeSystem} from '../dist/simulation/ClubLifeSystem.js';
import {DailyGoalsSystem} from '../dist/simulation/DailyGoalsSystem.js';
import {ObjectAffordances} from '../dist/simulation/ObjectAffordances.js';
import {AmbientSocialPlanner} from '../dist/simulation/AmbientSocialPlanner.js';
import {CoachingEvidence} from '../dist/simulation/CoachingEvidence.js';
import {RallySystem} from '../dist/tennis/RallySystem.js';
import {memberData,destinations,schedules} from '../dist/content/content.js';
import {Vec3} from '../dist/rendering/Math3D.js';
export function simulation(){
 const g=Object.create(Game.prototype),noop=new Proxy({},{get:()=>()=>{}});
 Object.assign(g,{dialogue:new DialogueComposer(),lessonKeys:new Map(),coachingTrace:[],clock:new GameClock(560,1),world:new World(),ui:noop,audio:noop,camera:noop,relations:new RelationshipSystem(),schedule:new ScheduleSystem(schedules),everyday:new EverydayLife(),mind:new CharacterMind(),grammar:new SceneGrammar(),telemetry:new LifeTelemetry(),activities:new ActivitySystem(),history:new ClubHistory(),life:new ClubLifeSystem(),daily:new DailyGoalsSystem(),affordances:new ObjectAffordances(),ambientSocial:new AmbientSocialPlanner(),evidence:new CoachingEvidence(),lifeRuns:new Map(),routes:new Map(),waitingForPlace:new Map(),routineNotices:new Map(),lastNotice:new Map(),furnitureObstacles:[],development:{preparation:0,recovery:0},coins:240,stars:3,mikaProgress:28,coachXP:14,lastDay:1,mindTimer:0,decisionTimer:0,queuedLesson:null,observationStarted:false,speechOwner:null,settings:{volume:0,reducedMotion:true,visuals:'auto'},save:async()=>{}});
 g.clock.minutesPerSecond=1;g.characters=memberData.map((spec,i)=>new Character(spec,[destinations.courtNorth,destinations.courtSouth,destinations.proshop,destinations.cafe][i],g.world.nav,destinations));
 g.player=new Character({...memberData[0],id:'player'},destinations.entrance,g.world.nav,destinations);const c=id=>g.characters.find(c=>c.id===id);c('mika').setDevelopment(g.mikaProgress);
 g.rally=new RallySystem(c('coach'),c('mika'),{onShot:e=>g.evidence.observe(e)});g.socialRally=new RallySystem(c('leo'),c('mika'),{onShot:e=>g.evidence.observe(e)});g.rally.stop();g.socialRally.stop();
 return g;
}
export function advance(g,seconds){for(let i=0;i<Math.round(seconds*60);i++)g.updateFixed(1/60);}
