"use client";

import { useEffect, useRef } from "react";

type Particle = { angle: number; radius: number; speed: number; size: number; drift: number; x: number; y: number };

export function OrbitField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const mountedCanvas = canvasRef.current;
    if (!mountedCanvas) return;
    const mountedContext = mountedCanvas.getContext("2d");
    if (!mountedContext) return;
    const canvas: HTMLCanvasElement = mountedCanvas;
    const context: CanvasRenderingContext2D = mountedContext;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = { x: -9999, y: -9999, active: false };
    let particles: Particle[] = [];
    let frame = 0;
    let width = 0;
    let height = 0;
    let ratio = 1;

    function resize() {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.max(70, Math.min(180, Math.floor((width * height) / 6700)));
      const minRadius = Math.min(width, height) * 0.22;
      const maxRadius = Math.hypot(width, height) * 0.48;
      particles = Array.from({ length: count }, (_, index) => ({
        angle: (index / count) * Math.PI * 2 + Math.random() * 0.28,
        radius: minRadius + Math.pow(Math.random(), 0.62) * (maxRadius - minRadius),
        speed: 0.00009 + Math.random() * 0.00012,
        size: Math.random() < 0.12 ? 1.7 : 0.8 + Math.random() * 0.7,
        drift: Math.random() * Math.PI * 2,
        x: 0,
        y: 0,
      }));
    }

    function draw(time = 0) {
      context.clearRect(0, 0, width, height);
      const cx = width * 0.52;
      const cy = height * 0.5;
      const slowTime = reduced.matches ? 0 : time;

      for (const particle of particles) {
        particle.angle += reduced.matches ? 0 : particle.speed * 7;
        const organic = Math.sin(slowTime * 0.00022 + particle.drift) * 7;
        const targetX = cx + Math.cos(particle.angle + slowTime * particle.speed) * (particle.radius + organic);
        const targetY = cy + Math.sin(particle.angle + slowTime * particle.speed) * (particle.radius * 0.57 + organic);
        const dx = targetX - pointer.x;
        const dy = targetY - pointer.y;
        const distance = Math.hypot(dx, dy);
        const displacement = pointer.active && distance < 125 ? (125 - distance) * 0.35 : 0;
        const x = targetX + (dx / Math.max(distance, 1)) * displacement;
        const y = targetY + (dy / Math.max(distance, 1)) * displacement;
        particle.x += (x - particle.x) * 0.12;
        particle.y += (y - particle.y) * 0.12;
      }

      context.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i += 1) {
        const particle = particles[i];
        for (let j = i + 1; j < Math.min(particles.length, i + 8); j += 1) {
          const other = particles[j];
          const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
          if (distance < 72) {
            context.strokeStyle = `rgba(91,75,196,${0.16 * (1 - distance / 72)})`;
            context.beginPath();
            context.moveTo(particle.x, particle.y);
            context.lineTo(other.x, other.y);
            context.stroke();
          }
        }
      }

      for (const particle of particles) {
        const gold = particle.size > 1.6;
        context.fillStyle = gold ? "rgba(212,175,55,.66)" : "rgba(168,178,195,.58)";
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      }
      if (!reduced.matches) frame = window.requestAnimationFrame(draw);
    }

    const move = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
    };
    const leave = () => { pointer.active = false; };
    const motionChange = () => { window.cancelAnimationFrame(frame); draw(); };

    resize();
    draw();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    canvas.addEventListener("pointermove", move, { passive: true });
    canvas.addEventListener("pointerleave", leave, { passive: true });
    reduced.addEventListener("change", motionChange);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
      reduced.removeEventListener("change", motionChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="orbit-field" aria-hidden="true" />;
}
