# Systems status (static source review)

Status vocabulary: **Prototype** = code exists but lacks an end-to-end verified path; **Partial** = meaningful code exists but an explicitly documented capability is incomplete; **Not verified** = runtime/Editor behavior has not been proven in this environment.

| System | Code/data | UI | Save | Tests | Initial status |
|---|---|---|---|---|---|
| Player movement/camera/combat | Core scripts exist | IMGUI HUDs and camera overlays | Player state captured by save system | Partial EditMode tests only | Prototype; no Unity compile/run |
| Enemy FSM/boss phases | FSM, boss phase/attack logic | Boss HUD exists | Relevant player/world state partly saved | No verified PlayMode coverage | Prototype |
| Inventory/equipment/loot/progression | Systems and item data exist; several defaults are code-defined | Equipment/shop/progression HUDs | Capture/restore paths exist | One EditMode test source | Partial; not Editor-tested |
| Quest/dialogue/NPC | System scripts and dialogue/quest UI exist | Yes, prototype HUD | Some quest state captured | Coverage not verified | Prototype |
| Codex | Stores unlocked IDs and exposes events/capture/restore | No dedicated full codex viewer confirmed | Capture/restore API exists | No dedicated tests identified | Partial |
| Crafting | Three hard-coded recipes | No dedicated crafting UI confirmed | No dedicated crafting capture path confirmed | No dedicated tests identified | Partial |
| Reputation/world events | State logic and capture/restore methods exist | Dedicated UI not confirmed | Capture/restore methods exist | No dedicated tests identified | Partial |
| Endgame/long-term engagement | Contracts/mastery/season-related logic exists | Long-term engagement HUD | Capture path present | Not verified | Prototype |
| Web story demo | Three.js browser gameplay and local/cloud save adapters exist | Browser UI | `localStorage['ashen-crown-3d']` and optional cloud | Build syntax/static checks intended; runtime not verified here | Browser prototype |
| Supabase browser saves | Client integration plus migration 002 in this branch | Account/sign-in UI | RLS migration authored, not applied/tested against real Supabase here | Two-account RLS test pending | Implemented in source; deployment unverified |
| Supabase Unity save | Unity client points at `player_saves` | Prototype sign-in UI | Uses existing migration 001 fields | Auth flow incomplete | Partial |

This matrix is intentionally conservative. It must be updated after Unity Editor, browser, and Supabase tests; it is not a claim that all features are production-ready.
