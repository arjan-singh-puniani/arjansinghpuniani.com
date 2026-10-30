"""Matched-camera human asset comparison. Blender -b characters.blend --python this.py -- before|after."""
import bpy,sys
from pathlib import Path
from mathutils import Vector
OUT=Path(__file__).resolve().parent/'fidelity'; label=sys.argv[-1] if sys.argv[-1] in ['before','after'] else 'after'
scene=bpy.context.scene
for c in bpy.data.collections:c.hide_render=False;c.hide_viewport=False
for i,name in enumerate(['clinician','coat','patient']):
    arm=bpy.data.objects[name];arm.location.x=(i-1)*.72
    for track in arm.animation_data.nla_tracks:track.mute=track.name!=('Discuss' if name=='coat' else 'Idle')
scene.frame_set(1)
bpy.ops.mesh.primitive_plane_add(size=200);m=bpy.data.materials.new('Comparison floor');m.diffuse_color=(.88,.87,.84,1);bpy.context.object.data.materials.append(m)
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';scene.camera=cam
for loc,power,size in [((0,-3,5),550,4),((3,2,3),350,3)]:
    bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.data.energy=power;l.data.size=size;l.rotation_euler=(Vector((0,0,1))-l.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.render.resolution_percentage=100;scene.world.color=(.3,.3,.3)
def render(name,location,target,scale,width,height):
    cam.location=location;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale
    scene.render.resolution_x=width;scene.render.resolution_y=height;scene.render.filepath=str(OUT/(label+'-'+name+'.png'));bpy.ops.render.render(write_still=True)
render('figures',(3,-7,2.8),(0,0,.83),2.9,1200,900)
if '--figures-only' in sys.argv: raise SystemExit
for name in ['coat','patient']:bpy.data.objects[name].users_collection[0].hide_render=True
arm=bpy.data.objects['clinician'];arm.location.x=0
render('face',(0,-3,1.62),(0,-.01,1.61),.30,800,800)
render('profile',(3,-.15,1.63),(0,0,1.61),.32,800,800)
