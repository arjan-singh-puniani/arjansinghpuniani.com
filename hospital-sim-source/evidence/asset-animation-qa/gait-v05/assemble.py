"""Assemble matched original Blender QA frames; requires Pillow."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,datetime,shutil
p=Path(__file__).resolve().parent;r=p.parents[2];out=r.parents[1]/'outputs';out.mkdir(exist_ok=True)
try:font=ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',24)
except OSError:font=ImageFont.load_default()
frames=[]
for i in range(27):
    canvas=Image.new('RGB',(1120,690),'#f7f8f4');draw=ImageDraw.Draw(canvas)
    draw.text((20,12),'Before: delayed arms / crouched stance',fill='#173d42',font=font)
    draw.text((580,12),'After: opposite arms / higher midstance',fill='#173d42',font=font)
    for j,tag in enumerate(['before','after']):canvas.paste(Image.open(p/tag/f'{i:03d}.png').convert('RGB'),(j*560,50))
    frames.append(canvas)
frames[0].save(p/'gait-before-after.gif',save_all=True,append_images=frames[1:],duration=[30 if i%3 else 40 for i in range(27)],loop=0,optimize=True)
frames[7].save(p/'gait-before-after-passing.png');frames[0].save(p/'gait-before-after-strike.png')
sheet=Image.new('RGB',(1120,706),'#f7f8f4');d=ImageDraw.Draw(sheet)
for j,tag in enumerate(['before','after']):
    d.text((10,j*353+5),tag.title(),fill='#173d42',font=font)
    for k,i in enumerate([0,7,14,20]):sheet.paste(Image.open(p/tag/f'{i:03d}.png').convert('RGB').resize((280,320)),(280*k,j*353+33))
sheet.save(p/'gait-contact-sheet.png')
for name in ['gait-before-after.gif','gait-before-after-passing.png','gait-before-after-strike.png','gait-contact-sheet.png']:shutil.copyfile(p/name,out/name)
b=json.loads((p/'before-samples.json').read_text());a=json.loads((p/'after-samples.json').read_text())
changed=[n for n,h in b['action_hashes'].items() if a['action_hashes'].get(n)!=h]
assert len(changed)==3 and all(n.startswith('Walk__')for n in changed)
summary={'frozen_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'changed_actions':changed,'unchanged_actions':24,'cycle_seconds':.9,'root_speed_m_s':1.65,'before_hip_range_m':b['hip_height_range'],'after_hip_range_m':a['hip_height_range'],'before_midstance_knee_degrees':b['samples'][27]['legs']['L']['knee_flex_degrees'],'after_midstance_knee_degrees':a['samples'][27]['legs']['L']['knee_flex_degrees'],'max_contact_drift_m':a['max_contact_error_m'],'min_sole_height_m':a['min_sole_m'],'limitations':['Procedural gait, not motion-captured or biomechanically validated.','Brisk universal stride at1.65m/s; no character-specific gait.','Visible improvement is bounded to arm phase and stance posture, not a claim of reference equivalence.'],'files':{}}
for name in ['blender/characters.py','blender/characters.blend']+[f'dist/assets/{kind}{lod}.glb'for kind in ['clinician','coat','patient']for lod in ['','-lod']]:
    q=r/name;summary['files'][name]={'bytes':q.stat().st_size,'sha256':hashlib.sha256(q.read_bytes()).hexdigest()}
(p/'final-checks-and-hashes.json').write_text(json.dumps(summary,indent=2)+'\n');shutil.copyfile(p/'final-checks-and-hashes.json',out/'gait-final-checks-and-hashes.json')
print(json.dumps(summary,indent=2))
