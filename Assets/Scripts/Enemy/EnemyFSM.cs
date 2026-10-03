using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AI;
using UnityEngine.Events;
using AshenCrown.Core;
using AshenCrown.Combat;

namespace AshenCrown.Enemy
{
    public enum EnemyState { Patrol, Chase, Attack, Staggered, Die }

    public enum EnemyArchetype
    {
        Minion,   // Đánh bầy đàn: vây quanh, chặn đường lui, giới hạn số kẻ tấn công cùng lúc
        Ranged,   // Giữ khoảng cách, bắn đạn ma thuật, đặt bẫy
        Elite     // Hyper-Armor + đòn Unblockable (đỏ)
    }

    public enum EnemyAttackKind { Melee, Projectile, GroundTrap }

    [Serializable]
    public class EnemyAttack
    {
        public string name = "Claw";
        public EnemyAttackKind kind = EnemyAttackKind.Melee;
        public float minRange = 0f;
        public float maxRange = 2.2f;
        [Header("Nhịp đòn")]
        public float windup = 0.6f;
        public float active = 0.25f;
        public float recover = 0.9f;
        public float cooldown = 2.5f;
        [Header("Sát thương")]
        public float damage = 12f;
        public float poiseDamage = 15f;
        [Tooltip("Đòn ĐỎ: không Block/Parry được, bắt buộc né. Có đèn báo đỏ lúc gồng.")]
        public bool unblockable;
        public float arcAngle = 100f;
        [Tooltip("Xác suất tương đối khi chọn đòn")]
        public float weight = 1f;
        public string animTrigger = "Attack";
    }

    /// <summary>
    /// MODULE 3 - AI kẻ địch bằng Finite State Machine: Patrol, Chase, Attack, Staggered, Die.
    ///
    /// Điểm nhấn thiết kế:
    ///  - Minion: dùng "token tấn công" (tối đa N con đánh cùng lúc), số còn lại đi vòng quanh người chơi;
    ///    cứ 3 con thì có 1 con làm "Blocker" đứng phía sau lưng người chơi để chặn đường lui.
    ///  - Ranged: giữ khoảng cách [keepMin, keepMax], bắn đạn, đặt bẫy dưới chân.
    ///  - Elite: Hyper-Armor (Poise vỡ cũng không bị ngắt chiêu), đòn Unblockable.
    ///  - Parry -> Execute State: đứng choáng, nhận thêm sát thương.
    ///  - Perfect Dodge -> ITimeSlowable: mọi timer/animator/agent của con này chạy chậm lại.
    ///  - Chết -> Ragdoll nếu có Rigidbody trên các xương con.
    /// </summary>
    [RequireComponent(typeof(NavMeshAgent))]
    [RequireComponent(typeof(HealthAndDamageSystem))]
    public class EnemyFSM : MonoBehaviour, IStaggerable, ITimeSlowable
    {
        [Header("Loại & Chỉ số")]
        [SerializeField] EnemyArchetype archetype = EnemyArchetype.Minion;
        [SerializeField] bool hyperArmor = false;
        [SerializeField] float damageScale = 1f;
        [SerializeField] DamageType damageType = DamageType.Physical;
        [SerializeField] int cinderSoulsReward = 25;

        [Header("Tham chiếu")]
        [SerializeField] Animator animator;
        [SerializeField] Transform muzzle;
        [SerializeField] MagicProjectile projectilePrefab;
        [SerializeField] GroundHazard trapPrefab;
        [Tooltip("Đèn báo đòn: trắng = chặn được, ĐỎ = Unblockable")]
        [SerializeField] Light telegraphLight;
        public UnityEvent<bool> onTelegraph;     // tham số: true nếu là đòn đỏ (cho VFX/SFX)

        [Header("Phát hiện người chơi")]
        [SerializeField] float sightRange = 16f;
        [SerializeField] float sightAngle = 120f;
        [SerializeField] float hearRange = 5f;
        [SerializeField] float loseSightTime = 5f;
        [SerializeField] float eyeHeight = 1.6f;
        [Tooltip("Layer địa hình chắn tầm nhìn")]
        [SerializeField] LayerMask obstructionMask;

        [Header("Tuần tra")]
        [SerializeField] Transform[] waypoints;
        [SerializeField] float wanderRadius = 8f;
        [SerializeField] float patrolSpeed = 1.8f;
        [SerializeField] float waitAtPoint = 2f;

