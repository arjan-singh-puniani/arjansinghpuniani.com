"""Build a Blender molecule scene from a PubChem V2000 SDF conformer."""

from pathlib import Path
import math
import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SDF = ROOT / "public/agent-orange/source/2-4-d-pubchem-cid-1486.sdf"
OUTPUT = ROOT / "public/agent-orange"


def read_v2000(path):
    lines = path.read_text().splitlines()
    atom_count, bond_count = map(int, lines[3][:6].split())
    atoms = []
    for line in lines[4 : 4 + atom_count]:
        atoms.append((Vector(tuple(map(float, (line[:10], line[10:20], line[20:30])))), line[31:34].strip()))
    bonds = []
    bond_start = 4 + atom_count
    for line in lines[bond_start : bond_start + bond_count]:
        first, second, order = map(int, line[:9].split())
        bonds.append((first - 1, second - 1, order))
    assert len(atoms) == atom_count == 19
    assert len(bonds) == bond_count == 19
    assert {element for _, element in atoms} == {"C", "H", "O", "Cl"}
    assert {element: sum(atom[1] == element for atom in atoms) for element in {"C", "H", "O", "Cl"}} == {"C": 8, "H": 6, "O": 3, "Cl": 2}
    assert all(first != second and order in (1, 2, 3) for first, second, order in bonds)
    return atoms, bonds


def material(name, color, metallic=0.0, roughness=0.32):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    return mat


def sphere(name, location, radius, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, radius=radius, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    for face in obj.data.polygons:
        face.use_smooth = True
    return obj


def cylinder_between(name, start, end, radius, mat):
    direction = end - start
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=radius, depth=direction.length, location=(start + end) / 2)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = direction.to_track_quat("Z", "Y")
    obj.data.materials.append(mat)
    for face in obj.data.polygons:
        face.use_smooth = True
    return obj


