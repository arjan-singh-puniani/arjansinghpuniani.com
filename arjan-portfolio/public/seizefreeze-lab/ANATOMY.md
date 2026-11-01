# Anatomical context and placement uncertainty

Reviewed 30 October 2026. This educational peelaway explains the relationship between a proposed surface-cooling interface and the tissues surrounding the brain. It is not a surgical guide, an implantation procedure, a patient scan, or evidence that SeizeFreeze has been implanted. Layer separation, thickness, transparency and device scale may be exaggerated for visibility.

## Outside to inside

| Layer or compartment | Anatomical reading | Visualization boundary |
| --- | --- | --- |
| Scalp | Soft tissues outside the cranium; the scalp itself contains several tissue layers. | A single scalp shell is a teaching simplification. It is not skin alone or an accurately segmented surgical layer. |
| Skull / calvaria | The bony covering surrounding the cranial contents. | A removed patch communicates an occluded view; it does not specify an opening, access route or fixation method. |
| Dura mater | The tough outer meningeal covering immediately internal to the cranial bone. | A separate shell represents the covering, not a validated thermal barrier thickness. |
| Arachnoid mater | The meningeal membrane superficial to the pia; it bridges the contours of the underlying brain. | It should not be interpreted as a second skin closely following every cortical sulcus. |
| Subarachnoid space and CSF | The compartment between arachnoid and pia contains cerebrospinal fluid and vessels. It is a space with contents, not an additional solid membrane. | A translucent volume indicates location only; it is not a modeled CSF flow field. |
| Pia mater | A thin membrane closely investing the brain surface and following its folds. | A pial surface is not bare neural tissue. Transparent rendering may make the two look coincident. |
| Cerebral cortex | Neural tissue below the pia, with folded gyri and sulci at its surface. | A colored superficial patch is an illustrative region of interest. It does not identify abnormal tissue. |

