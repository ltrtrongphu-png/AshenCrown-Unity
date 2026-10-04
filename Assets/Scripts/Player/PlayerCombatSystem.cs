using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using AshenCrown.Core;
using AshenCrown.Combat;

namespace AshenCrown.Player
{
    public enum AttackShape
    {
        Arc,   // Quạt phía trước (đòn chém thường / nặng)
        Dash,  // Lướt tới rồi đâm xuyên (Void Thrust)
        Aoe    // Vòng tròn quanh người (Ashen Eruption)
    }

    /// <summary>Thông số một đòn đánh. Chỉnh trong Inspector. Mọi thời gian tính bằng giây.</summary>
    [Serializable]
    public class AttackProfile
    {
        public string name = "Attack";
        [Tooltip("Tên state trong Animator để CrossFade (để trống nếu chưa có animation)")]
        public string animState;
        public AttackShape shape = AttackShape.Arc;
        public float damageMultiplier = 1f;
        public float poiseDamage = 20f;
        public float staminaCost = 10f;
        [Header("Nhịp đòn")]
        public float windup = 0.18f;     // gồng tay (chưa trúng)
        public float active = 0.12f;     // khung hình gây sát thương (hitbox bật)
        public float recover = 0.30f;    // thu chiêu (có thể huỷ bằng né / chain combo)
        [Header("Hitbox")]
        public float range = 2.4f;
        public float arcAngle = 110f;
        public float aoeRadius = 0f;
        [Header("Chuyển động")]
        public float lungeDistance = 0.8f;
        public float dashDistance = 0f;
        public float knockback = 0f;
        [Header("Cảm giác đánh")]
        public float hitStopDuration = 0.04f;
        public float cameraShake = 0.08f;
        public bool armorPiercing;
    }

    /// <summary>
    /// MODULE 2 - Chiến đấu của người chơi.
    ///
    /// Điều khiển mặc định (đổi được trong Inspector):
    ///   LMB: chém nhẹ (combo 4 đòn)   | RMB (giữ rồi thả): đòn nặng tích lực 1.5s
    ///   F (giữ): Block, bấm đúng 0.2s đầu = Parry (phản 200% + Choáng Tẩy)
    ///   Space: lăn né (0.3s I-frame; né sát lúc trúng = Perfect Dodge -> Sương Thời Gian)
    ///   Q: Void Thrust | E: Ashen Eruption | R: Soul Harvest (cần đầy thanh Ultimate)
    ///
    /// Máy trạng thái: Idle / Attacking(Windup-Active-Recover) / Charging / Dodging / Blocking / Hurt / Dead.
    /// Cũng là một IDamageFilter: HealthAndDamageSystem gọi TryNegate() trước khi trừ máu để xử lý
    /// I-frame, Perfect Dodge, Block và Parry.
    /// </summary>
    [RequireComponent(typeof(PlayerMovementAndCamera))]
    [RequireComponent(typeof(PlayerStamina))]
    [RequireComponent(typeof(HealthAndDamageSystem))]
    public class PlayerCombatSystem : MonoBehaviour, IDamageFilter
    {
        enum CombatState { Idle, Attacking, Charging, Dodging, Blocking, Hurt, Dead }
        enum AttackPhase { Windup, Active, Recover }
        enum ActionKind { Light, Heavy, Skill }

        [Header("Tham chiếu")]
        [SerializeField] Animator animator;
        [SerializeField] ThirdPersonCameraRig cameraRig;
        [Tooltip("Layer của kẻ địch để quét hitbox / Sương Thời Gian")]
        [SerializeField] LayerMask enemyMask;

        [Header("Chỉ số tấn công")]
        [SerializeField] float baseDamage = 25f;
        [SerializeField, Range(0f, 1f)] float critChance = 0.1f;
        [SerializeField] float critMultiplier = 1.5f;

        [Header("Input")]
        [SerializeField] KeyCode lightKey = KeyCode.Mouse0;
        [SerializeField] KeyCode heavyKey = KeyCode.Mouse1;
        [SerializeField] KeyCode blockKey = KeyCode.F;
        [SerializeField] KeyCode dodgeKey = KeyCode.Space;
        [SerializeField] KeyCode skill1Key = KeyCode.Q;
        [SerializeField] KeyCode skill2Key = KeyCode.E;
        [SerializeField] KeyCode ultimateKey = KeyCode.R;

