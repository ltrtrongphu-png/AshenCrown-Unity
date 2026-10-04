using UnityEngine;

namespace AshenCrown.UI
{
    public static class CinematicHUDMath
    {
        public static float ClampBar(float value) => Mathf.Clamp01(value);

        public static float Ease(float current, float target, float sharpness, float deltaTime)
            => Mathf.Lerp(current, target, 1f - Mathf.Exp(-Mathf.Max(0f, sharpness) * Mathf.Max(0f, deltaTime)));

        public static float Pulse(float timer, float duration)
        {
            if (duration <= 0f) return 0f;
            float t = Mathf.Clamp01(timer / duration);
            return t * t * (3f - 2f * t);
        }
    }
}