def main():
    atoms, bonds = read_v2000(SDF)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in bpy.data.materials:
        bpy.data.materials.remove(block)

    atom_materials = {
        "C": material("Carbon · graphite", (0.19, 0.22, 0.25), 0.15),
        "H": material("Hydrogen · pearl", (0.83, 0.87, 0.88), 0.05, 0.23),
        "O": material("Oxygen · vermilion", (0.86, 0.20, 0.16), 0.04, 0.25),
        "Cl": material("Chlorine · sage", (0.43, 0.63, 0.43), 0.05, 0.3),
    }
    bond_material = material("Bond · warm titanium", (0.68, 0.58, 0.41), 0.55, 0.3)
    scale = 0.66
    positions = [Vector((co.x, co.z, -co.y)) * scale for co, _ in atoms]
    radii = {"C": 0.23, "H": 0.13, "O": 0.22, "Cl": 0.31}
    for index, ((_, element), position) in enumerate(zip(atoms, positions), start=1):
        sphere(f"Atom {index:02d} · {element}", position, radii[element], atom_materials[element])

    for bond_index, (first, second, order) in enumerate(bonds, start=1):
        start, end = positions[first], positions[second]
        vector = end - start
        side = vector.cross(Vector((0, 0, 1)))
        if side.length < 0.01:
            side = vector.cross(Vector((0, 1, 0)))
        side.normalize()
        offsets = [0.0] if order == 1 else [-0.085, 0.085] if order == 2 else [-0.11, 0.0, 0.11]
        for offset_index, offset in enumerate(offsets, start=1):
            shift = side * offset
            cylinder_between(f"Bond {bond_index:02d}.{offset_index:02d} · order {order}", start + shift, end + shift, 0.045, bond_material)

    title_mat = material("Typography · bone", (0.84, 0.83, 0.78), 0, 0.5)
    sub_mat = material("Typography · amber", (0.83, 0.52, 0.2), 0.1, 0.45)
    def text(body, location, size, mat, name):
        curve = bpy.data.curves.new(name, "FONT")
        curve.body = body
        curve.size = size
        curve.extrude = 0
        obj = bpy.data.objects.new(name, curve)
        bpy.context.collection.objects.link(obj)
        obj.location = location
        obj.data.materials.append(mat)
        return obj

    text("2,4-D", (-4.4, 1.25, 0), 0.72, title_mat, "Title · 2,4-D")
    text("PUBCHEM CID 1486   /   CONFORMER 000005CE00000001", (-4.35, 0.66, 0), 0.13, sub_mat, "Source · PubChem")
    text("C₈H₆Cl₂O₃", (-4.35, -0.85, 0), 0.24, title_mat, "Formula · C8H6Cl2O3")
    text("Atom coordinates and bond orders from PubChem 3D SDF", (-4.35, -1.26, 0), 0.115, sub_mat, "Provenance note")

    world = bpy.data.worlds.new("Charcoal studio")
    bpy.context.scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.012, 0.016, 0.021, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.28
    def area(name, location, energy, color, size):
        bpy.ops.object.light_add(type="AREA", location=location)
        lamp = bpy.context.object
        lamp.name = name
        lamp.data.energy = energy
        lamp.data.color = color
        lamp.data.shape = "DISK"
        lamp.data.size = size
        lamp.rotation_euler = (Vector((0, 0, 0)) - lamp.location).to_track_quat("-Z", "Y").to_euler()
    area("Key · warm softbox", (0, 4, 7), 1450, (1.0, 0.77, 0.53), 6)
    area("Fill · cool softbox", (4, -1, 3), 950, (0.48, 0.72, 1.0), 5)
    area("Rim · amber", (-4, 1, -1), 1200, (1.0, 0.42, 0.16), 3)

    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
    target = bpy.context.object
    target.name = "Molecule focus"
    bpy.ops.object.camera_add(location=(0, -15, 5.5))
    camera = bpy.context.object
    camera.name = "Conformer camera"
    camera.data.lens = 50
    camera.rotation_euler = (target.location - camera.location).to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = camera
    orbit = bpy.data.objects.new("Camera orbit · deterministic", None)
    bpy.context.collection.objects.link(orbit)
    orbit.location = (0, 0, 0)
    camera.parent = orbit
    camera.matrix_parent_inverse = orbit.matrix_world.inverted()
    orbit.rotation_euler.z = math.radians(-8)
    orbit.keyframe_insert(data_path="rotation_euler", frame=1, index=2)
    orbit.rotation_euler.z = math.radians(8)
    orbit.keyframe_insert(data_path="rotation_euler", frame=72, index=2)

    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 20
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.view_transform = "AgX"
    scene.frame_start = 1
    scene.frame_end = 72
    scene.render.filepath = str(OUTPUT / "renders/2-4-d-preview.png")
    scene.frame_set(36)
    scene.render.threads_mode = "FIXED"
    scene.render.threads = 8
    OUTPUT.mkdir(parents=True, exist_ok=True)
    (OUTPUT / "renders").mkdir(exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT / "2-4-d-pubchem.blend"))
    bpy.ops.object.select_all(action="DESELECT")
    molecule = [obj for obj in scene.objects if obj.name.startswith(("Atom ", "Bond "))]
    for obj in molecule:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = molecule[0]
    bpy.ops.export_scene.gltf(filepath=str(OUTPUT / "2-4-d-pubchem.glb"), export_format="GLB", use_selection=True)
    bpy.ops.render.render(write_still=True)
    print(f"PUBCHEM_SDF_OK atoms={len(atoms)} bonds={len(bonds)} formula=C8H6Cl2O3")
    print(f"BLEND={OUTPUT / '2-4-d-pubchem.blend'}")
    print(f"GLB={OUTPUT / '2-4-d-pubchem.glb'}")
    print(f"RENDER={OUTPUT / 'renders/2-4-d-preview.png'}")


main()
