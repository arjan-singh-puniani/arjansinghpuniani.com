"""Create a deterministic seven-shot 3D Blender film scene and preview frames."""

from pathlib import Path
from math import cos, sin, tau
import random
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/agent-orange"
RENDERS = OUT / "renders/film-preview"
FPS = 24
SHOT = 15 * FPS
END = 7 * SHOT


def mat(name, color, metallic=0.0, rough=0.42, emission=0.0):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*color, 1)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = rough
    if emission:
        shader.inputs["Emission Color"].default_value = (*color, 1)
        shader.inputs["Emission Strength"].default_value = emission
    return material


def sphere(name, location, scale, material, segments=32):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=max(16, segments // 2), location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(material)
    for face in obj.data.polygons:
        face.use_smooth = True
    return obj


def curve(name, points, material, radius=0.04, resolution=12):
    data = bpy.data.curves.new(name, "CURVE")
    data.dimensions = "3D"
    data.resolution_u = 16
    data.bevel_depth = radius
    data.bevel_resolution = 4
    spline = data.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point, co in zip(spline.bezier_points, points):
        point.co = co
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    return obj


def cube(name, location, scale, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    return obj


def window(obj, start, end):
    obj["shot_start"] = int(start)
    obj["shot_end"] = int(end)
    obj.hide_render = False
    return obj


def set_shot_visibility(frame):
    for obj in bpy.context.scene.objects:
        if "shot_start" in obj:
            obj.hide_render = not (obj["shot_start"] <= frame <= obj["shot_end"])


def import_group(slug, offset=(0, 0, 0), scale=1.0, start=1, end=END):
    before = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(OUT / f"{slug}-pubchem.glb"))
    objects = list(set(bpy.context.scene.objects) - before)
    for obj in objects:
        obj.location += Vector(offset)
        obj.scale *= scale
        window(obj, start, end)
    return objects


def caption(camera, body, start, end, color=(0.92, 0.88, 0.79)):
    data = bpy.data.curves.new("Shot caption", "FONT")
    data.body = body
    data.size = 0.19 if start == 1 else 0.13
    data.extrude = 0
    data.align_x = "LEFT"
    obj = bpy.data.objects.new(f"Caption {start}", data)
    bpy.context.collection.objects.link(obj)
    obj.parent = camera
    obj.location = (-2.8, -1.1, -8.5)
    obj.data.materials.append(mat(f"Caption {start} material", color, emission=0.25))
    window(obj, start, end)
    return obj


def animate(obj, prop, values):
    for frame, value in values:
        setattr(obj, prop, value)
        obj.keyframe_insert(data_path=prop, frame=frame)
    return obj


def main():
    OUT.mkdir(exist_ok=True)
    RENDERS.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in bpy.data.materials:
        bpy.data.materials.remove(block)

    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 8
    scene.cycles.use_denoising = True
    scene.cycles.device = "CPU"
    scene.render.resolution_x, scene.render.resolution_y = 720, 405
    scene.render.resolution_percentage = 100
    scene.render.fps = FPS
    scene.frame_start, scene.frame_end = 1, END
    scene.view_settings.view_transform = "AgX"
    scene.render.image_settings.file_format = "PNG"
    scene.render.threads_mode = "FIXED"
    scene.render.threads = 8
    world = bpy.data.worlds.new("Long Shadow · charcoal")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.007, 0.012, 0.021, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.22
    scene.world = world

    for name, location, energy, color, size in [
        ("Warm key", (0, -5, 8), 620, (1.0, 0.83, 0.67), 8),
        ("Cool fill", (6, 3, 5), 520, (0.60, 0.77, 1.0), 7),
        ("Amber rim", (-5, 3, 2), 580, (1.0, 0.55, 0.28), 5),
    ]:
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.name = name
        light.data.energy = energy
        light.data.color = color
        light.data.shape = "DISK"
        light.data.size = size
        light.rotation_euler = (Vector((0, 0, 0)) - light.location).to_track_quat("-Z", "Y").to_euler()

    palette = {
        "amber": mat("Dopamine · amber", (0.95, 0.48, 0.13), emission=0.28),
        "cyan": mat("Atlas · cyan", (0.20, 0.61, 0.68), metallic=0.08),
        "blue": mat("Atlas · blue", (0.37, 0.47, 0.69), metallic=0.05),
        "tissue": mat("Neuron · tissue", (0.62, 0.38, 0.35), rough=0.52),
        "membrane": mat("Mitochondrion · membrane", (0.58, 0.29, 0.18), metallic=0.05),
        "gold": mat("Evidence · gold", (0.88, 0.68, 0.33), metallic=0.16),
        "white": mat("Typography · ivory", (0.90, 0.88, 0.80), emission=0.2),
        "land": mat("Illustration · terrain", (0.10, 0.20, 0.16), rough=0.9),
        "mist": mat("Illustration · spray", (0.72, 0.82, 0.81), emission=0.12),
        "red": mat("Evidence · red", (0.77, 0.18, 0.15), emission=0.12),
    }

    # Shot 1: C-123 Provider silhouette, based on USAF/National Museum photo records.
    start, end = 1, SHOT
    ground_mat = mat("Jungle canopy · ground", (0.025, 0.065, 0.045), rough=0.94)
    canopy_mats = [mat(f"Jungle canopy · {i}", color, rough=0.96) for i, color in enumerate(
        ((0.035, 0.095, 0.055), (0.05, 0.12, 0.07), (0.025, 0.075, 0.06))
    )]
    aircraft_mat = mat("C-123 reconstruction · muted gray green", (0.08, 0.13, 0.11), rough=0.56)
    glass_mat = mat("Aircraft cockpit glazing", (0.025, 0.055, 0.065), metallic=0.15, rough=0.22)
    metal_mat = mat("Aircraft propeller and gear", (0.07, 0.09, 0.09), metallic=0.55, rough=0.32)
    ground = cube("Illustrative forest terrain", (0, 0, -1.3), (20, 20, 0.3), ground_mat)
    window(ground, start, end)

    # Procedural broadleaf crowns and trunks provide forest depth without implying a mapped site.
    rng = random.Random(1967)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1)
    prototype = bpy.context.object
    base_vertices = [tuple(vertex.co) for vertex in prototype.data.vertices]
    base_faces = [tuple(poly.vertices) for poly in prototype.data.polygons]
    bpy.data.objects.remove(prototype, do_unlink=True)
    bark_mat = mat("Jungle canopy · trunk", (0.07, 0.055, 0.035), rough=1.0)
    canopy_vertices, canopy_faces, canopy_materials = [], [], []
    for i in range(400):
        x, y = rng.uniform(-9.5, 9.5), rng.uniform(-9.5, 9.5)
        size = rng.uniform(0.55, 0.82)
        trunk_height = rng.uniform(0.52, 0.82)
        trunk_base = len(canopy_vertices)
        for z, radius in ((-1.16, size * 0.075), (-1.16 + trunk_height, size * 0.045)):
            canopy_vertices.extend((x + radius * cos(a * tau / 7),
                                    y + radius * sin(a * tau / 7), z)
                                   for a in range(7))
        for side in range(7):
            canopy_faces.append((trunk_base + side, trunk_base + (side + 1) % 7,
                                 trunk_base + 7 + (side + 1) % 7, trunk_base + 7 + side))
            canopy_materials.append(len(canopy_mats))
        for lobe in range(4):
            scale = (size * rng.uniform(0.46, 0.63), size * rng.uniform(0.46, 0.62),
                     size * rng.uniform(0.44, 0.65))
            offset = (x + rng.uniform(-0.30, 0.30) * size,
                      y + rng.uniform(-0.30, 0.30) * size,
                      -1.16 + trunk_height + rng.uniform(0.03, 0.18) * size)
            vertex_offset = len(canopy_vertices)
            canopy_vertices.extend((offset[0] + v[0] * scale[0],
                                    offset[1] + v[1] * scale[1],
                                    offset[2] + v[2] * scale[2]) for v in base_vertices)
            canopy_faces.extend(tuple(vertex_offset + index for index in face) for face in base_faces)
            canopy_materials.extend([(i + lobe) % len(canopy_mats)] * len(base_faces))
    canopy_mesh = bpy.data.meshes.new("Procedural broadleaf canopy mesh")
    canopy_mesh.from_pydata(canopy_vertices, [], canopy_faces)
    canopy_mesh.materials.clear()
    for material in canopy_mats:
        canopy_mesh.materials.append(material)
    canopy_mesh.materials.append(bark_mat)
    for polygon, material_index in zip(canopy_mesh.polygons, canopy_materials):
        polygon.material_index = material_index
        polygon.use_smooth = True
    canopy = bpy.data.objects.new("Illustrative broadleaf forest canopy", canopy_mesh)
    bpy.context.collection.objects.link(canopy)
    window(canopy, start, end)

    # A simplified transport-aircraft form: boxy cargo fuselage, high wing, twin engines and props.
    fuselage = sphere("C-123 fuselage · illustrative", (-4, 0, 0.84), (2.0, 0.44, 0.45), aircraft_mat, 40)
    wing_vertices = []
    wing_faces = []
    for side in (-1, 1):
        points = [(-4.95, 0, 1.18), (-3.35, 0, 1.18),
                  (-3.85, side * 3.7, 1.10), (-4.55, side * 3.7, 1.10)]
        base = len(wing_vertices)
        wing_vertices.extend(points + [(x, y, z - 0.08) for x, y, z in points])
        wing_faces.extend(((base, base + 1, base + 2, base + 3),
                           (base + 7, base + 6, base + 5, base + 4),
                           (base, base + 4, base + 5, base + 1),
                           (base + 1, base + 5, base + 6, base + 2),
                           (base + 2, base + 6, base + 7, base + 3),
                           (base + 3, base + 7, base + 4, base)))
    wing_mesh = bpy.data.meshes.new("Tapered high wing mesh")
    wing_mesh.from_pydata(wing_vertices, [], wing_faces)
    wing_mesh.materials.append(aircraft_mat)
    wing = bpy.data.objects.new("C-123 tapered high wing · illustrative", wing_mesh)
    bpy.context.collection.objects.link(wing)
    tailplane = cube("C-123 tailplane · illustrative", (-5.6, 0, 1.0), (0.8, 2.1, 0.1), aircraft_mat)
    fin = cube("C-123 vertical tail · illustrative", (-5.65, 0, 1.33), (0.78, 0.12, 0.82), aircraft_mat)
    nose = sphere("C-123 rounded nose · illustrative", (-2.18, 0, 0.84), (0.46, 0.34, 0.31), aircraft_mat, 24)
    cockpit = [sphere(f"Cockpit window {i+1}", (-2.45 + i * 0.22, -0.367, 1.04),
                      (0.09, 0.025, 0.085), glass_mat, 12) for i in range(3)]
    aircraft = [fuselage, wing, tailplane, fin, nose, *cockpit]
    for side in (-1, 1):
        engine = sphere(f"Twin engine nacelle {side}", (-4.05, side * 1.55, 1.0),
                        (0.58, 0.31, 0.29), aircraft_mat, 24)
        hub = sphere(f"Propeller hub {side}", (-3.42, side * 1.55, 1.0),
                     (0.1, 0.11, 0.11), metal_mat, 16)
        blade_a = cube(f"Propeller blade A {side}", (-3.34, side * 1.55, 1.0),
                       (0.045, 0.07, 0.62), metal_mat)
        blade_b = cube(f"Propeller blade B {side}", (-3.34, side * 1.55, 1.0),
                       (0.045, 0.62, 0.07), metal_mat)
        for blade in (blade_a, blade_b):
            initial_rotation = blade.rotation_euler.copy()
            final_rotation = initial_rotation.copy()
            final_rotation.x += tau * 10
            animate(blade, "rotation_euler", [
                (start, initial_rotation),
                (end - 1, final_rotation),
            ])
        aircraft.extend((engine, hub, blade_a, blade_b))
    # Landing gear and spray booms are visible at the low flight angle.
    for x, y in ((-4.9, -0.38), (-4.9, 0.38), (-2.7, 0)):
        gear = cube(f"Landing gear strut {x}-{y}", (x, y, 0.18), (0.08, 0.08, 0.52), metal_mat)
        wheel = sphere(f"Landing wheel {x}-{y}", (x, y, -0.1), (0.12, 0.08, 0.12), metal_mat, 16)
        aircraft.extend((gear, wheel))
    for side in (-1, 1):
        boom = cube(f"Herbicide spray boom {side}", (-4.05, side * 2.75, 0.82),
                    (0.07, 1.15, 0.07), metal_mat)
        aircraft.append(boom)
    for obj in aircraft:
        window(obj, start, end)
        animate(obj, "location", [(start, obj.location.copy()), (end - 1, obj.location + Vector((8, 0.3, 0)))])
    spray_mat = bpy.data.materials.new("Illustrative herbicide aerosol · procedural volume")
    spray_mat.use_nodes = True
    nodes = spray_mat.node_tree.nodes
    nodes.clear()
    volume_out = nodes.new("ShaderNodeOutputMaterial")
    volume_shader = nodes.new("ShaderNodeVolumePrincipled")
    volume_shader.inputs["Color"].default_value = (0.72, 0.79, 0.73, 1)
    volume_shader.inputs["Anisotropy"].default_value = 0.32
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 2.4
    noise.inputs["Detail"].default_value = 3.2
    density = nodes.new("ShaderNodeValToRGB")
    density.color_ramp.elements[0].position = 0.28
    density.color_ramp.elements[0].color = (0.02, 0.02, 0.02, 1)
    density.color_ramp.elements[1].position = 0.76
    density.color_ramp.elements[1].color = (0.34, 0.34, 0.34, 1)
    links = spray_mat.node_tree.links
    links.new(noise.outputs["Fac"], density.inputs["Fac"])
    links.new(density.outputs["Color"], volume_shader.inputs["Density"])
    links.new(volume_shader.outputs["Volume"], volume_out.inputs["Volume"])
    spray = []
    for i in range(5):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8,
                                            location=(-4.55 - i * 0.18, (i - 2) * 0.4, 0.22 - i * 0.29))
        plume = bpy.context.object
        plume.name = f"Illustrative spray aerosol plume {i+1}"
        plume.scale = (0.8 + i * 0.1, 0.28, 0.42)
        plume.data.materials.append(spray_mat)
        spray.append(window(plume, start, end))
        animate(plume, "location", [(start, plume.location.copy()),
                                     (end - 1, plume.location + Vector((2.5, 0, -0.8)))])

    # Shot 2: three validated PubChem conformers remain visually separate.
    shot2a, shot2b = SHOT + 1, 2 * SHOT
    import_group("2-4-d", (-3.6, 0, 0), 0.36, shot2a, shot2b)
    import_group("2-4-5-t", (0, 0, 0), 0.36, shot2a, shot2b)
    import_group("tcdd", (3.6, 0, 0), 0.36, shot2a, shot2b)

    # Shot 3: actual CIT168 MNI subcortical template surfaces.
    shot3a, shot3b = 2 * SHOT + 1, 3 * SHOT
    before = set(scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(OUT / "cit168-subcortical.glb"))
    atlas_objects = list(set(scene.objects) - before)
    for obj in atlas_objects:
        obj.scale *= 0.7
        window(obj, shot3a, shot3b)

    # Shot 4: educational cell illustration, not an observed exposure pathway.
    shot4a, shot4b = 3 * SHOT + 1, 4 * SHOT
    soma = sphere("Dopaminergic neuron soma", (0, 0, 0), (1.15, 0.9, 0.8), palette["tissue"], 48)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -0.72, 0))
    soma_cutter = bpy.context.object
    soma_cutter.dimensions = (1.55, 0.9, 1.25)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    soma_window = soma_cutter.modifiers.new("Rounded cell-body window", "BEVEL")
    soma_window.width = 0.18
    soma_window.segments = 5
    bpy.context.view_layer.objects.active = soma_cutter
    bpy.ops.object.modifier_apply(modifier=soma_window.name)
    soma_boolean = soma.modifiers.new("Open soma section", "BOOLEAN")
    soma_boolean.operation = "DIFFERENCE"
    soma_boolean.object = soma_cutter
    bpy.context.view_layer.objects.active = soma
    bpy.ops.object.modifier_apply(modifier=soma_boolean.name)
    bpy.data.objects.remove(soma_cutter, do_unlink=True)
    soma_rim = soma.modifiers.new("Soft section rim", "BEVEL")
    soma_rim.width = 0.035
    soma_rim.segments = 3
    soma_shell = soma.modifiers.new("Cell membrane thickness", "SOLIDIFY")
    soma_shell.thickness = 0.09
    nucleus = sphere("Nucleus", (0.12, 0.05, 0.16), (0.43, 0.38, 0.32), palette["blue"])
    neuron = [soma, nucleus]
    neuron += [curve("Dendrite · primary superior", [(0, 0.2, 0.3), (-1.5, 1.1, 0.5), (-2.8, 1.7, 0.5)], palette["tissue"], 0.12),
               curve("Dendrite · superior branch A", [(-1.25, 1.0, 0.48), (-1.8, 1.75, 0.5), (-2.25, 2.4, 0.35)], palette["tissue"], 0.065),
               curve("Dendrite · superior branch B", [(-1.65, 1.2, 0.5), (-2.2, 1.2, 0.42), (-2.8, 1.0, 0.32)], palette["tissue"], 0.05),
               curve("Dendrite · primary lateral", [(-0.3, 0.1, 0.3), (-1.7, -0.7, 0.4), (-2.6, -1.5, 0.2)], palette["tissue"], 0.1),
               curve("Dendrite · lateral branch A", [(-1.3, -0.45, 0.37), (-1.55, -1.1, 0.3), (-1.9, -1.9, 0.15)], palette["tissue"], 0.06),
               curve("Dendrite · lateral branch B", [(-1.75, -0.7, 0.4), (-2.25, -0.45, 0.3), (-2.8, -0.35, 0.18)], palette["tissue"], 0.05),
               curve("Dendrite · basal", [(0, -0.35, 0.1), (0.5, -1.3, 0.25), (1.3, -2.2, 0.25)], palette["tissue"], 0.085),
               curve("Axon", [(0.85, 0, -0.1), (2.1, 0, -0.2), (3.4, 0.15, -0.35), (4.4, 0.1, -0.35)], palette["amber"], 0.07)]
    for index in range(5):
        x = 1.35 + index * 0.5
        myelin = sphere(f"Myelin segment {index+1}", (x, 0.02, -0.18 - index * 0.025), (0.24, 0.13, 0.13), palette["cyan"], 20)
        neuron.append(myelin)
    neuron.extend([sphere("Intracellular mitochondrion A", (-0.35, 0.08, 0.22), (0.25, 0.14, 0.13), palette["membrane"], 20), sphere("Intracellular mitochondrion B", (0.25, -0.2, 0.35), (0.18, 0.12, 0.1), palette["gold"], 20)])
    for index, pos in enumerate(((4.2, 0.55, -0.35), (4.5, -0.35, -0.35), (4.7, 0.15, 0.05))):
        neuron.append(sphere(f"Axon terminal {index+1}", pos, (0.2, 0.18, 0.17), palette["amber"], 20))
        for vesicle in range(7):
            vx = pos[0] + 0.105 * ((vesicle % 3) - 1)
            vy = pos[1] + 0.09 * (1 if vesicle % 2 else -1)
            vz = pos[2] + 0.09 * ((vesicle % 3) - 1)
            neuron.append(sphere(f"Synaptic vesicle {index+1}-{vesicle+1}", (vx, vy, vz), (0.05, 0.05, 0.05), palette["gold"], 12))
    for obj in neuron:
        window(obj, shot4a, shot4b)

    # Shot 5: mitochondrial structure and a clearly qualified candidate mechanism.
    shot5a, shot5b = 4 * SHOT + 1, 5 * SHOT
    mito = sphere("Mitochondrial outer membrane", (0, 0, 0), (2.2, 1.05, 0.88), palette["membrane"], 56)
    mitochondria = [mito]
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 1.0))
    cutter = bpy.context.object
    cutter.name = "Temporary cutaway tool"
    cutter.dimensions = (3.1, 1.55, 2.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    cutter_bevel = cutter.modifiers.new("Rounded membrane window", "BEVEL")
    cutter_bevel.width = 0.2
    cutter_bevel.segments = 5
    bpy.context.view_layer.objects.active = cutter
    bpy.ops.object.modifier_apply(modifier=cutter_bevel.name)
    boolean = mito.modifiers.new("Open membrane cutaway", "BOOLEAN")
    boolean.operation = "DIFFERENCE"
    boolean.object = cutter
    bpy.context.view_layer.objects.active = mito
    bpy.ops.object.modifier_apply(modifier=boolean.name)
    bpy.data.objects.remove(cutter, do_unlink=True)
    shell = mito.modifiers.new("Membrane thickness", "SOLIDIFY")
    shell.thickness = 0.07
    matrix = sphere("Mitochondrial matrix · cutaway", (0, 0, 0), (1.98, 0.88, 0.72), palette["tissue"], 48)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.8))
    matrix_cutter = bpy.context.object
    matrix_cutter.dimensions = (2.7, 1.15, 1.6)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    matrix_bevel = matrix_cutter.modifiers.new("Rounded matrix window", "BEVEL")
    matrix_bevel.width = 0.18
    matrix_bevel.segments = 5
    bpy.context.view_layer.objects.active = matrix_cutter
    bpy.ops.object.modifier_apply(modifier=matrix_bevel.name)
    matrix_boolean = matrix.modifiers.new("Matrix section", "BOOLEAN")
    matrix_boolean.operation = "DIFFERENCE"
    matrix_boolean.object = matrix_cutter
    bpy.context.view_layer.objects.active = matrix
    bpy.ops.object.modifier_apply(modifier=matrix_boolean.name)
    bpy.data.objects.remove(matrix_cutter, do_unlink=True)
    mitochondria.append(matrix)
    for i in range(6):
        y = -0.72 + i * 0.29
        mitochondria.append(curve(f"Mitochondrial crista {i+1}", [(-1.7, y, 0.08), (-1.25, y + 0.1, 0.42), (-0.8, y, 0.2), (-0.35, y + 0.1, 0.49), (0.1, y, 0.2), (0.55, y + 0.1, 0.46), (1.0, y, 0.18), (1.45, y + 0.08, 0.38), (1.7, y, 0.08)], palette["gold"], 0.055))
    for i in range(8):
        x = ((i * 37) % 50) / 35 - 0.7
        y = ((i * 19) % 40) / 45 - 0.4
        mitochondria.append(sphere(f"Candidate stress marker {i+1:02d}", (x, y, 0.24), (0.035, 0.035, 0.035), palette["red"], 12))
    for obj in mitochondria:
        window(obj, shot5a, shot5b)

    # Shot 6: pathway and degeneration are an established disease context, not this cohort's imaging.
    shot6a, shot6b = 5 * SHOT + 1, 6 * SHOT
    striatum = sphere("Dorsal striatum · schematic", (2, 0, 0), (1.5, 1.2, 0.55), palette["cyan"])
    sn = sphere("Substantia nigra · schematic", (-2, 0, 0), (0.55, 0.45, 0.35), palette["amber"])
    projection = curve("Nigrostriatal projection · schematic", [(-1.5, 0, 0), (-0.6, 0.35, 0.12), (0.2, 0.2, 0), (1, 0, 0)], palette["amber"], 0.065)
    faded = []
    for i in range(14):
        x = -1.1 + i * 0.16
        bead = sphere(f"Dopamine marker {i+1:02d}", (x, 0, 0.1), (0.06, 0.06, 0.06), palette["gold"], 12)
        faded.append(bead)
        animate(bead, "scale", [(shot6a, (0.06, 0.06, 0.06)), (shot6b - 1, (0.004, 0.004, 0.004))])
    for obj in [striatum, sn, projection, *faded]:
        window(obj, shot6a, shot6b)

    # Shot 7: evidence chart uses reported adjusted hazard ratios and confidence intervals.
    shot7a, shot7b = 6 * SHOT + 1, END + 2
    scale = 2.3
    axis = cube("Hazard ratio axis", (1.5, 0, -1.2), (4.1, 0.05, 0.05), palette["white"])
    reference = cube("Null reference HR 1.0", (0, 0, 0), (0.05, 0.05, 1.4), palette["red"])
    stat_objects = [axis, reference]
    for row, estimate, low, high, color in [
        (0.55, 1.44, 1.37, 1.52, palette["gold"]),
        (-0.35, 1.99, 1.71, 2.32, palette["amber"]),
    ]:
        left = (low - 1) * scale
        right = (high - 1) * scale
        center = (estimate - 1) * scale
        stat_objects.append(cube(f"{estimate:.2f} confidence interval", ((left + right) / 2, 0, row), (right - left, 0.06, 0.06), color))
        stat_objects.append(cube(f"{estimate:.2f} CI lower cap", (left, 0, row), (0.06, 0.06, 0.28), color))
        stat_objects.append(cube(f"{estimate:.2f} CI upper cap", (right, 0, row), (0.06, 0.06, 0.28), color))
        stat_objects.append(sphere(f"Adjusted HR {estimate:.2f}", (center, 0, row), (0.13, 0.13, 0.13), color, 20))
    for z, label, estimate, low, high in [
        (0.55, "ALL REPORTED EXPOSURE", 1.44, 1.37, 1.52),
        (-0.35, "DIRECT / OCCUPATIONAL", 1.99, 1.71, 2.32),
    ]:
        data = bpy.data.curves.new("Evidence label", "FONT")
        data.body = f"{label}\n{estimate:.2f}  (95% CI {low:.2f}–{high:.2f})"
        data.size = 0.14
        label_obj = bpy.data.objects.new(f"{label} evidence label", data)
        bpy.context.collection.objects.link(label_obj)
        label_obj.location = (-4.35, -0.2, z)
        label_obj.rotation_euler.x = 1.57079632679
        label_obj.data.materials.append(palette["white"])
        stat_objects.append(label_obj)
    for value in (1.0, 1.5, 2.0, 2.5):
        x = (value - 1) * scale
        tick = cube(f"HR {value:.1f} axis tick", (x, 0, -1.2), (0.035, 0.07, 0.16), palette["white"])
        data = bpy.data.curves.new("Hazard ratio tick label", "FONT")
        data.body = f"{value:.1f}"
        data.size = 0.14
        label_obj = bpy.data.objects.new(f"HR {value:.1f} tick label", data)
        bpy.context.collection.objects.link(label_obj)
        label_obj.location = (x - 0.14, -0.2, -1.48)
        label_obj.rotation_euler.x = 1.57079632679
        label_obj.data.materials.append(palette["white"])
        stat_objects.extend((tick, label_obj))
    for obj in stat_objects:
        window(obj, shot7a, shot7b)

    bpy.ops.object.camera_add(location=(0, -9, 5))
    camera = bpy.context.object
    camera.name = "Cinematic camera"
    camera.data.lens = 48
    scene.camera = camera
    for x, label, formula in [(-2.45, "2,4-D", "C8H6Cl2O3"), (-0.55, "2,4,5-T", "C8H5Cl3O3"), (1.5, "TCDD", "C12H4Cl4O2")]:
        data = bpy.data.curves.new(f"{label} label", "FONT")
        data.body = f"{label} · {formula}"
        data.size = 0.14
        obj = bpy.data.objects.new(f"{label} label", data)
        bpy.context.collection.objects.link(obj)
        obj.parent = camera
        obj.location = (x, -0.78, -8.5)
        obj.data.materials.append(palette["white"])
        window(obj, shot2a, shot2b)
    camera_positions = [
        (1, (6, -13, 3.2), (-4, 0, 0.45)), (SHOT, (14, -13, 3.2), (4, 0, 0.45)),
        (SHOT+1, (0, -8, 3), (0, 0, 0)), (2*SHOT, (1, -7, 2.3), (0, 0, 0)),
        (2*SHOT+1, (0, -10, 4), (0, 0, 0)), (3*SHOT, (1.3, -8, 3.2), (0, 0, 0)),
        (3*SHOT+1, (0, -8, 3), (0, 0, 0)), (4*SHOT, (1.3, -7, 2.3), (0, 0, 0)),
        (4*SHOT+1, (0, -8, 3), (0, 0, 0)), (5*SHOT, (1.2, -7, 2.4), (0, 0, 0)),
        (5*SHOT+1, (0, -9, 3), (0, 0, 0)), (6*SHOT, (0.2, -7, 2.3), (0, 0, 0)),
        (6*SHOT+1, (0, -10, 2.5), (0, 0, 0)), (END, (0, -13, 2.5), (0, 0, 0)),
    ]
    camera_positions[2] = (SHOT+1, (0, -15, 5), (0, 0, 0))
    camera_positions[3] = (2*SHOT, (0, -13, 4), (0, 0, 0))
    camera_positions[4] = (2*SHOT+1, (0, -6.5, 2.7), (0, 0, 0))
    camera_positions[6] = (3*SHOT+1, (0, -13, 4), (0, 0, 0))
    camera_positions[7] = (4*SHOT, (0, -13, 4), (0, 0, 0))
    camera_positions[8] = (4*SHOT+1, (0, -9, 8), (0, 0, 0))
    camera_positions[9] = (5*SHOT, (0, -9, 8), (0, 0, 0))
    camera_positions[10] = (5*SHOT+1, (0, -10, 4), (0, 0, 0))
    camera_positions[12] = (6*SHOT+1, (0, -13, 2.5), (0, 0, 0))
    camera_positions[13] = (END, (0, -13, 2.5), (0, 0, 0))
    for frame, position, focus in camera_positions:
        camera.location = position
        camera.keyframe_insert(data_path="location", frame=frame)
        camera.rotation_euler = (Vector(focus) - Vector(position)).to_track_quat("-Z", "Y").to_euler()
        camera.keyframe_insert(data_path="rotation_euler", frame=frame)
    shot_captions = [
        (1, SHOT, "AGENT ORANGE\nA QUESTION THAT OUTLASTED THE WAR\nC-123 PROVIDER · SCHEMATIC"),
        (shot2a, shot2b, "THREE PUBCHEM CONFORMERS · HERBICIDE INGREDIENTS AND CONTAMINANT KEPT DISTINCT"),
        (shot3a, shot3b, "CIT168 MNI GROUP TEMPLATE · NOT A VETERAN SCAN"),
        (shot4a, shot4b, "DOPAMINERGIC NEURON · EDUCATIONAL CELL MODEL"),
        (shot5a, shot5b, "OXIDATIVE STRESS AND MITOCHONDRIAL EFFECTS: CANDIDATE MECHANISMS"),
        (shot6a, shot6b, "NIGROSTRIATAL DEGENERATION IS ESTABLISHED IN PARKINSON DISEASE"),
        (shot7a, shot7b, "OBSERVATIONAL ASSOCIATION · NOT CAUSATION OR ABSOLUTE RISK"),
    ]
    for a, b, words in shot_captions:
        caption(camera, words, a, b)

    for frame in (1, SHOT + 1, 2 * SHOT + 1, 3 * SHOT + 1, 4 * SHOT + 1, 5 * SHOT + 1, 6 * SHOT + 1, END - 1):
        scene.frame_set(frame)
        set_shot_visibility(frame)
        bpy.context.view_layer.update()
        scene.render.filepath = str(RENDERS / f"frame-{frame:04d}.png")
        bpy.ops.render.render(write_still=True)
    scene.render.filepath = str(OUT / "renders/film/frame-")
    scene.render.resolution_x, scene.render.resolution_y = 720, 405
    scene.render.resolution_percentage = 100
    scene.frame_set(1)
    set_shot_visibility(1)
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "agent-orange-film.blend"))
    print(f"FILM_SCENE={OUT / 'agent-orange-film.blend'}")
    print(f"FILM_FRAMES={END} at {FPS} fps ({END/FPS}s)")
    print(f"PREVIEW_FRAMES={RENDERS}")


main()
