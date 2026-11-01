"""Reimport/play all26 actual GLBs: eleven adult appearances plus both clinicians."""
import bpy,json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=Path(__file__).resolve().parent/'gowns-v06'
manifest=json.loads((ROOT/'dist/assets/patient-appearances.json').read_text());results={}
bpy.context.scene.render.fps=30
names=['clinician','coat']+[p['id']for p in manifest['appearances']]
for name in names:
    for suffix in ['','-lod']:
        bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
        for action in list(bpy.data.actions):bpy.data.actions.remove(action)
        bpy.ops.import_scene.gltf(filepath=str(ROOT/'dist/assets'/(name+suffix+'.glb')))
        arm=next(o for o in bpy.data.objects if o.type=='ARMATURE')
        assert len(arm.pose.bones)==39 and len(bpy.data.actions)==9
        for track in arm.animation_data.nla_tracks:track.mute=True
        arm.animation_data.action=next(a for a in bpy.data.actions if a.name.startswith('Discuss_'))
        scales=[];jaw=[];fingers=[]
        for frame in range(73):
            bpy.context.scene.frame_set(frame);bpy.context.view_layer.update()
            scales.append(max(arm.pose.bones['eyelid.L'].scale));jaw.append(arm.pose.bones['jaw'].rotation_quaternion.copy());fingers.append(arm.pose.bones['finger1.02.L'].rotation_quaternion.copy())
        jd=max(q.rotation_difference(jaw[0]).angle for q in jaw);fd=max(q.rotation_difference(fingers[0]).angle for q in fingers)
        assert max(scales)>2.4 and jd>.04 and fd>.2,(name,suffix,max(scales),jd,fd)
        arm.animation_data.action=next(a for a in bpy.data.actions if a.name.startswith('TransferOut_'))
        for frame in range(0,91,3):
            bpy.context.scene.frame_set(frame);bpy.context.view_layer.update()
            assert all(math.isfinite(v)for bone in arm.pose.bones for row in bone.matrix for v in row)
        results[name+suffix]={'bones':39,'clips':9,'blink_max_scale':max(scales),'jaw_delta_radians':jd,'distal_finger_delta_radians':fd,'TransferOut_frames_played':31}
(OUT/'roundtrip-results.json').write_text(json.dumps(results,indent=2)+'\n')
print('ALL26_ROUNDTRIP_PASS',len(results))