        [Header("Truy đuổi")]
        [SerializeField] float chaseSpeed = 4.5f;
        [SerializeField] float turnSpeed = 8f;

        [Header("Minion: bầy đàn")]
        [SerializeField] float encircleRadius = 3.6f;
        [SerializeField] float orbitSpeed = 12f;
        [SerializeField] float tokenCooldownMin = 1f;
        [SerializeField] float tokenCooldownMax = 2.5f;
        public static int MaxSimultaneousAttackers = 2;

        [Header("Ranged: giữ khoảng cách")]
        [SerializeField] float keepMin = 7f;
        [SerializeField] float keepMax = 11f;

        [Header("Đòn đánh")]
        [SerializeField] EnemyAttack[] attacks;

        [Header("Choáng / Chết")]
        [SerializeField] float staggerDuration = 1.2f;
        [SerializeField] float executeDamageTakenMultiplier = 1.5f;
        [SerializeField] bool useRagdoll = true;
        [SerializeField] float ragdollImpulse = 6f;
        [SerializeField] float despawnDelay = 10f;
        public UnityEvent onDied;

        public static event Action<EnemyFSM, int> OnEnemyKilled;   // (kẻ địch, Hồn Tàn thưởng)

        public EnemyState State => state;
        public HealthAndDamageSystem Health { get; private set; }

        // ----- nội bộ -----
        NavMeshAgent agent;
        Transform player;
        HealthAndDamageSystem playerHealth;
        EnemyState state;

        float lostSightTimer, repathTimer, waitTimer;
        Vector3 spawnPos;
        int waypointIndex;

        EnemyAttack currentAttack;
        enum Phase { Windup, Active, Recover }
        Phase attackPhase;
        float attackTimer;
        bool attackResolved;
        float[] attackReadyAt;

        float staggerTimer;
        bool inExecute;
        Vector3 knockVelocity;
        Vector3 lastHitDir = Vector3.forward;

        float slowTimer, slowFactor = 1f;
        float LocalTime => slowTimer > 0f ? slowFactor : 1f;

        bool holdsToken;
        float tokenBlockedUntil;
        Rigidbody[] ragdollBodies;

        static readonly List<EnemyFSM> Chasers = new List<EnemyFSM>();
        static int activeAttackers;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        static void ResetStatics() { Chasers.Clear(); activeAttackers = 0; OnEnemyKilled = null; }

        // =====================================================================
        //  VÒNG ĐỜI
        // =====================================================================

        void Awake()
        {
            agent = GetComponent<NavMeshAgent>();
            Health = GetComponent<HealthAndDamageSystem>();
            if (animator == null) animator = GetComponentInChildren<Animator>();
            spawnPos = transform.position;
            if (attacks == null || attacks.Length == 0) attacks = new[] { new EnemyAttack() };
            attackReadyAt = new float[attacks.Length];

            // Ragdoll: các Rigidbody trên xương con được giữ kinematic cho tới khi chết.
            var all = GetComponentsInChildren<Rigidbody>();
            var list = new List<Rigidbody>();
            foreach (var rb in all) if (rb.gameObject != gameObject) { rb.isKinematic = true; list.Add(rb); }
            ragdollBodies = list.ToArray();

            if (telegraphLight != null) telegraphLight.enabled = false;
            if (archetype == EnemyArchetype.Elite) hyperArmor = true;
        }

        void Start()
        {
            var p = GameObject.FindGameObjectWithTag("Player");
            if (p != null) { player = p.transform; playerHealth = p.GetComponent<HealthAndDamageSystem>(); }
            EnterState(EnemyState.Patrol);
        }

        void OnEnable()
        {
            if (Health == null) Health = GetComponent<HealthAndDamageSystem>();
            Health.OnPoiseBroken += HandlePoiseBroken;
            Health.OnDamaged += HandleDamaged;
            Health.OnDeath += HandleDeath;
        }

        void OnDisable()
        {
            Health.OnPoiseBroken -= HandlePoiseBroken;
            Health.OnDamaged -= HandleDamaged;
            Health.OnDeath -= HandleDeath;
            Unregister(); ReleaseToken();
        }

