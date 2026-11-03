"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  attemptTransformation,
  initialSnapshot,
  replayTrace,
  type Operator,
  type Provenance,
} from "@/lib/reasonos/kernel";
import { correctedQt, frontalAxis, intervalMs } from "@/lib/reasonos/vector";
import {
  DEFAULT_MODEL,
  LEADS,
  LEAD_FIELDS,
  componentsAt,
  electrodePotentials,
  landmarks,
  leadVoltages,
  narrowQrsRule,
  phaseAt,
  qrsArea,
  validateModel,
  vectorAt,
  type EcgModel,
  type Lead,
} from "@/lib/reasonos/model";
import { matchEvidencePath } from "@/lib/reasonos/reference-ecg-plugin";
import type { StateId } from "@/lib/reasonos/core/types";
import styles from "./ReasonOSLab.module.css";
import "../../public/quantum-computer-lab/vendor/katex.min.css";

const fmt = (value: number, digits = 3) =>
  Math.abs(value) < 0.0005 ? "0" : Number(value.toFixed(digits)).toString();
// SVG coordinates use stable decimal precision across browser math engines.
const svgNumber = (value: number) => Number(value.toFixed(6));
const leadTex = (lead: Lead) => `\\mathrm{${lead}}`;
const provenance = (
  method: string,
  witnessType: Provenance["witnessType"] = "application-calculated",
): Provenance => ({
  source: "ECG-FRONTAL-1 synthetic source",
  method,
  verification:
    witnessType === "learner-derived"
      ? "user-confirmed"
      : "synthetic-reference",
  witnessType,
});
type MathWindow = Window & {
  katex?: {
    render: (tex: string, element: HTMLElement, options: object) => void;
  };
};
function MathText({ tex, reading }: { tex: string; reading: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const render = () => {
      if (ref.current)
        (window as MathWindow).katex?.render(tex, ref.current, {
          displayMode: true,
          throwOnError: true,
          output: "htmlAndMathml",
          strict: "error",
        });
    };
    render();
    window.addEventListener("reasonos-math-ready", render);
    return () => window.removeEventListener("reasonos-math-ready", render);
  }, [tex]);
  return (
    <span
      ref={ref}
      className={styles.math}
      role="math"
      aria-label={reading}
      data-tex={tex}
    >
      {reading}
    </span>
  );
}
type MeasureKind = "QRS" | "PR" | "QT" | "RR";
interface RecordedMeasurement {
  key: string;
  stateId: string;
  kind: MeasureKind;
  duration: number;
  uncertainty: number;
}

