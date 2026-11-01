"""Read-only eleven-appearance/export/bed-transfer QA. --render adds visual evidence."""
import bpy,json,math,struct,sys,hashlib
from pathlib import Path
from mathutils import Vector,Matrix,Quaternion
ROOT=Path(__file__).resolve().parents[2];OUT=Path(__file__).resolve().parent/('gowns-draft'if '--quick'in sys.argv else 'gowns-v06');OUT.mkdir(exist_ok=True)
scene=bpy.context.scene
for c in bpy.data.collections:c.hide_viewport=False
manifest=json.loads((ROOT/'dist/assets/patient-appearances.json').read_text())
assert len(manifest['appearances'])==11 and len({p['id']for p in manifest['appearances']})==11
def pose(arm,clip,frame):
    for track in arm.animation_data.nla_tracks:track.mute=track.name!=clip
    scene.frame_set(2 if frame==1 else 1);scene.frame_set(frame);bpy.context.view_layer.update()
    return {b.name:b.matrix.copy()for b in arm.pose.bones}
def diff(a,b):return max(abs(a[k][i][j]-b[k][i][j])for k in a for i in range(4)for j in range(4))
rotation=Quaternion((0,0,1),-math.pi/2)@Quaternion((1,0,0),-math.pi/2)
transform=Matrix.Translation(Vector((-.45,.55,.84)))@rotation.to_matrix().to_4x4()@Matrix.Translation(Vector((0,0,-.88)))
results={'appearance_count':11,'variants':{},'license':manifest['license'],'simulation_modifiers':False,'notes':['Original procedural adults; stylized, not scanned or biomechanically validated.','Gowns are skinned cloth geometry; no cloth simulation.']}
baseline_path=ROOT/'evidence/asset-animation-qa/gait-v05/after-samples.json'
if baseline_path.exists():
    baseline=json.loads(baseline_path.read_text())['action_hashes'];checked=[]
    for action in bpy.data.actions:
        if action.name.endswith(('__clinician','__coat'))and not action.name.startswith('Transfer'):
            values=[(f.data_path,f.array_index,[(float(k.co.x),float(k.co.y))for k in f.keyframe_points])for f in action.fcurves]
            assert hashlib.sha256(json.dumps(values).encode()).hexdigest()==baseline[action.name],action.name
            checked.append(action.name)
    assert len(checked)==14;results['unchanged_staff_actions']=checked
for p in manifest['appearances']:
    name='patient' if p['id']=='patient-01' else p['id'];arm=bpy.data.objects[name];mesh=bpy.data.objects[name+'_skin']
    for collection in bpy.data.collections:collection.hide_viewport=collection!=arm.users_collection[0]
    assert len(arm.pose.bones)==39
    idle=pose(arm,'Idle',1);rest=pose(arm,'Rest',1)
    end=pose(arm,'TransferIn',91);expected={n:transform@m for n,m in rest.items()}
    endpoints=[diff(end,expected),diff(end,pose(arm,'TransferOut',1)),diff(idle,pose(arm,'TransferOut',91))]
    assert max(endpoints)<2e-5,(name,endpoints)
    pose(arm,'Rest',1);ev=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());data=ev.to_mesh()
    # Rest root is at a feet origin until renderer applies the common bed transform.
    points=[transform@v.co for v in data.vertices]
    covered=[v.z for v in points if -1.02<v.x<.40]
    clearance=max(covered)-.74;minimum=min(covered);ev.to_mesh_clear()
    assert clearance<.338,(name,'covered surface exceeds occupied drape peak',clearance)
    pose(arm,'TransferIn',74)
    curl=arm.pose.bones['spine'].rotation_euler.x
    assert curl>.30,(name,'torso does not curl independently',curl)
    contacts=[]
    for frame in [4,10,19,25]:
        pose(arm,'TransferIn',frame)
        for side,sign in [('L',1),('R',-1)]:
            foot=arm.pose.bones['foot.'+side];matrix=foot.matrix@foot.bone.matrix_local.inverted()
            contacts.extend((matrix@Vector((sign*.105,y,.01))-Vector((sign*.105,y,.01))).length for y in [-.17,.045])
    assert max(contacts)<.003,(name,'feet slide while taking weight',max(contacts))
    overlap=[]
    for frame in range(1,92):
        pose(arm,'TransferIn',frame);ev=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());data=ev.to_mesh()
        z=[v.co.z for v in data.vertices if -1.36<v.co.x<.46 and .19<v.co.y<.91]
        overlap.append(max(0,.74-min(z))if z else 0);ev.to_mesh_clear()
    assert max(overlap)<.015,(name,'transfer intersects mattress',max(overlap),overlap.index(max(overlap))+1)
    assets=[]
    for suffix,key in [('', 'high'),('-lod','lod')]:
        path=ROOT/'dist/assets'/p[key];raw=path.read_bytes();n=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+n])
        prim=[q for m in doc['meshes']for q in m['primitives']]
        clips={a['name']:max(doc['accessors'][s['input']]['max'][0]for s in a['samplers'])for a in doc['animations']}
        assert len(prim)==1 and len(doc['skins'][0]['joints'])==39 and len(clips)==9
        assert abs(clips['Walk']-.9)<1e-5 and abs(clips['TransferIn']-3)<1e-5 and abs(clips['TransferOut']-3)<1e-5
        assert all('uri'not in b for b in doc['buffers']) and all('bufferView'in i for i in doc.get('images',[]))
        tris=doc['accessors'][prim[0]['indices']]['count']//3;assert tris<(5000 if suffix else 14000)
        assets.append({'file':p[key],'bytes':len(raw),'triangles':tris,'sha256':hashlib.sha256(raw).hexdigest()})
    results['variants'][p['id']]={'height_metres':max(v.co.z for v in mesh.data.vertices),'endpoint_max_error':max(endpoints),'covered_top_above_mattress':clearance,'covered_lowest_world_z':minimum,'maximum_transfer_mattress_overlap_m':max(overlap),'overlap_frame':1+overlap.index(max(overlap)),'independent_torso_curl_radians':curl,'transfer_weight_bearing_foot_error_m':max(contacts),'assets':assets}
    print('APPEARANCE_QA_PASS',p['id'],max(overlap),flush=True)
