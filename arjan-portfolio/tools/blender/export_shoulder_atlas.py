"""Export source-aligned Z-Anatomy study; never register it by warping the legacy specimen."""
import bpy
from mathutils import Vector
from pathlib import Path
import hashlib
import json
import math
import sys

source = Path(sys.argv[sys.argv.index("--") + 1])
root = Path(__file__).resolve().parents[2]
out = root / "public/holoanatomy/shoulder/assets/atlas"
out.mkdir(parents=True, exist_ok=True)
spec = json.loads((Path(__file__).with_name("shoulder_atlas.json")).read_text())
audit = json.loads((root / "Documentation/shoulder-candidate-audit/z-anatomy-inventory.json").read_text())
assert hashlib.sha256(source.read_bytes()).hexdigest() == audit["sourceSHA256"], "Source changed: re-audit first"
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
with bpy.data.libraries.load(str(source), link=False) as (available, loaded):
    names = sorted(set(s["sourceObject"] for s in spec))
    assert all(n in available.objects for n in names)
    loaded.objects = names
originals = {o.name: o for o in loaded.objects}
for o in originals.values():
    bpy.context.scene.collection.objects.link(o)
    o.hide_viewport = False
    o.hide_set(False)
bpy.context.view_layer.update()
deps = bpy.context.evaluated_depsgraph_get()
parts, exported = [], []
center = Vector((-.15, .04, 1.38))
for s in spec:
    original = originals[s["sourceObject"]]
    evaluated = original.evaluated_get(deps)
    mesh = evaluated.to_mesh()
    assert mesh is not None
    selected = list(mesh.polygons)
    if s["material"]:
        indices = {i for i, slot in enumerate(original.material_slots) if slot.material and slot.material.name == s["material"]}
        assert indices, s
        selected = [p for p in mesh.polygons if (p.material_index in indices) != s["invert"]]
    assert selected, f"Empty source region: {s['id']}"
    source_face_count = len(selected)
    mesh.calc_loop_triangles()
    polygon_ids = {p.index for p in selected}
    triangles = [t for t in mesh.loop_triangles if t.polygon_index in polygon_ids]
    removed = sum(t.area == 0 for t in triangles)
    triangles = [t for t in triangles if t.area > 0]
    assert triangles
    used = sorted({i for t in triangles for i in t.vertices})
    remap = {old: new for new, old in enumerate(used)}
    source_positions = [original.matrix_world @ mesh.vertices[i].co for i in used]
    vertices = [tuple((v-center)*10) for v in source_positions]
    faces = [tuple(remap[i] for i in t.vertices) for t in triangles]
    derived = bpy.data.meshes.new(s["id"])
    derived.from_pydata(vertices, [], faces)
    derived.update()
    for target, triangle in zip(derived.polygons, triangles):
        target.use_smooth = mesh.polygons[triangle.polygon_index].use_smooth
    obj = bpy.data.objects.new(s["id"], derived)
    bpy.context.scene.collection.objects.link(obj)
    obj["structureId"] = s["id"]
    obj["sourceObject"] = s["sourceObject"]
    obj["license"] = "CC BY-SA 4.0"
    material = bpy.data.materials.new(s["tissue"])
    material.use_nodes = True
    material.node_tree.nodes.get("Principled BSDF").inputs["Roughness"].default_value=.7
    obj.data.materials.append(material)
    derived.calc_loop_triangles()
    assert all(math.isfinite(c) for v in vertices for c in v)
    assert all(t.area > 0 for t in derived.loop_triangles), f"Degenerate faces: {s['id']}"
    # Exact inverse of the shared normalization verifies no per-structure fitting.
    error = max(((Vector(v)/10+center)-p).length for v,p in zip(vertices, source_positions))
    assert error < 1e-6
    objpath = out / (s["id"] + ".obj")
    with objpath.open("w") as f:
        f.write("# Z-Anatomy / BodyParts3D; CC BY-SA 4.0 derivative; see LICENSE.txt\n")
        for x,y,z in vertices: f.write(f"v {x:.9g} {z:.9g} {-y:.9g}\n")
        for t in derived.loop_triangles: f.write("f " + " ".join(str(i+1) for i in t.vertices) + "\n")
    name = s["sourceObject"].removesuffix(".r").removesuffix(".er")
    if s["id"].endswith("_cartilage"): name += " · cartilage surface"
    elif s["id"].endswith("_insertion"): name += " · insertion region"
    elif s["id"].endswith("_tendon"): name += " · tendon region"
    part = dict(id=s["id"], structureId=s["id"], name="Right " + name[0].lower() + name[1:],
                fma=None, FMA=None, source="Z-Anatomy / BodyParts3D", sourceVersion="archive e02968854562",
                sourceObject=s["sourceObject"], sourceUrl="https://github.com/Z-Anatomy/Models-of-human-anatomy",
                sourceSha256=audit["sourceSHA256"], license="CC BY-SA 4.0", attribution="BodyParts3D - The Database Center for Life Science - CC-BY-SA 2.1 Japan; Z-Anatomy - The libre 3D atlas of anatomy - CC-BY-SA 4.0",
                geometryType="Source-authored " + ("curve converted to surface" if original.type=="CURVE" else "polygon surface"),
                tissue=s["tissue"], layer=s["group"], group=s["group"], note=s["note"],
                sourceFaceCount=source_face_count, removedZeroAreaTriangles=removed, vertexCount=len(vertices), faceCount=len(faces), triangleCount=len(derived.loop_triangles),
                hasUV=False, hasNormals=True, hasTangents=False, textures=[],
                sourceModifiers=[dict(name=m.name,type=m.type) for m in original.modifiers],
                sourceMaterial=s["material"], materialSelectionInverted=s["invert"],
                normalizedBounds=dict(min=[min(v[i] for v in vertices) for i in range(3)],max=[max(v[i] for v in vertices) for i in range(3)]),
                derivedOperations=["Evaluate existing source modifiers and curve bevel", "Extract source-assigned material region where specified", "Shared translation -(-0.15,0.04,1.38) metres and uniform scale 10; glTF axis conversion", "Triangulate and omit zero-area triangles only; recompute display normals; omit unused UVs; no deformation or cross-specimen registration"],
                reviewStatus="Source object identity, material assignments and shared transform verified; no independent clinical review",
                inverseTransformMaxErrorMetres=error, objSha256=hashlib.sha256(objpath.read_bytes()).hexdigest())
    parts.append(part)
    exported.append(obj)
    evaluated.to_mesh_clear()
