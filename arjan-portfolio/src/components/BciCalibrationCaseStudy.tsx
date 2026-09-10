import Image from "next/image";
import Link from "next/link";
import styles from "./BciCalibrationCaseStudy.module.css";

const experimentFacts = [
  ["3", "implanted BCI participants"],
  ["6–8", "stimulating channels per participant"],
  ["2–8 min", "per gamified or traditional task"],
  ["1–3 h", "typical experimental session"],
  ["6 items", "post-task engagement survey"],
];

const systemSteps = [
  ["01", "Select channel", "Choose a spatially representative intracortical stimulation channel."],
  ["02", "Run 2AFC trial", "Deliver the same two-alternative forced-choice detection-threshold paradigm."],
  ["03", "Present game layer", "Replace sparse visual cues with an arcade-style stimulus and immediate feedback."],
  ["04", "Capture response", "The participant reports which interval contained the perceived stimulation."],
  ["05", "Estimate threshold", "Compare psychophysical detection-threshold data across task conditions."],
  ["06", "Measure experience", "Use a short post-task survey to compare engagement, fatigue, reward, and motivation."],
];

export function BciCalibrationCaseStudy() {
  return (
    <article className={styles.page}>
      <section className={styles.hero}>
        <div className={`shell ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <Link className={styles.backLink} href="/work">← Back to work</Link>
            <p className={styles.eyebrow}>RNEL · HUMAN BCI RESEARCH · 2022–2024</p>
            <h1>Gamified BCI calibration</h1>
            <p className={styles.heroThesis}>
              Can a repetitive psychophysical task become more engaging without changing what it measures?
            </p>
            <p className={styles.heroBody}>
              In the Rehab Neural Engineering Labs, I worked on a research redesign of an intracortical
              microstimulation detection-threshold task. The redesign preserved the underlying psychophysical measurement while making repeated
              calibration more engaging, participant-centered, and easier to sustain.
            </p>
            <div className={styles.heroMeta} role="group" aria-label="Project details">
              <div><span>Role</span><strong>R&amp;D neural engineer</strong></div>
              <div><span>Setting</span><strong>Rehab Neural Engineering Labs</strong></div>
              <div><span>Focus</span><strong>Psychophysics · ICMS · human factors</strong></div>
            </div>
          </div>

          <figure className={styles.heroFigure}>
            <Image
              src="/images/research/rnel-gamified-session.webp"
              alt="Research participant in the Rehab Neural Engineering Labs during a gamified intracortical BCI calibration session, with the task displayed on a monitor and a tablet controller nearby"
              width={1600}
              height={900}
              priority
              sizes="(max-width: 900px) 100vw, 48vw"
            />
            <figcaption>
              A real research session in the lab. The arcade-style task is visible on the monitor; the
              participant uses a tablet response interface during calibration.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className={styles.section}>
        <div className="shell">
          <div className={styles.sectionHead}>
            <span>01 / THE PROBLEM</span>
            <h2>Calibration can be scientifically necessary and experientially tedious.</h2>
          </div>
          <div className={styles.twoCol}>
            <p className={styles.lede}>
              Detection-threshold calibration asks a participant to repeat carefully controlled perceptual
              judgments so the research system can estimate the minimum intracortical stimulation amplitude
              that is reliably perceived.
            </p>
            <p>
              The measurement is valuable precisely because the task is constrained and repetitive. But that
              repetition can also create a human-factors problem: fatigue, disengagement, and frustration can
              make necessary research sessions harder to sustain. The design challenge was therefore to improve
              the experience without silently changing the experiment.
            </p>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.darkSection}`}>
        <div className="shell">
          <div className={styles.sectionHead}>
            <span>02 / THE DESIGN QUESTION</span>
            <h2>Change the experience. Hold the measurement logic still.</h2>
          </div>
          <div className={styles.questionCard}>
            <p>
              <strong>Design constraint:</strong> preserve the same two-alternative forced-choice detection
              logic while changing the cues, response flow, feedback, and sense of agency around it.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="shell">
          <div className={styles.sectionHead}>
            <span>03 / BEFORE → AFTER</span>
            <h2>The gamified task wrapped a familiar psychophysical paradigm in a more engaging interface.</h2>
          </div>

          <div className={styles.compareGrid}>
            <article className={styles.conditionCard}>
              <p className={styles.conditionLabel}>Traditional calibration</p>
              <h3>Sparse 2AFC task</h3>
              <div className={styles.trialStrip} role="img" aria-label="Traditional two-alternative forced-choice trial">
                <div className={styles.crossCue} aria-hidden="true">+</div>
                <span>Interval 1</span>
                <i>delay</i>
                <span>Interval 2</span>
                <b>Report 1 or 2</b>
              </div>
              <ul>
                <li>Minimal visual cues</li>
                <li>Repeated center-out style perceptual judgments</li>
                <li>Response entered into the psychophysics workflow</li>
              </ul>
            </article>

            <div className={styles.invariant}>
              <span>MEASUREMENT INVARIANT</span>
              <strong>Same underlying 2AFC detection-threshold question</strong>
              <p>Which interval contained the perceived intracortical stimulation?</p>
            </div>

            <article className={`${styles.conditionCard} ${styles.gameCard}`}>
              <p className={styles.conditionLabel}>Gamified calibration</p>
              <h3>Arcade-style 2AFC task</h3>
              <div className={styles.trialStrip} role="img" aria-label="Gamified two-alternative forced-choice trial">
                <div className={styles.alienCue} aria-hidden="true"><i /><i /><i /></div>
                <span>Interval 1</span>
                <i>delay</i>
                <span>Interval 2</span>
                <b>Tablet response + feedback</b>
              </div>
              <ul>
                <li>Animated game-like cues and progress</li>
                <li>Direct tablet response</li>
                <li>Immediate success or error feedback</li>
              </ul>
            </article>
          </div>

          <figure className={styles.protocolFigure}>
            <Image
              src="/images/research/rnel-gamified-task-timing.webp"
              alt="Experimental timeline comparing non-gamified and gamified two-alternative forced-choice task screens across interval one, variable delay, interval two, and participant response"
              width={904}
              height={594}
              sizes="(max-width: 900px) 100vw, 980px"
            />
            <figcaption>
              Study timing and participant-screen sequence. The stimulation interval structure is held constant while the participant-facing task changes.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className={`${styles.section} ${styles.systemSection}`}>
        <div className="shell">
          <div className={styles.sectionHead}>
            <span>04 / THE SYSTEM</span>
            <h2>A deliberately constrained experimental pipeline.</h2>
          </div>
          <p className={styles.systemNote}>
            This diagram follows the experimental pipeline used in the study, from channel selection and
            2AFC trials through response capture, threshold estimation, and participant experience.
          </p>
          <div className={styles.pipeline}>
            {systemSteps.map(([number, title, body]) => (
              <article key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="shell">
          <div className={styles.sectionHead}>
            <span>05 / EXPERIMENT</span>
            <h2>Direct comparison, repeated within participants.</h2>
          </div>

          <div className={styles.factGrid}>
            {experimentFacts.map(([value, label]) => (
              <div key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className={styles.protocolGrid}>
            <div>
              <span className={styles.smallLabel}>CONDITION ORDER</span>
              <p>Gamified versus non-gamified task order was randomized by coin flip to reduce order effects.</p>
            </div>
            <div>
              <span className={styles.smallLabel}>REPETITION</span>
              <p>Channels were tested repeatedly across days so the two task conditions could be compared within the same research workflow.</p>
            </div>
            <div>
              <span className={styles.smallLabel}>QUESTIONNAIRE</span>
              <p>A six-item, five-point survey sampled fatigue, attractiveness, absorption, reward, frustration, and motivation.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.darkSection}`}>
        <div className="shell">
          <div className={styles.sectionHead}>
            <span>06 / WHAT I BUILT</span>
            <h2>Interface design was only one part of the research problem.</h2>
          </div>

          <div className={styles.contributionGrid}>
            <article>
              <span>01</span>
              <h3>Task redesign</h3>
              <p>Reframed a repetitive ICMS detection task around an arcade-style interaction while preserving the psychophysical question.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Game layer</h3>
              <p>Worked within a Pygame-based research interface using animated cues, progress, challenge, and feedback rather than a decorative overlay.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Response flow</h3>
              <p>Integrated a direct tablet response path so the participant could report the perceived interval inside the gamified workflow.</p>
            </article>
            <article>
              <span>04</span>
              <h3>Analysis</h3>
              <p>Compared participant-reported engagement and psychophysical threshold behavior across gamified and traditional conditions.</p>
            </article>
          </div>

          <p className={styles.collaborationNote}>
            This was collaborative human-subjects research across RNEL and a broader multi-site effort. My contribution centered on task redesign, participant-facing interaction, response flow, and analysis.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className="shell">
          <div className={styles.sectionHead}>
            <span>07 / PRELIMINARY FINDINGS</span>
            <h2>More engaging, without a clear aggregate shift in detection threshold.</h2>
          </div>

          <div className={styles.findingsGrid}>
            <article className={styles.finding}>
              <span className={styles.badge}>WORKING MANUSCRIPT</span>
              <h3>Participant experience</h3>
              <p>
                In the working manuscript, all three participants reported significantly higher scores on at least
                two engagement-related indicators in the gamified condition. The pattern included dimensions such
                as aesthetic appeal, motivation, reward, absorption, fatigue, and frustration, with the exact
                significant dimensions differing by participant.
              </p>
            </article>
            <article className={styles.finding}>
              <span className={styles.badge}>MEASUREMENT CHECK</span>
              <h3>Psychophysical threshold</h3>
              <p>
                The reported aggregate analyses did not show a statistically significant gamification effect on
                detection thresholds. Some electrode-level comparisons varied, so the result is presented here as
                preliminary rather than as proof of equivalence.
              </p>
            </article>
          </div>

          <div className={styles.boundary}>
            <strong>What the early data say</strong>
            <p>
              Working analyses showed stronger engagement across participants while aggregate detection
              thresholds did not shift significantly. The manuscript contains the full statistical treatment.
            </p>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.practiceSection}`}>
        <div className="shell">
          <div className={styles.sectionHead}>
            <span>08 / RESEARCH IN PRACTICE</span>
            <h2>Engagement was a systems constraint, not a cosmetic feature.</h2>
          </div>
          <div className={styles.practiceGrid}>
            <p className={styles.lede}>
              A calibration task can be technically correct and still be difficult to live with. Human-centered
              engineering in this setting meant treating participant attention, fatigue, agency, and feedback as
              part of experimental reliability.
            </p>
            <blockquote>
              Preserve the measurement. Improve the experience around it.
            </blockquote>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="shell">
          <div className={styles.sectionHead}>
            <span>09 / TEAM</span>
            <h2>Research happens in a community.</h2>
          </div>
          <figure className={styles.teamFigure}>
            <Image
              src="/images/research/rnel-team-with-participant.webp"
              alt="Rehab Neural Engineering Labs research team gathered around a participant in the laboratory"
              width={1800}
              height={1350}
              sizes="(max-width: 900px) 100vw, 1180px"
            />
            <figcaption>
              A collaborative lab environment around long-running human BCI research. No participant names or clinical details are published on this page.
            </figcaption>
          </figure>

          <div className={styles.communitySupport}>
            <figure>
              <Image
                src="/images/research/rnel-community-candid.webp"
                alt="RNEL research community gathered outdoors with a research participant"
                width={1600}
                height={1200}
                sizes="(max-width: 900px) 100vw, 760px"
              />
              <figcaption>Research community beyond the experimental setup.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.evidenceSection}`}>
        <div className="shell">
          <div className={styles.sectionHead}>
            <span>10 / SCOPE + SOURCES</span>
            <h2>What remains open, and where the record comes from.</h2>
          </div>

          <div className={styles.bottomGrid}>
            <div className={styles.limitations}>
              <h3>Open questions</h3>
              <ul>
                <li>The research involved a small number of implanted BCI participants.</li>
                <li>The novelty of a gamified task may diminish with repeated exposure.</li>
                <li>A tablet response interface may not generalize to participants without usable upper-extremity movement.</li>
                <li>Gamification adds implementation complexity and does not automatically improve every outcome.</li>
                <li>The statistical summary reflects working research materials; the submitted manuscript is the authoritative research record.</li>
              </ul>
            </div>

            <div className={styles.evidenceCards}>
              <article>
                <span>RESEARCH ARTIFACT</span>
                <h3>2023 technical talk</h3>
                <p>Supports the task redesign, 2AFC structure, gamified response flow, experimental sequence, and preliminary questionnaire framing.</p>
              </article>
              <article>
                <span>WORKING MANUSCRIPT</span>
                <h3>Gamified BCI calibration preprint</h3>
                <p>Supports the three-participant methods, 6–8 channel sampling, session duration, survey design, engagement findings, and threshold analyses.</p>
              </article>
              <article>
                <span>LAB PHOTOGRAPHY</span>
                <h3>RNEL lab photography</h3>
                <p>Shows the real research environment and participant-facing experimental setup.</p>
              </article>
            </div>
          </div>

          <div className={styles.related}>
            <Link href="/research">Research and publications ↗</Link>
            <Link href="/work">All work ↗</Link>
          </div>
        </div>
      </section>
    </article>
  );
}
