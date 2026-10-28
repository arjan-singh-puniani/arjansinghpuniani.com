"""Render the saved editable car in a neutral Cycles studio; does not alter the .blend or exports."""
import bpy,pathlib,math
from mathutils import Vector
root=pathlib.Path(__file__).resolve().parents[3]
bpy.ops.wm.open_mainfile(filepath=str(root/'assets/pit-stop/sf26-reference.blend'))
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1280;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.world.use_nodes=True;scene.world.node_tree.nodes.get('Background').inputs[0].default_value=(.14,.16,.20,1)
scene.world.node_tree.nodes.get('Background').inputs[1].default_value=.4
bpy.ops.mesh.primitive_plane_add(size=100);floor=bpy.context.object;floor.name='Preview_only_floor';floor.location.z=-.004
m=bpy.data.materials.new('Preview_floor');m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(.16,.17,.19,1);p.inputs['Roughness'].default_value=.45;floor.data.materials.append(m)
for location,power,size in [((2,1,5),1100,5),((-3,1,3),850,4),((0,-4,4),1000,3)]:
 data=bpy.data.lights.new('Preview_area','AREA');data.energy=power;data.shape='RECTANGLE';data.size=size;data.size_y=1.5
 o=bpy.data.objects.new('Preview_area',data);scene.collection.objects.link(o);o.location=location;o.rotation_euler=(Vector((0,0,.4))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(4.4,5.6,1.85));camera=bpy.context.object;camera.rotation_euler=(Vector((0,.15,.44))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=44;scene.camera=camera
scene.view_settings.view_transform='AgX'
scene.render.filepath=str(root/'assets/pit-stop/source-preview.png');scene.render.image_settings.file_format='PNG'
bpy.ops.render.render(write_still=True)
print('PIT_SOURCE_PREVIEW_COMPLETE',scene.render.filepath)
