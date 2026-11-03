"use client";
import Script from "next/script";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { MathText } from "./ReasonOSLab";
import { LEADS, LEAD_FIELDS } from "@/lib/reasonos/model";
import {
  RECORDINGS,
  imageInterval,
  recordingLeadRegion,
  type ImagePoint,
} from "@/lib/reasonos/recordings";
import {
  CONNECTED_INTERVALS,
  type ConnectedInterval,
  CHEST_LEADS,
  CHEST_PLACEMENT,
  ELECTRICAL_PHASES,
  LEAD_DEFINITIONS,
  SOURCE_BEATS,
  recordedImageSource,
  reportedAxisProjection,
  recordConnectedInterval,
  testConnectedClaim,
  type ConnectionLead,
} from "@/lib/reasonos/connections";
import { initialSnapshot, replayTrace } from "@/lib/reasonos/kernel";
import b from "./ReasonOSLab.module.css";
import s from "./ECGConnections.module.css";
const n = (value: number, digits = 3) => Number(value.toFixed(digits));
const copy = (p: readonly ImagePoint[]): [ImagePoint, ImagePoint] => [
  { ...p[0] },
  { ...p[1] },
];
const CHEST_POSITIONS = [
  [237, 211],
  [267, 211],
  [294, 235],
  [316, 258],
  [348, 258],
  [379, 258],
];

