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
