"use client";

import { useCallback, useState } from "react";
import { atlasPath } from "@/lib/deployment";
import HumanScene from "@/components/HumanScene";
import styles from "./contour.module.css";

const views = [["Front", 0], ["Three-quarter", Math.PI / 4], ["Profile", Math.PI / 2]] as const;
const frames = [["Face", "face"], ["Upper body", "upper"], ["Full body", "full"]] as const;
const ignore = () => {};

export default function ContourPreview() {
  const [view, setView] = useState(0);
  const [frame, setFrame] = useState<(typeof frames)[number][1]>("face");
  const [status, setStatus] = useState("Loading the 3D surface…");
  const onReady = useCallback(() => setStatus("3D surface loaded"), []);
  const onUnavailable = useCallback(() => setStatus("3D surface unavailable"), []);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Anatomical hologram</h1>
          <p>Photo-guided exterior silhouette. Drag to rotate, scroll or pinch to zoom.</p>
        </div>
        <div className={styles.controls}>
          <div role="group" aria-label="View angle">
            {views.map(([label], index) => (
              <button key={label} type="button" aria-pressed={view === index} onClick={() => setView(index)}>{label}</button>
            ))}
          </div>
          <div role="group" aria-label="Framing">
            {frames.map(([label, value]) => (
              <button key={value} type="button" aria-pressed={frame === value} onClick={() => setFrame(value)}>{label}</button>
            ))}
          </div>
        </div>
      </header>
      <div className={styles.canvas}>
        <HumanScene
          contourView={{ angle: views[view][1], frame }}
          adapted
          surface
          showLabels
          showOrgans={false}
          region="all"
          activeRegions={[]}
          counts={{}}
          onSelect={ignore}
          onHover={ignore}
          onReady={onReady}
          onUnavailable={onUnavailable}
        />
      </div>
      <footer className={styles.status}>
        <p role="status">{status}</p>
        <p>Exterior adapted from the <a href="https://doi.org/10.48539/HBM646.RKKC.257">Human Reference Atlas (CC BY 4.0)</a>. Device locations appear on <a href={atlasPath("/")}>the main Atlas</a>.</p>
      </footer>
    </main>
  );
}
