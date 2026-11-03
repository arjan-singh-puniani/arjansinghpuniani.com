"""Rebuild the bounded, attributed historical replay; requires curl, no API key."""
from pathlib import Path
from datetime import datetime,timezone,timedelta
from urllib.parse import urlencode
import subprocess,json,hashlib,time
root=Path(__file__).resolve().parents[2]
bundle=json.loads((root/'public/pit-stop-lab/data/bahrain-2024.json').read_text())
result={'schema':1,'source':'OpenF1','session':9472,'lap':32,'retrievedAt':datetime.now(timezone.utc).isoformat(),'documentation':'https://openf1.org/docs/','alignment':'Each driver starts their own lap at zero. Comparison is lap-aligned, not simultaneous race position.','requests':[],'drivers':[]}
for driver,name,code,color in [(16,'Charles Leclerc','LEC','#ff553e'),(55,'Carlos Sainz','SAI','#63ded0')]:
 lap=next(r for r in bundle['laps'] if r['driver_number']==driver and r['lap_number']==32)
 start=datetime.fromisoformat(lap['date_start']);end=start+timedelta(seconds=lap['lap_duration'])
 row={'number':driver,'name':name,'code':code,'color':color,'lap':lap}
 for endpoint in ['car_data','location']:
  params={'session_key':9472,'driver_number':driver,'date>':start.isoformat(timespec='milliseconds').replace('+00:00','Z'),'date<':end.isoformat(timespec='milliseconds').replace('+00:00','Z')}
  url='https://api.openf1.org/v1/'+endpoint+'?'+urlencode(params,safe='><')
  raw=subprocess.check_output(['curl','--fail','--silent','--show-error','--retry','2','--max-time','90',url])
  records=json.loads(raw);assert isinstance(records,list) and len(records)>200,(endpoint,len(records))
  assert all(r['driver_number']==driver and r['session_key']==9472 for r in records)
  row[endpoint]=records
  result['requests'].append({'url':url,'sha256':hashlib.sha256(raw).hexdigest(),'canonical_sha256':hashlib.sha256(json.dumps(records,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'records':len(records)})
  print(driver,endpoint,len(records));time.sleep(.5)
 result['drivers'].append(row)
out=root/'public/pit-stop-lab/data/telemetry-bahrain-2024.json';out.write_text(json.dumps(result,separators=(',',':'))+'\n');print(out,out.stat().st_size)
