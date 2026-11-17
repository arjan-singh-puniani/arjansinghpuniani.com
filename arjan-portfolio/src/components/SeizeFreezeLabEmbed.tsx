"use client";

import { useEffect, useRef, useState } from "react";

export function SeizeFreezeLabEmbed() {
  const [open, setOpen] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

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
        <div>
          <h2 id="sf-lab-title" ref={heading} tabIndex={-1}>Interactive laboratory</h2>
          <p>Explore the proposed device on reference anatomy and follow a synthetic signal through the thermal model.</p>
        </div>
        <button type="button" className="sf-launch" aria-expanded={open} aria-controls="sf-inline-lab" onClick={() => {
          setOpen(!open);
          if (open) heading.current?.focus();
        }}>{open ? "Close embedded lab" : "Load lab here"}</button>
      </div>
      <div id="sf-inline-lab" hidden={!open}>
        {open && <iframe ref={frame} src="/seizefreeze-lab/index.html?embed=1" title="Explore the proposed SeizeFreeze assembly and synthetic signal-to-thermal-control laboratory" />}
      </div>
      <p className="shell sf-embed-note"><a href="/seizefreeze-lab/index.html">Open full-screen ↗</a> · <a href="/seizefreeze-lab/MODEL.md">Read the numerical model ↗</a> · <a href="/seizefreeze-lab/research.html">Open the research workbench ↗</a></p>
    </section>
  );
}
