"""Render frames with explicit shot visibility: start end width height output_dir samples."""

from pathlib import Path
import shutil
import bpy
import sys

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "artifacts/agent-orange/film-frames"
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
start = int(args[0]) if args else 1
end = int(args[1]) if len(args) > 1 else bpy.context.scene.frame_end
assert len(args) <= 6
if len(args) > 2:
    assert len(args) >= 4
    width, height = int(args[2]), int(args[3])
    assert width > 0 and height > 0
    bpy.context.scene.render.resolution_x = width
    bpy.context.scene.render.resolution_y = height
    bpy.context.scene.render.resolution_percentage = 100
if len(args) > 5:
    samples = int(args[5])
    assert samples > 0
    bpy.context.scene.cycles.samples = samples
OUT = Path(args[4]) if len(args) > 4 else OUT
if not OUT.is_absolute():
    OUT = ROOT / OUT
OUT.mkdir(parents=True, exist_ok=True)
scene = bpy.context.scene
assert scene.frame_end >= end >= start >= scene.frame_start
for frame in range(start, end + 1):
    # Blender renders the final neuron frame black at its exact shot endpoint.
    scene.frame_set(frame - 1 if frame == 1440 else frame)
    output = OUT / f"frame-{frame:04d}.png"
    hold_frame = OUT / "frame-2161.png"
    if frame > 2161 and hold_frame.exists():
        # The closing evidence chart is a deliberate static hold; copy its valid rendered frame.
        shutil.copyfile(hold_frame, output)
        if frame == end or frame % scene.render.fps == 0:
            print(f"FILM_PROGRESS {frame}/{end}", flush=True)
        continue
    for obj in scene.objects:
        if "shot_start" in obj:
            # shot_end is the final included frame; following shots start on end + 1.
            obj.hide_render = not (obj["shot_start"] <= frame <= obj["shot_end"])
    bpy.context.view_layer.update()
    scene.render.filepath = str(output)
    bpy.ops.render.render(write_still=True)
    if frame == start or frame % scene.render.fps == 0 or frame == end:
        print(f"FILM_PROGRESS {frame}/{end}", flush=True)
