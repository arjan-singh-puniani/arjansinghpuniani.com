# Shoulder asset ceiling and acquisition register

Measured on 2026-09-30. The current 20-structure source has 53,648 triangles and no UVs, textures, tangents or verified fiber-orientation metadata. Better camera/lighting cannot recover unavailable anatomy. All shipped geometry remains BodyParts3D Release 4.0, under the verified [source license](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html). No external candidate geometry was downloaded or added to production.

## Priority gaps

| Priority | Structure | Current ceiling | Needed source evidence |
|---|---|---|---|
| 1 | Scapula FJ3384 | 26,172 triangles; good broad landmarks, no separate cartilage | Higher-quality landmark-reviewed surface, source segmentation, verified coordinate frame |
| 2 | Humerus FJ3368 | 3,784 triangles for the entire bone | Proximal surface detail, head/tubercle landmarks; retain registration to scapula |
| 3 | Supraspinatus FJ1506 | 878 triangles, no UVs | Higher-resolution belly and separately identified tendon with registration |
| 4 | Infraspinatus FJ1500 | 866 triangles, no UVs | Higher-resolution surface, verified musculotendinous segmentation |
| 5 | Teres minor FJ1508 | 506 triangles, no UVs | Preserve slender form, attachment relations and tendon identity |
| 6 | Subscapularis FJ1504 | 2,092 triangles, no UVs | Better anterior surface and verified tendon boundary |
| 7 | Cuff tendons | No separately identified meshes | Four source-labelled, registered tendon surfaces; no shape extrapolation from muscle ends |
| 8 | Long-head biceps tendon | FJ1478 labels the long head muscle, not a standalone tendon | Separate tendon segment with verified course and attachment |
| 9 | Cartilage / labrum | Not supplied | Distinct, licensed, independently reviewed joint structures |
| 10 | Nerves and regional vessels | Nine vessel segments; no shoulder nerves | Registered axillary/suprascapular nerves, labelled vessel continuity; no invented connections |

## External candidate register