(OUT/'checks.json').write_text(json.dumps(results,indent=2)+'\n')
print('GOWN_TRANSFER_QA_PASS',json.dumps(results))
if '--render'not in sys.argv:raise SystemExit
for c in bpy.data.collections:c.hide_viewport=False
for c in bpy.data.collections:c.hide_render=True
bpy.data.collections['Collection'].hide_render=False
def cube(name,loc,scale,color):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);ob=bpy.context.object;ob.name=name;ob.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);b=ob.modifiers.new('Rounded QA furniture','BEVEL');b.width=.04;b.segments=3
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);ob.data.materials.append(m);return ob
bed=cube('QA reference mattress',(-.45,.55,.68),(1.9,.8,.12),(.67,.8,.84));base=cube('QA bed base',(-.45,.55,.51),(1.6,.62,.18),(.20,.34,.38))
bpy.ops.mesh.primitive_plane_add(size=200);floor=bpy.context.object
m=bpy.data.materials.new('QA warm white');m.diffuse_color=(.85,.86,.82,1);floor.data.materials.append(m)
bpy.ops.object.camera_add(location=(3,-4,2.8));camera=bpy.context.object;camera.data.type='ORTHO';scene.camera=camera
for loc,power,size in [((1,-3,5),650,4),((-2,2,3),400,3)]:
    bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.data.energy=power;light.data.size=size;light.rotation_euler=(Vector((-.3,.3,1))-light.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='CYCLES';scene.cycles.samples=4;scene.cycles.use_denoising=True;scene.render.resolution_x=480;scene.render.resolution_y=360;scene.render.resolution_percentage=100;scene.world.color=(.3,.3,.3)
patient=bpy.data.objects['patient'];patient.users_collection[0].hide_render=False
target=Vector((-.4,.3,.9));camera.location=target+Vector((3,-4,2.1));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=2.7
for clip in ['TransferIn','TransferOut']:
    folder=OUT/clip;folder.mkdir(exist_ok=True)
    for index,frame in enumerate([1,10,25,37,55,73,91]if '--quick'in sys.argv else range(1,92,3)):
        pose(patient,clip,frame);scene.render.filepath=str(folder/f'{index:03d}.png');bpy.ops.render.render(write_still=True)
bed.hide_render=True;base.hide_render=True;patient.users_collection[0].hide_render=True
scene.render.resolution_x=460;scene.render.resolution_y=720;scene.cycles.samples=8
for p in manifest['appearances']:
    name='patient'if p['id']=='patient-01'else p['id'];arm=bpy.data.objects[name];arm.users_collection[0].hide_render=False;pose(arm,'Idle',1)
    target=Vector((0,0,.9));camera.location=target+Vector((2,-4,1.2));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=2.15
    scene.render.filepath=str(OUT/(p['id']+'.png'));bpy.ops.render.render(write_still=True)
    arm.users_collection[0].hide_render=True
patient.users_collection[0].hide_render=False;pose(patient,'Idle',1)
target=Vector((0,0,1.0));camera.location=target+Vector((1,4,.4));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=1.4
scene.render.filepath=str(OUT/'gown-rear.png');bpy.ops.render.render(write_still=True)
