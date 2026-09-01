"use client";

import { useState } from "react";
import { EndlessRally } from "@/components/EndlessRally";
import { VectorTennisLab } from "@/components/VectorTennisLab";

type TennisMode = "endless" | "lab";

export function VectorTennisExperience() {
  const [mode, setMode] = useState<TennisMode>("endless");

  return <div className="tennis-experience">
    <div className="tennis-mode-switch shell" role="group" aria-label="Vector Tennis mode">
      <button type="button" aria-pressed={mode === "endless"} onClick={() => setMode("endless")}>Endless Rally <span>One input</span></button>
      <button type="button" aria-pressed={mode === "lab"} onClick={() => setMode("lab")} data-analytics-event="tennis_racket_lab_opened">Racket Lab <span>Advanced physics</span></button>
    </div>
    {mode === "endless" ? <div className="shell"><EndlessRally onOpenRacketLab={() => setMode("lab")} /></div> : <section className="racket-lab-mode"><div className="shell"><div className="lab-title-row"><div><p className="eyebrow">Advanced mode</p><h2>Racket Lab</h2></div><p>Move, aim, select shot models, inspect trajectories, and watch the physics telemetry respond.</p></div><VectorTennisLab /></div></section>}
  </div>;
}
