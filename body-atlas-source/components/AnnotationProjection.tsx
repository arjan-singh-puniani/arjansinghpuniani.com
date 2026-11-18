"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { useRef } from "react";
import type { LabelProjection } from "@/lib/annotations";

// Only reference-region display locators cross this bridge, never device coordinates.
export default function AnnotationProjection({
  anchors,
  onProjection,
  showAnatomicalAxes = false,
}: {
  showAnatomicalAxes?: boolean;
  anchors: Record<string, [number, number, number]>;
  onProjection?: (projection: LabelProjection) => void;
}) {
  const { size, camera } = useThree();
  const previous = useRef("");
  useFrame(() => {
    if (!onProjection) return;
    const points: LabelProjection["points"] = {};
    for (const [id, anchor] of Object.entries(anchors)) {
      const p = new Vector3(...anchor).project(camera);
      if (p.z >= -1 && p.z <= 1 && Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1)
        points[id] = [
          Math.round(((p.x + 1) * size.width) / 2),
          Math.round(((1 - p.y) * size.height) / 2),
        ];
    }
    const next: LabelProjection = {
      width: size.width,
      height: size.height,
      regions: Object.keys(anchors),
      points,
    };
    if (showAnatomicalAxes) {
      // Patient left, superior and anterior in the HRA display frame.
      next.anatomicalAxes = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map(axis => {
        const direction = new Vector3(...axis).transformDirection(camera.matrixWorldInverse);
        return [Math.round(16 * direction.x), Math.round(-16 * direction.y)];
      });
    }
    const key = JSON.stringify(next);
    if (key !== previous.current) {
      previous.current = key;
      onProjection(next);
    }
  });
  return null;
}
