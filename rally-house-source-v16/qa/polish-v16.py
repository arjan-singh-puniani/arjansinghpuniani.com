from pathlib import Path
p=Path('src/entities/Character.ts');s=p.read_text().replace("const phase=time*(this.spec.id==='mika'", "const phase=time*this.acting.values.idleFidgetRate*(this.spec.id==='mika'");p.write_text(s)
p=Path('src/Game.ts');s=p.read_text();s="import {deriveActing} from './animation/ActingState.js';\n"+s
s=s.replace('const gap=bond&&bond.warmth>=40?.60:.72;',"const gap=deriveActing(this.mind.states[scene.people[0]],bond??undefined,scene.people[0]).personalDistance/2;")
s=s.replace("for(const id of witnesses){const c=this.actor(id);c.react", "for(const id of witnesses){const c=this.actor(id);if(!this.activities.busy(id)&&c.pathIndex<c.path.length){this.routineNotices.set(id,{target:c.path[c.path.length-1].clone(),after:'watch',activity:c.activity,remaining:.6});c.path=[];c.setAnimation('watch');}c.react")
s=s.replace('const elapsed=this.mindTimer;this.mindTimer=0;', 'const aiStart=performance.now(),elapsed=this.mindTimer;this.mindTimer=0;')
s=s.replace('      this.quietLife();','      this.quietLife();this.aiMs=(this.aiMs??0)*.9+(performance.now()-aiStart)*.1;')
p.write_text(s)
p=Path('tests/presence-integration.mjs');s=p.read_text().replace("const partial=simulation();partial.beginLesson", "const partial=simulation();partial.socialSimulation={serialize:()=>({})};partial.beginLesson");p.write_text(s)
# Bounded ephemeral event-specific scene counters; permanent authored ritual counts remain.
p=Path('src/simulation/EverydayLife.ts');s=p.read_text();print('tick signature', [l for l in s.splitlines() if 'tick(' in l]);p.write_text(s)
# HUD panels receive focus on keyboard open and restore their opener. Nonmodal panels keep the game available.
p=Path('src/ui/HUD.ts');s=p.read_text().replace('  constructor(){','  private opener:HTMLElement|null=null;\n  private focusPanel(panel:HTMLElement){if(!panel.contains(document.activeElement))this.opener=document.activeElement as HTMLElement;requestAnimationFrame(()=>panel.querySelector<HTMLButtonElement>(\'button\')?.focus());}\n  constructor(){')
s=s.replace("this.context.classList.add('open');}","this.context.classList.add('open');this.focusPanel(this.context);}")
s=s.replace("closeContext(){this.context.classList.remove('open')}","closeContext(){const had=this.context.contains(document.activeElement);this.context.classList.remove('open');if(had)this.opener?.focus();}")
s=s.replace("this.book.classList.add('open');this.renderBook();}","this.book.classList.add('open');this.renderBook();this.focusPanel(this.book);}")
s=s.replace("closeBook(){this.book.classList.remove('open')}","closeBook(){const had=this.book.contains(document.activeElement);this.book.classList.remove('open');if(had)this.opener?.focus();}")
p.write_text(s)
p=Path('index.html');s=p.read_text().replace('id="context" aria-live="polite"','id="context" role="dialog" aria-labelledby="contextTitle"').replace('id="book" aria-label="Club book"','id="book" role="dialog" aria-label="Club book"');p.write_text(s)
p=Path('style.css');s=p.read_text()+'''\n/* v16: readable captions and explicit keyboard focus, without numeric mind UI. */\n:root{--muted:#52685d}.speech{max-width:min(290px,calc(100vw - 28px))}.speech strong{font-size:13px}.speech span{font-size:13px;line-height:1.45}.memory span{font-size:13px}.personCard em{font-size:12px}.context h2{padding-right:30px}.hint{white-space:normal;text-align:center}.context,.book{overscroll-behavior:contain}\n''';p.write_text(s)
