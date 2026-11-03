"""Reimport all fourteen geometry-only staff GLBs and play the actual base GLB clips."""
import bpy,json,math,struct,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=Path(__file__).resolve().parent
manifest=json.loads((ROOT/'dist/assets/staff-roles.json').read_text())
CLIPS=manifest['sharedClipNames'];base_actions={};base_matrices={};results={}
bpy.context.scene.render.fps=30
def clear():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for base in ['clinician','coat']:
    clear();before=set(bpy.data.actions)
    bpy.ops.import_scene.gltf(filepath=str(ROOT/'dist/assets'/(base+'.glb')))
    arm=next(o for o in bpy.data.objects if o.type=='ARMATURE')
    base_matrices[base]={b.name:b.matrix_local.copy()for b in arm.data.bones}
    actions=[a for a in bpy.data.actions if a not in before]
    assert len(actions)==9
    base_actions[base]={name:next(a for a in actions if a.name.startswith(name+'_'))for name in CLIPS}
    for action in actions:action.use_fake_user=True
clear()
for role in manifest['roles']:
    for suffix,key in [('', 'high'),('-lod','lod')]:
        clear();path=ROOT/'dist/assets'/role[key];raw=path.read_bytes();n=struct.unpack_from('<I',raw,12)[0];d=json.loads(raw[20:20+n]);binary=raw[28+n:]
        assert not d.get('animations'),path.name
        primitives=[p for g in d['meshes']for p in g['primitives']];assert len(primitives)==1
        prim=primitives[0]
        def values(index):
            a=d['accessors'][index];v=d['bufferViews'][a['bufferView']];fmt='<'+{5121:'B',5123:'H',5126:'f'}[a['componentType']]*4;stride=v.get('byteStride',struct.calcsize(fmt));offset=v.get('byteOffset',0)+a.get('byteOffset',0)
            return [struct.unpack_from(fmt,binary,offset+i*stride)for i in range(a['count'])]
        influence=[0]*39
        for joints,weights in zip(values(prim['attributes']['JOINTS_0']),values(prim['attributes']['WEIGHTS_0'])):
            for j,w in zip(joints,weights):
                if w>.001:influence[j]+=1
        weighted={d['nodes'][node]['name']:influence[i]for i,node in enumerate(d['skins'][0]['joints'])if d['nodes'][node]['name'].startswith(('finger','thumb','eyelid'))or d['nodes'][node]['name']in ['jaw','mouth']}
        assert all(weighted.values()),(path.name,weighted)
        before=set(bpy.data.actions);bpy.ops.import_scene.gltf(filepath=str(path));assert set(bpy.data.actions)==before
        arm=next(o for o in bpy.data.objects if o.type=='ARMATURE');skin=next(o for o in bpy.data.objects if o.type=='MESH')
        assert len(arm.pose.bones)==39 and set(arm.data.bones.keys())==set(base_matrices[role['base']])
        bind_error=max(abs(b.matrix_local[i][j]-base_matrices[role['base']][b.name][i][j])for b in arm.data.bones for i in range(4)for j in range(4))
        assert bind_error<2e-5,(path.name,bind_error)
        for bone in arm.pose.bones:bone.rotation_mode='QUATERNION'
        arm.animation_data_create();walk=[];blink=[];jaw=[];finger=[]
        for clip in CLIPS:
            arm.animation_data.action=base_actions[role['base']][clip]
            frames=[0,7,14,20,27]if clip=='Walk'else([0,18,33,36,54,72]if not clip.startswith('Transfer')else[0,30,60,90])
            for frame in frames:
                bpy.context.scene.frame_set(frame);bpy.context.view_layer.update()
                assert all(math.isfinite(v)for bone in arm.pose.bones for row in bone.matrix for v in row)
                evaluated=skin.evaluated_get(bpy.context.evaluated_depsgraph_get());data=evaluated.to_mesh()
                assert all(math.isfinite(v)and abs(v)<3 for vertex in data.vertices for v in vertex.co)
                evaluated.to_mesh_clear()
                if clip=='Walk':walk.append(arm.pose.bones['thigh.L'].rotation_quaternion.copy())
                if clip=='Discuss':
                    blink.append(max(arm.pose.bones['eyelid.L'].scale));jaw.append(arm.pose.bones['jaw'].rotation_quaternion.copy());finger.append(arm.pose.bones['finger1.02.L'].rotation_quaternion.copy())
        wd=max(q.rotation_difference(walk[0]).angle for q in walk);jd=max(q.rotation_difference(jaw[0]).angle for q in jaw);fd=max(q.rotation_difference(finger[0]).angle for q in finger)
        assert wd>.2 and max(blink)>2.4 and jd>.04 and fd>.2
        results[role['key']+suffix]={'base':role['base'],'bone_count':39,'embedded_clips':0,'base_clips_played':CLIPS,'maximum_bind_matrix_error':bind_error,'walk_thigh_delta_radians':wd,'blink_max_scale':max(blink),'jaw_delta_radians':jd,'distal_finger_delta_radians':fd,'weighted_articulated_joints':weighted,'sha256':hashlib.sha256(raw).hexdigest()}
        print('SHARED_CLIP_ROLE_PASS',role['key']+suffix,flush=True)
baseline=json.loads((OUT/'asset-checks.json').read_text())['original_sources_and_assets_unchanged']
assert all(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h for name,h in baseline.items())
(OUT/'shared-clip-checks.json').write_text(json.dumps({'blender_version':bpy.app.version_string,'variants':results,'originals_unchanged':True},indent=2)+'\n')
print('ALL14_SHARED_CLIP_PASS',flush=True)