        [Header("Combo nhẹ (4 đòn)")]
        [SerializeField] AttackProfile[] lightCombo;
        [SerializeField] float comboResetTime = 0.8f;
        [Tooltip("Thời gian nhớ phím bấm sớm (input buffer)")]
        [SerializeField] float inputBufferTime = 0.4f;
        [Tooltip("Có thể huỷ thu chiêu để chain/né sau khi qua tỉ lệ này của recover")]
        [SerializeField, Range(0f, 1f)] float cancelFraction = 0.45f;

        [Header("Đòn nặng (tích lực)")]
        [SerializeField] AttackProfile heavyAttack;
        [SerializeField] float chargeTime = 1.5f;
        [SerializeField] float heavyStaminaCost = 25f;
        [SerializeField] float heavyMinMultiplier = 1.2f;
        [SerializeField] float heavyMaxMultiplier = 3.2f;
        [SerializeField] float chargeMoveSpeed = 0.35f;
        public event Action OnChargeFull;

        [Header("Lăn né & Perfect Dodge")]
        [SerializeField] float dodgeStaminaCost = 20f;
        [SerializeField] float dodgeDuration = 0.5f;
        [SerializeField] float iFrameDuration = 0.3f;
        [Tooltip("Hit đến trong khoảng này kể từ lúc bấm né = Perfect Dodge (spec: 0.1s)")]
        [SerializeField] float perfectDodgeWindow = 0.1f;
        [SerializeField] float dodgeDistance = 5.5f;
        [SerializeField] float dodgeMoveTime = 0.4f;
        [SerializeField] float backstepDistance = 3.2f;
        [Header("Sương Thời Gian (Perfect Dodge)")]
        [SerializeField] float timeMistRadius = 14f;
        [SerializeField, Range(0.02f, 1f)] float timeMistSlowFactor = 0.15f;
        [SerializeField] float timeMistDuration = 2f;
        [SerializeField, Range(0f, 1f)] float timeMistStaminaRefund = 0.2f;
        public event Action OnPerfectDodge;

        [Header("Block & Parry")]
        [SerializeField] float blockStaminaCost = 12f;
        [SerializeField, Range(0f, 1f)] float blockDamageReduction = 0.7f;
        [SerializeField] float blockAngle = 120f;
        [SerializeField] float blockMoveSpeed = 0.5f;
        [SerializeField] float parryWindow = 0.2f;
        [SerializeField] float parryReflectMultiplier = 2f;
        [SerializeField] float executeDuration = 2.5f;
        public event Action<GameObject> OnParry;

        [Header("Kỹ năng")]
        [SerializeField] AttackProfile voidThrust;       // Q
        [SerializeField] float voidThrustCooldown = 6f;
        [SerializeField] AttackProfile ashenEruption;    // E
        [SerializeField] float ashenEruptionCooldown = 10f;
        [Header("Soul Harvest (R - Ultimate)")]
        [SerializeField] float ultimateMax = 100f;
        [SerializeField] float ultimateGainPerHit = 6f;
        [SerializeField] float soulHarvestDuration = 12f;
        [SerializeField] float soulHarvestAttackSpeedBonus = 0.5f;   // +50% tốc đánh
        [SerializeField] float soulHarvestDamageBonus = 1.0f;        // +100% sát thương
        [SerializeField] float soulHarvestLifesteal = 0.25f;         // hút 25% sát thương gây ra

        [Header("Cảm giác đánh")]
        [SerializeField] bool enableHitStop = true;
        [SerializeField] float hurtStaggerDuration = 0.45f;

