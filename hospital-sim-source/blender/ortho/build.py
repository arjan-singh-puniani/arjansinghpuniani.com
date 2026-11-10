"""Blender 4.0.2: blender -b -t 4 --python hospital-sim-source/blender/ortho/build.py"""
from pathlib import Path
from math import atan2, cos, pi, sin, sqrt

import bmesh
import bpy

source = Path(__file__).resolve().parent
output = source.parents[2] / 'arjan-portfolio/public/hospitalsim/ortho/assets'
output.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_mesh.stl(filepath=str(source / 'FMA24474.stl'))
original = bpy.context.object

for vertex in original.data.vertices:
    x, y, z = vertex.co
    height = (z - 625) * .0118
    vertex.co = (-(x + 97) * .0118 - height * .065, height, -(y + 94) * .0118)

def cross_section(mesh, height):
    points=set()
    for e in mesh.edges:
        a,b=(mesh.vertices[i].co for i in e.vertices)
        if min(a.y,b.y)<height<=max(a.y,b.y):
            p=a.lerp(b,(height-a.y)/(b.y-a.y))
            points.add((round(p.x,6),round(p.z,6)))
    return points

def section_center(points):
    bounds=[tuple(f(p[i] for p in points) for i in range(2)) for f in (min,max)]
    return [(a+b)/2 for a,b in zip(*bounds)]

def fracture(x, z):
    return .46 * x - .23 * z + .026 * sin(x * 63 + z * 28) + .016 * sin(x * 112 - z * 71) + .024 * cos(z * 47)

def material(name, color, roughness):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get('Principled BSDF')
    node.inputs['Base Color'].default_value = mat.diffuse_color
    node.inputs['Roughness'].default_value = roughness
    return mat

materials = (
    material('Cortex', (.74, .55, .33), .58),
    material('Fracture cortex', (.68, .46, .24), .81),
    material('Trabecular surface', (.37, .15, .071), .94),
    material('Canal recess', (.15, .05, .026), .97),
)

for name, proximal in [('Proximal', True), ('Distal', False)]:
    bm = bmesh.new()
    bm.from_mesh(original.data)
    for vert in bm.verts:
        vert.co.y -= fracture(vert.co.x, vert.co.z)
    bmesh.ops.bisect_plane(bm, geom=[*bm.verts,*bm.edges,*bm.faces],
        dist=.000001, plane_co=(0,0,0), plane_no=(0,1,0),
        clear_inner=proximal, clear_outer=not proximal)
    rim = {v for e in bm.edges if e.is_boundary for v in e.verts}
    assert len(rim) >= 16, f'Incomplete fracture rim on {name}'
    cx = sum(v.co.x for v in rim)/len(rim)
    cz = sum(v.co.z for v in rim)/len(rim)
    edge = sorted(rim, key=lambda v: atan2(v.co.z-cz,v.co.x-cx))
    for v in bm.verts:
        v.co.y += fracture(v.co.x,v.co.z)
    for face in bm.faces:
        face.smooth = True
    previous = edge
    for scale, recess, index in ((.77,.014,1),(.44,.035,2),(.29,.076,3)):
        ring=[]
        for v in edge:
            x, z = cx+(v.co.x-cx)*scale, cz+(v.co.z-cz)*scale
            y = fracture(x,z) + (1 if proximal else -1)*(recess+.010*sin(x*94+z*101))
            ring.append(bm.verts.new((x,y,z)))
        for i, v in enumerate(previous):
            j=(i+1)%len(previous)
            bm.faces.new([v,previous[j],ring[j],ring[i]]).material_index=index
        previous=ring
    center=bm.verts.new((cx,.12 if proximal else -.12,cz))
    for i,v in enumerate(previous):
        bm.faces.new([v,previous[(i+1)%len(previous)],center]).material_index=3
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    mesh=bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj=bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    for mat in materials:
        mesh.materials.append(mat)
    if not proximal:
        # Intersect the same exported mesh at the clamp's axial station.
        grip_y=-.46
        edges=cross_section(mesh,grip_y)
        cx,cz=section_center(edges)
        contour=sorted((atan2(z-cz,x-cx),sqrt((x-cx)**2+(z-cz)**2)) for x,z in edges)
        contour=[(contour[-1][0]-2*pi,contour[-1][1]),*contour,(contour[0][0]+2*pi,contour[0][1])]
        radii=[]
        for i in range(64):
            angle=2*pi*i/64-pi
            (a,r),(b,t)=next((v,w) for v,w in zip(contour,contour[1:]) if v[0]<=angle<=w[0])
            radii.append(round(r+(t-r)*(angle-a)/(b-a),5))
        obj['gripCenter']=[cx,grip_y,cz]
        obj['gripRadii']=radii
        samples=[-2.12,-1.88,-1.55,-1.24,-.9,-.58,-.28,0,.31,.68,1.03,1.31,1.55,1.78,1.99]
        canal=[]
        for height in samples:
            x,z=section_center(cross_section(original.data,height))
            canal.extend([x,height,z])
        obj['canal']=canal

bpy.data.objects.remove(original,do_unlink=True)
# Export with the game coordinates unchanged. The editable source uses the same axes.
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(source/'femur.blend'))
bpy.ops.export_scene.gltf(filepath=str(output/'femur.glb'),export_yup=False,export_extras=True)
