# SeizeFreeze laboratory: reproducible model record

This is an educational calculation created for the Cyberpunk Reality portfolio. Its outputs are **project-specific simulations using explicitly assumed coefficients**, not device measurements, clinically validated predictions, therapeutic settings, or a reproduction of an earlier SeizeFreeze engineering model. No temperature is designated clinically safe. The model does not predict seizure suppression. It does not establish an implant's power requirement or human thermal response.

## Run and reproduce

From the portfolio repository:

```sh
node tools/seizefreeze/model-check.mjs
npm run dev
```

The browser requests a deterministic calculation from `worker.js`; the worker imports `model.js`, with no network, clock, random-number or rendering dependency. `simulate(options)` is also directly importable in Node. Input and output are SI except temperatures reported in °C and the synthetic signal in µV. The Seebeck term explicitly converts °C to kelvin. Default duration 120 s; internal step 0.01 s; output at approximately 20 Hz, including both endpoints. Playback, pause and scrubbing select already calculated states. A parameter change recalculates the trajectory.

Worker request: `{id, options}`. Successful response: `{id, result:{frames,params,summary}}`; invalid inputs return `{id,error}`. Parameter keys and scenario identifiers are in the exported `defaults` and `scenarios`. Non-finite, out-of-range and unknown inputs are rejected. `sensor:null` means failed, not zero degrees.

## Smallest coupled physical model

The physical domain is a **one-dimensional finite-volume depth column**, 8 mm deep, over an assumed uniform 100 mm² contact footprint. The default 16 cells are 0.5 mm thick. The lateral faces are insulated: there is no radial conduction, vascular geometry, sulcal anatomy or CSF flow. Any color field draped over cortex repeats/interpolates this depth column; it is not a 3D brain solution. The footprint is assumed, so a lateral affected area or clinically effective tissue volume cannot be inferred.

Two lumped device nodes represent cold plate and hot package. The hot node stores heat and rejects it through a finite thermal resistance to a fixed 37°C reservoir representing distant tissue/environment. This is an explicit reservoir idealization, **not an unlimited heat sink at the module hot side**. The tissue's deep boundary also meets 37°C through a half-cell conduction resistance. Contact resistance, a cold-side insulation leak and a hot-package-to-surface parasitic path are present.

All temperatures initially equal the selected initial temperature (37°C by default). Arterial temperature is fixed at 36.85°C, with baseline metabolic generation chosen to balance perfusion at 37°C. Changing initial temperature changes the initial transient; neither arterial nor environmental reservoir temperature follows that control.

### Tissue equation: approximate continuum model

The Pennes form is

`ρ c ∂T/∂t = k ∂²T/∂z² + β (Ta − T) + qmet`.

Plain reading: tissue temperature changes because heat conducts from neighboring tissue, blood exchanges heat, and metabolism adds heat. `ρ` is density (kg/m³); `c` specific heat (J/kg/K); `k` conductivity (W/m/K); `β` a lumped perfusion coefficient (W/m³/K); `Ta` arterial temperature (°C); `qmet` metabolic heating (W/m³); `z` depth (m); `t` time (s). Celsius differences equal kelvin differences. Pennes introduced a blood-exchange model in human forearm experiments, **not a validated focal-brain-cooling model**. Applying that structure here is an approximation. The present coefficients are assumptions, not fits to that experiment.

Finite-volume cell heat capacity is `Ci = ρ c A Δz` (J/K). Neighbor conductance is `G = k A / Δz` (W/K). Each internal face flux is computed once algebraically as the same equal-and-opposite contribution in its two adjacent cells. No cooling sink is added to tissue volume.

### Interface and parasitic paths: linear resistance approximations

`Qcontact = (T0 − Tc) / (Rcontact + Δz/(2 k A))`.

Plain reading: heat leaves the first tissue cell through its half-cell conduction resistance and the physical contact resistance before entering the cold node. `T0` is first cell-center temperature; `Tc` cold-plate temperature; resistance has units K/W; heat flow has units W. Positive `Qcontact` leaves tissue. The plotted contact surface is reconstructed as `Tsurface = T0 − Qcontact Δz/(2 k A)`, consistent with the boundary flux. The sensor observes this surface through a first-order lag. Comparing cell-center temperatures across grids would compare different physical depths; convergence checks therefore also compare reconstructed surface temperature.

