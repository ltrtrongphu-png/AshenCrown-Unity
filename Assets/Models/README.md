# Production 3D model pipeline

FBX: Unity imports it natively. Put character/boss FBX files under Assets/Models/Characters or Assets/Models/Bosses, configure Rig as Humanoid or Generic, then create a prefab.

GLB: use a GLB/GLTF Unity importer, import the .glb and create a prefab from the imported hierarchy. The gameplay code does not depend on the importer.

Assign the resulting prefab to CharacterModelBinder.modelPrefab. Keep the gameplay root (colliders, NavMeshAgent, HealthAndDamageSystem and combat scripts) separate from the visual prefab.

Recommended Animator parameters: Speed, MoveX, MoveY, Grounded, Combat.
Recommended triggers: Light1, Light2, Light3, Light4, Heavy, VoidThrust, AshenEruption, Enrage, PhaseTransition, Stagger, Execute, Die.

AnimatorSafe ignores missing parameters, so prototype and production models remain compatible.