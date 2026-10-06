# Ashen Crown: The Last Ember — Source Code (Unity / C#)

Bộ mã nguồn lõi cho 3D Dark Fantasy ARPG (Soulslike), viết cho **Unity 2021.3 LTS trở lên**
(đã tránh API chỉ có ở bản mới). Input dùng **Input Manager cũ**:
`Project Settings > Player > Active Input Handling = Input Manager (Old)` hoặc `Both`.

Chép thư mục `Assets/Scripts` vào project của bạn là dùng được.

> **Trạng thái repo:** Có bộ gameplay C# cho Unity và một story demo chạy trên trình duyệt bằng Three.js. Repo hiện chưa có `ProjectSettings/`, `Packages/` hay scene Unity hoàn chỉnh; cần tạo project Unity rồi nhập `Assets/` để tích hợp và kiểm tra trong Unity Editor. Story demo trên web không phải bản build Unity.

## Vercel deployment

Vercel is configured to deploy only the browser experience:

- `node tools/build-web.mjs` creates an allow-listed `dist/` containing the two HTML pages, their CSS/JS, and the site logo.
- `vercel.json` skips dependency installation, publishes `dist/`, keeps clean URLs, and sets static caching plus baseline security headers.
- Unity C# sources, GLB models, texture maps, Supabase migrations, backend code, and documentation remain in GitHub and are excluded from the Vercel CLI upload by `.vercelignore`.
- No `ignoreCommand` is configured: Vercel marks ignored builds as canceled, and canceled builds still count toward deployment quotas.

Connect the repository root to Vercel and leave the build and output settings to `vercel.json`. The build has no npm dependencies. The site still loads Three.js and Google Fonts from their pinned public CDNs at runtime.

---

## 1. Sơ đồ kiến trúc

```
                         ┌─────────────────────────────┐
                         │  Core/CombatInterfaces.cs   │
                         │  DamageInfo · DamageResult  │
                         │  IDamageable · IDamageFilter│
                         │  IStaggerable · ITimeSlowable│
                         └──────────────┬──────────────┘
                                        │ (mọi module chỉ nói chuyện qua đây)
   ┌────────────────────────────────────┼────────────────────────────────────┐
   │ PLAYER                             │                                    │
   │                                    ▼                                    │
   │  ThirdPersonCameraRig ◄──── PlayerMovementAndCamera ◄──── PlayerCombatSystem
   │   (camera, shake, FOV)       (đi, sprint, lock-on)     ▲   (combo, dodge, parry, skill)
   │         ▲  Shake()                  ▲                  │          │
   │         └───────────────────────────┼──────────────────┘          │ TakeDamage()
   │                                     │ PlayerStamina               │
   │                                     └─ (sprint + combat dùng chung)
   │                                                                   │
   │   HealthAndDamageSystem ◄── IDamageFilter (PlayerCombatSystem: I-frame/Perfect Dodge/Block/Parry)
   └───────────────────────────────────────────────────────────────────┼─────┘
                                                                       │
        ┌──────────────────────────────────────────────────────────────┤
        ▼                                                              ▼
 ┌────────────────────┐    TakeDamage()      ┌───────────────────────────────┐
 │ EnemyFSM           │ ───────────────────► │ HealthAndDamageSystem (Player) │
 │ Patrol/Chase/Attack│ ◄─── ITimeSlowable ─ │   (Perfect Dodge = Sương T.Gian)│
 │ Staggered/Die      │ ◄─── IStaggerable ── │   (Parry = Choáng Tẩy)          │
 │ + MagicProjectile  │                      └───────────────────────────────┘
 │ + GroundHazard     │
 └────────────────────┘
 ┌────────────────────┐   events   ┌──────────────────┐
 │ BossController     │ ─────────► │ BossHealthBarUI  │
 │ 3 phase + Enrage   │            │ máu · giáp · phase│
 └────────────────────┘            └──────────────────┘
```

**Luồng một đòn đánh:** `PlayerCombatSystem` quét hitbox → `IDamageable.TakeDamage(DamageInfo)` →
`HealthAndDamageSystem` chạy các `IDamageFilter` → kháng thuộc tính → giáp → trừ máu/Poise → bắn sự kiện
(`OnDamaged`, `OnPoiseBroken`, `OnDeath`) → `EnemyFSM`/`BossController`/UI phản ứng.

**Luồng phòng thủ:** kẻ địch gọi `TakeDamage` lên Player → `HealthAndDamageSystem` gọi
`PlayerCombatSystem.TryNegate()`: I-frame → Perfect Dodge → Parry → Block giảm sát thương.

---

## 2. Cấu trúc file

