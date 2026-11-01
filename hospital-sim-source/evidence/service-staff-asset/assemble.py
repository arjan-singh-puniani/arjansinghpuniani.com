"""Curate exported-model renders and freeze only the bounded new service assets."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,datetime,shutil
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[1];DEST=ROOT.parents[1]/'outputs';DEST.mkdir(exist_ok=True)
font=ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',18);sheet=Image.new('RGB',(760,1280),'#f7f8f4');draw=ImageDraw.Draw(sheet)
for i,(role,suffix,caption)in enumerate([('assistant','','Assistant · high / shared Idle'),('facilities','','Facilities · high / shared Idle'),('assistant','-lod','Assistant · LOD / shared Work'),('facilities','-lod','Facilities · LOD / shared Work')]):
    x=(i%2)*380;y=(i//2)*640;draw.text((x+10,y+10),caption,fill='#173d42',font=font)
    sheet.paste(Image.open(OUT/(role+suffix+'.png')).convert('RGB'),(x,y+40))
sheet.save(OUT/'service-staff-contact-sheet.png')
for source,target in [('service-staff-contact-sheet.png','service-staff-contact-sheet.png'),('service-props-preview.png','service-props-preview.png'),('asset-checks.json','service-staff-asset-checks.json'),('roundtrip-checks.json','service-staff-roundtrip-checks.json')]:shutil.copyfile(OUT/source,DEST/target)
freeze={'frozen_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':{}}
for name in ['blender/service_staff.py','blender/service_staff.blend']+[f'dist/assets/staff-{role}{suffix}.glb'for role in ['assistant','facilities']for suffix in ['','-lod']]+['dist/assets/service-props.glb']:
    path=ROOT/name;freeze['files'][name]={'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
(OUT/'frozen-assets.json').write_text(json.dumps(freeze,indent=2)+'\n');shutil.copyfile(OUT/'frozen-assets.json',DEST/'service-staff-frozen-assets.json')
print('SERVICE_STAFF_CURATED',freeze['frozen_utc'])
