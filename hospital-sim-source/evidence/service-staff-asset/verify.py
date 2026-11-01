"""Actual GLB/shared-clip/bind/skin checks and exported-mesh renders."""
import bpy,json,math,struct,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=Path(__file__).resolve().parent
CLIPS=['Idle','Walk','Sit','Work','Discuss','Attend','Rest','TransferIn','TransferOut'];results={}
def clear():
    for obj in list(bpy.context.scene.objects):bpy.data.objects.remove(obj,do_unlink=True)
bpy.context.scene.render.fps=30;clear();bpy.ops.import_scene.gltf(filepath=str(ROOT/'dist/assets/clinician.glb'))
base=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE');rest={b.name:b.matrix_local.copy()for b in base.data.bones}
actions={name:next(a for a in bpy.data.actions if a.name.startswith(name+'_'))for name in CLIPS}
for action in actions.values():action.use_fake_user=True
for role in ['assistant','facilities']:
    for suffix in ['','-lod']:
        clear();path=ROOT/'dist/assets'/('staff-'+role+suffix+'.glb');raw=path.read_bytes();n=struct.unpack_from('<I',raw,12)[0];d=json.loads(raw[20:20+n]);binary=raw[28+n:]
        assert not d.get('animations');p=d['meshes'][0]['primitives'];assert len(p)==1;p=p[0]
        assert 'TEXCOORD_0'in p['attributes']and 'TEXCOORD_1'not in p['attributes']
        def values(index):
            a=d['accessors'][index];v=d['bufferViews'][a['bufferView']];fmt='<'+{5121:'B',5123:'H',5126:'f'}[a['componentType']]*4;stride=v.get('byteStride',struct.calcsize(fmt));offset=v.get('byteOffset',0)+a.get('byteOffset',0)
            return [struct.unpack_from(fmt,binary,offset+i*stride)for i in range(a['count'])]
        influence=[0]*39
        for js,ws in zip(values(p['attributes']['JOINTS_0']),values(p['attributes']['WEIGHTS_0'])):
            for j,w in zip(js,ws):
                if w>.001:influence[j]+=1
        weighted={d['nodes'][node]['name']:influence[i]for i,node in enumerate(d['skins'][0]['joints'])if d['nodes'][node]['name'].startswith(('finger','thumb','eyelid'))or d['nodes'][node]['name']in ['jaw','mouth']};assert all(weighted.values())
        before=set(bpy.data.actions);bpy.ops.import_scene.gltf(filepath=str(path));assert set(bpy.data.actions)==before
        arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE');skin=next(o for o in bpy.context.scene.objects if o.type=='MESH')
        assert len(arm.pose.bones)==39 and set(arm.data.bones.keys())==set(rest)
        error=max(abs(b.matrix_local[i][j]-rest[b.name][i][j])for b in arm.data.bones for i in range(4)for j in range(4));assert error<2e-5
        for bone in arm.pose.bones:bone.rotation_mode='QUATERNION'
        arm.animation_data_create();walk=[];blink=[];jaw=[];finger=[]
        for clip in CLIPS:
            arm.animation_data.action=actions[clip]
            for frame in ([0,7,14,20,27]if clip=='Walk'else([0,18,33,36,54,72]if not clip.startswith('Transfer')else[0,30,60,90])):
                bpy.context.scene.frame_set(frame);bpy.context.view_layer.update();ev=skin.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
                assert all(math.isfinite(v)and abs(v)<3 for vertex in mesh.vertices for v in vertex.co);ev.to_mesh_clear()
                if clip=='Walk':walk.append(arm.pose.bones['thigh.L'].rotation_quaternion.copy())
                if clip=='Discuss':blink.append(max(arm.pose.bones['eyelid.L'].scale));jaw.append(arm.pose.bones['jaw'].rotation_quaternion.copy());finger.append(arm.pose.bones['finger1.02.L'].rotation_quaternion.copy())
        wd=max(q.rotation_difference(walk[0]).angle for q in walk);jd=max(q.rotation_difference(jaw[0]).angle for q in jaw);fd=max(q.rotation_difference(finger[0]).angle for q in finger)
        assert wd>.2 and max(blink)>2.4 and jd>.04 and fd>.2
        results[role+suffix]={'base':'clinician','joints':39,'embedded_clips':0,'shared_clips_played':CLIPS,'bind_matrix_error':error,'walk_delta':wd,'blink_scale':max(blink),'jaw_delta':jd,'finger_delta':fd,'weighted_face_and_digits':weighted,'sha256':hashlib.sha256(raw).hexdigest()}
