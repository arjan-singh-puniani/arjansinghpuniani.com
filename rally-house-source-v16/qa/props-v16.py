from pathlib import Path
p=Path('src/entities/Character.ts');s=p.read_text()
s=s.replace("racketStowed=false;socialProp:'cup'|'notebook'|'ball'|'wateringCan'|null=null;practiceCue='';seatDepth=0;", """racketStowed=false;private propWanted:'cup'|'notebook'|'ball'|'wateringCan'|null=null;private propKind:Character['propWanted']=null;private propAge=0;private propAnchor:Vec3|null=null;private propRelease:Vec3|null=null;private departureDelay=0;
  get socialProp(){return this.propWanted;}
  set socialProp(kind:Character['propWanted']){if(kind===this.propWanted)return;const previous=this.propWanted;this.propWanted=kind;
    if(kind&&kind===this.propKind){if(previous===null)this.propAge=1;return;}
    this.propAge=0;if(kind){this.propKind=kind;this.propAnchor=this.worldLocal(kind==='notebook'?-.34:.34,.99,.13);this.propRelease=null;}else this.propRelease=(this.propKind==='notebook'?this.lastPose?.handL:this.lastPose?.handR)?.clone()??null;
  }
  get propPhase(){return !this.propKind?'none':!this.propWanted?'release':this.propAge<.4?'reach':this.propAge<.65?'grasp':'use';}
  practiceCue='';seatDepth=0;""")
s=s.replace('goTo(dest:Vec3,after:AnimState=\'idle\'){this.clearCourtMove();',"goTo(dest:Vec3,after:AnimState='idle'){if(this.state==='sit'){this.changeState('idle',false);this.departureDelay=.65;}this.clearCourtMove();")
s=s.replace("this.changeState(this.path.length?'walk':after,false);}","if(this.departureDelay<=0)this.changeState(this.path.length?'walk':after,false);}")
s=s.replace('    this.acting.update(dt,', '    this.propAge+=dt;this.departureDelay=Math.max(0,this.departureDelay-dt);if(!this.propWanted&&this.propAge>=.65){this.propKind=null;this.propAnchor=null;this.propRelease=null;}\n    this.acting.update(dt,')
s=s.replace('if(this.pathIndex<this.path.length){\n      while', 'if(this.pathIndex<this.path.length&&this.departureDelay<=0){\n      while')
s=s.replace("this.exitWalkPose=(this.state==='walk'||this.state==='jog')&&!MOVING.has(next)?this.pose():null;", "this.exitWalkPose=((this.state==='walk'||this.state==='jog')&&!MOVING.has(next)||this.state==='sit')?this.pose():null;")
s=s.replace("    // Racket constraint: the hand owns the grip.","""    if(this.propKind&&this.propAnchor&&!shot&&!moving&&!shuffle){
      const left=this.propKind==='notebook',target=left?handL:handR,neutral=left?neutralL:neutralR;
      const contact=this.propWanted?(this.propAge<.4?Vec3.lerp(neutral,this.propAnchor,smoothstep(0,.4,this.propAge)):Vec3.lerp(this.propAnchor,target,smoothstep(.4,1,this.propAge))):Vec3.lerp(this.propRelease??target,this.propAnchor,smoothstep(0,.65,this.propAge));
      if(left)handL=contact;else handR=contact;
    }
    // Racket constraint: the hand owns the grip.""")
# Draw the carried prop at its pickup point until the hand arrives, then attach it.
s=s.replace("    if(this.socialProp==='wateringCan'){", "    const propHandR=this.propKind&&this.propWanted&&this.propAge<.4&&this.propAnchor?this.propAnchor:handR,propHandL=this.propKind&&this.propWanted&&this.propAge<.4&&this.propAnchor?this.propAnchor:handL;\n    if(this.propKind==='wateringCan'){")
s=s.replace("const can=Vec3.add(handR,", "const can=Vec3.add(propHandR,")
s=s.replace("if(this.socialProp==='notebook')", "if(this.propKind==='notebook')").replace("position:Vec3.add(handL,new Vec3(0,.035,.08))", "position:Vec3.add(propHandL,new Vec3(0,.035,.08))")
s=s.replace("if(this.socialProp==='ball')", "if(this.propKind==='ball')").replace("position:Vec3.add(handR,new Vec3(0,.08,0))", "position:Vec3.add(propHandR,new Vec3(0,.08,0))")
s=s.replace("this.state==='drink'||this.socialProp==='cup'", "this.state==='drink'||this.propKind==='cup'").replace('const cup=Vec3.add(handR,','const cup=Vec3.add(propHandR,')
s=s.replace("this.state!=='drink'&&!this.socialProp", "this.state!=='drink'&&!this.propKind")
p.write_text(s)
