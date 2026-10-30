"""Reproduce with Blender: -b blender/characters.blend --python evidence/asset-animation-qa/verify_and_render.py [-- --render]."""
import bpy, math, json, struct, sys
from pathlib import Path
from mathutils import Vector, Matrix, Quaternion
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parent
scene=bpy.context.scene
for c in bpy.data.collections: c.hide_viewport=False

def pose(arm,clip,frame):
    for track in arm.animation_data.nla_tracks: track.mute=track.name!=clip
    scene.frame_set(frame)
    return {bone.name:bone.matrix.copy() for bone in arm.pose.bones}

def difference(a,b):
    return max(abs(a[name][i][j]-b[name][i][j]) for name in a for i in range(4) for j in range(4))

results={'assets':{},'characters':{},'licensing':'Original CC0-1.0 geometry, substantial OpenAI Codex assistance',
 'walk':{'duration_seconds':.9,'root_speed_metres_per_second':1.65},
 'transfer':{'duration_seconds':3,'standing_anchor_gltf':[0,0,0],'rest_root_position_gltf':[-1.33,.84,-.55],
 'rest_root_quaternion_gltf':[-.5,-.5,-.5,.5],'mattress_plane_gltf_y':.74,
 'notes':'Play once with clampWhenFinished. Rebase root against original standing anchor before Rest; restore anchor when beginning TransferOut. Geometry remains procedural stylization; no mocap or clinical validation.'}}
for kind in ['clinician','coat','patient']:
    arm=bpy.data.objects[kind]; mesh=bpy.data.objects[kind+'_skin']
    idle=pose(arm,'Idle',1); resting=pose(arm,'Rest',1)
    final=pose(arm,'TransferIn',91)
    rotation=Quaternion((0,0,1),-math.pi/2)@Quaternion((1,0,0),-math.pi/2)
    transform=Matrix.Translation(Vector((-.45,.55,.84)))@rotation.to_matrix().to_4x4()@Matrix.Translation(Vector((0,0,-.88)))
    expected={name:transform@matrix for name,matrix in resting.items()}
    to_rest=difference(final,expected); to_out=difference(final,pose(arm,'TransferOut',1)); to_idle=difference(idle,pose(arm,'TransferOut',91))
    eyelid=[]; jaw=[]; mouth=[]; finger=[]
    for frame in range(1,74):
        pose(arm,'Discuss',frame)
        eyelid.append(arm.pose.bones['eyelid.L'].scale.y); jaw.append(arm.pose.bones['jaw'].rotation_euler.x)
        mouth.append(arm.pose.bones['mouth'].scale.y); finger.append(arm.pose.bones['finger1.02.L'].rotation_euler.x)
    assert max(to_rest,to_out,to_idle)<.00002,(kind,to_rest,to_out,to_idle)
    assert max(eyelid)>2.4 and max(jaw)>.04 and max(mouth)>2.5 and max(finger)-min(finger)>.1
    results['characters'][kind]={'bone_count':len(arm.pose.bones),'transfer_to_rest_max_matrix_error':to_rest,
      'transfer_in_to_out_max_matrix_error':to_out,'transfer_out_to_idle_max_matrix_error':to_idle,
      'eyelid_scale_range':[min(eyelid),max(eyelid)],'jaw_rotation_range_radians':[min(jaw),max(jaw)],
      'mouth_scale_range':[min(mouth),max(mouth)],'finger_distal_rotation_range_radians':[min(finger),max(finger)]}
    if kind=='patient':
        intrusion=[]
        for frame in range(1,92):
            pose(arm,'TransferIn',frame)
            evaluated=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get()); data=evaluated.to_mesh()
            points=[v.co.z for v in data.vertices if -1.36<v.co.x<.46 and .19<v.co.y<.91]
            intrusion.append(max(0,.74-min(points)) if points else 0)
            evaluated.to_mesh_clear()
        results['transfer']['maximum_mattress_intrusion_metres']=max(intrusion)
        results['transfer']['maximum_intrusion_frame']=1+intrusion.index(max(intrusion))
        results['transfer']['soft_contact_tolerance_metres']=.015
        results['transfer']['soft_contact_note']='Static mattress allows up to15mm of clothing/back overlap as a soft-contact approximation; no mattress deformation is simulated.'
        assert max(intrusion)<.015, ('transfer intersects mattress',max(intrusion),intrusion.index(max(intrusion))+1)
    for suffix in ['','-lod']:
        path=ROOT/'dist'/'assets'/(kind+suffix+'.glb'); raw=path.read_bytes(); length=struct.unpack_from('<I',raw,12)[0]
        doc=json.loads(raw[20:20+length]); binary_start=20+length+8; binary=raw[binary_start:]
        prim=[p for m in doc['meshes'] for p in m['primitives']]
        assert len(prim)==1 and 'COLOR_0' in prim[0]['attributes'] and 'TEXCOORD_0' in prim[0]['attributes'] and len(doc['skins'][0]['joints'])==39
        assert len(doc.get('images',[]))==1 and all('bufferView' in image for image in doc['images'])
        assert all('uri' not in buffer for buffer in doc['buffers'])
        assert 'metallicRoughnessTexture' in doc['materials'][0]['pbrMetallicRoughness']
        names={doc['nodes'][index]['name']:i for i,index in enumerate(doc['skins'][0]['joints'])}
        def values(accessor):
            a=doc['accessors'][accessor]; view=doc['bufferViews'][a['bufferView']]
            code={5121:'B',5123:'H',5126:'f'}[a['componentType']]; n={'SCALAR':1,'VEC4':4}[a['type']]
            fmt='<'+code*n; stride=view.get('byteStride',struct.calcsize(fmt)); base=view.get('byteOffset',0)+a.get('byteOffset',0)
            return [struct.unpack_from(fmt,binary,base+i*stride) for i in range(a['count'])]
        joints=values(prim[0]['attributes']['JOINTS_0']); weights=values(prim[0]['attributes']['WEIGHTS_0']); influence=[0]*39
        for js,ws in zip(joints,weights):
            for index,weight in zip(js,ws):
                if weight>.001: influence[index]+=1
        required=[name for name in names if name.startswith(('finger','thumb','eyelid')) or name in ['jaw','mouth']]
        assert all(influence[names[name]]>0 for name in required),(kind,suffix,required,influence)
        clips={a['name']:max(doc['accessors'][s['input']]['max'][0] for s in a['samplers']) for a in doc['animations']}
        assert len(clips)==9 and abs(clips['Walk']-.9)<1e-5 and abs(clips['TransferIn']-3)<1e-5 and abs(clips['TransferOut']-3)<1e-5
        triangles=doc['accessors'][prim[0]['indices']]['count']//3
        assert triangles<(5000 if suffix else 14000)
        results['assets'][kind+suffix]={'bytes':len(raw),'triangles':triangles,'primitives':len(prim),'clips_seconds':clips,
          'weighted_articulated_joints':{name:influence[names[name]] for name in required}}
