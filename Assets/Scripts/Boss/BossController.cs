using System;
using System.Collections;
using UnityEngine;
using UnityEngine.AI;
using UnityEngine.Events;
using AshenCrown.Core;
using AshenCrown.Combat;

namespace AshenCrown.Boss
{
    public enum BossAttackShape
    {
        Melee,        // Quạt phía trước
        GroundSlam,   // Vòng tròn quanh boss (AoE, bán kính nhân với hệ số phẫn nộ)
        ArenaWide     // Toàn bản đồ: trúng cả người chơi, chỉ Perfect Dodge mới né được (Phase 3)
    }

    [Serializable]
    public class BossAttack
    {
        public string name = "Slash";
        public BossAttackShape shape = BossAttackShape.Melee;
        public string animTrigger = "Attack";
        public float minRange = 0f;
        public float maxRange = 3.5f;
        public float aoeRadius = 6f;             // dùng cho GroundSlam
        public float arcAngle = 110f;            // dùng cho Melee
        [Header("Nhịp đòn (giây, trước khi nhân hệ số tốc độ)")]
        public float windup = 0.7f;
        public float active = 0.25f;
        public float recover = 1.0f;
        public float cooldown = 3f;
        public float lungeDistance = 0f;         // lao tới trong lúc active
        [Header("Sát thương")]
        public float damage = 30f;
        public float poiseDamage = 30f;
        public DamageType damageType = DamageType.Physical;
        public bool unblockable;
        [Tooltip("I-frame lăn thường KHÔNG né được, chỉ Perfect Dodge (0.1s) mới né được")]
        public bool requiresPerfectDodge;
        public float weight = 1f;
    }

    [Serializable]
    public class BossPhase
    {
        public string name = "Phase 1";
        [Tooltip("Vào phase này khi máu <= tỉ lệ này (1.0 = ngay từ đầu). Phải giảm dần theo thứ tự.")]
        [Range(0f, 1f)] public float enterAtHealthPercent = 1f;
        public float moveSpeed = 5f;
        [Tooltip("Nhân tốc độ ra chiêu (thời gian gồng/thu chiêu chia cho hệ số này) và animator.speed")]
        public float speedMultiplier = 1f;
        [Tooltip("Nhân bán kính các đòn AoE")]
        public float aoeMultiplier = 1f;
        public Vector3 scale = Vector3.one;
        public bool canBeStaggered = true;
        [Header("Chuyển phase")]
        public float transitionDuration = 3f;
        [Tooltip("Bộ Animation riêng của phase (thay Animation Set). Để trống = giữ nguyên.")]
        public AnimatorOverrideController animatorOverride;
        [Tooltip("Các mảnh sàn đấu sẽ sập khi vào phase (vd. Phase 2)")]
        public GameObject[] collapseOnEnter;
        public UnityEvent onEnter;
        [Header("Chiêu thức")]
        public BossAttack[] attacks;
    }

    /// <summary>
    /// MODULE 5 - Quản lý Boss nhiều phase.
    ///  - Phase chuyển theo % máu (BossPhase.enterAtHealthPercent). Lúc chuyển: bất tử, gầm, đổi Animation Set,
    ///    đổi kích thước, sập sàn đấu.
    ///  - Phẫn nộ (Enrage) khi máu &lt; 50%: tăng tốc ra chiêu và mở rộng AoE (cộng dồn lên phase hiện tại).
    ///  - "Giáp" của boss = Poise: vỡ -> khựng ngắn (trừ phase tắt canBeStaggered).
    ///  - Hỗ trợ Parry (Execute) và Sương Thời Gian giống EnemyFSM.
    ///  - BossHealthBarUI lắng nghe các sự kiện C# bên dưới.
    ///
    /// Cấu hình boss cuối (Act IV) gợi ý:
    ///   Phase 1 (100%): kiếm sĩ siêu tốc  - moveSpeed 9, speedMultiplier 1.4, đòn Melee + lunge.
    ///   Phase 2 (60%) : quái thú Hư Không - scale 2.2, GroundSlam bán kính lớn, collapseOnEnter = sàn đấu.
    ///   Phase 3 (30%) : Hồn Thần          - canBeStaggered = false, thêm ArenaWide + requiresPerfectDodge.
    /// </summary>
    [RequireComponent(typeof(NavMeshAgent))]
    [RequireComponent(typeof(HealthAndDamageSystem))]
    public class BossController : MonoBehaviour, IStaggerable, ITimeSlowable
    {
        enum BossState { Idle, Chase, Attack, Transition, Staggered, Dead }
        enum AttackPhase { Windup, Active, Recover }

