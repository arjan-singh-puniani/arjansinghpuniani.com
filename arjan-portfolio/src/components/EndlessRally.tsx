"use client";

import { useEffect, useRef, useState } from "react";
import { TennisAudio } from "@/lib/tennis/audio";
import { ENDLESS_RALLY_CONFIG } from "@/lib/tennis/config";
import { evaluateContact, type ContactEvaluation, type ContactLabel, type FailureCause } from "@/lib/tennis/contact";
import {
  applyContactToScore,
  canAcceptSwing,
  createRunResult,
  createRunScore,
  endRun,
  transitionEndlessRally,
  type EndlessRallyState,
  type RunResult,
  type RunScore,
} from "@/lib/tennis/endless-rally-machine";
import { dailyRallySeed, generateRallyPattern, hashSeed, type RallyPattern } from "@/lib/tennis/rally-generator";
import {
  DEFAULT_ENDLESS_RALLY_STATS,
  loadEndlessRallyStats,
  mergeRunIntoStats,
  saveEndlessRallyStats,
  type EndlessRallyStats,
} from "@/lib/tennis/persistence";
import { createArcadeBall, stepArcadeBallInPlace, strikeArcadeBall, type ArcadeBallState, type ArcadeShot } from "@/lib/vector-tennis";

type InputType = "keyboard" | "pointer" | "touch";
type RallyView = {
  state: EndlessRallyState;
  rally: number;
  precisionScore: number;
  multiplier: number;
  perfectStreak: number;
  tier: number;
  feedback: ContactLabel | "NET" | "LONG" | "";
  result: RunResult | null;
  personalBest: boolean;
  daily: boolean;
  dailyKey: string;
};

