import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, X, BookOpen } from "lucide-react";
import {
  chapters,
  questions,
  perturbations,
  transferQuestions,
  inheritance,
  type Chapter,
  type Question,
} from "./content";
import "./study.css";

type Attempt = { selected: number; confidence: string };
function Arrow({
  x1,
  x2,
  y,
  color = "#83e0ce",
}: {
  x1: number;
  x2: number;
  y: number;
  color?: string;
}) {
  const d = x2 > x1 ? 1 : -1;
  return (
    <g stroke={color} fill={color}>
      <line
        x1={x1}
        x2={x2 - d * 9}
        y1={y}
        y2={y}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d={`M ${x2} ${y} l ${-d * 12} -7 v 14 z`} stroke="none" />
    </g>
  );
}
function Fork({ revealed, left }: { revealed: boolean; left: boolean }) {
  return (
    <svg
      viewBox="0 0 540 310"
      role="img"
      aria-label={`Upper template 5 prime left to 3 prime right; lower template 3 prime left to 5 prime right. Fork moves ${left ? "left" : "right"}${revealed ? `; ${left ? "upper" : "lower"} daughter is leading. Daughter synthesis arrows are all 5 prime to 3 prime.` : ". Predict the leading template before revealing daughter synthesis."}`}
    >
      <text x="30" y="30" className="diagram-kicker">
        PARENTAL TEMPLATES
      </text>
      <line x1="70" x2="470" y1="96" y2="96" className="template-line" />
      <line x1="70" x2="470" y1="220" y2="220" className="template-line" />
      <text x="25" y="103">
        5′
      </text>
      <text x="486" y="103">
        3′
      </text>
      <text x="25" y="227">
        3′
      </text>
      <text x="486" y="227">
        5′
      </text>
      <text x="240" y="77" className="diagram-small">
        UPPER
      </text>
      <text x="240" y="249" className="diagram-small">
        LOWER
      </text>
      <Arrow
        x1={left ? 195 : 345}
        x2={left ? 90 : 450}
        y={51}
        color="#d3b1fa"
      />
      <text x={left ? 200 : 90} y="58" className="diagram-small">
        FORK MOTION
      </text>
      {revealed ? (
        <>
          <Arrow
            x1={left ? 420 : 110}
            x2={left ? 110 : 420}
            y={left ? 130 : 186}
          />
          <text
            x="200"
            y={left ? 155 : 176}
            className="diagram-small diagram-mint"
          >
            LEADING · CONTINUOUS
          </text>
          {[95, 235, 375].map((x) => (
            <g key={x}>
              <Arrow
                x1={left ? x : x + 75}
                x2={left ? x + 75 : x}
                y={left ? 186 : 130}
                color="#bca4f9"
              />
              <text
                x={left ? x - 9 : x + 65}
                y={left ? 175 : 151}
                className="diagram-small"
              >
                5′
              </text>
              <text
                x={left ? x + 65 : x - 9}
                y={left ? 175 : 151}
                className="diagram-small"
              >
                3′
              </text>
            </g>
          ))}
          <text x="170" y={left ? 280 : 280} className="diagram-small">
            LAGGING · REPEATED PRIMING
          </text>
          <text
            x={left ? 420 : 95}
            y={left ? 119 : 208}
            className="diagram-small"
          >
            5′
          </text>
          <text
            x={left ? 95 : 410}
            y={left ? 119 : 208}
            className="diagram-small"
          >
            3′ OH
          </text>
        </>
      ) : (
        <text x="135" y="164" className="diagram-prompt">
          Which daughter follows the fork?
        </text>
      )}
    </svg>
  );
}
function Chemistry({
  revealed,
  blocked,
}: {
  revealed: boolean;
  blocked: boolean;
}) {
  return (
    <svg
      viewBox="0 0 540 310"
      role="img"
      aria-label={
        !revealed
          ? "An existing DNA primer ends in 3 prime H. An incoming dNTP has three phosphates. Predict whether the primer can be extended."
          : blocked
          ? "A primer ending in 3 prime H cannot add the next dNTP."
          : "A primer 3 prime OH reacts with an incoming dNTP to form a phosphodiester bond and release pyrophosphate."
      }
    >
      <text x="30" y="35" className="diagram-kicker">
        ONE NUCLEOTIDE ADDITION
      </text>
      {[60, 130, 200].map((x, i) => (
        <g key={x}>
          <rect
            x={x}
            y="115"
            width="46"
            height="48"
            rx="12"
            className="nucleotide"
          />
          <text x={x + 16} y="146">
            {["A", "C", "G"][i]}
          </text>
          {i < 2 && (
            <line
              x1={x + 46}
              x2={x + 70}
              y1="139"
              y2="139"
              className="template-line"
            />
          )}
        </g>
      ))}
      <text x="54" y="192" className="diagram-small">
        5′ · EXISTING PRIMER
      </text>
      <text
        x="250"
        y="146"
        className={blocked ? "diagram-pink" : "diagram-mint"}
      >
        3′ {blocked ? "H" : "OH"}
      </text>
      <rect
        x="405"
        y="115"
        width="46"
        height="48"
        rx="12"
        className="nucleotide incoming"
      />
      <text x="419" y="146">
        T
      </text>
      <text x="385" y="92" className="diagram-small">
        INCOMING dNTP
      </text>
      {[458, 479, 500].map((x) => (
        <circle key={x} cx={x} cy="139" r="8" className="phosphate" />
      ))}
      {revealed && (
        <>
          <text
            x="70"
            y="253"
            className={blocked ? "diagram-pink" : "diagram-mint"}
          >
            {blocked
              ? "No reactive OH → no extension"
              : "New backbone bond + PPi released"}
          </text>
          {!blocked && <Arrow x1={330} x2={390} y={139} />}
        </>
      )}
    </svg>
  );
}
function Perturbation({ id, revealed }: { id: string; revealed: boolean }) {
  return (
    <svg
      viewBox="0 0 540 310"
      role="img"
      aria-label={
        revealed
          ? perturbations.find((p) => p.id === id)!.effect
          : "Predict the molecular consequence before revealing this schematic."
      }
    >
      <text x="30" y="35" className="diagram-kicker">
        ISOLATE ONE FUNCTION
      </text>
      <line x1="45" x2="495" y1="110" y2="110" className="template-line" />
      <text x="45" y="92" className="diagram-small">
        TEMPLATE
      </text>
      {!revealed || id === "ligase" || id === "primase" ? (
        [60, 205, 350].map((x, i) => (
          <g key={x}>
            <line
              x1={x}
              x2={x + 120}
              y1="162"
              y2="162"
              className={
                revealed && id === "primase" && i > 0
                  ? "missing-line"
                  : "daughter-line"
              }
            />
            <text x={x + 30} y="196" className="diagram-small">
              {revealed && id === "primase" && i > 0
                ? "NO PRIMER"
                : `FRAGMENT ${i + 1}`}
            </text>
            {revealed && id === "ligase" && i < 2 && (
              <text x={x + 115} y="146" className="diagram-pink">
                nick
              </text>
            )}
          </g>
        ))
      ) : id === "helicase" ? (
        <>
          <path
            d="M 50 180 L 295 110 L 480 110 M 50 45 L 295 110"
            fill="none"
            stroke="#83e0ce"
            strokeWidth="5"
          />
          <circle cx="295" cy="110" r="25" className="blocked-enzyme" />
          <text x="281" y="120">
            ×
          </text>
          <text x="315" y="178" className="diagram-small">
            FORK STOPS OPENING
          </text>
        </>
      ) : id === "topoisomerase" ? (
        <>
          <path
            d="M 60 162 Q 85 95 110 162 T 160 162 T 210 162 T 260 162 T 310 162 T 360 162 T 410 162 T 460 162"
            fill="none"
            stroke="#d3b1fa"
            strokeWidth="4"
          />
          <text x="145" y="216" className="diagram-small">
            CONSTRAINED DNA AHEAD OF FORK
          </text>
        </>
      ) : (
        <>
          <line x1="50" x2="480" y1="162" y2="162" className="daughter-line" />
          <circle cx="260" cy="162" r="18" className="blocked-enzyme" />
          <text x="253" y="169">
            T
          </text>
          <text x="180" y="207" className="diagram-small">
            INCORRECT BASE RETAINED
          </text>
        </>
      )}
      <text
        x="30"
        y="276"
        className={revealed ? "diagram-mint" : "diagram-small"}
      >
        {revealed
          ? perturbations.find((p) => p.id === id)!.effect
          : "Predict first. Then inspect the consequence."}
      </text>
    </svg>
  );
}
function Density({ round, revealed }: { round: number; revealed: boolean }) {
  const result = inheritance(round);
  const bands = [
    {
      y: 83,
      count: result.light,
      label: "LIGHT · ¹⁴N / ¹⁴N",
      color: "#83e0ce",
    },
    {
      y: 147,
      count: result.hybrid,
      label: "HYBRID · ¹⁵N / ¹⁴N",
      color: "#d3b1fa",
    },
    {
      y: 211,
      count: result.heavy,
      label: "HEAVY · ¹⁵N / ¹⁵N",
      color: "#eabd73",
    },
  ];
  return (
    <svg
      viewBox="0 0 540 310"
      role="img"
      aria-label={
        revealed
          ? `Round ${round}: ${result.heavy} heavy, ${result.hybrid} hybrid and ${result.light} light duplexes out of ${result.duplexes}. Bands represent intact duplexes.`
          : "A density-gradient tube. Predict the bands for the second replication round."
      }
    >
      <text x="30" y="30" className="diagram-kicker">
        INTACT DUPLEX DENSITY
      </text>
      <path
        d="M 55 55 V 232 Q 55 265 100 265 Q 145 265 145 232 V 55"
        className="density-tube"
      />
      {bands.map((b) => (
        <g key={b.y}>
          {revealed && b.count > 0 && (
            <rect
              x="57"
              y={b.y - 7}
              width="86"
              height="14"
              rx="3"
              fill={b.color}
              opacity={0.45 + (0.55 * b.count) / result.duplexes}
            />
          )}
          <text x="176" y={b.y + 5} className="diagram-small">
            {b.label}
          </text>
          {revealed && (
            <text x="408" y={b.y + 5} fill={b.color}>
              {Math.round((b.count / result.duplexes) * 100)}%
            </text>
          )}
        </g>
      ))}
      <text x="38" y="292" className="diagram-small">
        DENSITY INCREASES ↓
      </text>
      {revealed &&
        Array.from({ length: result.duplexes }, (_, i) => (
          <g key={i}>
            <line
              x1={220 + (i % 4) * 65}
              x2={265 + (i % 4) * 65}
              y1={246 + Math.floor(i / 4) * 28}
              y2={246 + Math.floor(i / 4) * 28}
              stroke={round === 0 || i < 2 ? "#eabd73" : "#83e0ce"}
              strokeWidth="5"
            />
            <line
              x1={220 + (i % 4) * 65}
              x2={265 + (i % 4) * 65}
              y1={256 + Math.floor(i / 4) * 28}
              y2={256 + Math.floor(i / 4) * 28}
              stroke={round === 0 ? "#eabd73" : "#83e0ce"}
              strokeWidth="5"
            />
          </g>
        ))}
    </svg>
  );
}
function Ends({ step }: { step: number }) {
  return (
    <svg
      viewBox="0 0 540 310"
      role="img"
      aria-label={
        [
          "A terminal RNA primer occupies the daughter 5 prime end.",
          "Primer removal leaves a missing terminal segment with no distal 3 prime OH for fill-in.",
          "Telomerase extends the template 3 prime end using its RNA template.",
          "Priming, complementary DNA fill-in and primer processing leave a normal 3 prime overhang.",
        ][step]
      }
    >
      <text x="30" y="30" className="diagram-kicker">
        A LINEAR CHROMOSOME END
      </text>
      <line
        x1="65"
        x2={step >= 2 ? 480 : 380}
        y1="103"
        y2="103"
        className="template-line"
      />
      <text x="25" y="110">
        5′
      </text>
      <text x={step >= 2 ? 495 : 395} y="110">
        3′
      </text>
      {step >= 2 && (
        <line
          x1="380"
          x2="480"
          y1="103"
          y2="103"
          stroke="#eabd73"
          strokeWidth="6"
        />
      )}
      <line
        x1="65"
        x2={step === 3 ? 430 : 280}
        y1="170"
        y2="170"
        className="daughter-line"
      />
      <text x="25" y="177">
        3′
      </text>
      <text x={step === 0 ? 395 : step === 3 ? 445 : 295} y="177">
        5′
      </text>
      {step === 0 && (
        <>
          <line
            x1="280"
            x2="380"
            y1="170"
            y2="170"
            stroke="#efa4bc"
            strokeWidth="6"
          />
          <text x="290" y="211" className="diagram-small diagram-pink">
            RNA PRIMER
          </text>
        </>
      )}
      {step === 1 && (
        <>
          <line x1="320" x2="380" y1="170" y2="170" className="missing-line" />
          <text x="225" y="224" className="diagram-small">
            NO DISTAL 3′ OH FOR FILL-IN
          </text>
        </>
      )}
      {step === 2 && (
        <>
          <rect
            x="280"
            y="214"
            width="230"
            height="42"
            rx="21"
            className="telomerase-pill"
          />
          <text x="298" y="240" className="diagram-small">
            TELOMERASE + RNA TEMPLATE
          </text>
          <Arrow x1={395} x2={475} y={70} color="#eabd73" />
        </>
      )}
      {step === 3 && (
        <>
          <text x="142" y="222" className="diagram-small">
            COMPLEMENTARY DNA FILLED IN
          </text>
          <text x="343" y="75" className="diagram-small">
            3′ OVERHANG
          </text>
        </>
      )}
      <text x="30" y="286" className="diagram-small">
        SCHEMATIC · NOT TO SCALE
      </text>
    </svg>
  );
}

