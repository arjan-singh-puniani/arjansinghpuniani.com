"""Prepare CC0 source recordings for short point reactions; see assets/audio/CREDITS.md."""
import argparse,array,hashlib,json,math,wave
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('recordings',type=Path);p.add_argument('output',type=Path);args=p.parse_args();args.output.mkdir(parents=True,exist_ok=True)
rows=[]
for voice,source,start,end,author,url in [
 ('masculine','rh-voice-457964.wav',0,1.22,'Fabrizio84','https://freesound.org/people/Fabrizio84/sounds/457964/'),
 ('feminine','rh-voice-332125.wav',.30,.54,'pyro13djt','https://freesound.org/people/pyro13djt/sounds/332125/')]:
 raw=args.recordings/source
 with wave.open(str(raw)) as w:
  assert w.getsampwidth()==2;rate=w.getframerate();channels=w.getnchannels();data=array.array('h',w.readframes(w.getnframes()))
 mono=[sum(data[i*channels:(i+1)*channels])/channels/32768 for i in range(int(start*rate),int(end*rate))]
 rms=math.sqrt(sum(n*n for n in mono)/len(mono));gain=min(.18/max(rms,.00001),.8/max(map(abs,mono)))
 out=array.array('h',(round(n*gain*min(1,i/(rate*.003),(len(mono)-1-i)/(rate*.008))*32767) for i,n in enumerate(mono)))
 target=args.output/('opponent-error-'+voice+'.wav')
 with wave.open(str(target),'wb') as w:w.setparams((1,2,rate,0,'NONE','not compressed'));w.writeframes(out.tobytes())
 rows.append({'file':target.name,'author':author,'source':url,'license':'CC0-1.0','licenseUrl':'https://creativecommons.org/publicdomain/zero/1.0/','sourcePcmSha256':hashlib.sha256(raw.read_bytes()).hexdigest(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'excerptSeconds':[start,end],'processing':'Mono, RMS/peak-limited gain and short edge fades; original performance, no voice cloning'})
(args.output/'provenance.json').write_text(json.dumps(rows,indent=2)+'\n')
