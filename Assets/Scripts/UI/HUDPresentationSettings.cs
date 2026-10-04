using UnityEngine;

namespace AshenCrown.UI
{
    public sealed class HUDPresentationSettings : MonoBehaviour
    {
        const string ReducedMotionKey = "AshenCrown.ReducedMotion";
        const string AlphaKey = "AshenCrown.UIAlpha";
        const string ScaleKey = "AshenCrown.UIScale";

        public bool ReducedMotion
        {
            get => PlayerPrefs.GetInt(ReducedMotionKey, 0) != 0;
            set => PlayerPrefs.SetInt(ReducedMotionKey, value ? 1 : 0);
        }

        public float UIAlpha
        {
            get => PlayerPrefs.GetFloat(AlphaKey, 1f);
            set => PlayerPrefs.SetFloat(AlphaKey, Mathf.Clamp(value, 0.65f, 1f));
        }

        public float UIScale
        {
            get => PlayerPrefs.GetFloat(ScaleKey, 1f);
            set => PlayerPrefs.SetFloat(ScaleKey, Mathf.Clamp(value, 0.85f, 1.35f));
        }

        public void Save() => PlayerPrefs.Save();
    }
}
