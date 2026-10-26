"""Prepare the requested short Homer reaction from decoded PCM; see assets/audio/CREDITS.md."""
import argparse,array,hashlib,json,math,wave
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('recording',type=Path);p.add_argument('output',type=Path);args=p.parse_args();args.output.mkdir(parents=True,exist_ok=True)
start,end=.285,1.28
with wave.open(str(args.recording)) as w:
 assert w.getsampwidth()==2;rate=w.getframerate();channels=w.getnchannels();data=array.array('h',w.readframes(w.getnframes()))
mono=[sum(data[i*channels:(i+1)*channels])/channels/32768 for i in range(int(start*rate),int(end*rate))]
rms=math.sqrt(sum(n*n for n in mono)/len(mono));gain=min(.18/max(rms,.00001),.8/max(map(abs,mono)))
out=array.array('h',(round(n*gain*min(1,i/(rate*.003),(len(mono)-1-i)/(rate*.008))*32767) for i,n in enumerate(mono)))
target=args.output/'opponent-doh.wav'
with wave.open(str(target),'wb') as w:w.setparams((1,2,rate,0,'NONE','not compressed'));w.writeframes(out.tobytes())
row={'file':target.name,'performer':'Homer Simpson / Dan Castellaneta, as identified by the source soundboard','source':'https://www.101soundboards.com/sounds/3826164-doh','sourceAudio':'https://hoovers.101soundboards.com/sb/board_sounds_rendered/bjonnrx.mp3','license':'Copyrighted third-party excerpt; redistribution permission not verified','sourcePcmSha256':hashlib.sha256(args.recording.read_bytes()).hexdigest(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'excerptSeconds':[start,end],'processing':'Complete utterance after leading silence; mono PCM, restrained RMS/peak gain, 3 ms attack and 8 ms release fades; no pitch shift or reverb'}
(args.output/'provenance.json').write_text(json.dumps([row],indent=2)+'\n')
