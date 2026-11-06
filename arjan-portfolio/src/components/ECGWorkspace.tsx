"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { REFERENCE_CASES } from "@/lib/reasonos/reference-ecg";
import { imageInterval, type ImagePoint } from "@/lib/reasonos/recordings";
import {
  MAX_FILE_BYTES, decodeWorkspaceWFDB, decodeWorkspaceCSV, createWorkspaceTrace,
  appendWorkspaceState, workspaceStates, claimNeedsReview, type DigitalECG,
} from "@/lib/reasonos/workspace";
import type { JsonObject, State, Trace } from "@/lib/reasonos/core/browser";
import s from "./ECGWorkspace.module.css";

type Source = {
  id: string; name: string; sha: string; headerSha?: string; local: boolean;
  signal?: DigitalECG; image?: string; width: number; height: number; page?: number;
};
type PointPair = [ImagePoint, ImagePoint];
const pair = (a: number, b: number, y = 110): PointPair => [{ x: a, y }, { x: b, y }];
const round = (v: number, digits = 1) => Number(v.toFixed(digits));
const leadLabel = (v: string) => v.replace(/^AV/, "aV");
const hash = async (bytes: BufferSource) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map(b => b.toString(16).padStart(2, "0")).join("");
function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ECGWorkspace({ fullScreen = false }: { fullScreen?: boolean }) {
  const [source, setSource] = useState<Source | null>(null), [trace, setTrace] = useState<Trace | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [message, setMessage] = useState("");
  const [caseId, setCaseId] = useState("00010"), [lead, setLead] = useState("II"), [windowStart, setWindowStart] = useState(0);
  const [panel, setPanel] = useState<"measure" | "reason" | "review" | "source">("measure");
  const [overlays, setOverlays] = useState(true), [zoom, setZoom] = useState(1), [gain, setGain] = useState(10);
  const [points, setPoints] = useState<PointPair>(() => pair(250, 350)), [grid, setGrid] = useState<PointPair>(() => pair(150, 350));
  const [tool, setTool] = useState<"measure" | "calibrate">("measure"), [nextPoint, setNextPoint] = useState<0 | 1>(0);
  const [mm, setMm] = useState(25), [speed, setSpeed] = useState(25), [errorPx, setErrorPx] = useState(1), [confirmed, setConfirmed] = useState(false);
  const [kind, setKind] = useState("Other"), [imageLead, setImageLead] = useState("II"), [draft, setDraft] = useState("");
  const [selected, setSelected] = useState<string | null>(null), [editing, setEditing] = useState<string | null>(null);
  const [overviewOpen, setOverviewOpen] = useState(true), [windowSeconds, setWindowSeconds] = useState(10);
  const [pageCount, setPageCount] = useState(0), [page, setPage] = useState(1);
  const pdf = useRef<PDFDocumentProxy | null>(null), pdfInfo = useRef<{ name: string; sha: string; local: boolean } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null), serial = useRef(0), drag = useRef<0 | 1 | null>(null);
  const worksheets = useRef(new Map<string, Trace>());
  const states = useMemo(() => trace ? workspaceStates(trace) : [], [trace]);
  const saved = states.filter(st => st.role === "measurement" || st.role === "claim");
  const selectedState = saved.find(st => st.id === selected);
  const signal = source?.signal;
  const activeLead = signal ? lead : imageLead;
  const duration = signal ? (signal.sampleCount - 1) / signal.sampleRate : 0;
  const span = Math.min(windowSeconds, duration);
  const panelSpan = Math.min(2.5, span);
  const stripWidth = 1000, stripHeight = 240;
  const coordWidth = signal ? stripWidth : source?.width ?? 1000;
  const coordHeight = signal ? stripHeight : source?.height ?? 700;
  const calibrationKey = signal ? JSON.stringify({ source: source.id, sampleRate: signal.sampleRate, units: "mV" }) :
    JSON.stringify({ source: source?.id, grid, mm, speed, errorPx });
  let measured: { duration: number; uncertainty: number; low: number; high: number; ordered: boolean } | null = null;
  try {
    if (signal) {
      const a = Math.round(points[0].x / stripWidth * span * signal.sampleRate);
      const b = Math.round(points[1].x / stripWidth * span * signal.sampleRate);
      const value = (b - a) / signal.sampleRate * 1000;
      measured = { duration: value, uncertainty: 1000 / signal.sampleRate, low: Math.max(0, value - 1000 / signal.sampleRate), high: value + 1000 / signal.sampleRate, ordered: b > a };
    } else if (confirmed) measured = imageInterval(points[0], points[1], { a: grid[0], b: grid[1], mm, speed, errorPx });
  } catch { /* Invalid draft calibration stays unmeasurable. */ }
  const canSave = measured && measured.ordered && measured.duration > 0 && (signal ? points : [points, grid].flat()).every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= coordWidth && p.y >= 0 && p.y <= coordHeight);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const update = () => setOverviewOpen(!media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!fullScreen) return;
    const old = document.body.style.overflow; document.body.style.overflow = "hidden";
    const chrome = Array.from(document.querySelectorAll<HTMLElement>(".site-header, .footer, .skip-link"));
    const previous = chrome.map(element => ({ element, display: element.style.display, inert: element.inert }));
    chrome.forEach(element => { element.inert = true; element.style.display = "none"; });
    return () => { document.body.style.overflow = old; previous.forEach(({ element, display, inert }) => { element.style.display = display; element.inert = inert; }); };
  }, [fullScreen]);

  function install(next: Source) {
    if (!next.page) void closePDF();
    setSource(next); setLead(next.signal?.leads.includes("II") ? "II" : next.signal?.leads[0] ?? "II");
    setWindowStart(0); setWindowSeconds(window.innerWidth <= 760 ? 2.5 : 10); setOverviewOpen(window.innerWidth > 760); setZoom(1); setSelected(null); setEditing(null); setDraft(""); setConfirmed(false); setNextPoint(0); setTool("measure"); setGain(10);
    setPoints(next.signal ? pair(250, 350) : pair(next.width * .25, next.width * .5, next.height * .65));
    setGrid(pair(next.width * .15, next.width * .35, next.height * .8));
    const nextTrace = worksheets.current.get(next.id) ?? createWorkspaceTrace(next.id, {
      format: next.signal ? "digital-waveform" : "source-image", sha256: next.sha, headerSha256: next.headerSha ?? null,
      localFile: next.local, page: next.page ?? null, width: next.width, height: next.height,
      sampleRateHz: next.signal?.sampleRate ?? null, sampleCount: next.signal?.sampleCount ?? null,
      leads: next.signal?.leads ?? [], sourceDescription: next.local ? "Local file; contents excluded from worksheet" : next.name,
    });
    worksheets.current.set(next.id, nextTrace); setTrace(nextTrace); setLoading(false);
  }
  async function closePDF() {
    const old = pdf.current; pdf.current = null; pdfInfo.current = null; setPageCount(0);
    if (old) await old.loadingTask.destroy();
  }
  async function reference(id: string) {
    const token = ++serial.current; setLoading(true); setError(""); setMessage(""); setCaseId(id);
    try {
      const root = "/ecg-reference/ptb-xl-1.0.3";
      const responses = await Promise.all([fetch(`${root}/${id}_hr.hea`), fetch(`${root}/${id}_hr.dat`), fetch(`${root}/provenance.json`)]);
      if (responses.some(r => !r.ok)) throw new Error("Reference recording unavailable. Retry or open a local file.");
      const [header, buffer, manifest] = await Promise.all([responses[0].text(), responses[1].arrayBuffer(), responses[2].json()]);
      const [sha, headerSha] = await Promise.all([hash(buffer), hash(new TextEncoder().encode(header))]);
      const entry = manifest.records.find((item: { id: string }) => item.id === id);
      if (!entry || sha !== entry.sha256.dat || headerSha !== entry.sha256.hea) throw new Error("Reference digest mismatch. This recording was not opened.");
      const decoded = decodeWorkspaceWFDB(header, buffer, `${id}_hr.dat`);
      if (serial.current === token) install({ id: sha, name: `PTB-XL · ${id}`, sha, headerSha, local: false, signal: decoded, width: 1200, height: 700 });
    } catch (e) { if (serial.current === token) { setError(e instanceof Error ? e.message : "Unable to open recording."); setLoading(false); } }
  }
  useEffect(() => {
    void reference("00010");
    return () => {
      // Invalidate any import still running when this workspace unmounts.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      serial.current++; void pdf.current?.loadingTask.destroy();
    };
    // The initial reference is a one-time import; controls load subsequent sources.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function renderPage(document: PDFDocumentProxy, number: number, info: { name: string; sha: string; local: boolean }, token: number) {
    const pdfPage = await document.getPage(number);
    const base = pdfPage.getViewport({ scale: 1 });
    if (![base.width, base.height].every(v => Number.isFinite(v) && v > 0)) throw new Error("PDF page has invalid dimensions.");
    const scale = Math.min(2.5, 2200 / Math.max(base.width, base.height), Math.sqrt(8_000_000 / (base.width * base.height)));
    const viewport = pdfPage.getViewport({ scale });
    const canvas = window.document.createElement("canvas"); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d"); if (!context) throw new Error("Canvas rendering is unavailable in this browser.");
    await pdfPage.render({ canvasContext: context, canvas, viewport }).promise;
    const image = canvas.toDataURL("image/png");
    if (token === serial.current) {
      install({ id: `${info.sha}:page:${number}`, ...info, image, width: canvas.width, height: canvas.height, page: number });
      setPage(number); setPageCount(document.numPages);
    }
  }
  async function openFiles(files: File[]) {
    if (!files.length) return;
    const token = ++serial.current; setLoading(true); setError(""); setMessage("");
    try {
      if (files.length > 2 || files.some(f => f.size > MAX_FILE_BYTES || !f.size)) throw new Error("Open one PDF/image/CSV or a matching .hea + .dat pair, up to 25 MB per file.");
      const file = files[0], suffix = file.name.split(".").at(-1)?.toLowerCase();
      if (files.length === 2) {
        const hea = files.find(f => /\.hea$/i.test(f.name)), dat = files.find(f => /\.dat$/i.test(f.name));
        if (!hea || !dat || hea.size > 64_000) throw new Error("Select the matching WFDB .hea and .dat files together.");
        const [header, buffer] = await Promise.all([hea.text(), dat.arrayBuffer()]);
        const decoded = decodeWorkspaceWFDB(header, buffer, dat.name);
        const [sha, headerSha] = await Promise.all([hash(buffer), hash(new TextEncoder().encode(header))]);
        if (serial.current === token) install({ id: `${sha}:${headerSha}`, name: "Local digital ECG", sha, headerSha, local: true, signal: decoded, width: 1200, height: 700 });
      } else if (suffix === "pdf") {
        const bytes = new Uint8Array(await file.arrayBuffer()), sha = await hash(bytes);
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/ecg-workspace/pdf.worker.min.mjs";
        const task = pdfjs.getDocument({ data: bytes, useSystemFonts: true, useWasm: false, disableFontFace: true });
        let document: PDFDocumentProxy;
        try { document = await task.promise; } catch (e) { await task.destroy(); throw e; }
        if (serial.current !== token) { await document.loadingTask.destroy(); return; }
        if (document.numPages > 100) { await document.loadingTask.destroy(); throw new Error("PDF import is limited to 100 pages."); }
        const info = { name: "Local ECG PDF", sha, local: true };
        try { await renderPage(document, 1, info, token); }
        catch (e) { await document.loadingTask.destroy(); throw e; }
        if (serial.current === token) {
          const old = pdf.current; pdf.current = document; pdfInfo.current = info;
          if (old) void old.loadingTask.destroy();
        } else await document.loadingTask.destroy();
      } else if (suffix === "csv") {
        const text = await file.text(), sha = await hash(new TextEncoder().encode(text));
        const decoded = decodeWorkspaceCSV(text);
        if (serial.current === token) install({ id: sha, name: "Local digital ECG", sha, local: true, signal: decoded, width: 1200, height: 700 });
      } else if (["png", "jpg", "jpeg", "webp"].includes(suffix ?? "")) {
        const bytes = await file.arrayBuffer(), sha = await hash(bytes);
        const bitmap = await createImageBitmap(file);
        if (bitmap.width * bitmap.height > 20_000_000) { bitmap.close(); throw new Error("Image exceeds 20 megapixels. Export a smaller image first."); }
        const canvas = document.createElement("canvas"); canvas.width = bitmap.width; canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d"); if (!ctx) { bitmap.close(); throw new Error("Image rendering unavailable."); }
        ctx.drawImage(bitmap, 0, 0); bitmap.close();
        if (serial.current === token) install({ id: sha, name: "Local ECG image", sha, local: true, image: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height });
      } else throw new Error("Supported: PDF, PNG/JPEG/WebP, CSV, or a WFDB format-16 .hea + .dat pair. DICOM and vendor XML are not supported in this release.");
    } catch (e) { if (serial.current === token) { setError(e instanceof Error ? e.message : "Unable to read this file."); setLoading(false); } }
  }
  async function changePage(number: number) {
    if (!pdf.current || !pdfInfo.current) return;
    const token = ++serial.current; setLoading(true); setError("");
    try { await renderPage(pdf.current, number, pdfInfo.current, token); }
    catch (e) { if (serial.current === token) { setError(e instanceof Error ? e.message : "Unable to render page."); setLoading(false); } }
  }
  const stripPath = useMemo(() => {
    if (!signal) return "";
    const values = signal.millivolts[signal.leads.indexOf(lead)]; if (!values) return "";
    const first = Math.round(windowStart * signal.sampleRate), count = Math.min(values.length - first, Math.floor(span * signal.sampleRate) + 1);
    return Array.from({ length: count }, (_, j) => `${round(j / signal.sampleRate / span * stripWidth, 3)},${round(120 - Math.max(-1e6, Math.min(1e6, values[first + j])) * gain * 4, 3)}`).join(" ");
  }, [signal, lead, windowStart, span, gain]);
  function movePoint(index: 0 | 1, point: ImagePoint) {
    const update = (old: PointPair): PointPair => old.map((p, i) => i === index ? point : p) as PointPair;
    if (tool === "calibrate") { setGrid(update); setConfirmed(false); } else setPoints(update);
  }
  function svgPoint(e: React.PointerEvent<SVGSVGElement>) {
    const matrix = e.currentTarget.getScreenCTM(); if (!matrix) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
    return { x: Math.max(0, Math.min(coordWidth, p.x)), y: Math.max(0, Math.min(coordHeight, p.y)) };
  }
  function saveMeasurement() {
    if (!source || !trace || !canSave || !measured) return;
    const payload: JsonObject = { sourceId: source.id, label: kind, lead: activeLead, durationMs: measured.duration,
      uncertaintyMs: measured.uncertainty, lowerMs: measured.low, upperMs: measured.high, points: points.map(p => [p.x, p.y]),
      calibrationKey, windowStart, span, windowSeconds, sampleIndices: signal ? points.map(p => Math.round((windowStart + p.x / stripWidth * span) * signal.sampleRate)) : null, endpointBasis: signal ? "Manual endpoints snapped to recorded samples; ±1 sample bound for interval quantization only" : "Manual source pixels; user-specified endpoint bound; scan distortion excluded",
      coordinateSystem: signal ? "focused-strip" : "source-image", calibration: signal ? { sampleRateHz: signal.sampleRate } : { grid: grid.map(p => [p.x, p.y]), mm, speedMmPerSecond: speed, errorPx },
    };
    const result = appendWorkspaceState(trace, "measurement", payload, ["source"], editing ?? undefined);
    setTrace(result.trace); worksheets.current.set(source.id, result.trace);
    if (result.transformation.accepted) { setSelected(result.transformation.outputStateId); setEditing(null); setMessage("Measurement saved with source endpoints and calibration."); }
    else setMessage("Measurement rejected. Check endpoints and calibration.");
  }
  function saveClaim() {
    if (!trace || !source || !selectedState || selectedState.role !== "measurement" || draft.trim().length < 3) return;
    const result = appendWorkspaceState(trace, "claim", { sourceId: source.id, text: draft.trim(), lead: selectedState.payload.lead,
      measurementIds: [selectedState.id], status: "proposed; not clinically validated" }, [selectedState.id]);
    setTrace(result.trace); worksheets.current.set(source.id, result.trace); setDraft(""); setPanel("review");
    setMessage(result.transformation.accepted ? "Proposed interpretation linked to the selected measurement. Clinical validity has not been assessed." : "Claim rejected: source-linked evidence is required.");
  }
  function inspect(state: State, revise = false) {
    setSelected(state.id); setOverlays(true);
    if (state.role === "measurement") {
      const p = state.payload;
      setPoints((p.points as number[][]).map(v => ({ x: v[0], y: v[1] })) as PointPair);
      setWindowSeconds(Number(p.windowSeconds ?? (Number(p.span) <= 2.5 ? 2.5 : Number(p.span) <= 5 ? 5 : 10))); setWindowStart(Number(p.windowStart)); setKind(String(p.label)); setTool("measure");
      if (signal) setLead(String(p.lead)); else {
        setImageLead(String(p.lead));
        const c = p.calibration as { grid: number[][]; mm: number; speedMmPerSecond: number; errorPx: number };
        setGrid(c.grid.map(v => ({ x: v[0], y: v[1] })) as PointPair); setMm(c.mm); setSpeed(c.speedMmPerSecond); setErrorPx(c.errorPx); setConfirmed(true);
      }
      setEditing(revise ? state.id : null); setPanel(revise ? "measure" : "reason");
    } else {
      const measurement = saved.find(st => (state.payload.measurementIds as string[]).includes(st.id));
      if (measurement) { inspect(measurement); setSelected(state.id); setPanel("review"); }
    }
  }
  function exportWorksheet(format: "json" | "text") {
    if (!trace || !source) return;
    const summary = saved.map(st => st.role === "measurement" ? `${st.id}: ${st.payload.label}, lead ${st.payload.lead}: ${round(Number(st.payload.durationMs), 3)} ms; endpoint bound ±${round(Number(st.payload.uncertaintyMs), 3)} ms${st.payload.revisionOf ? `; revises ${st.payload.revisionOf}` : ""}` :
      `${st.id}: PROPOSED — ${st.payload.text}; evidence: ${(st.payload.measurementIds as string[]).join(", ")}; ${claimNeedsReview(st, states) ? "NEEDS REVIEW: evidence revised" : "not clinically validated"}`).join("\n");
    download(`reasonos-worksheet.${format === "json" ? "json" : "txt"}`, format === "json" ? JSON.stringify({ version: "1.0.0", purpose: "Educational ECG evidence worksheet", rawRecordingIncluded: false, trace }, null, 2) :
      `ReasonOS · ECG evidence worksheet\nEducational prototype; not a clinical report\nSource SHA-256: ${source.sha}\nPage: ${source.page ?? "digital"}\n\n${summary || "No measurements saved."}\n\nOriginal recording excluded. Notes may contain personal information entered by the user.`, format === "json" ? "application/json" : "text/plain");
  }
  const displayedPoints = tool === "calibrate" ? grid : points;
  const overlay = overlays && source && <g className={s.overlay}>
    <path d={`M${displayedPoints[0].x} ${displayedPoints[0].y}L${displayedPoints[1].x} ${displayedPoints[1].y}`} strokeDasharray="5 4" />
    {displayedPoints.map((p, i) => <g key={i} data-caliper={i} onPointerDown={e => { e.stopPropagation(); drag.current = i as 0 | 1; e.currentTarget.ownerSVGElement?.setPointerCapture(e.pointerId); }}>
      <line x1={p.x} x2={p.x} y1={Math.max(0, p.y - coordHeight * .16)} y2={Math.min(coordHeight, p.y + coordHeight * .16)} />
      <circle cx={p.x} cy={p.y} r={coordWidth * .009} />
      <text x={p.x + coordWidth * .015} y={p.y - coordHeight * .06} fontSize={coordWidth * .018}>{i === 0 ? "A" : "B"}</text>
    </g>)}
  </g>;
  const pointerProps = {
    onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => { if (!overlays || loading) return; const p = svgPoint(e); if (p) { movePoint(nextPoint, p); setNextPoint(nextPoint === 0 ? 1 : 0); } },
    onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => { if (drag.current !== null) { const p = svgPoint(e); if (p) movePoint(drag.current, p); } },
    onPointerUp: () => { drag.current = null; }, onPointerCancel: () => { drag.current = null; },
  };
  return <section className={`${s.workspace} ${fullScreen ? s.fullScreen : ""}`} aria-labelledby="workspace-title" data-ecg-workspace data-ecg-fullscreen={fullScreen || undefined}>
    <header className={s.masthead}>
      <div><span className={s.brand}>REASONOS <i>/</i> VECTOR EKG</span><h2 id="workspace-title">ECG evidence workspace</h2></div>
      {fullScreen ? <Link href="/work/vector-ekg-reasonos">← Case study</Link> : <Link href="/work/vector-ekg-reasonos/workspace">Open full screen ↗</Link>}
    </header>
    <div className={s.toolbar}>
      <label>Reference <select aria-label="Reference recording" value={source?.local ? "local" : caseId} disabled={loading} onChange={e => void reference(e.target.value)}>
        {source?.local && <option value="local">Local recording</option>}{REFERENCE_CASES.map((item, i) => <option key={item.id} value={item.id}>Recording {String(i + 1).padStart(2, "0")} · PTB-XL {item.id}</option>)}
      </select></label>
      <button className={s.open} disabled={loading} onClick={() => fileInput.current?.click()}>Open local ECG <span>↑</span></button>
      <input ref={fileInput} className={s.file} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.hea,.dat" aria-label="Open local ECG files" onChange={e => { void openFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
      <span className={s.private}>Local files stay in this browser tab</span>
    </div>
    <div className={s.flow} aria-label="ReasonOS evidence workflow"><span>01 <b>Source</b></span><i>→</i><span>02 <b>Measure</b></span><i>→</i><span>03 <b>Reason</b></span><i>→</i><span>04 <b>Review</b></span></div>
    {error && <div className={s.error} role="alert">{error} <button disabled={loading} onClick={() => void reference(caseId)}>Reload reference</button></div>}
    <div className={s.layout}>
      <div className={s.recording}>
        <div className={s.recordingHead}><div><strong>{source?.name ?? "Opening reference recording…"}</strong><span>{source?.local ? "PRIVATE IMPORT" : "RECORDED REFERENCE"} · {signal ? `${signal.sampleRate} Hz · ${signal.leads.length} leads · ${round(duration, 2)} s` : source ? `Original page pixels · ${source.width} × ${source.height}` : "Verifying source"}</span></div>
          <label><input type="checkbox" checked={overlays} onChange={e => setOverlays(e.target.checked)} /> Overlays</label>
        </div>
        {loading && <p role="status" className={s.loading}>Opening and checking recording…</p>}
        {source && <div className={loading ? s.pending : undefined} aria-busy={loading}>
          <div className={s.viewTools}>
            {signal ? <><label>Lead <select aria-label="Focused lead" value={lead} onChange={e => { setLead(e.target.value); setEditing(null); }}>{signal.leads.map(name => <option key={name} value={name}>{leadLabel(name)}</option>)}</select></label>
              <label>Gain <select aria-label="Display gain" value={gain} onChange={e => setGain(Number(e.target.value))}><option value="5">5 mm/mV</option><option value="10">10 mm/mV</option><option value="20">20 mm/mV</option></select></label>
              <label>Window <select aria-label="Focused time span" value={windowSeconds} onChange={e => { setWindowSeconds(Number(e.target.value)); setWindowStart(0); setEditing(null); }}><option value="2.5">2.5 s</option><option value="5">5 s</option><option value="10">10 s</option></select></label><span>Calibrated time & voltage axes</span></> : <><label>Zoom <select aria-label="Source image zoom" value={zoom} onChange={e => setZoom(Number(e.target.value))}><option value="1">Fit page</option><option value="1.5">150%</option><option value="2">200%</option><option value="3">300%</option></select></label>
                {pageCount > 0 && <label>Page <select aria-label="PDF page" value={page} disabled={loading} onChange={e => void changePage(Number(e.target.value))}>{Array.from({ length: pageCount }, (_, i) => <option key={i} value={i + 1}>{i + 1} / {pageCount}</option>)}</select></label>}
                <span>{confirmed ? "User-calibrated image" : "Calibrate before measuring"}</span></>}
          </div>
          {signal ? <>
            <details className={s.overview} open={overviewOpen} onToggle={e => setOverviewOpen(e.currentTarget.open)}><summary>{signal.leads.length}-lead overview <span>Recorded signals · select a lead to focus</span></summary><div className={s.paperFrame} role="region" tabIndex={0} aria-label="Recorded ECG lead overview; select a lead below to inspect it">
              <svg viewBox={`0 0 1200 ${signal.leads.length <= 3 ? 250 : 620}`} className={s.paper} role="group" aria-label="Overview rendered directly from recorded digital samples; all panels show the same 2.5-second window">
                <defs><pattern id="ws-grid" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M4 0H0V4" fill="none" stroke="#d4deda" strokeWidth=".35" /></pattern><pattern id="ws-major" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="url(#ws-grid)"/><path d="M20 0H0V20" fill="none" stroke="#b8c9c2" strokeWidth=".45"/></pattern>
                <clipPath id="ws-cell"><rect width="250" height="150" y="-75" /></clipPath></defs>
                <rect width="1200" height="620" fill="#fcfcf8" />
                <text x="26" y="26" fontSize="12" fill="#536761">{source.name} · recorded samples · all panels {round(windowStart, 2)}–{round(windowStart + panelSpan, 2)} s</text>
                {signal.leads.map((name, i) => {
                  const standard = [["I", "AVR", "V1", "V4"], ["II", "AVL", "V2", "V5"], ["III", "AVF", "V3", "V6"]];
                  let row = standard.findIndex(r => r.includes(name)); const col = row < 0 ? i % 4 : standard[row].indexOf(name); if (row < 0) row = Math.floor(i / 4);
                  const values = signal.millivolts[i], first = Math.round(windowStart * signal.sampleRate);
                  const count = Math.min(values.length - first, Math.floor(panelSpan * signal.sampleRate) + 1);
                  const path = Array.from({ length: count }, (_, j) => `${round(j / signal.sampleRate / panelSpan * 250, 2)},${round(-Math.max(-1e6, Math.min(1e6, values[first + j])) * gain * 4, 2)}`).join(" ");
                  return <g key={name} role="button" tabIndex={0} aria-label={`Focus lead ${leadLabel(name)}`} onClick={() => setLead(name)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLead(name); } }} transform={`translate(${28 + col * 295} ${145 + row * 180})`}>
                    <rect width="250" height="150" y="-75" fill="url(#ws-major)" stroke={lead === name ? "#087e87" : "#d6ded8"} strokeWidth={lead === name ? 1.5 : .5}/>
                    <text x="6" y="-58" fill="#314f47" fontSize="13">{leadLabel(name)}</text>
                    <g clipPath="url(#ws-cell)"><polyline points={path} fill="none" stroke="#233b35" strokeWidth="1" /></g>
                  </g>;
                })}
              </svg>
            </div></details>
            <div className={s.stripHead}><strong>Lead {leadLabel(lead)} <span>· {round(windowStart, 2)}–{round(windowStart + span, 2)} s</span></strong><span>Place A, then B on the recorded trace</span></div>
            <div className={s.stripFrame}><svg viewBox={`0 0 ${stripWidth} ${stripHeight}`} className={s.strip} role="group" aria-label="Focused recorded ECG with movable calipers; exact endpoints are editable in the measurement panel" {...pointerProps}>
              <defs><pattern id="ws-strip-minor" width={stripWidth / span / 25} height="4" patternUnits="userSpaceOnUse"><path d={`M${stripWidth / span / 25} 0H0V4`} fill="none" stroke="#d3dfd8" strokeWidth=".4" /></pattern><pattern id="ws-strip-major" width={stripWidth / span / 5} height="20" patternUnits="userSpaceOnUse"><rect width={stripWidth / span / 5} height="20" fill="url(#ws-strip-minor)"/><path d={`M${stripWidth / span / 5} 0H0V20`} fill="none" stroke="#b8cdc3" strokeWidth=".5" /></pattern></defs>
              <rect width={stripWidth} height={stripHeight} fill="#fcfcf8"/><rect width={stripWidth} height={stripHeight} fill="url(#ws-strip-major)"/>
              <polyline points={stripPath} fill="none" stroke="#233b35" strokeWidth="1.3"/>{overlay}
            </svg></div>
            <label className={s.timeline}>Time window <input type="range" aria-label="Recording time window" min="0" max={Math.max(0, duration - span)} step={1 / signal.sampleRate} value={windowStart} disabled={duration <= span} onChange={e => { setWindowStart(Number(e.target.value)); setEditing(null); }}/><output>{round(windowStart, 2)} s</output></label>
          </> : <div className={s.imageFrame} role="region" tabIndex={0} aria-label="Original ECG page with overlays; scroll to inspect when zoomed">
            <svg viewBox={`0 0 ${source.width} ${source.height}`} style={{ width: `${zoom * 100}%` }} role="group" aria-label="Imported original ECG page pixels; no waveform reconstruction or automatic interpretation" className={s.sourceImage} {...pointerProps}>
              <image href={source.image} width={source.width} height={source.height} />{overlay}
            </svg>
          </div>}
          <div className={s.sourceFooter}><span>{signal ? "Recorded samples · no smoothing or generated beats" : "Original pixels · no inferred digital waveform"}</span><button onClick={() => setPanel("source")}>Source & calibration ↗</button></div>
        </div>}
      </div>
      <aside className={s.inspector} aria-label="Measurements and reasoning">
        <nav className={s.tabs} aria-label="Evidence panels">{(["measure", "reason", "review", "source"] as const).map(name => <button key={name} aria-pressed={panel === name} onClick={() => setPanel(name)}>{name[0].toUpperCase() + name.slice(1)}{name === "review" && saved.length > 0 ? ` ${saved.length}` : ""}</button>)}</nav>
        {panel === "measure" && <div className={s.panel}>
          <p className={s.kicker}>02 / SOURCE MEASUREMENT</p><h3>{editing ? "Revise measurement" : "Place your calipers"}</h3>
          <p>Mark the endpoints yourself. No features or diagnoses are detected automatically.</p>
          <div className={s.fields}><label>Interval <select aria-label="Interval type" value={kind} onChange={e => setKind(e.target.value)}>{["RR", "PR", "QRS", "QT", "Other"].map(k => <option key={k} value={k}>{k === "Other" ? "Manual interval" : k}</option>)}</select></label>
            {!signal && <label>Lead <input aria-label="Image lead label" value={imageLead} maxLength={40} onChange={e => setImageLead(e.target.value)} /></label>}</div>
          {!signal && <div className={s.calibrationNotice}>{confirmed ? "Grid calibration confirmed by you." : "First calibrate a known horizontal grid span."}<button onClick={() => { setPanel("source"); setTool("calibrate"); setOverlays(true); }}>Check calibration →</button></div>}
          <div className={s.pointButtons}>{([0, 1] as const).map(i => <button key={i} aria-pressed={nextPoint === i} onClick={() => { setTool("measure"); setNextPoint(i); setOverlays(true); }}>Place {i === 0 ? "A" : "B"}</button>)}</div>
          <fieldset className={s.endpoints}><legend>{signal ? "Endpoints · seconds from recording start" : "Endpoints · source pixels"}</legend>{points.map((p, i) => <div key={i}><span>{i === 0 ? "A" : "B"}</span><label><span className={s.srOnly}>{i === 0 ? "A" : "B"} {signal ? "time in seconds" : "x coordinate"}</span><input aria-label={`Endpoint ${i === 0 ? "A" : "B"} ${signal ? "seconds" : "x"}`} type="number" step={signal ? 1 / signal.sampleRate : 1} min={signal ? windowStart : 0} max={signal ? windowStart + span : coordWidth} value={signal ? round(windowStart + p.x / stripWidth * span, 6) : round(p.x, 2)} onChange={e => { const x = signal ? (Number(e.target.value) - windowStart) / span * stripWidth : Number(e.target.value); setPoints(old => old.map((v, j) => j === i ? { ...v, x } : v) as PointPair); }}/></label>
            {!signal && <label><span className={s.srOnly}>{i === 0 ? "A" : "B"} y coordinate</span><input aria-label={`Endpoint ${i === 0 ? "A" : "B"} y`} type="number" min="0" max={coordHeight} value={round(p.y, 2)} onChange={e => setPoints(old => old.map((v, j) => j === i ? { ...v, y: Number(e.target.value) } : v) as PointPair)}/></label>}</div>)}</fieldset>
          <div className={s.readout}><span>{kind === "Other" ? "Selected" : kind} interval</span><strong>{measured && measured.ordered ? round(measured.duration, 2) : "—"}<small> ms</small></strong><p>{measured && measured.ordered ? `Endpoint bound ±${round(measured.uncertainty, 2)} ms` : "Ordered endpoints and calibration required"}</p></div>
          <small className={s.limit}>{signal ? "Bound covers one-sample interval quantization. Manual feature selection and acquisition uncertainty are additional." : "Bound uses your pixel-placement estimate. Perspective, paper distortion and ambiguous feature boundaries are additional."}</small>
          <button className={s.primary} disabled={!canSave || loading} onClick={saveMeasurement}>{editing ? "Save revision" : "Save measurement"}</button>
          {selectedState?.role === "measurement" && <button className={s.secondary} onClick={() => setPanel("reason")}>Attach reasoning →</button>}
        </div>}
        {panel === "reason" && <div className={s.panel}><p className={s.kicker}>03 / LINK THE EVIDENCE</p><h3>Explain what you observed</h3><p>Your proposed interpretation stays linked to a specific measurement. ReasonOS checks the evidence structure; it does not diagnose the ECG.</p>
          <label>Supporting measurement<select aria-label="Supporting measurement" value={selectedState?.role === "measurement" ? selectedState.id : ""} onChange={e => { const st = saved.find(v => v.id === e.target.value); if (st) inspect(st); }}><option value="">Select saved evidence</option>{saved.filter(st => st.role === "measurement").map(st => <option key={st.id} value={st.id}>{st.payload.label as string} · {st.payload.lead as string} · {round(Number(st.payload.durationMs))} ms · {st.id}</option>)}</select></label>
          <label>Your observation and reasoning<textarea aria-label="Observation and reasoning" value={draft} maxLength={2000} onChange={e => setDraft(e.target.value)} placeholder="What did you observe? What does the measurement support, and what remains uncertain?" rows={7}/></label>
          <button className={s.primary} disabled={!selectedState || selectedState.role !== "measurement" || draft.trim().length < 3 || loading} onClick={saveClaim}>Save proposed interpretation</button>
          <p className={s.limit}>Admission means the claim has traceable evidence. It does not confirm clinical correctness.</p>
        </div>}
        {panel === "review" && <div className={s.panel}><p className={s.kicker}>04 / REVIEW & EXPORT</p><h3>Evidence journal</h3><p>Select a measurement to restore its exact source view. Revisions preserve the original and flag dependent claims.</p>
          {!saved.length && <div className={s.empty}>No saved evidence yet.<button onClick={() => setPanel("measure")}>Start with a measurement →</button></div>}
          <ol className={s.journal}>{saved.map(st => <li key={st.id} data-selected={selected === st.id}><button className={s.journalItem} onClick={() => inspect(st)}><span>{st.role === "measurement" ? `${st.payload.label} · lead ${st.payload.lead}` : "Proposed interpretation"}</span><strong>{st.role === "measurement" ? `${round(Number(st.payload.durationMs), 2)} ms` : String(st.payload.text)}</strong><small>{st.role === "claim" ? claimNeedsReview(st, states) ? "Needs review · supporting measurement revised" : "User-authored · not clinically validated" : st.payload.revisionOf ? `Revises ${st.payload.revisionOf}` : "User-positioned endpoints"}</small></button>{st.role === "measurement" && <button className={s.revise} onClick={() => inspect(st, true)}>Revise endpoints</button>}</li>)}</ol>
          <div className={s.export}><button disabled={!trace} onClick={() => exportWorksheet("text")}>Export summary</button><button disabled={!trace} onClick={() => exportWorksheet("json")}>Export full trace</button></div><small className={s.limit}>Exports omit the recording. Your written notes are included. Worksheets last for this tab session; export before closing.</small>
        </div>}
        {panel === "source" && <div className={s.panel}><p className={s.kicker}>01 / SOURCE & CALIBRATION</p><h3>{signal ? "Recorded digital signal" : "Original source page"}</h3><p>{signal ? "Voltage is decoded from original samples using the header gain and baseline. Time comes from the sample rate." : "The page remains an image. Calibrate a known paper-grid span before recording a time interval."}</p>
          {!signal && source && <><div className={s.pointButtons}><button aria-pressed={tool === "calibrate"} onClick={() => { setTool("calibrate"); setNextPoint(0); setOverlays(true); }}>Place grid A, then B</button><button onClick={() => { setTool("measure"); setPanel("measure"); }}>Return to interval</button></div>
            <p className={s.limit}>Choose two points along one horizontal grid line. Verify the span and printed speed yourself. This corrects rotation, not perspective distortion.</p>
            <div className={s.fields}><label>Grid span (mm)<input aria-label="Calibration span mm" type="number" min=".1" max="1000" value={mm} onChange={e => { setMm(Number(e.target.value)); setConfirmed(false); }}/></label><label>Paper speed (mm/s)<input aria-label="Paper speed mm per second" type="number" min="1" max="200" value={speed} onChange={e => { setSpeed(Number(e.target.value)); setConfirmed(false); }}/></label><label>Endpoint bound (px)<input aria-label="Pixel endpoint bound" type="number" min="0" max="100" value={errorPx} onChange={e => { setErrorPx(Number(e.target.value)); setConfirmed(false); }}/></label></div>
            <fieldset className={s.endpoints}><legend>Grid endpoints · source pixels</legend>{grid.map((p, i) => <div key={i}><span>{i ? "B" : "A"}</span>{(["x", "y"] as const).map(axis => <label key={axis}><span className={s.srOnly}>Grid {i ? "B" : "A"} {axis}</span><input aria-label={`Grid ${i ? "B" : "A"} ${axis}`} type="number" min="0" max={axis === "x" ? coordWidth : coordHeight} value={round(p[axis], 2)} onChange={e => { setGrid(old => old.map((v, j) => j === i ? { ...v, [axis]: Number(e.target.value) } : v) as PointPair); setConfirmed(false); }}/></label>)}</div>)}</fieldset>
            <label className={s.check}><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/> I checked the grid span and printed paper speed.</label>
          </>}
          {source && <dl className={s.metadata}><dt>Source</dt><dd>{source.local ? "Local import · no upload" : "PTB-XL 1.0.3 · CC BY 4.0"}</dd><dt>SHA-256</dt><dd className={s.digest}>{source.sha}</dd>{source.page && <><dt>PDF page</dt><dd>{source.page} of {pageCount}</dd></>}{signal && <><dt>Sampling</dt><dd>{signal.sampleRate} samples/s · {signal.sampleCount} samples/lead</dd><dt>Voltage</dt><dd>Millivolts · original calibration</dd></>}</dl>}
          <details className={s.formats}><summary>Supported files & limits</summary><p>PDF (up to 100 pages), PNG/JPEG/WebP, CSV, or WFDB .hea + .dat selected together. 25 MB per file.</p><p>WFDB: one multiplexed format-16 file, 1–12 channels, explicit mV/µV calibration and checksums. Other encodings and missing samples are rejected.</p><p>CSV: <code>time_ms,I_mV,II_mV</code> then numeric rows at a uniform interval. Up to 2 million samples across leads.</p><p>DICOM, SCP-ECG and vendor XML are not supported. PDF/image import does not recover raw samples.</p></details>
          <p className={s.limit}><a href="https://physionet.org/content/ptb-xl/1.0.3/" target="_blank" rel="noreferrer">PTB-XL source & attribution ↗</a> · <a href="https://wfdb.io/spec/" target="_blank" rel="noreferrer">WFDB specification ↗</a></p>
        </div>}
        <div className={s.feedback} role="status" aria-live="polite">{message || "Educational prototype · no automated diagnosis"}</div>
      </aside>
    </div>
  </section>;
}
