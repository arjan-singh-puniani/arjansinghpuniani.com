"""Inspect Z-Anatomy shoulder objects without running atlas scripts or changing production."""
import argparse
import bpy
import hashlib
import json
from pathlib import Path
import re
import sys

parser = argparse.ArgumentParser()
parser.add_argument("--source", required=True)
parser.add_argument("--output", required=True)
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
source = Path(args.source)
pattern = re.compile(r"supraspin|infraspin|teres.minor|subscap|glenoid.labrum|glenohumer|coraco.*ligament|acromioclavicular.ligament|subacromial.bursa|subdeltoid.bursa|axillary.nerve|suprascapular.nerve|circumflex.humeral|scapula|humerus|clavicle", re.I)
with bpy.data.libraries.load(str(source), link=False) as (available, loaded):
    names = [n for n in available.objects if pattern.search(n)]
    loaded.objects = names
rows = []
for obj in loaded.objects:
    row = {"name": obj.name, "type": obj.type, "reviewStatus": "candidate; anatomical fidelity and registration unverified"}
    if obj.type == "MESH":
        mesh = obj.data
        mesh.calc_loop_triangles()
        row.update(vertices=len(mesh.vertices), faces=len(mesh.polygons), triangles=len(mesh.loop_triangles), hasUV=bool(mesh.uv_layers))
        row["materials"] = [{"name": slot.material.name if slot.material else None,
                             "assignedFaces": sum(p.material_index == i for p in mesh.polygons)}
                            for i, slot in enumerate(obj.material_slots)]
        row["modifiers"] = [{"name": m.name, "type": m.type} for m in obj.modifiers]
    elif obj.type == "CURVE":
        row.update(splines=len(obj.data.splines), bevelDepth=obj.data.bevel_depth)
    rows.append(row)
assert rows, "No candidate anatomy found"
assert any(r["name"] == "Glenoid labrum.r" and r.get("faces", 0) > 0 for r in rows)
report = {"sourceSHA256": hashlib.sha256(source.read_bytes()).hexdigest(),
          "sourceURL": "https://github.com/Z-Anatomy/Models-of-human-anatomy",
          "attribution": ["BodyParts3D - The Database Center for Life Science - CC-BY-SA 2.1 Japan", "Z-Anatomy - The libre 3D atlas of anatomy - CC-BY-SA 4.0"],
          "scope": "Named candidates, including curves. Raw face counts precede modifiers; no clinical validation or production promotion.", "objects": rows}
Path(args.output).write_text(json.dumps(report, indent=2) + "\n")
for r in rows:
    if r["name"].endswith((".r", ".er")):
        print(r["name"], r["type"], r.get("triangles"), r.get("materials"))
