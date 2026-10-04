# AshenCrown Major Animation + UI/UX Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make player/enemy/boss animation control, combat feedback, camera motion, and in-game/web UI feel substantially smoother and more consistent without requiring new animation assets.

**Architecture:** Keep the existing prototype-safe architecture and AnimatorSafe compatibility layer. Add a reusable animation presentation controller for locomotion/action state smoothing, improve movement/combat timing integration, and upgrade the existing HUD feedback layer rather than introducing a prefab-heavy dependency. Keep changes Unity 2021.3 LTS-compatible and preserve missing-controller/missing-parameter safety.

**Tech Stack:** Unity C#, Animator/AnimatorController, existing OnGUI prototype HUD, existing vanilla HTML/CSS/JS web play UI.

**Spec:** The approved Major Feel & UX Upgrade scope from the current task: smoother/correct locomotion and combat animation, better hit/dodge/parry feedback, camera feel, unified HUD/UI/UX, accessibility/reduced-motion behavior, and one cohesive upgrade rather than repeated deployments.

## Global Constraints

- Unity target remains 2021.3 LTS+.
- Preserve `AnimatorSafe` behavior when an Animator Controller or parameter is missing.
- Do not require third-party animation assets, packages, or runtime dependencies.
- Do not break the existing public movement/combat APIs used by other systems.
- Avoid per-frame allocations in hot animation/combat/UI paths.
- Keep the existing Input Manager compatibility.
- Web UI must remain functional without changing the gameplay data contract.

## Review Focus

- Missing Animator Controller/parameters must remain a no-op instead of producing warnings or exceptions.
- Repeated action requests must not restart the same animation state every frame.
- Lock-on strafing must use stable local-space animation values while world movement remains unchanged.
- Hit-stop/camera/UI feedback must not permanently alter `Time.timeScale`, camera FOV, or UI state after interruption.
- Reduced-motion settings must suppress nonessential UI/camera pulses without disabling functional feedback.

### Task 1: Animation presentation controller

**Files:**
- Create: `Assets/Scripts/Animation/AnimationPresentationController.cs`
- Modify: `Assets/Scripts/Animation/CharacterAnimationController.cs`
- Modify: `Assets/Scripts/Core/AnimatorSafe.cs`
- Test: `Assets/Tests/Animation/AnimationPresentationControllerTests.cs`

**Interfaces:**
- `AnimationPresentationController.SetLocomotion(Vector3 localVelocity, float normalizedSpeed, bool sprinting, bool lockedOn)`
- `AnimationPresentationController.SetCombatState(bool combat, bool grounded)`
- `AnimationPresentationController.PlayAction(string stateName, float fade, float playbackSpeed)`
- `AnimationPresentationController.Trigger(string parameter)`
- `AnimationPresentationController.SetPlaybackSpeed(float value)`

- [ ] **Step 1: Write tests** for state de-duplication, locomotion clamping, and playback-speed clamping.
- [ ] **Step 2: Run the animation tests and confirm the new behavior is initially absent/failing.**
- [ ] **Step 3: Implement the presentation controller and extend `AnimatorSafe` with cached state checks and safe playback-speed/layer helpers.**
- [ ] **Step 4: Route `CharacterAnimationController` through the presentation controller while preserving its public methods.**
- [ ] **Step 5: Run the tests again and confirm PASS.**

### Task 2: Player locomotion and combat animation integration

**Files:**
- Modify: `Assets/Scripts/Player/PlayerMovementAndCamera.cs`
- Modify: `Assets/Scripts/Player/PlayerCombatSystem.cs`
- Modify: `Assets/Scripts/Player/ThirdPersonCameraRig.cs`
- Test: `Assets/Tests/Player/AnimationIntegrationTests.cs`

**Interfaces:**
- Existing public movement/combat APIs remain unchanged.
- Animation updates use the presentation controller instead of direct state restarts.