        // ----- Sự kiện / trạng thái cho UI & VFX -----
        public event Action<AttackProfile> OnAttackStarted;
        public event Action<AttackProfile> OnAttackActive;     // bật VFX/SFX lưỡi chém tại khung này
        public event Action<int> OnSkillCast;                  // 0 = Q, 1 = E, 2 = R
        public float UltimateGauge01 => ultimateGauge / ultimateMax;
        public bool UltimateReady => ultimateGauge >= ultimateMax && !SoulHarvestActive;
        public bool SoulHarvestActive => soulHarvestRemaining > 0f;
        public float SoulHarvestRemaining => soulHarvestRemaining;
        public float GetSkillCooldown01(int index) // 1 = vừa dùng, 0 = sẵn sàng (UI icon)
        {
            float max = index == 0 ? voidThrustCooldown : ashenEruptionCooldown;
            return Mathf.Clamp01(cooldowns[index] / max);
        }

        // ----- Nội bộ -----
        PlayerMovementAndCamera movement;
        PlayerStamina stamina;
        HealthAndDamageSystem health;
        StatBlock statBlock;

        CombatState state = CombatState.Idle;
        AttackPhase phase;
        ActionKind kind;
        AttackProfile current;
        float phaseTimer;
        bool activeStarted;
        float chargeRatio;

        int nextLightIndex;
        float lastLightEnd = -99f;
        bool bufferedLight;
        float bufferExpire;

        float chargeTimer; bool chargeFullNotified;
        float dodgeElapsed;
        float blockTimer;
        float hurtTimer;

        readonly float[] cooldowns = new float[2];
        float ultimateGauge;
        float soulHarvestRemaining;

        readonly HashSet<IDamageable> hitSet = new HashSet<IDamageable>();
        static readonly Collider[] Buffer = new Collider[48];
        bool hitStopping;

        float AttackSpeedMultiplier => SoulHarvestActive ? 1f + soulHarvestAttackSpeedBonus : 1f;
        float DamageBuff => SoulHarvestActive ? 1f + soulHarvestDamageBonus : 1f;

        /// <summary>Đang trong khung bất tử của lăn né.</summary>
        public bool IsInvulnerable => state == CombatState.Dodging && dodgeElapsed <= iFrameDuration;

        // Thiết lập mặc định khi gắn component lần đầu (hoặc nhấn Reset trong Inspector).
        void Reset()
        {
            lightCombo = new[]
            {
                new AttackProfile { name = "Light1", animState = "Light1", damageMultiplier = 0.8f, poiseDamage = 12f, staminaCost = 8f,  windup = 0.14f, active = 0.12f, recover = 0.28f, lungeDistance = 0.9f },
                new AttackProfile { name = "Light2", animState = "Light2", damageMultiplier = 0.9f, poiseDamage = 12f, staminaCost = 8f,  windup = 0.14f, active = 0.12f, recover = 0.28f, lungeDistance = 0.9f },
                new AttackProfile { name = "Light3", animState = "Light3", damageMultiplier = 1.0f, poiseDamage = 15f, staminaCost = 9f,  windup = 0.16f, active = 0.14f, recover = 0.30f, lungeDistance = 1.0f },
                new AttackProfile { name = "Light4", animState = "Light4", damageMultiplier = 1.6f, poiseDamage = 30f, staminaCost = 14f, windup = 0.24f, active = 0.16f, recover = 0.50f, lungeDistance = 1.4f, range = 2.8f, arcAngle = 140f, hitStopDuration = 0.07f, cameraShake = 0.15f },
            };
            heavyAttack = new AttackProfile { name = "Heavy", animState = "Heavy", poiseDamage = 60f, windup = 0.10f, active = 0.18f, recover = 0.55f, range = 3.0f, arcAngle = 150f, lungeDistance = 1.6f, hitStopDuration = 0.09f, cameraShake = 0.22f };
            voidThrust = new AttackProfile { name = "VoidThrust", animState = "VoidThrust", shape = AttackShape.Dash, damageMultiplier = 1.8f, poiseDamage = 35f, staminaCost = 0f, windup = 0.08f, active = 0.25f, recover = 0.25f, range = 1.9f, arcAngle = 140f, dashDistance = 9f, lungeDistance = 0f, armorPiercing = true, hitStopDuration = 0.06f };
            ashenEruption = new AttackProfile { name = "AshenEruption", animState = "AshenEruption", shape = AttackShape.Aoe, damageMultiplier = 2.2f, poiseDamage = 50f, staminaCost = 0f, windup = 0.45f, active = 0.15f, recover = 0.55f, aoeRadius = 6.5f, lungeDistance = 0f, knockback = 9f, hitStopDuration = 0.08f, cameraShake = 0.35f };
        }

