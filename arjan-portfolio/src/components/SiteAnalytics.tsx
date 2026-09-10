"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    va?: (
      command: "event",
      payload: { name: string; data?: Record<string, string | number | boolean> },
    ) => void;
  }
}

export function SiteAnalytics({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-analytics-event]");
      if (!target) return;

      const name = target.dataset.analyticsEvent;
      if (!name) return;

      window.va?.("event", {
        name,
        data: {
          path: window.location.pathname,
          label: (target.textContent ?? "").trim().slice(0, 80),
        },
      });
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [enabled]);

  if (!enabled) return null;

  return <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />;
}
