"""Compact indoor strides on the original adult rigs; CC0 and substantial AI assistance.
Blender4: blender --factory-startup -b --python blender/first_minute_motion.py
Metres, original39-joint rigs, CC0-1.0. Substantial AI assistance.
"""
import bpy, math, importlib.util, json, sys
from pathlib import Path
from mathutils import Vector, Quaternion, Matrix
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('original_humans',ROOT/'blender/characters.py')
h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
SPEED=1.2375;DURATION=.8;FRAMES=24

def foot_target(phase):
    stance=.56;front=-SPEED*DURATION*stance/2;rear=-front
    if phase<stance:
        u=phase/stance;y=front+SPEED*DURATION*phase;lift=0
        pitch=-.12*(1-u/.14)**2 if u<.14 else .22*((u-.8)/.2)**2 if u>.8 else 0
    else:
        u=(phase-stance)/(1-stance);m=SPEED*DURATION*(1-stance)
        y=(2*u**3-3*u*u+1)*rear+(u**3-2*u*u+u)*m+(-2*u**3+3*u*u)*front+(u**3-u*u)*m
        lift=.026*math.sin(math.pi*u)**1.5;pitch=.22-.34*(u*u*(3-2*u))
    pivot=Vector((0,.045 if pitch<0 else -.17,-.095));q=Quaternion((1,0,0),pitch)
    return Vector((0,y,.095+lift))+pivot-q@pivot,pitch,lift

h.foot_target=foot_target