| File | Module | Vai trò |
|---|---|---|
| `Core/CombatInterfaces.cs` | nền | Struct & interface dùng chung |
| `Core/AnimatorSafe.cs` | nền | Gọi Animator an toàn (chưa có controller vẫn chạy) |
| `Player/PlayerStamina.cs` | 1 | Thể lực |
| `Player/PlayerMovementAndCamera.cs` | 1 | Di chuyển 8 hướng, Sprint, Lock-On |
| `Player/ThirdPersonCameraRig.cs` | 1 | Camera qua vai, chống xuyên tường, rung |
| `Player/PlayerCombatSystem.cs` | 2 | Combo, Heavy, Dodge, Perfect Dodge, Block/Parry, Q/E/R |
| `Enemy/EnemyFSM.cs` | 3 | FSM: Patrol, Chase, Attack, Staggered, Die |
| `Enemy/MagicProjectile.cs`, `GroundHazard.cs` | 3 | Đạn ma thuật, bẫy dưới chân |
| `Combat/HealthAndDamageSystem.cs` | 4 | Máu, giáp, Poise, kháng, tính sát thương |
| `Combat/DamageFloatingText.cs` | 4 | Chữ sát thương bay (không cần prefab) |
| `Boss/BossController.cs` | 5 | Boss 3 phase, Enrage, Poise |
| `UI/BossHealthBarUI.cs` | 5 | Thanh máu/giáp boss |

---

## 3. Cài đặt nhanh (prototype bằng Capsule)

**Layer & Tag:** tạo layer `Enemy`, `Environment`; gán tag `Player` cho nhân vật.

**Player** (Capsule, Tag = Player):
`CharacterController` + `PlayerStamina` + `PlayerMovementAndCamera` + `HealthAndDamageSystem` + `PlayerCombatSystem`
(nhấn **Reset** trên PlayerCombatSystem để nạp sẵn thông số combo/skill mặc định).
- `PlayerMovementAndCamera`: Lock On Mask = `Enemy`; Obstruction Mask = `Environment` (đừng chọn Enemy).
- `PlayerCombatSystem`: Enemy Mask = `Enemy`. Gán `Camera Rig` nếu muốn rung màn hình.
- `HealthAndDamageSystem`: Max Health 100–150, Defense 10, Max Poise 30.

**Camera:** gắn `ThirdPersonCameraRig` lên Main Camera (không làm con của Player), gán Follow Target = Player,
Movement = script của Player, Collision Mask = `Environment`.

**Enemy** (Capsule, layer = Enemy): `NavMeshAgent` + `HealthAndDamageSystem` + `EnemyFSM`.
Bake NavMesh trước. Chọn `Archetype` (Minion / Ranged / Elite) và điền mảng `Attacks`:
- Minion: 1 đòn Melee (maxRange ~2.2).
- Ranged: đòn `Projectile` (maxRange ~14) + đòn `GroundTrap`; gán prefab `MagicProjectile`/`GroundHazard`.
- Elite: thêm một đòn `Unblockable` (đèn báo đỏ) — nên gắn một `Light` vào `Telegraph Light`.
Ragdoll: nếu model có các Rigidbody trên xương con thì tự bật khi chết (đặt chúng ở layer riêng, ví dụ `Ragdoll`,
để lock-on không bắt nhầm).

**Boss:** như Enemy nhưng dùng `BossController` thay `EnemyFSM`; điền `Phases` (mẫu cấu hình ở comment đầu file).
UI: dựng Canvas theo hướng dẫn ở đầu `BossHealthBarUI.cs`.

---

## 4. Điều khiển mặc định

| Phím | Hành động |
|---|---|
| WASD | Di chuyển 8 hướng (theo hướng camera) |
| Shift | Sprint (tốn Stamina) |
| Tab / Chuột giữa | Bật/tắt Lock-On; vuốt chuột ngang khi đang khoá để đổi mục tiêu |
| Chuột trái | Chém nhẹ (combo 4 đòn, có input buffer) |
| Chuột phải (giữ → thả) | Đòn nặng tích lực, đầy ở 1.5s |
| F (giữ) | Block; bấm trong 0.2s đầu = **Parry** (phản 200% + Choáng Tẩy) |
| Space | Lăn né (0.3s I-frame). Né sát lúc trúng (0.1s) = **Perfect Dodge** |
| Q / E | Void Thrust / Ashen Eruption |
| R | Soul Harvest (cần đầy thanh Ultimate, nạp khi gây sát thương) |

## 5. Animator (tuỳ chọn)

Mọi lời gọi Animator đều "an toàn": thiếu parameter/state thì bỏ qua.
- Player parameters: `Speed, MoveX, MoveZ` (float) · `Sprint, LockedOn, Blocking` (bool) · `Parry, Hurt, Die, SoulHarvest` (trigger).
- Player states gọi bằng tên: `Light1..Light4, Heavy, HeavyCharge, Roll, Backstep, VoidThrust, AshenEruption`.
- Enemy/Boss: `Speed` (float) · `Attack` hoặc `animTrigger` của từng đòn, `Stagger, Execute, Die, PhaseTransition, Enrage` (trigger).

