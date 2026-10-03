using System;
using UnityEngine;

namespace AshenCrown.Core
{
    /// <summary>Persistent player-facing settings without a dependency on a specific UI framework.</summary>
    public sealed class GameSettingsService : MonoBehaviour
    {
        public static GameSettingsService Instance { get; private set; }
        public bool ReducedMotion { get; private set; }
        public bool Subtitles { get; private set; } = true;
        public float MasterVolume { get; private set; } = 1f;
        public event Action SettingsChanged;

        void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            ReducedMotion = PlayerPrefs.GetInt("ashen.reducedMotion", 0) == 1;
            Subtitles = PlayerPrefs.GetInt("ashen.subtitles", 1) == 1;
            MasterVolume = PlayerPrefs.GetFloat("ashen.volume", 1f);
        }

        public void SetReducedMotion(bool value) { ReducedMotion = value; Save(); }
        public void SetSubtitles(bool value) { Subtitles = value; Save(); }
        public void SetMasterVolume(float value) { MasterVolume = Mathf.Clamp01(value); AudioListener.volume = MasterVolume; Save(); }

        void Save()
        {
            PlayerPrefs.SetInt("ashen.reducedMotion", ReducedMotion ? 1 : 0);
            PlayerPrefs.SetInt("ashen.subtitles", Subtitles ? 1 : 0);
            PlayerPrefs.SetFloat("ashen.volume", MasterVolume);
            PlayerPrefs.Save();
            SettingsChanged?.Invoke();
        }
    }
}