        void Awake()
        {
            movement = GetComponent<PlayerMovementAndCamera>();
            stamina = GetComponent<PlayerStamina>();
            health = GetComponent<HealthAndDamageSystem>();
            statBlock = GetComponent<StatBlock>();
            if (statBlock == null) statBlock = gameObject.AddComponent<StatBlock>();
            if (lightCombo == null || lightCombo.Length == 0) Reset();
        }

        void OnEnable()
        {
            if (health == null) health = GetComponent<HealthAndDamageSystem>();
            health.OnDamaged += HandleDamaged;
            health.OnDeath += HandleDeath;
            PlayerRegistry.Register(this);
        }

        void OnDisable()
        {
            health.OnDamaged -= HandleDamaged;
            health.OnDeath -= HandleDeath;
            PlayerRegistry.Unregister(this);
            if (hitStopping) { Time.timeScale = 1f; hitStopping = false; }
        }

        void Update()
        {
            if (state == CombatState.Dead) return;
            float dt = Time.deltaTime;

            for (int i = 0; i < cooldowns.Length; i++) cooldowns[i] = Mathf.Max(0f, cooldowns[i] - dt);
            if (soulHarvestRemaining > 0f)
            {
                soulHarvestRemaining -= dt;
                if (soulHarvestRemaining <= 0f) EndSoulHarvest();
            }

            HandleInput();
            TickState(dt);
        }

        // =====================================================================
        //  INPUT
        // =====================================================================

        void HandleInput()
        {
            if (state == CombatState.Hurt) { bufferedLight = false; return; }

            // --- Lăn né: ưu tiên cao nhất, huỷ được thu chiêu / tích lực / block ---
            if (Input.GetKeyDown(dodgeKey) && CanDodge() && stamina.TryConsume(dodgeStaminaCost))
            {
                StartDodge();
                return;
            }

            if (Input.GetKeyDown(lightKey)) { bufferedLight = true; bufferExpire = Time.time + inputBufferTime; }

            // --- Ultimate ---
            if (Input.GetKeyDown(ultimateKey) && UltimateReady && state != CombatState.Dodging)
                ActivateSoulHarvest();

            // --- Kỹ năng ---
            if (CanStartAction())
            {
                if (Input.GetKeyDown(skill1Key) && TryCastSkill(0)) return;
                if (Input.GetKeyDown(skill2Key) && TryCastSkill(1)) return;
            }

            // --- Đòn nặng: bấm để tích, thả để tung ---
            if (Input.GetKeyDown(heavyKey) && CanStartAction() && stamina.TryConsume(heavyStaminaCost))
                EnterCharging();
            if (state == CombatState.Charging && Input.GetKeyUp(heavyKey))
                ReleaseHeavy();

            // --- Block / Parry: giữ phím ---
            bool blockHeld = Input.GetKey(blockKey);
            if (blockHeld && CanStartAction() && state != CombatState.Blocking) EnterBlocking();
            else if (!blockHeld && state == CombatState.Blocking) ExitToIdle();

            // --- Chém nhẹ có buffer ---
            if (bufferedLight)
            {
                if (Time.time > bufferExpire) bufferedLight = false;
                else if (CanStartAction()) { bufferedLight = false; StartLight(); }
            }
        }

        /// <summary>Có thể bắt đầu hành động mới (đánh/skill/block) không?</summary>
        bool CanStartAction()
        {
            switch (state)
            {
                case CombatState.Idle:
                case CombatState.Blocking:
                    return true;
                case CombatState.Attacking:
                    return phase == AttackPhase.Recover && phaseTimer >= current.recover * cancelFraction;
                default:
                    return false;
            }
        }

        bool CanDodge()
        {
            switch (state)
            {
                case CombatState.Idle:
                case CombatState.Blocking:
                case CombatState.Charging:
                    return true;
                case CombatState.Attacking:
                    return phase == AttackPhase.Recover;
                default:
                    return false;
            }
        }

