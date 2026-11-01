"""Curate matched original/LOD renders; Pillow only."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,datetime,shutil
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[1];DEST=ROOT.parents[1]/'outputs';DEST.mkdir(exist_ok=True)
checks=json.loads((OUT/'checks.json').read_text());font=ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',18)
sheet=Image.new('RGB',(960,1320),'#f7f8f4');draw=ImageDraw.Draw(sheet)
for row,name in enumerate(['scan','care','consult']):
    c=checks['zones'][name]
    for col,version in enumerate(['original','lod']):
        label=(name.title()+' · original '+format(c['original_triangles'],',')+' triangles')if col==0 else(name.title()+' · LOD '+format(c['lod_triangles'],',')+' (−'+format(c['reduction_percent'],'.1f')+'%)')
        draw.text((col*480+10,row*440+10),label,fill='#173d42',font=font);sheet.paste(Image.open(OUT/(name+'-'+version+'.png')).convert('RGB'),(col*480,row*440+40))
sheet.save(OUT/'equipment-lod-comparison.png');shutil.copyfile(OUT/'equipment-lod-comparison.png',DEST/'equipment-lod-comparison.png')
freeze={'frozen_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':{}}
for name in ['blender/equipment_lod.py','blender/equipment_lod.blend']+['dist/assets/'+n+'-lod.glb'for n in ['scan','care','consult']]:
    p=ROOT/name;freeze['files'][name]={'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
(OUT/'frozen-assets.json').write_text(json.dumps(freeze,indent=2)+'\n')
for source,target in [('checks.json','equipment-lod-checks.json'),('roundtrip-checks.json','equipment-lod-roundtrip-checks.json'),('frozen-assets.json','equipment-lod-frozen-assets.json')]:shutil.copyfile(OUT/source,DEST/target)
print('EQUIPMENT_LOD_CURATED',freeze['frozen_utc'])
