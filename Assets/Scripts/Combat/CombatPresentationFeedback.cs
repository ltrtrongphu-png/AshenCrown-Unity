using UnityEngine;
using AshenCrown.Core;
using AshenCrown.Player;

namespace AshenCrown.Combat
{
    [DisallowMultipleComponent]
    [DefaultExecutionOrder(1200)]
    public sealed class CombatPresentationFeedback : MonoBehaviour
    {
        [SerializeField, Range(0f, 8f)] float maxFovKick = 2.8f;
        [SerializeField, Range(0f, 1f)] float bobStrength = 0.035f;
        [SerializeField, Range(0f, 4f)] float rollStrength = 1.15f;
        [SerializeField, Min(0.01f)] float impactDecay = 13f;
        [SerializeField] bool reducedMotion;

        PlayerCombatSystem combat;
        PlayerMovementAndCamera movement;
        HealthAndDamageSystem health;
        ThirdPersonCameraRig rig;
        Camera targetCamera;

        float impact;
        float appliedFov;
        Vector3 appliedPosition;
        Quaternion appliedRotation = Quaternion.identity;

        void Awake()
        {
            combat = GetComponent<PlayerCombatSystem>();
            movement = GetComponent<PlayerMovementAndCamera>();
            health = GetComponent<HealthAndDamageSystem>();
            rig = Camera.main != null ? Camera.main.GetComponent<ThirdPersonCameraRig>() : null;
            SyncSettings();
        }

        void OnEnable()
        {
            if (combat == null) combat = GetComponent<PlayerCombatSystem>();
            if (health == null) health = GetComponent<HealthAndDamageSystem>();

            if (combat != null)
            {
                combat.OnPerfectDodge += HandlePerfectDodge;
                combat.OnParry += HandleParry;
                combat.OnAttackActive += HandleAttackActive;
                combat.OnHitConfirmed += HandleHitConfirmed;
                combat.OnChargeFull += HandleChargeFull;
            }
            if (health != null) health.OnDamaged += HandleDamaged;
            if (GameSettingsService.Instance != null) GameSettingsService.Instance.SettingsChanged += SyncSettings;
        }

        void OnDisable()
        {
            if (combat != null)
            {
                combat.OnPerfectDodge -= HandlePerfectDodge;
                combat.OnParry -= HandleParry;
                combat.OnAttackActive -= HandleAttackActive;
                combat.OnHitConfirmed -= HandleHitConfirmed;
                combat.OnChargeFull -= HandleChargeFull;
            }
            if (health != null) health.OnDamaged -= HandleDamaged;
            if (GameSettingsService.Instance != null) GameSettingsService.Instance.SettingsChanged -= SyncSettings;
            RestoreCameraPresentation();
        }

        void LateUpdate()
        {
            if (targetCamera == null) targetCamera = Camera.main;
            if (targetCamera == null) return;
            if (rig == null) rig = targetCamera.GetComponent<ThirdPersonCameraRig>();

            RemovePreviousPresentation();

            impact = Mathf.MoveTowards(impact, 0f, impactDecay * Time.unscaledDeltaTime);
            if (GameSettingsService.Instance != null)
                reducedMotion = GameSettingsService.Instance.ReducedMotion;

            float speed01 = movement == null ? 0f : Mathf.Clamp01(movement.Velocity.magnitude / Mathf.Max(1f, movement.MaxPlanarSpeed));
            if (!reducedMotion && speed01 > 0.05f)
            {
                float frequency = movement != null && movement.IsSprinting ? 11.5f : 8.5f;
                float phase = Time.unscaledTime * frequency;
                float stride = Mathf.Sin(phase) * bobStrength * speed01;
                float sway = Mathf.Cos(phase * 0.5f) * bobStrength * 0.45f * speed01;

                appliedPosition = targetCamera.transform.up * stride + targetCamera.transform.right * sway;
                float roll = Mathf.Sin(phase * 0.5f) * rollStrength * speed01;
                appliedRotation = Quaternion.Euler(0f, 0f, roll);
            }

            if (!reducedMotion)
                appliedFov = Mathf.Min(maxFovKick, impact * maxFovKick);

            targetCamera.transform.position += appliedPosition;
            targetCamera.transform.rotation = targetCamera.transform.rotation * appliedRotation;
            targetCamera.fieldOfView += appliedFov;
        }

        void SyncSettings()
        {
            reducedMotion = GameSettingsService.Instance != null && GameSettingsService.Instance.ReducedMotion;
            if (reducedMotion) impact = 0f;
        }

        void RemovePreviousPresentation()
        {
            if (targetCamera == null) return;
            targetCamera.transform.position -= appliedPosition;
            targetCamera.transform.rotation = Quaternion.Inverse(appliedRotation) * targetCamera.transform.rotation;
            targetCamera.fieldOfView -= appliedFov;
            appliedPosition = Vector3.zero;
            appliedRotation = Quaternion.identity;
            appliedFov = 0f;
        }

        void RestoreCameraPresentation()
        {
            RemovePreviousPresentation();
            impact = 0f;
        }

        public void Hit(float strength, float duration)
        {
            if (reducedMotion) return;
            impact = Mathf.Clamp(impact + Mathf.Clamp01(strength), 0f, 1f);
        }

        public void Parry(float strength)
        {
            Hit(strength * 1.35f, 0.1f);
            if (rig != null) rig.Shake(0.22f, 0.12f);
        }

        public void PerfectDodge(float strength)
        {
            Hit(strength, 0.08f);
            if (rig != null) rig.Shake(0.08f, 0.1f);
        }

        public void SetReducedMotion(bool enabled)
        {
            reducedMotion = enabled;
            if (enabled) impact = 0f;
        }

        void HandlePerfectDodge() => PerfectDodge(1f);
        void HandleParry(GameObject _) => Parry(1f);

        void HandleAttackActive(AttackProfile profile)
        {
            float strength = profile != null ? profile.cameraShake : 0.05f;
            Hit(strength, profile != null ? profile.hitStopDuration : 0.04f);
        }

        void HandleHitConfirmed(DamageResult result, DamageInfo info)
        {
            if (result.finalDamage <= 0f) return;
            float strength = result.critical ? 1f : 0.65f;
            Hit(strength, 0.06f);
            if (rig != null) rig.Shake(0.04f + strength * 0.08f, 0.09f);
        }

        void HandleChargeFull()
        {
            if (!reducedMotion && rig != null) rig.Shake(0.035f, 0.13f);
        }

        void HandleDamaged(DamageResult result, DamageInfo info)
        {
            if (result.finalDamage <= 0f) return;
            Hit(Mathf.Clamp01(result.finalDamage / 100f), 0.1f);
            if (rig != null) rig.Shake(0.05f, 0.1f);
        }
    }
}