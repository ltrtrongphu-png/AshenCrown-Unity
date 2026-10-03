# Ashen Crown: The Last Ember — Source Code (Unity / C#)

Bộ mã nguồn lõi cho 3D Dark Fantasy ARPG (Soulslike), viết cho **Unity 2021.3 LTS trở lên**
(đã tránh API chỉ có ở bản mới). Input dùng **Input Manager cũ**:
`Project Settings > Player > Active Input Handling = Input Manager (Old)` hoặc `Both`.

Chép thư mục `Assets/Scripts` vào project của bạn là dùng được.

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