| Candidate / author | License / commercial use | Redistribution / attribution / derivatives | Coverage / quality / textures | Disposition |
|---|---|---|---|---|
| [BodyParts3D official archive](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html), DBCLS | CC BY 4.0; commercial use allowed | Redistribution and adaptation allowed with DBCLS attribution and change disclosure; no share-alike requirement | Official published ISA 4.0 package is explicitly 99% polygon reduction. Contains our current structures; no evidence here of higher-resolution textured cuff data | Current source. Request unreduced source from licensor; do not label upsampled geometry high fidelity |
| [Z-Anatomy Blender atlas](https://github.com/Z-Anatomy/Models-of-human-anatomy), Gauthier Kervyn and Marcin Zielinski | Project declares CC BY-SA 4.0; commercial use permitted under that license | Attribution required; derived data must remain under the same license. Preserve original BodyParts3D and Z-Anatomy credits | Whole-body atlas derived partly from BodyParts3D. Actual shoulder polygon counts, separate tendon segmentation and texture availability not inspected; no assumption of greater accuracy | Candidate only; inspect exact artifact, registration and component credits before ingestion. Nothing shipped |
| [Zygote anatomy library](https://www.zygote.com/), Zygote Media Group | Proprietary commercial licensing; no purchased license in this project | Public marketing is not permission to redistribute raw meshes to web clients. [Service terms](https://www.zygotebody.com/terms) do not establish a redistribution grant for this portfolio | Detailed commercial anatomy advertised; exact shoulder tendon coverage, geometry and map delivery require a licensed sample / contract | Excluded from production. Obtain explicit client-side mesh redistribution rights and asset specifications first |

## Ingestion contract

A future asset must provide a stable structure ID/FMA mapping, author and license, original download URL/version, SHA-256, geometry/texture inventory, coordinate frame and units, anatomical coverage, required attribution and derivative terms. Retain the source master unchanged. Import into the deterministic pipeline; compare anatomical landmarks to the current registered assembly. Do not fit arbitrary assets together with undocumented nonlinear warps.

The runtime accepts glTF materials with base color, normal, roughness and AO maps and preserves indexed normals/UVs/tangents and multiple materials. Biological material metallic is forced to zero; emissive is reserved for explicit selection UI. A texture is not evidence of anatomical fiber direction. Missing channels fall back to the tissue registry. Review source-specific material semantics before shipping.

No tendon, labrum, capsule, ligament, bursa, cartilage, nerve, fiber direction or insertion footprint was generated to fill these gaps. Source review is engineering verification, not independent clinical approval.


## Actual Blender candidate inspection — 2026-10-24

The earlier gap list describes the **shipped 20-structure subset**, not all available open anatomy. A local inspection of the Z-Anatomy Blender atlas now identifies source-backed candidates for several missing categories. No candidate has been inserted into production.

Source: https://github.com/Z-Anatomy/Models-of-human-anatomy/blob/master/Z-Anatomy.zip
Archive Git blob: `f43cabc6f366b2a6058dd2ed4a2b3c7b9b2492cb`.
Downloaded archive SHA-256: `e029688545627bd0214b269e1063143abb580aad72b2c2445d6d8a9a0d9da736`.
Blender 4.0.2 inspected `Startup.blend` with auto-execution disabled. The archive and original Blender file remain in `/tmp/holo-z-anatomy.zip` and `/tmp/holo-z-anatomy.blend`; they are not deployed assets. The extracted Blender SHA-256 is recorded in the inventory.

| Gap | Observed source evidence | Remaining qualification |
| --- | --- | --- |
| Cuff resolution | Right supra 1,430; infra 3,166; teres minor 1,522; subscap 2,954 raw triangles | More triangles do not prove improved landmarks or measured anatomy; no source UVs on these four muscle objects |
| Separate tendons | Infraspinatus has 521 source faces assigned to the Tendon material | The other three cuff objects have a Tendon material slot with **zero assigned faces**. This does not supply four complete tendons. Do not infer segmentation from a material name alone |
| Insertions | Four `.er` cuff meshes appear in the source's “2: Muscular insertions” collection | Source-authored insertion-region candidates, not measured or independently validated footprints; must check alignment and meaning |
| Labrum | `Glenoid labrum.r`: 107 vertices, 105 polygons, 214 raw triangles | Source subdivision modifier; coarse authored model requiring spatial review |
| Capsule | `Articular capsule of glenohumeral joint.r`: 219 vertices, 185 polygons, 367 raw triangles | Source subdivision and solidify modifiers; retain and disclose source processing rather than calling it measured capsule thickness |
| Bursae | Separate subacromial and subdeltoid meshes, each 178 vertices and 352 raw triangles | Source subdivision; simple shapes, not evidence of individual anatomy or physiological distension |
| Ligaments | Superior/middle/inferior glenohumeral, coracohumeral, coraco-acromial and acromioclavicular objects | Extremely coarse bases: coraco-acromial ligament is one quad. Inspect evaluated modifiers and attachment consistency |
| Cartilage | Humerus 803 and scapula 731 source faces assigned to Cartilage | Material-classified bone-surface regions, not evidence of a separate volumetric cartilage layer |
| Nerves | Axillary, suprascapular, superior/inferior subscapular named curve objects | Curves have explicit source paths and bevel; inspect conversion, branch continuity and coordinate registration |
| Vessels | Circumflex humeral, suprascapular and subscapular source curves | Candidate regional coverage, not a verified complete vascular tree |

### License and provenance

The project's published license permits redistribution and derivatives under CC BY-SA 4.0 and requests both BodyParts3D and Z-Anatomy attribution. Preserve its attribution text in [the downloaded license](shoulder-candidate-audit/Z-Anatomy-License.txt). The same file lists some noncommercial components (inner ear, kidney), so do not treat the whole archive as a uniformly cleared asset collection. No such components are proposed here. Shoulder-specific source lineage, attribution and derivative terms must be documented before release; no source definitions or add-on scripts have been incorporated into the product.

### Reproducible evidence

- [Object types, base triangles, material face assignments and modifiers](shoulder-candidate-audit/z-anatomy-inventory.json). The name search is intentionally broad and can include unrelated matches such as maxillary nerve; it is **not** an approved shoulder manifest.
- [Original mesh collections and bounds](shoulder-candidate-audit/source-mesh-collections.json).
- `tools/blender/inspect_shoulder_candidate.py -- --source /tmp/holo-z-anatomy.blend --output Documentation/shoulder-candidate-audit/z-anatomy-inventory.json` (run through Blender background mode with autoexec disabled).
- `tools/blender/render_shoulder_candidate.py -- /tmp/holo-z-anatomy.blend Documentation/shoulder-candidate-audit` produces three isolated review renders. Neutral display materials replace atlas shaders for visibility; source geometry, positions and modifiers are retained. They are candidate inspection images, not approved anatomical figures.

Next integration gate: inspect these source assemblies against the current shoulder landmarks, evaluate the authored surfaces and curves, record source-specific licenses, and validate converted GLB structure identities and visibility before changing the runtime manifest. An illustrative candidate is not automatically a high-fidelity replacement. Missing independent anatomy review remains disclosed.


Visual inspection of the three generated renders confirms that the source curves and joint structures render in the candidate bone assembly. The anterior-oblique joint image occludes much of the labrum behind the humeral head; it does not validate all attachments. The capsule/bursae are simple authored surfaces and several nerve/vessel curves end at the selected region boundary. These images do not establish anatomical correctness, complete connectivity, registration to the current production assembly, or improved fine tissue detail.


## Integration update — 2026-10-25

The selected Z-Anatomy assembly is now available in the actual shoulder app through four Explore views. See [integration report](SHOULDER-INTEGRATION.md) for the precise 34-part scope, source-preserving conversion, license, browser evidence and remaining gaps. The earlier “candidate only” entries describe the prior investigation, not the current integration status. Four complete cuff tendons remain unavailable; no empty material slot has been promoted into anatomy.
