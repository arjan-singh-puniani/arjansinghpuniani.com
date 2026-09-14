from pathlib import Path
import json,statistics,math
root=Path(__file__).resolve().parent
sources={'baseline':root/'baseline-reference/v16-baseline-watch/watch.json','release':root/'v16-release-soak/watch.json'}
def stats(values):
 values=sorted(v for v in values if isinstance(v,(int,float)))
 return {'median':statistics.median(values),'p95':values[max(0,math.ceil(len(values)*.95)-1)],'max':max(values),'firstThirdMedian':statistics.median(values[:max(1,len(values)//3)])} if values else None
# Temporal medians must use chronological thirds, unlike quantile sorting.
def summarize(values):
 out=stats(values)
 if out:
  n=max(1,len(values)//3);out['firstThirdMedian']=statistics.median(values[:n]);out['lastThirdMedian']=statistics.median(values[-n:])
 return out
out={'measurement':'10-second samples of smoothed internal CPU measurements; concurrent QA load; not GPU frame time or physical-device FPS. Heap is the browser-reported coarse bucket, not a leak proof.','runs':{}}
for name,path in sources.items():
 data=json.loads(path.read_text());rows=data['rows'];r={'samples':len(rows),'lastSampleSeconds':rows[-1]['seconds'],'errors':data['errors']}
 for key in ['simMs','renderMs','drawCalls','triangles','memoryMB']:r[key]=summarize([row['perf'][key] for row in rows])
 for key in ['aiMs','renderItems']:r[key]=summarize([row['report']['presence'][key] for row in rows if 'presence' in row['report']])
 r['completed']=rows[-1]['report']['completed'];r['interrupted']=rows[-1]['report'].get('interrupted');out['runs'][name]=r
(root/'v16-performance.json').write_text(json.dumps(out,indent=2))
print(json.dumps(out,indent=2))