        void Update()
        {
            if (state == EnemyState.Die || player == null) return;

            // Sương Thời Gian: đếm bằng thời gian thật, nhưng mọi hành vi dùng LocalTime.
            if (slowTimer > 0f) slowTimer -= Time.deltaTime;
            float dt = Time.deltaTime * LocalTime;
            if (animator != null) animator.speed = LocalTime;

            ApplyKnockback(dt);

            switch (state)
            {
                case EnemyState.Patrol: UpdatePatrol(dt); break;
                case EnemyState.Chase: UpdateChase(dt); break;
                case EnemyState.Attack: UpdateAttack(dt); break;
                case EnemyState.Staggered: UpdateStaggered(dt); break;
            }

            if (animator != null && agent.enabled)
                AnimatorSafe.SetFloat(animator, "Speed", agent.velocity.magnitude / Mathf.Max(0.1f, chaseSpeed), 0.1f, Time.deltaTime);
        }

        // =====================================================================
        //  CHUYỂN TRẠNG THÁI
        // =====================================================================

        void ChangeState(EnemyState next)
        {
            if (state == next && next != EnemyState.Staggered) return;
            ExitState(state);
            state = next;
            EnterState(next);
        }

        void EnterState(EnemyState s)
        {
            state = s;
            switch (s)
            {
                case EnemyState.Patrol:
                    Unregister(); ReleaseToken();
                    agent.isStopped = false;
                    agent.speed = patrolSpeed;
                    lostSightTimer = 0f; waitTimer = 0f;
                    GoToNextPatrolPoint();
                    break;

                case EnemyState.Chase:
                    Register();
                    agent.isStopped = false;
                    agent.speed = chaseSpeed;
                    lostSightTimer = 0f; repathTimer = 0f;
                    break;

                case EnemyState.Attack:
                    agent.isStopped = true;
                    agent.ResetPath();
                    attackPhase = Phase.Windup; attackTimer = 0f; attackResolved = false;
                    SetTelegraph(true, currentAttack.unblockable);
                    AnimatorSafe.Trigger(animator, currentAttack.animTrigger);
                    break;

                case EnemyState.Staggered:
                    agent.isStopped = true;
                    agent.ResetPath();
                    ReleaseToken();
                    SetTelegraph(false, false);
                    AnimatorSafe.Trigger(animator, inExecute ? "Execute" : "Stagger");
                    break;

                case EnemyState.Die:
                    EnterDie();
                    break;
            }
        }

        void ExitState(EnemyState s)
        {
            if (s == EnemyState.Attack) { SetTelegraph(false, false); ReleaseToken(); }
            if (s == EnemyState.Staggered && inExecute)
            {
                inExecute = false;
                Health.DamageTakenMultiplier = 1f;
            }
        }

        // =====================================================================
        //  PATROL
        // =====================================================================

        void UpdatePatrol(float dt)
        {
            if (DetectPlayer()) { ChangeState(EnemyState.Chase); return; }

            if (!agent.pathPending && agent.remainingDistance <= agent.stoppingDistance + 0.3f)
            {
                waitTimer += dt;
                if (waitTimer >= waitAtPoint) { waitTimer = 0f; GoToNextPatrolPoint(); }
            }
        }

        void GoToNextPatrolPoint()
        {
            Vector3 dest;
            if (waypoints != null && waypoints.Length > 0)
            {
                dest = waypoints[waypointIndex].position;
                waypointIndex = (waypointIndex + 1) % waypoints.Length;
            }
            else
            {
                Vector2 r = UnityEngine.Random.insideUnitCircle * wanderRadius;
                dest = spawnPos + new Vector3(r.x, 0f, r.y);
            }
            if (NavMesh.SamplePosition(dest, out NavMeshHit hit, 4f, NavMesh.AllAreas)) agent.SetDestination(hit.position);
        }

        /// <summary>Nhìn thấy (trong tầm + góc nhìn + không bị chắn) hoặc nghe thấy (rất gần).</summary>
        bool DetectPlayer()
        {
            if (playerHealth == null || playerHealth.IsDead) return false;
            float flat = FlatDistanceToPlayer();
            if (flat <= hearRange) return true;
            return CanSeePlayer();
        }

        bool CanSeePlayer()
        {
            Vector3 eye = transform.position + Vector3.up * eyeHeight;
            Vector3 to = playerHealth.AimPoint - eye;
            float dist = to.magnitude;
            if (dist > sightRange) return false;
            Vector3 flat = new Vector3(to.x, 0f, to.z);
            if (Vector3.Angle(transform.forward, flat) > sightAngle * 0.5f) return false;
            return !Physics.Raycast(eye, to / dist, dist, obstructionMask, QueryTriggerInteraction.Ignore);
        }

