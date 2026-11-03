"""Original diagrammatic processor asset; Blender 4+; no external models or textures."""
import bpy
import math
from pathlib import Path

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
root = Path(__file__).resolve().parents[2]

def material(name, color, metallic=0.0, roughness=0.3):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    return m

silicon = material('Sapphire schematic substrate', (0.07, 0.24, 0.3), 0.5)
metal = material('Superconducting metal schematic', (0.7, 0.77, 0.78), 0.88)
gold = material('Gold interconnect', (0.8, 0.57, 0.22), 0.85)
junction = material('Junction barrier schematic', (0.22, 0.23, 0.2), 0.2)

def block(name, pos, size, mat, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        modifier = obj.modifiers.new('Machined edges', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 2
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    return obj

block('Substrate', (0, 0, 0), (0.8, 0.66, 0.035), silicon, 0.015)
for q, x in enumerate([-0.25, 0, 0.25]):
    for side in [-1, 1]:
        block(f'Q{q} capacitive pad {side}', (x + side * 0.05, 0, 0.027), (0.073, 0.18, 0.014), metal, 0.008)
    block(f'Q{q} junction leads', (x, 0, 0.032), (0.032, 0.011, 0.008), metal)
    block(f'Q{q} Josephson junction', (x, 0, 0.039), (0.006, 0.015, 0.004), junction)
    # Meandered resonator; diagrammatic scale, not lithography.
    for k in range(6):
        yy = 0.13 + k * 0.018
        block(f'Q{q} resonator segment {k}', (x, yy, 0.027), (0.17, 0.006, 0.008), metal)
        if k < 5:
            xx = x + (0.082 if k % 2 == 0 else -0.082)
            block(f'Q{q} resonator bend {k}', (xx, yy + 0.009, 0.027), (0.006, 0.024, 0.008), metal)
    block(f'Q{q} XY line', (x, -0.19, 0.028), (0.008, 0.15, 0.01), gold)
    for k in range(8):
        xx = x - 0.09 + k * 0.025
        block(f'Q{q} bond pad {k}', (xx, -0.29, 0.028), (0.012, 0.022, 0.01), gold)
block('Capacitive coupling bus', (0, -0.11, 0.026), (0.62, 0.009, 0.01), metal)

# Merge by material for four draw calls; retain unmerged construction in this script.
for mat in [silicon, metal, gold, junction]:
    bpy.ops.object.select_all(action='DESELECT')
    objs = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.data.materials[0] == mat]
    for obj in objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    bpy.context.object.name = mat.name
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

output = root / 'public/quantum-computer-lab/processor.glb'
bpy.ops.export_scene.gltf(filepath=str(output), export_format='GLB', export_yup=True, export_cameras=False, export_lights=False)
triangles = sum(len(o.data.polygons) for o in bpy.context.scene.objects if o.type == 'MESH')
print(f'Processor: {output.stat().st_size} bytes; {triangles} polygons; four materials; no textures')