        [Header("Thông tin")]
        public string bossName = "King Alden the Eternal";
        [SerializeField] float engageRange = 35f;
        [SerializeField] Animator animator;
        [SerializeField] float turnSpeed = 6f;
        [SerializeField] float staggerDuration = 1.6f;
        [SerializeField] float executeDamageTakenMultiplier = 1.5f;
        [SerializeField, Range(0f, 1f)] float slowResistance = 0.5f;

        [Header("Phẫn nộ (Enrage)")]
        [SerializeField, Range(0f, 1f)] float enrageHealthPercent = 0.5f;
        [SerializeField] float enrageSpeedMultiplier = 1.25f;
        [SerializeField] float enrageAoeMultiplier = 1.3f;

        [Header("Phases")]
        [SerializeField] BossPhase[] phases;

        [Header("Sự kiện")]
        public UnityEvent onEngaged;
        public UnityEvent onEnraged;
        public UnityEvent onDefeated;

        // Sự kiện C# cho UI
        public event Action OnEngaged;
        public event Action<int, BossPhase> OnPhaseChanged;
        public event Action OnEnrageStarted;
        public event Action OnDefeated;
        public event Action<BossAttack> OnAttackTelegraph;   // VFX/SFX/cảnh báo UI
        public event Action<BossAttack> OnAttackActive;

        public HealthAndDamageSystem Health { get; private set; }
        public int CurrentPhaseIndex { get; private set; } = -1;
        public BossPhase CurrentPhase => CurrentPhaseIndex >= 0 ? phases[CurrentPhaseIndex] : null;
        public int PhaseCount => phases != null ? phases.Length : 0;
        public bool IsEnraged { get; private set; }
        public bool IsEngaged { get; private set; }

        NavMeshAgent agent;
        Transform player;
        HealthAndDamageSystem playerHealth;
        BossState state = BossState.Idle;

        BossAttack currentAttack;
        AttackPhase attackPhase;
        float attackTimer;
        bool attackResolved;
        float[] attackReadyAt;
        int lastAttackIndex = -1;
        float nextAttackTime;

        float transitionTimer, staggerTimer;
        bool inExecute;
        float slowTimer, slowFactor = 1f;

        float SpeedMult => (CurrentPhase != null ? CurrentPhase.speedMultiplier : 1f) * (IsEnraged ? enrageSpeedMultiplier : 1f);
        float AoeMult => (CurrentPhase != null ? CurrentPhase.aoeMultiplier : 1f) * (IsEnraged ? enrageAoeMultiplier : 1f);
        float LocalTime => slowTimer > 0f ? slowFactor : 1f;

        void Awake()
        {
            agent = GetComponent<NavMeshAgent>();
            Health = GetComponent<HealthAndDamageSystem>();
            if (animator == null) animator = GetComponentInChildren<Animator>();
        }

        void Start()
        {
            var p = GameObject.FindGameObjectWithTag("Player");
            if (p != null) { player = p.transform; playerHealth = p.GetComponent<HealthAndDamageSystem>(); }

            if (phases == null || phases.Length == 0)
            {
                Debug.LogWarning("[BossController] Chưa cấu hình phases - tạo phase mặc định.", this);
                phases = new[] { new BossPhase { attacks = new[] { new BossAttack() } } };
            }
            // Phase đầu tiên: áp dụng ngay, không có màn chuyển cảnh.
            CurrentPhaseIndex = 0;
            ApplyPhaseSetup(phases[0]);
            attackReadyAt = new float[MaxAttackCount()];
            agent.isStopped = true;
        }

        void OnEnable()
        {
            if (Health == null) Health = GetComponent<HealthAndDamageSystem>();
            Health.OnPoiseBroken += HandlePoiseBroken;
            Health.OnDeath += HandleDeath;
        }

        void OnDisable()
        {
            Health.OnPoiseBroken -= HandlePoiseBroken;
            Health.OnDeath -= HandleDeath;
        }

        int MaxAttackCount()
        {
            int m = 1;
            foreach (var ph in phases) if (ph.attacks != null) m = Mathf.Max(m, ph.attacks.Length);
            return m;
        }

