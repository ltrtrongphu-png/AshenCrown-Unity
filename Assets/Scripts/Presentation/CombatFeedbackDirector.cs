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

        float restoreAt;
        float previousScale = 1f;
        bool hitStopActive;
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
            RestoreTimeScale();
        }

        public void Impact(float cameraShake = 0.08f, float duration = 0.12f)
        {
            if (reducedMotion)
                return;

            if (CombatPresentationFeedback.Instance != null)
            {
                CombatPresentationFeedback.Instance.Hit(Mathf.Clamp01(cameraShake / 0.16f), duration);
                return;
            }

            float safeDuration = Mathf.Clamp(float.IsNaN(duration) ? 0.12f : duration, 0.01f, 0.5f);
            if (cameraRig != null)
                cameraRig.Shake(Mathf.Clamp(cameraShake, 0f, 1f), safeDuration);

            if (!hitStopActive)
                previousScale = Time.timeScale;

            hitStopActive = true;
            Time.timeScale = Mathf.Clamp(hitStopScale, 0.01f, 0.25f);
            restoreAt = Mathf.Max(restoreAt, Time.unscaledTime + Mathf.Min(.06f, safeDuration * .5f));
        }

        void Update()
        {
            if (hitStopActive && Time.unscaledTime >= restoreAt)
                RestoreTimeScale();
        }

        void HandleSettingsChanged()
        {
            if (GameSettingsService.Instance == null)
                return;

            reducedMotion = GameSettingsService.Instance.ReducedMotion;
            if (reducedMotion)
                RestoreTimeScale();
        }

        void RestoreTimeScale()
        {
            if (hitStopActive)
                Time.timeScale = previousScale;

            hitStopActive = false;
            restoreAt = 0f;
        }
    }
}
