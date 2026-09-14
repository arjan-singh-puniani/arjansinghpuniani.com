import type {Placement,Weather} from '../world/World.js';
import type {Relationship} from '../simulation/RelationshipSystem.js';
import type {DailyGoalsSave} from '../simulation/DailyGoalsSystem.js';
import type {ClubLifeSave} from '../simulation/ClubLifeSystem.js';
import type {EmergentSocialSave} from '../simulation/EmergentSocialSystem.js';

export interface GameSave {
  playerAvatar?:import('../content/PlayerAvatars.js').PlayerAvatar|null;
  queuedLesson?:string|null;
  mind?:import('../simulation/CharacterMind.js').MindSave;
  everyday?:import('../simulation/EverydayLife.js').EverydaySave;
  clock:{minutes:number;day:number;paused:boolean;speed:number};
  coins:number;
  stars:number;
  coachXP:number;
  mikaProgress:number;
  weather:Weather;
  placements:Placement[];
  relationships:Record<string,Relationship>;
  dailyGoals?:DailyGoalsSave;
  clubLife?:ClubLifeSave;
  equipment:{frame:string;tension:number;string:string};
  player:{x:number;z:number};
  activities?:import('../simulation/ActivitySystem.js').ActivitySave;
  history?:import('../simulation/ClubHistory.js').ClubHistorySave;
  affordances?:import('../simulation/ObjectAffordances.js').AffordanceSave;
  development?:{preparation:number;recovery:number};
  settings?:{volume:number;reducedMotion:boolean;visuals?:'auto'|'detail'};
  bestRally?:number;
  emergentSocial?:EmergentSocialSave;
}