        void Update()
        {
            if (state == BossState.Dead || player == null) return;

            if (slowTimer > 0f) slowTimer -= Time.deltaTime;
            float dt = Time.deltaTime * LocalTime;
            if (animator != null) animator.speed = SpeedMult * LocalTime;

            CheckEnrage();
            CheckPhaseTransition();

            switch (state)
            {
                case BossState.Idle: UpdateIdle(); break;
                case BossState.Chase: UpdateChase(dt); break;
                case BossState.Attack: UpdateAttack(dt); break;
                case BossState.Transition: UpdateTransition(dt); break;
                case BossState.Staggered: UpdateStaggered(dt); break;
            }
        }

        // =====================================================================
        //  ENGAGE / CHASE
        // =====================================================================

        void UpdateIdle()
        {
            if (FlatDistance() > engageRange) return;
            IsEngaged = true;
            state = BossState.Chase;
            agent.isStopped = false;
            OnEngaged?.Invoke();
            onEngaged?.Invoke();
        }

        void UpdateChase(float dt)
        {
            if (playerHealth.IsDead) { agent.isStopped = true; return; }

            agent.speed = CurrentPhase.moveSpeed * SpeedMult * LocalTime;
            agent.SetDestination(player.position);
            Face(dt);

            if (Time.time < nextAttackTime) return;
            BossAttack atk = ChooseAttack(FlatDistance());
            if (atk != null) BeginAttack(atk);
        }

        // =====================================================================
        //  ATTACK
        // =====================================================================

        BossAttack ChooseAttack(float dist)
        {
            var list = CurrentPhase.attacks;
            if (list == null || list.Length == 0) return null;

            float total = 0f;
            for (int i = 0; i < list.Length; i++) if (Eligible(i, dist)) total += list[i].weight;
            if (total <= 0f) return null;

            float roll = UnityEngine.Random.value * total;
            for (int i = 0; i < list.Length; i++)
            {
                if (!Eligible(i, dist)) continue;
                roll -= list[i].weight;
                if (roll <= 0f) { lastAttackIndex = i; return list[i]; }
            }
            return null;
        }

        bool Eligible(int i, float dist)
        {
            var a = CurrentPhase.attacks[i];
            if (Time.time < attackReadyAt[i]) return false;
            if (i == lastAttackIndex && CurrentPhase.attacks.Length > 1) return false;   // không lặp một đòn 2 lần liên tiếp
            return dist >= a.minRange && dist <= a.maxRange;
        }

        void BeginAttack(BossAttack atk)
        {
            currentAttack = atk;
            int idx = Array.IndexOf(CurrentPhase.attacks, atk);
            attackReadyAt[idx] = Time.time + atk.cooldown / SpeedMult;

            state = BossState.Attack;
            attackPhase = AttackPhase.Windup; attackTimer = 0f; attackResolved = false;
            agent.isStopped = true;
            agent.ResetPath();
            AnimatorSafe.Trigger(animator, atk.animTrigger);
            OnAttackTelegraph?.Invoke(atk);
        }

        void UpdateAttack(float dt)
        {
            // Hệ số tốc độ (phase + phẫn nộ) làm các pha trôi nhanh hơn.
            attackTimer += dt * SpeedMult;

            switch (attackPhase)
            {
                case AttackPhase.Windup:
                    if (attackTimer < currentAttack.windup * 0.6f) Face(dt);   // 40% cuối khoá hướng
                    if (attackTimer >= currentAttack.windup)
                    {
                        attackPhase = AttackPhase.Active; attackTimer = 0f;
                        OnAttackActive?.Invoke(currentAttack);
                        if (currentAttack.shape != BossAttackShape.Melee) ResolveAreaHit();
                    }
                    break;

                case AttackPhase.Active:
                    if (currentAttack.lungeDistance > 0f)
                    {
                        float speed = currentAttack.lungeDistance / Mathf.Max(0.05f, currentAttack.active / SpeedMult);
                        agent.Move(transform.forward * speed * dt);
                    }
                    if (currentAttack.shape == BossAttackShape.Melee && !attackResolved) TryMeleeHit();
                    if (attackTimer >= currentAttack.active) { attackPhase = AttackPhase.Recover; attackTimer = 0f; }
                    break;

                case AttackPhase.Recover:
                    if (attackTimer >= currentAttack.recover)
                    {
                        state = BossState.Chase;
                        agent.isStopped = false;
                        nextAttackTime = Time.time + 0.4f / SpeedMult;
                    }
                    break;
            }
        }

