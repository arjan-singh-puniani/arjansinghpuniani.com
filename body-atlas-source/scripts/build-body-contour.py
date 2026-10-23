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
# A local, closed surface replaces the stretched scan contour; reference organs are untouched.
shaft_radius=.0185;glans_radius=shaft_radius*1.38
profile=[(0,.023),(.018,.019),(.035,shaft_radius),(.065,shaft_radius),(.080,.0175),(.085,.0175),(.091,.024),(.098,glans_radius)]
def radius_at(d):
 if d>=.098:return glans_radius*math.sqrt(max(0,1-((d-.098)/.030)**2))
 for (a,ra),(b,rb) in zip(profile,profile[1:]):
  if a<=d<=b:
   t=(d-a)/(b-a);t=t*t*(3-2*t)
   return ra+(rb-ra)*t
 raise AssertionError('Profile outside its bounds')
segments=64;distances=sorted(set([i*.002 for i in range(64)]+[d for d,_ in profile]))
verts=[];faces=[]
for d in distances:
 r=radius_at(d);blend=min(1,d/.025);blend=blend*blend*(3-2*blend)
 center_z=.087+(.102+.008*min(1,d/.098)-.087)*blend
 for i in range(segments):
  theta=2*math.pi*i/segments
  verts.append((.004+r*math.cos(theta),-(center_z+r*math.sin(theta)),-.020-d))
for j in range(len(distances)-1):
 for i in range(segments):
  n=j*segments+i;m=j*segments+(i+1)%segments
  faces.append((n,m,m+segments,n+segments))
# End caps keep Boolean union closed; the distal pole rounds off the glans.
base=len(verts);verts.append((.004,-.087,-.020))
tip=len(verts);verts.append((.004,-.110,-.148))
for i in range(segments):
 faces.append((base,(i+1)%segments,i))
 n=(len(distances)-1)*segments+i;m=(len(distances)-1)*segments+(i+1)%segments
 faces.append((n,m,tip))
mesh=bpy.data.meshes.new('Smooth external contour');mesh.from_pydata(verts,[],faces);mesh.update()
import bmesh
bm=bmesh.new();bm.from_mesh(mesh);assert all(e.is_manifold for e in bm.edges), 'External surface must be closed';bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
part=bpy.data.objects.new('External contour tool',mesh);bpy.context.collection.objects.link(part)
bpy.context.view_layer.objects.active=body
union=body.modifiers.new('Local smooth external contour','BOOLEAN');union.operation='UNION';union.solver='EXACT';union.object=part
bpy.ops.object.modifier_apply(modifier=union.name);bpy.data.objects.remove(part,do_unlink=True)
assert all(math.isfinite(value) for v in body.data.vertices for value in v.co)
assert math.isclose(glans_radius/shaft_radius,1.38)
# Preserve the neutral reference head; export no photographic appearance.
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
manifest={'asset':'adapted body contour','source':'HRA male v1.5 skin surface','sourceSha256':source_sha,'license':'CC BY 4.0; HRA geometry attribution retained. No personality rights are granted.','creators':['Kristen Browne','Heidi Schlehlein'],'adaptations':'Photograph-guided shoulder breadth, chest volume, upper-arm contour and waist taper. Neutral reference head retained; local external contour rebuilt with a smooth shaft, rounded glans and blended root. Internal reference anatomy unchanged. Artistic proportions, not measured dimensions.','contourOnly':True,'personalAnatomicalScan':False,'photographsIncluded':False,'texturesIncluded':False,'facialAppearanceIncluded':False,'subjectIdentified':False,'glansToShaftRadiusRatio':1.38,'externalContourMethod':'closed parametric surface with local Boolean union','sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'triangles':sum(len(p.vertices)-2 for p in body.data.polygons)}
out.with_name('contour-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('BODY_CONTOUR',json.dumps(manifest))
