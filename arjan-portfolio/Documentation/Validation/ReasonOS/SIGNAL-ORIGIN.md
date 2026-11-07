# Cardiac signal-origin model

The `/work/vector-ekg-reasonos/signal` route and case-study section explain the forward chain: membrane-associated sources → equivalent cardiac dipole → conducting body → electrode potentials → differential lead voltage. The standalone workspace opens the same explanation without navigating away from unsaved evidence. Imported recordings never drive or fit this model.

## Quantity and sign conventions

- `p(t)` is a **current** dipole moment in A m, directed from current sink to source. Its displayed position is a drawing convention, not a point emitting ions. The heart contains distributed sources; replacing them with one fixed dipole is an approximation.
- Coordinates in metres point toward the patient's left (`x`) and inferiorly (`y`); the displayed slice has `z=0`.
- `phi(r,t) = p(t)·r / (4 pi sigma |r|^3)` gives volts relative to zero at infinity. Potential at a fixed angle decreases as inverse distance squared, not cubed. The expression is singular at the origin; the field display masks a chosen 55 mm radius. That is an authored visual mask, not an experimentally justified accuracy threshold; it does not depict near-source anatomy.
- `V = phi(r_plus) - phi(r_minus)`. The computed trace and numeric readout use this exact subtraction. Reversing recorder inputs negates the trace but leaves `p` and all body potentials unchanged.
- `L = [r_plus/|r_plus|^3 - r_minus/|r_minus|^3]/(4 pi sigma)` has units V/(A m). Then `V = p·L`. A dashed straight axis matches this sensitivity only in the selected symmetric geometry. General torso lead fields vary with source position and tissue conductivities.
- The extracellular/body potential and lead voltage are distinct from transmembrane `Vm = phi_i - phi_e`. Illustrative cellular labels of about −90 and +20 mV are not the ECG amplitude or patient measurements.

## Model and rendering

This is a **closed-form, quasistatic, infinite homogeneous isotropic conductor** calculation, not a numerical torso or ionic-channel solver. Conductivity is an illustrative `sigma=0.2 S/m`. Electrodes lie on an equilateral triangle of circumradius `R=0.25 m`:

```
RA=(-sqrt(3)*R/2, -R/2)
LA=( sqrt(3)*R/2, -R/2)
LL=(0,R)
```

The pre-existing synthetic P/QRS/T source in `src/lib/reasonos/model.ts` is reused, with default cycle 820 ms. Its two numerical components are multiplied by `4 pi sigma R^2 / (1000 sqrt(3)) A m` per source unit. This explicit normalization preserves the existing illustrative mV waveform; it is not fitted physiological dipole strength. Every electrode and color tile evaluates the same analytic expression; the trace samples the same subtraction every 2 ms. Cursor values are evaluated directly at the selected time. The field is a sampled frontal slice of a three-dimensional solution, **not** a 2D-conductor solution. Color is linear in absolute potential until saturation at ±1 mV. The torso outline is only a visual guide and imposes no boundary condition.

The heart cutaway, conduction paths, moving chamber boundary and cell strip are original qualitative SVGs. The chamber boundary is not a mesh for the calculation. The current dipole is prescribed, not derived from the displayed activation-front shape. No anatomy was segmented from a patient image. No real cardiac activation or recovery sequence is inferred.

The tissue close-up implements four ideal local polarity cases. Activation toward the positive electrode gives a positive deflection; activation away gives negative. Recovery reverses polarity at the same sequence direction. Reversing both process and direction preserves the sign. This is a teaching rule for a simple boundary, not a complete T-wave model. Repolarization timing is not generally a propagating excitation wave.

SVG rendering is static until user input, requires neither WebGL nor a GPU solver, and has no autoplay or flashing. Native-size trace/cell SVGs scroll within labeled keyboard-accessible regions on small screens. The trace viewport follows a user-selected time with an immediate, non-animated scroll. Text outside SVGs provides the causal explanation and numeric values. Math uses the existing local KaTeX bundle with MathML and readable fallback text.