        // =====================================================================
        //  MÁY TRẠNG THÁI
        // =====================================================================

        void TickState(float dt)
        {
            switch (state)
            {
                case CombatState.Attacking: TickAttack(dt); break;

                case CombatState.Charging:
                    chargeTimer += dt;
                    if (!chargeFullNotified && chargeTimer >= chargeTime)
                    {
                        chargeFullNotified = true;
                        OnChargeFull?.Invoke();                       // VFX phát sáng vũ khí
                        if (cameraRig != null) cameraRig.Shake(0.03f, 0.15f);
                    }
                    break;

                case CombatState.Dodging:
                    dodgeElapsed += dt;
                    if (dodgeElapsed >= dodgeDuration) ExitToIdle();
                    break;

                case CombatState.Blocking:
                    blockTimer += dt;
                    break;

                case CombatState.Hurt:
                    hurtTimer -= dt;
                    if (hurtTimer <= 0f) ExitToIdle();
                    break;
            }
        }

        void ExitToIdle()
        {
            if (state == CombatState.Blocking) AnimatorSafe.SetBool(animator, "Blocking", false);
            state = CombatState.Idle;
            movement.MovementLocked = false;
            movement.RotationLocked = false;
            movement.SpeedMultiplier = 1f;
            SyncAnimatorSpeed();
        }

        // ------------------------- TẤN CÔNG -------------------------

        void StartLight()
        {
            bool chaining = state == CombatState.Attacking && kind == ActionKind.Light;
            if (!chaining && Time.time - lastLightEnd > comboResetTime) nextLightIndex = 0;
            if (nextLightIndex >= lightCombo.Length) nextLightIndex = 0;

            var p = lightCombo[nextLightIndex];
            if (!stamina.TryConsume(p.staminaCost)) return;

            nextLightIndex = (nextLightIndex + 1) % lightCombo.Length;
            StartAttack(p, ActionKind.Light, 0f);
        }

        void EnterCharging()
        {
            AnimatorSafe.SetBool(animator, "Blocking", false);
            state = CombatState.Charging;
            chargeTimer = 0f; chargeFullNotified = false;
            movement.MovementLocked = false;
            movement.RotationLocked = false;
            movement.SpeedMultiplier = chargeMoveSpeed;
            AnimatorSafe.Play(animator, "HeavyCharge", 0.1f);
        }

        void ReleaseHeavy()
        {
            float ratio = Mathf.Clamp01(chargeTimer / chargeTime);
            StartAttack(heavyAttack, ActionKind.Heavy, ratio);
        }

        bool TryCastSkill(int index)
        {
            if (cooldowns[index] > 0f) return false;
            var p = index == 0 ? voidThrust : ashenEruption;
            if (!stamina.TryConsume(p.staminaCost)) return false;
            cooldowns[index] = index == 0 ? voidThrustCooldown : ashenEruptionCooldown;
            StartAttack(p, ActionKind.Skill, 0f);
            OnSkillCast?.Invoke(index);
            return true;
        }

        void StartAttack(AttackProfile p, ActionKind k, float charge)
        {
            AnimatorSafe.SetBool(animator, "Blocking", false);
            current = p; kind = k; chargeRatio = charge;
            phase = AttackPhase.Windup; phaseTimer = 0f; activeStarted = false;
            hitSet.Clear();
            state = CombatState.Attacking;

            // Quay về hướng mục tiêu / hướng input ngay lúc xuất chiêu, rồi khoá di chuyển.
            movement.FaceInstant(movement.GetDesiredFacing());
            movement.MovementLocked = true;
            movement.RotationLocked = true;
            movement.SpeedMultiplier = 1f;

            AnimatorSafe.Play(animator, p.animState, 0.06f);
            SyncAnimatorSpeed();
            OnAttackStarted?.Invoke(p);
        }

