export type Base = "A" | "T" | "C" | "G";
export const complement: Record<Base, Base> = {
  A: "T",
  T: "A",
  C: "G",
  G: "C",
};
export const STAGES = [
  "TEMPLATE_EXPOSED",
  "PRIMER_INITIATION",
  "RNA_PRIMER_SYNTHESIS",
  "POL_ALPHA_DNA_EXTENSION",
  "RFC_PCNA_LOADING",
  "POL_DELTA_ELONGATION",
  "FRAGMENT_COMPLETED",
  "PRIMER_PROCESSING",
  "NICK_READY",
  "LIGATION",
  "MATURE_FRAGMENT",
] as const;
export type Stage = (typeof STAGES)[number];
export type Mode = "watch" | "explore" | "play";
export interface Fragment {
  id: number;
  start: number;
  end: number;
  tip: number;
  stage: Stage;
  age: number;
  rna: number;
  dna: number;
  pcna: boolean;
  polymerase: "alpha" | "delta" | null;
  primerRemoved: boolean;
  nick: boolean;
  sequence: Base[];
  mismatch: boolean;
}
export interface ReactionEvent {
  tick: number;
  fragment: number;
  kind: Stage | "MISMATCH" | "PROOFREAD";
}
export type Action =
  | "prime"
  | "clamp"
  | "delta"
  | "epsilon"
  | "alpha"
  | "process"
  | "ligate"
  | "proofread"
  | Base;
