"""Render every frame with explicit shot visibility, avoiding animated hide flags."""

from pathlib import Path
import shutil
import bpy
import sys

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "artifacts/agent-orange/film-frames"
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
start = int(args[0]) if args else 1
end = int(args[1]) if len(args) > 1 else bpy.context.scene.frame_end
OUT.mkdir(parents=True, exist_ok=True)
scene = bpy.context.scene
assert scene.frame_end >= end >= start >= scene.frame_start
for frame in range(start, end + 1):
    scene.frame_set(frame)
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
            obj.hide_render = not (obj["shot_start"] <= frame < obj["shot_end"])
    bpy.context.view_layer.update()
    scene.render.filepath = str(output)
    bpy.ops.render.render(write_still=True)
    if frame == start or frame % scene.render.fps == 0 or frame == end:
        print(f"FILM_PROGRESS {frame}/{end}", flush=True)