        void TickAttack(float dt)
        {
            // Soul Harvest tăng tốc đánh: thời gian pha trôi nhanh hơn.
            phaseTimer += dt * AttackSpeedMultiplier;

            switch (phase)
            {
                case AttackPhase.Windup:
                    if (phaseTimer >= current.windup) { phase = AttackPhase.Active; phaseTimer = 0f; BeginActive(); }
                    break;

                case AttackPhase.Active:
                    // Arc/Dash quét mỗi frame suốt khung active (hitSet chống trúng 2 lần). Aoe quét 1 lần ở BeginActive.
                    if (current.shape != AttackShape.Aoe) ProcessHits(current);
                    if (phaseTimer >= current.active) { phase = AttackPhase.Recover; phaseTimer = 0f; }
                    break;

                case AttackPhase.Recover:
                    if (phaseTimer >= current.recover)
                    {
                        if (kind == ActionKind.Light) lastLightEnd = Time.time;
                        ExitToIdle();
                    }
                    break;
            }
        }

        void BeginActive()
        {
            activeStarted = true;
            float realActive = current.active / AttackSpeedMultiplier;

            if (current.shape == AttackShape.Dash)
                movement.BeginForcedMovement(transform.forward, current.dashDistance, realActive, true);
            else if (current.lungeDistance > 0f)
                movement.BeginForcedMovement(transform.forward, current.lungeDistance, realActive, true);

            if (current.shape == AttackShape.Aoe) ProcessHits(current);

            OnAttackActive?.Invoke(current);
        }

        // ------------------------- HITBOX -------------------------

        /// <summary>
        /// Phát hiện va chạm: quét cầu quanh người rồi lọc theo góc quạt (Arc/Dash). Aoe lấy trọn vòng tròn.
        /// Thay bằng collider gắn xương vũ khí nếu cần độ chính xác cao hơn - chỉ cần giữ lời gọi ApplyHit().
        /// </summary>
        void ProcessHits(AttackProfile p)
        {
            Vector3 origin = transform.position + Vector3.up * 1f;
            float radius = p.shape == AttackShape.Aoe ? p.aoeRadius : p.range;
            int n = Physics.OverlapSphereNonAlloc(origin, radius, Buffer, enemyMask, QueryTriggerInteraction.Ignore);

            for (int i = 0; i < n; i++)
            {
                var target = Buffer[i].GetComponentInParent<IDamageable>();
                if (target == null || target.IsDead || hitSet.Contains(target)) continue;
                if (target.Transform.root == transform.root) continue;

                if (p.shape != AttackShape.Aoe)
                {
                    Vector3 to = target.Transform.position - transform.position;
                    to.y = 0f;
                    if (to.sqrMagnitude > 0.01f && Vector3.Angle(transform.forward, to) > p.arcAngle * 0.5f) continue;
                }

                hitSet.Add(target);
                ApplyHit(target, p);
            }
        }

        void ApplyHit(IDamageable target, AttackProfile p)
        {
            float mult = kind == ActionKind.Heavy ? Mathf.Lerp(heavyMinMultiplier, heavyMaxMultiplier, chargeRatio)
                                                  : p.damageMultiplier;
            float poise = kind == ActionKind.Heavy ? p.poiseDamage * (1f + chargeRatio * 2f) : p.poiseDamage;
            float effectiveDamage = statBlock != null ? statBlock.Evaluate(StatType.Damage, baseDamage) : baseDamage;
            float effectiveCritChance = statBlock != null ? Mathf.Clamp01(statBlock.Evaluate(StatType.CritChance, critChance)) : critChance;
            float dmg = effectiveDamage * mult * DamageBuff;

            bool crit = UnityEngine.Random.value < effectiveCritChance;
            if (crit) dmg *= critMultiplier;

            Vector3 dir = target.Transform.position - transform.position;
            dir.y = 0f; dir.Normalize();

            var info = new DamageInfo
            {
                amount = dmg, type = DamageType.Physical, poiseDamage = poise,
                source = gameObject, hitPoint = target.AimPoint, hitDirection = dir,
                isCritical = crit, armorPiercing = p.armorPiercing
            };

            DamageResult r = target.TakeDamage(info);
            if (r.finalDamage <= 0f) return;

            // Nạp Ultimate (không nạp khi đang bật Soul Harvest).
            if (!SoulHarvestActive) ultimateGauge = Mathf.Min(ultimateMax, ultimateGauge + ultimateGainPerHit);
            // Hút máu.
            if (SoulHarvestActive) health.Heal(r.finalDamage * soulHarvestLifesteal);

            // Hất tung / đẩy lùi (Ashen Eruption).
            if (p.knockback > 0f)
            {
                var st = target.Transform.GetComponentInParent<IStaggerable>();
                if (st != null) st.ApplyKnockback((dir + Vector3.up * 0.8f).normalized * p.knockback);
            }

            if (cameraRig != null) cameraRig.Shake(p.cameraShake, 0.15f);
            if (enableHitStop && p.hitStopDuration > 0f) StartCoroutine(HitStop(p.hitStopDuration));
        }

