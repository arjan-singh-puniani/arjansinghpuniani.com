"""Read-only gait motion/contact QA and matched before/after Blender renders."""
import bpy,math,json,hashlib,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parent/'gait-v05'
tag=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'after'
OUT.mkdir(exist_ok=True)
scene=bpy.context.scene
for col in scene.collection.children:
    col.hide_viewport=False; col.hide_render=False
for ob in bpy.data.objects:
    if ob.type in ['ARMATURE','MESH']:
        ob.hide_render=ob.name not in ['patient','patient_skin']
arm=bpy.data.objects['patient']
for track in arm.animation_data.nla_tracks:track.mute=track.name!='Walk'
scene.frame_set(2);scene.frame_set(1);bpy.context.view_layer.update()
hashes={}
for action in bpy.data.actions:
    if '__' in action.name:
        values=[(f.data_path,f.array_index,[(float(k.co.x),float(k.co.y))for k in f.keyframe_points])for f in action.fcurves]
        hashes[action.name]=hashlib.sha256(json.dumps(values).encode()).hexdigest()
samples=[];errors=[];sole=[]
for i in range(109):
    phase=i/108;f=1+phase*27;scene.frame_set(int(f),subframe=f%1)
    hip=(arm.pose.bones['thigh.L'].head+arm.pose.bones['thigh.R'].head)*.5
    item={'phase':phase,'hip':list(hip),'shoulder_L_x':arm.pose.bones['upper_arm.L'].rotation_euler.x,'legs':{}}
    for side,sign,offset in [('L',1,0),('R',-1,.5)]:
        q=(phase+offset)%1;thigh=arm.pose.bones['thigh.'+side];shin=arm.pose.bones['shin.'+side];foot=arm.pose.bones['foot.'+side]
        angle=math.degrees((thigh.tail-thigh.head).angle(shin.tail-shin.head))
        transform=foot.matrix@foot.bone.matrix_local.inverted()
        heel=transform@Vector((sign*.105,.045,.01));toe=transform@Vector((sign*.105,-.17,.01))
        if q<.5:
            pivot=.045 if q/.5<.14 else -.17
            actual=heel if pivot==.045 else toe
            expected=Vector((sign*.105,-.34+pivot+1.65*.9*q,0))
            errors.append((actual-expected).length)
        sole.extend((heel.z,toe.z))
        item['legs'][side]={'knee_flex_degrees':angle,'heel':list(heel),'toe':list(toe)}
    samples.append(item)
report={'tag':tag,'cycle_seconds':.9,'root_speed_m_s':1.65,'action_hashes':hashes,'hip_height_range':[min(s['hip'][2]for s in samples),max(s['hip'][2]for s in samples)],'max_contact_error_m':max(errors),'min_sole_m':min(sole),'samples':samples}
(OUT/(tag+'-samples.json')).write_text(json.dumps(report,indent=2))
assert max(errors)<.0045 and min(sole)>-.003,(max(errors),min(sole))
if '--metrics-only' in sys.argv:
    print('GAIT_QUALITY_PASS',tag,report['hip_height_range'],max(errors));sys.exit(0)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.003));plane=bpy.context.object
mat=bpy.data.materials.new('QA checkered studio');mat.use_nodes=True;nodes=mat.node_tree.nodes
checker=nodes.new('ShaderNodeTexChecker');checker.inputs['Color1'].default_value=(.64,.68,.66,1);checker.inputs['Color2'].default_value=(.77,.80,.78,1);checker.inputs['Scale'].default_value=4
tex=nodes.new('ShaderNodeTexCoord');mat.node_tree.links.new(tex.outputs['Object'],checker.inputs['Vector']);mat.node_tree.links.new(checker.outputs['Color'],nodes.get('Principled BSDF').inputs['Base Color']);nodes.get('Principled BSDF').inputs['Roughness'].default_value=.9;plane.data.materials.append(mat)
bpy.ops.object.camera_add(location=(-3.4,-5.2,2.4));cam=bpy.context.object
cam.rotation_euler=(Vector((0,0,.85))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.05;scene.camera=cam
cam_base=cam.location.copy()
for position,power,size in [((-3,-4,5),450,4),((3,1,4),180,3)]:
    bpy.ops.object.light_add(type='AREA',location=position);light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size;light.rotation_euler=(Vector((0,0,.9))-light.location).to_track_quat('-Z','Y').to_euler()
scene.world.color=(.8,.8,.8);scene.render.engine='CYCLES';scene.cycles.samples=12
scene.render.resolution_x=560;scene.render.resolution_y=640;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG'
folder=OUT/tag;folder.mkdir(exist_ok=True)
for i in range(1 if '--first-only' in sys.argv else 27):
    scene.frame_set(i+1);arm.location.y=-1.65*i/30;cam.location=cam_base+arm.location
    scene.render.filepath=str(folder/f'{i:03d}.png');bpy.ops.render.render(write_still=True)
print('GAIT_QUALITY_PASS',tag,report['hip_height_range'],max(errors))
