export interface PerformanceSnapshot {simMs:number;renderMs:number;drawCalls:number;triangles:number;entities:number;memoryMB:number|null}
export class PerformanceMonitor {
  private simMs=0;private renderMs=0;private drawCalls=0;private triangles=0;private entities=0;private lastLog=0;
  constructor(private debug=false){}
  sample(v:Omit<PerformanceSnapshot,'memoryMB'>,now=performance.now()){
    const a=.08;this.simMs+= (v.simMs-this.simMs)*a;this.renderMs+=(v.renderMs-this.renderMs)*a;this.drawCalls=v.drawCalls;this.triangles=v.triangles;this.entities=v.entities;
    if(this.debug&&now-this.lastLog>5000){this.lastLog=now;console.info('[Rally House perf]',this.snapshot());}
  }
  snapshot():PerformanceSnapshot{
    const perf=performance as Performance & {memory?:{usedJSHeapSize:number}};return {simMs:this.simMs,renderMs:this.renderMs,drawCalls:this.drawCalls,triangles:this.triangles,entities:this.entities,memoryMB:perf.memory?perf.memory.usedJSHeapSize/1048576:null};
  }
}
