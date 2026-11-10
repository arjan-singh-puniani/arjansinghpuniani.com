"""Build the shared posed instrument glove in the clamp's local coordinates."""
from math import cos, pi, sin
from pathlib import Path

import bpy
from mathutils import Vector
from mathutils.geometry import interpolate_bezier

source = Path(__file__).resolve().parent
out = source.parents[2] / 'arjan-portfolio/public/hospitalsim/ortho/assets/glove.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)

def loft(name, rings):
    vertices, faces = [], []
    sides = 16
    for i, (center, wide, thick) in enumerate(rings):
        tangent = (rings[min(i+1,len(rings)-1)][0] - rings[max(0,i-1)][0]).normalized()
        across = Vector((0,1,0))
        across = (across - tangent * across.dot(tangent)).normalized()
        depth = tangent.cross(across)
        for j in range(sides):
            t = j * 2*pi / sides
            vertices.append(center + across * (wide*cos(t)) + depth * (thick*sin(t)))
        if i:
            for j in range(sides):
                a = (i-1)*sides+j
                b = (i-1)*sides+(j+1)%sides
                faces.append((a,b,b+sides,a+sides))
    faces += [tuple(reversed(range(sides))),tuple(range(len(vertices)-sides,len(vertices)))]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    obj.select_set(True)
    return obj

palm = loft('Palm and wrist',[
    (Vector((x,y,z)),w,h) for x,y,z,w,h in [
        (1.235,-.008,.186,.082,.041),(1.29,.000,.207,.112,.065),
        (1.37,.009,.219,.120,.071),(1.48,.001,.222,.115,.066),
        (1.59,-.015,.212,.093,.052),(1.69,-.028,.196,.072,.047),
        (1.82,-.036,.188,.069,.048)]
])

def finger(name, path, width):
    points=interpolate_bezier(*(Vector(p) for p in path),13)
    rings=[]
    for i,p in enumerate(points):
        t=i/(len(points)-1)
        # The base is full, the knuckles interrupt the taper, and the tip rounds off.
        size=width*(1-.24*t+.075*cos(t*5*pi))
        if t>.84:
            size*=max(.08,(1-((t-.84)/.17)**2)**.5)
        rings.append((p,size,size*.88))
    loft(name,rings)

for i,(y,reach,r) in enumerate([
    (.079,1.097,.032),(.026,1.065,.034),(-.031,1.093,.032),(-.078,1.155,.028)
]):
    finger(('Index','Middle','Ring','Little')[i],[
        (1.37,y,.207),(1.18,y-.011,.257),(reach,y-.016,.186),(reach+.055,y-.023,.098+.012*i)
    ],r)

finger('Thumb',[
    (1.45,.072,.190),(1.39,.180,.143),(1.25,.173,.140),(1.168,.099,.094)
],.039)

bpy.context.view_layer.objects.active = palm
bpy.ops.object.join()
palm.name='Instrument grip'
for poly in palm.data.polygons:
    poly.use_smooth=True
mod=palm.modifiers.new('Continuous nitrile surface','REMESH')
mod.mode='VOXEL'
mod.voxel_size=.006
bpy.ops.object.modifier_apply(modifier=mod.name)
mod=palm.modifiers.new('Soften the knuckles','SMOOTH')
mod.factor=.75
mod.iterations=4
bpy.ops.object.modifier_apply(modifier=mod.name)
mod=palm.modifiers.new('Browser mesh','DECIMATE')
mod.ratio=.37
bpy.ops.object.modifier_apply(modifier=mod.name)
for poly in palm.data.polygons:
    poly.use_smooth=True
material=bpy.data.materials.new('Matte blue nitrile')
material.diffuse_color=(.026,.222,.355,1)
material.use_nodes=True
surface=material.node_tree.nodes.get('Principled BSDF')
surface.inputs['Base Color'].default_value=material.diffuse_color
surface.inputs['Roughness'].default_value=.65
palm.data.materials.append(material)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(source/'glove.blend'))
bpy.ops.export_scene.gltf(filepath=str(out),export_yup=False)
