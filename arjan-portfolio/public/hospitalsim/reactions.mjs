// Original character writing. Presentation only: never consumes simulation randomness.
const staff={
 Mira:{lift:['I prefer the stairs.','A higher level of consultation, apparently.','I had only just found my pen.'],land:['Right. One clear plan at a time.','Excellent. A floor I can work with.','My pen has requested a window seat.'],cancel:['Same spot. New perspective.','We can call that a very short break.']},
 Jules:{lift:['Please keep all shoes inside the ride.','Motion artifact: me.','I usually ask the scanner to do this.'],land:['Motion artifact resolved.','Stillness. My old friend.','The scanner would like its job back.'],cancel:['A very short calibration.','Same coordinates. Slightly more altitude.']},
 Remy:{lift:['This is not what I meant by elevation.','My trolley has a parking space. Do I?','I would like to speak to gravity.'],land:['My dignity needs a minute.','Back to a level surface. Excellent.','The trolley saw nothing.'],cancel:['A brief disagreement with gravity.','Let us agree that was a rehearsal.']},
 Ash:{lift:['Mind the pockets. I packed for everyone.','Both shoes, please. I need the set.','An unusual team-building exercise.'],land:['Everyone landed? Good.','Pockets checked. Carrying on.','A soft landing. We like those.'],cancel:['Same place. Both shoes. Good.','All present and accounted for.']},
 Sage:{lift:['Oh. A loftier perspective.','I was going to suggest a short walk.','This is one way to rise above paperwork.'],land:['Right. Where were we?','A little breathing room. And a floor.','My questions are back at eye level.'],cancel:['A scenic route to the same spot.','A fresh perspective, briefly.']},
 Kit:{lift:['I would like to request stairs.','Is there a form for this?','I understood the handoff differently.'],land:['Handoff complete. Literally.','Feet first. Paperwork second.','I will file that under transport.'],cancel:['Return to sender. Carefully.','A remarkably local transfer.']},
 Quinn:{lift:['Reception is now departures.','You will need a ticket for this queue.','The desk was not briefed on this.'],land:['Welcome back to the ground floor.','Next, please. Preferably on foot.','Your landing has been processed.'],cancel:['Returned to the correct department.','Same desk. Unexpected excursion.']},
 Tess:{lift:['These are not calibrated wings.','This was not on the measuring tape.','Altitude noted. Method questioned.'],land:['Both shoes accounted for.','Measurement complete: floor.','A reproducible landing. Lovely.'],cancel:['Back to the control position.','The floor remains where I left it.']},
 Ellis:{lift:['I did not budget for altitude.','The floor and I had an arrangement.','This is outside the mop warranty.'],land:['The floor and I had an arrangement.','Good floor. Very dependable.','I will put that on the maintenance log.'],cancel:['Back on speaking terms with the floor.','The mop has agreed to say nothing.']}
};
const roleVoice={doctor:'Mira',imaging:'Jules',surgeon:'Remy',nurse:'Ash',np:'Sage',pa:'Kit',reception:'Quinn',assistant:'Tess',facilities:'Ellis'};
const patients={
 welcome:{lift:['This corridor is not on my map.','Have we taken a vertical shortcut?','I should have asked for a bigger map.'],land:['Ground floor. I have labeled it.','That route needs a dotted line.','Good. My map and I agree again.'],cancel:['Same tile. Updated map.','A round trip, technically.']},
 binder:{lift:['My binder did not approve this.','The appendix is getting ideas.','Is this covered in the index?'],land:['Back to page one.','I will add a tab for that.','The binder prefers level surfaces.'],cancel:['Filed under brief excursions.','Same page, thankfully.']},
 fitness:{lift:['Does this count as a flight of stairs?','My step counter is very confused.','I was promised a proper sit-down.'],land:['My step counter is disappointed.','Both feet. Zero extra steps.','I am calling that a lift, not a walk.'],cancel:['No steps were counted. I checked.','A very short sightseeing trip.']},
 questions:{lift:['Is this the shortcut?','One small question about the ceiling.','Do I need a boarding pass?'],land:['Lovely. A familiar sort of floor.','I have one additional question now.','Could we put that route on a sign?'],cancel:['A quick round trip. Thank you.','I am adding that to my question list.']}
};

export function characterReaction(person,kind,cue,history,now){
 if(!person||!['staff','patient'].includes(kind)||!['lift','land','cancel'].includes(cue)||!Number.isFinite(now))return null;
 const voice=kind==='staff'?(Object.hasOwn(staff,person.name)?staff[person.name]:staff[roleVoice[person.role]]||staff.Sage):(Object.hasOwn(patients,person.caseId)?patients[person.caseId]:patients.questions);
 const key=kind+':'+person.id+':'+cue,previous=history.get(key);
 if(previous&&now-previous.at<1500)return null;
 const count=previous?.count||0,line=voice[cue][count%voice[cue].length];history.set(key,{at:now,count:count+1});
 if(history.size>128)history.delete(history.keys().next().value);
 return {name:person.name,line};
}

// Short original lines at real interaction beats; no inferred clinical outcome.
export function clinicCue(s){
 if(!s.clinic||s.clinic.gpVisits>3)return null;
 const goodbye=s.patients.find(p=>p.state==='dressing-out'&&p.progress>=1);
 if(goodbye)return{kind:'patient',id:goodbye.id,name:goodbye.name,line:['A plan that fits in my pocket. Perfect.','Right. Home before the cat notices.','Thank you. I know the next step.'][goodbye.id%3]};
 const p=s.patients.find(p=>p.state==='service'&&['gp','intake'].includes(p.stage)&&p.progress<3&&!p.teamWaiting);
 if(!p)return null;
 const room=s.rooms.find(r=>r.id===p.room),staff=s.staff.find(st=>room?.staff.includes(st.id));
 if(!staff)return null;
 if(p.stage==='intake')return p.progress<2?{kind:'staff',id:staff.id,name:staff.name,line:p.name+'? You’re next.'}:null;
 if(p.progress<2)return{kind:'staff',id:staff.id,name:staff.name,line:'What would help today?'};
 return{kind:'patient',id:p.id,name:p.name,line:p.caseId==='welcome'?'One clear plan. One sheet of paper.':p.goal?.includes('cat')?'Getting home before the cat judges me.':'A little time for my questions.'};
}