clear();bpy.ops.import_scene.gltf(filepath=str(ROOT/'dist/assets/service-props.glb'))
bpy.context.view_layer.update()
expected={'FloorSpill':(.60,.60,.01),'CleaningCaddy':(.32,.25,.48),'Mop':(.30,.12,1.25)};props={}
for obj in [o for o in bpy.context.scene.objects if o.type=='MESH']:
    points=[obj.matrix_world@v.co for v in obj.data.vertices];lo=[min(p[i]for p in points)for i in range(3)];hi=[max(p[i]for p in points)for i in range(3)];dims=[hi[i]-lo[i]for i in range(3)]
    assert obj.name in expected and obj.location.length<1e-6 and abs(lo[2])<1e-6 and max(abs(dims[i]-expected[obj.name][i])for i in range(3))<2e-5,(obj.name,list(obj.location),lo,dims)
    props[obj.name]={'dimensions_blender':dims,'floor_origin':True}
assert set(props)==set(expected)
with bpy.data.libraries.load(str(ROOT/'blender/service_staff.blend'),link=False)as(source,target):
    assert set(source.objects)=={'staff-assistant','staff-assistant_skin','staff-facilities','staff-facilities_skin','FloorSpill','CleaningCaddy','Mop'},source.objects
original=json.loads((OUT/'asset-checks.json').read_text())['original_hashes'];assert all(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h for name,h in original.items())
(OUT/'roundtrip-checks.json').write_text(json.dumps({'blender_version':bpy.app.version_string,'humans':results,'props':props,'originals_unchanged':True},indent=2)+'\n')
def studio(target=(0,0,.9),scale=2.08,width=380,height=600):
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=4;scene.cycles.use_denoising=True;scene.render.resolution_x=width;scene.render.resolution_y=height;scene.render.resolution_percentage=100
    if scene.world is None:scene.world=bpy.data.worlds.new('Service staff studio')
    scene.world.use_nodes=True;scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.7,.7,.68,1)
    bpy.ops.mesh.primitive_plane_add(size=200);floor=bpy.context.object;mat=bpy.data.materials.new('QA-only warm-white floor');mat.diffuse_color=(.85,.86,.83,1);floor.data.materials.append(mat)
    bpy.ops.object.camera_add();cam=bpy.context.object;target=Vector(target);cam.location=target+Vector((2,-4,1.1));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=scale;scene.camera=cam
    for loc,power in [((-2,-3,5),450),((3,2,4),250)]:
        bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.data.energy=power;light.data.size=4;light.rotation_euler=(target-light.location).to_track_quat('-Z','Y').to_euler()
    return scene
for role in ['assistant','facilities']:
    for suffix,clip in [('', 'Idle'),('-lod','Work')]:
        clear();bpy.ops.import_scene.gltf(filepath=str(ROOT/'dist/assets'/('staff-'+role+suffix+'.glb')))
        arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
        for bone in arm.pose.bones:bone.rotation_mode='QUATERNION'
        arm.animation_data_create();arm.animation_data.action=actions[clip];bpy.context.scene.frame_set(18);bpy.context.view_layer.update()
        scene=studio();scene.render.filepath=str(OUT/(role+suffix+'.png'));bpy.ops.render.render(write_still=True)
clear();bpy.ops.import_scene.gltf(filepath=str(ROOT/'dist/assets/service-props.glb'))
for obj in [o for o in bpy.context.scene.objects if o.type=='MESH']:obj.location={'FloorSpill':(0,-.25,0),'CleaningCaddy':(-.35,.10,0),'Mop':(.35,.10,0)}[obj.name]
scene=studio((0,0,.58),1.90,720,540);scene.render.filepath=str(OUT/'service-props-preview.png');bpy.ops.render.render(write_still=True)
print('SERVICE_SHARED_CLIP_ROUNDTRIP_PASS',flush=True)
