"use client";

import { useEffect, useRef, useState } from "react";
import type { ImpactDirection } from "@/content/neurotrauma";
import { VehiclePoster } from "./VehiclePoster";
import styles from "./neurotrauma.module.css";

type ViewerApi = {
  start: () => void;
  stop: () => void;
  addEventListener: (event: string, callback: () => void) => void;
  setCameraLookAt: (position: readonly number[], target: readonly number[], duration: number) => void;
  setBackground: (options: { color: number[] }) => void;
};
declare global {
  interface Window {
    Sketchfab?: new (iframe: HTMLIFrameElement) => { init: (id: string, options: Record<string, unknown> & { success: (api: ViewerApi) => void; error: () => void }) => void };
  }
}

const modelId = "e4afe46f3aab4b23a418da06fc163821";
const target = [0, -.53, .2];
const cameraDuration = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : .6;

export function IncidentCar({ direction, interactive }: { direction: ImpactDirection; interactive: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const api = useRef<ViewerApi | null>(null);
  const [requested, setRequested] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    if (!requested || !frame.current) return;
    let cancelled = false;
    let script: HTMLScriptElement | null = null;
    const fail = () => { if (!cancelled) setStatus("error"); };
    const timeout = window.setTimeout(fail, 45000);
    function initialize() {
      if (cancelled || !frame.current || !window.Sketchfab) return;
      new window.Sketchfab(frame.current).init(modelId, {
        // The provider's intro animation otherwise overwrites the selected camera after viewerready.
        autostart: 1, camera: 0, dnt: 1, preload: 0, animation_autoplay: 0, max_texture_size: 2048, ui_stop: 0,
        success(viewer) {
          if (cancelled) return;
          api.current = viewer;
          viewer.start();
          viewer.addEventListener("viewerready", () => {
            if (cancelled) return;
            window.clearTimeout(timeout);
            viewer.setBackground({ color: [.86,.88,.89] });
            setStatus("ready");
          });
        },
        error: fail,
      });
    }
    if (window.Sketchfab) initialize();
    else {
      script = document.createElement("script");
      script.src = "https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js";
      script.onload = initialize;
      script.onerror = fail;
      document.body.appendChild(script);
    }
    return () => { cancelled = true; window.clearTimeout(timeout); script?.remove(); api.current?.stop(); api.current = null; };
  }, [requested, attempt]);

  useEffect(() => {
    if (status === "ready") api.current?.setCameraLookAt(direction.camera, target, cameraDuration());
  }, [direction, status]);

  function loadViewer() {
    setRequested(true);
    setStatus("loading");
    setAttempt(value => value + 1);
  }

  return <figure className={styles.incidentCar} data-incident-car data-direction={direction.id} data-viewer-state={status}>
    <div className={styles.carImage}>
      <VehiclePoster/>
      {requested && <iframe ref={frame} title="Interactive Red Bull RB19 model by Redgrund" className={styles.modelFrame} data-ready={status === "ready"} allow="autoplay; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>}
      {status !== "ready" && <div className={styles.viewerLaunch}>
        {status === "loading" ? <span role="status">Loading the 3D model…</span> : <button type="button" disabled={!interactive} onClick={loadViewer}>{status === "error" ? "Retry 3D view" : "Explore in 3D"}<span aria-hidden="true">↗</span></button>}
        {status === "error" && <p role="status">3D is unavailable on this device. The direction comparison remains available.</p>}
      </div>}
    </div>
    <div className={styles.modelTools} role="group" aria-label="3D camera views">
      <button type="button" disabled={status !== "ready"} onClick={()=>api.current?.setCameraLookAt(direction.camera,target,cameraDuration())}>Reset view</button>
      <button type="button" disabled={status !== "ready"} onClick={()=>api.current?.setCameraLookAt([0,-.55,6],target,cameraDuration())}>Top view</button>
      <button type="button" disabled={status !== "ready"} onClick={()=>api.current?.setCameraLookAt([1.35,-1.6,1.65],[0,-.6,.45],cameraDuration())}>Cockpit view</button>
      {requested && <button type="button" onClick={()=>{setRequested(false);setStatus("idle");}}>Close 3D</button>}
      <span>Drag to orbit · pinch or scroll to zoom</span>
    </div>
    <figcaption><a href="https://sketchfab.com/3d-models/oracle-red-bull-f1-car-rb19-2023-e4afe46f3aab4b23a418da06fc163821">RB19</a> by <a href="https://sketchfab.com/redgrund">Redgrund</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> · 3D hosted by Sketchfab. <a href="#source-rb19">Model credits</a></figcaption>
  </figure>;
}
