# Bake the MIT Rocketbox head into the existing rig and five-channel expression contract.
import bpy,json,math,sys
from pathlib import Path
from mathutils import Vector
bpy.ops.wm.read_factory_settings(use_empty=True)
source,output=map(Path,sys.argv[sys.argv.index('--')+1:]);data=json.loads(source.read_text());root=Path(data['source']);bpy.ops.import_scene.fbx(filepath=str(root/'Female_Adult_01_facial.fbx'))
o=next(o for o in bpy.data.objects if o.type=='MESH');arm=next(o for o in bpy.data.objects if o.type=='ARMATURE');arm.data.pose_position='REST';o.animation_data_clear();arm.animation_data_clear();keys=o.data.shape_keys.key_blocks
for k in keys:k.value=0
axis=lambda p:Vector((p.x,p.z,-p.y))
eyes=[axis(arm.matrix_world@arm.data.bones['Bip01 '+side+'Eye'].head_local) for side in ['L','R']];center=(eyes[0]+eyes[1])*.5;target=[Vector(v) for v in data['eyes']];scale=(target[0]-target[1]).length/(eyes[0]-eyes[1]).length;origin=(target[0]+target[1])*.5
assert .1<scale<10
point=lambda p:(axis(o.matrix_world@p)-center)*scale+origin
# Taper the lower face in every authored key; eye registration and mouth closure stay shared.
face_vertices={v for poly in o.data.polygons if poly.material_index==1 for v in poly.vertices}
eye_groups={g.index for g in o.vertex_groups if g.name in ('Bip01 LEye','Bip01 REye')}
face_vertices={v for v in face_vertices if sum(g.weight for g in o.data.vertices[v].groups if g.group in eye_groups)<.8}
inverse=o.matrix_world.inverted()
for key in keys:
 for v in face_vertices:
  co=key.data[v].co;world=point(co);dy=world.y-origin.y
  world.x*=1-.10*math.exp(-((dy+.145)/.075)**2)
  # Apply the same continuous sculpt to oral surfaces and all expressions.
  source_axis=(world-origin)/scale+center;key.data[v].co=inverse@Vector((source_axis.x,-source_axis.z,source_axis.y))
normal_matrix=o.matrix_world.to_3x3().inverted().transposed()
channels=[{'AK_44_MouthSmileLeft':.8,'AK_45_MouthSmileRight':.8},{'AK_25_JawOpen':.8},{'AK_09_EyeBlinkLeft':1,'AK_10_EyeBlinkRight':1},{'AK_03_BrowInnerUp':.35,'AK_04_BrowOuterUpLeft':.65,'AK_05_BrowOuterUpRight':.65}]
frames=[]
for values in [{},*channels]:
 for k in keys:k.value=values.get(k.name,0)
 bpy.context.view_layer.update();evaluated=o.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=evaluated.to_mesh();mesh.calc_loop_triangles();mesh.calc_normals_split();frames.append({'p':[list(point(v.co)) for v in mesh.vertices],'n':[list(axis(normal_matrix@loop.normal).normalized()) for loop in mesh.loops]});evaluated.to_mesh_clear()
for k in keys:k.value=0
o.data.calc_loop_triangles();repairs=0
# Four source mouth corners have zero normals; derive only those from valid triangle geometry.
for frame in frames:
 for tri in o.data.loop_triangles:
  if all(Vector(frame['n'][i]).length>.5 for i in tri.loops):continue
  a,b,c=[Vector(frame['p'][v]) for v in tri.vertices];normal=(b-a).cross(c-a);assert normal.length>1e-10,'Degenerate source face';normal.normalize();reference=next((Vector(frame['n'][i]) for i in tri.loops if Vector(frame['n'][i]).length>.5),normal)
  if normal.dot(reference)<0:normal=-normal
  for i in tri.loops:
   if Vector(frame['n'][i]).length<.5:frame['n'][i]=list(normal);repairs+=1
parts=[]
eye_groups={g.index for g in o.vertex_groups if g.name in ('Bip01 LEye','Bip01 REye')}
for material,kind in [(1,'face'),(1,'eyes'),(2,'hair')]:
 p=[];n=[];uv=[];m=[[] for _ in range(5)];mn=[[] for _ in range(5)]
 for tri in o.data.loop_triangles:
  if tri.material_index!=material:continue
  eye=all(sum(g.weight for g in o.data.vertices[v].groups if g.group in eye_groups)>.8 for v in tri.vertices)
  if material==1 and eye!=(kind=='eyes'):continue
  if material==2 and max(frames[0]['p'][i][1] for i in tri.vertices)<1.45:continue
  # Preserve source winding: oral surface normals do not reliably identify the front face.
  loops=list(tri.loops);a,b,c=[Vector(frames[0]['p'][v]) for v in tri.vertices]
  sign=-1 if (b-a).cross(c-a).dot(sum((Vector(frames[0]['n'][i]) for i in loops),Vector()))<0 else 1
  for loop in loops:
   v=o.data.loops[loop].vertex_index;p.extend(frames[0]['p'][v]);n.extend(x*sign for x in frames[0]['n'][loop]);coord=o.data.uv_layers.active.data[loop].uv;uv.extend((coord.x,1-coord.y))
   for channel in range(5):
    m[channel].extend([frames[channel+1]['p'][v][a]-frames[0]['p'][v][a] for a in range(3)] if channel<4 else [0,0,0]);mn[channel].extend([sign*(frames[channel+1]['n'][loop][a]-frames[0]['n'][loop][a]) for a in range(3)] if channel<4 else [0,0,0])
 assert p and all(math.isfinite(x) for a in [p,n,uv,*m,*mn] for x in a)
 parts.append({'kind':kind,'p':p,'n':n,'uv':uv,'morphs':m,'morphNormals':mn})
output.write_text(json.dumps({'parts':parts,'channels':channels,'normalRepairs':repairs,'sourceEyes':[list(p) for p in eyes],'scale':scale}));print('Authored head:',[(p['kind'],len(p['p'])//9) for p in parts],scale)
