"use client";
import Script from "next/script";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { MathText } from "./ReasonOSLab";
import { ECGConnections } from "./ECGConnections";
import { LEADS, LEAD_FIELDS } from "@/lib/reasonos/model";
import {
  CHEST_LEADS,
  CHEST_PLACEMENT,
  CONNECTED_INTERVALS,
  LEAD_DEFINITIONS,
  type ConnectionLead,
  type ConnectedInterval,
} from "@/lib/reasonos/connections";
import {
  compatibleVector,
  DIGITIZED_ECG_SHA256,
  decodeDigitizedECG,
  digitalInterval,
  digitalPhase,
  digitalValueAt,
  type DigitizedECG,
} from "@/lib/reasonos/digital-ecg";
import base from "./ReasonOSLab.module.css";
import s from "./DigitalECGScene.module.css";
const n = (v: number, d = 3) => Number(v.toFixed(d));
const X = 510,
  Y = 270,
  W = 650,
  SCALE = 90;
const traceX = (time: number) => X + ((time + 220) / 1060) * W;
const traceY = (value: number) => Y - value * SCALE;
const CX = 245,
  CY = 250,
  VS = 95;
const ALL_LEADS = [...LEADS, ...CHEST_LEADS];
const EXPLANATIONS = {
  P: "The P wave records atrial depolarization.",
  PR: "The PR segment follows atrial activation. The PR interval includes the P wave and runs to QRS onset.",
  QRS: "The QRS complex records ventricular depolarization. Its height in a lead is a signed projection, not the size of a contraction.",
  ST: "A near-baseline ST segment does not mean the heart is inactive: the ventricles are largely depolarized.",
  T: "The T wave records ventricular repolarization. Recovery-front direction and electrical-vector direction are different concepts.",
  next: "Corresponding QRS features mark the next ventricular cycle.",
  baseline:
    "A small reading means a small projection along this lead; other electrical components can still exist.",
};
export function DigitalECGScene() {
  const [data, setData] = useState<DigitizedECG | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const [lead, setLead] = useState<ConnectionLead>("II"),
    [time, setTime] = useState(38),
    [sideways, setSideways] = useState(0),
    [playing, setPlaying] = useState(false);
  const [kind, setKind] = useState<ConnectedInterval>("QRS"),
    [calipers, setCalipers] = useState<readonly [number, number]>([0, 85]);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const media = matchMedia("(max-width:850px)");
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const dragOffset = useRef(0);
  const dragging = useRef<"cursor" | "vector" | 0 | 1 | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    setError("");
    fetch(
      `/ecg-digitized/recording-b.json?v=${DIGITIZED_ECG_SHA256.slice(0, 12)}`,
      { signal: abort.signal },
    )
      .then(async (r) => {
        if (!r.ok) throw Error("The digitized source could not be loaded.");
        const bytes = await r.arrayBuffer();
        const digest = Array.from(
          new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
        )
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        if (digest !== DIGITIZED_ECG_SHA256)
          throw Error(
            "The digitized source did not match its released checksum.",
          );
        return decodeDigitizedECG(JSON.parse(new TextDecoder().decode(bytes)));
      })
      .then((d) => {
        if (!abort.signal.aborted) {
          setData(d);
          const rec = d.records.find((r) => r.lead === "II")!;
          setTime(rec.landmarksMs.qrsPeak);
          setCalipers(digitalInterval(rec, "QRS"));
        }
      })
      .catch((e) => {
        if (!abort.signal.aborted)
          setError(e instanceof Error ? e.message : "Source loading failed");
      });
    return () => abort.abort();
  }, [retry]);
  const record = data?.records.find((r) => r.lead === lead);
  useEffect(() => {
    if (!playing || !record) return;
    const timer = setInterval(
      () =>
        setTime((t) =>
          t >= Math.min(800, record.points.at(-1)![0])
            ? Math.max(-220, record.points[0][0])
            : t + 6,
        ),
      30,
    );
    return () => clearInterval(timer);
  }, [playing, record]);
  const value = record ? digitalValueAt(record, time) : null;
  const phase = record ? digitalPhase(record, time) : null;
  const vector = value
    ? compatibleVector(lead, value.voltageMv, sideways)
    : null;
  const duration = Math.abs(calipers[1] - calipers[0]);
  const sourceBounds = useMemo(() => {
    if (!record) return null;
    const xs = record.points.map((p) => p[2]),
      ys = record.points.map((p) => p[3]);
    return {
      x: Math.min(...xs) - 12,
      y: Math.min(...ys) - 15,
      w: Math.max(...xs) - Math.min(...xs) + 24,
      h: Math.max(...ys) - Math.min(...ys) + 30,
    };
  }, [record]);
  const segments = useMemo(() => {
    if (!record) return [];
    const result: { color: string; points: string }[] = [];
    for (let i = 0; i < record.points.length - 1; i++) {
      const a = record.points[i],
        b = record.points[i + 1],
        color = digitalPhase(record, (a[0] + b[0]) / 2).color;
      const text = `${n(traceX(a[0]))},${n(traceY(a[1]))} ${n(traceX(b[0]))},${n(traceY(b[1]))}`;
      const last = result.at(-1);
      if (last?.color === color)
        last.points += ` ${n(traceX(b[0]))},${n(traceY(b[1]))}`;
      else result.push({ color, points: text });
    }
    return result;
  }, [record]);
  function selectLead(next: ConnectionLead) {
    setLead(next);
    setPlaying(false);
    setSideways(0);
    if (data) {
      const r = data.records.find((r) => r.lead === next)!;
      setTime(Math.max(r.points[0][0], Math.min(time, r.points.at(-1)![0])));
      setCalipers(digitalInterval(r, kind));
    }
  }
  function selectInterval(next: ConnectedInterval) {
    if (!record) return;
    setKind(next);
    setCalipers(digitalInterval(record, next));
    setPlaying(false);
  }
  function localPoint(e: PointerEvent<SVGSVGElement>) {
    const matrix = e.currentTarget.getScreenCTM();
    if (!matrix) return null;
    const p = e.currentTarget.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    return p.matrixTransform(matrix.inverse());
  }
  function move(e: PointerEvent<SVGSVGElement>) {
    const p = localPoint(e);
    if (!p || !record || dragging.current === null) return;
    if (dragging.current === "vector" && vector) {
      const dx = ((compact ? (p.x + 12) / 1.6 : p.x) - CX) / VS,
        dy = ((compact ? p.y / 1.6 : p.y) - CY) / VS;
      setSideways(
        n(
          Math.max(
            -1.25,
            Math.min(
              1.25,
              dx * vector.normal[0] +
                dy * vector.normal[1] +
                dragOffset.current,
            ),
          ),
          2,
        ),
      );
      return;
    }
    if (compact) {
      p.x += 440;
      p.y -= 815;
    }
    const t = n(
      Math.max(
        record.points[0][0],
        Math.min(
          record.points.at(-1)![0],
          ((p.x - X) / W) * 1060 - 220 + dragOffset.current,
        ),
      ),
      1,
    );
    if (dragging.current === "cursor") setTime(t);
    else {
      const which = dragging.current;
      setCalipers((old) => (which === 0 ? [t, old[1]] : [old[0], t]));
    }
  }
  function pointerDown(e: PointerEvent<SVGSVGElement>) {
    const attr = (e.target as Element)
      .closest("[data-digital-handle]")
      ?.getAttribute("data-digital-handle");
    const p = localPoint(e);
    if (!p) return;
    dragOffset.current = 0;
    if (attr === "vector" && vector) {
      dragging.current = "vector";
      dragOffset.current =
        sideways -
        ((((compact ? (p.x + 12) / 1.6 : p.x) - CX) / VS) * vector.normal[0] +
          (((compact ? p.y / 1.6 : p.y) - CY) / VS) * vector.normal[1]);
    } else {
      if (compact) {
        p.x += 440;
        p.y -= 815;
      }
      if (attr === "0" || attr === "1") {
        dragging.current = Number(attr) as 0 | 1;
        dragOffset.current =
          calipers[Number(attr)] - (((p.x - X) / W) * 1060 - 220);
      } else if (p.x >= X && p.x <= X + W && p.y >= 70 && p.y <= 420)
        dragging.current = "cursor";
      else return;
    }
    setPlaying(false);
    e.currentTarget.setPointerCapture(e.pointerId);
    move(e);
  }
  return (
    <section
      id="ecg-connections"
      className={`${base.lab} ${s.digital}`}
      aria-labelledby="digital-ecg-title"
      data-digital-lead={lead}
      data-digital-voltage={value?.voltageMv}
      data-digital-time={value?.timeMs}
      data-compatible-projection={vector?.value}
      data-vector-x={vector?.vector[0]}
      data-vector-y={vector?.vector[1]}
      data-sideways={sideways}
    >
      <Script
        id="digital-ecg-katex"
        src="/quantum-computer-lab/vendor/katex.min.js"
        onReady={() => {
          window.dispatchEvent(new Event("reasonos-math-ready"));
        }}
      />
      <header className={s.heading}>
        <div>
          <span className={s.kicker}>The electrical view</span>
          <h2 id="digital-ecg-title">One lead measures one projection</h2>
          <p>
            Follow the cyan vector to its violet projection and the moving point
            on your digitally traced ECG.
          </p>
        </div>
        <button
          onClick={() => setPlaying(!playing)}
          disabled={!record}
          aria-pressed={playing}
        >
          {playing ? "Pause" : "Play the beat"}
        </button>
      </header>
      {error ? (
        <p role="alert">
          {error}{" "}
          <button onClick={() => setRetry((r) => r + 1)}>Retry source</button>
        </p>
      ) : !record || !value || !phase ? (
        <p role="status">Loading the digitized recording…</p>
      ) : (
        <>
          <nav className={s.leads} aria-label="Digitized ECG lead">
            {ALL_LEADS.map((l) => (
              <button
                key={l}
                onClick={() => selectLead(l)}
                aria-pressed={lead === l}
              >
                {l}
              </button>
            ))}
            <span>
              Recording B · <strong>{lead}</strong>
            </span>
          </nav>
          <div
            className={s.mobileViewport}
            tabIndex={0}
            role="region"
            aria-label="Linked digital heart vector and ECG trace"
          >
            <svg
              className={s.scene}
              viewBox={compact ? "0 0 760 1355" : "0 0 1200 520"}
              data-compact={compact}
              role="img"
              aria-label={`Digital lead ${lead}, ${n(value.timeMs, 1)} milliseconds, ${n(value.voltageMv)} millivolts. ${vector ? "The compatible vector and its projection update with the cursor." : "Chest voltage is shown relative to the Wilson central terminal."}`}
              onPointerDown={pointerDown}
              onPointerMove={move}
              onPointerUp={() => {
                dragging.current = null;
              }}
              onPointerCancel={() => {
                dragging.current = null;
              }}
            >
              <defs>
                <marker
                  id="digital-arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path
                    d="M0 0L6 3L0 6"
                    fill="none"
                    stroke="#75d3dc"
                    strokeWidth="1.5"
                  />
                </marker>
                <clipPath id="digital-trace-clip">
                  <rect x={X} y="70" width={W} height="330" />
                </clipPath>
              </defs>
              <g
                transform={compact ? "translate(-12 0) scale(1.6)" : undefined}
              >
                <text x="45" y="32" className={s.plotTitle}>
                  {vector
                    ? "A compatible frontal vector"
                    : "Chest electrode view"}
                </text>
                {vector ? (
                  <>
                    <circle
                      cx={CX}
                      cy={CY}
                      r="156"
                      fill="none"
                      stroke="#1c3444"
                    />
                    <line
                      x1={CX - 170}
                      x2={CX + 170}
                      y1={CY}
                      y2={CY}
                      stroke="#2d4556"
                    />
                    <line
                      x1={CX}
                      x2={CX}
                      y1={CY - 170}
                      y2={CY + 170}
                      stroke="#2d4556"
                    />
                    <g
                      transform="translate(5 35)"
                      opacity=".38"
                      aria-hidden="true"
                    >
                      <path
                        d="M222 165C199 145 172 169 181 190L201 212L237 194Z"
                        fill={phase.id === "P" ? "#efbd75" : "#294b5d"}
                      />
                      <path
                        d="M246 169C262 144 289 151 295 170L288 196L251 198Z"
                        fill={phase.id === "P" ? "#efbd75" : "#294b5d"}
                      />
                      <path
                        d="M203 199C170 204 183 254 229 281L246 248L236 206Z"
                        fill={
                          phase.id === "QRS" || phase.id === "next"
                            ? "#75d3dc"
                            : phase.id === "T"
                              ? "#bca7ee"
                              : "#294b5d"
                        }
                      />
                      <path
                        d="M239 198C278 177 311 200 296 235C285 264 260 284 247 292C236 260 228 233 239 198Z"
                        fill={
                          phase.id === "QRS" || phase.id === "next"
                            ? "#75d3dc"
                            : phase.id === "T"
                              ? "#bca7ee"
                              : "#294b5d"
                        }
                      />
                      <path
                        d="M239 201Q229 241 247 286M199 198L226 202M252 195L281 196"
                        fill="none"
                        stroke="#7094a5"
                      />
                      <path
                        d="M251 168C249 139 266 123 275 130L282 145C273 154 275 174 278 184"
                        fill="none"
                        stroke="#7094a5"
                        strokeWidth="8"
                      />
                      <circle cx="194" cy="171" r="3" fill="#efbd75" />
                      <path
                        d="M194 171Q215 176 230 196L239 211L221 237M239 211L263 247"
                        fill="none"
                        stroke={phase.id === "PR" ? "#eef8fd" : "#7094a5"}
                        strokeDasharray="3 4"
                      />
                    </g>
                    {LEADS.map((l) => {
                      const f = LEAD_FIELDS[l],
                        m = Math.hypot(...f),
                        ux = f[0] / m,
                        uy = f[1] / m;
                      return (
                        <g key={l}>
                          <line
                            x1={n(CX - ux * 160)}
                            y1={n(CY - uy * 160)}
                            x2={n(CX + ux * 160)}
                            y2={n(CY + uy * 160)}
                            stroke={lead === l ? "#bca7ee" : "#223b4b"}
                            strokeWidth={lead === l ? 1.8 : 1}
                          />
                          <text
                            x={n(CX + ux * 181)}
                            y={n(CY + uy * 181 + 4)}
                            textAnchor="middle"
                            className={lead === l ? s.activeAxis : s.axisText}
                          >
                            {l}
                          </text>
                        </g>
                      );
                    })}
                    <line
                      x1={n(CX + vector.foot[0] * VS - vector.normal[0] * 125)}
                      y1={n(CY + vector.foot[1] * VS - vector.normal[1] * 125)}
                      x2={n(CX + vector.foot[0] * VS + vector.normal[0] * 125)}
                      y2={n(CY + vector.foot[1] * VS + vector.normal[1] * 125)}
                      stroke="#bc7bcb"
                      opacity=".5"
                      strokeDasharray="3 6"
                    />
                    <line
                      x1={CX}
                      y1={CY}
                      x2={n(CX + vector.foot[0] * VS)}
                      y2={n(CY + vector.foot[1] * VS)}
                      stroke="#bca7ee"
                      strokeWidth="5"
                      opacity=".8"
                    />
                    <line
                      x1={n(CX + vector.vector[0] * VS)}
                      y1={n(CY + vector.vector[1] * VS)}
                      x2={n(CX + vector.foot[0] * VS)}
                      y2={n(CY + vector.foot[1] * VS)}
                      stroke="#bc7bcb"
                      strokeWidth="1.5"
                      strokeDasharray="4 5"
                    />
                    <line
                      x1={CX}
                      y1={CY}
                      x2={n(CX + vector.vector[0] * VS)}
                      y2={n(CY + vector.vector[1] * VS)}
                      stroke="#75d3dc"
                      strokeWidth="3"
                      markerEnd="url(#digital-arrow)"
                    />
                    <g data-digital-handle="vector">
                      <circle
                        cx={n(CX + vector.vector[0] * VS)}
                        cy={n(CY + vector.vector[1] * VS)}
                        r="15"
                        fill="transparent"
                      />
                      <circle
                        cx={n(CX + vector.vector[0] * VS)}
                        cy={n(CY + vector.vector[1] * VS)}
                        r="5"
                        fill="#e9f7f8"
                        stroke="#75d3dc"
                        strokeWidth="2"
                      />
                    </g>
                    <circle
                      cx={n(CX + vector.foot[0] * VS)}
                      cy={n(CY + vector.foot[1] * VS)}
                      r="4"
                      fill="#bca7ee"
                      pointerEvents="none"
                    />
                    <text x="45" y="477" className={s.caption}>
                      Drag the arrow along the dotted line.
                    </text>
                    <text x="45" y="498" className={s.caption}>
                      Its projection — and the trace value — stay fixed.
                    </text>
                  </>
                ) : (
                  <>
                    <path
                      d="M157 111Q130 140 110 160L90 332Q245 387 399 332L379 160Q350 141 324 111M157 111Q240 147 324 111M246 146V303"
                      fill="none"
                      stroke="#37586b"
                      strokeWidth="2"
                    />
                    {[
                      [232, 217],
                      [260, 217],
                      [286, 241],
                      [311, 266],
                      [345, 266],
                      [377, 266],
                    ].map(([x, y], i) => (
                      <g key={i}>
                        <circle
                          cx={x}
                          cy={y}
                          r="7"
                          stroke="#bca7ee"
                          fill={lead === CHEST_LEADS[i] ? "#75d3dc" : "#142632"}
                        />
                        <text
                          x={x}
                          y={y + (i < 2 ? -15 : 24)}
                          textAnchor="middle"
                          className={s.axisText}
                        >
                          {CHEST_LEADS[i]}
                        </text>
                      </g>
                    ))}
                    <text x="45" y="460" className={s.caption}>
                      {
                        CHEST_PLACEMENT[
                          CHEST_LEADS.indexOf(
                            lead as (typeof CHEST_LEADS)[number],
                          )
                        ]
                      }
                    </text>
                    <text x="45" y="484" className={s.caption}>
                      Chest voltage adds information outside the frontal plane.
                    </text>
                  </>
                )}
              </g>
              {!compact && vector && (
                <path
                  d={`M${n(CX + vector.foot[0] * VS)} ${n(CY + vector.foot[1] * VS)} C390 ${n(CY + vector.foot[1] * VS)} 405 ${n(traceY(value.voltageMv))} 459 ${n(traceY(value.voltageMv))}`}
                  fill="none"
                  stroke="#bca7ee"
                  strokeWidth="1"
                  strokeDasharray="3 6"
                  opacity=".5"
                  pointerEvents="none"
                />
              )}
              <g
                className={s.tracePlot}
                transform={compact ? "translate(-440 815)" : undefined}
              >
                <text x={X} y="32" className={s.plotTitle}>
                  Lead {lead} · voltage against time
                </text>
                <line x1="459" x2="459" y1="90" y2="370" stroke="#304c5d" />
                <line
                  x1="459"
                  x2="459"
                  y1={Y}
                  y2={n(traceY(value.voltageMv))}
                  stroke="#bca7ee"
                  strokeWidth="5"
                />
                <circle
                  cx="459"
                  cy={n(traceY(value.voltageMv))}
                  r="5"
                  fill="#bca7ee"
                />
                {[-1, -0.5, 0, 0.5, 1, 1.5, 2].map((v) => (
                  <g key={v}>
                    <line
                      x1={X}
                      x2={X + W}
                      y1={traceY(v)}
                      y2={traceY(v)}
                      stroke={v === 0 ? "#4c6779" : "#1a3040"}
                    />
                    <text
                      x={X - 12}
                      y={traceY(v) + 4}
                      textAnchor="end"
                      className={s.axisText}
                    >
                      {v.toFixed(1)}
                    </text>
                  </g>
                ))}
                {[-200, 0, 200, 400, 600, 800].map((t) => (
                  <g key={t}>
                    <line
                      x1={traceX(t)}
                      x2={traceX(t)}
                      y1="70"
                      y2="400"
                      stroke={t === 0 ? "#304c5d" : "#162d3b"}
                    />
                    <text
                      x={traceX(t)}
                      y="427"
                      textAnchor="middle"
                      className={s.axisText}
                    >
                      {t}
                    </text>
                  </g>
                ))}
                <text x={X - 28} y="58" className={s.axisText}>
                  mV
                </text>
                <text x={X + W} y="450" textAnchor="end" className={s.axisText}>
                  time / ms · QRS onset = 0
                </text>
                <g clipPath="url(#digital-trace-clip)">
                  <rect
                    x={Math.min(traceX(calipers[0]), traceX(calipers[1]))}
                    y="70"
                    width={Math.abs(traceX(calipers[1]) - traceX(calipers[0]))}
                    height="330"
                    fill="#75d3dc"
                    opacity=".035"
                  />
                  {segments.map((segment, i) => (
                    <polyline
                      key={i}
                      points={segment.points}
                      fill="none"
                      stroke={segment.color}
                      strokeWidth="2.1"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  ))}
                  <line
                    x1="459"
                    y1={n(traceY(value.voltageMv))}
                    x2={n(traceX(value.timeMs))}
                    y2={n(traceY(value.voltageMv))}
                    stroke="#bca7ee"
                    strokeDasharray="3 6"
                    opacity=".7"
                  />
                  {calipers.map((t, i) => (
                    <g key={i} data-digital-handle={i}>
                      <rect
                        x={traceX(t) - 10}
                        y="70"
                        width="20"
                        height="330"
                        fill="transparent"
                      />
                      <line
                        x1={traceX(t)}
                        x2={traceX(t)}
                        y1="70"
                        y2="400"
                        stroke="#8193a6"
                        strokeWidth="1"
                        strokeDasharray="3 5"
                      />
                      <circle
                        cx={traceX(t)}
                        cy="82"
                        r="9"
                        fill="#102532"
                        stroke="#91a9bc"
                      />
                      <text
                        x={traceX(t)}
                        y="86"
                        textAnchor="middle"
                        fill="#d2e0e9"
                        fontSize="10"
                      >
                        {i + 1}
                      </text>
                    </g>
                  ))}
                  <line
                    x1={n(traceX(value.timeMs))}
                    x2={n(traceX(value.timeMs))}
                    y1="70"
                    y2="400"
                    stroke="#75d3dc"
                    opacity=".65"
                  />
                  <circle
                    cx={n(traceX(value.timeMs))}
                    cy={n(traceY(value.voltageMv))}
                    r="5.5"
                    fill="#eefbfc"
                    stroke="#75d3dc"
                    strokeWidth="2"
                  />
                </g>
                <text x={X} y="478" fill="#75d3dc" fontSize={compact ? 26 : 19}>
                  {n(value.voltageMv)} mV
                </text>
                <text
                  x={X + 175}
                  y="478"
                  fill="#b0c5d2"
                  fontSize={compact ? 22 : 14}
                >
                  at {n(value.timeMs, 1)} ms
                </text>
                <text
                  x={X}
                  y="503"
                  fill={phase.color}
                  fontSize={compact ? 22 : 13}
                >
                  {phase.label}
                </text>
              </g>
            </svg>
          </div>
          <div className={s.transport}>
            <label>
              Position in the recorded beat
              <input
                aria-label="Digital ECG time"
                type="range"
                min={record.points[0][0]}
                max={record.points.at(-1)![0]}
                step="any"
                value={time}
                onChange={(e) => {
                  setPlaying(false);
                  setTime(Number(e.target.value));
                }}
              />
            </label>
            <div className={s.jump}>
              {["P", "QRS", "T"].map((p, i) => (
                <button
                  key={p}
                  onClick={() => {
                    setPlaying(false);
                    setTime(
                      i === 0
                        ? (record.landmarksMs.pStart +
                            record.landmarksMs.pEnd) /
                            2
                        : i === 1
                          ? record.landmarksMs.qrsPeak
                          : (record.landmarksMs.tStart +
                              record.landmarksMs.tEnd) /
                            2,
                    );
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className={s.explanation} aria-live="polite">
            <h3>{phase.label}</h3>
            <p>
              {EXPLANATIONS[phase.id]}{" "}
              {value.voltageMv > 0.015
                ? "The positive voltage places this point above the baseline."
                : value.voltageMv < -0.015
                  ? "The negative voltage places this point below the baseline."
                  : "The small signed voltage places this point near the baseline."}{" "}
              {vector &&
                Math.abs(value.voltageMv) > 0.015 &&
                (value.voltageMv > 0
                  ? "The frontal vector component toward the lead’s positive pole is positive."
                  : "The frontal vector component away from the lead’s positive pole is negative.")}
            </p>
          </div>
          <div className={s.equations}>
            <div>
              <span className={s.mathLabel}>Electrodes define the lead</span>
              <MathText
                tex={LEAD_DEFINITIONS[lead].formula}
                reading={LEAD_DEFINITIONS[lead].reading}
              />
              <p>
                Φ is electrode potential. RA, LA and LL are the right arm, left
                arm and left leg; WCT is their average.
              </p>
            </div>
            <div>
              <span className={s.mathLabel}>
                {vector
                  ? "The projection gives this voltage"
                  : "This point is read from the chest trace"}
              </span>
              {vector ? (
                <MathText
                  tex={`V_{${lead}}(t)=\\mathbf l_{${lead}}\\cdot\\mathbf d(t)\\approx(${n(vector.field[0])})(${n(vector.vector[0])})+(${n(vector.field[1])})(${n(vector.vector[1])})\\approx${n(value.voltageMv)}\\,\\mathrm{mV}`}
                  reading={`Lead coefficients ${n(vector.field[0])} and ${n(vector.field[1])} multiply compatible vector coordinates ${n(vector.vector[0])} and ${n(vector.vector[1])}; their sum is ${n(value.voltageMv)} millivolts.`}
                />
              ) : (
                <MathText
                  tex={`V_{${lead}}(${n(value.timeMs, 1)}\\,\\mathrm{ms})\\approx${n(value.voltageMv)}\\,\\mathrm{mV}`}
                  reading={`Digitized ${lead} at ${n(value.timeMs, 1)} milliseconds is approximately ${n(value.voltageMv)} millivolts.`}
                />
              )}
              <p>
                {vector
                  ? "The vector coordinates are in mV: x points toward the patient’s left and y inferiorly. Lead coefficients are dimensionless. This idealized frontal model retains augmented-lead scaling."
                  : "Chest voltages cannot be recovered from a frontal-axis angle alone."}
              </p>
            </div>
          </div>
          {vector && (
            <div className={s.nullspace}>
              <label>
                Unobserved component · move sideways without changing the trace
                <output>{sideways.toFixed(2)} mV</output>
                <input
                  aria-label="Unobserved perpendicular vector component"
                  type="range"
                  min="-1.25"
                  max="1.25"
                  step=".01"
                  value={sideways}
                  onChange={(e) => {
                    setPlaying(false);
                    setSideways(Number(e.target.value));
                  }}
                />
              </label>
              <button onClick={() => setSideways(0)}>Reset vector</button>
              <p>
                One lead fixes one projection. Multiple vectors satisfy it; this
                arrow is a compatible explanation, not a uniquely measured heart
                vector.
              </p>
            </div>
          )}
          <div className={s.interval}>
            <div className={s.intervalHeader}>
              <h3>Read an interval from the same trace</h3>
              <div>
                {CONNECTED_INTERVALS.map((k) => (
                  <button
                    key={k}
                    aria-pressed={kind === k}
                    onClick={() => selectInterval(k)}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <div className={s.intervalInputs}>
              {calipers.map((t, i) => (
                <label key={i}>
                  Marker {i + 1} / ms
                  <input
                    aria-label={`Digital time marker ${i + 1}`}
                    type="number"
                    step="any"
                    min={record.points[0][0]}
                    max={record.points.at(-1)![0]}
                    value={n(t, 1)}
                    onChange={(e) => {
                      const next = Math.max(
                        record.points[0][0],
                        Math.min(
                          record.points.at(-1)![0],
                          Number(e.target.value),
                        ),
                      );
                      setCalipers((old) =>
                        i === 0 ? [next, old[1]] : [old[0], next],
                      );
                    }}
                  />
                </label>
              ))}
              <MathText
                tex={`\\Delta t=|t_2-t_1|\\approx|${n(calipers[1], 1)}-${n(calipers[0], 1)}|\\,\\mathrm{ms}\\approx${n(duration, 1)}\\,\\mathrm{ms}`}
                reading={`The marked ${kind} interval is the absolute difference of the two displayed times, approximately ${n(duration, 1)} milliseconds.`}
              />
            </div>
            {kind === "RR" && duration > 0 && (
              <MathText
                tex={`\\mathrm{Rate}=\\frac{60\\,000}{RR_{\\mathrm{ms}}}\\approx\\frac{60\\,000}{${n(duration, 1)}}\\approx${n(60000 / duration, 1)}\\,\\mathrm{beats/min}`}
                reading={`The marked ventricular cycle of ${n(duration, 1)} milliseconds gives approximately ${n(60000 / duration, 1)} beats per minute.`}
              />
            )}
            <p>
              {kind === "PR"
                ? "P-wave onset to QRS onset."
                : kind === "QRS"
                  ? "Onset to end of the selected lead’s QRS complex."
                  : kind === "QT"
                    ? "QRS onset to T-wave end."
                    : "Corresponding QRS features in successive ventricular cycles."}{" "}
              Move the numbered markers; their positions, shaded interval and
              arithmetic update together.
            </p>
          </div>
          <details id="source-provenance" className={s.provenance}>
            <summary>
              Source and provenance · digitized from your ECG photograph
            </summary>
            <p>
              {data!.status} {data!.alignment} Dashed or faint source ink is
              reconstructed through the annotated guides; the original overlay
              is shown below.
            </p>
            <p>
              {data!.method} {data!.gridMethod} The time and voltage axes are
              estimated from the printed 25 mm/s, 10 mm/mV grid. Interpolation
              creates a readable display, not extra acquisition resolution.
            </p>
            <div className={s.provenanceLinks}>
              <a href="/ecg-digitized/recording-b.json">
                Digitized points, source coordinates and annotations
              </a>
              <a
                href="https://www.bem.fi/book/15/15.htm"
                target="_blank"
                rel="noreferrer"
              >
                Lead definitions and model assumptions
              </a>
            </div>
            {sourceBounds && (
              <svg
                className={s.audit}
                viewBox={`${sourceBounds.x} ${sourceBounds.y} ${sourceBounds.w} ${sourceBounds.h}`}
                role="img"
                aria-label={`Digitized ${lead} centreline over the original source pixels`}
              >
                <image href={data!.sourceImage} width="2110" height="1220" />
                <polyline
                  points={record.points.map((p) => `${p[2]},${p[3]}`).join(" ")}
                  fill="none"
                  stroke="#c33591"
                  strokeWidth=".8"
                />
              </svg>
            )}
            <p>
              Source image SHA-256: <code>{data!.sourceSHA256}</code>. Fiducials
              are author annotations, not clinician adjudication. This
              illustration does not establish clinical diagnostic accuracy or a
              measured vectorcardiogram.
            </p>
            <details id="photo-evidence" className={s.photoEvidence}>
              <summary>Original image calipers and ReasonOS evidence</summary>
              <ECGConnections embedded />
            </details>
          </details>
        </>
      )}
    </section>
  );
}
