using UnityEngine;
using AshenCrown.Core;

namespace AshenCrown.Player
{
    public enum CameraViewMode
    {
        FirstPerson = 1,
        Shoulder = 2,
        ThirdPerson = 3
    }

    /// <summary>
    /// Unified camera system:
    /// 1 = First Person, 2 = over-the-shoulder, 3 = classic third person.
    /// V cycles modes, C swaps shoulder in modes 2/3.
    /// Includes lock-on, wall collision, sprint FOV, zoom, shake and reduced-motion support.
    /// </summary>
    [RequireComponent(typeof(Camera))]
    public sealed class ThirdPersonCameraRig : MonoBehaviour
    {
        [Header("References")]
        public Transform followTarget;
        public PlayerMovementAndCamera movement;

        [Header("View Modes")]
        [SerializeField] CameraViewMode startMode = CameraViewMode.ThirdPerson;
        [SerializeField] KeyCode cycleModeKey = KeyCode.V;
        [SerializeField] KeyCode shoulderSwapKey = KeyCode.C;
        [SerializeField] KeyCode firstPersonKey = KeyCode.Alpha1;
        [SerializeField] KeyCode shoulderKey = KeyCode.Alpha2;
        [SerializeField] KeyCode thirdPersonKey = KeyCode.Alpha3;
        [SerializeField] bool saveMode = true;

        [Header("Pivot")]
        [SerializeField] Vector3 pivotOffset = new Vector3(0f, 1.55f, 0f);
        [SerializeField] Vector3 firstPersonOffset = new Vector3(0f, 0.18f, 0f);
        [SerializeField] float distance = 4.2f;
        [SerializeField] float shoulderDistance = 2.65f;
        [SerializeField] float shoulderOffset = 0.65f;
        [SerializeField] float firstPersonDistance = 0.05f;
        [SerializeField] float followSmoothTime = 0.06f;

        [Header("Look")]
        [SerializeField] float mouseSensitivity = 2.2f;
        [SerializeField] bool invertY;
        [SerializeField] float minPitch = -75f;
        [SerializeField] float maxPitch = 75f;
        [SerializeField] float lockOnTurnSharpness = 7f;
        [SerializeField] float lockOnBasePitch = 14f;

        [Header("Zoom")]
        [SerializeField] KeyCode zoomKey = KeyCode.Z;
        [SerializeField] float zoomFov = 42f;
        [SerializeField] float baseFov = 62f;
        [SerializeField] float sprintFov = 70f;
        [SerializeField] float firstPersonFov = 78f;
        [SerializeField] float fovSharpness = 7f;

        [Header("Collision")]
        [SerializeField] LayerMask collisionMask;
        [SerializeField] float collisionRadius = 0.3f;
        [SerializeField] float minCollisionDistance = 0.35f;

        Camera cam;
        float yaw, pitch;
        float currentDistance;
        Vector3 pivotPos, pivotVel;
        float shakeAmp, shakeRemain, shakeDuration;
        bool rightShoulder = true;

        public CameraViewMode CurrentMode { get; private set; }
        public bool IsFirstPerson => CurrentMode == CameraViewMode.FirstPerson;
        public bool IsShoulderView => CurrentMode == CameraViewMode.Shoulder;
        public bool IsThirdPerson => CurrentMode == CameraViewMode.ThirdPerson;
        public bool IsZoomed { get; private set; }

        void Awake()
        {
            cam = GetComponent<Camera>();
            CurrentMode = saveMode
                ? (CameraViewMode)Mathf.Clamp(PlayerPrefs.GetInt("ashen.camera.mode", (int)startMode), 1, 3)
                : startMode;
            rightShoulder = PlayerPrefs.GetInt("ashen.camera.shoulder", 1) == 1;
        }

        void Start()
        {
            Vector3 e = transform.eulerAngles;
            yaw = e.y;
            pitch = e.x > 180f ? e.x - 360f : e.x;
            if (followTarget != null) pivotPos = followTarget.position + pivotOffset;
            currentDistance = GetTargetDistance();
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
            ApplyFirstPersonVisuals();
        }

        void Update()
        {
            if (Input.GetKeyDown(firstPersonKey)) SetMode(CameraViewMode.FirstPerson);
            else if (Input.GetKeyDown(shoulderKey)) SetMode(CameraViewMode.Shoulder);
            else if (Input.GetKeyDown(thirdPersonKey)) SetMode(CameraViewMode.ThirdPerson);
            else if (Input.GetKeyDown(cycleModeKey)) CycleMode();

            if (Input.GetKeyDown(shoulderSwapKey) && !IsFirstPerson)
            {
                rightShoulder = !rightShoulder;
                if (saveMode)
                {
                    PlayerPrefs.SetInt("ashen.camera.shoulder", rightShoulder ? 1 : 0);
                    PlayerPrefs.Save();
                }
            }

            IsZoomed = Input.GetKey(zoomKey) && !IsFirstPerson;

            if (Input.GetKeyDown(KeyCode.Escape))
            {
                bool locked = Cursor.lockState == CursorLockMode.Locked;
                Cursor.lockState = locked ? CursorLockMode.None : CursorLockMode.Locked;
                Cursor.visible = locked;
            }
        }