        IEnumerator HitStop(float duration)
        {
            if (hitStopping) yield break;
            hitStopping = true;
            Time.timeScale = 0.05f;
            yield return new WaitForSecondsRealtime(duration);
            Time.timeScale = 1f;
            hitStopping = false;
        }

        // ------------------------- LĂN NÉ -------------------------

        void StartDodge()
        {
            AnimatorSafe.SetBool(animator, "Blocking", false);
            state = CombatState.Dodging;
            dodgeElapsed = 0f;
            bufferedLight = false;

            // Có input -> lăn theo hướng input. Không input -> lùi bước.
            bool hasInput = movement.HasMoveInput;
            Vector3 dir = hasInput ? movement.MoveInputWorld.normalized : -transform.forward;
            float dist = hasInput ? dodgeDistance : backstepDistance;

            movement.MovementLocked = true;
            movement.RotationLocked = true;
            // Backstep giữ nguyên hướng nhìn, lăn thì quay theo hướng lăn.
            movement.BeginForcedMovement(dir, dist, dodgeMoveTime, hasInput);
            AnimatorSafe.Play(animator, hasInput ? "Roll" : "Backstep", 0.05f);
        }

        void TriggerPerfectDodge()
        {
            // Sương Thời Gian: làm chậm kẻ địch xung quanh + hồi 20% Stamina ngay lập tức.
            stamina.RestorePercent(timeMistStaminaRefund);

            int n = Physics.OverlapSphereNonAlloc(transform.position, timeMistRadius, Buffer, enemyMask, QueryTriggerInteraction.Ignore);
            var seen = new HashSet<ITimeSlowable>();
            for (int i = 0; i < n; i++)
            {
                var s = Buffer[i].GetComponentInParent<ITimeSlowable>();
                if (s != null && seen.Add(s)) s.ApplyTimeSlow(timeMistSlowFactor, timeMistDuration);
            }

            if (cameraRig != null) cameraRig.Shake(0.05f, 0.2f);
            OnPerfectDodge?.Invoke();                 // VFX/SFX: sương xanh, tiếng vang
        }

        // ------------------------- BLOCK / PARRY -------------------------

        void EnterBlocking()
        {
            state = CombatState.Blocking;
            blockTimer = 0f;
            movement.MovementLocked = false;
            movement.RotationLocked = false;
            movement.SpeedMultiplier = blockMoveSpeed;
            AnimatorSafe.SetBool(animator, "Blocking", true);
        }

        // ------------------------- SOUL HARVEST -------------------------

        void ActivateSoulHarvest()
        {
            ultimateGauge = 0f;
            soulHarvestRemaining = soulHarvestDuration;
            AnimatorSafe.Trigger(animator, "SoulHarvest");
            SyncAnimatorSpeed();
            if (cameraRig != null) cameraRig.Shake(0.12f, 0.4f);
            OnSkillCast?.Invoke(2);
        }

        void EndSoulHarvest() { soulHarvestRemaining = 0f; SyncAnimatorSpeed(); }

        void SyncAnimatorSpeed()
        {
            if (animator != null) animator.speed = state == CombatState.Attacking ? AttackSpeedMultiplier : 1f;
        }

        // =====================================================================
        //  IDamageFilter: phòng thủ chủ động
        // =====================================================================

