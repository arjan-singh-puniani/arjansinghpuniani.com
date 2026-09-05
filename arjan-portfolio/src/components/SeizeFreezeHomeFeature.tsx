"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import styles from "./SeizeFreezeHomeFeature.module.css";

export function SeizeFreezeHomeFeature() {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      if (reducedMotion.matches || window.innerWidth > 900) {
        scene.style.setProperty("--sf-image-y", "52%");
        return;
      }

      const bounds = scene.getBoundingClientRect();
      const headerHeight = window.innerWidth <= 800 ? 64 : 72;
      const stickyHeight = (scene.firstElementChild as HTMLElement | null)?.offsetHeight ?? window.innerHeight * 0.76;
      const travel = Math.max(scene.offsetHeight - stickyHeight, 1);
      const progress = Math.min(Math.max((headerHeight - bounds.top) / travel, 0), 1);
      scene.style.setProperty("--sf-image-y", `${(progress * 100).toFixed(2)}%`);
    };

    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    reducedMotion.addEventListener("change", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      reducedMotion.removeEventListener("change", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <article className={`v2-feature v2-feature-dark ${styles.feature}`}>
    <div className={styles.scrollScene} ref={sceneRef}>
      <div className={`v2-feature-image v2-device ${styles.visual}`}>
        <Image
          src="/images/neurotechnology/seizefreeze-homepage-hero-v2.webp"
          alt="Concept visualization of the proposed SeizeFreeze implant, thermoelectric assembly, and localized cortical cooling"
          fill
          sizes="(max-width: 900px) calc(100vw - 24px), 52vw"
        />
      </div>
    </div>
    <div className="v2-feature-copy">
      <p>01 / Neurotechnology</p>
      <h3>SeizeFreeze</h3>
      <p className="v2-feature-lead">A focal cortical-cooling concept for drug-resistant epilepsy.</p>
      <dl>
        <div><dt>Role</dt><dd>Founder + device lead</dd></div>
        <div><dt>State</dt><dd>Prototype</dd></div>
        <div><dt>Evidence</dt><dd>$12.5K documented awards</dd></div>
      </dl>
      <Link href="/work/seizefreeze">Open case study <span>↗</span></Link>
    </div>
  </article>;
}
