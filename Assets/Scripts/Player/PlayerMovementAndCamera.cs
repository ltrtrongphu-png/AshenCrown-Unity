using System;
using UnityEngine;
using AshenCrown.Core;

namespace AshenCrown.Player
{
    /// <summary>
    /// MODULE 1a - Di chuyển 8 hướng, Sprint (tiêu hao Stamina), Dynamic Lock-On.
    /// Camera nằm ở ThirdPersonCameraRig.cs (cùng module).
    ///
    /// Script này là "cơ bắp": nó chỉ biết đi, quay người, bị khoá/mở khoá.
    /// PlayerCombatSystem là "bộ não" ra lệnh qua các API công khai:
    ///   - MovementLocked / RotationLocked / SpeedMultiplier
    ///   - BeginForcedMovement (lăn né, lướt Void Thrust, lao theo đòn chém)
    ///   - GetDesiredFacing / FaceInstant
    /// Input dùng Input Manager cũ (Project Settings > Player > Active Input Handling = Both hoặc Old).
    /// </summary>
    [RequireComponent(typeof(CharacterController))]
    [RequireComponent(typeof(PlayerStamina))]
    public class PlayerMovementAndCamera : MonoBehaviour
    {
        [Header("Tham chiếu")]
        [Tooltip("Transform của Camera chính (để di chuyển theo hướng camera). Để trống = Camera.main")]
        public Transform cameraTransform;
        public Animator animator;

        [Header("Di chuyển")]
        [SerializeField] float moveSpeed = 4.2f;
        [SerializeField] float sprintSpeed = 7.2f;
        [SerializeField] float acceleration = 28f;
        [SerializeField] float deceleration = 40f;
        [Tooltip("Độ gắt khi xoay người. Càng cao càng nhanh.")]
        [SerializeField] float rotationSharpness = 16f;
        [SerializeField] float gravity = -30f;
        [SerializeField] float sprintStaminaPerSecond = 14f;
        [SerializeField] KeyCode sprintKey = KeyCode.LeftShift;

        [Header("Lock-On")]
        [SerializeField] KeyCode lockOnKey = KeyCode.Tab;
        [Tooltip("Layer của các collider kẻ địch (Enemy / Boss)")]
        [SerializeField] LayerMask lockOnMask;
        [Tooltip("Layer của địa hình/tường chắn tầm nhìn. KHÔNG chứa layer kẻ địch.")]
        [SerializeField] LayerMask obstructionMask;
        [SerializeField] float lockOnRadius = 20f;
        [Tooltip("Hệ số ưu tiên mục tiêu gần tâm màn hình khi auto-lock (cộng vào khoảng cách).")]
        [SerializeField] float centerWeight = 10f;
        [SerializeField] bool autoReacquireOnKill = true;
        [Tooltip("Ngưỡng vuốt chuột ngang để đổi mục tiêu (pixel/frame). Chỉnh theo độ nhạy.")]
        [SerializeField] float switchMouseThreshold = 12f;
        [SerializeField] float switchCooldown = 0.35f;

        // ----- Trạng thái công khai cho các hệ thống khác -----
        public bool IsSprinting { get; private set; }
        public bool HasMoveInput { get; private set; }
        public Vector3 MoveInputWorld { get; private set; }
        public Vector3 Velocity => horizontalVelocity;

        /// <summary>Combat bật khi đang vung đòn / lăn... để chặn đi bộ.</summary>
        public bool MovementLocked { get; set; }
        public bool RotationLocked { get; set; }
        /// <summary>Hệ số tốc độ (vd. 0.4 khi đang tích lực, 0.5 khi đang Block).</summary>
        public float SpeedMultiplier { get; set; } = 1f;

        public IDamageable LockOnTarget { get; private set; }
        public bool IsLockedOn => LockOnTarget != null && !LockOnTarget.IsDead;
        public event Action<IDamageable> OnLockOnChanged;

        CharacterController controller;
        PlayerStamina stamina;
        Camera cam;

        Vector3 horizontalVelocity;
        float verticalVelocity;
        Vector3 forcedVelocity;
        float forcedTimer;
        float switchTimer;

        static readonly Collider[] Buffer = new Collider[48];

        void Awake()
        {
            controller = GetComponent<CharacterController>();
            stamina = GetComponent<PlayerStamina>();
            if (cameraTransform == null && Camera.main != null) cameraTransform = Camera.main.transform;
            if (cameraTransform != null) cam = cameraTransform.GetComponent<Camera>();
        }

        void Update()
        {
            float dt = Time.deltaTime;
            ReadMoveInput();
            UpdateLockOn(dt);
            UpdateSprint(dt);
            UpdateHorizontalVelocity(dt);
            UpdateRotation(dt);
            ApplyMotion(dt);
            UpdateAnimator(dt);
        }