Sources: [Purves et al., *Neuroscience*, “The Meninges”](https://www.ncbi.nlm.nih.gov/books/NBK10877/) explains the meningeal order, folded pia, bridging arachnoid and subarachnoid vascular compartment. [Ghannam and Al Kharazi, “Neuroanatomy, Cranial Meninges”](https://www.ncbi.nlm.nih.gov/books/NBK539882/) describes the cranial coverings and spaces. [Tajran and Gosman, “Anatomy, Head and Neck, Scalp”](https://www.ncbi.nlm.nih.gov/books/NBK551565/) establishes the scalp's soft-tissue layers; [“Anatomy, Head and Neck, Skull”](https://www.ncbi.nlm.nih.gov/books/NBK499834/) supplies the cranial-bone context. These are authoritative anatomical references, not SeizeFreeze experiments.

The normal cranial epidural and subdural interfaces should not be portrayed as thick, freely open cavities. Their designation as potential spaces differs from the CSF-containing subarachnoid compartment. Peeling layers apart is a diagrammatic operation, not an assertion that they are normally separated that way. [Cranial meninges reference](https://www.ncbi.nlm.nih.gov/books/NBK539882/).

## A highlighted region is not a seizure localization

The selected anatomical example is the **left superior temporal gyrus in the reference atlas**, used only to explain a superficial lateral neocortical interface. The local brain asset contains the annotated object `Allen_superior_temporal_gyrus_L`; a named marker must be anchored to that object's visible lateral surface and retain its left/right orientation. A visually estimated patch elsewhere should instead be labeled “illustrative lateral neocortical region.” This is not a patient-specific seizure focus. The name identifies anatomy only; it does not establish a diagnosis or suitability for cooling. The marker is anchored to a vertex of that named source parcel; the final head, region and interface camera views were inspected to check its visible registration. This is a rendering check, not clinical localization.

The **seizure-onset zone** describes where recorded seizures begin within the limits of the observations. The **epileptogenic zone** is the inferred tissue or network necessary for seizure generation and is not simply a colored anatomical lobe, a structural lesion, an interictal spike location, or the first electrode showing a discharge. These distinctions originate in the clinical localization framework described by [Rosenow and Lüders, *Brain* (2001), DOI 10.1093/brain/124.9.1683](https://doi.org/10.1093/brain/124.9.1683). No such clinical inference is performed here.

Clinical evaluation integrates patient history, seizure behavior, electrophysiology, imaging and functional considerations; selected cases need invasive recordings. There is no corresponding patient evidence in this experience. See [*Seminars in epileptology: Presurgical epilepsy evaluation*](https://pmc.ncbi.nlm.nih.gov/articles/PMC12747706/) for contemporary expert context and [NINDS, “Epilepsy and Seizures”](https://www.ninds.nih.gov/health-information/disorders/epilepsy-and-seizures) for a public explanation of EEG, imaging and intracranial localization. These sources describe clinical evaluation, not a SeizeFreeze indication or treatment workflow.

## Where would the proposed interface sit?

Two distinct research alternatives must remain explicit: a cooler over intact dura, and a cooler nearer the pial surface with different intervening coverings and contact conditions. “Over cortex” alone does not distinguish them. Direct pial contact also does not mean penetrating the cortex. The appropriate location, intervening tissue, CSF, vascular relationships, attachment, encapsulation and chronic access have not been established for SeizeFreeze.

[Yang et al. (2002)](https://pubmed.ncbi.nlm.nih.gov/11906508/) placed a Peltier cooler over the dura in anesthetized rats with experimentally induced seizures. That specific preparation supports neither a standard human implantation procedure nor interchangeability with direct pial contact. The experience's thermal solver uses an effective contact resistance; displaying anatomical layers does not turn it into a separate-layer meningeal/CSF solver. The layers' conductivities, thicknesses, flow and contact mechanics would need explicit representation and validation for such a claim.

## Brain reference asset and attribution

**Kristen Browne and Heidi Schlehlein (2023), *3D Reference Organ for Brain, Male v1.3*, Human Reference Atlas / HuBMAP.** [DOI 10.48539/HBM929.XKCL.339](https://doi.org/10.48539/HBM929.XKCL.339). Licensed [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/). Project lead: Katy Börner; anatomical reviewer listed by the source: Song-Lin Ding.

The [NIH 3D source entry](https://3d.nih.gov/entries/3DPX-020960?version=1) independently confirms that the reference brain's 141 structures were derived from one hemisphere of the Allen reference atlas, mirrored to form a whole brain, and resized for Visible Human reference bodies. The source scientific atlas is [Ding et al. (2016), DOI 10.1002/cne.24080](https://doi.org/10.1002/cne.24080). Mirroring is an atlas construction choice; it does not represent measured bilateral symmetry in a particular person.

The repository preserves the asset record at [HRA-BRAIN-SOURCE.md](/atlas/anatomy/HRA-BRAIN-SOURCE.md). Rendering adaptations such as positioning, display scale, materials, clipping and added diagrammatic coverings must be distinguished from the source anatomy. Registered head skin comes from the [HRA united male v1.5](https://doi.org/10.48539/HBM646.RKKC.257), also CC BY 4.0; see [HRA-BODY-SOURCE.md](/atlas/anatomy/HRA-BODY-SOURCE.md). The displayed head is cropped from that registered skin. Skull and dura are schematic inward offsets of the skin; the local arachnoid bridges the cortical contours, and pia follows the actual atlas triangles. Added flaps, contact markers and device geometry are educational overlays. The derived asset retains source hashes and modification details in its glTF metadata; regenerate it with `node tools/seizefreeze/anatomy-asset.mjs` from the repository root. The HRA reference geometry does not supply patient-specific cranial layers, a disease annotation, a cooling prediction or a surgical plan. Its source review does not constitute review of this SeizeFreeze visualization.

## Review limits

This record verifies anatomical terminology, interpretation boundaries and the cited asset's public provenance. It does not certify spatial accuracy of a rendered marker, registration between independently authored shells, clinical suitability, thermal performance or surgical feasibility. Those depend on the final geometry and further validation.
