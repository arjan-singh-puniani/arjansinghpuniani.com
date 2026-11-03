# Organoid-inspired thermal planning model

Model documentation, 2 November 2026. This is a **nonperfused sphere, finite medium and thermoelectric-package calculation** for the Organoid Research Workbench. It is separate from the existing perfused cortical column in [MODEL.md](MODEL.md). Neither model is an organoid measurement or a validated prediction of a biological experiment.

The sphere is a thermal surrogate, not a miniature adult brain. Material properties, dimensions, contact coefficients and actuator parameters below are authored exploratory assumptions. They have not been calibrated to the reported Arduino/Peltier/NeuroSky assembly or to a living preparation. The default 20 °C reference is an arbitrary **inert numerical reference**, not a recommended culture temperature or biological perturbation protocol. No temperature, duration or interlock is a tissue-safety limit.

## Domains, state and spatial meaning

The resolved domain is a homogeneous sphere of radius `a`, divided into concentric finite-volume shells. Each shell has temperature `T_i`. The other thermal states are a spatially uniform medium temperature `T_m`, cold-substrate temperature `T_c`, and hot-package temperature `T_h`. A fixed external reservoir has temperature `T_b = 20 °C`. All modeled thermal states and the synthetic sensor start at the selected initial temperature; the reservoir stays at 20 °C even when that initial condition changes.

Every point on the sphere exchanges heat with the same well-mixed medium through the same coefficient `h`. The medium transfers heat through a separate resistance to the cold substrate. This is **uniform whole-sphere exchange**, not a resolved one-sided contact patch. A drawing of a sphere above a recording substrate or cooler explains component relationships; it does not establish a localized 3D thermal field, electrode geometry, medium flow or contact area. A radial temperature distribution revolved or interpolated into the scene remains this one-dimensional solution. The mesh is not microscopy or a segmentation of actual tissue.

There is no blood perfusion, metabolic source, internal vascular network, cell-specific structure or biological heat production in this model. Omitting a source is an assumption requiring reassessment for a particular preparation. The recording substrate, supports and electrodes have no independent spatially resolved heat equation here. Their thermal effects cannot be inferred from their drawn appearance. There is no model relating temperature to viability, excitability, synaptic activity, seizure probability or recovery.

## Governing equations and signs

Temperature differences can use kelvin or degrees Celsius. Absolute temperature in the thermoelectric term uses kelvin: `T_c,K = T_c,°C + 273.15`. Heat rates `Q` and electrical power `P` are watts; stored energy is joules; time is seconds. All `Q` values below are **signed**. Negative values mean the actual flow is opposite to the defined arrow; the implementation must not clamp them to make every arrow look like cooling.

### Sphere: conservative radial conduction

\[
\rho c\,\frac{\partial T}{\partial t}
=\frac{k}{r^2}\frac{\partial}{\partial r}
\left(r^2\frac{\partial T}{\partial r}\right),\qquad 0<r<a.
\]

Plain reading: changes in stored thermal energy equal net conducted heat. Here `ρ` is density (kg/m³), `c` specific heat (J/(kg·K)), `k` conductivity (W/(m·K)), `r` radius (m), and `T` temperature. This is Fourier conduction with homogeneous, constant coefficients; it is a continuum modeling assumption, not a fitted organoid law. Center symmetry gives `∂T/∂r = 0` at `r = 0`; no flux crosses the center. At the outer boundary, heat leaves the sphere toward the medium according to a finite exchange coefficient, `−k ∂T/∂r = h(T_surface − T_m)`, with `h` in W/(m²·K).

For a shell bounded by `r_in,r_out`, the heat capacity is `C_i = ρc(4π/3)(r_out³−r_in³)` in J/K. The representative radius is the volume-weighted radius `r_i = (3/4)(r_out⁴−r_in⁴)/(r_out³−r_in³)`. Adjacent states exchange heat through the spherical conduction conductance

\[
G_{ij}=\frac{4\pi k}{1/r_i-1/r_j},\qquad
Q_{ij}=G_{ij}(T_i-T_j),\quad r_j>r_i.
\]