`Qparasitic = (Th − T0)/Rhot,tissue`; `Qinsulation = (37 − Tc)/Rinsulation`; `Qreject = (Th − 37)/Rreject`.

Plain reading: the package can warm the superficial tissue; insulation admits a cold-side heat leak; finite hot-side rejection releases heat to the reservoir. `Th` is hot-package temperature. Negative values reverse those directions. The parasitic connection is a reduced connection to the first tissue cell, not a resolved package contact patch. `Rhot,tissue`, `Rinsulation` and `Rreject` are K/W. No radiation or free convection is separately added to an assumed implanted package.

### Thermoelectric element: constant-property lumped approximation

`Qc = α I (Tc + 273.15) − ½ I² Re − K (Th − Tc)`

`P = α I (Th − Tc) + I² Re`; `Qh = Qc + P`.

Plain reading: current pumps heat at the cold face, Joule heating reduces net extraction, and conduction leaks heat back across the element. The hot face receives the extracted heat plus electrical input. `α` is effective module Seebeck coefficient (V/K), `I` current (A), `Re` electrical resistance (Ω), `K` thermal conductance (W/K), and `Qc`, `Qh`, `P` are W. Positive `Qc` enters the thermoelectric element from the cold plate; positive `Qh` leaves it into the hot node. At zero current the element still conducts: `Qc = −K(Th−Tc)`. It does not become thermally disconnected at shutdown. Parameters are constant; Thomson effects, temperature-dependent properties and individual thermoelectric legs are omitted.

### Device storage and energy conservation

`Cc dTc/dt = Qcontact + Qinsulation − Qc`

`Ch dTh/dt = Qh − Qreject − Qparasitic`.

Plain reading: each package temperature changes according to net heat into its finite thermal capacitance (`Cc`, `Ch`, J/K). Interface, module and package-parasitic terms cancel when tissue and both device balances are summed. The whole-system external balance is

`ΔU = ∫ [P + Σ(Qperfusion + Qmetabolic) + Qdeep + Qinsulation − Qreject] dt`.

`U` is stored thermal energy in tissue, cold plate and hot package (J). `Qdeep` is positive from the deep reservoir into tissue. The residual is stored-energy change minus the integrated external balance, in joules. It is independent of the internal heat-extraction tally. `energy` records cumulative electrical input; `ledger.extractedEnergy` records signed interface transfer; `ledger.rejectedEnergy` records signed reservoir rejection. These are different quantities and are never summed as if all were device energy consumption. All fluxes use the same pre-step state, so explicit Euler preserves this algebraic balance to floating-point roundoff.

## Parameter provenance and sensitivity

Every numeric value below is an authored **modeling assumption** selected for an inspectable educational transient. None is an established SeizeFreeze component rating, measured tissue property, fitted perfusion rate, clinically safe threshold or therapeutic recommendation. Sources support the equation structures and motivation, not these values. Numerical digits support reproducibility, not biomedical precision.

| Quantity | Default | Units / meaning |
| --- | ---: | --- |
| Footprint / depth | 100 / 8 | mm² / mm, uniform depth column |
| Density / specific heat | 1060 / 3600 | kg/m³ / J/kg/K |
| Conductivity | 0.5 | W/m/K |
| Perfusion coefficient | 40000 | W/m³/K |
| Metabolic heat | 6000 | W/m³ |
| Arterial / distant reservoir temperature | 36.85 / 37 | °C; baseline perfusion plus metabolism cancels at 37°C |
| Cold / hot heat capacity | 0.8 / 6 | J/K, package thermal storage |
| Module Seebeck coefficient | 0.012 | V/K |
| Electrical resistance | 2 | Ω |
| Module thermal conductance | 0.035 | W/K |
| Contact resistance | 4 | K/W; half-cell tissue resistance is added |
| Hot rejection resistance | 8 | K/W |
| Insulation / package-to-tissue resistance | 80 / 120 | K/W |
| Current limit | 0.32 | A, adjustable 0–0.8 A |
| Controller target | 34 | °C, illustrative target only |
| Cold / hot latched interlock | 28 / 42 | °C, demonstration fault logic only |
| Sensor lag | 0.8 | s, surface-temperature low-pass |
| Detector feature lag / threshold | 0.7 / 35 | s / µV, rectified synthetic amplitude |
| Controller proportional gain | 0.12 | A/K |

