"""Create a deterministic seven-shot 3D Blender film scene and preview frames."""

from pathlib import Path
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
    data.size = 0.13
    data.extrude = 0
    data.align_x = "LEFT"
    obj = bpy.data.objects.new(f"Caption {start}", data)
    bpy.context.collection.objects.link(obj)
    obj.parent = camera
    obj.location = (-2.8, -1.2, -8.5)
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
        ("Warm key", (0, -5, 8), 2200, (1.0, 0.76, 0.52), 8),
        ("Cool fill", (6, 3, 5), 1650, (0.48, 0.70, 1.0), 7),
        ("Amber rim", (-5, 3, 2), 1900, (1.0, 0.43, 0.18), 5),
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

    # Shot 1: illustrative historical exposure, with no asserted aircraft subtype.
    start, end = 1, SHOT
    ground = cube("Illustrative terrain", (0, 0, -1.3), (20, 20, 0.3), palette["land"])
    window(ground, start, end)
    fuselage = sphere("Illustrative aircraft body", (-4, 0, 0.8), (1.1, 0.22, 0.2), palette["blue"])
    wing = cube("Illustrative aircraft wing", (-4, 0, 0.78), (0.14, 2.8, 0.08), palette["blue"])
    tail = cube("Illustrative aircraft tailplane", (-5, 0, 0.83), (0.12, 0.75, 0.07), palette["blue"])
    fin = cube("Illustrative aircraft fin", (-5, 0, 1.03), (0.36, 0.1, 0.43), palette["blue"])
    for obj in (fuselage, wing, tail, fin):
        window(obj, start, end)
        animate(obj, "location", [(start, obj.location.copy()), (end - 1, obj.location + Vector((8, 0.3, 0)))])
    spray = []
    for i in range(70):
        x = -4.5 + (i % 10) * 0.33
        y = ((i * 7) % 17 - 8) * 0.11
        z = 0.15 - (i // 10) * 0.19
        drop = sphere(f"Illustrative spray {i:02d}", (x, y, z), (0.035, 0.035, 0.07), palette["mist"], 12)
        spray.append(window(drop, start, end))
        animate(drop, "location", [(start, drop.location.copy()), (end - 1, drop.location + Vector((2.5, 0, -0.8)))])

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
        (1, (-0.7, -10, 3.2), (-2, 0, 0)), (SHOT, (2.2, -8, 2.7), (2, 0, -0.4)),
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
        (1, SHOT, "ILLUSTRATIVE HISTORICAL RECONSTRUCTION · NOT A SPECIFIC AIRCRAFT OR SITE"),
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