export const STEP = 0.05;
export const FRAGMENT_SIZE = 150;
const duration = [1.1, 0.7, 1.2, 1.1, 1.2, 5.8, 0.7, 1.7, 0.8, 1.1, Infinity];
export const stageTitle: Record<Stage, string> = {
  TEMPLATE_EXPOSED: "Template exposed",
  PRIMER_INITIATION: "Primase binds",
  RNA_PRIMER_SYNTHESIS: "RNA primer synthesis",
  POL_ALPHA_DNA_EXTENSION: "Pol α extends the primer",
  RFC_PCNA_LOADING: "RFC loads the PCNA clamp",
  POL_DELTA_ELONGATION: "Pol δ extends the fragment",
  FRAGMENT_COMPLETED: "Fragment extension complete",
  PRIMER_PROCESSING: "FEN1 processes the flap",
  NICK_READY: "A clean nick remains",
  LIGATION: "Ligase I seals the nick",
  MATURE_FRAGMENT: "A continuous daughter strand",
};
export function validPrimer(position: number, fork: number) {
  return (
    Number.isInteger(position) &&
    position <= fork &&
    position > fork - 30 &&
    position >= FRAGMENT_SIZE
  );
}
export function strandPosition(
  start: number,
  count: number,
  strand: "leading" | "lagging",
) {
  return start + (strand === "leading" ? count : -count);
}
export class ReplicationEngine {
  readonly seed: number;
  tick = 0;
  fork = 150;
  leading = 146;
  paused = false;
  mode: Mode = "watch";
  fragments: Fragment[] = [];
  events: ReactionEvent[] = [];
  motorATP = 0;
  reactionATP = 0;
  dntpUsed = 146;
  score = 0;
  mistakes = 0;
  paired = 0;
  message = "";
  held = new Set<string>();
  private budget = 0;
  private forkProgress = 150;
  private leadingProgress = 146;
  private nextStart = 150;
  constructor(seed = 7) {
    this.seed = seed;
    this.spawn(150);
    this.nextStart = 300;
  }
  template(position: number): Base {
    let n = Math.imul(position + 1 + this.seed, 1664525) + 1013904223;
    n ^= n >>> 13;
    return (["A", "C", "G", "T"] as Base[])[(n >>> 0) % 4];
  }
  get time() {
    return this.tick * STEP;
  }
  get atp() {
    return this.motorATP + this.reactionATP;
  }
  get replicated() {
    return this.fragments
      .filter((f) => f.stage === "MATURE_FRAGMENT")
      .reduce(
        (n, f) => n + Math.max(0, Math.min(f.start, this.leading) - f.end),
        0,
      );
  }
  get active() {
    return this.mode === "play"
      ? this.fragments[0]
      : (this.fragments.find((f) => f.stage !== "MATURE_FRAGMENT") ??
          this.fragments.at(-1)!);
  }
  get percent() {
    return Math.round(
      Math.min(
        100,
        ((this.active.rna + this.active.dna) / FRAGMENT_SIZE) * 100,
      ),
    );
  }
  get finished() {
    return this.mode === "play" && this.active.stage === "MATURE_FRAGMENT";
  }
  spawn(start: number) {
    const f: Fragment = {
      id: this.fragments.length + 1,
      start,
      end: start - FRAGMENT_SIZE,
      tip: start,
      stage: "TEMPLATE_EXPOSED",
      age: 0,
      rna: 0,
      dna: 0,
      pcna: false,
      polymerase: null,
      primerRemoved: false,
      nick: true,
      sequence: [],
      mismatch: false,
    };
    this.fragments.push(f);
    return f;
  }
  advance(seconds: number) {
    if (this.paused) return;
    this.budget += seconds;
    while (this.budget + 1e-9 >= STEP) {
      this.budget -= STEP;
      this.fixedStep();
    }
  }
  fixedStep() {
    this.tick++;
    const old = this.fork;
    if (!this.held.has("cmg")) this.forkProgress += 14 * STEP;
    this.fork = Math.floor(this.forkProgress + 1e-8);
    this.motorATP += Math.floor(this.fork / 10) - Math.floor(old / 10);
    if (!this.held.has("epsilon"))
      this.leadingProgress = Math.min(
        this.forkProgress - 4,
        this.leadingProgress + 14 * STEP,
      );
    const lead = Math.floor(this.leadingProgress + 1e-8);
    this.dntpUsed += lead - this.leading;
    this.leading = lead;
    if (this.mode !== "play" && this.fork >= this.nextStart) {
      this.spawn(this.nextStart);
      this.nextStart += FRAGMENT_SIZE;
    }
    for (const f of this.fragments) {
      if (f.stage === "MATURE_FRAGMENT") continue;
      if (this.blocker(f)) continue;
      f.age += STEP;
      const index = STAGES.indexOf(f.stage);
      if (f.stage === "RNA_PRIMER_SYNTHESIS")
        f.rna = Math.min(10, Math.floor((f.age / duration[index]) * 10));
      if (f.stage === "POL_ALPHA_DNA_EXTENSION") {
        f.polymerase = "alpha";
        this.extend(
          f,
          Math.min(20, Math.floor((f.age / duration[index]) * 20)),
        );
      }
      if (
        f.stage === "POL_DELTA_ELONGATION" &&
        !f.mismatch &&
        (this.mode !== "play" || this.paired === 4)
      ) {
        this.extend(
          f,
          Math.min(140, 20 + Math.floor((f.age / duration[index]) * 120)),
        );
      }
      const gated =
        this.mode === "play" &&
        ([
          "TEMPLATE_EXPOSED",
          "RFC_PCNA_LOADING",
          "FRAGMENT_COMPLETED",
          "NICK_READY",
        ].includes(f.stage) ||
          (f.stage === "POL_DELTA_ELONGATION" &&
            (this.paired < 4 || f.mismatch || f.polymerase !== "delta")));
      if (!gated && f.age + 1e-8 >= duration[index]) {
        if (f.stage === "RFC_PCNA_LOADING") this.loadClamp(f);
        else this.transition(f, STAGES[index + 1]);
      }
    }
  }
  setHeld(id: string, held: boolean) {
    if (held) this.held.add(id);
    else this.held.delete(id);
  }
  blocker(f: Fragment): string | undefined {
    const required: Partial<Record<Stage, string[]>> = {
      TEMPLATE_EXPOSED: ["alpha"],
      PRIMER_INITIATION: ["alpha"],
      RNA_PRIMER_SYNTHESIS: ["alpha"],
      POL_ALPHA_DNA_EXTENSION: ["alpha"],
      RFC_PCNA_LOADING: ["rfc", "pcna"],
      POL_DELTA_ELONGATION: ["delta", "pcna"],
      FRAGMENT_COMPLETED: ["delta"],
      PRIMER_PROCESSING: ["delta", "fen1"],
      NICK_READY: ["ligase"],
      LIGATION: ["ligase"],
    };
    if (this.held.has("rpa") && f.stage !== "MATURE_FRAGMENT") return "rpa";
    return required[f.stage]?.find((id) => this.held.has(id));
  }
  extend(f: Fragment, target: number) {
    while (f.dna < target) {
      const position = f.start - f.rna - f.dna - 1;
      f.sequence.push(complement[this.template(position)]);
      f.dna++;
      this.dntpUsed++;
    }
    f.tip = strandPosition(f.start, f.rna + f.dna, "lagging");
  }
  transition(f: Fragment, next: Stage) {
    const current = STAGES.indexOf(f.stage);
    if (STAGES[current + 1] !== next) throw new Error("Nonsequential reaction");
    if (next === "POL_DELTA_ELONGATION" && !f.pcna)
      throw new Error("PCNA must be loaded");
    if (next === "LIGATION" && (!f.primerRemoved || !f.nick))
      throw new Error("A processed nick is required");
    if (next === "POL_ALPHA_DNA_EXTENSION") f.rna = 10;
    if (next === "RFC_PCNA_LOADING") this.extend(f, 20);
    if (next === "FRAGMENT_COMPLETED") this.extend(f, 140);
    if (next === "POL_DELTA_ELONGATION")
      f.polymerase = this.mode === "play" ? null : "delta";
    if (next === "NICK_READY") {
      f.primerRemoved = true;
      f.dna += f.rna;
      this.dntpUsed += f.rna;
      f.rna = 0;
      f.sequence = Array.from(
        { length: 150 },
        (_, i) => complement[this.template(f.start - i - 1)],
      );
    }
    if (next === "MATURE_FRAGMENT") {
      f.nick = false;
      f.polymerase = null;
    }
    if (next === "LIGATION") this.reactionATP++;
    f.stage = next;
    f.age = 0;
    this.events.push({ tick: this.tick, fragment: f.id, kind: next });
  }
  loadClamp(f: Fragment) {
    if (f.stage !== "RFC_PCNA_LOADING" || f.dna !== 20 || f.rna !== 10)
      throw new Error("Primer-template junction required");
    if (!f.pcna) {
      f.pcna = true;
      this.reactionATP += 2;
    }
    this.transition(f, "POL_DELTA_ELONGATION");
  }
  autoClamp() {
    for (const f of this.fragments)
      if (f.stage === "RFC_PCNA_LOADING" && f.age >= duration[4])
        this.loadClamp(f);
  }
  act(action: Action, position = this.active.start): boolean {
    const f = this.active;
    const reject = (message: string) => {
      this.message = message;
      this.mistakes++;
      this.score = Math.max(0, this.score - 10);
      return false;
    };
    if (action === "ligate" && f.stage !== "NICK_READY")
      return reject(
        "Ligase needs a clean nick. Extend the fragment and remove its primer first.",
      );
    if (action === "prime") {
      if (f.stage !== "TEMPLATE_EXPOSED" || !validPrimer(position, this.fork))
        return reject(
          "Place the primer on newly exposed lagging template, within 30 nt behind the fork.",
        );
      f.start = position;
      f.end = position - 150;
      f.tip = position;
      this.transition(f, "PRIMER_INITIATION");
    } else if (action === "clamp") {
      if (f.stage !== "RFC_PCNA_LOADING")
        return reject(
          "RFC loads PCNA only after Pol α creates an RNA–DNA primer junction.",
        );
      this.loadClamp(f);
    } else if (["delta", "epsilon", "alpha"].includes(action)) {
      if (f.stage !== "POL_DELTA_ELONGATION" || f.polymerase)
        return reject(
          "Wait until PCNA is loaded at the primer-template junction.",
        );
      if (action !== "delta")
        return reject(
          "Pol δ performs processive lagging-strand extension. Pol ε predominantly copies the leading strand; Pol α makes the starter.",
        );
      f.polymerase = "delta";
      f.age = 0;
    } else if (action === "proofread") {
      if (!f.mismatch) return reject("There is no mismatch to proofread.");
      f.mismatch = false;
      this.events.push({ tick: this.tick, fragment: f.id, kind: "PROOFREAD" });
      this.message =
        "Pol δ proofreading removes the incorrect base. Try the complementary dNTP again.";
      return true;
    } else if (["A", "T", "C", "G"].includes(action)) {
      if (
        f.stage !== "POL_DELTA_ELONGATION" ||
        f.polymerase !== "delta" ||
        this.paired >= 4
      )
        return reject("Engage Pol δ before choosing incoming dNTPs.");
      if (f.mismatch)
        return reject("Proofread the mismatch before continuing.");
      const expected = complement[this.template(f.start - 31 - this.paired)];
      if (action !== expected) {
        f.mismatch = true;
        this.events.push({ tick: this.tick, fragment: f.id, kind: "MISMATCH" });
        return reject(
          "That base does not pair with the template. Use Pol δ proofreading to recover.",
        );
      }
      this.paired++;
      if (this.paired === 4) f.age = 0;
    } else if (action === "process") {
      if (f.stage !== "FRAGMENT_COMPLETED")
        return reject(
          "Pol δ must reach the preceding fragment before flap processing.",
        );
      this.transition(f, "PRIMER_PROCESSING");
    } else if (action === "ligate") this.transition(f, "LIGATION");
    else return reject("That reaction is unavailable.");
    this.score += 100;
    this.message = "Correct molecular decision.";
    return true;
  }
  reset(mode: Mode = this.mode) {
    const fresh = new ReplicationEngine(this.seed);
    Object.assign(this, fresh);
    this.mode = mode;
  }
  seek(seconds: number) {
    const mode = this.mode,
      paused = this.paused,
      held = new Set(this.held);
    this.reset("watch");
    this.advance(Math.max(0, seconds));
    this.mode = mode;
    this.paused = paused;
    this.held = held;
  }
}
