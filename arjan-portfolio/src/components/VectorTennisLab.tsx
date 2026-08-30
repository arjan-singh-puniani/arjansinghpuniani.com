"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { COURT_GROUND, createBall, fillTrajectory, resolveRacketContact, stepBallInPlace, type BallState, type RacketState, type ShotMode } from "@/lib/vector-tennis";

type Readout = { speed: number; spin: number; quality: string; bounces: number };

export function VectorTennisLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ x: 0.25, y: 0.61 });
  const ballRef = useRef<BallState>(createBall());
  const racketRef = useRef<RacketState>({ x: 0.25, y: 0.61, angle: -0.22, headSpeed: 0, mode: "topspin" });
  const swingRequestRef = useRef(false);
  const resetRequestRef = useRef(false);
  const learningRef = useRef(true);
  const modeRef = useRef<ShotMode>("topspin");
  const faceAngleRef = useRef(-13);
  const [learning, setLearning] = useState(true);
  const [mode, setMode] = useState<ShotMode>("topspin");
  const [faceAngle, setFaceAngle] = useState(-13);
  const [statusText, setStatusText] = useState("Incoming feed. Move the racket, then swing as the ball arrives.");
  const [readout, setReadout] = useState<Readout>({ speed: 50, spin: 0, quality: "Awaiting contact", bounces: 0 });

  useEffect(() => { learningRef.current = learning; }, [learning]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { faceAngleRef.current = faceAngle; }, [faceAngle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 960;
    let height = 560;
    let dpr = 1;
    let frame = 0;
    let previousTime = performance.now();
    let accumulator = 0;
    let swingActive = false;
    let swingTime = 0;
    let contactCooldown = 0;
    let resetDelay = 0;
    let readoutDelay = 0;
    let visible = true;
    let contactFlash = 0;
    let contactPoint = { x: 0, y: 0 };
    let lastQuality = "Awaiting contact";
    const trajectoryBuffer = new Float32Array(140);
    const fixedStep = 1 / 120;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(320, rect.width);
      height = Math.max(300, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nextWidth = Math.round(width * dpr);
      const nextHeight = Math.round(height * dpr);
      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }
    };

    const reset = (announce = true) => {
      ballRef.current = createBall();
      targetRef.current = { x: 0.25, y: 0.61 };
      racketRef.current = { x: 0.25, y: 0.61, angle: faceAngleRef.current * Math.PI / 180, headSpeed: 0, mode: modeRef.current };
      swingActive = false;
      swingTime = 0;
      resetDelay = 0;
      lastQuality = "Awaiting contact";
      if (announce) setStatusText("New feed. Time the swing as the ball reaches the racket.");
    };

    const update = (dt: number) => {
      if (resetRequestRef.current) {
        resetRequestRef.current = false;
        reset();
      }
      if (swingRequestRef.current && !swingActive) {
        swingRequestRef.current = false;
        swingActive = true;
        swingTime = 0;
        setStatusText("Swing committed. Contact depends on timing and racket position.");
      }

      const racket = racketRef.current;
      racket.x += (targetRef.current.x - racket.x) * Math.min(1, dt * 14);
      racket.y += (targetRef.current.y - racket.y) * Math.min(1, dt * 14);
      racket.mode = modeRef.current;
      swingTime += swingActive ? dt : 0;
      const progress = Math.min(1, swingTime / 0.3);
      const baseAngle = faceAngleRef.current * Math.PI / 180;
      racket.angle = baseAngle + (swingActive ? -0.08 + progress * 0.2 : 0);
      racket.headSpeed = swingActive ? Math.sin(progress * Math.PI) * 1.8 : 0;
      if (progress >= 1) {
        swingActive = false;
        swingTime = 0;
        racket.headSpeed = 0;
      }

      stepBallInPlace(ballRef.current, dt);
      contactCooldown = Math.max(0, contactCooldown - dt);
      contactFlash = Math.max(0, contactFlash - dt);
      if (contactCooldown === 0) {
        const contact = resolveRacketContact(ballRef.current, racket);
        if (contact) {
          ballRef.current = contact.ball;
          contactCooldown = 0.22;
          contactFlash = reducedMotion.matches ? 0.08 : 0.34;
          contactPoint = { x: contact.contactX, y: contact.contactY };
          lastQuality = contact.quality;
          setStatusText(`${contact.quality} contact. ${modeRef.current === "flat" ? "Direct pace" : modeRef.current === "topspin" ? "Brushing motion added topspin" : "An open face added slice"}.`);
        }
      }

      if (!ballRef.current.active) {
        resetDelay += dt;
        if (resetDelay > 0.7) reset(false);
      } else resetDelay = 0;

      readoutDelay += dt;
      if (readoutDelay > 0.12) {
        readoutDelay = 0;
        const ball = ballRef.current;
        setReadout({ speed: Math.round(Math.hypot(ball.vx, ball.vy) * 100), spin: Number(ball.spin.toFixed(1)), quality: lastQuality, bounces: ball.bounces });
      }
    };

    const drawArrow = (fromX: number, fromY: number, toX: number, toY: number, color: string) => {
      const angle = Math.atan2(toY - fromY, toX - fromX);
      context.beginPath();
      context.moveTo(fromX, fromY);
      context.lineTo(toX, toY);
      context.lineTo(toX - Math.cos(angle - 0.55) * 8, toY - Math.sin(angle - 0.55) * 8);
      context.moveTo(toX, toY);
      context.lineTo(toX - Math.cos(angle + 0.55) * 8, toY - Math.sin(angle + 0.55) * 8);
      context.strokeStyle = color;
      context.lineWidth = 1.5;
      context.stroke();
    };

    const draw = () => {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      const x = (value: number) => value * width;
      const y = (value: number) => value * height;

      const background = context.createLinearGradient(0, 0, 0, height);
      background.addColorStop(0, "#0a0f1c");
      background.addColorStop(1, "#111b35");
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      context.strokeStyle = "rgba(168,178,195,.13)";
      context.lineWidth = 1;
      for (let index = 1; index < 10; index += 1) {
        context.beginPath();
        context.moveTo(x(index / 10), y(0.08));
        context.lineTo(x(index / 10), y(COURT_GROUND));
        context.stroke();
      }
      for (let index = 1; index < 8; index += 1) {
        context.beginPath();
        context.moveTo(x(0.04), y(index / 10));
        context.lineTo(x(0.96), y(index / 10));
        context.stroke();
      }

      context.fillStyle = "rgba(44,62,145,.34)";
      context.fillRect(0, y(COURT_GROUND), width, height - y(COURT_GROUND));
      context.strokeStyle = "#a8b2c3";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(0, y(COURT_GROUND));
      context.lineTo(width, y(COURT_GROUND));
      context.stroke();

      const netX = x(0.56);
      context.strokeStyle = "rgba(243,240,232,.62)";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(netX, y(COURT_GROUND));
      context.lineTo(netX, y(0.64));
      context.stroke();
      context.strokeStyle = "rgba(243,240,232,.25)";
      context.lineWidth = 1;
      for (let netY = 0.66; netY < COURT_GROUND; netY += 0.025) {
        context.beginPath();
        context.moveTo(netX - 16, y(netY));
        context.lineTo(netX + 16, y(netY));
        context.stroke();
      }

      const ball = ballRef.current;
      if (learningRef.current) {
        const trajectoryCount = fillTrajectory(ball, trajectoryBuffer, 68, 1 / 60);
        context.beginPath();
        for (let index = 0; index < trajectoryCount; index += 1) {
          const pointX = x(trajectoryBuffer[index * 2]);
          const pointY = y(trajectoryBuffer[index * 2 + 1]);
          if (index === 0) context.moveTo(pointX, pointY);
          else context.lineTo(pointX, pointY);
        }
        context.strokeStyle = "rgba(212,175,55,.55)";
        context.setLineDash([5, 7]);
        context.lineWidth = 1.5;
        context.stroke();
        context.setLineDash([]);
      }

      const racket = racketRef.current;
      const racketX = x(racket.x);
      const racketY = y(racket.y);
      const tangentAngle = racket.angle + Math.PI / 2;
      context.save();
      context.translate(racketX, racketY);
      context.rotate(tangentAngle);
      context.strokeStyle = "#f3f0e8";
      context.lineWidth = 7;
      context.beginPath();
      context.ellipse(0, 0, Math.max(18, width * 0.022), Math.max(34, height * 0.073), 0, 0, Math.PI * 2);
      context.stroke();
      context.strokeStyle = "rgba(212,175,55,.66)";
      context.lineWidth = 1;
      for (let stringX = -12; stringX <= 12; stringX += 6) {
        context.beginPath(); context.moveTo(stringX, -27); context.lineTo(stringX, 27); context.stroke();
      }
      for (let stringY = -18; stringY <= 18; stringY += 6) {
        context.beginPath(); context.moveTo(-16, stringY); context.lineTo(16, stringY); context.stroke();
      }
      context.strokeStyle = "#f3f0e8";
      context.lineWidth = 6;
      context.beginPath(); context.moveTo(0, 34); context.lineTo(0, 74); context.stroke();
      context.restore();

      if (learningRef.current) {
        drawArrow(racketX, racketY, racketX + Math.cos(racket.angle) * 68, racketY + Math.sin(racket.angle) * 68, "#8fa6ff");
        if (racket.headSpeed > 0.05) drawArrow(racketX - 8, racketY + 36, racketX + 28, racketY - 26, "#d4af37");
      }

      const ballX = x(ball.x);
      const ballY = y(ball.y);
      if (contactFlash > 0) {
        context.beginPath();
        context.arc(x(contactPoint.x), y(contactPoint.y), 18 + (0.34 - contactFlash) * 80, 0, Math.PI * 2);
        context.strokeStyle = `rgba(212,175,55,${Math.min(1, contactFlash * 3)})`;
        context.lineWidth = 3;
        context.stroke();
      }
      context.shadowColor = "rgba(212,175,55,.7)";
      context.shadowBlur = reducedMotion.matches ? 0 : 14;
      context.fillStyle = "#d4af37";
      context.beginPath();
      context.arc(ballX, ballY, Math.max(7, width * 0.008), 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;

      const timingReady = ball.vx < 0 && ball.x > 0.17 && ball.x < 0.36;
      if (timingReady) {
        context.fillStyle = "#f3f0e8";
        context.font = "700 12px SFMono-Regular, monospace";
        context.textAlign = "center";
        context.fillText("SWING", x(0.25), y(0.16));
      }
      context.textAlign = "left";
      context.fillStyle = "rgba(243,240,232,.68)";
      context.font = "10px SFMono-Regular, monospace";
      context.fillText("FEED", x(0.82), y(0.12));
      context.fillText("CONTACT", x(0.18), y(0.9));
      context.fillText("RECOVERY", x(0.72), y(0.9));
    };

    const tick = (time: number) => {
      const elapsed = Math.min(0.05, (time - previousTime) / 1000);
      previousTime = time;
      if (visible && !document.hidden) {
        accumulator = Math.min(accumulator + elapsed, 0.1);
        while (accumulator >= fixedStep) {
          update(fixedStep);
          accumulator -= fixedStep;
        }
        draw();
      }
      frame = requestAnimationFrame(tick);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; previousTime = performance.now(); }, { rootMargin: "120px" });
    intersectionObserver.observe(stage);
    resize();
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, []);

  const swing = () => {
    swingRequestRef.current = true;
    stageRef.current?.focus();
  };

  const reset = () => { resetRequestRef.current = true; };

  const moveRacket = (dx: number, dy: number) => {
    targetRef.current = {
      x: Math.max(0.12, Math.min(0.45, targetRef.current.x + dx)),
      y: Math.max(0.32, Math.min(0.76, targetRef.current.y + dy)),
    };
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key.toLowerCase();
    if (["arrowleft", "arrowright", "arrowup", "arrowdown", " ", "q", "e", "r", "l"].includes(key)) event.preventDefault();
    if (key === "arrowleft" || key === "a") moveRacket(-0.025, 0);
    if (key === "arrowright" || key === "d") moveRacket(0.025, 0);
    if (key === "arrowup" || key === "w") moveRacket(0, -0.025);
    if (key === "arrowdown" || key === "s") moveRacket(0, 0.025);
    if (key === "q") setFaceAngle((value) => Math.max(-28, value - 2));
    if (key === "e") setFaceAngle((value) => Math.min(12, value + 2));
    if (key === " ") swing();
    if (key === "r") reset();
    if (key === "l") setLearning((value) => !value);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    targetRef.current = {
      x: Math.max(0.12, Math.min(0.45, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0.32, Math.min(0.76, (event.clientY - rect.top) / rect.height)),
    };
  };

  return <div className="tennis-lab">
    <div className="tennis-toolbar">
      <div className="shot-modes" role="group" aria-label="Shot model">
        {(["flat", "topspin", "slice"] as const).map((shot) => <button key={shot} type="button" aria-pressed={mode === shot} onClick={() => setMode(shot)}>{shot}</button>)}
      </div>
      <button className="learning-toggle" type="button" aria-pressed={learning} onClick={() => setLearning((value) => !value)}>Learning mode {learning ? "on" : "off"}</button>
      <button type="button" onClick={reset}>Reset feed</button>
    </div>

    <div
      ref={stageRef}
      className="tennis-stage"
      tabIndex={0}
      role="application"
      aria-label="Vector Tennis racket physics lab"
      aria-describedby="tennis-instructions tennis-status"
      onKeyDown={onKeyDown}
      onPointerMove={onPointerMove}
      onPointerDown={(event) => { if (event.pointerType === "mouse") swing(); }}
    >
      <canvas ref={canvasRef} aria-hidden="true" />
      <span className="stage-focus-hint">Click to swing · Space also works</span>
    </div>

    <p id="tennis-status" className="tennis-status" aria-live="polite">{statusText}</p>

    <div className="tennis-console">
      <div className="tennis-readouts" aria-label="Current model state">
        <div><span>Ball speed</span><strong>{readout.speed}</strong><small>relative units</small></div>
        <div><span>Spin</span><strong>{readout.spin}</strong><small>model units</small></div>
        <div><span>Contact</span><strong>{readout.quality}</strong><small>timing + offset</small></div>
        <div><span>Bounces</span><strong>{readout.bounces}</strong><small>current shot</small></div>
      </div>
      <label className="face-control">Racket-face angle <strong>{faceAngle}°</strong><input type="range" min="-28" max="12" step="1" value={faceAngle} onChange={(event) => setFaceAngle(Number(event.target.value))} /></label>
    </div>

    <div className="touch-controls" aria-label="Racket controls">
      <div className="touch-dpad"><button type="button" onClick={() => moveRacket(0, -0.035)} aria-label="Move racket up">↑</button><button type="button" onClick={() => moveRacket(-0.035, 0)} aria-label="Move racket left">←</button><button type="button" onClick={() => moveRacket(0, 0.035)} aria-label="Move racket down">↓</button><button type="button" onClick={() => moveRacket(0.035, 0)} aria-label="Move racket right">→</button></div>
      <button className="swing-button" type="button" onClick={swing}>Swing</button>
    </div>

    <div id="tennis-instructions" className="tennis-instructions">
      <p><strong>Pointer:</strong> move over the court; click as the ball reaches the racket.</p>
      <p><strong>Keyboard:</strong> arrows or WASD move · Q/E changes face · Space swings · R resets · L toggles learning mode.</p>
      <p><strong>Touch:</strong> use the directional controls and Swing button. The court preserves vertical page scrolling.</p>
    </div>
  </div>;
}
