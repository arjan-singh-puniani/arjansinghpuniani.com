"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { MathText } from "./ReasonOSLab";
import {
  REFERENCE_CASES,
  STANDARD_LEADS,
  decodeReferenceECG,
  referenceInterval,
  referenceVoltage,
  type StandardLead,
  type ReferencePattern,
  type ReferenceSignal,
} from "@/lib/reasonos/reference-ecg";
import base from "./ReasonOSLab.module.css";
import s from "./ReferenceECGs.module.css";
const root = "/ecg-reference/ptb-xl-1.0.3";
const n = (value: number, digits = 3) => Number(value.toFixed(digits));
const labels: Record<ReferencePattern, string> = {
  sinus: "Sinus pattern without the listed bundle-branch blocks",
  afib: "Atrial fibrillation pattern",
  rbbb: "Complete right bundle-branch block pattern",
  lbbb: "Complete left bundle-branch block pattern",
};
const display = (lead: string) =>
  lead.startsWith("AV") ? `aV${lead[2]}` : lead;
interface SignalPin {
  lead: StandardLead;
  startIndex: number;
  endIndex: number;
  windowStart: number;
  sha256: string;
}
interface Attempt {
  caseId: string;
  answer: ReferencePattern;
  confidence: number;
  reason: string;
  pins: SignalPin[];
  annotationMatch: boolean;
}
export function ReferenceECGs() {
  const [caseId, setCaseId] = useState<string>(REFERENCE_CASES[0].id),
    [signal, setSignal] = useState<ReferenceSignal | null>(null),
    [digest, setDigest] = useState(""),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const [lead, setLead] = useState<StandardLead>("II"),
    [windowStart, setWindowStart] = useState(0),
    [markers, setMarkers] = useState<readonly [number, number]>([500, 1000]),
    [place, setPlace] = useState<0 | 1>(0);
  const [choice, setChoice] = useState<ReferencePattern | "">(""),
    [confidence, setConfidence] = useState(60),
    [reason, setReason] = useState(""),
    [pins, setPins] = useState<SignalPin[]>([]),
    [attempts, setAttempts] = useState<Attempt[]>([]),
    [revealed, setRevealed] = useState(false);
  const dragging = useRef<0 | 1 | null>(null);
  const current = REFERENCE_CASES.find((item) => item.id === caseId)!;
  useEffect(() => {
    const abort = new AbortController();
    setSignal(null);
    setError("");
    const read = async () => {
      const responses = await Promise.all([
        fetch(`${root}/${caseId}_hr.hea`, { signal: abort.signal }),
        fetch(`${root}/${caseId}_hr.dat`, { signal: abort.signal }),
        fetch(`${root}/provenance.json`, { signal: abort.signal }),
      ]);
      if (responses.some((r) => !r.ok))
        throw new Error("The reference recording could not be loaded.");
      const [header, buffer, manifest] = await Promise.all([
        responses[0].text(),
        responses[1].arrayBuffer(),
        responses[2].json(),
      ]);
      const hash = async (bytes: BufferSource) =>
        Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      const [sha, headerSha] = await Promise.all([
        hash(buffer),
        hash(new TextEncoder().encode(header)),
      ]);
      const original = manifest.records.find(
        (r: { id: string }) => r.id === caseId,
      );
      if (
        !original ||
        original.sha256.dat !== sha ||
        original.sha256.hea !== headerSha ||
        !header.startsWith(`${caseId}_hr `) ||
        !original.validatedByHuman
      )
        throw new Error(
          "The reference recording did not match its source provenance.",
        );
      const decoded = decodeReferenceECG(header, buffer);
      if (!abort.signal.aborted) {
        setSignal(decoded);
        setDigest(sha);
      }
    };
    read().catch((e) => {
      if (!abort.signal.aborted)
        setError(
          e instanceof Error ? e.message : "Unable to load reference ECG",
        );
    });
    return () => abort.abort();
  }, [caseId, retry]);
  const first = Math.round(windowStart * 500);
  const voltageScale = current.displayGain * 4;
  const order: StandardLead[][] = [
    ["I", "AVR", "V1", "V4"],
    ["II", "AVL", "V2", "V5"],
    ["III", "AVF", "V3", "V6"],
  ];
  const paths = useMemo(() => {
    if (!signal) return null;
    const result = {} as Record<StandardLead, string>;
    for (const name of STANDARD_LEADS)
      result[name] = Array.from(
        { length: Math.min(1250, signal.sampleCount - first) },
        (_, j) =>
          `${n(j / 5)},${n(-referenceVoltage(signal, name, first + j) * voltageScale)}`,
      ).join(" ");
    const rhythm = Array.from(
      { length: signal.sampleCount },
      (_, i) =>
        `${n(i / 5)},${n(-referenceVoltage(signal, "II", i) * voltageScale)}`,
    ).join(" ");
    return { leads: result, rhythm };
  }, [signal, first, voltageScale]);
  const duration = signal
    ? referenceInterval(signal, markers[0], markers[1])
    : 0;
  function switchCase(id: string) {
    if (id === caseId) return;
    setCaseId(id);
    setSignal(null);
    setLead("II");
    setPlace(0);
    dragging.current = null;
    setMarkers([500, 1000]);
    setWindowStart(0);
    setPins([]);
    setChoice("");
    setReason("");
    setRevealed(false);
  }
  function move(svg: SVGSVGElement, x: number, y: number, target: 0 | 1) {
    const p = svg.createSVGPoint();
    p.x = x;
    p.y = y;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const local = p.matrixTransform(matrix.inverse());
    const index = Math.max(
      0,
      Math.min(4999, Math.round(first + (local.x - 45) * 5)),
    );
    setMarkers((old) => (target === 0 ? [index, old[1]] : [old[0], index]));
  }
  function submit() {
    if (!choice) return;
    setAttempts((old) => [
      ...old,
      {
        caseId,
        answer: choice,
        confidence,
        reason: reason.trim(),
        pins: structuredClone(pins),
        annotationMatch: choice === current.pattern,
      },
    ]);
    setRevealed(true);
  }
  function exportAttempts() {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              source: "PTB-XL 1.0.3",
              scope:
                "Selected rhythm/conduction pattern exercises; matching dataset annotations is not a competency assessment.",
              attempts,
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
    a.download = "ecg-reference-practice.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section
      id="ecg-reference-practice"
      className={`${base.lab} ${s.practice}`}
      aria-labelledby="reference-practice-title"
    >
      <div className={base.header}>
        <div>
          <h2 id="reference-practice-title">Read a different recorded ECG</h2>
          <p>
            Four human-validated reference recordings · 12 simultaneous leads ·
            native 500 Hz samples.
          </p>
        </div>
        <button onClick={exportAttempts}>Export practice attempts</button>
      </div>
      <div className={s.caseTabs}>
        {REFERENCE_CASES.map((item) => (
          <button
            key={item.id}
            aria-pressed={item.id === caseId}
            onClick={() => switchCase(item.id)}
          >
            {item.label}
          </button>
        ))}
        <span>
          {attempts.length} attempts ·{" "}
          {attempts.filter((a) => a.annotationMatch).length} annotation matches
        </span>
      </div>
      <p className={s.intro}>
        Inspect rhythm and conduction before revealing the reference annotation.
        Pin at least two leads and explain the observations supporting your
        choice.
      </p>
      {error ? (
        <div role="alert">
          {error}
          <button onClick={() => setRetry((old) => old + 1)}>
            Retry recording
          </button>
        </div>
      ) : !signal || !paths ? (
        <p role="status">
          Loading the recorded signal and verifying its source digest…
        </p>
      ) : (
        <>
          <div
            className={s.paperFrame}
            tabIndex={0}
            role="region"
            aria-label="Twelve-lead reference ECG sheet; scroll horizontally on small screens"
          >
            <svg
              viewBox="0 0 1200 820"
              className={s.paper}
              role="group"
              aria-label={`${current.label}: twelve recorded ECG leads. Every lead panel shows ${windowStart} to ${windowStart + 2.5} seconds; the bottom lead II strip shows the full ten seconds.`}
            >
              <defs>
                <pattern
                  id="ref-small-grid"
                  width="4"
                  height="4"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M4 0H0V4"
                    fill="none"
                    stroke="#e1e7ec"
                    strokeWidth=".35"
                  />
                </pattern>
                <pattern
                  id="ref-large-grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <rect width="20" height="20" fill="url(#ref-small-grid)" />
                  <path
                    d="M20 0H0V20"
                    fill="none"
                    stroke="#bdcbd4"
                    strokeWidth=".5"
                  />
                </pattern>
                <clipPath id="ref-cell-clip">
                  <rect x="0" y="-80" width="250" height="160" />
                </clipPath>
                <clipPath id="ref-rhythm-clip">
                  <rect x="0" y="-80" width="1000" height="160" />
                </clipPath>
              </defs>
              <rect width="1200" height="820" fill="#f9fbfc" />
              <text x="35" y="26" fill="#334958" fontSize="13">
                PTB-XL {caseId} · 25 mm/s · {current.displayGain} mm/mV · lead
                panels {n(windowStart, 1)}–{n(windowStart + 2.5, 1)} s
              </text>
              {order.map((row, r) =>
                row.map((name, c) => (
                  <g
                    key={name}
                    transform={`translate(${35 + c * 290} ${125 + r * 190})`}
                    onClick={() => setLead(name)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Focus reference lead ${display(name)}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setLead(name);
                      }
                    }}
                  >
                    <rect
                      x="0"
                      y="-80"
                      width="250"
                      height="160"
                      fill="url(#ref-large-grid)"
                      stroke={lead === name ? "#08647d" : "none"}
                      strokeWidth="1.4"
                    />
                    <text x="4" y="-63" fill="#253f50" fontSize="14">
                      {display(name)}
                    </text>
                    <g clipPath="url(#ref-cell-clip)">
                      <polyline
                        points={paths.leads[name]}
                        fill="none"
                        stroke={lead === name ? "#006d83" : "#233e4e"}
                        strokeWidth="1"
                      />
                    </g>
                  </g>
                )),
              )}
              <g transform="translate(55 710)">
                <rect
                  x="0"
                  y="-80"
                  width="1000"
                  height="160"
                  fill="url(#ref-large-grid)"
                />
                <text x="4" y="-63" fill="#253f50" fontSize="14">
                  II · 0–10 s
                </text>
                <g clipPath="url(#ref-rhythm-clip)">
                  <rect
                    x={n(windowStart * 100)}
                    y="-80"
                    width="250"
                    height="160"
                    fill="#0c8b9b"
                    opacity=".08"
                  />
                  <polyline
                    points={paths.rhythm}
                    fill="none"
                    stroke="#233e4e"
                    strokeWidth="1"
                  />
                </g>
              </g>
            </svg>
          </div>
          <div className={s.focusControls}>
            <label>
              Focus lead
              <select
                aria-label="Reference ECG lead"
                value={lead}
                onChange={(e) => setLead(e.target.value as StandardLead)}
              >
                {STANDARD_LEADS.map((name) => (
                  <option key={name} value={name}>
                    {display(name)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Recorded window{" "}
              <output>
                {n(windowStart, 1)}–{n(windowStart + 2.5, 1)} s
              </output>
              <input
                aria-label="Reference ECG window"
                type="range"
                min="0"
                max="7.5"
                step=".002"
                value={windowStart}
                onChange={(e) => setWindowStart(Number(e.target.value))}
              />
            </label>
            <button
              onClick={() =>
                setPins((old) => [
                  ...old.filter((p) => p.lead !== lead),
                  {
                    lead,
                    startIndex: markers[0],
                    endIndex: markers[1],
                    windowStart,
                    sha256: digest,
                  },
                ])
              }
            >
              Pin reference lead {display(lead)}
            </button>
          </div>
          <svg
            viewBox="0 0 400 220"
            className={s.focusStrip}
            role="img"
            aria-label={`Focused recorded lead ${display(lead)} with native sample calipers`}
            onPointerDown={(e) => {
              const attr = (e.target as Element)
                .closest("[data-native-caliper]")
                ?.getAttribute("data-native-caliper");
              const target = (attr ? Number(attr) : place) as 0 | 1;
              dragging.current = target;
              move(e.currentTarget, e.clientX, e.clientY, target);
              if (!attr) setPlace(place === 0 ? 1 : 0);
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (dragging.current !== null)
                move(e.currentTarget, e.clientX, e.clientY, dragging.current);
            }}
            onPointerUp={() => {
              dragging.current = null;
            }}
            onPointerCancel={() => {
              dragging.current = null;
            }}
          >
            <defs>
              <clipPath id="ref-focus-clip">
                <rect x="45" y="20" width="250" height="170" />
              </clipPath>
            </defs>
            <rect width="400" height="220" fill="#f9fbfc" />
            <text x="15" y="16" fontSize="11" fill="#334958">
              {display(lead)} · {current.displayGain} mm/mV · 2 ms/sample
            </text>
            <rect
              x="45"
              y="20"
              width="250"
              height="170"
              fill="url(#ref-large-grid)"
            />
            <g clipPath="url(#ref-focus-clip)">
              <polyline
                points={paths.leads[lead]}
                transform="translate(45 110)"
                fill="none"
                stroke="#006d83"
                strokeWidth="1.3"
              />
              {markers.map((index, j) => (
                <g key={j} data-native-caliper={j}>
                  <rect
                    x={n(45 + (index - first) / 5 - 12)}
                    y="20"
                    width="24"
                    height="170"
                    fill="transparent"
                  />
                  <line
                    x1={n(45 + (index - first) / 5)}
                    x2={n(45 + (index - first) / 5)}
                    y1="20"
                    y2="190"
                    stroke="#8b4ca2"
                    strokeWidth="1"
                  />
                  <circle
                    cx={n(45 + (index - first) / 5)}
                    cy="30"
                    r="7"
                    fill="white"
                    stroke="#8b4ca2"
                  />
                  <text
                    x={n(45 + (index - first) / 5)}
                    y="33"
                    fontSize="9"
                    textAnchor="middle"
                    fill="#623274"
                  >
                    {j + 1}
                  </text>
                </g>
              ))}
            </g>
            <text x="305" y="100" fontSize="12" fill="#334958">
              Δt {n(duration, 1)} ms
            </text>
            <text x="305" y="119" fontSize="10" fill="#334958">
              {n(referenceVoltage(signal, lead, markers[1]))} mV at 2
            </text>
          </svg>
          <div className={s.samples}>
            {markers.map((index, j) => (
              <label key={j}>
                Caliper {j + 1} / sample
                <input
                  aria-label={`Native caliper ${j + 1}`}
                  type="number"
                  min="0"
                  max="4999"
                  step="1"
                  value={index}
                  onChange={(e) => {
                    const next = Math.max(
                      0,
                      Math.min(4999, Math.round(Number(e.target.value))),
                    );
                    setMarkers((old) =>
                      j === 0 ? [next, old[1]] : [old[0], next],
                    );
                  }}
                />
              </label>
            ))}
          </div>
          <MathText
            tex={`\\Delta t=\\frac{|${markers[1]}-${markers[0]}|}{${signal.sampleRate}\\,\\mathrm{s}^{-1}}=${n(duration)}\\,\\mathrm{ms}`}
            reading={`Native sample difference ${Math.abs(markers[1] - markers[0])} divided by 500 samples per second gives ${duration} milliseconds.`}
          />
          <div className={s.assessment}>
            <fieldset disabled={revealed}>
              <legend>
                Which rhythm or conduction pattern best matches this reference
                recording?
              </legend>
              {Object.entries(labels).map(([value, label]) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="reference-pattern"
                    checked={choice === value}
                    onChange={() => setChoice(value as ReferencePattern)}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <label>
              Evidence and reasoning
              <textarea
                aria-label="Reference ECG reasoning"
                value={reason}
                disabled={revealed}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <label>
              Confidence before annotation <output>{confidence}%</output>
              <input
                aria-label="Reference ECG confidence"
                type="range"
                min="0"
                max="100"
                step="5"
                value={confidence}
                disabled={revealed}
                onChange={(e) => setConfidence(Number(e.target.value))}
              />
            </label>
            <p>
              Pinned leads:{" "}
              {pins.length
                ? pins.map((p) => display(p.lead)).join(", ")
                : "none yet"}
            </p>
            {!revealed ? (
              <button
                disabled={!choice || !reason.trim() || pins.length < 2}
                onClick={submit}
              >
                Commit interpretation and reveal annotation
              </button>
            ) : (
              <div className={s.annotation} role="status">
                <strong>
                  {choice === current.pattern
                    ? "Reference annotation matched"
                    : "Compare with the reference annotation"}
                </strong>
                <h3>{current.title}</h3>
                <p>{current.reason}</p>
                <p>
                  Source annotation: {current.annotation}. Metadata records
                  human validation and a non-autogenerated initial report for
                  this selected example.
                </p>
                <a href={current.url} target="_blank" rel="noreferrer">
                  Review the interpretation criteria
                </a>
                <button onClick={() => setRevealed(false)}>
                  Revise interpretation
                </button>
              </div>
            )}
          </div>
        </>
      )}
      <details className={base.settings}>
        <summary>Reference dataset, calibration, and reuse</summary>
        <p>
          PTB-XL v1.0.3: four anonymous, human-validated records from folds
          9/10. Original WFDB samples and headers are preserved. Gain and
          baseline convert ADC counts to mV; checksums verify loading. Lead
          panels share time and voltage scales. Annotation matches are practice
          feedback, not a competency score.
        </p>
        <p>
          Wagner et al. (2020),{" "}
          <a
            href="https://doi.org/10.1038/s41597-020-0495-6"
            target="_blank"
            rel="noreferrer"
          >
            PTB-XL: A Large Publicly Available ECG Dataset
          </a>
          ;{" "}
          <a
            href="https://doi.org/10.13026/kfzx-aw45"
            target="_blank"
            rel="noreferrer"
          >
            dataset release 1.0.3
          </a>
          . PhysioNet attribution: Pollard et al. (2026),{" "}
          <a
            href="https://doi.org/10.1038/s44360-026-00096-z"
            target="_blank"
            rel="noreferrer"
          >
            PhysioNet as a global platform for biomedical research
          </a>
          . Reused under <a href={`${root}/LICENSE.txt`}>CC BY 4.0</a>. Four
          records selected; source samples unchanged.{" "}
          <a href={`${root}/provenance.json`}>
            Source files, annotations, and publisher-verified digests
          </a>
          .
        </p>
      </details>
    </section>
  );
}