for o in originals.values(): bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.object.select_all(action="DESELECT")
for o in exported:o.select_set(True)
bpy.context.view_layer.objects.active=exported[0]
bpy.ops.export_scene.gltf(filepath=str(out/"shoulder-atlas.glb"),export_format="GLB",use_selection=True,export_extras=True,export_yup=True,export_normals=True,export_texcoords=False)
manifest=dict(license="CC BY-SA 4.0", sourceArchiveSHA256="e029688545627bd0214b269e1063143abb580aad72b2c2445d6d8a9a0d9da736", sourceSHA256=audit["sourceSHA256"], registration="Separate source-coherent specimen; not registered to legacy BodyParts3D 4.0", structures=parts)
(out/"provenance.json").write_text(json.dumps(manifest,indent=2)+"\n")
license_text=(root/"Documentation/shoulder-candidate-audit/Z-Anatomy-License.txt").read_text()
(out/"LICENSE.txt").write_text("HoloAnatomy shoulder atlas derivative: extracted and normalized source geometry. CC BY-SA 4.0. No anatomy authored by this export.\nhttps://creativecommons.org/licenses/by-sa/4.0/\n\n"+license_text)
groups={g:[s["id"] for s in spec if s["group"]==g] for g in dict.fromkeys(s["group"] for s in spec)}
(root/"public/holoanatomy/shoulder/atlas.js").write_text("// Generated from tools/blender/shoulder_atlas.json; source-coherent atlas groups.\nexport const ATLAS_GROUPS = " + json.dumps(groups,indent=2)+";\nexport const ATLAS_IDS = Object.values(ATLAS_GROUPS).flat();\n")
print("EXPORTED",len(parts),"structures",sum(p["triangleCount"] for p in parts),"triangles")
