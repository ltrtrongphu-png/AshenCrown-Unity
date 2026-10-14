# Controls (source-derived; runtime verification pending)

## Unity C# gameplay

| Input | Current default behavior |
|---|---|
| W / A / S / D | Move |
| Left Shift | Sprint |
| Mouse movement | Camera look |
| Left mouse button | Light attack |
| Right mouse button | Heavy attack |
| F | Block |
| Space | Dodge |
| Q / E / R | Skill inputs 1–3 |
| Tab | Lock-on |
| V | Cycle camera mode |
| C | Swap camera shoulder |
| 1 / 2 / 3 | First-person / shoulder / third-person camera mode |
| Z | Camera zoom |
| I | Toggle equipment HUD |
| L | Test loot roll, Editor/Development builds only |
| F5 / F9 | Debug save / load, Editor/Development builds only |

**Known input overlap:** `E` appears both as Unity skill input 2 and as a common interaction key in the prototype instructions; this needs a deliberate remap decision before a production controls pass. The Unity HUDs still use IMGUI and have not been verified against a running scene.

## Browser story demo

| Input | Behavior shown in the game tutorial/source |
|---|---|
| W / A / S / D | Move |
| Mouse | Look around |
| E / G | Interact guidance |
| 1 / 2 / 3 | Role skills |
| Left mouse button / F | Ember Pulse guidance |
| Left Shift | Sprint |
| Space | Dodge |
| I / E | Inventory guidance |
| M | World map |

Some in-demo help labels overlap (notably E and F). Treat this as a source-derived list, not a claim that every mapping has passed a browser interaction test. Debug keys are not intended to be available in Unity release builds.
