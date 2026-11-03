"use client";

import Script from "next/script";
import { useMemo, useRef, useState } from "react";
import { MathText } from "./ReasonOSLab";
import {
  RECORDINGS,
  imageInterval,
  reportCalculations,
  type ImagePoint,
} from "@/lib/reasonos/recordings";
import {
  attemptTransformation,
  initialSnapshot,
  replayTrace,
  type KernelSnapshot,
  type Provenance,
  type Operator,
} from "@/lib/reasonos/kernel";
import { projectTrace } from "@/lib/reasonos/core/browser";
import base from "./ReasonOSLab.module.css";
import s from "./RecordedECG.module.css";

const n = (value: number, digits = 1) => Number(value.toFixed(digits));
const copy = (points: readonly ImagePoint[]): [ImagePoint, ImagePoint] => [
  { ...points[0] },
  { ...points[1] },
];
export function RecordedECG() {
  const [recordingId, setRecordingId] = useState("A");
  const recording = RECORDINGS.find((item) => item.id === recordingId)!;
  const [markers, setMarkers] = useState(() => copy(recording.initialMarkers));
  const [grid, setGrid] = useState(() => copy(recording.initialGrid));
  const [mm, setMm] = useState(25);
  const speed = recording.paperSpeed;
  const [errorPx, setErrorPx] = useState(1);
  const [kind, setKind] = useState("RR");
  const [mode, setMode] = useState<"interval" | "grid">("interval");
  const [full, setFull] = useState(false);
  const [zoom, setZoom] = useState(2);
  const initialFocus = {
    x: (recording.initialMarkers[0].x + recording.initialMarkers[1].x) / 2,
    y: recording.rhythm.y + recording.rhythm.height / 2,
  };
  const [focus, setFocus] = useState(initialFocus);
  const [place, setPlace] = useState<0 | 1>(0);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [message, setMessage] = useState("");
  const [caliperBasis, setCaliperBasis] = useState(false);
  const dragging = useRef<string | null>(null);
  const calibration = { a: grid[0], b: grid[1], mm, speed, errorPx };
  let interval: ReturnType<typeof imageInterval> | null = null;
  try {
    interval = imageInterval(markers[0], markers[1], calibration);
  } catch {
    /* A missing scale is shown before any measurement is admitted. */
  }
  const sourceKey = JSON.stringify({
    kind: "recording-image",
    recording: {
      id: recording.id,
      sha256: recording.sha256,
      width: recording.width,
      height: recording.height,
    },
    calibration,
    speed,
    gain: recording.gain,
    pixelsPerMm: interval?.pixelsPerMm ?? 0,
  });
  const calibrationEvent = [...snapshot.trace]
    .reverse()
    .find(
      (event) =>
        event.accepted &&
        event.operator === "Calibrate" &&
        event.evidenceRefs.includes(`source=${sourceKey}`),
    );
  const view = useMemo(
    () => projectTrace(snapshot.journal),
    [snapshot.journal],
  );
  const measurements = [...view.states.values()].filter(
    (state) =>
      state.role === "measurement" && state.payload.recordingId === sourceKey,
  );
  const latest = (measurementKind: string) =>
    [...measurements]
      .reverse()
      .find((state) => state.payload.kind === measurementKind);
  const rr = latest("RR"),
    qt = latest("QT");
  const useCalipers = Boolean(caliperBasis && rr && qt);
  const reported = reportCalculations(recording);
  const rrMs = useCalipers ? Number(rr!.payload.duration) : reported.rrMs;
  const qtMs = useCalipers ? Number(qt!.payload.duration) : recording.report.qt;
  const bazett = qtMs / Math.sqrt(rrMs / 1000),
    fridericia = qtMs / Math.cbrt(rrMs / 1000);
  const region = full
    ? { x: 0, y: 0, width: recording.width, height: recording.height }
    : recording.rhythm;
  const width = region.width / zoom,
    height = region.height / zoom;
  const frame = {
    x: Math.max(0, Math.min(focus.x - width / 2, recording.width - width)),
    y: Math.max(0, Math.min(focus.y - height / 2, recording.height - height)),
    width,
    height,
  };
  const dx = grid[1].x - grid[0].x,
    dy = grid[1].y - grid[0].y,
    len = Math.hypot(dx, dy) || 1;
  const axis = { x: dx / len, y: dy / len };
  const projected = interval
    ? {
        x: markers[0].x + axis.x * interval.projectedPx,
        y: markers[0].y + axis.y * interval.projectedPx,
      }
    : markers[1];
  const font = frame.width / 45;
  const provenance = (
    method: string,
    witnessType: Provenance["witnessType"] = "learner-derived",
  ): Provenance => ({
    source: recording.image,
    method,
    witnessType,
    verification:
      witnessType === "learner-derived" ? "user-confirmed" : "unverified",
    modelVersion: null,
  });
  function apply(
    operator: Operator,
    summary: string,
    inputs: string[],
    evidence: string[],
    state = snapshot,
    witness: Provenance["witnessType"] = "learner-derived",
  ) {
    return attemptTransformation(state, {
      operator,
      domain: "ecg",
      actor: witness === "learner-derived" ? "learner" : "system",
      inputStateIds: inputs,
      summary,
      provenance: provenance(summary, witness),
      evidenceRefs: [`source=${sourceKey}`, ...evidence],
    });
  }
  function source(state: KernelSnapshot) {
    const existing = state.trace.find(
      (event) =>
        event.operator === "Inspect" &&
        event.accepted &&
        event.evidenceRefs.includes(`source=${sourceKey}`),
    );
    if (existing?.outputStateId) return { state, id: existing.outputStateId };
    const next = apply(
      "Inspect",
      `Recording ${recording.id}: source image ${recording.sha256}`,
      [state.states[0].id],
      [`imageSha256=${recording.sha256}`, `image=${recording.image}`],
      state,
      "reference-derived",
    );
    return { state: next, id: next.states.at(-1)!.id };
  }
  function recordCalibration() {
    const src = source(snapshot);
    const next = apply(
      "Calibrate",
      `Recording ${recording.id}: selected grid span ${mm} mm at ${speed} mm/s`,
      [src.id],
      ["gridConfirmed=true"],
      src.state,
    );
    setSnapshot(next);
    setMessage(
      next.trace.at(-1)!.accepted
        ? "Grid calibration recorded with its source pixels."
        : "Calibration rejected. Check the grid span and source coordinates.",
    );
  }
  function recordMeasurement() {
    const src = source(snapshot);
    const next = apply(
      "Measure",
      `Recording ${recording.id} · ${kind} · selected image pixels`,
      [calibrationEvent?.outputStateId ?? src.id],
      [
        `kind=${kind}`,
        `imageAX=${markers[0].x}`,
        `imageAY=${markers[0].y}`,
        `imageBX=${markers[1].x}`,
        `imageBY=${markers[1].y}`,
      ],
      src.state,
    );
    setSnapshot(next);
    setMessage(
      next.trace.at(-1)!.accepted
        ? `${kind} saved from the image coordinates and current calibration.`
        : "Measurement rejected. Record a valid grid calibration and place marker 2 later than marker 1.",
    );
  }
  function switchRecording(id: string) {
    const next = RECORDINGS.find((item) => item.id === id)!;
    setRecordingId(id);
    setMarkers(copy(next.initialMarkers));
    setGrid(copy(next.initialGrid));
    setFull(false);
    setZoom(2);
    setMode("interval");
    setCaliperBasis(false);
    setMessage("");
    setFocus({
      x: (next.initialMarkers[0].x + next.initialMarkers[1].x) / 2,
      y: next.rhythm.y + next.rhythm.height / 2,
    });
  }
  function updatePoint(key: string, p: ImagePoint) {
    const point = {
      x: n(Math.max(0, Math.min(recording.width, p.x))),
      y: n(Math.max(0, Math.min(recording.height, p.y))),
    };
    const index = Number(key[1]);
    if (key[0] === "c")
      setGrid(
        (old) =>
          old.map((value, j) => (j === index ? point : value)) as [
            ImagePoint,
            ImagePoint,
          ],
      );
    else
      setMarkers(
        (old) =>
          old.map((value, j) => (j === index ? point : value)) as [
            ImagePoint,
            ImagePoint,
          ],
      );
  }
  function imagePoint(svg: SVGSVGElement, x: number, y: number) {
    const point = svg.createSVGPoint();
    point.x = x;
    point.y = y;
    const matrix = svg.getScreenCTM();
    return matrix ? point.matrixTransform(matrix.inverse()) : null;
  }
  function selectMode(next: "interval" | "grid") {
    setMode(next);
    const points = next === "grid" ? grid : markers;
    setFocus({
      x: (points[0].x + points[1].x) / 2,
      y:
        next === "grid"
          ? (points[0].y + points[1].y) / 2
          : recording.rhythm.y + recording.rhythm.height / 2,
    });
  }
  function exportTrace() {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              source: "recorded-ecg",
              recording,
              markers,
              calibration,
              snapshot,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "recorded-ecg-trace.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div
      id="recorded-ecg"
      className={`${base.lab} ${s.workspace}`}
      data-recording={recording.id}
      data-source-sha={recording.sha256}
    >
      <Script
        src="/quantum-computer-lab/vendor/katex.min.js"
        onReady={() => {
          window.dispatchEvent(new Event("reasonos-math-ready"));
        }}
      />
      <div className={base.header}>
        <div>
          <h2>Recorded ECG workspace</h2>
          <p>
            The original waveform image, its device report, and your pixel-based
            measurements.
          </p>
        </div>
        <div className={base.controls}>
          {RECORDINGS.map((item) => (
            <button
              key={item.id}
              aria-pressed={recording.id === item.id}
              onClick={() => switchRecording(item.id)}
            >
              Recording {item.id}
            </button>
          ))}
        </div>
      </div>
      <div className={s.layout}>
        <section className={s.source} aria-labelledby="recorded-image-title">
          <div className={s.sourceHead}>
            <h3 id="recorded-image-title">
              Recording {recording.id} ·{" "}
              {full ? "12-lead sheet" : "lead II rhythm strip"}
            </h3>
            <span>Recorded pixels</span>
          </div>
          <div className={s.viewTools}>
            <button
              aria-pressed={!full}
              onClick={() => {
                setFull(false);
                setZoom(2);
                selectMode(mode);
              }}
            >
              Rhythm strip
            </button>
            <button
              aria-pressed={full}
              onClick={() => {
                setFull(true);
                setZoom(1);
                setFocus({ x: recording.width / 2, y: recording.height / 2 });
              }}
            >
              Full 12-lead ECG
            </button>
            <label>
              Zoom{" "}
              <input
                aria-label="ECG image zoom"
                type="range"
                min="1"
                max="5"
                step=".25"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </label>
          </div>
          <svg
            className={s.image}
            viewBox={`${n(frame.x, 3)} ${n(frame.y, 3)} ${n(frame.width, 3)} ${n(frame.height, 3)}`}
            role="img"
            aria-label={`Actual recording ${recording.id} with draggable interval markers and a local grid ruler. Coordinates refer to the source image.`}
            onPointerDown={(e) => {
              const key = (e.target as Element)
                .closest("[data-image-marker]")
                ?.getAttribute("data-image-marker");
              const p = imagePoint(e.currentTarget, e.clientX, e.clientY);
              if (!p) return;
              dragging.current =
                key ?? `${mode === "grid" ? "c" : "m"}${place}`;
              updatePoint(dragging.current, p);
              if (!key) setPlace(place === 0 ? 1 : 0);
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (dragging.current) {
                const p = imagePoint(e.currentTarget, e.clientX, e.clientY);
                if (p) updatePoint(dragging.current, p);
              }
            }}
            onPointerUp={() => {
              dragging.current = null;
            }}
            onPointerCancel={() => {
              dragging.current = null;
            }}
          >
            <image
              href={recording.image}
              x="0"
              y="0"
              width={recording.width}
              height={recording.height}
            />
            <path
              d={`M${grid[0].x} ${grid[0].y}L${grid[1].x} ${grid[1].y}`}
              stroke="#7c3d9f"
              strokeWidth={frame.width / 260}
              strokeDasharray={`${frame.width / 70} ${frame.width / 100}`}
            />
            <path
              d={`M${markers[0].x} ${markers[0].y}L${n(projected.x, 3)} ${n(projected.y, 3)}`}
              stroke="#08647d"
              strokeWidth={frame.width / 220}
            />
            <path
              d={`M${n(projected.x, 3)} ${n(projected.y, 3)}L${markers[1].x} ${markers[1].y}`}
              stroke="#08647d"
              strokeWidth={frame.width / 350}
              strokeDasharray={`${frame.width / 90} ${frame.width / 120}`}
            />
            {[
              ...markers.map((point, j) => ({
                point,
                key: `m${j}`,
                label: String(j + 1),
                color: "#08647d",
              })),
              ...grid.map((point, j) => ({
                point,
                key: `c${j}`,
                label: j ? "G₂" : "G₁",
                color: "#7c3d9f",
              })),
            ].map(({ point, key, label, color }) => (
              <g key={key} data-image-marker={key}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={frame.width / 28}
                  fill="transparent"
                />
                <line
                  x1={n(point.x + axis.y * frame.height * 0.45, 3)}
                  y1={n(point.y - axis.x * frame.height * 0.45, 3)}
                  x2={n(point.x - axis.y * frame.height * 0.45, 3)}
                  y2={n(point.y + axis.x * frame.height * 0.45, 3)}
                  stroke={color}
                  strokeWidth={frame.width / 350}
                  opacity=".65"
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={frame.width / 105}
                  fill="white"
                  stroke={color}
                  strokeWidth={frame.width / 300}
                />
                <text
                  x={point.x + frame.width / 55}
                  y={point.y - frame.height / 12}
                  fill={color}
                  fontSize={font}
                  fontWeight="600"
                >
                  {label}
                </text>
              </g>
            ))}
          </svg>
          <p className={base.caption}>
            Drag 1 and 2 onto the features you want to measure. The purple ruler
            sets the local paper direction and scale; the photograph’s tilt is
            retained.
          </p>
          <div className={base.controls}>
            <button
              aria-pressed={mode === "interval"}
              onClick={() => selectMode("interval")}
            >
              Place interval markers
            </button>
            <button
              aria-pressed={mode === "grid"}
              onClick={() => selectMode("grid")}
            >
              Place grid ruler
            </button>
            <span>
              Next image click places{" "}
              {mode === "grid" ? "grid point" : "marker"} {place + 1}.
            </span>
          </div>
          <div className={s.measureSummary}>
            <div>
              <small>Selected pixel interval</small>
              <strong>
                {interval ? n(Math.abs(interval.projectedPx)) : "—"} px
              </strong>
            </div>
            <div>
              <small>
                {calibrationEvent
                  ? "From recorded calibration"
                  : "Grid calibration pending"}
              </small>
              <strong
                data-measured-duration={
                  calibrationEvent ? interval?.duration : undefined
                }
              >
                {calibrationEvent && interval
                  ? `${n(interval.duration)} ms`
                  : "Set the grid span below"}
              </strong>
            </div>
          </div>
          <details className={base.settings}>
            <summary>Calibrate the grid and record a measurement</summary>
            <p className={base.caption}>
              Place G₁ and G₂ on a horizontal grid span near the selected beat.
              Five large boxes span 25 mm. Initial markers are movable starting
              positions.
            </p>
            <div className={s.inputs}>
              <label>
                Grid span / mm
                <input
                  aria-label="Known grid span in millimetres"
                  type="number"
                  min="1"
                  max="100"
                  value={mm}
                  onChange={(e) => setMm(Number(e.target.value))}
                />
              </label>
              <label>
                Printed paper speed
                <output>{speed} mm/s</output>
              </label>
              <label>
                Endpoint bound / px
                <input
                  aria-label="Image endpoint uncertainty"
                  type="number"
                  min="0"
                  max="10"
                  step=".25"
                  value={errorPx}
                  onChange={(e) => setErrorPx(Number(e.target.value))}
                />
              </label>
            </div>
            <div className={s.coordinates}>
              {[
                ...grid.map((point, j) => ({
                  point,
                  key: `c${j}`,
                  name: `Grid ${j + 1}`,
                })),
                ...markers.map((point, j) => ({
                  point,
                  key: `m${j}`,
                  name: `Marker ${j + 1}`,
                })),
              ].map(({ point, key, name }) => (
                <fieldset key={key}>
                  <legend>{name}</legend>
                  {(["x", "y"] as const).map((axis) => (
                    <label key={axis}>
                      {axis}
                      <input
                        aria-label={`${name} ${axis}`}
                        type="number"
                        min="0"
                        max={axis === "x" ? recording.width : recording.height}
                        step=".1"
                        value={point[axis]}
                        onChange={(e) =>
                          updatePoint(key, {
                            ...point,
                            [axis]: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                  ))}
                </fieldset>
              ))}
            </div>
            <button onClick={recordCalibration} disabled={!interval}>
              Confirm grid span and record calibration
            </button>
            {interval && (
              <MathText
                tex={`\\Delta t=\\frac{${n(Math.abs(interval.projectedPx), 2)}\\,\\mathrm{px}}{${n(interval.pixelsPerMm, 3)}\\,\\mathrm{px/mm}\\cdot${speed}\\,\\mathrm{mm/s}}\\,1000\\approx${n(interval.duration)}\\,\\mathrm{ms}`}
                reading={`Projected interval ${n(Math.abs(interval.projectedPx), 2)} image pixels divided by ${n(interval.pixelsPerMm, 3)} pixels per millimetre and ${speed} millimetres per second gives ${n(interval.duration)} milliseconds. This is a preview until the grid is confirmed.`}
              />
            )}
            <div className={base.controls}>
              <label>
                Interval kind
                <select
                  aria-label="Recorded interval kind"
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                >
                  {["RR", "PR", "QRS", "QT"].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </label>
              <button onClick={recordMeasurement}>
                Record image measurement
              </button>
            </div>
            {calibrationEvent && interval && (
              <p className={base.caption}>
                Image-based interval: {n(interval.low)}–{n(interval.high)} ms
                under the chosen endpoint bound. This includes grid-scale and
                direction uncertainty.{" "}
                {kind === "RR" && interval.duration > 0
                  ? `Rate from these selected peaks: ${n(60000 / interval.duration)} bpm.`
                  : ""}
              </p>
            )}
          </details>
        </section>
        <section
          className={s.calculations}
          aria-labelledby="recorded-calculation-title"
        >
          <h3 id="recorded-calculation-title">
            Calculations from this recording
          </h3>
          <div className={s.report}>
            <span>Transcribed device report · Recording {recording.id}</span>
            <dl>
              {[
                ["Rate", `${recording.report.rate} bpm`],
                ["PR", `${recording.report.pr} ms`],
                ["QRS", `${recording.report.qrs} ms`],
                ["QT", `${recording.report.qt} ms`],
                ["QTc", `${recording.report.qtc} ms`],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className={s.basis}>
            <label>
              <input
                type="checkbox"
                checked={useCalipers}
                disabled={!rr || !qt}
                onChange={(e) => setCaliperBasis(e.target.checked)}
              />
              Use my saved RR and QT measurements
            </label>
            <small>
              {useCalipers
                ? "Inputs: two admitted measurements from this image and calibration."
                : "Inputs: the device-reported rate and QT. Save RR and QT to use calipers instead."}
            </small>
          </div>
          <div
            data-calculation-basis={
              useCalipers ? "image-calipers" : "device-report"
            }
          >
            <p>
              {useCalipers
                ? "RR measured between your markers"
                : "RR inferred from the reported rate"}
            </p>
            <MathText
              tex={
                useCalipers
                  ? `RR\\approx${n(rrMs)}\\,\\mathrm{ms}`
                  : `RR=\\frac{60000\\,\\mathrm{ms/min}}{${recording.report.rate}\\,\\mathrm{beats/min}}\\approx${n(rrMs)}\\,\\mathrm{ms}`
              }
              reading={`${useCalipers ? "Image-measured RR" : "RR derived from the reported rate"}: ${n(rrMs)} milliseconds.`}
            />
            <p>Bazett · QT divided by the square root of RR in seconds</p>
            <MathText
              tex={`QTc_B=\\frac{${n(qtMs)}\\,\\mathrm{ms}}{\\sqrt{${n(rrMs / 1000, 4)}\\,\\mathrm{s}/1\\,\\mathrm{s}}}\\approx${n(bazett)}\\,\\mathrm{ms}`}
              reading={`Bazett QT correction: QT ${n(qtMs)} milliseconds, RR ${n(rrMs)} milliseconds, result ${n(bazett)} milliseconds.`}
            />
            <p>Fridericia · QT divided by the cube root of RR in seconds</p>
            <MathText
              tex={`QTc_F=\\frac{${n(qtMs)}\\,\\mathrm{ms}}{\\sqrt[3]{${n(rrMs / 1000, 4)}\\,\\mathrm{s}/1\\,\\mathrm{s}}}\\approx${n(fridericia)}\\,\\mathrm{ms}`}
              reading={`Fridericia QT correction gives ${n(fridericia)} milliseconds from the same recorded inputs.`}
            />
          </div>
          <p className={base.caption}>
            The report gives QTc {recording.report.qtc} ms without naming its
            formula. Both calculations use the same recorded inputs and state
            their method.
          </p>
          <button
            onClick={() => {
              const src = source(snapshot);
              let state = src.state;
              let reportId = src.id;
              if (!useCalipers) {
                const report = apply(
                  "Inspect",
                  `Device-report transcription for recording ${recording.id}`,
                  [src.id],
                  [`report=${JSON.stringify(recording.report)}`],
                  state,
                  "machine-derived",
                );
                state = report;
                reportId = report.states.at(-1)!.id;
              }
              const inputs = useCalipers ? [rr!.id, qt!.id] : [reportId];
              const next = apply(
                "AttachEvidence",
                `Recording ${recording.id}: QTc comparison from ${useCalipers ? "image calipers" : "device report"}`,
                inputs,
                [
                  `basis=${useCalipers ? "image-calipers" : "device-report"}`,
                  `RRms=${rrMs}`,
                  `QTms=${qtMs}`,
                  `bazettMs=${bazett}`,
                  `fridericiaMs=${fridericia}`,
                ],
                state,
                "application-calculated",
              );
              setSnapshot(next);
              setMessage("Calculation recorded with its source dependencies.");
            }}
          >
            Record this calculation
          </button>
        </section>
      </div>
      <p className={base.notice} role="status">
        {message}
      </p>
      <details className={base.settings}>
        <summary>
          Recorded evidence and calculation trace · {snapshot.trace.length}{" "}
          events
        </summary>
        <div className={s.ledger}>
          {snapshot.trace.map((event) => (
            <div key={event.id}>
              <span>
                {event.sequence}. {event.operator}
              </span>
              <strong>{event.accepted ? "Admitted" : "Rejected"}</strong>
              <p>{event.summary}</p>
            </div>
          ))}
        </div>
        <div className={base.controls}>
          <button
            onClick={() => {
              try {
                replayTrace(snapshot.trace, snapshot.journal);
                setMessage("Recorded-image trace replay verified.");
              } catch {
                setMessage("Trace verification failed.");
              }
            }}
          >
            Verify recorded trace
          </button>
          <button onClick={exportTrace}>Export recorded evidence</button>
        </div>
        <pre
          className={base.traceJson}
          tabIndex={0}
          aria-label="Recorded ECG source and measurement trace"
        >
          {JSON.stringify(snapshot, null, 2)}
        </pre>
      </details>
      <details className={base.settings}>
        <summary>Recording source and image coordinates</summary>
        <p>
          Source: {recording.image} · {recording.width} × {recording.height}{" "}
          pixels. SHA-256: <code>{recording.sha256}</code>. Public recording{" "}
          {recording.id} corresponds to archive file {recording.archiveImage}.
          The waveform image is unchanged; rulers and markers are overlays.
          Local grid calibration accounts for tilt and an explicit pixel bound,
          with perspective varying across the photographed page.
        </p>
      </details>
    </div>
  );
}
