using UnityEngine;
using AshenCrown.Player;

namespace AshenCrown.Presentation
{
    /// <summary>Central presentation hooks for hit-stop, camera shake and combat emphasis.</summary>
    public sealed class CombatFeedbackDirector : MonoBehaviour
    {
        [SerializeField] ThirdPersonCameraRig cameraRig;
        [SerializeField] float hitStopScale = 0.08f;

        float restoreAt;
        float previousScale = 1f;

        public void Impact(float cameraShake = 0.08f, float duration = 0.12f)
        {
            if (cameraRig != null) cameraRig.Shake(cameraShake, duration);
            if (hitStopScale > 0f)
            {
                previousScale = Time.timeScale;
                Time.timeScale = hitStopScale;
                restoreAt = Time.unscaledTime + 0.045f;
            }
        }

        void Update()
        {
            if (restoreAt > 0f && Time.unscaledTime >= restoreAt)
            {
                Time.timeScale = previousScale;
                restoreAt = 0f;
            }
        }

        void OnDisable()
        {
            Time.timeScale = 1f;
        }
    }
}