        // =====================================================================
        //  CHASE
        // =====================================================================

        void UpdateChase(float dt)
        {
            if (playerHealth.IsDead) { ChangeState(EnemyState.Patrol); return; }

            // Mất dấu quá lâu thì quay lại tuần tra.
            if (CanSeePlayer() || FlatDistanceToPlayer() <= hearRange) lostSightTimer = 0f;
            else if ((lostSightTimer += dt) >= loseSightTime) { ChangeState(EnemyState.Patrol); return; }

            agent.speed = chaseSpeed * LocalTime;
            float dist = FlatDistanceToPlayer();

            if (archetype == EnemyArchetype.Ranged) UpdateRangedChase(dist, dt);
            else UpdateMeleeChase(dist, dt);
        }

        void UpdateMeleeChase(float dist, float dt)
        {
            EnemyAttack atk = ChooseAttack(dist);
            bool wantsToEngage = TryAcquireToken();

            if (wantsToEngage)
            {
                if (atk != null) { BeginAttack(atk); return; }
                RepathTo(player.position, dt);
            }
            else
            {
                // Không có token: đi vòng quanh người chơi, hoặc chặn đường lui.
                RepathTo(ComputeSurroundPoint(), dt);
                FacePlayer(dt);
            }
        }

        void UpdateRangedChase(float dist, float dt)
        {
            bool los = CanSeePlayer();

            if (dist < keepMin)
            {
                // Quá gần -> lùi ra xa người chơi.
                Vector3 away = (transform.position - player.position).normalized;
                RepathTo(transform.position + away * 4f, dt);
            }
            else if (dist > keepMax || !los)
            {
                RepathTo(player.position, dt);
            }
            else
            {
                agent.ResetPath();
                FacePlayer(dt);
            }

            if (los && dist >= keepMin * 0.8f)
            {
                EnemyAttack atk = ChooseAttack(dist);
                if (atk != null) BeginAttack(atk);
            }
        }

        void RepathTo(Vector3 target, float dt)
        {
            repathTimer -= dt;
            if (repathTimer > 0f) return;
            repathTimer = 0.2f;
            if (NavMesh.SamplePosition(target, out NavMeshHit hit, 3f, NavMesh.AllAreas)) agent.SetDestination(hit.position);
        }

        /// <summary>
        /// Điểm vây quanh người chơi. Mỗi con một góc riêng (chia đều theo số con đang truy đuổi),
        /// cứ con thứ 3 làm Blocker đứng sau lưng người chơi để cắt đường lui.
        /// </summary>
        Vector3 ComputeSurroundPoint()
        {
            int count = Mathf.Max(1, Chasers.Count);
            int idx = Mathf.Max(0, Chasers.IndexOf(this));

            if (idx % 3 == 2)
                return player.position - player.forward * encircleRadius;

            float ang = (360f / count) * idx + Time.time * orbitSpeed;
            return player.position + Quaternion.Euler(0f, ang, 0f) * Vector3.forward * encircleRadius;
        }

        // ---- Token tấn công (chỉ áp dụng cho Minion) ----

        bool TryAcquireToken()
        {
            if (archetype != EnemyArchetype.Minion) return true;
            if (holdsToken) return true;
            if (Time.time < tokenBlockedUntil) return false;
            if (activeAttackers >= MaxSimultaneousAttackers) return false;
            activeAttackers++; holdsToken = true;
            return true;
        }

        void ReleaseToken()
        {
            if (!holdsToken) return;
            holdsToken = false;
            activeAttackers = Mathf.Max(0, activeAttackers - 1);
            tokenBlockedUntil = Time.time + UnityEngine.Random.Range(tokenCooldownMin, tokenCooldownMax);
        }

        void Register() { if (!Chasers.Contains(this)) Chasers.Add(this); }
        void Unregister() { Chasers.Remove(this); }

        // =====================================================================
        //  ATTACK
        // =====================================================================

