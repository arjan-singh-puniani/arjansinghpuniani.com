# Character asset and motion integration boundary

The supplied character assets are procedurally generated, stylized geometry. No professional mesh, motion-capture clip, licensed third-party character or facial blendshape library has been supplied or imported.

The current renderer supports fifteen bone matrices and up to four normalized weights per vertex. CharacterSkin defines pelvis, spine, chest, neck, head, three joints for each arm, and thigh/shin bones for each leg; foot endpoints belong to the pose even though they are not separate shader bones. Geometry is authored in the local bind frame. Skin transforms are composed beneath the character's world transform.

A replacement Mika should retain her silhouette, palette and identity, be fitted to the bind pose and tested at contact, passing, lift, turn, stop and sitting poses. Weight validation must reject unknown bone indices, non-finite attributes, unnormalized weights and mismatched attribute lengths before GPU upload. Artist-supplied assets need an explicit provenance/license record.

Base tennis motion is sampled through ClipLibrary. It should supply pose curves, not override gameplay outcomes. Foot support, racket sweet-spot correction, gaze and secondary motion remain owned by the runtime. A human-reference or retargeted clip must be verified against the existing actual-contact tests and walking constraints before activation.

This document is an integration specification, not a claim that a professional import pipeline or facial-deformation system has shipped. The remaining ceiling includes deformation at extreme joints, shoulders and clothing, limited face primitives, and lack of a professionally authored motion library.
