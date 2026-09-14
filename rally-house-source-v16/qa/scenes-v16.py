from pathlib import Path
p=Path('src/simulation/SceneGrammar.ts');s=p.read_text();marker="   for(const actor of e.pending){";add="""   if(e.kind==='match'){
    const host=e.witnesses.find(id=>['coach','nia'].includes(id)&&e.pending.includes(id));
    if(host&&c.relationship('mika','leo').familiarity>=20)out.push(make(`three-${e.id}-${host}`,`${N[host]} leaves room for both sides`,[host,'mika','leo'],'cafeTable','company',[
     line(host,host==='coach'?'I watched that game. One useful thing each.':'I saw the finish. There is room here for both of you.','offer'),
     line('mika',e.winner==='mika'?'I stayed with it, even when I wanted to rush.':'I know which part I want to try again.','think'),
     line('leo',e.winner==='leo'?'She made me earn the last one.':'I have a very impressive list of things to try.','shrug'),
     line(host,host==='coach'?'Good. Keep one. You can leave the list here.':'The list can wait for the tea.','nod')
    ],`${N[host]}, Lucresia and Leo made room for both perspectives after the game.`,{eventId:e.id,family:'three-person-reflection',motif:'both-sides',minInterval:420}));
   }
""";s=s.replace(marker,add+marker);p.write_text(s)
p=Path('src/Game.ts');s=p.read_text();s=s.replace("if(ids.length===2)this.relations.interactBetween(ids[0],ids[1],motiveFor(run.scene)==='advice'?'coach':'listen',this.clock.day,text);", "for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)this.relations.interactBetween(ids[i],ids[j],motiveFor(run.scene)==='advice'?'coach':'listen',this.clock.day,text);if(run.scene.id==='bench-room'){this.mind.states.leo.tone=Math.max(0,this.mind.states.leo.tone-.06);const bond=this.relations.getBetween('mika','leo');bond.warmth=Math.max(0,bond.warmth-2);}if(run.scene.id==='bench-reconnect')this.mind.states.leo.tone=Math.min(1,this.mind.states.leo.tone+.06);")
p.write_text(s)
p=Path('src/simulation/EverydayLife.ts');s=p.read_text().replace("id:'bench-room',title", "id:'bench-room',followup:'bench-reconnect',title")
s=s.replace("    if(this.pending.includes('cold-tea'))", """    if(this.pending.includes('bench-reconnect'))scenes.push({id:'bench-reconnect',title:'The tactical thoughts can share',people:['leo','mika'],place:'courtBench',beats:[beat(4,'leo','I left room for your tactical thoughts this time.','offer'),beat(4,'mika','They are very compact.','nod'),beat(4,'leo','Mine are learning.','shrug'),{seconds:5,poses:{leo:'watch',mika:'watch'},gestures:{mika:'laugh'}}],memory:'Leo made room before Lucresia had to ask. They let the joke do the apologizing.'});
    if(this.pending.includes('cold-tea'))""")
s=s.replace('  tick(dt:number){if(Number.isFinite(dt)&&dt>0)this.time+=dt;}',"  private retentionAt=0;\n  tick(dt:number){if(Number.isFinite(dt)&&dt>0)this.time+=dt;if(this.time>=this.retentionAt){this.retentionAt=this.time+60;for(const [key,until] of Object.entries(this.cooldowns))if(until<this.time&&/^(after-|witness-|try-cue-|find-|three-)/.test(key)){delete this.cooldowns[key];delete this.counts[key];}}}")
p.write_text(s)