`G` has units W/K; the same signed interface flux is subtracted from the inner cell and added to the outer cell. These resistances follow by integrating steady radial Fourier conduction between representative radii. Their use between transient cell states is a finite-volume spatial approximation. No additional boundary heat sink is applied to the same shell.

The last cell reaches the medium through its remaining spherical conduction resistance **and** the finite external surface resistance:

\[
Q_{tm}=\frac{T_N-T_m}
{(1/r_N-1/a)/(4\pi k)+1/(h4\pi a^2)}.
\]

Plain reading: heat leaving the outer cell must cross both the last portion of the sphere and the sphere–medium boundary. The numerator is a temperature difference; the denominator is K/W. `T_N` is the outermost **cell-average approximation**, not the exact surface temperature. If an actual boundary temperature is reported, it must be reconstructed as `T_surface = T_m + Q_tm/(h4πa²)` and labeled accordingly. An outer-cell temperature should remain labeled as such.

### Finite medium and package storage

\[
C_m\dot T_m=Q_{tm}-Q_{mc}+Q_{bm}+Q_{hm},\qquad
C_c\dot T_c=Q_{mc}+Q_{bc}-Q_c,\qquad
C_h\dot T_h=Q_c+P-Q_{hb}-Q_{hm}.
\]

Plain reading: each node warms when its signed incoming heat exceeds its outgoing heat. `C_m = ρ_m c_m V_m` is medium heat capacity; `C_c,C_h` are effective package capacities, all J/K. These are lumped approximations, not dimensions-derived component masses. Resistive branches are

\[
Q_{mc}=(T_m-T_c)/R_{mc},\quad
Q_{bm}=(T_b-T_m)/R_{bm},\quad
Q_{bc}=(T_b-T_c)/R_{bc},\quad
Q_{hm}=(T_h-T_m)/R_{hm},\quad
Q_{hb}=(T_h-T_b)/R_{hb}.
\]

Every `R` is K/W. Their arrows are respectively medium → cold substrate, reservoir → medium, reservoir → cold substrate, hot package → medium, and hot package → reservoir. `R_mc` aggregates an unresolved medium-to-substrate/interface path. It is not derived from the illustrative visible gap or a known contact material. `R_hb` represents **finite** hot-side rejection into an external reservoir; the package is not an unlimited sink. The reservoir itself is idealized as fixed-temperature and can supply or receive heat indefinitely; that is the explicit outer boundary assumption. No fan, pump, room or incubator is resolved.

### Constant-coefficient thermoelectric approximation

\[
Q_c=\alpha I(T_c+273.15)-\tfrac12 I^2R_e-K_{tec}(T_h-T_c),\qquad
P=\alpha I(T_h-T_c)+I^2R_e,\qquad Q_h=Q_c+P.
\]

