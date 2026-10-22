"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { useRef } from "react";
import type { LabelProjection } from "@/lib/annotations";

// Only reference-region display locators cross this bridge, never device coordinates.
export default function AnnotationProjection({
  anchors,
  onProjection,
}: {
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
    const next = {
      width: size.width,
      height: size.height,
      regions: Object.keys(anchors),
      points,
    };
    const key = JSON.stringify(next);
    if (key !== previous.current) {
      previous.current = key;
      onProjection(next);
    }
  });
  return null;
}