Interface resistance is adjustable 0.1–100 K/W; rejection resistance 0.5–200 K/W; initial temperature 32–39°C; duration 1–180 s. The simulation validates all values and applies scenario multipliers to effective resistances. Returned `params` contains those effective values. A scenario multiplier is an intervention for teaching sensitivity, not a probability distribution. Changing contact resistance changes cold-side coupling; changing rejection resistance changes package heat buildup; changing current limit changes both thermoelectric extraction and electrical input.

There is no statistical uncertainty band because there are no measured parameter distributions or identified patient population. Parameter comparisons expose assumption sensitivity; they cannot establish confidence intervals. Realistic prediction requires material measurements, calibrated interface impedance, temperature-dependent thermoelectric data, biological perfusion data, geometry, boundary conditions and validation experiments.

## Signals, detection, controller and scenarios

The waveform is explicitly synthetic. It combines 2.2 Hz and 3.7 Hz sinusoids with a smooth event amplitude envelope. It is deliberately slow enough for a readable 20 Hz teaching display; it is **not clinical ECoG, a seizure biophysical model or a patient record**. Cooling never changes it. This deliberate absence of thermal-to-neural coupling prevents an educational animation from suggesting demonstrated seizure suppression.

The detector computes a 0.7 s first-order moving average of absolute synthetic amplitude and compares it with 35 µV. This is an illustrative algorithm with no sensitivity, specificity, latency or clinical-performance claim. A detection holds the controller active for four seconds after its last threshold crossing. A proportional temperature controller requests `max(0, 0.12(sensor−34))` amperes; the current cap may saturate it. Fixed demonstration interlocks latch current off; cooling is not instantaneously reversed, and passive heat flow remains.

| Scenario | Intervention / what it teaches |
| --- | --- |
| `baseline` | No synthetic event; no command; equilibrium check |
| `disabled` | Event waveform/detector run; command disabled |
| `event` | Smooth event from 18 to 53 s; detector, controller, physical response |
| `delay` | Detector receives waveform eight seconds late |
| `false` | Injected false positive 24–36 s despite baseline waveform; feature does not cross the threshold |
| `saturation` | Effective current cap no greater than 0.06 A |
| `sensor` | Eight-second lag plus deterministic ±0.07°C sinusoidal sensor disturbance; failed sample at 50 s latches command off |
| `resistance` | Contact resistance multiplied by four |
| `rejection` | Hot rejection resistance multiplied by eight |
| `shutdown` | Command removed at 40 s; passive recovery remains |
| `repeated` | Events 18–43, 58–83 and 98–118 s reveal residual package heat |

No efficacy endpoint is calculated. Sensor noise is a reproducible disturbance, not an empirically characterized noise distribution. Simulated fault logic demonstrates a control concept; it is not independent hardware protection or validated medical-device safety logic.

## Numerical method, verification and limits

Forward Euler advances the finite-volume tissue nodes and lumped package nodes. The timestep must be less than 80% of the smallest relevant heat-capacity / outgoing-conductance timescale, including perfusion and cold/hot node bounds. Sensor and detector time constants also constrain that bound. This is a conservative explicit diffusion restriction, not an accuracy guarantee or proof for arbitrary nonlinear hardware. Invalid steps are rejected. At defaults the step is 0.01 s; the mesh, step and number of cells are returned with each result.

`tools/seizefreeze/model-check.mjs` checks all eleven scenarios, 37°C equilibrium, zero-current passive warming, algebraic thermoelectric heat balance, finite and bounded outputs, sensor-failure shutdown, commanded shutdown, thermal sensitivity, independent neural traces, deterministic replay, invalid-input rejection, temporal refinement and spatial refinement. The whole-system energy tolerance is **1×10⁻⁸ J**. A representative local run produced a maximum residual of 1.59×10⁻¹² J. That verifies bookkeeping, not biological validity.

