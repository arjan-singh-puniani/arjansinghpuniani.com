"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  createArcadeBall,
  stepArcadeBallInPlace,
  strikeArcadeBall,
  type ArcadeShot,
} from "@/lib/vector-tennis";

type Difficulty = "chill" | "arcade" | "turbo";
type Hud = {
  player: number;
  rival: number;
  rally: number;
  energy: number;
  speed: number;
  spin: number;
  shot: string;
  status: string;
  waiting: boolean;
};

const INITIAL_HUD: Hud = {
  player: 0,
  rival: 0,
  rally: 0,
  energy: 22,
  speed: 0,
  spin: 0,
  shot: "READY",
  status: "Press Space or click the court to start.",
  waiting: true,
};

export function VectorTennisLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const shotRequestRef = useRef<ArcadeShot | null>(null);
  const movementRequestRef = useRef({ x: 0, z: 0 });
  const selectedShotRef = useRef<ArcadeShot>("flat");
  const difficultyRef = useRef<Difficulty>("arcade");
  const physicsRef = useRef(true);
  const soundRef = useRef(true);
  const audioRef = useRef<AudioContext | null>(null);
  const resetRef = useRef(false);
  const [selectedShot, setSelectedShot] = useState<ArcadeShot>("flat");
  const [difficulty, setDifficulty] = useState<Difficulty>("arcade");
  const [physics, setPhysics] = useState(true);
  const [sound, setSound] = useState(true);
  const [hud, setHud] = useState<Hud>(INITIAL_HUD);

  useEffect(() => { selectedShotRef.current = selectedShot; }, [selectedShot]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);
  useEffect(() => { physicsRef.current = physics; }, [physics]);
  useEffect(() => { soundRef.current = sound; }, [sound]);

  const unlockAudio = () => {
    if (!soundRef.current) return;
    audioRef.current ??= new AudioContext();
    void audioRef.current.resume();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 1100;
    let height = 680;
    let dpr = 1;
    let frame = 0;
    let previous = performance.now();
    let accumulator = 0;
    let visible = true;
    let ball = createArcadeBall("rival");
    let player = { x: 0.1, z: 0.78, vx: 0, vz: 0 };
    let rival = { x: 0.18, z: -0.76, vx: 0 };
    const keys = new Set<string>();
    let queuedShot: ArcadeShot | null = null;
    let queueTime = 0;
    let swingTime = 0;
    let rivalSwing = 0;
    let playerScore = 0;
    let rivalScore = 0;
    let rally = 0;
    let energy = 22;
    let pointDelay = 0;
    let gameStarted = false;
    let status = INITIAL_HUD.status;
    let lastShot = "READY";
    let flash = 0;
    let shake = 0;
    let hitStop = 0;
    let updateHudDelay = 0;
    let previousZ = ball.z;
    const trail: Array<{ x: number; z: number; h: number; age: number }> = [];
    const bounceMarks: Array<{ x: number; z: number; age: number; spin: number }> = [];
    const impactBursts: Array<{ x: number; z: number; h: number; age: number; shot: ArcadeShot; power: number }> = [];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(320, rect.width);
      height = Math.max(390, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };

    const announce = (message: string) => { status = message; };

    const tone = (frequency: number, duration: number, volume: number, type: OscillatorType, endFrequency = frequency) => {
      const audio = audioRef.current;
      if (!soundRef.current || !audio || audio.state !== "running") return;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, endFrequency), audio.currentTime + duration);
      gain.gain.setValueAtTime(volume, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + duration);
    };

    const playImpact = (shot: ArcadeShot, timing: number, charged: boolean) => {
      const audio = audioRef.current;
      if (!soundRef.current || !audio || audio.state !== "running") return;
      const crispness = 620 + timing * 430;
      tone(crispness, 0.085, charged ? 0.18 : 0.12, "triangle", crispness * 0.66);
      tone(shot === "flat" ? 190 : shot === "topspin" ? 235 : 155, 0.13, charged ? 0.2 : 0.115, "sine", 92);
      tone(shot === "slice" ? 1320 : 880, 0.04, 0.035, "square", 420);

      const length = Math.floor(audio.sampleRate * 0.055);
      const buffer = audio.createBuffer(1, length, audio.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let index = 0; index < length; index += 1) samples[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / length, 3);
      const noise = audio.createBufferSource();
      const filter = audio.createBiquadFilter();
      const gain = audio.createGain();
      noise.buffer = buffer;
      filter.type = "bandpass";
      filter.frequency.value = shot === "slice" ? 2400 : 1650;
      filter.Q.value = 1.4;
      gain.gain.value = 0.055;
      noise.connect(filter).connect(gain).connect(audio.destination);
      noise.start();
    };

    const playNet = () => {
      tone(105, 0.18, 0.09, "sawtooth", 55);
      tone(58, 0.2, 0.08, "square", 42);
    };

    const playPoint = (winner: "player" | "rival") => {
      if (winner === "player") {
        tone(440, 0.12, 0.06, "sine", 660);
        window.setTimeout(() => tone(660, 0.16, 0.055, "sine", 880), 65);
      } else tone(150, 0.17, 0.055, "triangle", 82);
    };

    const newRally = (server: "player" | "rival" = "rival") => {
      ball = createArcadeBall(server);
      player = { x: 0.1, z: 0.78, vx: 0, vz: 0 };
      rival = { x: 0.18, z: -0.76, vx: 0 };
      queuedShot = null;
      queueTime = 0;
      swingTime = 0;
      rivalSwing = 0;
      pointDelay = 0;
      rally = 0;
      trail.length = 0;
      bounceMarks.length = 0;
      impactBursts.length = 0;
      previousZ = ball.z;
      lastShot = "SERVE";
      announce(server === "rival" ? "Robot serve incoming — read the arc." : "Your serve launches automatically. Take the court.");
    };

    const resetMatch = () => {
      playerScore = 0;
      rivalScore = 0;
      energy = 22;
      gameStarted = false;
      newRally("rival");
      announce("New Racket Lab match. Press Space or click the court when you are ready.");
    };

    const scorePoint = (winner: "player" | "rival", reason: string) => {
      if (pointDelay > 0) return;
      if (winner === "player") playerScore += 1;
      else rivalScore += 1;
      ball.active = false;
      pointDelay = 1.2;
      shake = reducedMotion.matches ? 0 : winner === "player" ? 0.28 : 0.12;
      playPoint(winner);
      announce(`${winner === "player" ? "POINT // YOU" : "POINT // ROBOT"} — ${reason}`);
      if (playerScore >= 5 || rivalScore >= 5) {
        announce(playerScore >= 5 ? "MATCH // YOU WIN" : "MATCH // ROBOT WINS — run it back.");
        pointDelay = 2.4;
      }
    };

    const requestShot = (shot: ArcadeShot) => {
      unlockAudio();
      const openingShot = !gameStarted;
      if (openingShot) {
        gameStarted = true;
        newRally("rival");
        announce("Match live — your opening swing is buffered. Track the yellow arc.");
      }
      selectedShotRef.current = shot;
      setSelectedShot(shot);
      queuedShot = shot;
      queueTime = openingShot ? 1.35 : 0.5;
      swingTime = 0.34;
    };

    const hitByPlayer = (shot: ArcadeShot) => {
      const distance = Math.hypot(ball.x - player.x, (ball.z - player.z) * 0.72);
      const timing = Math.max(0.35, 1 - distance / 0.58) * Math.max(0.68, 1 - Math.abs(ball.height - 0.32) * 0.5);
      const aimNudge = keys.has("arrowleft") || keys.has("a") ? -0.42 : keys.has("arrowright") || keys.has("d") ? 0.42 : 0;
      const aim = Math.max(-0.84, Math.min(0.84, -rival.x * 0.48 + aimNudge));
      const charged = energy >= 92;
      player.x += (ball.x - player.x) * 0.24;
      player.z += (ball.z - player.z) * 0.12;
      const impact = { x: ball.x, z: ball.z, h: ball.height, age: 0, shot, power: charged ? 1.5 : 0.75 + timing * 0.45 };
      ball = strikeArcadeBall(ball, "player", shot, aim, charged ? 1 : 0.63 + timing * 0.3, timing);
      if (charged) energy = 20;
      else energy = Math.min(100, energy + 13 + timing * 8);
      rally += 1;
      flash = charged ? 0.42 : 0.22;
      shake = reducedMotion.matches ? 0 : charged ? 0.34 : 0.16;
      hitStop = reducedMotion.matches ? 0 : charged ? 0.055 : 0.032;
      impactBursts.push(impact);
      playImpact(shot, timing, charged);
      if ("vibrate" in navigator) navigator.vibrate(charged ? [18, 18, 28] : Math.round(8 + timing * 9));
      queuedShot = null;
      queueTime = 0;
      const quality = timing > 0.82 ? "SWEET SPOT" : timing > 0.56 ? "CLEAN" : "SNAP";
      lastShot = `${quality} ${shot.toUpperCase()}${charged ? " // OVERDRIVE" : ""}`;
      announce(shot === "topspin" ? `${quality} topspin — high arc, hard dip, explosive kick.` : shot === "slice" ? `${quality} slice — wide curve and a low skid.` : `${quality} flat drive — the strings launch it clean and fast.`);
      previousZ = ball.z;
    };

    const update = (dt: number) => {
      if (resetRef.current) {
        resetRef.current = false;
        resetMatch();
      }
      if (shotRequestRef.current) {
        requestShot(shotRequestRef.current);
        shotRequestRef.current = null;
      }

      const moveX = (keys.has("arrowright") || keys.has("d") ? 1 : 0) - (keys.has("arrowleft") || keys.has("a") ? 1 : 0) + movementRequestRef.current.x;
      const moveZ = (keys.has("arrowdown") || keys.has("s") ? 1 : 0) - (keys.has("arrowup") || keys.has("w") ? 1 : 0) + movementRequestRef.current.z;
      const length = Math.max(1, Math.hypot(moveX, moveZ));
      const targetVx = moveX / length * 1.25;
      const targetVz = moveZ / length * 0.8;
      player.vx += (targetVx - player.vx) * Math.min(1, dt * 13);
      player.vz += (targetVz - player.vz) * Math.min(1, dt * 13);
      player.x = Math.max(-0.9, Math.min(0.9, player.x + player.vx * dt));
      player.z = Math.max(0.48, Math.min(0.93, player.z + player.vz * dt));

      if (queuedShot) queueTime -= dt;
      if (queueTime <= 0) queuedShot = null;
      swingTime = Math.max(0, swingTime - dt);
      rivalSwing = Math.max(0, rivalSwing - dt);
      flash = Math.max(0, flash - dt);
      shake = Math.max(0, shake - dt);
      hitStop = Math.max(0, hitStop - dt);
      bounceMarks.forEach((mark) => { mark.age += dt; });
      while (bounceMarks.length && bounceMarks[0].age > 1.5) bounceMarks.shift();
      impactBursts.forEach((burst) => { burst.age += dt; });
      while (impactBursts.length && impactBursts[0].age > 0.48) impactBursts.shift();
      trail.forEach((point) => { point.age += dt; });
      while (trail.length && trail[0].age > 0.65) trail.shift();

      if (pointDelay > 0) {
        pointDelay -= dt;
        if (pointDelay <= 0) {
          if (playerScore >= 5 || rivalScore >= 5) resetMatch();
          else {
            newRally(playerScore > rivalScore ? "rival" : "player");
            gameStarted = false;
            announce("Next point ready — tap a shot to serve into the rally.");
          }
        }
      } else if (gameStarted && hitStop <= 0) {
        const oldBounces = ball.bounces;
        previousZ = ball.z;
        stepArcadeBallInPlace(ball, dt);
        if (frame % 2 === 0) trail.push({ x: ball.x, z: ball.z, h: ball.height, age: 0 });
        if (ball.bounces > oldBounces) bounceMarks.push({ x: ball.x, z: ball.z, age: 0, spin: ball.sidespin });

        const crossedNet = previousZ * ball.z < 0;
        if (crossedNet && ball.height < 0.2) {
          playNet();
          scorePoint(ball.lastHit === "player" ? "rival" : "player", "caught the net");
          return;
        }

        const playerDistance = Math.hypot(ball.x - player.x, (ball.z - player.z) * 0.72);
        if (queuedShot && ball.lastHit === "rival" && ball.z > 0.28 && ball.height < 1.02 && playerDistance < 0.56) hitByPlayer(queuedShot);

        const difficultySpeed = difficultyRef.current === "chill" ? 2.1 : difficultyRef.current === "turbo" ? 3.45 : 2.75;
        const rivalTarget = ball.lastHit === "player" ? Math.max(-0.82, Math.min(0.82, ball.x + ball.vx * 0.24)) : 0;
        rival.vx += ((rivalTarget - rival.x) * difficultySpeed - rival.vx) * Math.min(1, dt * 8);
        rival.x = Math.max(-0.88, Math.min(0.88, rival.x + rival.vx * dt));
        const rivalDistance = Math.hypot(ball.x - rival.x, (ball.z - rival.z) * 0.72);
        if (ball.lastHit === "player" && ball.z < -0.34 && ball.height < 0.92 && rivalDistance < (difficultyRef.current === "chill" ? 0.33 : 0.43)) {
          const rivalShot: ArcadeShot = rally % 4 === 3 ? "slice" : rally % 2 ? "topspin" : "flat";
          ball = strikeArcadeBall(ball, "rival", rivalShot, player.x * -0.38 + Math.sin(rally * 1.8) * 0.38, difficultyRef.current === "turbo" ? 0.86 : 0.62, 0.78);
          rivalSwing = 0.26;
          rally += 1;
          lastShot = `ROBOT ${rivalShot.toUpperCase()}`;
          previousZ = ball.z;
        }

        if (!ball.active) {
          const wentWide = Math.abs(ball.x) > 1.06;
          const hitter = ball.lastHit;
          const winner = wentWide ? (hitter === "player" ? "rival" : "player") : hitter;
          scorePoint(winner, wentWide ? "shot drifted wide" : "double bounce");
        } else if (ball.z > 1.18 && ball.lastHit === "rival") scorePoint("rival", "winner past the baseline");
        else if (ball.z < -1.18 && ball.lastHit === "player") scorePoint("player", "clean baseline winner");
      }

      updateHudDelay += dt;
      if (updateHudDelay > 0.1) {
        updateHudDelay = 0;
        setHud({
          player: playerScore,
          rival: rivalScore,
          rally,
          energy: Math.round(energy),
          speed: Math.round(Math.hypot(ball.vx, ball.vz) * 68),
          spin: Math.round((Math.abs(ball.topspin) + Math.abs(ball.sidespin)) * 620),
          shot: lastShot,
          status,
          waiting: !gameStarted,
        });
      }
    };

    const project = (x: number, z: number, h = 0) => {
      const t = Math.max(-0.08, Math.min(1.08, (z + 1) / 2));
      const courtY = height * (0.13 + t * 0.77);
      const halfWidth = width * (0.22 + t * 0.25);
      return { x: width * 0.5 + x * halfWidth, y: courtY - h * height * (0.12 + t * 0.08), scale: 0.55 + t * 0.65 };
    };

    const polygon = (points: Array<{ x: number; y: number }>) => {
      ctx.beginPath();
      points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
      ctx.closePath();
    };

    const drawPlayer = (x: number, z: number, color: string, facing: number, swing: number, label: string) => {
      const p = project(x, z);
      const s = p.scale;
      const swingPose = Math.min(1, swing / 0.34);
      const lean = facing * (swingPose > 0 ? 5 : 1.5) * s;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      ctx.fillStyle = "rgba(0,0,0,.38)";
      ctx.beginPath(); ctx.ellipse(0, 9 * s, 31 * s, 9 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Bent athletic stance with planted shoes instead of a stick-figure base.
      ctx.shadowBlur = 8;
      ctx.strokeStyle = color;
      ctx.lineWidth = 7 * s;
      ctx.beginPath();
      ctx.moveTo(-8 * s + lean, -3 * s); ctx.lineTo(-18 * s, 14 * s); ctx.lineTo(-25 * s, 27 * s);
      ctx.moveTo(8 * s + lean, -3 * s); ctx.lineTo(18 * s, 13 * s); ctx.lineTo(26 * s, 26 * s);
      ctx.stroke();
      ctx.strokeStyle = "#f8fbff";
      ctx.lineWidth = 4 * s;
      ctx.beginPath(); ctx.moveTo(-31 * s, 28 * s); ctx.lineTo(-19 * s, 28 * s); ctx.moveTo(19 * s, 27 * s); ctx.lineTo(32 * s, 27 * s); ctx.stroke();

      // Tapered torso, shoulder line, and counterbalancing arm.
      ctx.fillStyle = "#0a0c1d";
      ctx.strokeStyle = color;
      ctx.lineWidth = 3 * s;
      ctx.beginPath();
      ctx.moveTo(-19 * s + lean, -42 * s); ctx.quadraticCurveTo(0 + lean, -50 * s, 20 * s + lean, -41 * s);
      ctx.lineTo(11 * s + lean, -4 * s); ctx.quadraticCurveTo(0 + lean, 3 * s, -11 * s + lean, -4 * s); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = 5 * s;
      ctx.beginPath(); ctx.moveTo(-16 * s + lean, -35 * s); ctx.lineTo(-31 * s, -18 * s + swingPose * 8 * s); ctx.stroke();

      // Head, hair/helmet shape, and a bright horizontal visor.
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(lean, -58 * s, 12 * s, 14 * s, facing * -.12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#0a0c1d";
      ctx.fillRect(-9 * s + lean, -61 * s, 18 * s, 4 * s);
      ctx.strokeStyle = "#f8fbff";
      ctx.lineWidth = 2 * s;
      ctx.beginPath(); ctx.moveTo(-8 * s + lean, -59 * s); ctx.lineTo(9 * s + lean, -59 * s); ctx.stroke();

      // The racket whips across the body; a larger swing arc sells acceleration.
      ctx.translate(lean, 0);
      ctx.rotate(facing * (0.58 + swingPose * 1.15));
      ctx.strokeStyle = "#f8fbff";
      ctx.lineWidth = 4 * s;
      ctx.beginPath(); ctx.moveTo(13 * s, -34 * s); ctx.lineTo(42 * s, -49 * s); ctx.stroke();
      ctx.lineWidth = 3 * s;
      ctx.beginPath(); ctx.ellipse(56 * s, -57 * s, 13 * s, 21 * s, -0.55, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.48)";
      ctx.lineWidth = 1 * s;
      for (let string = -7; string <= 7; string += 4.5) {
        ctx.beginPath(); ctx.moveTo(50 * s + string * s, -72 * s); ctx.lineTo(57 * s + string * s, -42 * s); ctx.stroke();
      }
      ctx.restore();
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = `700 ${Math.max(8, 9 * s)}px var(--font-mono)`;
      ctx.textAlign = "center";
      ctx.fillText(label, p.x, p.y + 49 * s);
      ctx.restore();
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const joltX = shake > 0 ? (Math.random() - 0.5) * shake * 22 : 0;
      const joltY = shake > 0 ? (Math.random() - 0.5) * shake * 12 : 0;
      ctx.save();
      ctx.translate(joltX, joltY);

      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, "#070617");
      sky.addColorStop(0.55, "#14113b");
      sky.addColorStop(1, "#070914");
      ctx.fillStyle = sky;
      ctx.fillRect(-20, -20, width + 40, height + 40);

      ctx.fillStyle = "rgba(255,44,202,.13)";
      ctx.beginPath(); ctx.arc(width * 0.78, height * 0.13, width * 0.19, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#0d1026";
      for (let index = 0; index < 22; index += 1) {
        const buildingWidth = width / 20;
        const buildingHeight = height * (0.06 + ((index * 37) % 9) / 80);
        ctx.fillRect(index * buildingWidth, height * 0.17 - buildingHeight, buildingWidth - 2, buildingHeight);
      }
      ctx.fillStyle = "rgba(45,242,255,.55)";
      for (let index = 0; index < 28; index += 1) ctx.fillRect((index * 83) % width, height * (0.07 + ((index * 19) % 9) / 100), 2, 5);

      const farLeft = project(-1, -1);
      const farRight = project(1, -1);
      const nearRight = project(1, 1);
      const nearLeft = project(-1, 1);
      ctx.shadowColor = "#23e7ff";
      ctx.shadowBlur = 28;
      polygon([farLeft, farRight, nearRight, nearLeft]);
      ctx.fillStyle = "rgba(9,22,45,.92)";
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#35ecff";
      ctx.lineWidth = 2;
      ctx.stroke();

      const drawCourtLine = (aX: number, aZ: number, bX: number, bZ: number, alpha = 0.72) => {
        const a = project(aX, aZ);
        const b = project(bX, bZ);
        ctx.strokeStyle = `rgba(53,236,255,${alpha})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      };
      [-0.72, 0, 0.72].forEach((x) => drawCourtLine(x, -1, x, 1, x === 0 ? 0.25 : 0.6));
      [-0.62, 0.62].forEach((z) => drawCourtLine(-1, z, 1, z));
      for (let z = -0.9; z < 1; z += 0.14) drawCourtLine(-1, z, 1, z, 0.075);

      const netL = project(-1.06, 0, 0.3);
      const netR = project(1.06, 0, 0.3);
      const netLb = project(-1.06, 0, 0);
      const netRb = project(1.06, 0, 0);
      ctx.fillStyle = "rgba(255,44,202,.16)";
      polygon([netL, netR, netRb, netLb]); ctx.fill();
      ctx.strokeStyle = "#ff39cf";
      ctx.shadowColor = "#ff39cf";
      ctx.shadowBlur = 14;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(netL.x, netL.y); ctx.lineTo(netR.x, netR.y); ctx.stroke();
      ctx.shadowBlur = 0;
      for (let index = 0; index <= 12; index += 1) {
        const x = -1 + index / 6;
        const top = project(x, 0, 0.3);
        const bottom = project(x, 0, 0);
        ctx.strokeStyle = "rgba(255,57,207,.28)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(bottom.x, bottom.y); ctx.stroke();
      }

      if (physicsRef.current) {
        bounceMarks.forEach((mark) => {
          const p = project(mark.x, mark.z);
          const radius = 10 + mark.age * 28;
          ctx.strokeStyle = `rgba(255,235,73,${Math.max(0, .7 - mark.age * .45)})`;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(p.x, p.y, radius, radius * .35, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = "rgba(255,235,73,.8)";
          ctx.font = "9px var(--font-mono)";
          ctx.fillText(mark.spin > 1 ? "CURVE →" : mark.spin < -1 ? "← CURVE" : "KICK", p.x + 12, p.y - 8);
        });
        ctx.beginPath();
        trail.forEach((point, index) => {
          const p = project(point.x, point.z, point.h);
          if (index === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        });
        ctx.strokeStyle = "rgba(255,235,73,.38)";
        ctx.setLineDash([4, 7]);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      impactBursts.forEach((burst) => {
        const p = project(burst.x, burst.z, burst.h);
        const progress = Math.min(1, burst.age / 0.42);
        const color = burst.shot === "flat" ? "#ffeb49" : burst.shot === "topspin" ? "#35ecff" : "#ff39cf";
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.globalAlpha = Math.max(0, 1 - progress);
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.lineWidth = Math.max(1, 4 * (1 - progress));
        ctx.beginPath(); ctx.ellipse(0, 0, (12 + progress * 48) * burst.power, (6 + progress * 20) * burst.power, -.28, 0, Math.PI * 2); ctx.stroke();
        for (let ray = 0; ray < 9; ray += 1) {
          const angle = ray / 9 * Math.PI * 2 + (burst.shot === "slice" ? progress * 1.4 : 0);
          const inner = 13 + progress * 18;
          const outer = inner + 10 * burst.power;
          ctx.beginPath(); ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner); ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer); ctx.stroke();
        }
        ctx.fillStyle = "#fff";
        ctx.font = `900 ${Math.max(12, 17 * p.scale)}px var(--font-mono)`;
        ctx.textAlign = "center";
        ctx.fillText(burst.shot === "flat" ? "POP" : burst.shot === "topspin" ? "KICK" : "ZIP", 0, -34 - progress * 16);
        ctx.restore();
      });

      drawPlayer(rival.x, rival.z, "#ff39cf", 1, rivalSwing, "ROBOT");
      drawPlayer(player.x, player.z, "#35ecff", -1, swingTime, "YOU");

      trail.forEach((point) => {
        const p = project(point.x, point.z, point.h);
        ctx.fillStyle = `rgba(255,235,73,${Math.max(0, .22 - point.age * .3)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 5 * p.scale, 0, Math.PI * 2); ctx.fill();
      });
      const shadow = project(ball.x, ball.z);
      const orb = project(ball.x, ball.z, ball.height);
      ctx.fillStyle = "rgba(0,0,0,.42)";
      ctx.beginPath(); ctx.ellipse(shadow.x, shadow.y, 10 * shadow.scale, 4 * shadow.scale, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowColor = flash > 0 ? "#ffffff" : "#ffeb49";
      ctx.shadowBlur = flash > 0 ? 34 : 18;
      ctx.fillStyle = flash > 0 ? "#fff" : "#ffeb49";
      const compressing = impactBursts.length > 0 && impactBursts[impactBursts.length - 1].age < 0.07;
      const ballRadius = Math.max(5, 7 * orb.scale);
      ctx.beginPath(); ctx.ellipse(orb.x, orb.y, ballRadius * (compressing ? 1.65 : 1), ballRadius * (compressing ? .58 : 1), -.35, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      if (physicsRef.current && ball.active) {
        const vectorScale = 34;
        ctx.strokeStyle = "#ffeb49";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(orb.x, orb.y); ctx.lineTo(orb.x + ball.vx * vectorScale, orb.y + ball.vz * 8 - ball.vy * 18); ctx.stroke();
        ctx.fillStyle = "#ffeb49";
        ctx.font = "9px var(--font-mono)";
        ctx.fillText(`${Math.round(Math.hypot(ball.vx, ball.vz) * 68)} KM/H`, orb.x + 12, orb.y - 14);
      }

      ctx.fillStyle = "rgba(7,6,23,.78)";
      ctx.fillRect(16, 16, 154, 55);
      ctx.strokeStyle = "rgba(53,236,255,.45)";
      ctx.strokeRect(16, 16, 154, 55);
      ctx.fillStyle = "#f8fbff";
      ctx.font = "700 11px var(--font-mono)";
      ctx.fillText("RACKET LAB // FIRST TO 5", 28, 37);
      ctx.fillStyle = "#97a8c8";
      ctx.font = "9px var(--font-mono)";
      ctx.fillText(`RALLY ${String(rally).padStart(2, "0")}  //  ${difficultyRef.current.toUpperCase()}`, 28, 56);
      ctx.restore();
    };

    const tick = (time: number) => {
      const elapsed = Math.min(0.05, (time - previous) / 1000);
      previous = time;
      if (visible && !document.hidden) {
        accumulator = Math.min(0.1, accumulator + elapsed);
        while (accumulator >= 1 / 120) {
          update(1 / 120);
          accumulator -= 1 / 120;
        }
        draw();
      }
      frame = requestAnimationFrame(tick);
    };

    const keyDown = (event: globalThis.KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (["arrowleft", "arrowright", "arrowup", "arrowdown", " ", "k", "l"].includes(key)) event.preventDefault();
      keys.add(key);
      if (key === " ") requestShot("flat");
      if (key === "k") requestShot("topspin");
      if (key === "l") requestShot("slice");
      if (key === "r") resetMatch();
    };
    const keyUp = (event: globalThis.KeyboardEvent) => { keys.delete(event.key.toLowerCase()); };
    stage.addEventListener("keydown", keyDown);
    stage.addEventListener("keyup", keyUp);
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; previous = performance.now(); }, { rootMargin: "100px" });
    intersection.observe(stage);
    resize();
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      stage.removeEventListener("keydown", keyDown);
      stage.removeEventListener("keyup", keyUp);
    };
  }, []);

  const shoot = (shot: ArcadeShot) => {
    unlockAudio();
    shotRequestRef.current = shot;
    setSelectedShot(shot);
    stageRef.current?.focus();
  };

  const nudge = (x: number, z: number) => {
    movementRequestRef.current = { x, z };
    window.setTimeout(() => { movementRequestRef.current = { x: 0, z: 0 }; }, 160);
    stageRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ([" ", "k", "l"].includes(event.key.toLowerCase())) event.preventDefault();
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.buttons !== 1) return;
    const rect = event.currentTarget.getBoundingClientRect();
    movementRequestRef.current.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    movementRequestRef.current.z = ((event.clientY - rect.top) / rect.height - 0.75) * 1.4;
  };

  return <div className="tennis-lab arcade-lab">
    <div className="arcade-marquee" aria-label="Match score">
      <div><span>YOU</span><strong>{hud.player}</strong></div>
      <p><span>RACKET LAB // ROBOT MATCH</span><b>{hud.rally > 2 ? `${hud.rally} HIT RALLY` : "FIRST TO 5"}</b></p>
      <div><strong>{hud.rival}</strong><span>ROBOT</span></div>
    </div>

    <div className="tennis-toolbar">
      <div className="difficulty-modes" role="group" aria-label="Robot speed">
        <span>Robot</span>
        {(["chill", "arcade", "turbo"] as const).map((level) => <button key={level} type="button" aria-pressed={difficulty === level} onClick={() => setDifficulty(level)}>{level}</button>)}
      </div>
      <button className="learning-toggle" type="button" aria-pressed={physics} onClick={() => setPhysics((value) => !value)}>Physics vision {physics ? "on" : "off"}</button>
      <button type="button" aria-pressed={sound} onClick={() => { unlockAudio(); setSound((value) => !value); }}>Sound {sound ? "on" : "off"}</button>
      <button type="button" onClick={() => { resetRef.current = true; }}>New match</button>
    </div>

    <div
      ref={stageRef}
      className="tennis-stage arcade-stage"
      tabIndex={0}
      role="application"
      aria-label="Vector Tennis advanced Racket Lab"
      aria-describedby="tennis-instructions tennis-status"
      onKeyDown={onKeyDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => { movementRequestRef.current = { x: 0, z: 0 }; }}
      onPointerLeave={() => { movementRequestRef.current = { x: 0, z: 0 }; }}
      onPointerDown={(event) => { if (event.pointerType === "mouse") shoot("flat"); }}
    >
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="stage-focus-hint control-map" aria-label="Keyboard controls"><span><kbd>W</kbd><i><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></i><b>Move</b></span><span><kbd className="key-wide">Space</kbd><b>Start / Flat</b></span><span><kbd>K</kbd><b>Topspin</b></span><span><kbd>L</kbd><b>Slice</b></span><span><kbd className="key-wide">Click</kbd><b>Flat</b></span></div>
      {hud.waiting && <button type="button" className="start-prompt" onClick={() => shoot("flat")}><span>Space / Click</span><strong>Start rally</strong><small>Your first flat swing is buffered.</small></button>}
      <div className="overdrive-meter"><span>Overdrive</span><i><b style={{ width: `${hud.energy}%` }} /></i><strong>{hud.energy >= 92 ? "READY" : `${hud.energy}%`}</strong></div>
    </div>

    <p id="tennis-status" className="tennis-status" aria-live="polite"><span>{hud.shot}</span>{hud.status}</p>

    <div className="arcade-console">
      <div className="shot-deck" role="group" aria-label="Choose and play shot">
        {(["flat", "topspin", "slice"] as const).map((shot, index) => <button key={shot} type="button" className={`shot-card shot-${shot}`} aria-pressed={selectedShot === shot} onClick={() => shoot(shot)}><span>{["SPACE", "K", "L"][index]}</span><strong>{shot}</strong><small>{shot === "flat" ? "fast cannon shot" : shot === "topspin" ? "high arc + hard kick" : "wide bend + low skid"}</small></button>)}
      </div>
      <div className="arcade-readouts" aria-label="Live ball telemetry">
        <div><span>Pace</span><strong>{hud.speed}</strong><small>km/h*</small></div>
        <div><span>Spin</span><strong>{hud.spin.toLocaleString()}</strong><small>rpm*</small></div>
      </div>
    </div>

    <div className="touch-controls arcade-touch" aria-label="Touch controls">
      <div className="touch-dpad"><button type="button" onClick={() => nudge(-1, 0)} aria-label="Move left">←</button><button type="button" onClick={() => nudge(0, -1)} aria-label="Move forward">↑</button><button type="button" onClick={() => nudge(0, 1)} aria-label="Move back">↓</button><button type="button" onClick={() => nudge(1, 0)} aria-label="Move right">→</button></div>
      <p>Tap a shot as the ball enters your half. Hold a direction to aim away from the robot.</p>
    </div>

    <div id="tennis-instructions" className="tennis-instructions">
      <p><strong>Move:</strong> WASD or arrows. On pointer, drag across your half of the court.</p>
      <p><strong>Hit:</strong> Space or click for flat · K topspin · L slice. Early presses buffer generously.</p>
      <p><strong>Overdrive:</strong> clean returns charge the meter. At full charge, your next shot detonates automatically.</p>
    </div>
    <p className="model-units-note">*Telemetry is intentionally game-relative, not measurement-grade.</p>
  </div>;
}
