using UnityEngine;
using AshenCrown.Core;
using AshenCrown.Player;

namespace AshenCrown.Combat
{
    /// <summary>
    /// Central hit/parry/dodge feedback owner. It owns its hit-stop timescale override
    /// and restores the exact previous value when the timer expires or the component is disabled.
    /// </summary>
    public sealed class CombatPresentationFeedback : MonoBehaviour
    {
        public static CombatPresentationFeedback Instance { get; private set; }

        [SerializeField] ThirdPersonCameraRig cameraRig;
        [SerializeField, Range(0.01f, 0.25f)] float hitStopScale = 0.08f;
        [SerializeField, Range(0.01f, 0.2f)] float defaultHitStopDuration = 0.045f;

        float restoreAt;
        float previousTimeScale = 1f;
        bool hitStopActive;
        bool reducedMotion;

        public bool ReducedMotion => reducedMotion;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        static void ResetStatics()
        {
            Instance = null;
        }

        void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            if (GameSettingsService.Instance != null)
                reducedMotion = GameSettingsService.Instance.ReducedMotion;
        }

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

        void OnDestroy()
        {
            if (Instance == this)
                Instance = null;
        }

        void Update()
        {
            if (hitStopActive && Time.unscaledTime >= restoreAt)
                RestoreTimeScale();
        }

        public void SetCameraRig(ThirdPersonCameraRig value)
        {
            cameraRig = value;
        }

        public void Hit(float strength, float duration)
        {
            if (reducedMotion)
                return;

            float safeStrength = ClampStrength(strength);
            float safeDuration = ClampDuration(duration, defaultHitStopDuration);
            if (cameraRig != null && safeStrength > 0f)
                cameraRig.Shake(safeStrength * 0.16f, safeDuration);

            BeginHitStop(safeDuration);
        }

        public void Parry(float strength)
        {
            Hit(strength * 1.15f, 0.055f);
        }

        public void PerfectDodge(float strength)
        {
            Hit(strength * 1.25f, 0.075f);
        }

        public void SetReducedMotion(bool enabled)
        {
            reducedMotion = enabled;
            if (reducedMotion)
                RestoreTimeScale();
        }

        public static float ClampStrength(float value)
        {
            if (float.IsNaN(value) || float.IsInfinity(value))
                return 0f;
            return Mathf.Clamp01(value);
        }

        public static float ClampDuration(float value, float fallback = 0.045f)
        {
            if (float.IsNaN(value) || float.IsInfinity(value) || value <= 0f)
                value = fallback;
            return Mathf.Clamp(value, 0.01f, 0.2f);
        }

        void BeginHitStop(float duration)
        {
            if (!hitStopActive)
                previousTimeScale = Time.timeScale;

            hitStopActive = true;
            Time.timeScale = Mathf.Clamp(hitStopScale, 0.01f, 0.25f);
            restoreAt = Mathf.Max(restoreAt, Time.unscaledTime + duration);
        }

        void RestoreTimeScale()
        {
            if (hitStopActive)
                Time.timeScale = previousTimeScale;

            hitStopActive = false;
            restoreAt = 0f;
        }

        void HandleSettingsChanged()
        {
            if (GameSettingsService.Instance == null)
                return;

            SetReducedMotion(GameSettingsService.Instance.ReducedMotion);
        }
    }
}