## 6. Ghi chú thiết kế quan trọng

- **Perfect Dodge** = đòn trúng trong `perfectDodgeWindow` (0.1s đúng spec) kể từ lúc bấm né. Khung này rất hẹp,
  nếu playtest thấy quá khó hãy nâng lên 0.15–0.2s trong Inspector.
- **Đòn `requiresPerfectDodge`** (boss Phase 3, toàn bản đồ): I-frame lăn thường **không** cứu được.
- **Hyper-Armor** chỉ chặn ngắt chiêu/hất tung; Parry vẫn đưa Elite vào Execute State (trừ đòn Unblockable).
- **Hitbox** của Player là quét cầu + lọc góc quạt (ổn định, dễ chỉnh). Muốn bám vũ khí thật, thay phần
  `ProcessHits()` bằng collider trên xương kiếm, giữ nguyên `ApplyHit()`.
- Chưa có trong bản này (để dành cho các bước sau): hệ thống Hồn Tàn/Trạm Phong Ấn, loot table, UI HUD người chơi,
  save/load. `EnemyFSM.OnEnemyKilled(enemy, soulsReward)` đã sẵn để nối vào hệ thống tiền tệ.
- Mã chưa được biên dịch trong Unity editor tại thời điểm xuất file — nếu gặp lỗi biên dịch do khác phiên bản, báo mình để sửa.


## 7. Eternal World / Long-Term Campaign

The upgraded framework supports a long-running ARPG campaign:
- 8 acts: Prologue, Ashen March, Hollow Kingdom, Veil Sea, Crownlands, Starless Depths, Last Ember, and New Game Plus.
- Persistent world flags, unlocked regions, defeated bosses, and story cycles.
- Quest graph with prerequisites and Talk, Kill, Collect, Explore, and Boss objectives.
- NPC interaction with mouse click or E, branching dialogue, story flags, and reputation.
- Sample NPCs: Lyra, Orren, and The Seer; capsule fallback visuals can be replaced by real 3D prefabs.
- Long-term progression: level/XP, Essence, Prestige, relic slots, and New Game Plus cycles.
- Crafting, faction reputation, lore codex, and rotating world events.
- Save/Load v2 persists campaign, quests, reputation, codex, and progression.
- Five languages: English, Vietnamese, Japanese, Korean, and Chinese Simplified.

## 8. 3D Model Pipeline

CharacterModelBinder supports one runtime pipeline for Unity-imported FBX or GLB prefabs:
1. Import the model into Unity.
2. For automatic loading, put the prefab/model under Resources and set ModelSource.assetGuid to its Resources path.
3. Or assign ModelSource.modelPrefab directly.
4. The model Animator is connected automatically.
5. ModelPerformanceProfile provides distance/shadow tuning and a LOD foundation.
6. If no imported model prefab is assigned, the system uses a 3D capsule fallback so scenes remain runnable.

Original production character assets are included under `Assets/Models`: the rigged Ashen Sentinel and Ashen Regent GLBs, with 1024 px PBR texture maps and source animation clips. Unity needs a compatible GLB importer to bring them into the project. See `Assets/Models/README.md` for import and prefab setup.


## 9. Multi-Camera Gameplay

- **1** — First Person: camera at the character's head, direct camera-aligned attacks.
- **2** — Shoulder Camera: close over-the-shoulder combat view.
- **3** — Third Person: wider classic action-RPG view.
- **V** — cycle all camera modes.
- **C** — swap left/right shoulder in modes 2/3.
- **Z** — temporary combat zoom.
- Camera collision prevents clipping through level geometry.
- Lock-on works across all three views.
- Sprint changes FOV dynamically.
- Camera shake respects the Reduced Motion setting.
- Camera mode and shoulder preference persist through PlayerPrefs.

## 10. Eternal Engagement / Endgame Loop

A meta-progression layer now sits above the main campaign so the game has long-term goals without requiring an online service:
- **Rotating weekly contracts** for combat, story and exploration.
- **Seasonal Journey** with quarterly identity, Journey Points and 10 milestone reward tiers.
- **Mastery** XP/ranks for weapons, builds, expeditions or future archetypes.
- **Persistent achievements** for combat, bosses, evasion, parries, levels and collections.
- **Collection registry** for discoveries that can later feed relics, lore, cosmetics or a museum.
- **Legacy progression** that continues beyond the normal character level.
- **Endless Expeditions** from tier 1–20 with deterministic modifiers, escalating rooms and rewards.
- **Offline-first save/load** for the entire meta layer.
- **Lightweight HUD**: F11 toggles the panel and F10 refreshes the current rotation.

