# Character Art Polish — Generated Asset Record

Updated: 2026-10-17

This change rebuilds the two production GLB models from `tools/generate_ashen_production_assets.py`.

## Visual changes

- More readable layered armor silhouette: raised pauldrons, bracers, rivets, chest inlays, gorget and an ember-set buckle.
- A draped mantle is present on both the Ashen Sentinel player model and the Ashen Regent boss; the mantle uses baked geometric folds rather than runtime cloth simulation.
- Shared PBR maps include denser abrasion, micro-pitting and stronger AO/roughness contrast plus more ember fissures.
- The Obsidian Steel / Ashen Cloth / Antique Brass / Emberglass palette has been darkened and made more restrained to match the supplied dark-fantasy references.

## Performance guardrails

- Four shared PBR maps remain 1024 × 1024; no texture-resolution multiplier.
- New details are batched by material and rig joint in the generator rather than emitted as one draw call per rivet.
- Each generated GLB must stay below 12 MiB and retain six animation clips.

## Regeneration and validation

Run with Python 3.12 and the `numpy` and `Pillow` packages:

```bash
python tools/generate_ashen_production_assets.py
python tools/validate_ashen_production_assets.py
```

Generated asset validation on the feature branch:
- `AshenSentinel.glb`: 45 mesh groups, 6 clips, 4,377,460 bytes.
- `AshenRegent.glb`: 45 mesh groups, 6 clips, 4,401,404 bytes.
- Shared texture maps: four 1024 × 1024 maps.
- GLB container, material group, embedded texture and animation checks passed.

These checks validate file structure and asset budgets only. They do not replace an in-engine visual review, rig deformation review or target-hardware FPS profiling.


## Follow-up polish — Ashen Crown production pass

- Increased deterministic micro-abrasion and pitting on the shared 1024² surface maps, and added branching ember fissures to the emissive map.
- Added nested gorget/pauldron layers and extra obsidian ridges on the Regent's mantle to improve highlights and character silhouette without cloth simulation or per-rivet draw calls.
- The GLB validator remains the gate for mesh/material/clip size and structure. In-engine visual deformation and target-device performance still require a real Unity/browser run.
