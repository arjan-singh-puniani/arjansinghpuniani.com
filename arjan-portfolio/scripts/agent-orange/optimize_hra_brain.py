"""Reduce HRA display geometry while preserving its named regional meshes."""

import sys
from pathlib import Path

import bpy


def main():
    args = sys.argv[sys.argv.index("--") + 1:]
    source, output = map(Path, args)
    assert source.is_file()

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(source))
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    before = sum(len(poly.vertices) - 2 for obj in meshes for poly in obj.data.polygons)
    assert len(meshes) == 283 and before > 600_000

    for obj in meshes:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        modifier = obj.modifiers.new("Reference display optimization", "DECIMATE")
        modifier.ratio = 0.5
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.select_set(False)

    after = sum(len(poly.vertices) - 2 for obj in meshes for poly in obj.data.polygons)
    assert after < before * 0.55
    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(output), export_format="GLB", export_apply=True)
    assert output.is_file() and output.stat().st_size > 0
    print(f"HRA meshes={len(meshes)} triangles={before}->{after} bytes={output.stat().st_size}")


if __name__ == "__main__":
    main()