        void LateUpdate()
        {
            if (followTarget == null) return;
            float dt = Time.deltaTime;

            Vector3 desiredPivotOffset = IsFirstPerson ? pivotOffset + firstPersonOffset : pivotOffset;
            pivotPos = Vector3.SmoothDamp(pivotPos, followTarget.position + desiredPivotOffset, ref pivotVel, followSmoothTime);

            if (movement != null && movement.IsLockedOn && movement.LockOnTarget != null)
            {
                Vector3 toTarget = movement.LockOnTarget.AimPoint - pivotPos;
                Vector3 flat = new Vector3(toTarget.x, 0f, toTarget.z);
                float goalYaw = Mathf.Atan2(toTarget.x, toTarget.z) * Mathf.Rad2Deg;
                float heightAngle = Mathf.Atan2(toTarget.y, Mathf.Max(0.5f, flat.magnitude)) * Mathf.Rad2Deg;
                float goalPitch = Mathf.Clamp(lockOnBasePitch - heightAngle * 0.5f, minPitch, maxPitch);
                float k = 1f - Mathf.Exp(-lockOnTurnSharpness * dt);
                yaw = Mathf.LerpAngle(yaw, goalYaw, k);
                pitch = Mathf.Lerp(pitch, goalPitch, k);
            }
            else if (Cursor.lockState == CursorLockMode.Locked)
            {
                yaw += Input.GetAxis("Mouse X") * mouseSensitivity;
                pitch += Input.GetAxis("Mouse Y") * mouseSensitivity * (invertY ? 1f : -1f);
                pitch = Mathf.Clamp(pitch, minPitch, maxPitch);
            }

            Quaternion rot = Quaternion.Euler(pitch, yaw, 0f);
            float targetDistance = GetTargetDistance();
            currentDistance = Mathf.Lerp(currentDistance, targetDistance, 1f - Mathf.Exp(-12f * dt));

            Vector3 localOffset;
            if (IsFirstPerson)
                localOffset = new Vector3(0f, 0f, -firstPersonDistance);
            else
            {
                float side = rightShoulder ? 1f : -1f;
                localOffset = new Vector3(side * GetShoulderOffset(), 0f, -currentDistance);
            }

            Vector3 desired = pivotPos + rot * localOffset;
            if (!IsFirstPerson) desired = ResolveCollision(pivotPos, desired);

            transform.SetPositionAndRotation(desired + ComputeShake(dt), rot);

            float targetFov;
            if (IsFirstPerson) targetFov = firstPersonFov;
            else if (IsZoomed) targetFov = zoomFov;
            else targetFov = movement != null && movement.IsSprinting ? sprintFov : baseFov;
            cam.fieldOfView = Mathf.Lerp(cam.fieldOfView, targetFov, 1f - Mathf.Exp(-fovSharpness * dt));
        }

        public void SetMode(CameraViewMode mode)
        {
            CurrentMode = mode;
            if (saveMode)
            {
                PlayerPrefs.SetInt("ashen.camera.mode", (int)mode);
                PlayerPrefs.Save();
            }
            ApplyFirstPersonVisuals();
        }

        public void CycleMode()
        {
            SetMode(CurrentMode == CameraViewMode.ThirdPerson
                ? CameraViewMode.FirstPerson
                : (CameraViewMode)((int)CurrentMode + 1));
        }

        public Vector3 GetAimDirection()
        {
            Vector3 forward = transform.forward;
            forward.y = 0f;
            return forward.sqrMagnitude > 0.001f ? forward.normalized : transform.forward;
        }

        public Vector3 GetAimPoint() => transform.position + transform.forward * 100f;

        public void Shake(float amplitude, float duration)
        {
            if (GameSettingsService.Instance != null && GameSettingsService.Instance.ReducedMotion) return;
            float currentStrength = shakeDuration > 0f ? shakeAmp * (shakeRemain / shakeDuration) : 0f;
            if (amplitude < currentStrength) return;
            shakeAmp = amplitude;
            shakeDuration = duration;
            shakeRemain = duration;
        }

        float GetTargetDistance()
        {
            if (IsFirstPerson) return firstPersonDistance;
            if (IsShoulderView) return shoulderDistance;
            return distance;
        }

        float GetShoulderOffset() => IsShoulderView ? shoulderOffset : shoulderOffset * 0.7f;

        Vector3 ResolveCollision(Vector3 origin, Vector3 desired)
        {
            Vector3 dir = desired - origin;
            float len = dir.magnitude;
            if (len <= 0.01f) return desired;
            if (Physics.SphereCast(origin, collisionRadius, dir / len, out RaycastHit hit, len,
                                   collisionMask, QueryTriggerInteraction.Ignore))
                return origin + (dir / len) * Mathf.Max(minCollisionDistance, hit.distance - 0.1f);
            return desired;
        }

        Vector3 ComputeShake(float dt)
        {
            if (shakeRemain <= 0f) return Vector3.zero;
            shakeRemain -= dt;
            float strength = shakeAmp * Mathf.Clamp01(shakeRemain / Mathf.Max(0.01f, shakeDuration));
            float t = Time.time * 40f;
            return new Vector3(Mathf.PerlinNoise(t, 0f) - 0.5f,
                               Mathf.PerlinNoise(0f, t) - 0.5f,
                               Mathf.PerlinNoise(t, t) - 0.5f) * 2f * strength;
        }

        void ApplyFirstPersonVisuals()
        {
            if (followTarget == null) return;
            foreach (var r in followTarget.GetComponentsInChildren<Renderer>(true))
            {
                if (r == null || r.gameObject == gameObject) continue;
                r.enabled = !IsFirstPerson;
            }
        }
    }
}