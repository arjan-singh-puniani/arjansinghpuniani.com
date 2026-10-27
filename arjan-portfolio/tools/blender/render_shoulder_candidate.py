"""Source-preserving review renders, not production anatomy or clinical validation."""
import bpy
from mathutils import Vector
from pathlib import Path
import sys

source, output = sys.argv[sys.argv.index("--") + 1:]
Path(output).mkdir(parents=True, exist_ok=True)
groups = {
    "joint": ["Glenoid labrum.r", "Superior glenohumeral ligament.r", "Middle glenohumeral ligament.r", "Inferior glenohumeral ligament.r", "Coracohumeral ligament.r"],
    "capsule-bursae": ["Articular capsule of glenohumeral joint.r", "Subacromial bursa.r", "Subdeltoid bursa.r"],
    "nerves-vessels": ["Axillary nerve.r", "Suprascapular nerve.r", "Superior subscapular nerve.r", "Inferior subscapular nerve.r", "Anterior circumflex humeral artery.r", "Posterior circumflex humeral artery.r", "Suprascapular artery.r"],
}
bones = ["Scapula.r", "Humerus.r", "Clavicle.r"]
names = bones + [n for group in groups.values() for n in group]
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
with bpy.data.libraries.load(source, link=False) as (available, loaded):
    assert all(n in available.objects for n in names)
    loaded.objects = names
scene = bpy.context.scene
palette = {"Bone": (.7,.64,.51,1), "Cartilage": (.3,.55,.57,1), "Ligament": (.75,.55,.3,1), "Articular capsule": (.35,.5,.6,1), "Bursa": (.5,.4,.6,1)}
for o in loaded.objects:
    scene.collection.objects.link(o)
    o.hide_set(False)
    o.hide_viewport = False
    for slot in o.material_slots:
        original = slot.material.name if slot.material else ""
        color = palette.get(original, (.7,.5,.2,1) if "nerve" in o.name else (.55,.18,.15,1))
        mat = bpy.data.materials.new("Review: " + original)
        mat.diffuse_color = color
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = .65
        slot.material = mat
scene.render.engine = "BLENDER_EEVEE"
scene.eevee.use_gtao = True
scene.eevee.gtao_distance = .008
scene.render.resolution_x = 900
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.world.color = (.25,.25,.25)
target = Vector((-.155,.04,1.38))
bpy.ops.object.camera_add(location=target + Vector((-.3,-.4,.12)))
camera = bpy.context.object
camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
camera.data.type = "ORTHO"
camera.data.ortho_scale = .19
camera.data.clip_start = .001
scene.camera = camera
for delta, energy, size in [((-.2,-.3,.4),25,.3),((.3,.1,.2),10,.25)]:
    bpy.ops.object.light_add(type="AREA", location=target+Vector(delta))
    light=bpy.context.object
    light.data.energy=energy
    light.data.shape="DISK"
    light.data.size=size
    light.rotation_euler=(target-light.location).to_track_quat("-Z","Y").to_euler()
for group, visible in groups.items():
    for o in loaded.objects:
        o.hide_render = o.name not in bones + visible
    scene.render.filepath=str(Path(output)/f"{group}.png")
    bpy.ops.render.render(write_still=True)