        // =====================================================================
        //  INPUT & DI CHUYỂN
        // =====================================================================

        /// <summary>
        /// Đọc WASD (hoặc cần analog) rồi đổi sang hướng THẾ GIỚI dựa trên camera.
        /// GetAxisRaw cho 8 hướng rời rạc trên bàn phím, và vẫn analog trên tay cầm.
        /// </summary>
        void ReadMoveInput()
        {
            float h = Input.GetAxisRaw("Horizontal");
            float v = Input.GetAxisRaw("Vertical");
            HasMoveInput = (h * h + v * v) > 0.01f;

            Vector3 camF = cameraTransform != null ? cameraTransform.forward : Vector3.forward;
            Vector3 camR = cameraTransform != null ? cameraTransform.right : Vector3.right;
            camF.y = 0f; camR.y = 0f;
            camF.Normalize(); camR.Normalize();

            Vector3 dir = camF * v + camR * h;
            MoveInputWorld = dir.sqrMagnitude > 1f ? dir.normalized : dir;
        }

        void UpdateSprint(float dt)
        {
            bool want = Input.GetKey(sprintKey) && HasMoveInput && !MovementLocked
                        && forcedTimer <= 0f && stamina.CanSprint;
            IsSprinting = want;
            if (want) stamina.Drain(sprintStaminaPerSecond * dt);
        }

        void UpdateHorizontalVelocity(float dt)
        {
            if (forcedTimer > 0f)
            {
                // Chuyển động cưỡng bức (lăn/lướt) ghi đè hoàn toàn input.
                horizontalVelocity = forcedVelocity;
                forcedTimer -= dt;
                if (forcedTimer <= 0f) horizontalVelocity = Vector3.zero;
                return;
            }

            Vector3 target = Vector3.zero;
            if (!MovementLocked && HasMoveInput)
                target = MoveInputWorld * (IsSprinting ? sprintSpeed : moveSpeed) * SpeedMultiplier;

            float rate = target.sqrMagnitude > 0.01f ? acceleration : deceleration;
            horizontalVelocity = Vector3.MoveTowards(horizontalVelocity, target, rate * dt);
        }

        void UpdateRotation(float dt)
        {
            if (forcedTimer > 0f || RotationLocked) return;

            Vector3 face = Vector3.zero;
            if (IsLockedOn && !IsSprinting)
            {
                // Lock-on: luôn quay mặt về mục tiêu (strafe). Chạy nước rút thì quay theo hướng chạy.
                face = LockOnTarget.Transform.position - transform.position;
                face.y = 0f;
            }
            else if (HasMoveInput && !MovementLocked)
            {
                face = MoveInputWorld;
            }

            if (face.sqrMagnitude > 0.001f)
            {
                Quaternion goal = Quaternion.LookRotation(face);
                transform.rotation = Quaternion.Slerp(transform.rotation, goal, 1f - Mathf.Exp(-rotationSharpness * dt));
            }
        }

        void ApplyMotion(float dt)
        {
            if (controller.isGrounded && verticalVelocity < 0f) verticalVelocity = -2f;
            else verticalVelocity += gravity * dt;

            Vector3 motion = horizontalVelocity + Vector3.up * verticalVelocity;
            controller.Move(motion * dt);
        }

        // =====================================================================
        //  API CHO COMBAT
        // =====================================================================

        /// <summary>Đẩy nhân vật đi một quãng đều trong duration giây (né, lướt, lao tới theo đòn chém).</summary>
        public void BeginForcedMovement(Vector3 direction, float distance, float duration, bool faceDirection = true)
        {
            direction.y = 0f;
            if (direction.sqrMagnitude < 0.0001f) direction = transform.forward;
            direction.Normalize();
            duration = Mathf.Max(0.01f, duration);

            forcedVelocity = direction * (distance / duration);
            forcedTimer = duration;
            IsSprinting = false;
            if (faceDirection) transform.rotation = Quaternion.LookRotation(direction);
        }

        public void CancelForcedMovement() { forcedTimer = 0f; horizontalVelocity = Vector3.zero; }
        public bool IsForcedMoving => forcedTimer > 0f;

        public void FaceInstant(Vector3 direction)
        {
            direction.y = 0f;
            if (direction.sqrMagnitude > 0.0001f) transform.rotation = Quaternion.LookRotation(direction);
        }

        /// <summary>Hướng mà đòn đánh nên nhắm: về phía lock-on, hoặc hướng input, hoặc hướng đang nhìn.</summary>
        public Vector3 GetDesiredFacing()
        {
            if (IsLockedOn)
            {
                Vector3 to = LockOnTarget.Transform.position - transform.position;
                to.y = 0f;
                if (to.sqrMagnitude > 0.001f) return to.normalized;
            }
            if (HasMoveInput && MoveInputWorld.sqrMagnitude > 0.001f) return MoveInputWorld.normalized;
            return transform.forward;
        }

