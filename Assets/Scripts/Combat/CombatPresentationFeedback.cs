using UnityEngine;
using AshenCrown.Player;

namespace AshenCrown.Combat
{
    [DisallowMultipleComponent]
    public sealed class CombatPresentationFeedback : MonoBehaviour
    {
        [SerializeField, Range(0f, 8f)] float maxFovKick = 2.5f;
        [SerializeField, Min(0.01f)] float decay = 14f;
        [SerializeField] bool reducedMotion;

        PlayerCombatSystem combat;
        Camera targetCamera;
        float kick;
        float appliedOffset;

        void Awake() => combat = GetComponent<PlayerCombatSystem>();

        void OnEnable()
        {
            if (combat == null) combat = GetComponent<PlayerCombatSystem>();
            if (combat == null) return;
            combat.OnPerfectDodge += HandlePerfectDodge;
            combat.OnParry += HandleParry;
            combat.OnAttackActive += HandleAttackActive;
        }

        void OnDisable()
        {
            if (combat != null)
            {
                combat.OnPerfectDodge -= HandlePerfectDodge;
                combat.OnParry -= HandleParry;
                combat.OnAttackActive -= HandleAttackActive;
            }
            RestoreCameraOffset();
        }

        void LateUpdate()
        {
            if (targetCamera == null) targetCamera = Camera.main;
            if (targetCamera == null) return;
            if (Mathf.Abs(appliedOffset) > 0.0001f)
            {
                targetCamera.fieldOfView -= appliedOffset;
                appliedOffset = 0f;
            }
            kick = Mathf.MoveTowards(kick, 0f, decay * Time.unscaledDeltaTime);
            if (reducedMotion || kick <= 0.0001f) return;
            appliedOffset = Mathf.Clamp(kick, 0f, maxFovKick);
            targetCamera.fieldOfView += appliedOffset;
        }

        void RestoreCameraOffset()
        {
            if (targetCamera != null && Mathf.Abs(appliedOffset) > 0.0001f)
                targetCamera.fieldOfView -= appliedOffset;
            appliedOffset = 0f;
        }

        public void Hit(float strength, float duration)
        {
            if (reducedMotion) return;
            kick = Mathf.Clamp(kick + Mathf.Clamp01(strength) * maxFovKick, 0f, maxFovKick);
        }

        public void Parry(float strength) => Hit(strength * 1.25f, 0.08f);
        public void PerfectDodge(float strength) => Hit(strength, 0.06f);
        public void SetReducedMotion(bool enabled) => reducedMotion = enabled;

        void HandlePerfectDodge() => PerfectDodge(1f);
        void HandleParry(GameObject _) => Parry(1f);
        void HandleAttackActive(AttackProfile profile)
            => Hit(profile != null ? profile.cameraShake : 0.05f, profile != null ? profile.hitStopDuration : 0.04f);
    }
}
