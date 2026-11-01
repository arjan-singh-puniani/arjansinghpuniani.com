"""Assemble actual Blender-rendered gown/transfer evidence; Pillow only."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,datetime,shutil,sys
p=Path(__file__).resolve().parent;r=p.parents[2];out=r.parents[1]/'outputs';out.mkdir(exist_ok=True)
try:font=ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',24)
except OSError:font=ImageFont.load_default()
checks=json.loads((p/'checks.json').read_text())
manifest=json.loads((r/'dist/assets/patient-appearances.json').read_text())
for clip in ['TransferIn','TransferOut']:
    frames=[Image.open(p/clip/f'{i:03d}.png').convert('RGB')for i in range(31)]
    frames[0].save(p/(clip+'.gif'),save_all=True,append_images=frames[1:],duration=[100]*30+[600],loop=0,optimize=True)
frames=[]
w,h=Image.open(p/'TransferIn/000.png').size
for i in range(31):
    canvas=Image.new('RGB',(2*w,h+50),'#f7f8f4');d=ImageDraw.Draw(canvas)
    for j,clip in enumerate(['TransferIn','TransferOut']):
        d.text((j*w+15,13),clip+' | actual 3.00s clip',fill='#173d42',font=font)
        canvas.paste(Image.open(p/clip/f'{i:03d}.png').convert('RGB'),(j*w,50))
    frames.append(canvas)
frames[0].save(p/'gown-transfers-v06.gif',save_all=True,append_images=frames[1:],duration=[100]*30+[600],loop=0,optimize=True)
sheet=Image.new('RGB',(1440,810),'#f7f8f4');d=ImageDraw.Draw(sheet)
for j,clip in enumerate(['TransferIn','TransferOut']):
    for k,i in enumerate([0,5,10,15,20,25,30]):
        tile=Image.open(p/clip/f'{i:03d}.png').convert('RGB').resize((205,154))
        x=k*205;y=j*202;sheet.paste(tile,(x,y+40));d.text((x+5,y+10),clip+' '+str(round(i/10,1))+'s',fill='#173d42',font=font)
sheet=sheet.crop((0,0,1440,404));sheet.save(p/'transfer-contact-sheet.png')
if '--transfers-only'not in sys.argv:
    grid=Image.new('RGB',(1380,800),'#f7f8f4');d=ImageDraw.Draw(grid)
    for i,appearance in enumerate(manifest['appearances']):
        x=(i%6)*230;y=(i//6)*400
        grid.paste(Image.open(p/(appearance['id']+'.png')).convert('RGB').resize((230,360)),(x,y+35))
        d.text((x+8,y+8),appearance['id']+' | '+str(appearance['heightMetres'])+'m',fill='#173d42',font=font)
    grid.save(p/'eleven-adult-appearances.png')
files=['gown-transfers-v06.gif','TransferIn.gif','TransferOut.gif','transfer-contact-sheet.png','checks.json']
if '--transfers-only'not in sys.argv:files+=['eleven-adult-appearances.png','gown-rear.png']
for name in files:shutil.copyfile(p/name,out/('gown-checks-v06.json'if name=='checks.json'else name))
frozen_path=p/'frozen-assets.json'
freeze=json.loads(frozen_path.read_text())if frozen_path.exists()else {'frozen_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'root_contract_unchanged':True,'files':{}}
paths=['blender/characters.py','blender/characters.blend','dist/assets/patient-appearances.json']+[f'dist/assets/{kind}{lod}.glb'for kind in ['clinician','coat','patient']+[q['id']for q in manifest['appearances']]for lod in ['','-lod']]
for name in paths:
    q=r/name;actual={'bytes':q.stat().st_size,'sha256':hashlib.sha256(q.read_bytes()).hexdigest()}
    if name in freeze['files']:assert freeze['files'][name]==actual,name
    freeze['files'][name]=actual
(p/'frozen-assets.json').write_text(json.dumps(freeze,indent=2)+'\n');shutil.copyfile(p/'frozen-assets.json',out/'gown-assets-frozen-v06.json')
print('ASSEMBLED',freeze['frozen_utc'],len(freeze['files']),'files')
