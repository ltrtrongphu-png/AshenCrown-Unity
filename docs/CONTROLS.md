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


## Browser demo — phone controls and app management

The browser game exposes a touch joystick and action buttons on narrow/touch layouts. The mobile command dock provides quick access to the inventory, world map, journal, pause and the Field Manager. The Field Manager shows the current build, connection state, local-save state, cloud-sync state, chapter/quest progress, and shortcuts for Sanctuary, role, settings, archive, help, save export/import and PWA installation.

Automatic version checks are enabled by default. The app checks its service worker at startup, when returning to the tab/network, and every five minutes while visible. New builds use a content-derived build ID. The page saves and verifies the encrypted local v5 save before an automatic refresh; refresh waits until the player has left active menus/dialogue/combat. Automatic updates can be disabled in Field Manager, and an update can be applied manually when safe.

The Install / Add to Home Screen action uses the browser's install prompt where available. Browsers that do not expose that prompt receive platform-specific instructions instead. Installation and offline cache support depend on browser support and an HTTPS (or localhost) origin. The mobile field manager is for the browser demo and is not an assertion that Unity's native mobile build has been tested.