def seated_pose(arm,u,breath=0):
    u=max(0,min(1,u));u=u*u*(3-2*u)
    arm.pose.bones['hips'].location.y=-.42*u
    arm.pose.bones['hips'].location.z=.4*(1-u)
    bpy.context.view_layer.update()
    for side,sign in [('L',1),('R',-1)]:
        hip=arm.pose.bones['thigh.'+side].head.copy();ankle=Vector((sign*.105,-.4,.105))
        l1=arm.data.bones['thigh.'+side].length;l2=arm.data.bones['shin.'+side].length
        delta=ankle-hip;distance=delta.length;axis=delta.normalized();a=(l1*l1-l2*l2+distance*distance)/(2*distance)
        bend=Vector((0,-1,0));bend=(bend-axis*bend.dot(axis)).normalized()
        knee=hip+axis*a+bend*math.sqrt(max(0,l1*l1-a*a))
        h.set_bone_between(arm,'thigh.'+side,hip,knee);bpy.context.view_layer.update()
        h.set_bone_between(arm,'shin.'+side,knee,ankle);bpy.context.view_layer.update()
        foot=arm.pose.bones['foot.'+side];foot.matrix=Matrix.Translation(ankle)@foot.bone.matrix_local.to_quaternion().to_matrix().to_4x4()
        arm.pose.bones['upper_arm.'+side].rotation_euler.x=-.30*u
        arm.pose.bones['forearm.'+side].rotation_euler.x=-1.05*u
        arm.pose.bones['hand.'+side].rotation_euler.y=math.pi*u
    arm.pose.bones['spine'].rotation_euler.x=-.10*math.sin(math.pi*u)+.006*math.sin(breath)
    arm.pose.bones['head'].rotation_euler.x=.02*u
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'blender/characters.blend'))
scene=bpy.context.scene;scene.render.fps=30;scene.unit_settings.system='METRIC'
for collection in bpy.data.collections:collection.hide_viewport=False
rigs=[o for o in scene.objects if o.type=='ARMATURE'];checks=[]
for rig in rigs:rig.animation_data_clear()
for action in list(bpy.data.actions):bpy.data.actions.remove(action)
for arm in rigs:
    if '--rig' in sys.argv and (arm.get('appearance_id') or arm.name)!=sys.argv[sys.argv.index('--rig')+1]:continue
    bpy.context.view_layer.objects.active=arm
    key=arm.get('appearance_id') or arm.name
    arm.animation_data_clear();arm.animation_data_create()
    action=bpy.data.actions.new('Walk');arm.animation_data.action=action
    for f in range(FRAMES+1):
        scene.frame_set(f+1)
        for b in arm.pose.bones:b.rotation_mode='XYZ';b.rotation_euler=(0,0,0);b.location=(0,0,0);b.scale=(1,1,1)
        h.apply_walk(arm,f/FRAMES)
        # The indoor stride has less arm swing and no exaggerated head counter-bob.
        for side in ['L','R']:
            arm.pose.bones['upper_arm.'+side].rotation_euler.x*=.45
            arm.pose.bones['forearm.'+side].rotation_euler.x*=.65
        arm.pose.bones['head'].rotation_euler=(.008,0,0)
        for b in arm.pose.bones:
            b.keyframe_insert('rotation_euler',frame=f+1);b.keyframe_insert('location',frame=f+1);b.keyframe_insert('scale',frame=f+1)
    for c in action.fcurves:
        for k in c.keyframe_points:k.interpolation='LINEAR'
    action.name='Walk__'+key
    scene.frame_start=1;scene.frame_end=FRAMES+1;scene.frame_set(1)
    # Check stance sole drift independently of the rendering adapter.
    drift=[];sole=[]
    for i in range(FRAMES*4):
        frame=1+i/4;scene.frame_set(int(frame),subframe=frame%1);phase=(frame-1)/FRAMES
        for side,offset,sign in [('L',0,1),('R',.5,-1)]:
            q=(phase+offset)%1;foot=arm.pose.bones['foot.'+side];tr=foot.matrix@foot.bone.matrix_local.inverted()
            if q<.56:
                pitch=foot_target(q)[1];pivot=.045 if pitch<0 else -.17
                actual=tr@Vector((sign*.105,pivot,.01))+Vector((0,-SPEED*DURATION*phase,0))
                expected=Vector((sign*.105,-SPEED*DURATION*.56/2+pivot-SPEED*DURATION*(phase-q),0))
                drift.append((actual-expected).length)
                if len(drift)==1:print('FIRST_CONTACT',key,tuple(actual),tuple(expected),arm.animation_data.action.name,flush=True)
            sole.extend((tr@Vector((sign*.105+dx,y,.01))).z for dx in [-.05,.05] for y in [-.17,.045])
    checks.append({'rig':key,'maxSupportDriftMetres':max(drift),'minimumSoleMetres':min(sole)})
    print('CONTACT',key,max(drift),min(sole),flush=True)
    assert max(drift)<.006 and min(sole)>-.004,(key,max(drift),min(sole))
    # A three-vertex skinned carrier keeps all joints in glTF; only its clips are loaded.
    mesh=bpy.data.meshes.new('Clip carrier');mesh.from_pydata([(0,0,0),(.001,0,0),(0,.001,0)],[],[(0,1,2)])
    carrier=bpy.data.objects.new('Clip carrier',mesh);scene.collection.objects.link(carrier)
    carrier.vertex_groups.new(name='hips').add([0,1,2],1,'REPLACE');modifier=carrier.modifiers.new('Rig','ARMATURE');modifier.object=arm;carrier.parent=arm
    track=arm.animation_data.nla_tracks.new();track.name='Walk';track.strips.new('Walk',1,action);arm.animation_data.action=None
    seated_checks=[]
    for clip,duration in [('SeatDown',.65),('SeatUp',.65),('Sit',2.0)]:
        count=round(duration*30);duration=count/30

        for existing in arm.animation_data.nla_tracks:existing.mute=True
        seated=bpy.data.actions.new(clip+'__'+key);arm.animation_data.action=seated
        for frame in range(count+1):
            scene.frame_set(frame+1)
            for b in arm.pose.bones:b.rotation_euler=(0,0,0);b.location=(0,0,0);b.scale=(1,1,1)
            u=1 if clip=='Sit' else frame/count if clip=='SeatDown' else 1-frame/count
            seated_pose(arm,u,frame/count*math.pi*2)
            bpy.context.view_layer.update()
            for side,sign in [('L',1),('R',-1)]:
                foot=arm.pose.bones['foot.'+side];tr=foot.matrix@foot.bone.matrix_local.inverted()
                actual=tr@Vector((sign*.105,-.17,.01));expected=Vector((sign*.105,-.57,.01))
                assert (actual-expected).length<.002,(key,clip,frame,tuple(actual))
            for b in arm.pose.bones:
                b.keyframe_insert('rotation_euler',frame=frame+1);b.keyframe_insert('location',frame=frame+1);b.keyframe_insert('scale',frame=frame+1)
        for c in seated.fcurves:
            for k in c.keyframe_points:k.interpolation='LINEAR'
        seated_checks.append({'clip':clip,'duration':duration,'plantedFootKeyframeDriftUnderMetres':.002})
        track=arm.animation_data.nla_tracks.new();track.name=clip;track.strips.new(clip,1,seated);arm.animation_data.action=None
    checks[-1]['seating']=seated_checks
    scene.frame_start=1;scene.frame_end=61
    for existing in arm.animation_data.nla_tracks:existing.mute=False
    scene.frame_set(1);bpy.ops.object.select_all(action='DESELECT');arm.select_set(True);carrier.select_set(True);bpy.context.view_layer.objects.active=arm
    bpy.ops.export_scene.gltf(filepath=str(ROOT/'dist/assets'/('stride-'+key+'.glb')),export_format='GLB',use_selection=True,export_animations=True,export_nla_strips=True,export_anim_single_armature=False,export_anim_slide_to_zero=True,export_force_sampling=True,export_yup=True)
    bpy.data.objects.remove(carrier,do_unlink=True)
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/first_minute_motion.blend'),compress=True)
(ROOT/'evidence/first-minute-rc9/walk-contact-checks.json').write_text(json.dumps({'speedMetresPerSecond':SPEED,'durationSeconds':DURATION,'strideMetres':SPEED*DURATION,'checks':checks},indent=2))
print('COMPACT_INDOOR_STRIDES_EXPORTED',json.dumps(checks))
