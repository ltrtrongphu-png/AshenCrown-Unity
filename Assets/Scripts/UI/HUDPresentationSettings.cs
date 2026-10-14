using System;
using UnityEngine;
using AshenCrown.Core;

namespace AshenCrown.UI
{
    /// <summary>
    /// Small dependency-free presentation settings for IMGUI HUDs. ReducedMotion is
    /// shared with GameSettingsService; alpha and scale are persisted independently.
    /// </summary>
    public static class HUDPresentationSettings
    {
        const string AlphaKey = "ashen.ui.alpha";
        const string ScaleKey = "ashen.ui.scale";

        static bool loaded;
        static float uiAlpha = 1f;
        static float uiScale = 1f;

        public static event Action Changed;

        public static bool ReducedMotion => GameSettingsService.Instance != null
            ? GameSettingsService.Instance.ReducedMotion
            : PlayerPrefs.GetInt("ashen.reducedMotion", 0) == 1;

        public static float UIAlpha
        {
            get
            {
                LoadIfNeeded();
                return uiAlpha;
            }
            set => SetUIAlpha(value);
        }

        public static float UIScale
        {
            get
            {
                LoadIfNeeded();
                return uiScale;
            }
            set => SetUIScale(value);
        }

        public const int MaxQueuedToasts = 8;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        static void ResetStatics()
        {
            loaded = false;
            uiAlpha = 1f;
            uiScale = 1f;
            Changed = null;
        }

        public static float ClampAlpha(float value)
        {
            if (float.IsNaN(value) || float.IsInfinity(value))
                return 1f;
            return Mathf.Clamp(value, 0.35f, 1f);
        }

        public static float ClampScale(float value)
        {
            if (float.IsNaN(value) || float.IsInfinity(value))
                return 1f;
            return Mathf.Clamp(value, 0.8f, 1.25f);
        }

        public static void SetUIAlpha(float value)
        {
            LoadIfNeeded();
            float clamped = ClampAlpha(value);
            if (Mathf.Approximately(uiAlpha, clamped))
                return;

            uiAlpha = clamped;
            PlayerPrefs.SetFloat(AlphaKey, uiAlpha);
            PlayerPrefs.Save();
            Changed?.Invoke();
        }

        public static void SetUIScale(float value)
        {
            LoadIfNeeded();
            float clamped = ClampScale(value);
            if (Mathf.Approximately(uiScale, clamped))
                return;

            uiScale = clamped;
            PlayerPrefs.SetFloat(ScaleKey, uiScale);
            PlayerPrefs.Save();
            Changed?.Invoke();
        }

        static void LoadIfNeeded()
        {
            if (loaded)
                return;

            uiAlpha = ClampAlpha(PlayerPrefs.GetFloat(AlphaKey, 1f));
            uiScale = ClampScale(PlayerPrefs.GetFloat(ScaleKey, 1f));
            loaded = true;
        }
    }
}
