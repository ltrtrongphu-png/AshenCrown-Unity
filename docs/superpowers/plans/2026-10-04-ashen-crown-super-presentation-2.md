# Ashen Crown Super Presentation 2.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the previous animation/UI polish into a cohesive presentation system with smoother character motion, combat feedback, cinematic HUD, accessibility controls, and a deeper web showcase.

**Architecture:** Preserve the prototype-safe AnimatorSafe layer and existing gameplay state machines. Add a presentation director and data-read adapters that observe existing movement/combat/health state without replacing authoritative gameplay logic, then add a web-only presentation layer that does not alter gameplay data contracts.

**Tech Stack:** Unity 2021.3 LTS+, C#, Animator, legacy Input Manager compatibility, existing OnGUI HUD, vanilla HTML/CSS/ES modules.

## Global Constraints
- Unity target remains 2021.3 LTS+.
- No third-party runtime packages or new asset dependency.
- Existing public gameplay APIs remain compatible.
- Presentation code must tolerate missing Animator controllers, parameters, player objects, and camera objects.
- No per-frame LINQ, heap collections, or repeated component creation.
- Reduced Motion must remove nonessential pulses/camera bob while preserving functional HUD feedback.
- Web UI must remain usable by keyboard, touch, and reduced-motion users.

## Review Focus
- A scene with no Animator Controller still runs without errors.
- Micro jitter near zero movement does not create visible locomotion noise.
- Dynamic player respawn does not leave stale event subscriptions.
- Camera presentation restores its previous offset when disabled or interrupted.
- HUD scale/alpha remains bounded and does not make essential information unreadable.

### Task 1: Animation motion model
**Files:** \`Assets/Scripts/Animation/AnimationPresentationController.cs\`, \`Assets/Scripts/Animation/AnimationPresentationMath.cs\`
**Deliverable:** dead-zone locomotion, normalized motion, safe playback-speed clamping, action de-duplication.

### Task 2: Runtime character/combat bridge
**Files:** \`Assets/Scripts/Animation/AnimationPolishBootstrap.cs\`, \`Assets/Scripts/Player/PlayerCombatSystem.cs\`, \`Assets/Scripts/Combat/CombatPresentationFeedback.cs\`
**Deliverable:** automatic scene integration, public presentation read model, hit-confirmed feedback, camera bob/impact/roll, reduced-motion compliance.

### Task 3: Cinematic HUD
**Files:** \`Assets/Scripts/UI/CinematicHUDDirector.cs\`, \`Assets/Scripts/UI/CinematicHUDMath.cs\`, \`Assets/Scripts/UI/SettingsHUD.cs\`, \`Assets/Tests/EditMode/SuperPresentationTests.cs\`
**Deliverable:** player/target bars, stamina/ultimate, skill readiness, lock-on reticle, combat messages, UI scale/alpha/reduced-motion controls.

### Task 4: Web showcase 2.0
**Files:** \`play.html\`, \`play-polish.css\`, \`play.js\`
**Deliverable:** viewport chrome, cinematic reticle, live-state classes, focus/keyboard/touch polish, pointer ambience, reduced-motion mode.

### Task 5: Single integration
**Files:** plan/documentation plus all above.
**Deliverable:** one cohesive commit atop the existing presentation branch, with one PR update rather than many partial deployments.