OUT.mkdir(exist_ok=True)
(OUT/'results.json').write_text(json.dumps(results,indent=2))
print('ANIMATION_QA_PASS',json.dumps(results['characters']))
if '--render' not in sys.argv: raise SystemExit
# Actual source geometry is rendered at measured clip poses, beside a reference mattress.
for c in bpy.data.collections: c.hide_render=True
bpy.data.collections['Collection'].hide_render=False
patient=bpy.data.objects['patient']; clinician=bpy.data.objects['clinician']
def cube(name,loc,scale,color,bevel):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); ob=bpy.context.object; ob.name=name; ob.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    mod=ob.modifiers.new('Rounded QA prop','BEVEL'); mod.width=bevel; mod.segments=3
    mat=bpy.data.materials.new(name); mat.diffuse_color=(*color,1); ob.data.materials.append(mat)
    return ob
cube('Reference mattress',(-.45,.55,.68),(1.9,.8,.12),(.65,.8,.88),.045)
cube('Reference bed base',(-.45,.55,.52),(1.65,.62,.16),(.2,.38,.5),.04)
bpy.ops.mesh.primitive_plane_add(size=200); floor=bpy.context.object
mat=bpy.data.materials.new('White QA floor'); mat.diffuse_color=(.88,.88,.85,1); floor.data.materials.append(mat)
bpy.ops.object.camera_add(location=(3,-4,2.8)); camera=bpy.context.object; camera.data.type='ORTHO'; scene.camera=camera
for loc,power,size in [((1,-3,5),650,4),((-2,2,3),400,3)]:
    bpy.ops.object.light_add(type='AREA',location=loc); light=bpy.context.object; light.data.energy=power; light.data.size=size
    light.rotation_euler=(Vector((-.3,.3,1))-light.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='CYCLES'; scene.cycles.samples=8; scene.render.resolution_x=640; scene.render.resolution_y=480; scene.render.resolution_percentage=100; scene.world.color=(.3,.3,.3)
def render_sequence(name,arm,clip,frames,target,scale,camera_offset):
    patient.users_collection[0].hide_render=arm!=patient; clinician.users_collection[0].hide_render=arm!=clinician
    path=OUT/name; path.mkdir(exist_ok=True)
    for index,frame in enumerate(frames):
        pose(arm,clip,frame)
        center=Vector(target); camera.location=center+Vector(camera_offset)
        camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler(); camera.data.ortho_scale=scale
        scene.render.filepath=str(path/f'{index:03}.png'); bpy.ops.render.render(write_still=True)
render_sequence('transfer',patient,'TransferIn',range(1,92,3),(-.4,.3,.9),2.7,(3,-4,2.1))
for ob in list(bpy.data.objects):
    if ob.name.startswith('Reference'): ob.hide_render=True
render_sequence('face',clinician,'Discuss',range(1,74,3),(0,-.015,1.61),.40,(.35,-2,.15))
pose(clinician,'Attend',19); palm=clinician.pose.bones['hand.L'].head.copy()
render_sequence('fingers',clinician,'Attend',[1,19,37,55,73],palm,.24,(1,-.2,.15))