        /// <summary>Chọn ngẫu nhiên có trọng số trong số đòn đủ tầm và đã hồi chiêu.</summary>
        EnemyAttack ChooseAttack(float dist)
        {
            float total = 0f;
            for (int i = 0; i < attacks.Length; i++)
                if (IsEligible(i, dist)) total += attacks[i].weight;
            if (total <= 0f) return null;

            float roll = UnityEngine.Random.value * total;
            for (int i = 0; i < attacks.Length; i++)
            {
                if (!IsEligible(i, dist)) continue;
                roll -= attacks[i].weight;
                if (roll <= 0f) return attacks[i];
            }
            return null;
        }

        bool IsEligible(int i, float dist)
        {
            var a = attacks[i];
            return Time.time >= attackReadyAt[i] && dist >= a.minRange && dist <= a.maxRange;
        }

        void BeginAttack(EnemyAttack atk)
        {
            currentAttack = atk;
            int idx = Array.IndexOf(attacks, atk);
            attackReadyAt[idx] = Time.time + atk.cooldown + atk.windup + atk.active + atk.recover;
            ChangeState(EnemyState.Attack);
        }

        void UpdateAttack(float dt)
        {
            attackTimer += dt;

            switch (attackPhase)
            {
                case Phase.Windup:
                    // Nửa đầu gồng: còn xoay theo người chơi; nửa sau khoá hướng để người chơi đọc được đòn.
                    if (attackTimer < currentAttack.windup * 0.5f) FacePlayer(dt);
                    if (attackTimer >= currentAttack.windup)
                    {
                        attackPhase = Phase.Active; attackTimer = 0f;
                        SetTelegraph(false, false);
                        ExecuteAttackStart();
                    }
                    break;

                case Phase.Active:
                    // Melee kiểm tra mỗi frame trong khung active tới khi người chơi lọt vào hitbox
                    // (để lăn né có I-frame vẫn cần đúng nhịp).
                    if (currentAttack.kind == EnemyAttackKind.Melee && !attackResolved) TryMeleeHit();
                    if (attackTimer >= currentAttack.active) { attackPhase = Phase.Recover; attackTimer = 0f; }
                    break;

                case Phase.Recover:
                    if (attackTimer >= currentAttack.recover) ChangeState(EnemyState.Chase);
                    break;
            }
        }

        void ExecuteAttackStart()
        {
            switch (currentAttack.kind)
            {
                case EnemyAttackKind.Projectile:
                    if (projectilePrefab != null)
                    {
                        Vector3 origin = muzzle != null ? muzzle.position : transform.position + Vector3.up * 1.4f;
                        Vector3 dir = (playerHealth.AimPoint - origin).normalized;
                        var proj = Instantiate(projectilePrefab, origin, Quaternion.LookRotation(dir));
                        proj.Init(gameObject, dir, currentAttack.damage * damageScale, currentAttack.poiseDamage, damageType);
                    }
                    attackResolved = true;
                    break;

                case EnemyAttackKind.GroundTrap:
                    if (trapPrefab != null)
                    {
                        Vector3 pos = player.position;
                        if (Physics.Raycast(pos + Vector3.up * 2f, Vector3.down, out RaycastHit hit, 6f, obstructionMask))
                            pos = hit.point;
                        var trap = Instantiate(trapPrefab, pos, Quaternion.identity);
                        trap.Init(gameObject, currentAttack.damage * damageScale, currentAttack.poiseDamage);
                    }
                    attackResolved = true;
                    break;
            }
        }

        void TryMeleeHit()
        {
            Vector3 to = player.position - transform.position;
            to.y = 0f;
            float d = to.magnitude;
            if (d > currentAttack.maxRange + 0.6f) return;                              // chưa tới tầm
            if (d > 0.1f && Vector3.Angle(transform.forward, to) > currentAttack.arcAngle * 0.5f) return;

            attackResolved = true;   // Đã chạm hitbox: tính một lần, bất kể người chơi né/đỡ được hay không.
            playerHealth.TakeDamage(new DamageInfo
            {
                amount = currentAttack.damage * damageScale,
                type = damageType,
                poiseDamage = currentAttack.poiseDamage,
                source = gameObject,
                hitPoint = playerHealth.AimPoint,
                hitDirection = to.normalized,
                isUnblockable = currentAttack.unblockable
            });
        }

        /// <summary>Bật/tắt đèn báo hiệu. Đỏ = Unblockable.</summary>
        void SetTelegraph(bool on, bool unblockable)
        {
            if (telegraphLight != null)
            {
                telegraphLight.enabled = on;
                telegraphLight.color = unblockable ? Color.red : Color.white;
            }
            if (on) onTelegraph?.Invoke(unblockable);
        }