## Claim-to-source map

| Claim | Source and scope |
| --- | --- |
| Distributed sources, equivalent current dipoles and volume conduction | Geselowitz, 1967, *On bioelectric potentials in an inhomogeneous volume conductor*, [doi:10.1016/S0006-3495(67)86571-8](https://doi.org/10.1016/S0006-3495(67)86571-8). The point-source expression is exact only for the stated idealized conductor. |
| Lead sensitivity differs from the source vector | McFee & Johnston, 1953, [doi:10.1161/01.CIR.8.4.554](https://doi.org/10.1161/01.CIR.8.4.554); Plonsey, 1963, [doi:10.1109/TBMEL.1963.4322775](https://doi.org/10.1109/TBMEL.1963.4322775). Reciprocal lead-field excitation is a mathematical construction, not the source of ordinary ECG activity. |
| Sodium, calcium and potassium currents in working ventricular muscle | ten Tusscher et al., 2004, *A model for human ventricular tissue*, [doi:10.1152/ajpheart.00794.2003](https://doi.org/10.1152/ajpheart.00794.2003). A computational model informed by human ventricular data; not a universal nodal-cell explanation. |
| Ventricular activation has multiple fronts | Durrer et al., 1970, *Total excitation of the isolated human heart*, [doi:10.1161/01.CIR.41.6.899](https://doi.org/10.1161/01.CIR.41.6.899). Seven isolated human hearts; activation mapping, not a validation of this SVG or prescribed source. |
| Recovery gradients contribute along multiple anatomical axes | Meijborg et al., 2014, [doi:10.1161/CIRCEP.113.001622](https://doi.org/10.1161/CIRCEP.113.001622). Nine perfused pig hearts with pseudo-ECGs; retains animal/preparation context. |
| High-input-impedance differential sensing; separate right-leg feedback | [TI ADS1298 datasheet](https://www.ti.com/lit/ds/symlink/ads1298.pdf) and [SBAA188B](https://www.ti.com/lit/an/sbaa188/sbaa188.pdf). Example acquisition circuitry, not an assertion about every instrument. Bias-return, common-mode feedback and lead-off test currents are distinct from cardiac excitation and pacing. |
| Local boundary polarity and ECG lead definitions | Malmivuo & Plonsey, *Bioelectromagnetism*, [chapter 15](https://www.bem.fi/book/15/15.htm), with [source-field derivation, chapter 8](https://www.bem.fi/book/08/08.htm). Supporting textbook derivations. User reference screenshots motivated the original illustrations; no textbook image was copied into the release. |

## Verification and reproduction

```
npm test
npm run typecheck
npx eslint src/components/ECGSignalOrigin.tsx src/lib/reasonos/signal-origin.ts
npm run build
npm start -- --port 3238
REASONOS_BASE_URL=http://127.0.0.1:3238 REASONOS_QA_OUT=/tmp/reasonos-signal-release node tools/reasonos/signal-origin-qa.mjs
REASONOS_BASE_URL=http://127.0.0.1:3238 REASONOS_QA_OUT=/tmp/reasonos-signal-performance node tools/reasonos/signal-origin-performance.mjs
```

The focused unit test verifies dimensional scaling, inverse-square distance, sign reversal, perpendicular zero, singularity rejection, all cycle samples against the established synthetic lead functions, `V=p·L`, Einthoven's relation, unchanged source on input reversal, phase landmarks and all four local boundary cases. This analytic model has no time-integration stability or mesh-convergence claim. Field tile density changes visual sampling, not electrode calculations. Browser checks separately verify rendering, linked changes, accessible controls, reduced-motion mode, phone/tablet overflow and preservation of workspace endpoints when opening/closing the explanation.

Independent clinician, first-time-user, physical-phone and manual screen-reader checks remain pending. Source-based agent review and automated tests do not establish clinical validity, external expert endorsement or admissions impact.
