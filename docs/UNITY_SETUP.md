# Unity project setup

## Current scope

The repository now includes a minimal project scaffold targeting Unity 2021.3 LTS, a runtime assembly definition, and an EditMode test assembly definition. It does **not** yet contain a verified combat sandbox scene, authored Animator Controllers, or production prefabs. C# compilation has not been verified in Unity Editor in the current environment.

## Open the project

1. Install Unity Editor 2021.3 LTS or a compatible newer LTS release.
2. Clone the repository and open its root folder (the folder containing `Assets/`, `Packages/`, and `ProjectSettings/`) in Unity Hub.
3. If prompted to resolve packages, allow Unity Package Manager to resolve `com.unity.test-framework`.
4. In **Edit → Project Settings → Player → Other Settings**, set **Active Input Handling** to **Input Manager (Old)** or **Both**. The gameplay currently uses the legacy Input Manager API.
5. Use **Ashen Crown → Create Sandbox Scene** to generate the capsule combat scene and navigation data; inspect the Console and play the scene before relying on it.
6. Open **Window → General → Test Runner** and select EditMode. The test assembly is declared at `Assets/Tests/EditMode/AshenCrown.Tests.EditMode.asmdef`. It includes progression tests plus new lifecycle, animation-presentation, combat-feedback and HUD-setting test sources.

## Current limitations

- The editor command generates `Assets/Scenes/Sandbox_Combat.unity` and a NavMesh data asset when run; those generated assets are not checked in. The generator itself has not been run in an actual Unity Editor in this task, and no scene/playability claim is made.
- GLB assets require a compatible GLB importer. No importer package is added automatically because its Unity-version compatibility and license need to be reviewed.
- The existing C# assemblies have not been compiled here. Treat editor warnings/errors as open until Unity Editor confirms otherwise.
- Don't upgrade the save schema, remove systems, or change public gameplay method signatures without migration/shim tests.

See [Controls](CONTROLS.md), [Architecture](ARCHITECTURE.md), and [Backlog](BACKLOG.md).
