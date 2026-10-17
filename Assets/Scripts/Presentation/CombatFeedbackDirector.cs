using UnityEngine;
using AshenCrown.Core;
using AshenCrown.Combat;
using AshenCrown.Player;

namespace AshenCrown.Presentation
{
    /// <summary>Compatibility facade for camera shake and time-scaled impact feedback.</summary>
    public sealed class CombatFeedbackDirector : MonoBehaviour
    {
        [SerializeField] ThirdPersonCameraRig cameraRig;
        [SerializeField, Range(0.01f, 0.25f)] float hitStopScale = 0.08f;
        bool reducedMotion;

        void OnEnable()
        {
            if (GameSettingsService.Instance != null)
            {
                GameSettingsService.Instance.SettingsChanged += HandleSettingsChanged;
                reducedMotion = GameSettingsService.Instance.ReducedMotion;
            }
        }

        void OnDisable()
        {
            if (GameSettingsService.Instance != null)
                GameSettingsService.Instance.SettingsChanged -= HandleSettingsChanged;
            TimeScaleService.ReleaseAll(this);
        }

        public void Impact(float cameraShake = 0.08f, float duration = 0.12f)
        {
            if (reducedMotion)
                return;

            float safeDuration = Mathf.Clamp(
                float.IsNaN(duration) || float.IsInfinity(duration) ? 0.12f : duration,
                0.01f,
                0.5f);

            if (CombatPresentationFeedback.Instance != null)
            {
                CombatPresentationFeedback.Instance.Hit(Mathf.Clamp01(cameraShake / 0.16f), safeDuration);
                return;
            }

            if (cameraRig != null)
                cameraRig.Shake(Mathf.Clamp(cameraShake, 0f, 1f), safeDuration);
            TimeScaleService.Request(this, Mathf.Clamp(hitStopScale, 0.01f, 0.25f),
                Mathf.Min(0.06f, safeDuration * 0.5f), 10);
        }

        void HandleSettingsChanged()
        {
            if (GameSettingsService.Instance == null)
                return;

            reducedMotion = GameSettingsService.Instance.ReducedMotion;
            if (reducedMotion)
                TimeScaleService.ReleaseAll(this);
        }
    }
}