const INITIAL_VIEW: RallyView = {
  state: "READY",
  rally: 0,
  precisionScore: 0,
  multiplier: 1,
  perfectStreak: 0,
  tier: 0,
  feedback: "",
  result: null,
  personalBest: false,
  daily: false,
  dailyKey: "",
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function EndlessRally({ onOpenRacketLab }: { onOpenRacketLab: () => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const primaryActionRef = useRef<(inputType: InputType) => void>(() => undefined);
  const pauseActionRef = useRef<() => void>(() => undefined);
  const dailyRef = useRef(false);
  const statsRef = useRef<EndlessRallyStats>(DEFAULT_ENDLESS_RALLY_STATS);
  const mutedRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const audioRef = useRef<TennisAudio | null>(null);
  const muteEffectReadyRef = useRef(false);
  const [view, setView] = useState<RallyView>(INITIAL_VIEW);
  const [stats, setStats] = useState<EndlessRallyStats>(DEFAULT_ENDLESS_RALLY_STATS);
  const [muted, setMuted] = useState(false);
  const [daily, setDaily] = useState(false);

  useEffect(() => {
    const loaded = loadEndlessRallyStats(window.localStorage);
    statsRef.current = loaded;
    mutedRef.current = loaded.muted;
    setStats(loaded);
    setMuted(loaded.muted);
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => { reducedMotionRef.current = motionQuery.matches; };
    updateMotion();
    motionQuery.addEventListener("change", updateMotion);
    return () => motionQuery.removeEventListener("change", updateMotion);
  }, []);

  useEffect(() => { dailyRef.current = daily; }, [daily]);
  useEffect(() => {
    if (!muteEffectReadyRef.current) {
      muteEffectReadyRef.current = true;
      return;
    }
    mutedRef.current = muted;
    audioRef.current?.setMuted(muted);
    const next = { ...statsRef.current, muted };
    statsRef.current = next;
    setStats(next);
    saveEndlessRallyStats(window.localStorage, next);
  }, [muted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const audio = new TennisAudio();
    audio.setMuted(mutedRef.current);
    audioRef.current = audio;

    let width = 1000;
    let height = 620;
    let dpr = 1;
    let animationFrame = 0;
    let previousRealMs = performance.now();
    let accumulatorSeconds = 0;
    let simTimeMs = 0;
    let machine: EndlessRallyState = transitionEndlessRally("TITLE", "ARM");
    let pausedFrom: EndlessRallyState = "PLAYING";
    let runCounter = 0;
    let seed = 1;
    let score: RunScore = createRunScore();
    let result: RunResult | null = null;
    let personalBest = false;
    let pattern: RallyPattern = generateRallyPattern(seed, 0, { playerX: 0, availableSeconds: 1.2 });
    let ball: ArcadeBallState = createArcadeBall("rival");
    let player = { x: 0, vx: 0, targetX: 0, z: 0.78, racketHeight: 0.32, forehand: true };
    let robot = { x: 0, swing: 0 };
    let expectedContactSimMs = 0;
    let swingPending = false;
    let swingImpactSimMs = 0;
    let swingStartedSimMs = 0;
    let impactEndsSimMs = 0;
    let resultsAtSimMs = 0;
    let feedback: RallyView["feedback"] = "";
    let feedbackEndsSimMs = 0;
    let lastTimingErrorMs = 0;
    let lastInputType: InputType = "keyboard";
    let playerReturnedBall = false;
    let cameraImpulse = 0;
    let publishElapsedMs = 0;
    let lastPrimaryRealMs = -1000;
    let visible = true;
    let dailyKey = "";
    const trail: Array<{ x: number; z: number; height: number; ageMs: number }> = [];
    const bursts: Array<{ x: number; z: number; height: number; ageMs: number; label: ContactLabel }> = [];

    const publish = (force = false) => {
      if (!force && publishElapsedMs < 80) return;
      publishElapsedMs = 0;
      setView({
        state: machine,
        rally: score.rally,
        precisionScore: score.precisionScore,
        multiplier: score.precisionMultiplier,
        perfectStreak: score.perfectStreak,
        tier: pattern.tier,
        feedback,
        result,
        personalBest,
        daily: dailyRef.current,
        dailyKey,
      });
    };

    const analytics = (name: string, data: Record<string, string | number | boolean> = {}) => {
      window.va?.("event", { name, data });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(300, rect.width);
      height = Math.max(360, rect.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };

    const predictContactDelayMs = (source: ArcadeBallState, contactZ: number) => {
      const projected = { ...source };
      let elapsedMs = 0;
      for (let step = 0; step < 420 && projected.active; step += 1) {
        stepArcadeBallInPlace(projected, ENDLESS_RALLY_CONFIG.fixedStepSeconds);
        elapsedMs += ENDLESS_RALLY_CONFIG.fixedStepSeconds * 1000;
        if (projected.z >= contactZ) return elapsedMs;
      }
      return 1200;
    };

    const configureIncomingBall = (nextPattern: RallyPattern, source?: ArcadeBallState) => {
      pattern = nextPattern;
      const next = source ? { ...source } : createArcadeBall("rival");
      next.active = true;
      next.lastHit = "rival";
      next.shot = nextPattern.shot;
      next.bounces = 0;
      if (!source) {
        next.z = -0.76;
        next.x = nextPattern.targetX * -0.18;
        next.height = 0.48;
      }
      next.vz = nextPattern.incomingSpeed;
      const approximateFlightSeconds = Math.max(0.55, (nextPattern.contactZ - next.z) / next.vz);
      next.vx = (nextPattern.targetX - next.x) / approximateFlightSeconds - nextPattern.sidespin * 0.075 * approximateFlightSeconds * 0.5;
      next.vy = nextPattern.shot === "topspin" ? 1.02 : nextPattern.shot === "slice" ? 0.78 : 0.88;
      next.topspin = nextPattern.topspin;
      next.sidespin = nextPattern.sidespin;
      ball = next;
      expectedContactSimMs = simTimeMs + predictContactDelayMs(ball, nextPattern.contactZ);
      player.targetX = nextPattern.targetX;
      player.forehand = nextPattern.targetX >= player.x;
      playerReturnedBall = false;
      swingPending = false;
    };

    const startRun = (inputType: InputType, restarted: boolean) => {
      runCounter += 1;
      simTimeMs = 0;
      score = createRunScore();
      result = null;
      feedback = "";
      personalBest = false;
      swingPending = false;
      trail.length = 0;
      bursts.length = 0;
      player = { x: 0, vx: 0, targetX: 0, z: 0.78, racketHeight: 0.32, forehand: true };
      robot = { x: 0, swing: 0 };
      const dailySeed = dailyRallySeed(new Date());
      dailyKey = dailyRef.current ? dailySeed.key : "";
      seed = dailyRef.current ? dailySeed.seed : hashSeed(`endless-session:${Date.now()}:${runCounter}`);
      pattern = generateRallyPattern(seed, 0, { playerX: 0, availableSeconds: 1.2 });
      configureIncomingBall(pattern);
      machine = "PLAYING";
      lastInputType = inputType;
      audio.unlock();
      analytics(restarted ? "tennis_run_restarted" : "tennis_run_started", { input_type: inputType, daily: dailyRef.current });
      publish(true);
    };

    const finishRun = (failureCause: FailureCause, timingLabel: RunResult["timingLabel"], timingErrorMs: number) => {
      if (machine === "RUN_END" || machine === "RESULTS" || score.ended) return;
      score = endRun(score);
      result = createRunResult(score, failureCause, timingLabel, timingErrorMs);
      personalBest = score.rally > statsRef.current.allTimeBestRally;
      const nextStats = mergeRunIntoStats(statsRef.current, score, dailyRef.current ? dailyKey : undefined);
      statsRef.current = nextStats;
      setStats(nextStats);
      saveEndlessRallyStats(window.localStorage, nextStats);
      machine = transitionEndlessRally(machine === "IMPACT" ? "IMPACT" : "PLAYING", "MISS");
      resultsAtSimMs = simTimeMs + ENDLESS_RALLY_CONFIG.feedback.resultsDelayMs;
      swingPending = false;
      feedback = timingLabel;
      audio.result(personalBest);
      if (personalBest) analytics("tennis_personal_best", { rally_length_bucket: Math.floor(score.rally / 5) * 5, difficulty_tier: pattern.tier });
      analytics("tennis_run_completed", { rally_length_bucket: Math.floor(score.rally / 5) * 5, difficulty_tier: pattern.tier, input_type: lastInputType, failure_category: failureCause });
      publish(true);
    };

    const applySuccessfulContact = (contact: ContactEvaluation) => {
      score = applyContactToScore(score, contact);
      machine = transitionEndlessRally("PLAYING", "CONTACT");
      impactEndsSimMs = simTimeMs + ENDLESS_RALLY_CONFIG.feedback.impactEmphasisMs;
      feedback = contact.label;
      feedbackEndsSimMs = simTimeMs + 520;
      cameraImpulse = contact.label === "PERFECT" && !reducedMotionRef.current ? 1 : 0.34;
      bursts.push({ x: ball.x, z: ball.z, height: ball.height, ageMs: 0, label: contact.label });
      if (bursts.length > 8) bursts.shift();
      const shot: ArcadeShot = contact.label === "PERFECT" ? "flat" : contact.label === "DEFENSIVE" ? "slice" : "topspin";
      const charge = contact.label === "PERFECT" ? 0.96 : contact.label === "DEFENSIVE" ? 0.42 : 0.7;
      ball = strikeArcadeBall(ball, "player", shot, -robot.x * 0.35, charge, contact.label === "PERFECT" ? 1 : contact.label === "CLEAN" ? 0.76 : 0.48);
      ball.vz *= contact.restitution * contact.paceScale;
      ball.vx *= 0.8 + contact.spinTransfer * 0.35;
      if (contact.label === "DEFENSIVE") ball.vy += 0.3;
      playerReturnedBall = true;
      swingPending = false;
      audio.impact(contact.label);
      if ("vibrate" in navigator) navigator.vibrate(contact.label === "PERFECT" ? 16 : contact.label === "DEFENSIVE" ? 7 : 10);
      publish(true);
    };

    const evaluateScheduledSwing = () => {
      const timingErrorMs = swingImpactSimMs - expectedContactSimMs;
      lastTimingErrorMs = timingErrorMs;
      const stringOffset = (ball.x - player.x) / ENDLESS_RALLY_CONFIG.contact.racketReachX + timingErrorMs / 520;
      const contact = evaluateContact({
        timingErrorMs,
        ballX: ball.x,
        ballHeight: ball.height,
        racketX: player.x,
        racketHeight: player.racketHeight,
        racketFaceNormalZ: 0.96 - Math.min(0.25, Math.abs(timingErrorMs) / 720) - Math.min(0.08, Math.abs(ball.sidespin) / 100),
        racketHeadSpeed: 1.42 - Math.min(0.5, Math.abs(timingErrorMs) / 300),
        stringBedOffset: stringOffset,
        incomingSpeed: Math.hypot(ball.vx, ball.vz, ball.vy),
        incomingSpin: ball.topspin + ball.sidespin,
      });
      if (!contact.successful) {
        audio.impact(contact.label);
        finishRun(contact.failureCause ?? "frame", contact.label, timingErrorMs);
        return;
      }
      applySuccessfulContact(contact);
    };

    const robotReturn = () => {
      const nextPattern = generateRallyPattern(seed, score.rally, { playerX: player.x, availableSeconds: pattern.recoverySeconds });
      robot.x = clamp(ball.x, -0.8, 0.8);
      robot.swing = 1;
      const struck = strikeArcadeBall(ball, "rival", nextPattern.shot, nextPattern.targetX, Math.min(0.9, 0.55 + nextPattern.tier * 0.025), 0.82);
      configureIncomingBall(nextPattern, struck);
    };

    const primaryAction = (inputType: InputType) => {
      const now = performance.now();
      if (now - lastPrimaryRealMs < 90) return;
      lastPrimaryRealMs = now;
      audio.unlock();
      lastInputType = inputType;
      if (machine === "READY" || machine === "TITLE") {
        startRun(inputType, false);
        return;
      }
      if (machine === "RESULTS" || machine === "RUN_END") {
        startRun(inputType, true);
        return;
      }
      if (machine === "PAUSED") {
        machine = pausedFrom === "IMPACT" ? "PLAYING" : pausedFrom;
        previousRealMs = performance.now();
        publish(true);
        return;
      }
      if (!canAcceptSwing(machine, swingPending)) return;
      swingPending = true;
      swingStartedSimMs = simTimeMs;
      swingImpactSimMs = simTimeMs + ENDLESS_RALLY_CONFIG.timing.swingLeadMs;
    };
    primaryActionRef.current = primaryAction;

    const pause = () => {
      if (machine !== "PLAYING" && machine !== "IMPACT") return;
      pausedFrom = machine;
      machine = transitionEndlessRally(machine, "PAUSE");
      publish(true);
    };
    pauseActionRef.current = pause;

    const update = (dtSeconds: number) => {
      if (machine === "PAUSED" || machine === "READY" || machine === "RESULTS") return;
      const dtMs = dtSeconds * 1000;
      simTimeMs += dtMs;
      publishElapsedMs += dtMs;
      if (feedback && simTimeMs >= feedbackEndsSimMs && machine !== "RUN_END") feedback = "";
      cameraImpulse = Math.max(0, cameraImpulse - dtSeconds * 6.5);
      robot.swing = Math.max(0, robot.swing - dtSeconds * 4.4);
      for (const point of trail) point.ageMs += dtMs;
      while (trail.length && trail[0].ageMs > 620) trail.shift();
      for (const burst of bursts) burst.ageMs += dtMs;
      while (bursts.length && bursts[0].ageMs > 480) bursts.shift();

      if (machine === "RUN_END") {
        if (simTimeMs >= resultsAtSimMs) {
          machine = transitionEndlessRally(machine, "SHOW_RESULTS");
          publish(true);
        }
        return;
      }

      const desiredVelocity = clamp((player.targetX - player.x) * 5.2, -ENDLESS_RALLY_CONFIG.reachability.playerMaxSpeedPerSecond, ENDLESS_RALLY_CONFIG.reachability.playerMaxSpeedPerSecond);
      const maxVelocityChange = ENDLESS_RALLY_CONFIG.reachability.playerAccelerationPerSecond2 * dtSeconds;
      player.vx += clamp(desiredVelocity - player.vx, -maxVelocityChange, maxVelocityChange);
      player.x = clamp(player.x + player.vx * dtSeconds, -0.88, 0.88);
      player.racketHeight += (clamp(ball.height, 0.16, 0.72) - player.racketHeight) * Math.min(1, dtSeconds * 5.8);

      const priorBounceCount = ball.bounces;
      const priorZ = ball.z;
      stepArcadeBallInPlace(ball, dtSeconds);
      if (ball.bounces > priorBounceCount) audio.bounce();
      if (trail.length < ENDLESS_RALLY_CONFIG.feedback.trailPoints) trail.push({ x: ball.x, z: ball.z, height: ball.height, ageMs: 0 });
      else if (Math.floor(simTimeMs / 16) !== Math.floor((simTimeMs - dtMs) / 16)) {
        trail.shift();
        trail.push({ x: ball.x, z: ball.z, height: ball.height, ageMs: 0 });
      }

      if (swingPending && simTimeMs >= swingImpactSimMs) evaluateScheduledSwing();
      if (!swingPending && !playerReturnedBall && machine === "PLAYING" && simTimeMs > expectedContactSimMs + ENDLESS_RALLY_CONFIG.timing.defensiveMaxMs) {
        lastTimingErrorMs = simTimeMs - expectedContactSimMs;
        finishRun("late", "LATE", lastTimingErrorMs);
        return;
      }

      if (machine === "IMPACT" && simTimeMs >= impactEndsSimMs) machine = transitionEndlessRally(machine, "IMPACT_DONE");

      if (playerReturnedBall && priorZ > 0 && ball.z <= 0 && ball.height < 0.2) {
        audio.net();
        finishRun("net", "NET", lastTimingErrorMs);
        return;
      }
      if (playerReturnedBall && (Math.abs(ball.x) > 1.06 || ball.z < -1.14)) {
        finishRun("long", "LONG", lastTimingErrorMs);
        return;
      }
      if (playerReturnedBall && ball.z < -0.4) robotReturn();
      if (!ball.active && !playerReturnedBall) finishRun("unreachable", "UNREACHABLE", lastTimingErrorMs);
      publish();
    };

    const project = (x: number, z: number, ballHeight = 0) => {
      const depth = clamp((z + 1) / 2, 0, 1);
      const courtY = height * (0.16 + depth * 0.74);
      const halfWidth = width * (0.21 + depth * 0.25);
      return { x: width * 0.5 + x * halfWidth, y: courtY - ballHeight * height * (0.12 + depth * 0.08), scale: 0.58 + depth * 0.62 };
    };

    const courtPath = () => {
      const farLeft = project(-1, -1);
      const farRight = project(1, -1);
      const nearRight = project(1, 1);
      const nearLeft = project(-1, 1);
      context.beginPath();
      context.moveTo(farLeft.x, farLeft.y);
      context.lineTo(farRight.x, farRight.y);
      context.lineTo(nearRight.x, nearRight.y);
      context.lineTo(nearLeft.x, nearLeft.y);
      context.closePath();
    };

    const drawAthlete = (x: number, z: number, color: string, isPlayer: boolean, swing: number) => {
      const point = project(x, z);
      const scale = point.scale;
      const direction = isPlayer ? -1 : 1;
      context.save();
      context.translate(point.x, point.y);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.fillStyle = "rgba(0,0,0,.35)";
      context.beginPath(); context.ellipse(0, 8 * scale, 27 * scale, 8 * scale, 0, 0, Math.PI * 2); context.fill();
      context.strokeStyle = color;
      context.shadowColor = color;
      context.shadowBlur = 12;
      context.lineWidth = 6 * scale;
      const stride = Math.min(8, Math.abs(player.vx) * 7) * (isPlayer ? Math.sign(player.vx || 1) : 1);
      context.beginPath();
      context.moveTo(-7 * scale, -2 * scale); context.lineTo((-15 - stride) * scale, 15 * scale); context.lineTo(-23 * scale, 27 * scale);
      context.moveTo(7 * scale, -2 * scale); context.lineTo((15 + stride) * scale, 14 * scale); context.lineTo(24 * scale, 27 * scale);
      context.stroke();
      context.fillStyle = "#0a0c1d";
      context.beginPath(); context.moveTo(-17 * scale, -39 * scale); context.quadraticCurveTo(0, -48 * scale, 18 * scale, -39 * scale); context.lineTo(10 * scale, -3 * scale); context.lineTo(-10 * scale, -3 * scale); context.closePath(); context.fill(); context.stroke();
      context.fillStyle = color;
      context.beginPath(); context.ellipse(0, -53 * scale, 11 * scale, 13 * scale, 0, 0, Math.PI * 2); context.fill();
      context.strokeStyle = "#fff";
      context.lineWidth = 3 * scale;
      context.rotate(direction * (0.5 + swing * 1.15));
      context.beginPath(); context.moveTo(12 * scale, -31 * scale); context.lineTo(39 * scale, -47 * scale); context.stroke();
      context.beginPath(); context.ellipse(53 * scale, -55 * scale, 12 * scale, 20 * scale, -0.5, 0, Math.PI * 2); context.stroke();
      context.restore();
    };

    const draw = () => {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      const impulse = reducedMotionRef.current ? 0 : cameraImpulse;
      context.save();
      context.translate((Math.sin(simTimeMs * 0.19) * 3.5) * impulse, (Math.cos(simTimeMs * 0.23) * 2.2) * impulse);
      const sky = context.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, "#080715");
      sky.addColorStop(0.56, "#17123a");
      sky.addColorStop(1, "#080b17");
      context.fillStyle = sky;
      context.fillRect(-12, -12, width + 24, height + 24);
      context.fillStyle = "rgba(255,57,207,.13)";
      context.beginPath(); context.arc(width * 0.79, height * 0.16, width * 0.16, 0, Math.PI * 2); context.fill();
      context.fillStyle = "#0c1025";
      for (let index = 0; index < 18; index += 1) {
        const buildingWidth = width / 17;
        const buildingHeight = height * (0.04 + ((index * 31) % 8) / 75);
        context.fillRect(index * buildingWidth, height * 0.2 - buildingHeight, buildingWidth - 2, buildingHeight);
      }

      context.shadowColor = "#35ecff";
      context.shadowBlur = 20;
      courtPath();
      context.fillStyle = "rgba(8,28,48,.94)";
      context.fill();
      context.strokeStyle = "#35ecff";
      context.lineWidth = 2;
      context.stroke();
      context.shadowBlur = 0;

      const line = (ax: number, az: number, bx: number, bz: number, alpha = 0.62) => {
        const a = project(ax, az);
        const b = project(bx, bz);
        context.strokeStyle = `rgba(53,236,255,${alpha})`;
        context.lineWidth = 1.3;
        context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke();
      };
      [-0.72, 0, 0.72].forEach((x) => line(x, -1, x, 1, x === 0 ? 0.2 : 0.55));
      [-0.62, 0.62].forEach((z) => line(-1, z, 1, z));

      const netLeft = project(-1.05, 0, 0.3);
      const netRight = project(1.05, 0, 0.3);
      const netLeftBase = project(-1.05, 0);
      const netRightBase = project(1.05, 0);
      context.fillStyle = "rgba(255,57,207,.13)";
      context.beginPath(); context.moveTo(netLeft.x, netLeft.y); context.lineTo(netRight.x, netRight.y); context.lineTo(netRightBase.x, netRightBase.y); context.lineTo(netLeftBase.x, netLeftBase.y); context.closePath(); context.fill();
      context.strokeStyle = "#ff39cf";
      context.shadowColor = "#ff39cf";
      context.shadowBlur = 12;
      context.lineWidth = 3;
      context.beginPath(); context.moveTo(netLeft.x, netLeft.y); context.lineTo(netRight.x, netRight.y); context.stroke();
      context.shadowBlur = 0;

      const target = project(pattern.targetX, pattern.contactZ);
      if (machine === "PLAYING" && !playerReturnedBall) {
        context.strokeStyle = "rgba(255,235,73,.5)";
        context.lineWidth = 2;
        context.beginPath(); context.ellipse(target.x, target.y, 20 + Math.sin(simTimeMs * 0.008) * 4, 8, 0, 0, Math.PI * 2); context.stroke();
      }

      for (const point of trail) {
        const projected = project(point.x, point.z, point.height);
        const trailStrength = score.perfectStreak > 1 ? 0.55 : 0.28;
        context.fillStyle = `rgba(255,235,73,${Math.max(0, trailStrength * (1 - point.ageMs / 620))})`;
        context.beginPath(); context.arc(projected.x, projected.y, Math.max(2, 4 * projected.scale), 0, Math.PI * 2); context.fill();
      }

      drawAthlete(robot.x, -0.75, "#ff39cf", false, robot.swing);
      const swingProgress = swingPending ? clamp((simTimeMs - swingStartedSimMs) / Math.max(1, swingImpactSimMs - swingStartedSimMs), 0, 1) : 0;
      drawAthlete(player.x, player.z, "#35ecff", true, swingProgress);

      for (const burst of bursts) {
        const point = project(burst.x, burst.z, burst.height);
        const progress = burst.ageMs / 480;
        context.globalAlpha = Math.max(0, 1 - progress);
        context.strokeStyle = burst.label === "PERFECT" ? "#ffeb49" : burst.label === "DEFENSIVE" ? "#ff9d66" : "#35ecff";
        context.lineWidth = 3;
        context.beginPath(); context.ellipse(point.x, point.y, 12 + progress * 55, 6 + progress * 24, -0.3, 0, Math.PI * 2); context.stroke();
        context.globalAlpha = 1;
      }

      const shadow = project(ball.x, ball.z);
      const orb = project(ball.x, ball.z, ball.height);
      context.fillStyle = "rgba(0,0,0,.42)";
      context.beginPath(); context.ellipse(shadow.x, shadow.y, 9 * shadow.scale, 4 * shadow.scale, 0, 0, Math.PI * 2); context.fill();
      context.shadowColor = "#ffeb49";
      context.shadowBlur = 16;
      context.fillStyle = "#ffeb49";
      context.beginPath(); context.arc(orb.x, orb.y, Math.max(5, 7 * orb.scale), 0, Math.PI * 2); context.fill();
      context.shadowBlur = 0;
      context.restore();
    };

    const tick = (realMs: number) => {
      const elapsedSeconds = Math.min(0.05, (realMs - previousRealMs) / 1000);
      previousRealMs = realMs;
      if (visible && !document.hidden) {
        accumulatorSeconds = Math.min(0.1, accumulatorSeconds + elapsedSeconds);
        while (accumulatorSeconds >= ENDLESS_RALLY_CONFIG.fixedStepSeconds) {
          update(ENDLESS_RALLY_CONFIG.fixedStepSeconds);
          accumulatorSeconds -= ENDLESS_RALLY_CONFIG.fixedStepSeconds;
        }
        draw();
      }
      animationFrame = requestAnimationFrame(tick);
    };

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return;
      event.preventDefault();
      primaryAction("keyboard");
    };
    const onVisibility = () => { if (document.hidden) pause(); };
    const onWindowBlur = () => pause();
    stage.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onWindowBlur);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; previousRealMs = performance.now(); }, { rootMargin: "80px" });
    intersectionObserver.observe(stage);
    resize();
    analytics("tennis_mode_opened", { mode: "endless_rally" });
    publish(true);
    animationFrame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      stage.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onWindowBlur);
      audio.dispose();
      audioRef.current = null;
    };
  }, []);

  const primaryAction = (inputType: InputType) => {
    stageRef.current?.focus({ preventScroll: true });
    primaryActionRef.current(inputType);
  };

  const toggleDaily = () => {
    if (view.state === "PLAYING" || view.state === "IMPACT") return;
    setDaily((value) => {
      dailyRef.current = !value;
      return !value;
    });
  };

  const shareDaily = async () => {
    if (!view.result || !view.daily) return;
    const text = `VECTOR TENNIS — Daily Rally\nRally ${view.result.rally} · Perfect streak ${view.result.bestPerfectStreak}\n${view.dailyKey}`;
    try { await navigator.clipboard.writeText(text); } catch { /* Clipboard is optional. */ }
  };

  const todayKey = dailyRallySeed(new Date()).key;
  const best = daily ? stats.daily[view.dailyKey || todayKey]?.bestRally ?? 0 : stats.allTimeBestRally;
  const nearBest = best > 0 && view.rally >= Math.max(1, best - 2);
  const active = view.state === "PLAYING" || view.state === "IMPACT";

  return <section className={`endless-rally ${active ? "is-active" : ""}`} aria-labelledby="endless-rally-title">
    <div className="endless-topbar">
      <div><span>{daily ? "Daily Rally" : "Endless Rally"}</span><strong>RALLY {view.rally}</strong></div>
      <div className="endless-best"><span>{daily ? "Daily best" : "All-time best"}</span><strong>{best}</strong>{nearBest && active ? <b>{view.rally > best ? "NEW BEST" : "BEST IN SIGHT"}</b> : null}</div>
      <div className="endless-actions">
        <button type="button" aria-pressed={muted} onClick={() => setMuted((value) => !value)}>{muted ? "Sound off" : "Sound on"}</button>
        <button type="button" onClick={() => pauseActionRef.current()} disabled={!active}>Pause</button>
      </div>
    </div>

    <div
      ref={stageRef}
      className="endless-stage"
      tabIndex={0}
      role="application"
      aria-label="Vector Tennis Endless Rally. Press Space, click, or tap once to swing."
      onPointerDown={(event) => {
        event.preventDefault();
        primaryAction(event.pointerType === "touch" ? "touch" : "pointer");
      }}
    >
      <canvas ref={canvasRef} aria-hidden="true" />
      <p className="endless-score" aria-hidden="true"><span>Rally</span><strong>{view.rally}</strong></p>
      {view.feedback ? <p className={`endless-feedback feedback-${view.feedback.toLowerCase()}`}>{view.feedback}</p> : null}
      {active ? <div className="endless-live-meta" aria-hidden="true"><span>Precision {view.precisionScore}</span><span>{view.multiplier.toFixed(2)}×</span><span>Tier {view.tier + 1}</span></div> : null}

      {(view.state === "READY" || view.state === "TITLE") && <div className="endless-overlay endless-title">
        <p className="eyebrow">Vector Tennis</p>
        <h1 id="endless-rally-title">Endless Rally</h1>
        <p className="endless-best-line">Best: <strong>{best}</strong></p>
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => primaryAction("pointer")}><span>Space / click / tap</span>Play</button>
        <p>Tap at contact.</p>
        <nav aria-label="Tennis modes and help" onPointerDown={(event) => event.stopPropagation()}><button type="button" aria-pressed={daily} onClick={toggleDaily}>Daily Rally</button><button type="button" onClick={onOpenRacketLab} data-analytics-event="tennis_racket_lab_opened">Racket Lab</button><a href="#endless-how">How it works</a></nav>
      </div>}

      {view.state === "PAUSED" && <div className="endless-overlay endless-paused"><p className="eyebrow">Paused</p><h2>Rally held.</h2><button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => primaryAction("pointer")}>Resume</button></div>}

      {(view.state === "RUN_END" || view.state === "RESULTS") && view.result && <div className="endless-overlay endless-results" role="dialog" aria-modal="false" aria-labelledby="rally-results-heading">
        <p className="eyebrow">{view.personalBest ? "New personal best" : "Run complete"}</p>
        <h2 id="rally-results-heading">Rally {view.result.rally}</h2>
        <p className="result-cause"><strong>{view.result.timingLabel}</strong> · {view.result.failureCause}</p>
        <dl><div><dt>Perfect contacts</dt><dd>{view.result.perfectContacts}</dd></div><div><dt>Best Perfect streak</dt><dd>{view.result.bestPerfectStreak}</dd></div><div><dt>Mean timing error</dt><dd>{view.result.meanTimingErrorMs} ms</dd></div><div><dt>Precision</dt><dd>{view.result.precisionScore}</dd></div></dl>
        <p className="coach-brain"><span>Coach Brain</span>{view.result.coach}</p>
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => primaryAction("pointer")}><span>Space / click / tap</span>Play again</button>
        {view.daily ? <button className="share-result" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={shareDaily}>Copy Daily Rally result</button> : null}
      </div>}
    </div>

    <p className="sr-only" aria-live="polite">{active ? `Rally ${view.rally}. ${view.feedback}` : view.result ? `Run ended at rally ${view.result.rally}. ${view.result.failureCause}.` : "Ready to play."}</p>
    <div className="endless-footer" id="endless-how"><p><strong>One input.</strong> Space, click, or tap swings. The player handles footwork; you own the timing.</p><p><strong>Timing bands.</strong> Perfect ≤35 ms · Clean ≤80 ms · Defensive ≤130 ms. The windows never shrink.</p><p><strong>Difficulty.</strong> Ball speed, placement, depth, and spin rise every four returns.</p></div>
  </section>;
}
