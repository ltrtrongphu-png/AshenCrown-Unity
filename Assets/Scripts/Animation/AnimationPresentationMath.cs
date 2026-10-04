using UnityEngine;

namespace AshenCrown.Animation
{
    public static class AnimationPresentationMath
    {
        public static float ClampSpeed(float value) => Mathf.Clamp01(value);

        public static float ClampPlaybackSpeed(float value)
            => ClampPlaybackSpeed(value, 0.01f, 3f);

        public static float ClampPlaybackSpeed(float value, float min, float max)
            => Mathf.Clamp(value, Mathf.Max(0.001f, min), Mathf.Max(min, max));

        public static Vector3 ClampLocomotion(Vector3 value)
            => ClampLocomotion(value, 0f);

        public static Vector3 ClampLocomotion(Vector3 value, float deadZone)
        {
            Vector3 flat = new Vector3(value.x, 0f, value.z);
            if (flat.sqrMagnitude <= deadZone * deadZone) return Vector3.zero;
            return new Vector3(Mathf.Clamp(flat.x, -1f, 1f), 0f, Mathf.Clamp(flat.z, -1f, 1f));
        }

        public static float ExpSmoothingFactor(float sharpness, float deltaTime)
            => 1f - Mathf.Exp(-Mathf.Max(0f, sharpness) * Mathf.Max(0f, deltaTime));
    }
}