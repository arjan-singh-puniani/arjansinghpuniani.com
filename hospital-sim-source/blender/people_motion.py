"""Blender4 original greetings, waiting, goodbye and keyboard contact; CC0, AI-assisted.
Retains the executed RC9 walking/chair actions. No simulation changes.
"""
import bpy, math, json, importlib.util, sys
from pathlib import Path
from mathutils import Vector,Matrix
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('human_source',ROOT/'blender/characters.py');h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.fps=30;scene.unit_settings.system='METRIC'
with bpy.data.libraries.load(str(ROOT/'blender/first_minute_motion.blend'),link=False) as (source,target):
    target.objects=[n for n in source.objects if n in ['clinician','coat','patient',*('patient-'+str(i).zfill(2)for i in range(2,12))]]
arms=[o for o in target.objects if o and o.type=='ARMATURE']
assert len(arms)==13
arms.sort(key=lambda a:(a.name not in ['coat','clinician'],a.name))
for arm in arms:
    scene.collection.objects.link(arm)
    for track in arm.animation_data.nla_tracks:track.mute=True

def seated(arm):
    arm.pose.bones['hips'].location.y=-.42
    bpy.context.view_layer.update()
    for side,sign in [('L',1),('R',-1)]:
        hip=arm.pose.bones['thigh.'+side].head.copy();ankle=Vector((sign*.105,-.4,.105))
        solve(arm,'thigh.'+side,'shin.'+side,hip,ankle,Vector((0,-1,0)))
        foot=arm.pose.bones['foot.'+side];foot.matrix=Matrix.Translation(ankle)@foot.bone.matrix_local.to_quaternion().to_matrix().to_4x4()

def solve(arm,upper,lower,start,target,pole):
    l1=arm.data.bones[upper].length;l2=arm.data.bones[lower].length;delta=target-start;distance=delta.length
    assert distance<l1+l2+.002,(arm.name,upper,distance,l1+l2)
    axis=delta.normalized();a=(l1*l1-l2*l2+distance*distance)/(2*distance)
    bend=(pole-axis*pole.dot(axis)).normalized();joint=start+axis*a+bend*math.sqrt(max(0,l1*l1-a*a))
    h.set_bone_between(arm,upper,start,joint);bpy.context.view_layer.update()
    h.set_bone_between(arm,lower,joint,target);bpy.context.view_layer.update()

