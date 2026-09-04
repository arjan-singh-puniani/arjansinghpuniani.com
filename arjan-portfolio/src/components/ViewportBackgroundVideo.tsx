"use client";

import { useEffect, useRef, useState } from "react";

export default function ViewportBackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShouldLoad(true);
        setIsActive(entry.isIntersecting);
      },
      { rootMargin: "160px 0px", threshold: 0.15 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad) return;

    if (isActive && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [isActive, shouldLoad]);

  return (
    <video
      ref={videoRef}
      className="v2-playground-video"
      muted
      loop
      playsInline
      preload="none"
      poster="/video/tennis-racket-background-poster.jpg"
      aria-hidden="true"
      tabIndex={-1}
    >
      {shouldLoad && <>
        <source src="/video/tennis-racket-background.webm" type="video/webm" />
        <source src="/video/tennis-racket-background.mp4" type="video/mp4" />
      </>}
    </video>
  );
}
