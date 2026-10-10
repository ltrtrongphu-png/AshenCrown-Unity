# Production 3D model pipeline

## Included character art

The repository includes two original, rigged, stylized dark-fantasy characters. The web viewer normalizes imported models to a known world-space height and centers their feet at the ground plane, while preserving the GLB's material groups and embedded PBR maps:

| Asset | Role | Height | Distinguishing details |
|---|---|---:|---|
| `Characters/AshenSentinel.glb` | Humanoid player/enemy | 2.0 m | Layered obsidian plate, brass diadem, ember heart, greatsword, short mantle |
| `Bosses/AshenRegent.glb` | Boss | 2.24 m | Broader armor, seven-spire crown, ember crests and long mantle |

Both models use a 19-joint humanoid rig and six clips: `Idle`, `Walk`, `Run`, `Light1`, `Heavy`, and `Enrage`. The rig joint names follow Unity Humanoid naming conventions. Armor and cloth sections are parented rigidly to their matching joints, which preserves hard-surface silhouettes during motion; they are not skinned meshes. The self-contained GLB files carry their material images and can be imported independently.

The shared 1024 × 1024 texture sources are in `Textures/`: neutral base color, tangent-space normal, metallic/roughness/occlusion, and emissive ember fissures. GLB materials reference these maps with separate obsidian, cloth, brass, and emissive-glass material factors. In Three.js, base-color and emissive maps must be treated as sRGB, while normal/metallic/roughness/occlusion maps remain linear data; do not replace the authored material groups with one flat material. The deterministic source generator is `tools/generate_ashen_production_assets.py` (Python 3, NumPy, Pillow).

## Import into Unity

Unity does not import GLB by default. Add a compatible glTF/GLB importer to the consuming Unity project, then import the `.glb` files from this folder. Configure the imported rig as **Humanoid** when the importer exposes rig settings; otherwise use **Generic**. Verify the skeleton and clips in Unity, then create a prefab from the imported hierarchy.

Assign the resulting prefab to `CharacterModelBinder.modelPrefab`. Keep the gameplay root (colliders, `NavMeshAgent`, `HealthAndDamageSystem`, and combat scripts) separate from the visual prefab. The binder supports authored `LODGroup`s, but these included assets currently ship as one LOD each.

Recommended Animator parameters: `Speed`, `MoveX`, `MoveY`, `Grounded`, `Combat`.
Recommended triggers: `Light1`, `Light2`, `Light3`, `Light4`, `Heavy`, `VoidThrust`, `AshenEruption`, `Enrage`, `PhaseTransition`, `Stagger`, `Execute`, `Die`.

`AnimatorSafe` ignores missing parameters, so prototype and production models remain compatible. The GLB clips are source animations; create or assign an Animator Controller to map gameplay states to the imported clips.