        // =====================================================================
        //  LOCK-ON
        // =====================================================================

        void UpdateLockOn(float dt)
        {
            switchTimer -= dt;

            if (Input.GetKeyDown(lockOnKey) || Input.GetKeyDown(KeyCode.Mouse2))
            {
                if (LockOnTarget != null) SetTarget(null);
                else SetTarget(FindTarget(null, 0));
            }

            if (LockOnTarget == null) return;

            // Mục tiêu chết hoặc quá xa -> thả khoá (hoặc tự bắt mục tiêu gần nhất kế tiếp).
            bool dead = LockOnTarget.IsDead;
            float dist = Vector3.Distance(transform.position, LockOnTarget.Transform.position);
            if (dead || dist > lockOnRadius * 1.25f)
            {
                SetTarget(dead && autoReacquireOnKill ? FindTarget(null, 0) : null);
                return;
            }

            // Vuốt chuột ngang (hoặc cần gạt phải) để đổi mục tiêu sang trái/phải.
            float mx = Input.GetAxisRaw("Mouse X");
            if (switchTimer <= 0f && Mathf.Abs(mx) >= switchMouseThreshold)
            {
                var next = FindTarget(LockOnTarget, (int)Mathf.Sign(mx));
                if (next != null) { SetTarget(next); switchTimer = switchCooldown; }
            }
        }

        void SetTarget(IDamageable t)
        {
            if (ReferenceEquals(LockOnTarget, t)) return;
            LockOnTarget = t;
            OnLockOnChanged?.Invoke(t);
        }

        /// <summary>
        /// side = 0: bắt mục tiêu "tốt nhất" (gần + gần tâm màn hình).
        /// side = -1/+1: chọn mục tiêu kế bên trái/phải mục tiêu hiện tại (theo toạ độ màn hình).
        /// </summary>
        IDamageable FindTarget(IDamageable exclude, int side)
        {
            if (cam == null) return null;

            int n = Physics.OverlapSphereNonAlloc(transform.position, lockOnRadius, Buffer, lockOnMask,
                                                  QueryTriggerInteraction.Ignore);
            IDamageable best = null;
            float bestScore = float.MaxValue;
            float refX = 0.5f;
            if (side != 0 && exclude != null) refX = cam.WorldToViewportPoint(exclude.AimPoint).x;

            for (int i = 0; i < n; i++)
            {
                var d = Buffer[i].GetComponentInParent<IDamageable>();
                if (d == null || d.IsDead || ReferenceEquals(d, exclude)) continue;
                if (d.Transform == transform || d.Transform.IsChildOf(transform)) continue;

                // Phải nằm trong khung hình.
                Vector3 vp = cam.WorldToViewportPoint(d.AimPoint);
                if (vp.z <= 0f || vp.x < -0.05f || vp.x > 1.05f || vp.y < -0.05f || vp.y > 1.05f) continue;
                if (!HasLineOfSight(d)) continue;

                float score;
                if (side != 0)
                {
                    float dx = (vp.x - refX) * side;
                    if (dx <= 0.01f) continue;           // phải nằm đúng phía được vuốt
                    score = dx;
                }
                else
                {
                    float dist = Vector3.Distance(transform.position, d.Transform.position);
                    score = dist + Mathf.Abs(vp.x - 0.5f) * centerWeight;
                }

                if (score < bestScore) { bestScore = score; best = d; }
            }
            return best;
        }

        bool HasLineOfSight(IDamageable d)
        {
            Vector3 eye = transform.position + Vector3.up * 1.5f;
            return !Physics.Linecast(eye, d.AimPoint, obstructionMask, QueryTriggerInteraction.Ignore);
        }

        // =====================================================================
        //  ANIMATOR
        // =====================================================================

        void UpdateAnimator(float dt)
        {
            if (animator == null) return;

            // Vận tốc theo hệ trục của nhân vật -> Blend Tree strafe 8 hướng khi lock-on.
            Vector3 local = transform.InverseTransformDirection(horizontalVelocity) / sprintSpeed;
            AnimatorSafe.SetFloat(animator, "MoveX", local.x, 0.08f, dt);
            AnimatorSafe.SetFloat(animator, "MoveZ", local.z, 0.08f, dt);
            AnimatorSafe.SetFloat(animator, "Speed", horizontalVelocity.magnitude / sprintSpeed, 0.08f, dt);
            AnimatorSafe.SetBool(animator, "Sprint", IsSprinting);
            AnimatorSafe.SetBool(animator, "LockedOn", IsLockedOn);
        }

        void OnDrawGizmosSelected()
        {
            Gizmos.color = new Color(1f, 0.6f, 0f, 0.5f);
            Gizmos.DrawWireSphere(transform.position, lockOnRadius);
        }
    }
}