        void TryMeleeHit()
        {
            Vector3 to = player.position - transform.position;
            to.y = 0f;
            float d = to.magnitude;
            if (d > currentAttack.maxRange + 0.8f) return;
            if (d > 0.1f && Vector3.Angle(transform.forward, to) > currentAttack.arcAngle * 0.5f) return;
            attackResolved = true;
            DealDamageToPlayer(to.normalized);
        }

        /// <summary>GroundSlam / ArenaWide: kiểm tra đúng một lần tại thời điểm bắt đầu khung active.</summary>
        void ResolveAreaHit()
        {
            attackResolved = true;
            Vector3 to = player.position - transform.position;
            to.y = 0f;

            if (currentAttack.shape == BossAttackShape.GroundSlam &&
                to.magnitude > currentAttack.aoeRadius * AoeMult) return;   // ArenaWide: luôn trúng

            DealDamageToPlayer(to.sqrMagnitude > 0.001f ? to.normalized : transform.forward);
        }

        void DealDamageToPlayer(Vector3 dir)
        {
            playerHealth.TakeDamage(new DamageInfo
            {
                amount = currentAttack.damage,
                type = currentAttack.damageType,
                poiseDamage = currentAttack.poiseDamage,
                source = gameObject,
                hitPoint = playerHealth.AimPoint,
                hitDirection = dir,
                isUnblockable = currentAttack.unblockable,
                requiresPerfectDodge = currentAttack.requiresPerfectDodge
            });
        }

        // =====================================================================
        //  PHASE & ENRAGE
        // =====================================================================

        void CheckPhaseTransition()
        {
            if (state == BossState.Transition || state == BossState.Idle) return;
            int next = CurrentPhaseIndex + 1;
            if (next < phases.Length && Health.Health01 <= phases[next].enterAtHealthPercent)
                BeginTransition(next);
        }

        void CheckEnrage()
        {
            if (IsEnraged || state == BossState.Idle) return;
            if (Health.Health01 > enrageHealthPercent) return;

            IsEnraged = true;
            AnimatorSafe.Trigger(animator, "Enrage");
            OnEnrageStarted?.Invoke();
            onEnraged?.Invoke();
        }

        void BeginTransition(int index)
        {
            CurrentPhaseIndex = index;
            var ph = phases[index];

            state = BossState.Transition;
            transitionTimer = ph.transitionDuration;
            agent.isStopped = true;
            agent.ResetPath();
            Health.Invulnerable = true;                 // không thể bị đánh trong lúc gầm
            Health.DamageTakenMultiplier = 1f;
            inExecute = false;

            ApplyPhaseSetup(ph);
            AnimatorSafe.Trigger(animator, "PhaseTransition");
            if (ph.collapseOnEnter != null && ph.collapseOnEnter.Length > 0)
                StartCoroutine(CollapseRoutine(ph.collapseOnEnter));
            if (ph.scale != transform.localScale) StartCoroutine(ScaleRoutine(ph.scale, ph.transitionDuration));

            ph.onEnter?.Invoke();
            OnPhaseChanged?.Invoke(index, ph);
        }

        void UpdateTransition(float dt)
        {
            transitionTimer -= dt;
            if (transitionTimer > 0f) return;

            Health.Invulnerable = false;
            Health.RestorePoise();
            agent.isStopped = false;
            state = BossState.Chase;
            nextAttackTime = Time.time + 0.5f;
        }

        void ApplyPhaseSetup(BossPhase ph)
        {
            agent.speed = ph.moveSpeed;
            // Đổi Animation Set của phase (nếu có).
            if (ph.animatorOverride != null && animator != null && animator.runtimeAnimatorController != ph.animatorOverride)
                animator.runtimeAnimatorController = ph.animatorOverride;
            OnPhaseChangedInitial(ph);
        }

        void OnPhaseChangedInitial(BossPhase ph)
        {
            // Lần setup đầu (Start) cũng báo cho UI để hiện tên phase.
            if (CurrentPhaseIndex == 0 && !IsEngaged) OnPhaseChanged?.Invoke(0, ph);
        }