report=[]
for arm in arms:
    key=arm.get('appearance_id')or arm.name
    mesh=bpy.data.meshes.new('Motion carrier');mesh.from_pydata([(0,0,0),(.001,0,0),(0,.001,0)],[],[(0,1,2)])
    carrier=bpy.data.objects.new('Motion carrier',mesh);scene.collection.objects.link(carrier);carrier.parent=arm
    carrier.vertex_groups.new(name='hips').add([0,1,2],1,'REPLACE');skin=carrier.modifiers.new('Rig','ARMATURE');skin.object=arm
    clips=[('Wait',6),('Greet',1.4),('Thanks',1)]
    if key in ['clinician','coat']:clips.extend([('SeatedWork',2.4),('CounterWork',2.4),('Attend',2.4)])
    maximum_error=0
    for name,duration in clips:
        for track in arm.animation_data.nla_tracks:track.mute=True
        action=bpy.data.actions.new(name+'__'+key);arm.animation_data.action=action
        frames=round(duration*30)
        for frame in range(frames+1):
            scene.frame_set(frame+1)
            for b in arm.pose.bones:b.rotation_mode='XYZ';b.matrix_basis.identity()
            u=frame/frames;t=u*math.pi*2
            if name in ['SeatedWork','CounterWork','Attend']:
                if name=='SeatedWork':seated(arm)
                arm.pose.bones['spine'].rotation_euler.x={'SeatedWork':.28,'CounterWork':.18,'Attend':.23}[name];bpy.context.view_layer.update()
                for side,sign in [('L',1),('R',-1)]:
                    forward,height={'SeatedWork':(.49,.86),'CounterWork':(.20,1.035),'Attend':(.34,1.06)}[name]
                    wrist=Vector((sign*.08,-forward,height))
                    solve(arm,'upper_arm.'+side,'forearm.'+side,arm.pose.bones['upper_arm.'+side].head.copy(),wrist,Vector((0,0,-1)))
                    h.set_bone_between(arm,'hand.'+side,wrist,wrist+Vector((0,-.09,-.015)))
                    bpy.context.view_layer.update()
                    arm.pose.bones['hand.'+side].matrix=arm.pose.bones['hand.'+side].matrix@Matrix.Rotation(math.pi,4,'Y')
                    bpy.context.view_layer.update();maximum_error=max(maximum_error,(arm.pose.bones['hand.'+side].head-wrist).length)
                    for i in range(4):
                        arm.pose.bones[f'finger{i}.01.{side}'].rotation_euler.x=-.06-.12*math.sin(t*2+i+sign)**2
                        arm.pose.bones[f'finger{i}.02.{side}'].rotation_euler.x=-.08
                arm.pose.bones['head'].rotation_euler.x=.08
            elif name=='Wait':
                arm.pose.bones['spine'].rotation_euler.x=.007*math.sin(t*2)
                arm.pose.bones['head'].rotation_euler.z=.035*math.sin(t)
                arm.pose.bones['head'].rotation_euler.y=.15*math.sin(t)*math.sin(math.pi*u)**2
                arm.pose.bones['forearm.L'].rotation_euler.x=-.12-.04*math.sin(t)
                arm.pose.bones['forearm.R'].rotation_euler.x=-.10+.04*math.sin(t)
            else:
                pulse=math.sin(math.pi*u)**1.2;wave=math.sin(t*2.5)*pulse
                arm.pose.bones['upper_arm.R'].rotation_euler.x=-.65*pulse
                arm.pose.bones['upper_arm.R'].rotation_euler.z=.13*pulse
                arm.pose.bones['forearm.R'].rotation_euler.x=-1.8*pulse
                arm.pose.bones['hand.R'].rotation_euler.z=.22*wave
                arm.pose.bones['head'].rotation_euler.x=.09*math.sin(math.pi*u*2)*pulse
                arm.pose.bones['head'].rotation_euler.z=-.025*pulse
            blink=max(0,1-abs(u*duration-(3.9 if name=='Wait' else .8))/.085)
            for side in ['L','R']:
                arm.pose.bones['eyelid.'+side].location.y=.011*blink
                arm.pose.bones['eyelid.'+side].scale.y=1+1.5*blink
            for b in arm.pose.bones:
                b.keyframe_insert('rotation_euler',frame=frame+1);b.keyframe_insert('location',frame=frame+1);b.keyframe_insert('scale',frame=frame+1)
        for fcurve in action.fcurves:
            for point in fcurve.keyframe_points:point.interpolation='LINEAR'
        arm.animation_data.action=None;track=arm.animation_data.nla_tracks.new();track.name=name;track.strips.new(name,1,action)
    for track in arm.animation_data.nla_tracks:track.mute=False
    bpy.ops.object.select_all(action='DESELECT');arm.select_set(True);carrier.select_set(True);bpy.context.view_layer.objects.active=arm
    path=ROOT/'dist/assets'/('presence-motion-'+key+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_animations=True,export_nla_strips=True,export_anim_single_armature=False,export_anim_slide_to_zero=True,export_force_sampling=True,export_yup=True)
    report.append({'rig':key,'clips':[n for n,d in clips],'maximumKeyboardWristErrorMetres':maximum_error,'bytes':path.stat().st_size})
    print('PRESENCE_MOTION',json.dumps(report[-1]),flush=True)
    for track in arm.animation_data.nla_tracks:track.mute=track.name!='Wait'
    carrier.hide_render=True
scene.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/people_motion.blend'),compress=True)
(ROOT/'evidence/people-presence/motion.json').write_text(json.dumps({'blender':bpy.app.version_string,'license':'CC0-1.0','keyboard':'GP wrists x±.08, forward.49m,height.86m; reception forward.20m,height1.035m. Evaluated hand matrices use local-axis roll. Runtime raises GP keyboard to sit on the desk; skin contact verified by tests/people-presence.mjs. Feet retain seated IK.','rigs':report},indent=2))
