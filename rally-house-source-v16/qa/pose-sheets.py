from pathlib import Path
from PIL import Image, ImageDraw
import sys
root=Path(sys.argv[1]);states=sorted({p.stem.rsplit('-',1)[0] for p in root.glob('*.png') if not p.stem.startswith('sheet-')})
for state in states:
 files=sorted(root.glob(state+'-*.png'))
 if len(files)<20:continue
 out=Image.new('RGB',(1000,1120),'#f4eee3');d=ImageDraw.Draw(out)
 for i,p in enumerate(files[:20]):
  im=Image.open(p).convert('RGB');im.thumbnail((200,250));x=i%5*200;y=i//5*280;out.paste(im,(x,y+25));d.text((x+5,y+5),state+' '+str(i),fill='#243831')
 out.save(root/('sheet-'+state+'.jpg'))
