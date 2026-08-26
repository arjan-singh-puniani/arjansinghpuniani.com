VECTOR ECG architecture

Product architecture

Layer 1 is a pure TypeScript reasoning engine. It owns calibration math, coordinate transforms, rate, QT correction, axis projection, lead groups, serial deltas, provenance, and report assembly.

Layer 2 is the interaction surface. The source ECG remains an immutable raster. SVG overlays share image coordinates for lead regions, calipers, evidence regions, axis geometry, transition markers, and serial alignment.

Layer 3 is the teaching engine. The interface records a prediction and confidence before feedback is revealed. Events are stored at the skill level instead of as meaningless click counts.

Medical reasoning architecture

Observation -> localization -> measurement -> physiology -> diagnostic implication -> disconfirming evidence -> alternative explanation -> confidence -> limitation.

Machine reports, learner measurements, application calculations, and interpretations use separate types and separate visual presentation.

Learning architecture

Observe -> localize -> measure -> compare -> integrate -> hypothesize -> challenge -> synthesize.

The first worked case uses paired ECG recordings 93 seconds apart. Small numerical deltas are displayed without automatic clinical interpretation. The learner classifies each difference.

Image pipeline

Validate input -> render PDF pages -> estimate orientation -> permit rotation correction -> permit perspective correction -> estimate grid and scale -> propose lead regions -> propose rhythm strip -> assess image quality -> display confidence -> permit manual correction -> create coordinate transforms.

The current vertical slice fully implements import, page rendering, manual calibration, coordinate transforms, lead regions for the bundled case, zoom, pan, calipers, provenance, axis projection, evidence regions, serial comparison, prediction before reveal, and report export. Orientation, grid, and lead detection are represented as reversible proposals rather than irreversible transformations.