Gameplay systems can wire into the layer through LongTermEngagementSystem.Instance.RecordAction(...), AddMastery(...), and AddCollection(...).

### Endgame controls
- **F12** — start an Expedition at the selected tier.
- **PageUp / PageDown** — choose Expedition tier 1–20.
- **F7** — advance one Expedition room.
- **F8** — claim all completed rotating contracts.
- **F10** — refresh the current rotation.
- **F11** — toggle the endgame HUD.

## 11. Grind / Gear / Accounts

The progression loop now includes:
- 8 gear tiers: Broken -> Common -> Uncommon -> Rare -> Epic -> Legendary -> Mythic -> Ascendant.
- 8 equipment slots: Helmet, Chest, Gloves, Legs, Boots, Weapon, Offhand and Relic.
- Random gear power, stat rolls and affixes from enemies/bosses.
- Gear upgrading with Essence and a salvage loop that converts unwanted gear back into Essence.
- Persistent loot collection and equipped gear in save data.
- Dynamic quality scaling: the performance director adjusts Unity quality based on frame-rate pressure while keeping the target frame rate configurable.
- Account foundation: email/password registration and login through Supabase Auth, with cloud save restore after login.
- Secure cloud saves: each account can access only its own save through RLS policies.

### Account setup
Create a SupabaseConfig asset under Assets/Resources/ using the public project URL and publishable key. Never put a Supabase secret/service-role key in the Unity client. Apply supabase/migrations/001_ashen_crown_accounts.sql to the Supabase project used by Ashen Crown before enabling cloud saves.

The account layer is configuration-based so the repository does not contain credentials or silently write to an unrelated Supabase project.


## 12. Character Settings / 3D Appearance / NPC Quests

The player-facing loop now includes:
- **F1 Settings**: accessibility, volume, target FPS, shadow preference and character appearance.
- **Character appearance**: four ready-to-use presets, body scale, skin/hair/outfit color presets, persisted in PlayerPrefs and save data.
- **3D cosmetics**: the runtime appearance layer adds lightweight cosmetic geometry when no production character accessories exist, while real imported models can still be supplied through CharacterModelBinder.
- **NPC quest flow**: walk within interaction range and press **E** to talk; an NPC with an available quest shows a **!** marker and automatically offers the next valid quest.
- **J Quest HUD**: shows active objectives and progress.
- Story quests chain through Lyra -> Orren -> The Seer using the existing quest prerequisites and world progression.
- Appearance state is included in save/cloud-save JSON, so it can be restored with the character profile.

### New controls
- **F1** — Settings / Character customization
- **J** — Quest tracker
- **E** — Interact with nearby NPC / accept available quest


## 13. Session Reliability / Autosave

The runtime now includes a session persistence director:
- Autosave every 120 seconds by default.
- Checkpoint save when a single-mode scene loads.
- Checkpoint on application pause/focus loss.
- Local save metadata records UTC timestamp and save reason.
- Daily world events persist through save/load and automatically roll over when the UTC day changes.
- F2 toggles the compact progression/profile HUD.
- The profile HUD shows level, XP progress, Essence, Prestige, Journey/Legacy progress, active Expedition room state, and the next autosave.

F5 remains the manual save shortcut and F9 remains the local load shortcut.

## 14. 3D Model + Texture Quality Pipeline

The presentation layer now has a dedicated quality/performance path for production 3D assets:

- `Presentation/ModelPerformanceProfile.cs` controls LOD thresholds, cross-fade, shadow distance, animator culling and skinned-mesh offscreen updates.
- `Presentation/CharacterModelBinder.cs` uses cached renderers/camera references, supports authored `LODGroup` data from FBX/GLB prefabs, adds real multi-LOD geometry to the procedural fallback, and distance-culls the visual model/animator.
- `Presentation/TexturePerformanceProfile.cs` provides centralized texture targets for characters, environments and UI.
- `Editor/Art/ArtAssetPipeline.cs` automatically applies mipmaps, texture streaming, anisotropic filtering, compression, max texture sizes, mesh optimization and removal of unnecessary model cameras/lights during import.
- `Performance/PerformanceDirector.cs` now uses interval-average FPS with hysteresis/cooldown instead of reacting to a single frame, and keeps Unity texture streaming enabled after quality changes.
- `Presentation/Item3DPresentationSystem.cs` reuses tier material variants and disables shadows on decorative item particles to reduce draw/state churn.

The repository includes the Ashen Sentinel and Ashen Regent character meshes plus authored PBR texture maps. The importer pipeline optimizes these and later FBX/GLB assets when they are brought into the consuming Unity project.
