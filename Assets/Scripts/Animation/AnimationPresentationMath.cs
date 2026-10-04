using UnityEngine;

namespace AshenCrown.Animation
{
    public static class AnimationPresentationMath
    {
        public static float ClampSpeed(float value) => Mathf.Clamp01(value);
        public static float ClampPlaybackSpeed(float value) => Mathf.Clamp(value, 0.01f, 3f);
        public static Vector3 ClampLocomotion(Vector3 value)
            => new Vector3(Mathf.Clamp(value.x, -1f, 1f), 0f, Mathf.Clamp(value.z, -1f, 1f));
    }
}
