"""Build bilateral nucleus surfaces from the CIT168 1 mm MNI label map."""

from pathlib import Path
import gzip
import struct
import bpy
import bmesh
import numpy as np
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "artifacts/agent-orange/source/cit168-mni152-1mm-dseg.nii.gz"
OUT = ROOT / "public/agent-orange"

LABELS = {1: ("Putamen", (0.27, 0.60, 0.68)), 2: ("Caudate", (0.38, 0.49, 0.70)), 7: ("Substantia nigra pars compacta", (0.92, 0.54, 0.19))}
FACES = [
    (0, -1, [(0, 0, 0), (0, 0, 1), (0, 1, 1), (0, 1, 0)]),
    (0, 1, [(1, 0, 0), (1, 1, 0), (1, 1, 1), (1, 0, 1)]),
    (1, -1, [(0, 0, 0), (1, 0, 0), (1, 0, 1), (0, 0, 1)]),
    (1, 1, [(0, 1, 0), (0, 1, 1), (1, 1, 1), (1, 1, 0)]),
    (2, -1, [(0, 0, 0), (0, 1, 0), (1, 1, 0), (1, 0, 0)]),
    (2, 1, [(0, 0, 1), (1, 0, 1), (1, 1, 1), (0, 1, 1)]),
]


def load_volume(path):
    with gzip.open(path, "rb") as file:
        header = file.read(352)
        dimensions = struct.unpack_from("<3h", header, 42)
        datatype = struct.unpack_from("<h", header, 70)[0]
        offset = int(struct.unpack_from("<f", header, 108)[0])
        assert dimensions == (182, 218, 182) and datatype == 16 and offset == 352
        # NIfTI stores the first (x) axis fastest; keep voxel indices aligned to the affine.
        data = np.frombuffer(file.read(), dtype="<f4").reshape(dimensions, order="F")
    affine = np.asarray(struct.unpack_from("<12f", header, 280), dtype=np.float32).reshape(3, 4)
    assert np.allclose(affine[:, :3], [[-1, 0, 0], [0, 1, 0], [0, 0, 1]])
    assert np.allclose(affine[:, 3], [90, -126, -72])
    return data, affine


def shifted(mask, axis, direction):
    neighbor = np.zeros_like(mask)
    source = [slice(None)] * 3
    target = [slice(None)] * 3
    if direction < 0:
        source[axis] = slice(1, None)
        target[axis] = slice(None, -1)
    else:
        source[axis] = slice(None, -1)
        target[axis] = slice(1, None)
    neighbor[tuple(target)] = mask[tuple(source)]
    return neighbor


def surface_mesh(mask, affine):
    vertices, faces = [], []
    for axis, direction, corners in FACES:
        exposed = mask & ~shifted(mask, axis, direction)
        for voxel in np.argwhere(exposed):
            base = len(vertices)
            for corner in corners:
                ijk = voxel + corner
                xyz = affine[:, :3] @ (ijk - 0.5) + affine[:, 3]
                vertices.append((float(xyz[0] / 20), float(xyz[1] / 20), float(xyz[2] / 20)))
            faces.append((base, base + 1, base + 2, base + 3))
    assert vertices and faces
    mesh = bpy.data.meshes.new("CIT168 1 mm label surface")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.001)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    return mesh


def main():
    volume, affine = load_volume(SOURCE)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    meshes = []
    side_masks = []
    for label, (name, color) in LABELS.items():
        region = volume == label
        for side, mask in (("right", region[:90, :, :]), ("left", region[91:, :, :])):
            count = int(np.count_nonzero(mask))
            assert count > 0
            side_masks.append((name, side, count))
            # The right-side index slice starts at zero, while the left starts at index 91.
            full_mask = np.zeros_like(region, dtype=bool)
            full_mask[:90, :, :] = region[:90, :, :] if side == "right" else False
            full_mask[91:, :, :] = region[91:, :, :] if side == "left" else False
            mesh = surface_mesh(full_mask, affine)
            obj = bpy.data.objects.new(f"CIT168 · {name} · {side}", mesh)
            bpy.context.collection.objects.link(obj)
            mat = bpy.data.materials.new(f"{name} · {side}")
            mat.diffuse_color = (*color, 1)
            mat.use_nodes = True
            mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*color, 1)
            mat.node_tree.nodes["Principled BSDF"].inputs["Metallic"].default_value = 0.04
            mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.38
            mesh.materials.append(mat)
            obj.data.remesh_voxel_size = 0.025
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.voxel_remesh()
            for polygon in mesh.polygons:
                polygon.use_smooth = True
            smooth = obj.modifiers.new("Gentle surface smoothing", "SMOOTH")
            smooth.factor = 0.4
            smooth.iterations = 6
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.modifier_apply(modifier=smooth.name)
            meshes.append(obj)
    assert len(meshes) == 6 and all(count > 0 for _, _, count in side_masks)

    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = 1280, 720
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = "AgX"
    scene.render.image_settings.file_format = "PNG"
    world = bpy.data.worlds.new("Atlas · charcoal")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.012, 0.018, 0.025, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.32
    bpy.ops.object.light_add(type="AREA", location=(0, -5, 7))
    key = bpy.context.object
    key.name = "Key · clinical softbox"
    key.data.energy = 1250
    key.data.shape = "DISK"
    key.data.size = 6
    key.rotation_euler = (Vector((0, 0, 0)) - key.location).to_track_quat("-Z", "Y").to_euler()
    bpy.ops.object.light_add(type="AREA", location=(5, 4, 2))
    rim = bpy.context.object
    rim.name = "Rim · cool"
    rim.data.energy = 800
    rim.data.color = (0.46, 0.7, 1.0)
    rim.data.shape = "DISK"
    rim.data.size = 5
    rim.rotation_euler = (Vector((0, 0, 0)) - rim.location).to_track_quat("-Z", "Y").to_euler()
    bpy.ops.object.camera_add(location=(0, -8, 3.5))
    camera = bpy.context.object
    camera.name = "CIT168 · subcortical overview"
    camera.data.lens = 55
    camera.rotation_euler = (Vector((0, 0, 0)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = camera
    scene.render.filepath = str(OUT / "renders/cit168-subcortical-preview.png")
    scene.render.threads_mode = "FIXED"
    scene.render.threads = 8
    scene.frame_start, scene.frame_end, scene.render.fps = 1, 72, 24
    scene.frame_set(36)
    OUT.mkdir(exist_ok=True)
    (OUT / "renders").mkdir(exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "cit168-subcortical.blend"))
    bpy.ops.object.select_all(action="DESELECT")
    for obj in meshes:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.export_scene.gltf(filepath=str(OUT / "cit168-subcortical.glb"), export_format="GLB", use_selection=True)
    bpy.ops.render.render(write_still=True)
    print("CIT168_REGION_VOXELS", side_masks)
    print("CIT168_EXPORT", OUT / "cit168-subcortical.glb")
    print("CIT168_RENDER", OUT / "renders/cit168-subcortical-preview.png")


main()
