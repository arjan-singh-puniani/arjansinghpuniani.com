"use client";
import { useRef, useState } from "react";
import {
  METHOD_STEPS,
  evaluateMethodAnswer,
  studyEvidenceReady,
  type EvidencePin,
  type RecordedLead,
  type StudyAttempt,
} from "@/lib/reasonos/study";
import s from "./ECGStudy.module.css";
interface Props {
  pin: EvidencePin;
  attempts: readonly StudyAttempt[];
  measurements: readonly { kind: string; duration: number }[];
  onFocus: (lead: RecordedLead) => void;
  onCalipers: (kind: string) => void;
  onCommit: (attempt: StudyAttempt) => boolean;
  onExport: () => void;
}
export function ECGStudy({
  pin,
  attempts,
  measurements,
  onFocus,
  onCalipers,
  onCommit,
  onExport,
}: Props) {
  const [index, setIndex] = useState(0),
    [answer, setAnswer] = useState(""),
    [note, setNote] = useState(""),
    [confidence, setConfidence] = useState(60),
    [pins, setPins] = useState<EvidencePin[]>([]),
    [review, setReview] = useState<StudyAttempt | null>(null);
  const step = METHOD_STEPS[index];
  const ready = studyEvidenceReady(step, pins);
  const completed = new Set(attempts.map((attempt) => attempt.stepId));
  const drafts = useRef<
    Record<
      string,
      {
        answer: string;
        note: string;
        confidence: number;
        pins: EvidencePin[];
        review: StudyAttempt | null;
      }
    >
  >({});
  function navigate(next: number) {
    drafts.current[step.id] = { answer, note, confidence, pins, review };
    const draft = drafts.current[METHOD_STEPS[next].id];
    setIndex(next);
    setAnswer(draft?.answer ?? "");
    setNote(draft?.note ?? "");
    setConfidence(draft?.confidence ?? 60);
    setPins(draft?.pins ?? []);
    setReview(draft?.review ?? null);
    onFocus(METHOD_STEPS[next].leads[0]);
  }
  function commit() {
    const attempt = {
      stepId: step.id,
      answerId: answer,
      confidence,
      observation: note.trim(),
      pins: structuredClone(pins),
      methodMatch: evaluateMethodAnswer(step.id, answer),
    };
    if (onCommit(attempt)) setReview(attempt);
  }
  return (
    <section
      id="ecg-study"
      className={s.study}
      aria-labelledby="ecg-study-title"
    >
      <div className={s.progress}>
        <span>
          Interpretation method · {completed.size}/{METHOD_STEPS.length}{" "}
          attempted
        </span>
        <button onClick={onExport}>Export worksheet</button>
      </div>
      <nav className={s.steps} aria-label="Interpretation steps">
        {METHOD_STEPS.map((item, i) => (
          <button
            key={item.id}
            aria-current={i === index ? "step" : undefined}
            onClick={() => navigate(i)}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            {item.label}
            {completed.has(item.id) && <b aria-label="attempt recorded">✓</b>}
          </button>
        ))}
      </nav>
      <h3 id="ecg-study-title">{step.title}</h3>
      <p className={s.task}>{step.task}</p>
      <div className={s.focus}>
        {step.leads.map((lead) => (
          <button key={lead} onClick={() => onFocus(lead)}>
            Inspect {lead === "II-rhythm" ? "lead II rhythm" : lead}
          </button>
        ))}
      </div>
      {step.measurements.length > 0 && (
        <div className={s.measurements}>
          {step.measurements.map((kind) => (
            <button key={kind} onClick={() => onCalipers(kind)}>
              {measurements.some((m) => m.kind === kind) ? "✓ " : ""}Measure{" "}
              {kind}
            </button>
          ))}
        </div>
      )}
      <div className={s.pin}>
        <button
          onClick={() =>
            setPins((old) => [
              ...old.filter(
                (p) =>
                  !(p.recordingId === pin.recordingId && p.lead === pin.lead),
              ),
              structuredClone(pin),
            ])
          }
        >
          Pin this source view
        </button>
        <small>
          Recording {pin.recordingId} · {pin.lead} · SHA{" "}
          {pin.sha256.slice(0, 10)}
        </small>
      </div>
      {pins.length > 0 && (
        <ul className={s.pins}>
          {pins.map((p) => (
            <li key={`${p.recordingId}:${p.lead}`}>
              {p.recordingId} · {p.lead}
              <button
                aria-label={`Remove pin ${p.recordingId} ${p.lead}`}
                onClick={() =>
                  setPins((old) => old.filter((item) => item !== p))
                }
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {!ready && (
        <p className={s.hint}>
          {step.id === "compare"
            ? "Pin lead II from both A and B before comparing."
            : `Pin ${step.leads.join(" and ")} to retain the evidence for this step.`}
        </p>
      )}
      <fieldset className={s.question} disabled={Boolean(review)}>
        <legend>{step.question}</legend>
        {step.options.map((option) => (
          <label key={option.id}>
            <input
              type="radio"
              name={`method-${step.id}`}
              value={option.id}
              checked={answer === option.id}
              onChange={() => setAnswer(option.id)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <label className={s.notes}>
        Your observations and reasoning
        <textarea
          aria-label="ECG study observations"
          value={note}
          disabled={Boolean(review)}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Describe what you see, where you see it, and what remains unresolved."
        />
      </label>
      <label className={s.confidence}>
        Confidence before feedback <output>{confidence}%</output>
        <input
          aria-label="Interpretation confidence"
          type="range"
          min="0"
          max="100"
          step="5"
          value={confidence}
          disabled={Boolean(review)}
          onChange={(e) => setConfidence(Number(e.target.value))}
        />
      </label>
      {!review ? (
        <button
          className={s.commit}
          disabled={!answer || !ready || !note.trim()}
          onClick={commit}
        >
          Commit answer and compare
        </button>
      ) : (
        <div className={s.feedback} role="status">
          <strong>
            {review.methodMatch ? "Method check matched" : "Revisit the method"}
          </strong>
          <p>{step.explanation}</p>
          <a
            href={step.source.url}
            target={step.source.url.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
          >
            {step.source.title}
          </a>
          <div>
            <button onClick={() => setReview(null)}>Revise response</button>
            {index < METHOD_STEPS.length - 1 && (
              <button onClick={() => navigate(index + 1)}>Next step</button>
            )}
          </div>
        </div>
      )}
      <p className={s.hint}>
        Method answers can be checked against the cited definitions. Your case
        observations remain a learner interpretation for review.
      </p>
    </section>
  );
}
