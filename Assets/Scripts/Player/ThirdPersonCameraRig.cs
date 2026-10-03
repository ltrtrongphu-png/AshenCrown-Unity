using UnityEngine;

namespace AshenCrown.Player
{
    /// <summary>
    /// MODULE 1b - Camera góc nhìn thứ ba qua vai (Dynamic Shoulder Cam).
    /// Gắn lên chính GameObject Camera (KHÔNG làm con của Player).
    ///  - Chế độ tự do: chuột xoay yaw/pitch quanh nhân vật, lệch vai phải.
    ///  - Chế độ lock-on: camera tự xoay hướng về mục tiêu.
    ///  - Chống xuyên tường bằng SphereCast, FOV mở rộng khi Sprint, rung màn hình (Shake) khi trúng đòn.
    /// </summary>
    [RequireComponent(typeof(Camera))]
    public class ThirdPersonCameraRig : MonoBehaviour
    {
        [Header("Tham chiếu")]
        public Transform followTarget;
        public PlayerMovementAndCamera movement;

        [Header("Vị trí")]
        [SerializeField] Vector3 pivotOffset = new Vector3(0f, 1.55f, 0f);
        [SerializeField] float distance = 4.2f;
        [Tooltip("Lệch ngang sang vai phải (mét). Âm = vai trái.")]
        [SerializeField] float shoulderOffset = 0.65f;
        [SerializeField] float followSmoothTime = 0.06f;

        [Header("Xoay tự do")]
        [SerializeField] float mouseSensitivity = 2.2f;
        [SerializeField] bool invertY = false;
        [SerializeField] float minPitch = -30f;
        [SerializeField] float maxPitch = 65f;

        [Header("Lock-On")]
        [SerializeField] float lockOnTurnSharpness = 7f;
        [SerializeField] float lockOnBasePitch = 14f;

        [Header("Chống xuyên tường")]
        [SerializeField] LayerMask collisionMask;
        [SerializeField] float collisionRadius = 0.3f;

        [Header("FOV")]
        [SerializeField] float baseFov = 62f;
        [SerializeField] float sprintFov = 70f;
        [SerializeField] float fovSharpness = 6f;

        Camera cam;
        float yaw, pitch;
        Vector3 pivotPos, pivotVel;
        float shakeAmp, shakeRemain, shakeDuration;

        void Start()
        {
            cam = GetComponent<Camera>();
            Vector3 e = transform.eulerAngles;
            yaw = e.y;
            pitch = e.x > 180f ? e.x - 360f : e.x;
            if (followTarget != null) pivotPos = followTarget.position + pivotOffset;
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }

        void LateUpdate()
        {
            if (followTarget == null) return;
            float dt = Time.deltaTime;

            if (Input.GetKeyDown(KeyCode.Escape))
            {
                bool locked = Cursor.lockState == CursorLockMode.Locked;
                Cursor.lockState = locked ? CursorLockMode.None : CursorLockMode.Locked;
                Cursor.visible = locked;
            }

            // 1) Điểm xoay (pivot) bám theo nhân vật mượt.
            pivotPos = Vector3.SmoothDamp(pivotPos, followTarget.position + pivotOffset, ref pivotVel, followSmoothTime);

            // 2) Xoay camera.
            if (movement != null && movement.IsLockedOn)
            {
                Vector3 toT = movement.LockOnTarget.AimPoint - pivotPos;
                Vector3 flat = new Vector3(toT.x, 0f, toT.z);
                float goalYaw = Mathf.Atan2(toT.x, toT.z) * Mathf.Rad2Deg;
                float heightAngle = Mathf.Atan2(toT.y, Mathf.Max(0.5f, flat.magnitude)) * Mathf.Rad2Deg;
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

            // 3) Vị trí mong muốn + chống xuyên tường.
            Vector3 desired = pivotPos + rot * new Vector3(shoulderOffset, 0f, -distance);
            Vector3 dir = desired - pivotPos;
            float len = dir.magnitude;
            if (len > 0.01f && Physics.SphereCast(pivotPos, collisionRadius, dir / len, out RaycastHit hit,
                                                  len, collisionMask, QueryTriggerInteraction.Ignore))
            {
                desired = pivotPos + (dir / len) * Mathf.Max(0.4f, hit.distance - 0.1f);
            }

            transform.SetPositionAndRotation(desired + ComputeShake(dt), rot);

            // 4) FOV động.
            float goalFov = (movement != null && movement.IsSprinting) ? sprintFov : baseFov;
            cam.fieldOfView = Mathf.Lerp(cam.fieldOfView, goalFov, 1f - Mathf.Exp(-fovSharpness * dt));
        }

        /// <summary>Gọi từ Combat khi trúng đòn / Parry / Eruption.</summary>
        public void Shake(float amplitude, float duration)
        {
            float currentStrength = shakeDuration > 0f ? shakeAmp * (shakeRemain / shakeDuration) : 0f;
            if (amplitude < currentStrength) return;    // không để rung nhẹ đè rung mạnh
            shakeAmp = amplitude; shakeDuration = duration; shakeRemain = duration;
        }

        Vector3 ComputeShake(float dt)
        {
            if (shakeRemain <= 0f) return Vector3.zero;
            shakeRemain -= dt;
            float strength = shakeAmp * Mathf.Clamp01(shakeRemain / shakeDuration);
            float t = Time.time * 40f;
            return new Vector3(Mathf.PerlinNoise(t, 0f) - 0.5f, Mathf.PerlinNoise(0f, t) - 0.5f,
                               Mathf.PerlinNoise(t, t) - 0.5f) * 2f * strength;
        }
    }
}