function Prediction({
  question,
  attempt,
  onAnswer,
}: {
  question: Question;
  attempt?: Attempt;
  onAnswer: (attempt: Attempt) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [confidence, setConfidence] = useState("Unsure");
  return (
    <section className="study-prediction" aria-label="Prediction question">
      <span className="study-eyebrow">
        {attempt ? "COMPARE YOUR REASONING" : "PREDICT BEFORE THE REVEAL"}
      </span>
      <h3>{question.prompt}</h3>
      <div className="study-options">
        {question.options.map((option, i) => (
          <button
            key={option}
            disabled={!!attempt}
            aria-pressed={selected === i || attempt?.selected === i}
            onClick={() => setSelected(i)}
            className={`${selected === i && !attempt ? "chosen" : ""} ${attempt && i === question.correct ? "correct" : ""} ${attempt?.selected === i && i !== question.correct ? "incorrect" : ""}`}
          >
            <span>{String.fromCharCode(65 + i)}</span>
            {option}
            {attempt && i === question.correct && (
              <Check size={17} aria-label="Correct answer" />
            )}
          </button>
        ))}
      </div>
      {!attempt ? (
        <div className="study-submit">
          <label>
            Confidence
            <select
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
            >
              <option>Unsure</option>
              <option>Fairly sure</option>
              <option>Very sure</option>
            </select>
          </label>
          <button
            className="study-primary"
            disabled={selected === null}
            onClick={() =>
              selected !== null && onAnswer({ selected, confidence })
            }
          >
            Reveal the mechanism <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="study-feedback" role="status">
          <span className="study-eyebrow">
            YOUR CONFIDENCE: {attempt.confidence}
          </span>
          <strong>
            {attempt.selected === question.correct
              ? "Prediction supported."
              : "Revise the mechanism."}
          </strong>
          <p>{question.reasons[attempt.selected]}</p>
          {attempt.selected !== question.correct && (
            <p>
              <b>Why {String.fromCharCode(65 + question.correct)} works:</b>{" "}
              {question.reasons[question.correct]}
            </p>
          )}
          <details>
            <summary>Examine every alternative</summary>
            {question.options.map((option, i) => (
              <p key={option}>
                <b>{String.fromCharCode(65 + i)}.</b> {question.reasons[i]}
              </p>
            ))}
          </details>
          <div className="study-takeaway">{question.takeaway}</div>
        </div>
      )}
    </section>
  );
}

export default function StudyStudio({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const [chapter, setChapter] = useState<Chapter>("polarity");
  const [attempts, setAttempts] = useState<Record<string, Attempt>>({});
  const [left, setLeft] = useState(false);
  const [blocked, setBlocked] = useState(true);
  const [enzyme, setEnzyme] = useState(0);
  const [round, setRound] = useState(2);
  const [endStep, setEndStep] = useState(1);
  const [transfer, setTransfer] = useState(0);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => {
      dialog.current?.close();
      previous?.focus();
    };
  }, []);
  const active = chapters.find((c) => c.id === chapter)!;
  const question =
    chapter === "perturbation"
      ? perturbations[enzyme]
      : chapter === "transfer"
        ? transferQuestions[transfer]
        : questions[chapter];
  const attempt = attempts[question.id];
  const answered = !!attempt;
  const checkpoint = transferQuestions.map((q) => attempts[q.id]);
  const completed = checkpoint.every(Boolean);
  const chooseChapter = (id: Chapter) => {
    setChapter(id);
    scroll.current?.scrollTo({ top: 0 });
  };
  return (
    <dialog
      ref={dialog}
      className="study-dialog"
      aria-labelledby="study-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="study-header">
        <div>
          <span className="study-eyebrow">
            <BookOpen size={13} /> MCAT REASONING STUDIO
          </span>
          <h2 id="study-title">See it. Predict it. Explain it.</h2>
        </div>
        <button
          className="study-close"
          aria-label="Close reasoning studio"
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </div>
      <div className="study-layout">
        <nav className="study-nav" aria-label="Reasoning chapters">
          {chapters.map((c) => (
            <button
              key={c.id}
              aria-current={chapter === c.id ? "step" : undefined}
              onClick={() => chooseChapter(c.id)}
            >
              <span>{c.number}</span>
              <div>
                <strong>{c.title}</strong>
                <small>{c.subtitle}</small>
              </div>
              <ArrowRight size={15} />
            </button>
          ))}
          <p>
            Original practice, not official AAMC questions. Schematic diagrams
            complement the human molecular scene.
          </p>
        </nav>
        <div
          className="study-scroll"
          ref={scroll}
          tabIndex={0}
          role="region"
          aria-label="Visual lab content"
        >
          <div className="study-chapter-title">
            <span className="study-eyebrow">
              VISUAL LAB {active.number} / 06
            </span>
            <h3>{active.title}</h3>
            <p>{active.subtitle}</p>
          </div>
          <div className="study-workspace">
            <section
              className="study-visual"
              aria-label="Interactive mechanism diagram"
            >
              {chapter === "polarity" && (
                <>
                  <div className="origin-map">
                    <span>← LEFT FORK</span>
                    <i />
                    <b>ORIGIN</b>
                    <i />
                    <span>RIGHT FORK →</span>
                  </div>
                  <Fork revealed={answered} left={left} />
                  <div className="study-controls">
                    <button
                      disabled={!answered}
                      aria-pressed={left}
                      onClick={() => setLeft(true)}
                    >
                      Left fork
                    </button>
                    <button
                      disabled={!answered}
                      aria-pressed={!left}
                      onClick={() => setLeft(false)}
                    >
                      Right fork
                    </button>
                  </div>
                  <p>
                    {answered
                      ? "Switch forks: the same upper template becomes leading at the left fork. Both daughters still grow 5′ → 3′. Eukaryotic chromosomes use multiple origins; each typical origin produces two outward-moving forks."
                      : "Trace the labeled ends and the fork arrow. Make a prediction to reveal daughter synthesis and compare the other fork."}
                  </p>
                </>
              )}
              {chapter === "chemistry" && (
                <>
                  <Chemistry revealed={answered} blocked={blocked} />
                  <div className="study-controls">
                    <button
                      disabled={!answered}
                      aria-pressed={blocked}
                      onClick={() => setBlocked(true)}
                    >
                      3′ H · blocked
                    </button>
                    <button
                      disabled={!answered}
                      aria-pressed={!blocked}
                      onClick={() => setBlocked(false)}
                    >
                      3′ OH · reactive
                    </button>
                  </div>
                  <p>
                    {answered
                      ? "The incoming dNTP supplies the nucleotide and its triphosphate energy; PPi is released and its hydrolysis favors incorporation. The scene’s ATP counter models separate motor, clamp-loading and ligation events; it is not one ATP per added base."
                      : "The template is correctly paired. Focus on the primer’s terminal chemical group, rather than on enzyme abundance."}
                  </p>
                </>
              )}
              {chapter === "perturbation" && (
                <>
                  <div className="study-controls enzyme-controls">
                    {perturbations.map((p, i) => (
                      <button
                        key={p.id}
                        aria-pressed={enzyme === i}
                        onClick={() => setEnzyme(i)}
                      >
                        {p.enzyme}
                      </button>
                    ))}
                  </div>
                  <Perturbation id={question.id} revealed={answered} />
                  <p>
                    {answered
                      ? "These are immediate, qualitative predictions for the stated assay. In a cell, secondary damage and coupled fork machinery can produce additional effects."
                      : "Change one activity while holding the others intact. Predict the direct consequence before considering later cellular damage."}
                  </p>
                  <details className="organism-note">
                    <summary>Human vs. bacterial machinery</summary>
                    <p>
                      This scene depicts a human replisome: Pol α–primase starts
                      synthesis; Pol ε and Pol δ perform the major leading and
                      lagging roles, respectively. Primer maturation here uses
                      Pol δ and FEN1. In E. coli, Pol III is the principal
                      replicative polymerase; Pol I removes RNA primers and
                      replaces them with DNA. Ligase seals the remaining nick in
                      both contexts.
                    </p>
                  </details>
                </>
              )}
              {chapter === "inheritance" && (
                <>
                  {answered && (
                    <p className="study-eyebrow">
                      YOUR PREDICTION: ROUND 2 · EXPLORE OTHER ROUNDS BELOW
                    </p>
                  )}
                  <Density round={round} revealed={answered} />
                  <label className="round-control">
                    Replication round <strong>{round}</strong>
                    <input
                      type="range"
                      aria-label="Replication round"
                      min="0"
                      max="3"
                      value={round}
                      disabled={!answered}
                      onChange={(e) => setRound(Number(e.target.value))}
                    />
                  </label>
                  <p>
                    {answered
                      ? `Round ${round}: ${inheritance(round).duplexes} duplex${round === 0 ? "" : "es"}. Gold marks an original heavy strand; mint marks a new light strand. ${round > 0 ? `Hybrid duplexes: ${Math.round((inheritance(round).hybrid / inheritance(round).duplexes) * 100)}%. Heavy strands: ${inheritance(round).heavyStrandFraction * 100}%.` : "Both strands are heavy before the shift."}`
                      : "Assume synchronous replication, equal-length DNA, intact duplex analysis, and no isotope recycling. Band position reports duplex density; band fraction reports abundance."}
                  </p>
                  {answered && (
                    <details>
                      <summary>Distinguish the alternative models</summary>
                      <p>
                        Conservative copying predicts separate heavy and light
                        duplex bands after one round. Semiconservative and
                        dispersive copying both predict one intermediate band
                        after one round. In round two, a light band plus a
                        hybrid band distinguishes semiconservative copying from
                        ideal dispersive copying, which predicts one band
                        shifting toward light.
                      </p>
                    </details>
                  )}
                </>
              )}
              {chapter === "ends" && (
                <>
                  <Ends step={endStep} />
                  <div className="study-controls end-controls">
                    {[
                      "Primer present",
                      "Primer removed",
                      "Extend template",
                      "Fill in DNA",
                    ].map((label, i) => (
                      <button
                        key={label}
                        disabled={!answered}
                        aria-pressed={endStep === i}
                        onClick={() => setEndStep(i)}
                      >
                        {i + 1}. {label}
                      </button>
                    ))}
                  </div>
                  <p>
                    {answered
                      ? "Follow the same end through primer removal, template extension, and fill-in. Telomerase makes DNA from an RNA template; it does not reverse the direction of synthesis."
                      : "The removed terminal primer leaves no DNA beyond the chromosome end to supply a 3′ OH. A missing segment cannot be repaired by simply sealing a nick."}
                    <br />
                    {answered &&
                      "This is a simplified lagging-end model. Real telomere maturation also includes leading-end processing; telomerase does not eliminate the normal 3′ overhang."}
                  </p>
                </>
              )}
              {chapter === "transfer" && (
                <div className="checkpoint-visual">
                  <span className="study-eyebrow">TRANSFER CHECKPOINT</span>
                  <span className="checkpoint-number">
                    {transfer + 1}
                    <small> / 3</small>
                  </span>
                  <h4>
                    {
                      [
                        "Change the orientation.",
                        "Change the denominator.",
                        "Test what a rescue proves.",
                      ][transfer]
                    }
                  </h4>
                  <p>
                    Use the mechanism in a new setting. Commit to an answer and
                    record your confidence before the explanation.
                  </p>
                  <div className="study-controls">
                    {transferQuestions.map((q, i) => (
                      <button
                        key={q.id}
                        aria-label={`Checkpoint question ${i + 1}`}
                        aria-pressed={i === transfer}
                        onClick={() => setTransfer(i)}
                      >
                        {attempts[q.id] ? <Check size={14} /> : i + 1}
                      </button>
                    ))}
                  </div>
                  {completed && (
                    <div className="checkpoint-result">
                      <strong>
                        {
                          checkpoint.filter(
                            (a, i) =>
                              a.selected === transferQuestions[i].correct,
                          ).length
                        }
                        /3 correct on the first attempt
                      </strong>
                      <p>
                        {checkpoint.some(
                          (a, i) =>
                            a.selected !== transferQuestions[i].correct &&
                            a.confidence === "Very sure",
                        )
                          ? "A high-confidence error is a useful signal: revisit that mechanism before doing a fresh problem."
                          : "Explain each answer without the diagram, then try fresh timed passage questions."}{" "}
                        This short checkpoint is practice feedback, not a
                        validated measure of MCAT readiness.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
            <Prediction
              key={question.id}
              question={question}
              attempt={attempt}
              onAnswer={(a) =>
                setAttempts((previous) => ({ ...previous, [question.id]: a }))
              }
            />
          </div>
          <div className="study-bottom">
            <button
              disabled={chapter === "polarity"}
              onClick={() =>
                chooseChapter(
                  chapters[
                    Math.max(0, chapters.findIndex((c) => c.id === chapter) - 1)
                  ].id,
                )
              }
            >
              <ArrowLeft size={15} /> Previous lab
            </button>
            <button
              disabled={chapter === "transfer"}
              onClick={() =>
                chooseChapter(
                  chapters[
                    Math.min(5, chapters.findIndex((c) => c.id === chapter) + 1)
                  ].id,
                )
              }
            >
              Next lab <ArrowRight size={15} />
            </button>
          </div>
          <details className="study-sources">
            <summary>Scope and scientific sources</summary>
            <p>
              This studio focuses on DNA replication reasoning. It does not
              cover every nucleic-acid or DNA-repair topic, or replace timed
              passage practice. Attempts stay in this session and reset when the
              studio closes.
            </p>
            <a
              href="https://students-residents.aamc.org/media/9261/download?attachment="
              target="_blank"
              rel="noreferrer"
            >
              AAMC content outline · replication and repair ↗
            </a>
            <a
              href="https://www.ncbi.nlm.nih.gov/books/NBK26850/"
              target="_blank"
              rel="noreferrer"
            >
              Alberts et al. · DNA replication mechanisms ↗
            </a>
            <a
              href="https://www.ncbi.nlm.nih.gov/books/NBK9940/"
              target="_blank"
              rel="noreferrer"
            >
              Cooper · DNA replication and enzyme functions ↗
            </a>
            <a
              href="https://www.ncbi.nlm.nih.gov/books/NBK21113/"
              target="_blank"
              rel="noreferrer"
            >
              Brown · genome replication and density experiments ↗
            </a>
            <a
              href="https://www.ncbi.nlm.nih.gov/books/NBK26826/"
              target="_blank"
              rel="noreferrer"
            >
              Alberts et al. · origins and chromosome ends ↗
            </a>
          </details>
        </div>
      </div>
    </dialog>
  );
}