For the default event, refining 0.01 s to a 0.0025 s reference gave a maximum first-cell temperature difference of approximately 0.00656°C; 0.005 s gave approximately 0.00139°C. With 0.005 s time step, refining 0.5 mm to a 0.25 mm reference gave approximately 0.0575°C maximum reconstructed surface difference; 0.4 mm gave approximately 0.0318°C. These are scenario-specific grid differences, **not prediction uncertainties or proof of convergence to physiology**. The reproducible check reports current values rather than relying on this record.

Key omissions: lateral heat spreading, vessels and directional flow, CSF/meningeal layers, spatially heterogeneous perfusion, contact mechanics, biological temperature feedback, electrochemical sensing artifacts, power-converter loss, battery storage, chronic encapsulation, corrosion, tissue injury, surgical access and manufacturing tolerances. Package power in this calculation is thermoelectric electrical input only; sensing, computation and conversion overhead require a measured future budget. A finite 37°C external reservoir may underestimate systemic/local heat accumulation. No experimental validation was supplied for this newly implemented solver.

## Claim-to-source map and evidence boundaries

1. **Established physical model structure:** [Harry H. Pennes, 1948, *Analysis of Tissue and Arterial Blood Temperatures in the Resting Human Forearm*](https://doi.org/10.1152/jappl.1948.1.2.93); [PubMed primary bibliographic record](https://pubmed.ncbi.nlm.nih.gov/18887578/). Supports conduction, perfusion exchange and metabolic-source formulation. Original model system: resting human forearm. It does not validate this coefficient set or cerebral application. Publisher full text was access-restricted during this work; citation metadata were verified.
2. **Thermoelectric equations and hot-side energy identity:** [Ferrotec, original manufacturer technical reference §11.4](https://thermal.ferrotec.com/technology/thermoelectric-reference-guide/thermalref11/). Supports the constant-property lumped relations and Kelvin convention. It does not provide implant thermal properties; no manufacturer performance curve is claimed for the assumed module.
3. **Biological motivation, preclinical only:** [Yang, Duffy, Morley and Rothman, 2002, *Neocortical Seizure Termination by Focal Cooling: Temperature Dependence and Automated Seizure Detection*](https://doi.org/10.1046/j.1528-1157.2002.33301.x); [PubMed](https://pubmed.ncbi.nlm.nih.gov/11906508/). Model system: anesthetized rats with chemically induced focal neocortical seizures; Peltier contact cooling and electrophysiological seizure-duration endpoint. Supports investigating focal cooling and highlights steep depth gradients. It establishes neither human settings nor SeizeFreeze efficacy. This laboratory does not reproduce that experiment or use its cooling temperatures as bounds.
4. **Project-specific simulations:** the accompanying `model.js`, inputs and reproducible checks. No bench trace, measured calibration set or human thermal result is presented.
5. **Proposed design:** the portfolio's attributed SeizeFreeze concept diagrams and case study supply the proposed sensing/cooling architecture. They are design evidence, not independent thermal validation. Public rendering here is original procedural geometry, not a metrologically accurate CAD model.
6. **Unresolved:** implant heat-rejection route, power/duty cycle, chronic packaging, detector performance, safe limits and therapeutic effect. No new patent, regulatory, partnership, manufacturing-readiness or clinical claim is made by this model record.

## Experiments that reduce the uncertainty

Start with a calibrated thermoelectric module between measured thermal masses: log electrical current/voltage, both face temperatures and a known heat load; identify α, Re, K and contact resistance. Next compare depth-resolved temperatures in a tissue-mimicking phantom against an appropriately extended 2D/3D model while varying contact, cooling pulse and heat-rejection boundary. Account for all heat and electrical energy, including driver loss. Challenge the complete hardware feedback loop with sensor disconnection, lag, saturation, restart and repeated demand. Only after appropriate biological and device-development work can a controlled preclinical protocol address tissue response and electrophysiological outcomes. Packaging, long-term operation, clinical translation and manufacturing require their own evidence.
