"use client";

import { useEffect, useRef, useState } from "react";

export function SeizeFreezeLabEmbed() {
  const [open, setOpen] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const disclosure = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    // The native disclosure may have been opened before React attached its handlers.
    if (disclosure.current?.open) setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function resize(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      const height = event.data?.seizeFreezeHeight;
      if (Number.isFinite(height) && height >= 300 && height <= 30000 && frame.current) {
        frame.current.style.height = `${Math.ceil(height)}px`;
      }
    }
    window.addEventListener("message", resize);
    return () => window.removeEventListener("message", resize);
  }, [open]);

  return (
    <section className="sf-interactive" aria-labelledby="sf-lab-title">
      <div className="shell sf-lab-controls">
        <h2 id="sf-lab-title">Interactive laboratory</h2>
        <p>Explore the proposed device on reference anatomy and follow a synthetic signal through the thermal model.</p>
      </div>
      <details className="sf-lab-disclosure" ref={disclosure} suppressHydrationWarning onToggle={event => setOpen(event.currentTarget.open)}>
        <summary className="shell"><span className="sf-launch"><span>Load lab here</span><span>Close embedded lab</span></span></summary>
        <div id="sf-inline-lab">
          {open
            ? <iframe ref={frame} src="/seizefreeze-lab/index.html?embed=1" title="Explore the proposed SeizeFreeze assembly and synthetic signal-to-thermal-control laboratory" />
            : <p className="shell sf-embed-note"><a href="/seizefreeze-lab/index.html">Open the lab in full screen ↗</a></p>}
        </div>
      </details>
      <p className="shell sf-embed-note"><a href="/seizefreeze-lab/index.html">Open full-screen ↗</a> · <a href="/seizefreeze-lab/MODEL.md">Read the numerical model ↗</a> · <a href="/seizefreeze-lab/research.html">Open the research workbench ↗</a></p>
    </section>
  );
}