        // =====================================================================
        //  STAGGER / EXECUTE / KNOCKBACK / TIME SLOW
        // =====================================================================

        void UpdateStaggered(float dt)
        {
            staggerTimer -= dt;
            if (staggerTimer <= 0f) ChangeState(EnemyState.Chase);
        }

        void HandlePoiseBroken()
        {
            if (hyperArmor || state == EnemyState.Die) return;   // Hyper-Armor: không bị ngắt chiêu
            EnterStagger(staggerDuration, false);
        }

        void HandleDamaged(DamageResult r, DamageInfo info)
        {
            if (info.hitDirection.sqrMagnitude > 0.01f) lastHitDir = info.hitDirection.normalized;
            // Bị đánh lén khi đang tuần tra -> lập tức truy đuổi.
            if (state == EnemyState.Patrol && !Health.IsDead) ChangeState(EnemyState.Chase);
        }

        void EnterStagger(float duration, bool execute)
        {
            if (state == EnemyState.Die) return;
            inExecute = execute;
            Health.DamageTakenMultiplier = execute ? executeDamageTakenMultiplier : 1f;
            staggerTimer = duration;
            ChangeState(EnemyState.Staggered);
        }

        public void ApplyStagger(float duration)
        {
            if (hyperArmor) return;
            EnterStagger(duration, false);
        }

        /// <summary>"Choáng Tẩy": kể cả Elite hyper-armor cũng bị (Parry là đáp án cho Elite).</summary>
        public void EnterExecuteState(float duration) => EnterStagger(duration, true);

        public void ApplyKnockback(Vector3 impulse)
        {
            if (hyperArmor || state == EnemyState.Die) return;
            knockVelocity = new Vector3(impulse.x, 0f, impulse.z);
        }

        void ApplyKnockback(float dt)
        {
            if (knockVelocity.sqrMagnitude < 0.01f || !agent.enabled) return;
            agent.Move(knockVelocity * dt);
            knockVelocity = Vector3.MoveTowards(knockVelocity, Vector3.zero, 25f * dt);
        }

        public void ApplyTimeSlow(float factor, float duration)
        {
            slowFactor = Mathf.Clamp(factor, 0.02f, 1f);
            slowTimer = Mathf.Max(slowTimer, duration);
        }

        // =====================================================================
        //  CHẾT & RAGDOLL
        // =====================================================================

        void HandleDeath() { ChangeState(EnemyState.Die); }

        void EnterDie()
        {
            Unregister(); ReleaseToken();
            SetTelegraph(false, false);
            if (Health.DamageTakenMultiplier != 1f) Health.DamageTakenMultiplier = 1f;

            if (agent.enabled) { agent.isStopped = true; agent.enabled = false; }
            var col = GetComponent<Collider>();
            if (col != null) col.enabled = false;

            if (useRagdoll && ragdollBodies.Length > 0)
            {
                if (animator != null) animator.enabled = false;
                foreach (var rb in ragdollBodies) rb.isKinematic = false;
                ragdollBodies[0].AddForce(lastHitDir * ragdollImpulse + Vector3.up * 2f, ForceMode.Impulse);
            }
            else AnimatorSafe.Trigger(animator, "Die");

            onDied?.Invoke();
            OnEnemyKilled?.Invoke(this, cinderSoulsReward);
            Destroy(gameObject, despawnDelay);
        }

        // =====================================================================
        //  TIỆN ÍCH
        // =====================================================================

        float FlatDistanceToPlayer()
        {
            Vector3 d = player.position - transform.position;
            d.y = 0f;
            return d.magnitude;
        }

        void FacePlayer(float dt)
        {
            Vector3 to = player.position - transform.position;
            to.y = 0f;
            if (to.sqrMagnitude < 0.001f) return;
            transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(to),
                                                  1f - Mathf.Exp(-turnSpeed * dt));
        }

        void OnDrawGizmosSelected()
        {
            Gizmos.color = Color.yellow; Gizmos.DrawWireSphere(transform.position, sightRange);
            Gizmos.color = Color.cyan; Gizmos.DrawWireSphere(transform.position, hearRange);
            if (attacks != null)
            {
                Gizmos.color = Color.red;
                foreach (var a in attacks) Gizmos.DrawWireSphere(transform.position, a.maxRange);
            }
        }
    }
}
