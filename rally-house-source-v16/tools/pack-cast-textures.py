"""Pack authored face variants and tennis palettes without changing the verified rig."""
import hashlib, json, sys
from pathlib import Path
import numpy as np
from PIL import Image

source=Path(__file__).with_name('athlete-textures')
output=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parents[1]/'assets/characters/taylor'
body=Image.open(output/'skin.webp').convert('RGB').crop((0,0,2048,1024)).resize((1024,512),Image.Resampling.LANCZOS)
reference=Image.open(source/'head-refined-v2.png').convert('RGB')
def neck(im):
 w,h=im.size
 return np.asarray(im.crop((int(w*.48),int(h*.62),int(w*.52),int(h*.66))),dtype=float).mean(axis=(0,1))
base=neck(reference)
y,x=np.mgrid[1024:2048,0:1024]
height=2.5+((1-y/2048)-.02)/.46*(5.15-2.5)
width=np.abs((x/1024-.5)*4)
palettes={'coach':('#315d4f','#315d4f','#f4e5cb','#f0ecdb'),'mika':('#a7445b','#a7445b','#f4d7bc','#fbefe2'),'nia':('#273b56','#273b56','#e9c4b5','#ce9c9e')}
for identity,(main,side,trim,bottom) in palettes.items():
 face=Image.open(source/(identity+'-face-v2.png')).convert('RGB')
 assert face.width==face.height and face.width>=1024,'Preserve the square face UV layout'
 atlas=Image.new('RGB',(1024,1024))
 calibrated=np.clip(np.asarray(body,dtype=float)*(neck(face)/base),0,255).astype(np.uint8)
 atlas.paste(Image.fromarray(calibrated),(0,0));atlas.paste(face.resize((1024,512),Image.Resampling.LANCZOS),(0,512));atlas.save(output/(identity+'-skin.webp'),'WEBP',quality=94,method=6)
 color=lambda value:tuple(bytes.fromhex(value.lstrip('#')))
 cloth=np.full((1024,1024,3),color(main),dtype=np.uint8);cloth[(width>.95)&(height<3.6)]=color(side);cloth[height>4.95]=color(trim);cloth[:,0:42]=color(main);cloth[(y>1971)&(x<42)]=color(trim)
 kit=Image.open(output/'kit.webp').convert('RGB');kit.paste(Image.fromarray(cloth),(0,1024));kit.save(output/(identity+'-kit.webp'),'WEBP',quality=94,method=6)
 Image.new('RGB',(4,4),color(bottom)).save(output/(identity+'-skirt.webp'),'WEBP',lossless=True)
meta_path=output/'provenance.json';meta=json.loads(meta_path.read_text())
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
for path in output.glob('*.webp'):meta['textures'][path.name]=sha(path)
for path in source.glob('*-face-v2.*'):meta['sourceHashes']['tools/athlete-textures/'+path.name]=sha(path)
for path in [Path(__file__),Path(__file__).with_name('bake-authored-athlete.py')]:meta['authoringScripts'][path.name]=sha(path)
meta['headSource']['castTextureAdaptation']='Three original adult face UV variants authored with built-in imagegen; exact prompts in tools/athlete-textures; packed at 1024 square with neck-calibrated body albedo.'
meta_path.write_text(json.dumps(meta,indent=2)+'\n')
print('Packed three distinct face atlases and tennis palettes; original geometry retained.')