export function ECGConnections({ embedded = false }: { embedded?: boolean }) {
  const [recordingId, setRecordingId] = useState<"A" | "B">("B");
  const recording = RECORDINGS.find((item) => item.id === recordingId)!;
  const beat = SOURCE_BEATS[recordingId];
  const [lead, setLead] = useState<ConnectionLead>("II"),
    [phaseIndex, setPhaseIndex] = useState(2),
    [cursor, setCursor] = useState(265),
    [playing, setPlaying] = useState(false);
  const [intervalKind, setIntervalKind] = useState<ConnectedInterval>("QRS");
  const [points, setPoints] = useState<[ImagePoint, ImagePoint]>(() =>
    copy(beat.qrs),
  );
  const [grid, setGrid] = useState<[ImagePoint, ImagePoint]>(() =>
    copy(recording.initialGrid),
  );
  const [mm, setMm] = useState(25),
    [errorPx, setErrorPx] = useState(2),
    [confirmed, setConfirmed] = useState(false);
  const [snapshot, setSnapshot] = useState(initialSnapshot),
    [measurement, setMeasurement] = useState<{
      key: string;
      id: string;
    } | null>(null),
    [message, setMessage] = useState("");
  const drag = useRef<{
    kind: "marker" | "grid";
    index: number;
    offset: ImagePoint;
  } | null>(null);
  const phase = ELECTRICAL_PHASES[phaseIndex],
    color = phase.color;
  const projection = reportedAxisProjection(recording, phase.id, lead);
  const chest = CHEST_LEADS.includes(lead as (typeof CHEST_LEADS)[number]);
  const calibration = {
    a: grid[0],
    b: grid[1],
    mm,
    speed: recording.paperSpeed,
    errorPx,
  };
  let interval: ReturnType<typeof imageInterval> | null = null,
    source = "";
  try {
    interval = imageInterval(points[0], points[1], calibration);
    source = recordedImageSource(recording, calibration);
  } catch {
    /* Invalid rulers remain visibly uncalibrated. */
  }
  const gridDx = grid[1].x - grid[0].x,
    gridDy = grid[1].y - grid[0].y,
    gridLength = Math.hypot(gridDx, gridDy);
  const timeAxis =
    gridDx > 0 && gridLength > 0
      ? { x: gridDx / gridLength, y: gridDy / gridLength }
      : { x: 1, y: 0 };
  const markerX = (p: ImagePoint, y: number) =>
    p.x - (timeAxis.y / timeAxis.x) * (y - p.y);
  const projectedPoint = interval
    ? {
        x: points[0].x + interval.projectedPx * timeAxis.x,
        y: points[0].y + interval.projectedPx * timeAxis.y,
      }
    : points[1];
  const currentKey = JSON.stringify({ source, points, intervalKind });
  const measurementId =
    confirmed && measurement?.key === currentKey ? measurement.id : undefined;
  const region = recordingLeadRegion(recording, lead);
  const area = { ...region, height: Math.min(region.height, 205) };
  const band = beat.bands[phaseIndex];
  const gx = Math.min(...recording.initialGrid.map((p) => p.x)) - 20,
    gy = Math.min(...recording.initialGrid.map((p) => p.y)) - 18;
  const gw = Math.max(
      60,
      Math.abs(recording.initialGrid[1].x - recording.initialGrid[0].x) + 40,
    ),
    gh = Math.max(
      55,
      Math.abs(recording.initialGrid[1].y - recording.initialGrid[0].y) + 45,
    );
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () =>
        setCursor((old) =>
          old >= beat.bands[4][1] ? beat.bands[0][0] : old + 0.6,
        ),
      30,
    );
    return () => clearInterval(timer);
  }, [playing, beat]);
  useEffect(() => {
    const next = beat.bands.findIndex(
      ([a, z], j) => cursor >= a && (cursor < z || j === 4),
    );
    if (next >= 0) setPhaseIndex(next);
  }, [cursor, beat]);
  function selectPhase(i: number) {
    setPlaying(false);
    setPhaseIndex(i);
    setCursor((beat.bands[i][0] + beat.bands[i][1]) / 2);
  }
  function switchRecording(id: "A" | "B") {
    if (id === recordingId) return;
    setPlaying(false);
    setRecordingId(id);
    setIntervalKind("QRS");
    setPhaseIndex(2);
    setPoints(copy(SOURCE_BEATS[id].qrs));
    setGrid(copy(RECORDINGS.find((r) => r.id === id)!.initialGrid));
    setConfirmed(false);
    setCursor(
      (SOURCE_BEATS[id].bands[2][0] + SOURCE_BEATS[id].bands[2][1]) / 2,
    );
    setMessage("");
  }
  function selectInterval(kind: ConnectedInterval) {
    setIntervalKind(kind);
    const locations = { PR: beat.pr, QRS: beat.qrs, QT: beat.qt, RR: beat.rr };
    setPoints(copy(locations[kind]));
    setConfirmed(false);
    selectPhase(kind === "PR" ? 1 : 2);
  }
  function updatePoint(
    kind: "marker" | "grid",
    index: number,
    point: ImagePoint,
  ) {
    const next = {
      x: n(Math.max(0, Math.min(recording.width, point.x)), 1),
      y: n(Math.max(0, Math.min(recording.height, point.y)), 1),
    };
    (kind === "marker" ? setPoints : setGrid)(
      (old) =>
        old.map((p, i) => (i === index ? next : p)) as [ImagePoint, ImagePoint],
    );
    setConfirmed(false);
  }
  function move(e: PointerEvent<SVGSVGElement>) {
    if (!drag.current) return;
    const svg = e.currentTarget,
      matrix = svg.getScreenCTM();
    if (!matrix) return;
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const local = p.matrixTransform(matrix.inverse());
    updatePoint(drag.current.kind, drag.current.index, {
      x: local.x + drag.current.offset.x,
      y: local.y + drag.current.offset.y,
    });
  }
  function pointerDown(
    e: PointerEvent<SVGSVGElement>,
    kind: "marker" | "grid",
  ) {
    const index = (e.target as Element)
      .closest("[data-source-handle]")
      ?.getAttribute("data-source-handle");
    if (index === null || index === undefined) return;
    setPlaying(false);
    const matrix = e.currentTarget.getScreenCTM();
    if (!matrix) return;
    const pointer = e.currentTarget.createSVGPoint();
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    const local = pointer.matrixTransform(matrix.inverse()),
      selected = (kind === "marker" ? points : grid)[Number(index)];
    drag.current = {
      kind,
      index: Number(index),
      offset: { x: selected.x - local.x, y: selected.y - local.y },
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    move(e);
  }
  function recordMeasurement() {
    try {
      const next = recordConnectedInterval(
        snapshot,
        recording,
        calibration,
        points,
        confirmed,
        intervalKind,
      );
      setSnapshot(next);
      const event = next.trace.at(-1)!;
      if (event.accepted && event.operator === "Measure") {
        setMeasurement({ key: currentKey, id: event.outputStateId! });
        setMessage(
          "Source measurement recorded. Its calibration, endpoints and image identity remain attached.",
        );
      } else
        setMessage(
          `Not admitted: ${event.domainConstraintResults
            .filter((c) => !c.passed)
            .map((c) => c.reason)
            .join(" ")}`,
        );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Invalid source measurement");
    }
  }
  function testClaim(scope: "duration" | "normal") {
    if (!source) {
      setMessage("A valid paper ruler is required.");
      return;
    }
    const next = testConnectedClaim(
      snapshot,
      recording,
      calibration,
      measurementId,
      scope,
    );
    setSnapshot(next);
    const event = next.trace.at(-1)!;
    setMessage(
      scope === "normal"
        ? "Not admitted. A QRS-duration rule cannot establish normal rhythm, ST–T findings, or a normal ECG. The broader clinical claim has no implemented supporting rule."
        : event.accepted
          ? "Supported: this marked lead-II QRS interval, including its placement bound, is below 120 ms. It does not establish the global 12-lead QRS duration."
          : "Not admitted. Check the current source, saved calibration, ordered QRS boundaries, and whether the entire placement bound lies below 120 ms.",
    );
  }
  function exportEvidence() {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              scope:
                "Source-connected ECG explanation and bounded QRS-duration rule, not a clinical-utility study",
              recording: {
                id: recording.id,
                image: recording.image,
                sha256: recording.sha256,
              },
              source,
              points,
              intervalKind,
              deviceReport: recording.report,
              interpretation: {
                phase: phase.id,
                lead,
                reportedAxisProjection: projection,
                units:
                  "dimensionless unit-axis projection, not measured millivolts",
              },
              journal: snapshot.journal,
              trace: snapshot.trace,
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
    a.download = "reasonos-connected-ecg.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const heart = (
    <g className={s.heart} aria-hidden="true">
      <path
        d="M251 168C249 139 266 123 275 130L282 145C273 154 275 174 278 184"
        fill="none"
        stroke="#778995"
        strokeWidth="11"
      />
      <path
        d="M222 165C199 145 172 169 181 190L201 212L237 194Z"
        fill={phase.id === "P" ? color : "#243b49"}
      />
      <path
        d="M246 169C262 144 289 151 295 170L288 196L251 198Z"
        fill={phase.id === "P" ? color : "#2b4351"}
      />
      <path
        d="M203 199C170 204 183 254 229 281L246 248L236 206Z"
        fill={phase.id === "QRS" || phase.id === "T" ? color : "#284452"}
      />
      <path
        d="M239 198C278 177 311 200 296 235C285 264 260 284 247 292C236 260 228 233 239 198Z"
        fill={phase.id === "QRS" || phase.id === "T" ? color : "#345563"}
      />
      <path
        d="M239 201Q229 241 247 286M199 198L226 202M252 195L281 196"
        fill="none"
        stroke="#8da4ae"
        strokeWidth="1.4"
      />
      <circle cx="194" cy="171" r="3" fill="#efbd75" />
      <path
        d="M194 171Q215 176 230 196L239 211L221 237M239 211L263 247"
        fill="none"
        stroke={phase.id === "PR" ? "#edf2f3" : "#708c98"}
        strokeWidth="1.5"
        strokeDasharray="3 4"
      />
      <text
        x="202"
        y="185"
        textAnchor="middle"
        style={{ fill: phase.id === "P" ? "#142532" : "#b9cdd4", fontSize: 8 }}
      >
        R atrium
      </text>
      <text
        x="270"
        y="178"
        textAnchor="middle"
        style={{ fill: phase.id === "P" ? "#142532" : "#b9cdd4", fontSize: 8 }}
      >
        L atrium
      </text>
      <text
        x="204"
        y="232"
        style={{
          fill: phase.id === "QRS" || phase.id === "T" ? "#142532" : "#b9cdd4",
        }}
      >
        RV
      </text>
      <text
        x="265"
        y="228"
        style={{
          fill: phase.id === "QRS" || phase.id === "T" ? "#142532" : "#b9cdd4",
        }}
      >
        LV
      </text>
    </g>
  );
  return (
    <section
      id={embedded ? "photo-ecg-connections" : "ecg-connections"}
      className={`${b.lab} ${s.connections}`}
      aria-labelledby="connections-title"
      style={{ "--phase": color } as CSSProperties}
      data-recording={recordingId}
      data-lead={lead}
      data-phase={phase.id}
      data-source-sha={recording.sha256}
    >
      <Script
        id="connected-katex"
        src="/quantum-computer-lab/vendor/katex.min.js"
        strategy="afterInteractive"
        onReady={() => {
          window.dispatchEvent(new Event("reasonos-math-ready"));
        }}
      />
      <div className={s.heading}>
        <div>
          <h2 id="connections-title">Heart → lead → recorded waveform</h2>
          <p>
            Explore the reported mean axes through different leads. Start with
            QRS, then change the lead or scan the source beat.
          </p>
        </div>
        <div className={s.recordings}>
          {RECORDINGS.map((r) => (
            <button
              key={r.id}
              aria-pressed={r.id === recordingId}
              onClick={() => switchRecording(r.id)}
            >
              Source {r.id}
            </button>
          ))}
        </div>
      </div>
      <div className={s.phaseControls} aria-label="Electrical events">
        {ELECTRICAL_PHASES.map((p, i) => (
          <button
            key={p.id}
            aria-pressed={i === phaseIndex}
            onClick={() => selectPhase(i)}
            style={{ borderBottomColor: p.color }}
          >
            {p.label}
          </button>
        ))}
        <button aria-pressed={playing} onClick={() => setPlaying(!playing)}>
          {playing ? "Pause scan" : "Scan source beat"}
        </button>
      </div>
      <div className={s.scene}>
        <div className={s.geometry}>
          <div className={s.sceneLabel}>
            <span>
              {chest
                ? "Chest electrode positions"
                : "Frontal axes · schematic heart"}
            </span>
            <span>
              {projection
                ? `Reported mean ${phase.id} axis ${projection.degrees}°`
                : chest
                  ? "Anterior view · schematic"
                  : "No mean axis assigned to this segment"}
            </span>
          </div>
          <svg
            viewBox="0 0 480 470"
            role="group"
            aria-label={
              chest
                ? "Chest electrode placement schematic"
                : "Heart, limb lead directions and reported mean electrical axis"
            }
          >
            <defs>
              <marker
                id="ecg-axis-arrow"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="3"
                orient="auto"
              >
                <path
                  d="M0 0L6 3L0 6"
                  fill="none"
                  stroke="var(--phase)"
                  strokeWidth="1.5"
                />
              </marker>
            </defs>
            {chest ? (
              <>
                <path
                  d="M186 79Q161 107 137 117L105 211L137 355Q241 385 385 355L420 211L383 116Q349 104 327 79M186 79Q240 105 267 81"
                  fill="none"
                  stroke="#425c6c"
                  strokeWidth="2"
                />
                <path
                  d="M252 111V269M163 154Q244 178 346 154M152 199Q242 219 358 198M151 246Q245 262 370 243"
                  fill="none"
                  stroke="#304956"
                />
                {heart}
                {CHEST_POSITIONS.map(([x, y], i) => (
                  <g
                    key={i}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select chest lead ${CHEST_LEADS[i]}`}
                    onClick={() => setLead(CHEST_LEADS[i])}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setLead(CHEST_LEADS[i]);
                      }
                    }}
                    className={s.chestPoint}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r="7"
                      fill={lead === CHEST_LEADS[i] ? color : "#142935"}
                      stroke="#bca7ee"
                    />
                    <text
                      x={x - 8}
                      y={y + (i < 2 ? -15 : 23)}
                      fill="#edf2f3"
                      fontSize="13"
                    >
                      {CHEST_LEADS[i]}
                    </text>
                  </g>
                ))}
                <text
                  x="240"
                  y="401"
                  textAnchor="middle"
                  fill="#a5b8c9"
                  fontSize="12"
                >
                  Patient right ← → Patient left
                </text>
              </>
            ) : (
              <>
                <circle
                  cx="240"
                  cy="215"
                  r="151"
                  fill="none"
                  stroke="#233e4b"
                />
                <path
                  d="M65 114H415L240 417Z"
                  fill="none"
                  stroke="#293f4d"
                  strokeWidth="1"
                />
                {[
                  [65, 114, "RA"],
                  [415, 114, "LA"],
                  [240, 417, "LL"],
                ].map(([x, y, name]) => (
                  <g key={String(name)}>
                    <circle
                      cx={Number(x)}
                      cy={Number(y)}
                      r="4"
                      fill="#efbd75"
                    />
                    <text
                      x={Number(x)}
                      y={Number(y) + (name === "LL" ? 18 : -12)}
                      textAnchor="middle"
                      fill="#efbd75"
                      fontSize="11"
                    >
                      {name}
                    </text>
                  </g>
                ))}
                {LEADS.map((name) => {
                  const f = LEAD_FIELDS[name],
                    norm = Math.hypot(...f),
                    ux = f[0] / norm,
                    uy = f[1] / norm,
                    selected = name === lead;
                  return (
                    <g
                      key={name}
                      role="button"
                      tabIndex={0}
                      aria-label={`Select limb lead ${name}`}
                      onClick={() => setLead(name)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setLead(name);
                        }
                      }}
                      className={s.leadAxis}
                    >
                      <line
                        x1={n(240 - ux * 145)}
                        y1={n(215 - uy * 145)}
                        x2={n(240 + ux * 145)}
                        y2={n(215 + uy * 145)}
                        stroke={selected ? "#bca7ee" : "#304b5b"}
                        strokeWidth={selected ? 2 : 1}
                      />
                      <circle
                        cx={n(240 + ux * 174)}
                        cy={n(215 + uy * 174)}
                        r="22"
                        fill={selected ? "#304456" : "#101f2a"}
                        stroke={selected ? "#bca7ee" : "#3a5565"}
                      />
                      <text
                        x={n(240 + ux * 174)}
                        y={n(220 + uy * 174)}
                        textAnchor="middle"
                        fill="#edf2f3"
                        fontSize="13"
                      >
                        {name}
                      </text>
                    </g>
                  );
                })}
                {heart}
                {projection && (
                  <>
                    <line
                      x1={n(240 + projection.vector[0] * 112)}
                      y1={n(215 + projection.vector[1] * 112)}
                      x2={n(
                        240 +
                          projection.unit[0] * projection.signedLength * 112,
                      )}
                      y2={n(
                        215 +
                          projection.unit[1] * projection.signedLength * 112,
                      )}
                      stroke="#bca7ee"
                      strokeDasharray="4 5"
                    />
                    <line
                      x1="240"
                      y1="215"
                      x2={n(
                        240 +
                          projection.unit[0] * projection.signedLength * 112,
                      )}
                      y2={n(
                        215 +
                          projection.unit[1] * projection.signedLength * 112,
                      )}
                      stroke="#bca7ee"
                      strokeWidth="5"
                      opacity=".8"
                    />
                    <g
                      className={s.meanVector}
                      style={{
                        transform: `rotate(${projection.degrees}deg)`,
                        color,
                      }}
                    >
                      <line
                        x1="240"
                        y1="215"
                        x2="352"
                        y2="215"
                        stroke="currentColor"
                        strokeWidth="3"
                        markerEnd="url(#ecg-axis-arrow)"
                      />
                    </g>
                    <circle
                      cx={n(
                        240 +
                          projection.unit[0] * projection.signedLength * 112,
                      )}
                      cy={n(
                        215 +
                          projection.unit[1] * projection.signedLength * 112,
                      )}
                      r="5"
                      fill="#bca7ee"
                    />
                  </>
                )}
                <text
                  x="240"
                  y="462"
                  textAnchor="middle"
                  fill="#a5b8c9"
                  fontSize="12"
                >
                  +x toward patient left · +y inferior
                </text>
              </>
            )}
          </svg>
          <div className={s.leadControls} aria-label="Recorded ECG leads">
            {[...LEADS, ...CHEST_LEADS].map((name) => (
              <button
                key={name}
                aria-pressed={lead === name}
                onClick={() => setLead(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
        <div className={s.source}>
          <div className={s.sceneLabel}>
            <span>
              Recording {recordingId} · lead {lead}
            </span>
            <span>Original waveform pixels</span>
          </div>
          <svg
            className={s.sourceImage}
            viewBox={`${area.x} ${area.y} ${area.width} ${area.height}`}
            role="img"
            aria-label={`Unchanged recorded lead ${lead} from recording ${recordingId}`}
          >
            <image
              href={recording.image}
              width={recording.width}
              height={recording.height}
            />
          </svg>
          <p className={s.definition}>
            The printed strip shows morphology. The scan below follows a
            separate lead-II example beat; these panels are not simultaneous
            multilead playback.
          </p>
          <h3>{phase.title}</h3>
          <p className={s.explanation}>{phase.text}</p>
          <MathText
            tex={LEAD_DEFINITIONS[lead].formula}
            reading={LEAD_DEFINITIONS[lead].reading}
          />
          <p className={s.definition}>
            Φ is electrode potential in mV. RA, LA and LL are right arm, left
            arm and left leg. A lead is a voltage difference; an electrode is a
            physical contact.
          </p>
          {chest ? (
            <>
              <p className={s.explanation}>
                <strong>{lead} placement:</strong>{" "}
                {
                  CHEST_PLACEMENT[
                    CHEST_LEADS.indexOf(lead as (typeof CHEST_LEADS)[number])
                  ]
                }
                .
              </p>
              <p className={s.definition}>
                Chest leads add horizontal-plane information. Their voltages
                cannot be recovered from the frontal mean axis; inspect the
                recorded chest trace.
              </p>
            </>
          ) : projection ? (
            <div
              className={s.calculation}
              data-axis-projection={n(projection.value, 6)}
            >
              <span className={s.calculationLabel}>
                Device-reported axis → unit direction → lead projection
              </span>
              <MathText
                tex={`\\theta=${projection.degrees}^{\\circ},\\quad\\hat{\\mathbf d}=(\\cos\\theta,\\sin\\theta)\\approx(${n(projection.vector[0])},${n(projection.vector[1])})`}
                reading={`The report's mean ${phase.id} axis is ${projection.degrees} degrees. Its unit direction has leftward component ${n(projection.vector[0])} and inferior component ${n(projection.vector[1])}.`}
              />
              <MathText
                tex={`\\mathbf l_{${lead}}\\approx(${n(projection.field[0])},${n(projection.field[1])}),\\quad p_{${lead}}=\\mathbf l_{${lead}}\\cdot\\hat{\\mathbf d}\\approx${n(projection.value)}`}
                reading={`Lead ${lead}'s idealized field dotted with the reported unit direction is ${n(projection.value)} relative units.`}
              />
              <p className={s.definition}>
                The violet shadow is the signed geometric projection. The field
                length supplies the augmented-lead scale. This equilateral
                lead-field model predicts relative direction; it does not
                measure peak voltage. Compare the overall signed {phase.id}{" "}
                balance in the photo.
              </p>
            </div>
          ) : (
            <p className={s.definition}>
              PR and ST are segments, not additional reported mean axes. The
              source report supplies P, QRS and T axes separately.
            </p>
          )}
        </div>
      </div>
      <div className={s.beatHead}>
        <h3>Follow one beat in your recording</h3>
        <span>Lead II · colored regions are authored feature locators</span>
      </div>
      <div className={s.beatRow}>
        <div>
          <svg
            className={s.beatImage}
            viewBox={`${beat.frame.x} ${beat.frame.y} ${beat.frame.width} ${beat.frame.height}`}
            role="img"
            aria-label={`Source beat from recording ${recordingId}, lead II, with ${phase.label} locator and movable ${intervalKind} boundaries`}
            onPointerDown={(e) => pointerDown(e, "marker")}
            onPointerMove={move}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
          >
            <image
              href={recording.image}
              width={recording.width}
              height={recording.height}
            />
            <rect
              x={band[0]}
              y={beat.frame.y}
              width={band[1] - band[0]}
              height={beat.frame.height}
              fill={color}
              opacity=".18"
            />
            <line
              x1={n(cursor)}
              x2={n(cursor)}
              y1={beat.frame.y}
              y2={beat.frame.y + beat.frame.height}
              stroke={color}
              strokeWidth=".7"
            />
            <line
              x1={points[1].x}
              y1={points[1].y}
              x2={n(projectedPoint.x)}
              y2={n(projectedPoint.y)}
              stroke="#623274"
              strokeWidth=".8"
              strokeDasharray="2 2"
            />
            <line
              x1={points[0].x}
              y1={points[0].y}
              x2={n(projectedPoint.x)}
              y2={n(projectedPoint.y)}
              stroke="#623274"
              strokeWidth="1.1"
            />
            {points.map((p, i) => (
              <g key={i} data-source-handle={i}>
                <line
                  x1={n(markerX(p, beat.frame.y + 8))}
                  y1={beat.frame.y + 8}
                  x2={n(markerX(p, beat.frame.y + beat.frame.height - 4))}
                  y2={beat.frame.y + beat.frame.height - 4}
                  stroke="transparent"
                  strokeWidth="8"
                />
                <line
                  x1={n(markerX(p, beat.frame.y + 8))}
                  y1={beat.frame.y + 8}
                  x2={n(markerX(p, beat.frame.y + beat.frame.height - 4))}
                  y2={beat.frame.y + beat.frame.height - 4}
                  stroke="#623274"
                  strokeWidth=".6"
                />
                <circle
                  cx={n(markerX(p, beat.frame.y + 15))}
                  cy={beat.frame.y + 15}
                  r="3.5"
                  fill="white"
                  stroke="#623274"
                  strokeWidth=".7"
                />
                <text
                  x={n(markerX(p, beat.frame.y + 15))}
                  y={beat.frame.y + 16.5}
                  textAnchor="middle"
                  fontSize="4"
                  fill="#623274"
                >
                  {i + 1}
                </text>
                <circle cx={p.x} cy={p.y} r="1.6" fill="#623274" />
              </g>
            ))}
          </svg>
          <label className={s.scrub}>
            Scan the photographed beat{" "}
            <input
              type="range"
              aria-label="Recorded beat position"
              min={beat.bands[0][0]}
              max={beat.bands[4][1]}
              step=".2"
              value={cursor}
              onChange={(e) => {
                setPlaying(false);
                setCursor(Number(e.target.value));
              }}
            />
            <span>
              {phase.label} · image x {n(cursor, 1)} px
            </span>
          </label>
        </div>
        <div className={s.measurement}>
          <div>
            <h3>Measure {intervalKind} from these pixels</h3>
            <div className={s.intervalControls}>
              {CONNECTED_INTERVALS.map((kind) => (
                <button
                  key={kind}
                  aria-pressed={intervalKind === kind}
                  onClick={() => selectInterval(kind)}
                >
                  Measure {kind}
                </button>
              ))}
            </div>
            <p>
              {intervalKind === "QRS"
                ? "Mark QRS onset and end."
                : intervalKind === "PR"
                  ? "Mark P-wave onset and QRS onset."
                  : intervalKind === "QT"
                    ? "Mark QRS onset and T-wave end."
                    : "Mark corresponding R peaks in consecutive cycles."}{" "}
              Check the local grid below before recording. Initial locations are
              proposals.
            </p>
            {interval ? (
              <>
                <MathText
                  tex={`\\Delta t\\approx\\frac{|${n(interval.projectedPx, 2)}\\,\\mathrm{px}|}{${n(interval.pixelsPerMm, 3)}\\,\\mathrm{px/mm}\\times25\\,\\mathrm{mm/s}}\\approx${n(interval.duration / 1000, 5)}\\,\\mathrm{s}\\approx${n(interval.duration, 2)}\\,\\mathrm{ms}`}
                  reading={`The interval projected along the paper time axis is ${n(interval.projectedPx, 2)} pixels, divided by ${n(interval.pixelsPerMm, 3)} pixels per millimetre and 25 millimetres per second. This gives ${n(interval.duration, 2)} milliseconds.`}
                />
                {intervalKind === "RR" && interval.duration > 0 && (
                  <MathText
                    tex={`\\mathrm{Rate}\\approx\\frac{60\\,000\\,\\mathrm{ms/min}}{${n(interval.duration, 2)}\\,\\mathrm{ms/beat}}\\approx${n(60000 / interval.duration, 1)}\\,\\mathrm{beats/min}`}
                    reading={`One measured RR interval gives ${n(60000 / interval.duration, 1)} beats per minute. Repeat over adjacent cycles before assessing variability.`}
                  />
                )}
                <p
                  className={s.bound}
                  data-connected-duration={interval.duration}
                >
                  Placement bound {n(interval.low, 1)}–{n(interval.high, 1)} ms
                  ·{" "}
                  {intervalKind === "RR"
                    ? `device rate ${recording.report.rate} bpm`
                    : `printed device ${intervalKind} ${recording.report[intervalKind.toLowerCase() as "pr" | "qrs" | "qt"]} ms`}
                </p>
              </>
            ) : (
              <p role="alert">
                The ruler is invalid. Choose ordered grid points and a positive
                known span.
              </p>
            )}
          </div>
          <div>
            <div className={s.gridLabel}>
              <span>Local paper ruler · proposed {mm} mm</span>
              <span>Same unchanged source image</span>
            </div>
            <svg
              className={s.gridImage}
              viewBox={`${n(gx)} ${n(gy)} ${n(gw)} ${n(gh)}`}
              role="img"
              aria-label="Local source-image paper ruler with two movable grid endpoints"
              onPointerDown={(e) => pointerDown(e, "grid")}
              onPointerMove={move}
              onPointerUp={() => {
                drag.current = null;
              }}
              onPointerCancel={() => {
                drag.current = null;
              }}
            >
              <image
                href={recording.image}
                width={recording.width}
                height={recording.height}
              />
              <line
                x1={grid[0].x}
                y1={grid[0].y}
                x2={grid[1].x}
                y2={grid[1].y}
                stroke="#623274"
                strokeWidth="1"
              />
              {grid.map((p, i) => (
                <g key={i} data-source-handle={i}>
                  <circle cx={p.x} cy={p.y} r="7" fill="transparent" />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="3"
                    fill="white"
                    stroke="#623274"
                    strokeWidth="1"
                  />
                </g>
              ))}
            </svg>
            <details className={s.precision}>
              <summary>Source coordinates, ruler and placement bound</summary>
              <div className={s.coordinateGrid}>
                {([points, grid] as const).map((pair, k) =>
                  pair.map((p, i) => (
                    <div key={`${k}-${i}`}>
                      <strong>
                        {k ? "Grid" : intervalKind} {i + 1}
                      </strong>
                      {(["x", "y"] as const).map((axis) => (
                        <label key={axis}>
                          {axis}
                          <input
                            type="number"
                            aria-label={`Connected ${k ? "grid" : intervalKind} ${i + 1} ${axis}`}
                            value={p[axis]}
                            min="0"
                            max={
                              axis === "x" ? recording.width : recording.height
                            }
                            step=".1"
                            onChange={(e) =>
                              updatePoint(k ? "grid" : "marker", i, {
                                ...p,
                                [axis]: Number(e.target.value),
                              })
                            }
                          />
                        </label>
                      ))}
                    </div>
                  )),
                )}
                <label>
                  Known span / mm
                  <input
                    aria-label="Connected grid span"
                    type="number"
                    min="1"
                    max="100"
                    value={mm}
                    onChange={(e) => {
                      setMm(Math.max(1, Math.min(100, Number(e.target.value))));
                      setConfirmed(false);
                    }}
                  />
                </label>
                <label>
                  Endpoint bound / px
                  <input
                    aria-label="Connected endpoint bound"
                    type="number"
                    min="0"
                    max="20"
                    step=".5"
                    value={errorPx}
                    onChange={(e) => {
                      setErrorPx(
                        Math.max(0, Math.min(20, Number(e.target.value))),
                      );
                      setConfirmed(false);
                    }}
                  />
                </label>
              </div>
              <p>
                The bound propagates endpoint placement and ruler
                direction/scale. It is not a statistical confidence interval.
                Local projection handles tilt; it does not rectify photographic
                perspective. Gain: {recording.gain} mm/mV. Speed:{" "}
                {recording.paperSpeed} mm/s.
              </p>
            </details>
          </div>
        </div>
      </div>
      <div className={s.reasoning}>
        <p className={s.definition}>
          This finding concerns the marked lead-II interval. Global ECG
          intervals require time-aligned leads to identify the earliest onset
          and latest offset.{" "}
          <a
            href="https://doi.org/10.1161/CIRCULATIONAHA.106.180200"
            target="_blank"
            rel="noreferrer"
          >
            AHA measurement standard
          </a>
          .
        </p>
        <label>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />{" "}
          I checked the grid span and {intervalKind} boundaries.
        </label>
        <div className={s.reasoningControls}>
          <button onClick={recordMeasurement}>Record source measurement</button>
          <button onClick={() => testClaim("duration")}>
            Test QRS &lt; 120 ms
          </button>
          <button onClick={() => testClaim("normal")}>
            Test “ECG is normal”
          </button>
        </div>
        <p className={s.status} role="status">
          {message ||
            "ReasonOS checks the evidence dependencies and the defined duration rule. Try the broader claim to see why that evidence cannot support it."}
        </p>
        <details className={s.precision}>
          <summary>ReasonOS evidence · {snapshot.trace.length} events</summary>
          <ol>
            {snapshot.trace.map((event) => (
              <li key={event.id}>
                <strong>
                  {event.accepted ? "Admitted" : "Rejected"} · {event.operator}
                </strong>{" "}
                {event.summary}
              </li>
            ))}
          </ol>
          <div className={s.reasoningControls}>
            <button
              onClick={() => {
                try {
                  replayTrace(snapshot.trace, snapshot.journal);
                  setMessage(
                    "Replay verified: source dependencies and accepted/rejected events reproduce.",
                  );
                } catch {
                  setMessage("Replay failed.");
                }
              }}
            >
              Verify source trace
            </button>
            <button onClick={exportEvidence}>Export connected evidence</button>
          </div>
          <pre
            data-connected-trace
            tabIndex={0}
            aria-label="Connected ECG source trace JSON"
          >
            {JSON.stringify(
              { trace: snapshot.trace, journal: snapshot.journal },
              null,
              2,
            )}
          </pre>
        </details>
      </div>
      <p className={s.sourceNote}>
        Source {recordingId} · SHA-256 {recording.sha256.slice(0, 16)}… ·
        reported axes and printed intervals are machine-derived; calipers are
        learner-marked.{" "}
        <a
          href="https://ecg.utah.edu/lesson/1"
          target="_blank"
          rel="noreferrer"
        >
          Waves and lead definitions
        </a>{" "}
        ·{" "}
        <a
          href="https://www.bem.fi/book/15/15.htm"
          target="_blank"
          rel="noreferrer"
        >
          Lead-field assumptions
        </a>
        .
      </p>
    </section>
  );
}
