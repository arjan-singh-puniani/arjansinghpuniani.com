"""Check revised source poses against retained meshes before expensive export."""
import bpy,sys,importlib.util,json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('character_source',ROOT/'blender/characters.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
for c in bpy.data.collections:c.hide_viewport=False
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
arm,mesh=module.character('patient',module.PATIENT_PROFILES[0])
for t in arm.animation_data.nla_tracks:t.mute=True
arm.animation_data.action=None;bpy.context.view_layer.update()
samples=[]
for frame in range(1,92):
    u=(frame-1)/90
    for bone in arm.pose.bones:bone.rotation_mode='XYZ';bone.rotation_euler=(0,0,0);bone.location=(0,0,0);bone.scale=(1,1,1)
    module.apply_transfer(arm,u);arm.pose.bones['spine'].rotation_euler.x+=.006*math.sin(2*math.pi*u)
    bpy.context.view_layer.update()
    ev=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());data=ev.to_mesh()
    inside=[(i,v.co.z)for i,v in enumerate(data.vertices)if -1.36<v.co.x<.46 and .19<v.co.y<.91]
    worst=min(inside,key=lambda p:p[1])if inside else(0,.74)
    samples.append({'frame':frame,'intrusion':max(0,.74-worst[1]),'vertex':worst[0],'actual':list(data.vertices[worst[0]].co),'ankle_R':list(arm.pose.bones['foot.R'].head)})
    ev.to_mesh_clear()
worst=max(samples,key=lambda p:p['intrusion']);print('PROBE',json.dumps(worst))
vertex=mesh.data.vertices[worst['vertex']]
print('GROUPS',[(mesh.vertex_groups[g.group].name,g.weight)for g in vertex.groups],'REST',list(vertex.co))
(Path(__file__).resolve().parent/'gowns-v06'/'probe.json').write_text(json.dumps({'worst':worst,'samples':samples},indent=2))
assert worst['intrusion']<.015,worst
if '--render'in sys.argv or '--rear'in sys.argv:
    from mathutils import Vector
    rear='--rear'in sys.argv
    for t in arm.animation_data.nla_tracks:t.mute=t.name!=('Idle'if rear else'TransferIn')
    bpy.context.scene.frame_set(1 if rear else 19);bpy.context.view_layer.update()
    if not rear:bpy.ops.mesh.primitive_cube_add(size=1,location=(-.45,.55,.68));bpy.context.object.scale=(1.9,.8,.12)
    bpy.ops.object.camera_add();camera=bpy.context.object;target=Vector((-.4,.3,.9));camera.location=target+Vector((3,-4,2.1));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=2.7
    scene=bpy.context.scene;scene.camera=camera;scene.render.engine='CYCLES';scene.cycles.samples=8;scene.render.resolution_x=720;scene.render.resolution_y=540;scene.render.resolution_percentage=100;scene.world.color=(.6,.6,.6)
    if rear:
        target=Vector((0,0,1));camera.location=target+Vector((1,4,.4));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=1.4
        scene.render.resolution_x=460;scene.render.resolution_y=720;scene.cycles.samples=4;scene.cycles.use_denoising=True
    bpy.ops.object.light_add(type='AREA',location=(1,-3,5));bpy.context.object.data.energy=700;bpy.context.object.data.size=4
    scene.render.filepath=str(Path(__file__).resolve().parent/'gowns-v06'/('wardrobe-rear-probe.png'if rear else'wardrobe-probe.png'));bpy.ops.render.render(write_still=True)