- [ ] **Step 1: Add tests for stable local-space locomotion values and action playback de-duplication.**
- [ ] **Step 2: Run tests and verify the new assertions fail before integration.**
- [ ] **Step 3: Replace duplicated raw Animator writes in movement/combat with the shared animation controller, including grounded/combat/sprint/lock-on state and action playback.**
- [ ] **Step 4: Tighten attack/dodge/hurt/death transitions so timing remains driven by the existing combat state machine while animation presentation is smoothed.**
- [ ] **Step 5: Run tests and static compile checks.**

### Task 3: Combat/camera feedback polish

**Files:**
- Create: `Assets/Scripts/Combat/CombatPresentationFeedback.cs`
- Modify: `Assets/Scripts/Player/ThirdPersonCameraRig.cs`
- Modify: `Assets/Scripts/Player/PlayerCombatSystem.cs`
- Test: `Assets/Tests/Combat/CombatPresentationFeedbackTests.cs`

**Interfaces:**
- `CombatPresentationFeedback.Hit(float strength, float duration)`
- `CombatPresentationFeedback.Parry(float strength)`
- `CombatPresentationFeedback.PerfectDodge(float strength)`
- `CombatPresentationFeedback.SetReducedMotion(bool enabled)`

- [ ] **Step 1: Write tests for reduced-motion suppression and feedback-duration clamping.**
- [ ] **Step 2: Run tests and confirm they fail before implementation.**
- [ ] **Step 3: Implement a lightweight, event-driven feedback layer with no allocations in its normal update loop.**
- [ ] **Step 4: Connect hit/parry/perfect-dodge/skill events to camera impulse/FOV micro-feedback without fighting the existing camera controls.**
- [ ] **Step 5: Verify feedback resets correctly after interruption and run tests.**

### Task 4: Unity HUD/UX upgrade

**Files:**
- Modify: `Assets/Scripts/UI/GameFeedbackHUD.cs`
- Modify: `Assets/Scripts/UI/BossHealthBarUI.cs`
- Modify: `Assets/Scripts/UI/SettingsHUD.cs`
- Create: `Assets/Scripts/UI/HUDPresentationSettings.cs`
- Test: `Assets/Tests/UI/HUDPresentationTests.cs`

**Interfaces:**
- `HUDPresentationSettings.ReducedMotion`
- `HUDPresentationSettings.UIAlpha`
- `HUDPresentationSettings.UIScale`
- `GameFeedbackHUD.Push(string message, float duration)` remains compatible.

- [ ] **Step 1: Add tests for bounded toast queues, reduced-motion behavior, and safe UI scale/alpha values.**
- [ ] **Step 2: Run tests and confirm failure before implementation.**
- [ ] **Step 3: Upgrade feedback rendering with animated entry/exit, clearer hierarchy, priority-aware messaging, and reduced-motion fallback.**
- [ ] **Step 4: Smooth boss health/phase presentation and expose accessibility settings without requiring scene prefab rewiring.**
- [ ] **Step 5: Run tests and static checks.**

### Task 5: Web play UI/UX polish

**Files:**
- Modify: `play.css`
- Modify: `play.js`
- Test: existing browser/static checks where available.

- [ ] **Step 1: Identify existing state hooks/classes used by HUD, dialogue, pause, result, journal, and meta-menu.**
- [ ] **Step 2: Implement consistent focus/hover/pressed/disabled states, smoother transitions, responsive spacing, reduced-motion media support, and clearer interaction hierarchy without changing data contracts.**
- [ ] **Step 3: Verify the existing JS selectors still resolve and run lightweight syntax/static checks.**

### Task 6: Cohesive verification and single integration

**Files:**
- No new product files beyond the tasks above.

- [ ] **Step 1: Run all available automated/static tests and check changed C# files for obvious Unity API/version incompatibilities.**
- [ ] **Step 2: Review the complete diff for public API regressions, allocations in hot paths, and accidental visual-contract changes.**
- [ ] **Step 3: Create one final cohesive integration commit on `upgrade/animation-uiux-major` after all changes are verified.**
- [ ] **Step 4: Open one pull request against `main` containing the complete upgrade, rather than deploying/pushing many partial versions.**
- [ ] **Step 5: Report exactly what was verified and what requires a Unity Editor/Play Mode run if that environment is unavailable here.**
