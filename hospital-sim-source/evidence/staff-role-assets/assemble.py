"""Curate original Blender role renders with Pillow; keep one sheet, not bulk frames."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,datetime,shutil
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[1];DEST=ROOT.parents[1]/'outputs';DEST.mkdir(exist_ok=True)
manifest=json.loads((ROOT/'dist/assets/staff-roles.json').read_text())
font=ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',15)
sheet=Image.new('RGB',(840,734),'#f7f8f4');draw=ImageDraw.Draw(sheet)
normal=Image.new('RGB',(840,220),'#f7f8f4');nd=ImageDraw.Draw(normal)
for i,role in enumerate(manifest['roles']):
    image=Image.open(OUT/('staff-'+role['key']+'.png')).convert('RGB')
    x=(i%4)*210;y=(i//4)*367
    draw.text((x+7,y+8),role['label'],fill='#173d42',font=font)
    sheet.paste(image.resize((210,320)),(x,y+35))
    nd.text((i*120+6,8),role['key'].upper(),fill='#173d42',font=font)
    normal.paste(image.resize((120,183)),(i*120,30))
sheet.save(OUT/'staff-role-contact-sheet.png');normal.save(OUT/'staff-role-normal-scale.png')
for name in ['staff-role-contact-sheet.png','staff-role-normal-scale.png']:
    shutil.copyfile(OUT/name,DEST/name)
freeze={'frozen_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':{}}
paths=['blender/staff_roles.py','blender/staff_roles.blend','dist/assets/staff-roles.json']+[f'dist/assets/{role[key]}'for role in manifest['roles']for key in ['high','lod']]
for name in paths:
    path=ROOT/name;freeze['files'][name]={'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
(OUT/'frozen-assets.json').write_text(json.dumps(freeze,indent=2)+'\n')
for source,target in [('frozen-assets.json','staff-role-frozen-assets.json'),('asset-checks.json','staff-role-asset-checks.json'),('shared-clip-checks.json','staff-role-shared-clip-checks.json')]:
    shutil.copyfile(OUT/source,DEST/target)
print('STAFF_EVIDENCE_CURATED',freeze['frozen_utc'])