        /// <summary>Sập sàn đấu: từng mảnh rơi xuống lần lượt. (Nhớ xử lý NavMesh nếu boss đứng trên sàn sập.)</summary>
        IEnumerator CollapseRoutine(GameObject[] segments)
        {
            foreach (var seg in segments)
            {
                if (seg == null) continue;
                yield return new WaitForSeconds(0.2f);
                if (seg == null) continue;
                var rb = seg.GetComponent<Rigidbody>();
                if (rb == null) rb = seg.AddComponent<Rigidbody>();
                rb.isKinematic = false;
                rb.useGravity = true;
                Destroy(seg, 6f);
            }
        }

        IEnumerator ScaleRoutine(Vector3 target, float duration)
        {
            Vector3 from = transform.localScale;
            float t = 0f;
            while (t < duration)
            {
                t += Time.deltaTime;
                transform.localScale = Vector3.Lerp(from, target, Mathf.SmoothStep(0f, 1f, t / duration));
                yield return null;
            }
            transform.localScale = target;
        }

        // =====================================================================
        //  STAGGER / EXECUTE / TIME SLOW (IStaggerable, ITimeSlowable)
        // =====================================================================

        void HandlePoiseBroken()
        {
            if (state != BossState.Chase && state != BossState.Attack) return;
            if (!CurrentPhase.canBeStaggered) return;
            EnterStagger(staggerDuration, false);
        }

        void EnterStagger(float duration, bool execute)
        {
            if (state == BossState.Dead || state == BossState.Transition || state == BossState.Idle) return;
            inExecute = execute;
            Health.DamageTakenMultiplier = execute ? executeDamageTakenMultiplier : 1.15f;
            staggerTimer = duration;
            state = BossState.Staggered;
            agent.isStopped = true;
            agent.ResetPath();
            AnimatorSafe.Trigger(animator, execute ? "Execute" : "Stagger");
        }

        void UpdateStaggered(float dt)
        {
            staggerTimer -= dt;
            if (staggerTimer > 0f) return;
            Health.DamageTakenMultiplier = 1f;
            inExecute = false;
            state = BossState.Chase;
            agent.isStopped = false;
            nextAttackTime = Time.time + 0.5f;
        }

        public void ApplyStagger(float duration)
        {
            if (CurrentPhase != null && CurrentPhase.canBeStaggered) EnterStagger(duration * 0.5f, false);
        }

        /// <summary>Parry thành công: boss luôn bị Choáng Tẩy (kể cả phase không thể Stagger).</summary>
        public void EnterExecuteState(float duration) => EnterStagger(duration, true);

        public void ApplyKnockback(Vector3 impulse) { /* Boss quá nặng: miễn nhiễm hất tung */ }

        public void ApplyTimeSlow(float factor, float duration)
        {
            // Boss kháng một nửa hiệu ứng: factor kéo về phía 1.
            slowFactor = Mathf.Lerp(Mathf.Clamp(factor, 0.02f, 1f), 1f, slowResistance);
            slowTimer = Mathf.Max(slowTimer, duration * 0.75f);
        }

        // =====================================================================
        //  CHẾT
        // =====================================================================

        void HandleDeath()
        {
            state = BossState.Dead;
            StopAllCoroutines();
            if (agent.enabled) { agent.isStopped = true; }
            Health.DamageTakenMultiplier = 1f;
            AnimatorSafe.Trigger(animator, "Die");
            if (animator != null) animator.speed = 1f;
            OnDefeated?.Invoke();
            onDefeated?.Invoke();
        }

        // =====================================================================
        //  TIỆN ÍCH
        // =====================================================================

        float FlatDistance()
        {
            Vector3 d = player.position - transform.position;
            d.y = 0f;
            return d.magnitude;
        }

        void Face(float dt)
        {
            Vector3 to = player.position - transform.position;
            to.y = 0f;
            if (to.sqrMagnitude < 0.001f) return;
            transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(to),
                                                  1f - Mathf.Exp(-turnSpeed * dt));
        }

        void OnDrawGizmosSelected()
        {
            Gizmos.color = Color.yellow;
            Gizmos.DrawWireSphere(transform.position, engageRange);
            if (phases != null && CurrentPhaseIndex >= 0 && CurrentPhase.attacks != null)
            {
                Gizmos.color = Color.red;
                foreach (var a in CurrentPhase.attacks)
                    Gizmos.DrawWireSphere(transform.position, a.shape == BossAttackShape.GroundSlam ? a.aoeRadius : a.maxRange);
            }
        }
    }
}
