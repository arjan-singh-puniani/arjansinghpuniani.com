export interface ScheduleEntry {start:number;destination:string;activity:string;animation?:string}
export interface Schedulable {id:string;currentScheduleIndex:number;setDestination(id:string,activity:string,animation?:string):void}
export class ScheduleSystem {
  constructor(public schedules:Record<string,ScheduleEntry[]>){for(const list of Object.values(schedules))list.sort((a,b)=>a.start-b.start)}
  update(person:Schedulable,minutes:number){const list=this.schedules[person.id]||[];if(!list.length)return;let idx=0;for(let i=0;i<list.length;i++)if(minutes>=list[i].start)idx=i;const key=(minutes<list[0].start)?list.length-1:idx;if(person.currentScheduleIndex!==key){person.currentScheduleIndex=key;const e=list[key];person.setDestination(e.destination,e.activity,e.animation)}}
}
