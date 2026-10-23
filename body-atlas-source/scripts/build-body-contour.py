"""Blender: shape a neutral atlas exterior using photograph-guided body contours only."""
import argparse, hashlib, json, math, sys
from pathlib import Path
import bpy

args=argparse.ArgumentParser()
args.add_argument('--source',required=True)
args.add_argument('--output',required=True)
a=args.parse_args(sys.argv[sys.argv.index('--')+1:]);out=Path(a.output)
source_sha=hashlib.sha256(Path(a.source).read_bytes()).hexdigest()
assert source_sha=='7260cde916540b160c28bdc552f34706f5de70b1e27a6b6689f9428abf2e64e3', 'Expected the attributed HRA skin mesh'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=a.source)
body=next(o for o in bpy.context.scene.objects if o.type=='MESH');body.name='Body_Contour'
# shortcut: photos guide an artistic contour, not measured dimensions; use calibrated capture for an accurate fit.
for v in body.data.vertices:
 x,y,z=v.co.x,v.co.z,-v.co.y
 if .02<y<.67:
  fade=min(1,(y-.02)/.06,(.67-y)/.07)
  fade=fade*fade*(3-2*fade)
  torso=math.exp(-(abs(x)/.215)**8)
  chest=math.exp(-((y-.51)/.105)**2)
  waist=math.exp(-((y-.23)/.12)**2)
  front=max(0,min(1,(z+.005)/.065))
  shoulder=math.exp(-((abs(x)-.225)/.085)**2-((y-.51)/.10)**2)
  arm=math.exp(-((abs(x)-.31)/.085)**2-((y-.32)/.15)**2)
  next_x=x+fade*(x*torso*(.11*chest-.18*waist)+math.copysign(.012*shoulder+.010*arm,x))
  next_z=z+fade*(torso*front*(.017*chest*math.exp(-((abs(x)-.085)/.09)**2)-.014*waist)+math.copysign(.008*arm,z))
  assert math.isfinite(next_x) and math.isfinite(next_z)
  assert abs(next_x-x)<.05 and abs(next_z-z)<.05
  v.co=(next_x,-next_z,y)
# Localized external mesh edits do not alter the reference internal anatomy.
for v in body.data.vertices:
 x,y,z=v.co.x,v.co.z,-v.co.y
 next_x,next_y,next_z=x,y,z
 if -.135<y<-.025 and abs(x)<.04 and z>.085:
  edge=max(0,min(1,(.04-abs(x))/.018))*max(0,min(1,(z-.085)/.02))
  weight=edge*max(0,min(1,(-.025-y)/.035))
  next_x=x*(1+.18*weight);next_z=z+.012*weight;next_y=y-.025*weight
 if -.135<y<-.075 and abs(x)<.045 and z>.065:
  blend=max(0,min(1,(-.075-y)/.02))*max(0,min(1,(.045-abs(x))/.010))*max(0,min(1,(z-.065)/.015))
  scale=1+.38*blend
  radial_before=math.hypot(next_x,next_z-.107)
  next_x*=scale;next_z=.107+(next_z-.107)*scale
  assert math.isclose(math.hypot(next_x,next_z-.107),radial_before*scale,rel_tol=1e-9,abs_tol=1e-9)
 v.co=(next_x,-next_z,next_y)
# Preserve the neutral reference head and mesh topology; export no photographic appearance.
for attr in list(body.data.color_attributes):body.data.color_attributes.remove(attr)
body.data.materials.clear()
for p in body.data.polygons:p.use_smooth=True
for key in list(body.keys()):del body[key]
bpy.ops.object.select_all(action='DESELECT');body.select_set(True)
out.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',use_selection=True,export_yup=True,export_extras=False,export_cameras=False,export_animations=False,export_copyright='HRA male v1.5 skin derivative, Kristen Browne and Heidi Schlehlein, CC BY 4.0. Artistic body contour only; neutral reference head; not a personal scan.')
raw=out.read_bytes();gltf=json.loads(raw[20:20+int.from_bytes(raw[12:16],'little')])
assert len(gltf['meshes'])==1 and not gltf.get('images') and not gltf.get('textures')
assert all('COLOR_0' not in p['attributes'] for m in gltf['meshes'] for p in m['primitives'])
manifest={'asset':'adapted body contour','source':'HRA male v1.5 skin surface','sourceSha256':source_sha,'license':'CC BY 4.0; HRA geometry attribution retained. No personality rights are granted.','creators':['Kristen Browne','Heidi Schlehlein'],'adaptations':'Photograph-guided shoulder breadth, chest volume, upper-arm contour and waist taper. Neutral reference head retained; external pelvic contour adjusted with a 1.38 glans radial scale and blended attachment. Internal reference anatomy unchanged. Artistic proportions, not measured dimensions.','contourOnly':True,'personalAnatomicalScan':False,'photographsIncluded':False,'texturesIncluded':False,'facialAppearanceIncluded':False,'subjectIdentified':False,'glansRadialScale':1.38,'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'triangles':sum(len(p.vertices)-2 for p in body.data.polygons)}
out.with_name('contour-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('BODY_CONTOUR',json.dumps(manifest))
