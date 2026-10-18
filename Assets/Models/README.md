# Production 3D model pipeline

## Included character art

The hero-model pipeline includes two original, rigged, stylized dark-fantasy characters; the browser Resource Pack additionally includes a separate static 62-character NPC roster. The web viewer normalizes the two hero models to a known world-space height and centers their feet at the ground plane, while preserving the GLB material groups and embedded PBR maps:

| Asset | Role | Height | Distinguishing details |
|---|---|---:|---|
| `Characters/AshenSentinel.glb` | Humanoid player/enemy | 2.0 m | Layered obsidian plate, brass diadem, ember heart, greatsword, short mantle |
| `Bosses/AshenRegent.glb` | Boss | 2.24 m | Broader armor, seven-spire crown, ember crests and long mantle |
| `NPC/AshenNPCRoster.glb` | 62 static NPC prototypes | Varies | Per-character palettes, class silhouettes, robes/armor, headwear, cloaks and weapons |

Both models use a 19-joint humanoid rig and six clips: `Idle`, `Walk`, `Run`, `Light1`, `Heavy`, and `Enrage`. The rig joint names follow Unity Humanoid naming conventions. Armor and cloth sections are parented rigidly to their matching joints, which preserves hard-surface silhouettes during motion; they are not skinned meshes. The self-contained GLB files carry their material images and can be imported independently.

The shared 1024 × 1024 PBR texture maps stay at 1K for memory and web-download efficiency. They use deterministic fine abrasion, micro-pitting, varied roughness/AO and sharper ember fissures, with denser hero geometry, a folded player mantle, layered shoulder/cuff plates, engraved chest rails, rivets and an ember-set buckle. A GitHub Actions workflow regenerates the GLB files and validates their embedded materials and animation clips. GLB materials reference these maps with separate obsidian, cloth, brass, and emissive-glass material factors. In Three.js, base-color and emissive maps must be treated as sRGB, while normal/metallic/roughness/occlusion maps remain linear data; do not replace the authored material groups with one flat material. The deterministic source generator is `tools/generate_ashen_production_assets.py` (Python 3, NumPy, Pillow).

## Import into Unity

Unity does not import GLB by default. Add a compatible glTF/GLB importer to the consuming Unity project, then import the `.glb` files from this folder. Configure the imported rig as **Humanoid** when the importer exposes rig settings; otherwise use **Generic**. Verify the skeleton and clips in Unity, then create a prefab from the imported hierarchy.

Assign the resulting prefab to `CharacterModelBinder.modelPrefab`. Keep the gameplay root (colliders, `NavMeshAgent`, `HealthAndDamageSystem`, and combat scripts) separate from the visual prefab. The binder supports authored `LODGroup`s, but these included assets currently ship as one LOD each.

Recommended Animator parameters: `Speed`, `MoveX`, `MoveY`, `Grounded`, `Combat`.
Recommended triggers: `Light1`, `Light2`, `Light3`, `Light4`, `Heavy`, `VoidThrust`, `AshenEruption`, `Enrage`, `PhaseTransition`, `Stagger`, `Execute`, `Die`.

`AnimatorSafe` ignores missing parameters, so prototype and production models remain compatible. The GLB clips are source animations; create or assign an Animator Controller to map gameplay states to the imported clips.


## NPC production roster

`NPC/AshenNPCRoster.glb` contains 62 distinct reusable NPC character roots based on the supplied dark-fantasy roster concepts. The models have separate material batches for cloth, armor, trim, skin, hair, leather, and emissive accents and embed the shared four-map 1024x1024 PBR atlas. The browser build downloads this one roster asset alongside the Sentinel and Regent hero models, then clones the selected archetype for narrative NPCs and villagers. It is an authored stylized low-poly roster, not 62 copies of the same capsule or a screenshot texture atlas.

The roster generator is `tools/generate_ashen_npc_roster.py`; the asset workflow regenerates it after the common PBR maps and hero models are generated. `tools/validate_ashen_production_assets.py` checks the GLB container, embedded map count, material batches and at least 50 named NPC roots.
