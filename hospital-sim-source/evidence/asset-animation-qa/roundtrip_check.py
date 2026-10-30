"""Validate exported GLBs by importing and playing the actual browser assets in Blender."""
import bpy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]; OUT=Path(__file__).resolve().parent
results={}
bpy.context.scene.render.fps=30
for kind in ['clinician','coat','patient']:
    for suffix in ['','-lod']:
        bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
        for action in list(bpy.data.actions):bpy.data.actions.remove(action)
        bpy.ops.import_scene.gltf(filepath=str(ROOT/'dist/assets'/(kind+suffix+'.glb')))
        arm=next(o for o in bpy.data.objects if o.type=='ARMATURE')
        assert len(arm.pose.bones)==39 and len(bpy.data.actions)==9
        for track in arm.animation_data.nla_tracks:track.mute=True
        arm.animation_data.action=next(a for a in bpy.data.actions if a.name.startswith('Discuss_'))
        scales=[]; jaw=[]; fingers=[]
        for frame in range(73):
            bpy.context.scene.frame_set(frame)
            scales.append(max(arm.pose.bones['eyelid.L'].scale))
            jaw.append(arm.pose.bones['jaw'].rotation_quaternion.copy())
            fingers.append(arm.pose.bones['finger1.02.L'].rotation_quaternion.copy())
        jaw_delta=max(q.rotation_difference(jaw[0]).angle for q in jaw)
        finger_delta=max(q.rotation_difference(fingers[0]).angle for q in fingers)
        assert max(scales)>2.4 and jaw_delta>.04 and finger_delta>.2,(kind,suffix,max(scales),jaw_delta,finger_delta)
        results[kind+suffix]={'bones':len(arm.pose.bones),'clips':len(bpy.data.actions),
            'loaded_blink_max_scale':max(scales),'loaded_jaw_max_delta_radians':jaw_delta,
            'loaded_finger_max_delta_radians':finger_delta}
(OUT/'roundtrip-results.json').write_text(json.dumps(results,indent=2))
print('ROUNDTRIP_PASS',json.dumps(results))