export function ReasonOSLab() {
  const [model, setModel] = useState<EcgModel>(DEFAULT_MODEL);
  const [lead, setLead] = useState<Lead>("II");
  const [time, setTime] = useState(235);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [speed, setSpeed] = useState(25);
  const [gain, setGain] = useState(10);
  const [kind, setKind] = useState<MeasureKind>("QRS");
  const [manual, setManual] = useState<readonly [number, number] | null>(null);
  const [endpointError, setEndpointError] = useState(2);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [calibration, setCalibration] = useState<{
    key: string;
    stateId: string;
  } | null>(null);
  const [measurement, setMeasurement] = useState<RecordedMeasurement | null>(
    null,
  );
  const [selectedEvent, setSelectedEvent] = useState(0);
  const [message, setMessage] = useState("");
  const [observations, setObservations] = useState({
    leadI: false,
    avf: false,
    axis: false,
  });
  const dragging = useRef<0 | 1 | null>(null);
  const graphRef = useRef<HTMLDivElement>(null);
  const pxPerMm = 12,
    left = 65,
    plotWidth = 864;
  const pxPerMs = (speed * pxPerMm) / 1000;
  const duration = plotWidth / pxPerMs;
  const scale = {
    speedMmPerSecond: speed,
    gainMmPerMv: gain,
    pixelsPerMm: pxPerMm,
  };
  const key = JSON.stringify({ model, speed, gain, pixelsPerMm: pxPerMm });
  const m = landmarks(model);
  const reference: Record<MeasureKind, readonly [number, number]> = {
    QRS: [m.qrsStart, m.qrsEnd],
    PR: [m.pStart, m.qrsStart],
    QT: [m.qrsStart, m.tEnd],
    RR: [200, 200 + model.rr],
  };
  const calipers = manual || reference[kind];
  const interval = intervalMs((calipers[1] - calipers[0]) * pxPerMs, scale);
  const uncertainty = 2 * endpointError;
  const vector = vectorAt(time, model),
    voltages = leadVoltages(vector),
    potentials = electrodePotentials(vector);
  const field = LEAD_FIELDS[lead],
    norm = Math.hypot(...field),
    unit = field.map((x) => x / norm);
  const dot = vector[0] * unit[0] + vector[1] * unit[1];
  const phase = phaseAt(time, model),
    cycleTime = time % model.rr;
  const qtc = correctedQt(model.qt, model.rr);
  const area = useMemo(() => qrsArea(model), [model]);
  const axisLeads = leadVoltages(area),
    axis = frontalAxis(axisLeads.I, axisLeads.aVF);
  const calibrationCurrent = calibration?.key === key;
  const rule = narrowQrsRule({
    duration: measurement?.kind === "QRS" ? measurement.duration : 0,
    uncertainty: measurement?.uncertainty ?? 0,
    calibrated: calibrationCurrent,
    currentSource: measurement?.key === key && measurement.kind === "QRS",
  });
  const event = snapshot.trace.find((item) => item.sequence === selectedEvent);
  const origin = snapshot.states[0].id;

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReduced(media.matches);
      if (media.matches) setPlaying(false);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!playing) return;
    let frame = 0,
      previous = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - previous, 60);
      previous = now;
      setTime((t) => (t + dt * 0.25) % duration);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", pause);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", pause);
    };
  }, [playing, duration]);
  useEffect(() => {
    graphRef.current?.scrollTo({
      left: graphRef.current.scrollWidth,
      behavior: reduced ? "instant" : "smooth",
    });
  }, [snapshot.trace.length, reduced]);

  const paths = useMemo(
    () =>
      Object.fromEntries(
        LEADS.map((name) => [
          name,
          Array.from({ length: Math.ceil(duration / 2) + 1 }, (_, j) => {
            const t = Math.min(j * 2, duration),
              v = leadVoltages(vectorAt(t, model))[name];
            return `${fmt(left + t * pxPerMs)},${fmt(240 - v * gain * pxPerMm)}`;
          }).join(" "),
        ]),
      ) as Record<Lead, string>,
    [duration, pxPerMs, gain, model],
  );
  const miniPaths = useMemo(
    () =>
      Object.fromEntries(
        LEADS.map((name) => [
          name,
          Array.from(
            { length: 401 },
            (_, j) =>
              `${10 + j * 0.8},${fmt(39 - 27 * leadVoltages(vectorAt((j * model.rr) / 200, model))[name])}`,
          ).join(" "),
        ]),
      ) as Record<Lead, string>,
    [model],
  );
  const loop = useMemo(
    () =>
      Array.from({ length: 181 }, (_, j) => {
        const v = componentsAt(200 + (j * model.qrs) / 180, model).QRS;
        return `${fmt(180 + v[0] * 95)},${fmt(160 + v[1] * 95)}`;
      }).join(" "),
    [model],
  );

  function updateModel(next: EcgModel) {
    next.qt = Math.max(next.qrs + 120, Math.min(next.qt, next.rr - 240, 520));
    validateModel(next);
    setModel(next);
    setManual(null);
    setMessage("");
  }
  function append(
    operator: Operator,
    summary: string,
    method: string,
    options: {
      inputs?: string[];
      accepted?: boolean;
      evidence?: string[];
      learner?: boolean;
      revisionOf?: string;
    } = {},
  ) {
    const next = attemptTransformation(snapshot, {
      operator,
      domain: "ecg",
      actor: options.learner ? "learner" : "system",
      inputStateIds: options.inputs || [snapshot.states.at(-1)!.id],
      summary,
      provenance: provenance(
        method,
        options.learner ? "learner-derived" : "application-calculated",
      ),
      domainAccepted: options.accepted,
      evidenceRefs: [`source=${key}`, ...(options.evidence || [])],
      revisionOf: options.revisionOf,
    });
    setSnapshot(next);
    setSelectedEvent(next.trace.length);
    return next.trace.at(-1)!;
  }
  function recordCalibration() {
    let next = snapshot;
    const previous = next.trace.find(
      (item) =>
        item.operator === "Inspect" &&
        item.provenance.witnessType === "source" &&
        item.evidenceRefs.includes(`source=${key}`),
    );
    if (!previous)
      next = attemptTransformation(next, {
        operator: "Inspect",
        domain: "ecg",
        actor: "system",
        inputStateIds: [origin],
        summary: `Synthetic source: RR ${model.rr} ms; PR ${model.pr} ms; QRS ${model.qrs} ms; QT ${model.qt} ms`,
        provenance: provenance(
          "Analytic finite-support source and declared lead geometry",
          "source",
        ),
        evidenceRefs: [`source=${key}`],
      });
    const input = previous?.outputStateId || next.states.at(-1)!.id;
    next = attemptTransformation(next, {
      operator: "Calibrate",
      domain: "ecg",
      actor: "system",
      inputStateIds: [input],
      summary: `Source scale: ${speed} mm/s, ${gain} mm/mV, ${pxPerMm} SVG units/mm`,
      provenance: provenance(
        "Declared synthetic source metadata; SVG-coordinate scale, independent of CSS screen size",
      ),
      evidenceRefs: [`source=${key}`],
    });
    setSnapshot(next);
    setSelectedEvent(next.trace.length);
    setCalibration({ key, stateId: next.states.at(-1)!.id });
    setMessage("Calibration recorded for the current source.");
  }
  function recordMeasurement() {
    const accepted = Boolean(calibrationCurrent && calipers[1] > calipers[0]);
    const result = append(
      "Measure",
      `${kind}: ${interval} ± ${uncertainty} ms (worst-case endpoint bound)`,
      "Two selected SVG coordinates divided by declared pixels/mm and paper speed",
      {
        accepted,
        inputs: calibrationCurrent ? [calibration!.stateId] : [origin],
        evidence: [
          `kind=${kind}`,
          `startMs=${calipers[0]}`,
          `endMs=${calipers[1]}`,
          `intervalMs=${interval}`,
          `uncertaintyMs=${uncertainty}`,
        ],
      },
    );
    if (result.accepted && result.outputStateId) {
      setMeasurement({
        key,
        stateId: result.outputStateId,
        kind,
        duration: interval,
        uncertainty,
      });
      setMessage(
        `${kind} measurement recorded with its calibration dependency.`,
      );
    } else
      setMessage(
        calibrationCurrent
          ? "The end must follow the start."
          : "Measurement rejected: record calibration for the current source first.",
      );
  }
  function testClaim() {
    const result = append(
      rule.accepted ? "Hypothesize" : "Challenge",
      `Claim: recorded QRS duration is below 120 ms. ${rule.accepted ? "Supported within the stated measurement bound." : "Not supported by the recorded evidence."}`,
      "Explicit interval rule, including calibration, source identity and worst-case uncertainty",
      {
        inputs: measurement ? [measurement.stateId] : [origin],
        accepted: rule.accepted,
        evidence: rule.checks.map((check) => `${check.name}=${check.passed}`),
      },
    );
    setMessage(
      result.accepted
        ? "Claim admitted. Its measurement dependencies remain linked."
        : "Claim rejected. Failed conditions are recorded; no state was added.",
    );
  }
  function moveCaliper(svg: SVGSVGElement, clientX: number, clientY: number) {
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const matrix = svg.getScreenCTM();
    if (!matrix || dragging.current === null) return;
    const local = point.matrixTransform(matrix.inverse());
    const value =
      Math.round(
        Math.max(0, Math.min(duration, (local.x - left) / pxPerMs)) * 10,
      ) / 10;
    setManual(
      dragging.current === 0 ? [value, calipers[1]] : [calipers[0], value],
    );
  }
  function exportTrace() {
    const blob = new Blob(
      [
        JSON.stringify(
          { modelVersion: "ECG-FRONTAL-1", model, speed, gain, snapshot },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "reasonos-trace.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function verify(tamper = false) {
    try {
      const trace = structuredClone(snapshot.trace);
      if (tamper && trace.length) trace[0].summary += " altered";
      const replayed = replayTrace(
        trace,
        tamper ? undefined : snapshot.journal,
      );
      setMessage(
        `Replay verified ${replayed.states.length} states from ${trace.length} recorded attempts.`,
      );
    } catch {
      setMessage(
        "Altered copy rejected during replay. The original trace is unchanged.",
      );
    }
  }
  const phaseTimes = [
    ["P", m.pStart + 40],
    ["QRS", 200 + 0.44 * model.qrs],
    ["T", m.tStart + 50],
  ] as const;
  const evidenceFeatures = [
    { id: "leadI", label: "Lead I polarity", concept: "lead-i-polarity" },
    { id: "avf", label: "aVF polarity", concept: "avf-polarity" },
    { id: "axis", label: "Integrated axis angle", concept: "axis-angle" },
  ] as const;
  const pathMatch = matchEvidencePath({
    patternId: "normal axis",
    available: evidenceFeatures.map((feature) => ({
      stateId: `preview-${feature.id}` as StateId,
      assertions: [
        { conceptId: feature.concept, polarity: "present" as const },
      ],
    })),
    selectedStateIds: evidenceFeatures
      .filter((feature) => observations[feature.id])
      .map((feature) => `preview-${feature.id}` as StateId),
  });
  const hypothesis = [...snapshot.trace]
    .reverse()
    .find(
      (item) => item.operator === "Hypothesize" && item.accepted,
    )?.outputStateId;
  const selectedLength = Math.max(0, Math.min(duration, time));

  return (
    <div
      className={styles.lab}
      id="reasonos-lab"
      data-model={JSON.stringify(model)}
      data-time={time}
      data-lead={lead}
      data-voltage={Number(voltages[lead].toFixed(12))}
      data-speed={speed}
    >
      <Script
        src="/quantum-computer-lab/vendor/katex.min.js"
        onReady={() => {
          window.dispatchEvent(new Event("reasonos-math-ready"));
        }}
      />
      <div className={styles.header}>
        <div>
          <h2>Vector ECG laboratory</h2>
          <p>
            Synthetic frontal-plane source · six linked limb leads · recorded
            reasoning
          </p>
        </div>
        <div className={styles.toolbar}>
          <span className={styles.status} data-phase={phase}>
            {phase} · {fmt(cycleTime, 0)} ms
          </span>
          <button
            onClick={() =>
              reduced
                ? setTime(
                    phaseTimes[
                      (phaseTimes.findIndex(([name]) => name === phase) + 1) % 3
                    ][1],
                  )
                : setPlaying(!playing)
            }
          >
            {reduced ? "Next phase" : playing ? "Pause" : "Play cycle"}
          </button>
          <button
            onClick={() => {
              setPlaying(false);
              setTime(0);
            }}
          >
            Reset time
          </button>
        </div>
      </div>
      <div
        className={styles.phaseRow}
        aria-label="Inspect a component of the cardiac cycle"
      >
        {phaseTimes.map(([name, t]) => (
          <button
            key={name}
            aria-pressed={phase === name}
            onClick={() => {
              setPlaying(false);
              setTime(t);
            }}
          >
            {name === "P"
              ? "P · atrial"
              : name === "QRS"
                ? "QRS · ventricular"
                : "T · repolarization"}
          </button>
        ))}
        <span>Playback 0.25× · source rate {fmt(60000 / model.rr, 1)} bpm</span>
      </div>
      <div className={styles.stage}>
        <figure>
          <div className={styles.figureHead}>
            <h3>Frontal vector and lead field</h3>
            <span>{lead}</span>
          </div>
          <svg
            viewBox="0 0 360 365"
            className={styles.geometry}
            role="img"
            aria-label={`Frontal signal vector x ${fmt(vector[0])}, y ${fmt(vector[1])} mV-equivalent. Projection on lead ${lead}: ${fmt(voltages[lead])} mV.`}
            data-vector={JSON.stringify(
              vector.map((value) => Number(value.toFixed(12))),
            )}
          >
            <defs>
              <marker
                id="ros-vector-arrow"
                viewBox="0 0 8 8"
                refX="7"
                refY="4"
                markerWidth="5"
                markerHeight="5"
                orient="auto"
              >
                <path
                  d="M0 0L8 4 0 8"
                  fill="none"
                  stroke="#efbd75"
                  strokeWidth="1.5"
                />
              </marker>
              <marker
                id="ros-lead-arrow"
                viewBox="0 0 8 8"
                refX="7"
                refY="4"
                markerWidth="5"
                markerHeight="5"
                orient="auto"
              >
                <path
                  d="M0 0L8 4 0 8"
                  fill="none"
                  stroke="#75d3dc"
                  strokeWidth="1.5"
                />
              </marker>
            </defs>
            <path
              d="M42 80.326H318L180 319.349Z"
              fill="#122431"
              fillOpacity=".35"
              stroke="#476072"
              strokeWidth=".8"
            />
            <circle
              cx="180"
              cy="160"
              r="105"
              fill="none"
              stroke="#40596e"
              strokeWidth=".7"
              strokeDasharray="2 6"
            />
            {LEADS.map((name) => {
              const l = LEAD_FIELDS[name],
                n = Math.hypot(...l);
              return (
                <g key={name} opacity={name === lead ? 1 : 0.35}>
                  <line
                    x1={svgNumber(180 - (l[0] / n) * 120)}
                    y1={svgNumber(160 - (l[1] / n) * 120)}
                    x2={svgNumber(180 + (l[0] / n) * 120)}
                    y2={svgNumber(160 + (l[1] / n) * 120)}
                    stroke={name === lead ? "#75d3dc" : "#7893a8"}
                    strokeWidth={name === lead ? 1 : 0.5}
                    markerEnd={
                      name === lead ? "url(#ros-lead-arrow)" : undefined
                    }
                  />
                  <text
                    x={svgNumber(180 + (l[0] / n) * 141)}
                    y={svgNumber(164 + (l[1] / n) * 141)}
                    textAnchor="middle"
                    className={name === lead ? styles.leadLabel : ""}
                  >
                    {name}
                  </text>
                </g>
              );
            })}
            <polyline
              points={loop}
              fill="none"
              stroke="#efbd75"
              strokeWidth="1"
              opacity=".22"
            />
            <line
              x1={svgNumber(180 + vector[0] * 95)}
              y1={svgNumber(160 + vector[1] * 95)}
              x2={svgNumber(180 + unit[0] * dot * 95)}
              y2={svgNumber(160 + unit[1] * dot * 95)}
              stroke="#75d3dc"
              strokeDasharray="3 4"
              strokeWidth="1"
            />
            <line
              x1="180"
              y1="160"
              x2={svgNumber(180 + unit[0] * dot * 95)}
              y2={svgNumber(160 + unit[1] * dot * 95)}
              className={styles.projection}
            />
            <line
              x1="180"
              y1="160"
              x2={svgNumber(180 + vector[0] * 95)}
              y2={svgNumber(160 + vector[1] * 95)}
              className={styles.liveVector}
              markerEnd={
                Math.hypot(...vector) > 0.03
                  ? "url(#ros-vector-arrow)"
                  : undefined
              }
            />
            <circle
              cx={svgNumber(180 + vector[0] * 95)}
              cy={svgNumber(160 + vector[1] * 95)}
              r="3"
              className={styles.source}
            />
            <circle cx="180" cy="160" r="2" fill="#b7cad9" />
            <text x="30" y="47" className={styles.electrode}>
              RA
            </text>
            <text x="315" y="47" className={styles.electrode}>
              LA
            </text>
            <text
              x="180"
              y="340"
              textAnchor="middle"
              className={styles.electrode}
            >
              LL
            </text>
            <text x="42" y="65" className={styles.axisLabel}>
              {fmt(potentials.RA)} mV
            </text>
            <text x="318" y="65" textAnchor="end" className={styles.axisLabel}>
              {fmt(potentials.LA)} mV
            </text>
            <text
              x="180"
              y="355"
              textAnchor="middle"
              className={styles.axisLabel}
            >
              {fmt(potentials.LL)} mV
            </text>
          </svg>
          <div className={styles.leadButtons} aria-label="Select a limb lead">
            {LEADS.map((name) => (
              <button
                key={name}
                aria-pressed={lead === name}
                onClick={() => setLead(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <figcaption className={styles.caption}>
            Amber: resultant signal vector. Cyan: selected lead and projection.
            Axes: patient left and inferior. The faint curve is the prescribed
            QRS loop.
          </figcaption>
        </figure>
        <figure>
          <div className={styles.figureHead}>
            <h3>Lead {lead} · calibrated strip</h3>
            <span>
              {speed} mm/s · {gain} mm/mV
            </span>
          </div>
          <svg
            className={styles.chart}
            viewBox="0 0 960 370"
            role="img"
            aria-label={`Synthetic lead ${lead} at ${speed} millimetres per second and ${gain} millimetres per millivolt. Drag the two calipers or edit their time values below.`}
            onPointerDown={(e) => {
              const index = (e.target as Element)
                .closest("[data-endpoint]")
                ?.getAttribute("data-endpoint");
              if (index === undefined || index === null) return;
              dragging.current = Number(index) as 0 | 1;
              e.currentTarget.setPointerCapture(e.pointerId);
              moveCaliper(e.currentTarget, e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (dragging.current !== null)
                moveCaliper(e.currentTarget, e.clientX, e.clientY);
            }}
            onPointerUp={() => {
              dragging.current = null;
            }}
            onPointerCancel={() => {
              dragging.current = null;
            }}
          >
            <defs>
              <pattern
                id="ros-small-grid"
                x={svgNumber(left)}
                y="0"
                width={svgNumber(pxPerMm)}
                height={svgNumber(pxPerMm)}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M${pxPerMm} 0H0V${pxPerMm}`}
                  fill="none"
                  stroke="#53738b"
                  strokeOpacity=".19"
                  strokeWidth=".55"
                />
              </pattern>
              <pattern
                id="ros-large-grid"
                x={svgNumber(left)}
                y="0"
                width={svgNumber(pxPerMm * 5)}
                height={svgNumber(pxPerMm * 5)}
                patternUnits="userSpaceOnUse"
              >
                <rect
                  width={svgNumber(pxPerMm * 5)}
                  height={svgNumber(pxPerMm * 5)}
                  fill="url(#ros-small-grid)"
                />
                <path
                  d={`M${pxPerMm * 5} 0H0V${pxPerMm * 5}`}
                  fill="none"
                  stroke="#53738b"
                  strokeOpacity=".35"
                  strokeWidth=".7"
                />
              </pattern>
              <clipPath id="ros-strip-clip">
                <rect
                  x={svgNumber(left)}
                  y="10"
                  width={svgNumber(plotWidth)}
                  height="320"
                />
              </clipPath>
            </defs>
            <rect
              x={svgNumber(left)}
              y="10"
              width={svgNumber(plotWidth)}
              height="320"
              fill="url(#ros-large-grid)"
            />
            <g clipPath="url(#ros-strip-clip)">
              <rect
                x={svgNumber(left + Math.min(...calipers) * pxPerMs)}
                y="10"
                width={svgNumber(Math.abs(calipers[1] - calipers[0]) * pxPerMs)}
                height="320"
                fill="#75d3dc"
                fillOpacity=".08"
              />
              <polyline points={paths[lead]} className={styles.wave} />
              <line
                x1={svgNumber(left + selectedLength * pxPerMs)}
                x2={svgNumber(left + selectedLength * pxPerMs)}
                y1="10"
                y2="330"
                className={styles.cursor}
                data-ecg-cursor="true"
              />
              <circle
                cx={svgNumber(left + selectedLength * pxPerMs)}
                cy={svgNumber(240 - voltages[lead] * gain * pxPerMm)}
                r="3.5"
                data-ecg-sample="true"
                fill="#efbd75"
              />
              {calipers.map((t, j) => (
                <g key={j} data-endpoint={j}>
                  <rect
                    x={svgNumber(left + t * pxPerMs - 13)}
                    y="10"
                    width="26"
                    height="320"
                    fill="transparent"
                    stroke="none"
                  />
                  <line
                    x1={svgNumber(left + t * pxPerMs)}
                    x2={svgNumber(left + t * pxPerMs)}
                    y1="10"
                    y2="330"
                    className={styles.caliper}
                  />
                  <circle
                    cx={svgNumber(left + t * pxPerMs)}
                    cy="25"
                    r="10"
                    className={styles.handle}
                  />
                  <text
                    x={svgNumber(left + t * pxPerMs)}
                    y="29"
                    textAnchor="middle"
                    fill="#75d3dc"
                  >
                    {j + 1}
                  </text>
                </g>
              ))}
            </g>
            <path
              d={`M15 240h7v${-gain * pxPerMm}h20v${gain * pxPerMm}h7`}
              fill="none"
              stroke="#a8bdce"
              strokeWidth="1"
            />
            <text x="5" y={svgNumber(225 - gain * pxPerMm)}>
              1 mV
            </text>
            {Array.from({ length: Math.floor(duration / 400) + 1 }, (_, j) => (
              <text
                key={j}
                x={svgNumber(left + j * 400 * pxPerMs)}
                y="350"
                textAnchor="middle"
              >
                {j * 400}
              </text>
            ))}
            <text x="930" y="365" textAnchor="end">
              Time / ms
            </text>
          </svg>
          <figcaption className={styles.caption}>
            One small square: {1000 / speed} ms horizontally, {fmt(1 / gain, 2)}{" "}
            mV vertically. Coordinates are in SVG units; resizing the display
            preserves measured time. Drag a numbered caliper or edit its time
            below.
          </figcaption>
        </figure>
      </div>
      <div className={styles.transport}>
        <span className={styles.label}>Shared time</span>
        <label>
          <input
            aria-label="Shared ECG time"
            type="range"
            min="0"
            max={duration}
            step="1"
            value={Math.min(time, duration)}
            onChange={(e) => {
              setPlaying(false);
              setTime(Number(e.target.value));
            }}
          />
        </label>
        <output aria-live="off">
          {fmt(time, 0)} ms · {fmt(voltages[lead])} mV
        </output>
      </div>
      <div className={styles.equationRow}>
        <div>
          <span className={styles.label}>Current signal coordinates</span>
          <MathText
            tex={`\\mathbf d(t)\\approx\\begin{bmatrix}${fmt(vector[0])}\\\\${fmt(vector[1])}\\end{bmatrix}\\,\\mathrm{mV}`}
            reading={`Current frontal signal coordinates: ${fmt(vector[0])}, ${fmt(vector[1])} millivolts equivalent.`}
          />
          <p className={styles.mathHint}>
            A scaled signal vector, not a measured dipole moment. Electrode
            reference: RA + LA + LL = 0.
          </p>
        </div>
        <div>
          <span className={styles.label}>
            Selected lead · same time coordinate
          </span>
          <MathText
            tex={`v_{${leadTex(lead)}}(t)=\\boldsymbol\\ell_{${leadTex(lead)}}^T\\mathbf d(t)\\approx(${fmt(field[0])})(${fmt(vector[0])})+(${fmt(field[1])})(${fmt(vector[1])})\\approx${fmt(voltages[lead])}\\,\\mathrm{mV}`}
            reading={`Lead ${lead} is its lead-field vector dotted with the current signal vector, giving ${fmt(voltages[lead])} millivolts. Values rounded for display.`}
          />
          <p className={styles.mathHint}>
            {Math.hypot(...vector) < 0.001
              ? "The prescribed resultant is zero at this time. A near-zero surface signal does not establish that cardiac cells are electrically inactive."
              : Math.abs(voltages[lead]) < 0.015
                ? `The signal vector is nearly perpendicular to lead ${lead}, so this lead is nearly isoelectric even while the source vector is nonzero.`
                : voltages[lead] < 0
                  ? `The vector projects against lead ${lead}’s positive direction, producing a negative deflection.`
                  : `The component toward lead ${lead}’s positive direction produces a positive deflection.`}{" "}
            Lead coefficients are dimensionless; the displayed values are
            rounded.
          </p>
        </div>
      </div>
      <div className={styles.measurement}>
        <section aria-labelledby="ros-caliper-title">
          <h3 id="ros-caliper-title">Interval measurement</h3>
          <div className={styles.controls}>
            {(["QRS", "PR", "QT", "RR"] as const).map((name) => (
              <button
                key={name}
                aria-pressed={kind === name}
                onClick={() => {
                  setKind(name);
                  setManual(null);
                }}
              >
                {name}
              </button>
            ))}
          </div>
          <div className={styles.readout}>
            <output data-interval={interval}>{interval} ms</output>
            <small>Worst-case interval bound ±{uncertainty} ms</small>
          </div>
          <div className={styles.caliperInputs}>
            {calipers.map((t, j) => (
              <label key={j}>
                Caliper {j + 1} / ms
                <input
                  type="number"
                  min="0"
                  max={Math.floor(duration)}
                  step=".1"
                  value={fmt(t, 1)}
                  onChange={(e) => {
                    if (e.target.value === "") return;
                    const value = Math.max(
                      0,
                      Math.min(duration, Number(e.target.value)),
                    );
                    if (Number.isFinite(value))
                      setManual(
                        j === 0 ? [value, calipers[1]] : [calipers[0], value],
                      );
                  }}
                />
              </label>
            ))}
          </div>
          <MathText
            tex={`\\Delta t=\\frac{\\Delta x}{p\\,s}\\,1000\\approx\\frac{${fmt(Math.abs(calipers[1] - calipers[0]) * pxPerMs, 1)}}{${pxPerMm}\\cdot${speed}}\\,1000=${interval}\\,\\mathrm{ms}`}
            reading={`Interval equals coordinate separation divided by ${pxPerMm} SVG units per millimetre and ${speed} millimetres per second, giving ${interval} milliseconds.`}
          />
          <div className={styles.controls}>
            <button onClick={recordCalibration}>Record calibration</button>
            <button onClick={recordMeasurement}>
              Record {kind} measurement
            </button>
          </div>
          <p className={styles.caption}>
            {calibrationCurrent
              ? "Current source calibration is recorded."
              : "Record the current source calibration before admitting a measurement."}{" "}
            Model fiducials are explicit source metadata, not an automatic
            clinical onset detector.
          </p>
        </section>
        <section aria-labelledby="ros-rule-title">
          <h3 id="ros-rule-title">Evidence-conditioned claim</h3>
          <p className={styles.caption}>
            Claim: the recorded QRS duration is below 120 ms. The rule evaluates
            the last recorded QRS measurement, not unrecorded caliper edits.
          </p>
          <div className={styles.readout}>
            <output>
              {measurement?.kind === "QRS"
                ? `${measurement.duration} ± ${measurement.uncertainty} ms`
                : "No QRS record"}
            </output>
          </div>
          <div className={styles.checks}>
            {rule.checks.map((check) => (
              <span key={check.name} data-pass={check.passed}>
                <i aria-hidden="true" />
                {check.name}
              </span>
            ))}
          </div>
          <button onClick={testClaim}>Evaluate claim</button>
          <p className={styles.verdict} data-accepted={rule.accepted}>
            {rule.accepted
              ? "Evidence supports this bounded duration claim."
              : "Required evidence is absent, stale, or spans the cutoff."}{" "}
            This is a duration criterion, not a rhythm or patient diagnosis.
          </p>
        </section>
      </div>
      <details className={styles.settings}>
        <summary>
          Source parameters, paper calibration, and endpoint uncertainty
        </summary>
        <div className={styles.settingsGrid}>
          {(
            [
              ["rr", "Cycle length RR", 600, 1400, "ms"],
              ["pr", "PR interval", 100, 200, "ms"],
              ["qrs", "QRS duration", 60, 160, "ms"],
              [
                "qt",
                "QT interval",
                model.qrs + 120,
                Math.min(520, model.rr - 240),
                "ms",
              ],
              ["rotation", "QRS component rotation", -180, 180, "°"],
            ] as const
          ).map(([name, label, min, max, unitText]) => (
            <label key={name}>
              <span>
                {label}
                <output>
                  {model[name]} {unitText}
                </output>
              </span>
              <input
                aria-label={label}
                type="range"
                min={min}
                max={max}
                step="1"
                value={model[name]}
                onChange={(e) =>
                  updateModel({ ...model, [name]: Number(e.target.value) })
                }
              />
            </label>
          ))}
          <label>
            <span>
              Paper speed<output>{speed} mm/s</output>
            </span>
            <select
              aria-label="Paper speed"
              value={speed}
              onChange={(e) => {
                setSpeed(Number(e.target.value));
                setTime(235);
                setManual(null);
              }}
            >
              <option value="25">25 mm/s</option>
              <option value="50">50 mm/s</option>
            </select>
          </label>
          <label>
            <span>
              Voltage gain<output>{gain} mm/mV</output>
            </span>
            <select
              aria-label="Voltage gain"
              value={gain}
              onChange={(e) => setGain(Number(e.target.value))}
            >
              <option value="5">5 mm/mV</option>
              <option value="10">10 mm/mV</option>
            </select>
          </label>
          <label>
            <span>
              Uncertainty per endpoint<output>±{endpointError} ms</output>
            </span>
            <input
              aria-label="Uncertainty per endpoint"
              type="range"
              min="0"
              max="20"
              step="1"
              value={endpointError}
              onChange={(e) => setEndpointError(Number(e.target.value))}
            />
          </label>
        </div>
        <p className={styles.caption}>
          Changing the source or calibration leaves prior records intact and
          makes them stale for the new source. The ±2ε interval bound follows
          from two independently bounded endpoints; it is not a statistical
          confidence interval.
        </p>
      </details>
      <div className={styles.strip} aria-label="Six simultaneous limb leads">
        {LEADS.map((name) => (
          <button
            key={name}
            aria-pressed={lead === name}
            onClick={() => setLead(name)}
            aria-label={`Inspect lead ${name}`}
          >
            <span>
              {name} · {fmt(voltages[name])} mV
            </span>
            <svg viewBox="0 0 340 75" aria-hidden="true">
              <path d="M10 39H330" stroke="#3b5266" strokeWidth=".5" />
              <polyline
                points={miniPaths[name]}
                fill="none"
                stroke={lead === name ? "#75d3dc" : "#93a9bc"}
                strokeWidth="1.3"
              />
              <line
                x1={svgNumber(10 + (cycleTime / model.rr) * 160)}
                x2={svgNumber(10 + (cycleTime / model.rr) * 160)}
                y1="5"
                y2="70"
                stroke="#efbd75"
                strokeWidth=".7"
              />
            </svg>
          </button>
        ))}
      </div>
      <div className={styles.traceSection}>
        <div className={styles.sectionHead}>
          <div>
            <h3>Reasoning graph</h3>
            <p>
              {snapshot.states.length} states · {snapshot.trace.length}{" "}
              attempted transformations ·{" "}
              {snapshot.trace.filter((item) => !item.accepted).length} rejected.
              Select an event to inspect its actual checks.
            </p>
          </div>
          <div className={styles.controls}>
            <button onClick={() => verify()}>Verify replay</button>
            <button onClick={exportTrace}>Export JSON</button>
            <button
              onClick={() => {
                setSnapshot(initialSnapshot());
                setCalibration(null);
                setMeasurement(null);
                setSelectedEvent(0);
                setMessage("");
              }}
            >
              Clear trace
            </button>
          </div>
        </div>
        <div
          ref={graphRef}
          className={styles.graphScroll}
          role="region"
          aria-label="Scrollable causal reasoning graph"
          tabIndex={0}
        >
          <svg
            className={styles.graph}
            width={svgNumber(Math.max(900, (snapshot.trace.length + 1) * 145))}
            height="170"
            role="group"
            aria-label="Accepted events create states. Rejected events end without an output state. Lines follow recorded input state identifiers."
          >
            <circle cx="45" cy="55" r="9" fill="#75d3dc" />
            <text x="45" y="82" textAnchor="middle">
              Source
            </text>
            {snapshot.trace.map((item) => {
              const x = 45 + item.sequence * 145,
                y = item.accepted ? 55 : 120;
              return (
                <g key={item.id}>
                  {item.inputStateIds.map((input) => {
                    const state = snapshot.states.find((s) => s.id === input),
                      ix = 45 + (state?.sequence || 0) * 145;
                    return (
                      <path
                        key={input}
                        d={`M${ix + 9} 55C${(ix + x) / 2} 55,${(ix + x) / 2} ${y},${x - 10} ${y}`}
                        fill="none"
                        stroke={item.accepted ? "#4c8194" : "#b67575"}
                        strokeWidth="1"
                      />
                    );
                  })}
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label={`Inspect event ${item.sequence}: ${item.operator}, ${item.accepted ? "accepted" : "rejected"}`}
                    onClick={() => setSelectedEvent(item.sequence)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedEvent(item.sequence);
                      }
                    }}
                  >
                    <circle
                      cx={svgNumber(x)}
                      cy={svgNumber(y)}
                      r={selectedEvent === item.sequence ? 12 : 9}
                      fill={item.accepted ? "#75d3dc" : "#df9895"}
                      stroke={
                        selectedEvent === item.sequence ? "#edf2f3" : "none"
                      }
                      strokeWidth="1.5"
                    />
                    <text
                      x={svgNumber(x)}
                      y={svgNumber(y + 27)}
                      textAnchor="middle"
                    >
                      {item.sequence} · {item.operator}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
        {event ? (
          <div className={styles.event}>
            <section>
              <h3>
                {event.operator} · {event.accepted ? "accepted" : "rejected"}
              </h3>
              <p>{event.summary}</p>
              <dl>
                <dt>Actor</dt>
                <dd>{event.actor}</dd>
                <dt>Witness</dt>
                <dd>{event.provenance.witnessType}</dd>
                <dt>Method</dt>
                <dd>{event.provenance.method}</dd>
                <dt>Inputs</dt>
                <dd>{event.inputStateIds.join(", ")}</dd>
                <dt>Output</dt>
                <dd>{event.outputStateId || "No state added"}</dd>
              </dl>
            </section>
            <section>
              <h3>Recorded constraints</h3>
              <div className={styles.checks}>
                {[
                  ...event.kernelConstraintResults,
                  ...event.domainConstraintResults,
                ].map((check) => (
                  <span key={check.name} data-pass={check.passed}>
                    <i aria-hidden="true" />
                    {check.name}:{" "}
                    {check.applied === false
                      ? "not applicable"
                      : check.passed
                        ? "pass"
                        : "reject"}
                  </span>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <p className={styles.empty}>
            Record calibration and an interval, then evaluate the claim. A
            rejected attempt remains in the graph without creating a state.
            Revisions and source changes retain their earlier evidence.
          </p>
        )}
        <p className={styles.notice} role="status">
          {message}
        </p>
        <details className={styles.settings}>
          <summary>Structured trace and replay integrity</summary>
          <p className={styles.caption}>
            Replay verifies the supplied kernel’s SHA-256 hash chain and reruns
            both kernel and ECG plugin checks. It does not independently
            establish medical truth. A hash chain detects changed records; it is
            not an authenticated clinical signature. Journal times are
            deterministic logical ticks, not ECG acquisition times.
          </p>
          <div className={styles.controls}>
            <button
              disabled={!snapshot.trace.length}
              onClick={() => verify(true)}
            >
              Verify an altered copy
            </button>
            <button
              disabled={!hypothesis}
              onClick={() => {
                const input = hypothesis;
                if (input)
                  append(
                    "Revise",
                    "Duration claim revised: retain the measurement and withhold a rhythm diagnosis.",
                    "Explicit learner revision with prior-state lineage",
                    { inputs: [input], learner: true, revisionOf: input },
                  );
              }}
            >
              Record revision
            </button>
          </div>
          <pre
            className={styles.traceJson}
            tabIndex={0}
            aria-label="Recorded transformation trace"
          >
            {JSON.stringify(snapshot.trace, null, 2)}
          </pre>
        </details>
      </div>
      <details className={styles.settings}>
        <summary>
          Lead derivation, mean QRS axis, QT correction, and path comparison
        </summary>
        <div className={styles.detailsGrid}>
          <article>
            <h3>Limb-lead identities</h3>
            <MathText
              tex={String.raw`\begin{bmatrix}I\\II\\III\\aVR\\aVL\\aVF\end{bmatrix}=\begin{bmatrix}1&0\\\tfrac12&\tfrac{\sqrt3}{2}\\-\tfrac12&\tfrac{\sqrt3}{2}\\-\tfrac34&-\tfrac{\sqrt3}{4}\\\tfrac34&-\tfrac{\sqrt3}{4}\\0&\tfrac{\sqrt3}{2}\end{bmatrix}\mathbf d`}
              reading="The six limb leads are linear projections of two independent frontal signal coordinates, with the augmented lead-field scale retained."
            />
            <MathText
              tex={`I+III-II\\approx${fmt(voltages.I + voltages.III - voltages.II, 9)}\\,\\mathrm{mV}`}
              reading="Einthoven residual: lead I plus III minus II is zero to numerical precision."
            />
            <p>
              RA, LA, and LL are electrode potentials. I = LA − RA; II = LL −
              RA; III = LL − LA. Each augmented lead compares one electrode with
              the mean of the other two. The algebraic identities do not require
              an equilateral torso; interpreting these coefficients as spatial
              lead fields does.
            </p>
          </article>
          <article>
            <h3>Mean QRS axis</h3>
            <MathText
              tex={`\\bar{\\mathbf d}_{QRS}=\\frac{1}{T_{QRS}}\\int_{QRS}\\mathbf d(t)\\,dt,\\quad\\alpha=\\operatorname{atan2}\\!\\left(\\frac{2A_{aVF}}{\\sqrt3},A_I\\right)\\approx${axis.degrees}^\\circ`}
              reading={`The mean QRS axis is the direction of the integrated QRS signal vector, ${axis.degrees} degrees in this ideal lead model. Augmented aVF is scaled by two over square root three before combining with lead I.`}
            />
            <p>
              A denotes signed QRS area in mV·ms; T_QRS is the QRS duration in
              milliseconds. The axis above comes from the entire modeled QRS,
              not the instantaneous arrow or an unscaled atan2 of I and aVF. A
              zero resultant has no defined direction.
            </p>
            <MathText
              tex={String.raw`v_\ell=\|\boldsymbol\ell\|\,\|\mathbf d\|\cos\varphi`}
              reading="Lead voltage equals the lead-field magnitude times signal-vector magnitude times the cosine of the angle between them."
            />
            <p>
              φ is the angle between the selected lead field and signal vector.
              The actual body has spatially varying lead fields; this model uses
              idealized fixed frontal fields.
            </p>
          </article>
          <article>
            <h3>QT correction and rate dependence</h3>
            <MathText
              tex={`QTc_B=\\frac{${model.qt}\\,\\mathrm{ms}}{\\sqrt{${fmt(model.rr / 1000)}\\,\\mathrm{s}/1\\,\\mathrm{s}}}\\approx${qtc.bazettMs}\\,\\mathrm{ms}`}
              reading={`Bazett correction for the source-reference intervals gives ${qtc.bazettMs} milliseconds.`}
            />
            <MathText
              tex={`QTc_F=\\frac{${model.qt}\\,\\mathrm{ms}}{\\sqrt[3]{${fmt(model.rr / 1000)}\\,\\mathrm{s}/1\\,\\mathrm{s}}}\\approx${qtc.fridericiaMs}\\,\\mathrm{ms}`}
              reading={`Fridericia correction for the source-reference intervals gives ${qtc.fridericiaMs} milliseconds.`}
            />
            <svg
              className={styles.curve}
              viewBox="0 0 460 170"
              role="img"
              aria-label="QT correction changes with RR even when raw QT is fixed. Cyan is Bazett; violet is Fridericia."
            >
              <path
                d="M36 12V140H440"
                fill="none"
                stroke="#567086"
                strokeWidth=".8"
              />
              {[200, 400, 600].map((value) => (
                <g key={value}>
                  <path
                    d={`M36 ${140 - ((value - 150) / 600) * 120}H436`}
                    stroke="#40566b"
                    strokeWidth=".4"
                  />
                  <text
                    x="30"
                    y={svgNumber(143 - ((value - 150) / 600) * 120)}
                    textAnchor="end"
                  >
                    {value}
                  </text>
                </g>
              ))}
              {([0.5, 1 / 3] as const).map((power, j) => (
                <polyline
                  key={power}
                  points={Array.from(
                    { length: 101 },
                    (_, i) =>
                      `${36 + i * 4},${fmt(140 - ((model.qt / ((600 + i * 8) / 1000) ** power - 150) / 600) * 120)}`,
                  ).join(" ")}
                  fill="none"
                  stroke={j ? "#bca7ee" : "#75d3dc"}
                  strokeWidth="1.6"
                />
              ))}
              <line
                x1={svgNumber(36 + (model.rr - 600) / 2)}
                x2={svgNumber(36 + (model.rr - 600) / 2)}
                y1="12"
                y2="140"
                stroke="#efbd75"
                strokeWidth=".8"
              />
              <g>
                <text x="36" y="159">
                  600 ms
                </text>
                <text x="384" y="159">
                  1400 ms
                </text>
                <text x="43" y="18">
                  QT fixed at {model.qt} ms
                </text>
              </g>
            </svg>
            <p>
              Source-reference QT and RR come from the model fiducials. Cyan:
              Bazett; violet: Fridericia. Neither curve is a diagnosis. Rate
              correction has method-dependent bias, particularly away from its
              reference rate.
            </p>
          </article>
          <article>
            <h3>Alternative evidence pathways</h3>
            <div className={styles.observations}>
              {evidenceFeatures.map((feature) => (
                <label key={feature.id}>
                  <input
                    type="checkbox"
                    checked={observations[feature.id]}
                    onChange={(e) =>
                      setObservations({
                        ...observations,
                        [feature.id]: e.target.checked,
                      })
                    }
                  />
                  {feature.label}
                </label>
              ))}
            </div>
            <MathText
              tex={String.raw`J_p=\frac{\sum_k\min(o_k,r_{pk})}{\sum_k\max(o_k,r_{pk})},\qquad J=\max_p J_p`}
              reading="Compute a weighted Jaccard score for each independently coherent reference path and use the maximum, rather than mixing requirements from different paths."
            />
            {pathMatch.pathScores.map((path) => (
              <p
                key={path.pathId}
                data-path-id={path.pathId}
                data-score={path.score}
              >
                <strong>{path.pathLabel}</strong>: {fmt(path.score)} ·{" "}
                {path.validationStatus} · {path.expertCount} expert traces
              </p>
            ))}
            <p>
              Selected steps represent a preview of pathway coverage, not
              confirmed patient findings. The supplied ECG plugin defines the
              quadrant and vector-angle methods separately. The kernel’s
              original MinMax scorer evaluates both. A complete alternative path
              can score one without following the other method.
            </p>
            <p>
              These are authored candidate methods, not validated expert
              consensus. Their coverage score is neither a probability of
              disease nor proof of a normal axis.
            </p>
            <button
              onClick={() =>
                append(
                  "AttachEvidence",
                  `Pathway-coverage preview: ${pathMatch.matchedPathLabel}; score ${fmt(pathMatch.score)}`,
                  "Original ECG plugin reference graph and kernel MinMax scoring; selected method steps are an explicit preview",
                  {
                    evidence: [
                      JSON.stringify(observations),
                      JSON.stringify(pathMatch.pathScores),
                    ],
                  },
                )
              }
            >
              Record path comparison
            </button>
          </article>
        </div>
      </details>
      <p className={styles.modelNote}>
        Model: prescribed finite-support P, QRS, and T components; equal-sided
        frontal lead geometry; traces plotted at 500 samples/s. This is not a
        cardiac-cell or volume-conductor solver. Six limb leads contain two
        independent signals; V1–V6 require additional chest measurements and are
        not synthesized here. Clinical source recordings remain separate below.
      </p>
    </div>
  );
}
