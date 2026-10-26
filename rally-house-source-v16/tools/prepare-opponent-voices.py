"""Prepare the requested short Homer reaction from decoded PCM; see assets/audio/CREDITS.md."""
import argparse,array,hashlib,json,wave
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('recording',type=Path);p.add_argument('output',type=Path);args=p.parse_args();args.output.mkdir(parents=True,exist_ok=True)
with wave.open(str(args.recording)) as w:
 assert w.getsampwidth()==2;rate=w.getframerate();channels=w.getnchannels();data=array.array('h',w.readframes(w.getnframes()))
start,end=0,len(data)/channels/rate
mono=[sum(data[i*channels:(i+1)*channels])/channels/32768 for i in range(len(data)//channels)]
gain=min(1,.8/max(.00001,max(map(abs,mono))))
out=array.array('h',(round(n*gain*min(1,i/(rate*.003),(len(mono)-1-i)/(rate*.008))*32767) for i,n in enumerate(mono)))
target=args.output/'opponent-doh.wav'
with wave.open(str(target),'wb') as w:w.setparams((1,2,rate,0,'NONE','not compressed'));w.writeframes(out.tobytes())
row={'file':target.name,'performer':'Homer Simpson / Dan Castellaneta, as identified by the TV archive','source':'https://www.wavsource.com/tv/simpsons/homer1.htm','sourceAudio':'https://www.wavsource.com/snds_2020-10-01_3728627494378403/tv/simpsons/homer/doh1_y.wav','license':'Copyrighted third-party excerpt; redistribution permission not verified','sourcePcmSha256':hashlib.sha256(args.recording.read_bytes()).hexdigest(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'excerptSeconds':[start,end],'processing':'Complete user-approved TV take A; mono PCM, peak headroom and 3 ms attack / 8 ms release fades only; original pitch, timing and sample rate'}
(args.output/'provenance.json').write_text(json.dumps([row],indent=2)+'\n')