Plain reading: Peltier transport competes with cold-side Joule heating and heat conducted backward through the module. The hot side receives extracted heat **plus electrical input**. `I` is delivered current (A), `α` the effective module Seebeck coefficient (V/K), `R_e` electrical resistance (Ω), and `K_tec` passive module conductance (W/K). These standard module relations are documented by [Ferrotec, §11](https://thermal.ferrotec.com/technology/thermoelectric-reference-guide/thermalref11/); they assume constant effective coefficients and symmetric Joule-heat allocation. This is an approximation to a real TEC, not its complete materials model. At zero current the module still conducts heat; “off” does not mean thermally disconnected.

No coefficients are inferred from the drawn number of legs, package dimensions or reported Peltier element. The power here is ideal module terminal input; actual driver, supply, wiring and power-conversion losses are **not modeled**. There is no power-delivery hardware validation or battery-life prediction.

## Exploratory defaults and provenance

Every numerical entry in this table is an authored assumption, not a literature measurement, device specification, assay prescription or recommended biological setting.

| Quantity | Default | Units / meaning |
| --- | --- | --- |
| Sphere radius `a`; shells | 1; 12 | mm; equal radial widths (2 mm diameter) |
| Sphere `k,ρ,c` | 0.5; 1000; 4000 | W/(m·K); kg/m³; J/(kg·K) |
| Medium volume `V_m`; `ρ_m,c_m` | 0.15; 1000; 4180 | mL; kg/m³; J/(kg·K) |
| Uniform sphere–medium `h` | 150 | W/(m²·K) |
| Medium → cold `R_mc` | 6 | K/W |
| Hot → reservoir `R_hb` | 8 | K/W |
| Reservoir → medium `R_bm` | 120 | K/W |
| Reservoir → cold `R_bc` | 150 | K/W |
| Hot → medium `R_hm` | 200 | K/W |
| Cold, hot capacity `C_c,C_h` | 0.4; 5 | J/K |
| TEC `α,R_e,K_tec` | 0.008; 2; 0.025 | V/K; Ω; W/K |
| Current cap | 0.2 | A; model saturation assumption |
| Reservoir reference; initial node temperatures | 20; 20 | °C; inert calculation reference |
| Controller target | reference − 1.5 | °C; demonstration setpoint |
| Illustrative latched thresholds | reference − 4; reference + 6 | °C; cold-node/hot-node model logic only |
| Medium sensor lag `τ`; controller gain `g` | 0.6; 0.12 | s; A/K |
| Detector hold; first-episode command window ends | 2; 55 | s; authored computational timings |

The implied sphere volume is approximately 4.19 µL and its heat capacity approximately 0.0168 J/K; medium capacity is approximately 0.627 J/K. These are arithmetic consequences of the stated defaults. They are not measured masses. Changing radius changes shell volumes, exchange area and diffusion distance together. Contact and rejection resistances are independent assumptions; they are not recomputed from drawing dimensions.

The public solver accepts only known input keys and finite values: radius 0.5–3 mm, conductivity 0.1–1 W/(m·K), input contact resistance 0.5–80 K/W, input rejection resistance 1–80 K/W, current cap 0–0.4 A, initial temperature 15–25 °C, duration 1–120 simulated seconds, requested timestep 0.001–0.05 s, 6–24 integer shells and an unsigned 32-bit integer seed. These are software calculation bounds, not a measured uncertainty range or biological operating envelope. The contact/rejection fault condition multiplies its input resistance by four; the effective value is retained separately from the original replay inputs.

## Global energy audit

Define `ΔU = Σ_i C_i(T_i−T_i,0) + C_m(T_m−T_m,0) + C_c(T_c−T_c,0) + C_h(T_h−T_h,0)`. Summing the balances cancels every internal transfer, including sphere → medium, medium → cold and hot → medium:

\[
\Delta U=\int_0^t \left(P+Q_{bm}+Q_{bc}-Q_{hb}\right)\,dt.
\]

The diagnostic residual is stored-energy change minus this signed external-energy integral, in joules. The numerical acceptance tolerance is `|residual| < 10⁻⁸ J` for the tested runs. This checks implementation bookkeeping within the assumed network; a closed ledger does not prove physical completeness or measured accuracy. Cold-side extraction is **internal** to this global control volume, so it is not subtracted again as an external sink. Package energy accumulation remains in `ΔU`, rather than disappearing into a visually cold surface.

## Numerical scheme and reproducibility

The solver in [organoid-model.js](organoid-model.js) uses conservative radial finite volumes and explicit Euler time integration, with internal substeps restricted using thermal capacities and connected conductances, a conservative margin of 0.4, and the requested maximum timestep. Package bounds include passive TEC conductance and an `α I_cap` contribution; the sensor lag also bounds the step. Large radii, different meshes and changed thermal parameters require the step bound to be recalculated; the display cadence is not the integration timestep. Output frames share a 20 Hz simulation clock. Refinement must compare the same physical elapsed times, inputs and initial/boundary conditions. Requests exceeding the two-million-internal-step calculation budget are rejected explicitly.

The versioned check includes passive equilibrium, signed zero-current TEC conduction, internal-face cancellation, finite contact/rejection changes, grid/timestep refinement, a fixed-boundary analytical diffusion mode, deterministic complete-JSON replay, input rejection, automatic substeps and scenario/signal-independence checks. These are mathematical/implementation tests; no hardware or biological validation follows from them. Run from the `arjan-portfolio` directory:

```sh
node --experimental-default-type=module tools/seizefreeze/organoid-check.mjs
```

The suite passed on 2 November 2026. Default integration requested 0.01 s, the conservative computed bound was approximately 0.00526749 s, and the actual step was 0.005 s (10 substeps per 0.05 s output interval). The maximum whole-system energy residual over all eight conditions was `1.5508 × 10⁻¹² J`, below `10⁻⁸ J`.

| Verification problem | Comparison | Observed error |
| --- | --- | --- |
| Fixed-boundary sphere, unit-amplitude analytical mode, `a = 1 mm`, `k = 0.5 W/(m·K)`, `ρ = 1000 kg/m³`, `c = 4000 J/(kg·K)`, evaluated at 0.4 s | 8, 16, 32 shells; analytical initial/final **cell volume averages**; timestep 0.02 times the passive grid bound | Volume-weighted RMS: `1.0423 × 10⁻³`, `2.3513 × 10⁻⁴`, `5.6256 × 10⁻⁵ K` respectively |
| Coupled passive problem, 25 °C initial condition against 20 °C reservoir, 20 s | Requested steps 0.004, 0.002 s (actual 0.00384615, 0.002 s) versus 0.001 s reference | Maximum sphere-volume-mean difference: `3.7335 × 10⁻⁵`, `1.3117 × 10⁻⁵ K` |
| Coupled perturbation, same seed and inputs, 55 s, 0.001 s requested step | 6 and 12 shells versus 24-shell reference | Maximum sphere-volume-mean difference: `1.0986 × 10⁻³`, `2.2441 × 10⁻⁴ K` |

The decreasing differences support numerical refinement in these tested problems. The coupled reference runs are **not exact solutions**; these errors are not experimental uncertainty, a guarantee for every setting or physical prediction accuracy. The analytical helper uses 32 shells independently of the public solver's 24-shell interactive bound. Event/controller discontinuities can affect timestep comparisons; passive refinement isolates thermal integration behavior.

An independent computational smoke check of model version 1.0.0 on 2 November 2026 ran the default baseline, perturbation, recovery, repeated, sensor, rejection and contact conditions. Their maximum absolute energy residual was below `1.6 × 10⁻¹² J`; the passive 20 °C equilibrium stayed exactly stationary. A separate passive 23 °C initial condition against the fixed 20 °C reservoir transferred approximately −9.028 J of net external energy over 30 simulated seconds with matching storage change (residual below `3.3 × 10⁻¹³ J`). All default conditions retained the same 18,659 generated signal events for the same seed. These are **software outputs for inert assumed conditions**, not temperature recommendations, device measurements or biological results.

For the homogeneous sphere with fixed boundary and thermal diffusivity `κ = k/(ρc)`, a regular radial diffusion mode is proportional to `sin(πr/a)/(πr/a) · exp(−κπ²t/a²)`. Its center value is defined by the limit as `r → 0`. Comparing a separate fixed-boundary test problem with this analytical mode checks spherical conduction; it does not make the coupled finite-`h`, finite-medium problem analytically solved.

## Synthetic acquisition and control are separate models

The signal source comprises eight deterministic seeded synthetic channels sampled at 500 samples/s, with authored event windows and corresponding generated spike/raster/burst annotations. It is neither a NeuroSky specification nor an actual MEA recording. Its channels do not correspond to mapped biological cells or measured electrode positions. Temperature does not alter its events. A detector drives an illustrative current controller; the resulting thermal feedback can change current but cannot make a generated event become biologically normal.

`organoid-signal.js` injects deliberately broadened three-sample impulse templates with synthetic 60–80 µV amplitudes, background fluctuations, and authored high-event-probability windows at 18–46, 58–82 and 94–114 simulated seconds. The baseline/event Bernoulli probabilities correspond to nominal 3/35 events per second per channel before the generator's refractory restriction; realized counts vary with the seed. **500 samples/s is a synthetic display choice, not a specification for acquiring real extracellular spikes.** There is no claim that these template shapes reproduce an electrode's frequency response.

The illustrative spike detector counts negative threshold crossings below −35 synthetic µV with a 10 ms refractory interval. Counts across all eight channels in the preceding 0.25 s form an estimated population rate, smoothed with a 0.3 s lag. Burst classification uses authored 80/40 estimated-spikes-per-second on/off hysteresis. Two injected common-mode artifacts and an authored common-mode rejection threshold demonstrate one failure concept. These rules have no validated spike, burst or clinical seizure-detection performance; synthetic µV are authored signal units, not a conversion from salvaged-board raw counts. Generator events, detector crossings and burst classifications are different records. An injected-artifact flag is not a measured signal-quality assessment.

The synthetic sensor observes the **well-mixed medium**, not the sphere center or cold plate, through `τ dT_s/dt = T_m − T_s`. When enabled, without a latched fault, and within the 2 s detection hold, the controller requests `I_command = max(0, g[T_s − (20 °C − 1.5 K)])`; delivered current is `min(I_command,I_cap)`. `T_s` is the simulated reading, `τ` its lag, and `g` the proportional gain. Sensor lag is modeled; measurement noise, calibration error, electrical isolation, delivered-current dynamics and driver losses are not. The medium temperature can differ from the sphere interior, especially during transients. No independent biological response is inferred from that reading.

Baseline and sham disable actuation. The ordinary perturbation and fault conditions permit event-triggered actuation only before 55 simulated seconds; the repeated condition permits all three authored event windows. Recovery forces the command off at 32 s. Sensor failure at 30 s produces a missing reading and latches current off. Cold-node temperature at or below reference − 4 K or hot-node temperature at or above reference + 6 K also latches current off. These are simulator demonstrations, not certified safety mechanisms or acceptable biological limits; passive heat conduction and recovery continue after shutdown. Sensor failure does not reset the neural generator or establish a recovered biological state.

Baseline and sham have zero active current; their equality can test software controls but cannot represent absent physical handling/recording artifacts. Perturbation illustrates event-triggered actuation. Recovery forces the actuator off and follows passive exchange. Repeated demand illustrates cumulative storage; sensor failure, raised contact resistance and reduced rejection challenge assumptions. These are computational conditions, not experiments on a living preparation. Synthetic spike/burst changes are not an efficacy endpoint.

## Predictive limits and measurements needed

The model computes temperatures and signed energy flows **conditional on its assumptions**. It cannot predict real assay performance, spatial one-sided cooling, viability, seizure suppression, electrode artifacts, culture requirements, chronic implant behavior or clinical benefit. A parameter sweep is sensitivity to assumed values, not a confidence interval or a validated uncertainty distribution.

Calibration would require identified hardware, independent calibrated temperature/current/voltage measurements, geometry/contact/environment records and measured transient responses. Assessment should use separate held-out conditions and explicit uncertainty/error budgets; fitting a transient alone is not predictive validation. Biological questions need appropriate instrumentation, expert collaborators, a separate governed plan and controls; see [PROTOTYPE_EVIDENCE.md](PROTOTYPE_EVIDENCE.md), [VALIDATION_PLAN.md](VALIDATION_PLAN.md) and [RESEARCH_SOURCES.md](RESEARCH_SOURCES.md). No actionable biological protocol is supplied here.

## Displayed current and derived voltage

The workbench shows requested and limited actual current separately. Derived module voltage is `V=alpha*(Th-Tc)+Re*I` (V), consistent with the constant-property identity `P=V*I`. At zero current, the modeled Seebeck voltage can remain nonzero while electrical input is zero. This calculated voltage is not a module rating, board output, measured supply value or demonstration that the reported Arduino can drive the unknown Peltier.

The comparison control may be zero-current sham/baseline or the reference perturbation, retaining the same raw inputs and random seed while changing the computational condition. Comparing the contact or rejection condition with reference perturbation isolates that authored resistance multiplier; feedback trajectories can differ. This is an assumption comparison, not measured uncertainty.

## Computational plan provenance

Each calculation captures its hypothesis and analysis text before the worker runs. Exports use that captured plan even if fields are edited after completion; a new computation is required to associate edited text. Records explicitly state `externalPreregistration:false`. This preserves local computational provenance, not independent registration, blinded analysis, a timestamped external protocol or proof that the user had never seen an earlier simulation.