        /// <summary>
        /// Được HealthAndDamageSystem gọi trước khi trừ máu Player. Trả về true = vô hiệu hoàn toàn.
        /// Thứ tự: (1) Né/Perfect Dodge  (2) Parry  (3) Block thường giảm sát thương.
        /// </summary>
        public bool TryNegate(ref DamageInfo info)
        {
            // (1) Đang trong I-frame của lăn né.
            if (IsInvulnerable)
            {
                if (dodgeElapsed <= perfectDodgeWindow) { TriggerPerfectDodge(); return true; }
                // Đòn "bắt buộc Perfect Dodge" (boss Phase 3): I-frame thường không cứu được.
                return !info.requiresPerfectDodge;
            }

            // (2),(3) Đang Block, đòn không thuộc loại Unblockable, và kẻ địch ở phía trước mặt.
            if (state == CombatState.Blocking && !info.isUnblockable && !info.requiresPerfectDodge && IsInFront(info.source))
            {
                if (blockTimer <= parryWindow)
                {
                    Parry(info);
                    return true;
                }

                if (stamina.TryConsume(blockStaminaCost))
                {
                    info.amount *= 1f - blockDamageReduction;
                    info.poiseDamage *= 0.3f;
                }
                // Hết stamina = "vỡ thế đỡ": ăn nguyên sát thương.
            }
            return false;
        }

        bool IsInFront(GameObject source)
        {
            if (source == null) return true;
            Vector3 to = source.transform.position - transform.position;
            to.y = 0f;
            return Vector3.Angle(transform.forward, to) <= blockAngle * 0.5f;
        }

        void Parry(DamageInfo incoming)
        {
            if (incoming.source != null)
            {
                var attacker = incoming.source.GetComponentInParent<IDamageable>();
                if (attacker != null && !attacker.IsDead)
                {
                    // Phản lại 200% sát thương.
                    attacker.TakeDamage(new DamageInfo
                    {
                        amount = incoming.amount * parryReflectMultiplier,
                        type = incoming.type, poiseDamage = 0f,
                        source = gameObject, hitPoint = attacker.AimPoint,
                        hitDirection = (attacker.Transform.position - transform.position).normalized
                    });
                }
                // Đưa kẻ địch vào trạng thái "Choáng Tẩy" (Execute State).
                var st = incoming.source.GetComponentInParent<IStaggerable>();
                if (st != null) st.EnterExecuteState(executeDuration);
            }

            blockTimer = parryWindow + 0.01f;        // một lần bấm Block chỉ Parry được một đòn
            if (cameraRig != null) cameraRig.Shake(0.18f, 0.2f);
            if (enableHitStop) StartCoroutine(HitStop(0.1f));
            AnimatorSafe.Trigger(animator, "Parry");
            OnParry?.Invoke(incoming.source);
        }

        // =====================================================================
        //  PHẢN ỨNG KHI BỊ ĐÁNH / CHẾT
        // =====================================================================

        void HandleDamaged(DamageResult r, DamageInfo info)
        {
            if (state == CombatState.Dead || !r.poiseBroken) return;
            // Vỡ Poise: bị khựng, huỷ mọi hành động đang làm.
            state = CombatState.Hurt;
            hurtTimer = hurtStaggerDuration;
            bufferedLight = false;
            movement.CancelForcedMovement();
            movement.MovementLocked = true;
            movement.RotationLocked = true;
            AnimatorSafe.Trigger(animator, "Hurt");
        }

        void HandleDeath()
        {
            state = CombatState.Dead;
            movement.CancelForcedMovement();
            movement.MovementLocked = true;
            movement.RotationLocked = true;
            AnimatorSafe.Trigger(animator, "Die");
        }

        void OnDrawGizmosSelected()
        {
            Gizmos.color = new Color(1f, 0.2f, 0.2f, 0.4f);
            if (lightCombo != null && lightCombo.Length > 0)
                Gizmos.DrawWireSphere(transform.position + Vector3.up, lightCombo[0].range);
            Gizmos.color = new Color(0.3f, 0.8f, 1f, 0.3f);
            Gizmos.DrawWireSphere(transform.position, timeMistRadius);
        }
    }
}
