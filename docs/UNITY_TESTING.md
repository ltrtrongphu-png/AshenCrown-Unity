# Unity EditMode testing

## Important distinction

The browser demo deployed to Vercel is a separate Three.js application. The Unity C# project is tested by Unity Editor; it is not what the web deployment builds.

The project currently pins Unity **2021.3.45f1** in \`ProjectSettings/ProjectVersion.txt\`. The Unity Hub screenshot showing Unity 6.6 does not mean this repository targets 6.6. Prefer installing 2021.3.45f1 in Hub for a reproducible test. Opening with a newer Editor can upgrade project metadata/packages.

## Run tests locally on Windows

1. In Unity Hub, install Unity Editor **2021.3.45f1** (or deliberately choose a compatible version and review any upgrade prompts).
2. Sign in to Unity Hub and activate an eligible Unity license on this computer. Do not copy a license or account password into the repository.
3. Clone the repository and wait for Unity Package Manager to resolve \`com.unity.test-framework\`.
4. From PowerShell at the repository root, run:

   \`\`\`powershell
   .\\tools\\run-unity-editmode.ps1
   \`\`\`

   If Unity is installed in a custom location, pass the full path to \`Unity.exe\`:

   \`\`\`powershell
   .\\tools\\run-unity-editmode.ps1 -UnityEditorPath "D:\\Unity\\Editor\\Unity.exe"
   \`\`\`

5. Review \`TestResults/EditMode.xml\` and \`Logs/EditMode.log\`. You can also use **Window → General → Test Runner → EditMode** inside Unity Editor.

The script reads the expected editor version from \`ProjectSettings/ProjectVersion.txt\`, runs Unity in batch mode, and returns a non-zero exit code if the test process fails or no result file is produced. Unity's local activation is handled by Unity Hub; this script does not create or export a GitHub license.

## GitHub Actions and \`UNITY_LICENSE\`

The workflow at \`.github/workflows/unity.yml\` is intentionally independent from \`.github/workflows/web.yml\`.

- If repository secret \`UNITY_LICENSE\` is present, the GameCI EditMode runner executes. A configured but invalid/expired license should fail visibly rather than silently skipping.
- If \`UNITY_LICENSE\` is absent, the workflow writes an explicit **tests not run** summary and warning. This is not reported as a Unity test pass, and it does not gate the separate browser build/deployment workflow.
- To enable remote Unity tests, open **Settings → Secrets and variables → Actions → New repository secret** and add \`UNITY_LICENSE\` in the format required by the selected GameCI licensing method. Do not paste license contents, Unity passwords, or other credentials into issues, commits, or chat.

A green Web CI check validates the browser artifact only; it does not prove that Unity C# compiles or that a Unity scene is playable. Those claims require successful Editor tests and a manual playability check.
