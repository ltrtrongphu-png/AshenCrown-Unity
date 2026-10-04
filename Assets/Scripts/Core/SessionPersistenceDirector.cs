using System;
using UnityEngine;
using UnityEngine.SceneManagement;
using AshenCrown.Save;

namespace AshenCrown.Core
{
    /// <summary>
    /// Owns session-level reliability: periodic autosaves, pause/scene checkpoints,
    /// and a small amount of session telemetry that can be surfaced by UI.
    /// </summary>
    public sealed class SessionPersistenceDirector : MonoBehaviour
    {
        public static SessionPersistenceDirector Instance { get; private set; }

        [SerializeField, Min(15f)] float autosaveInterval = 120f;
        [SerializeField] bool saveOnSceneChange = true;
        [SerializeField] bool saveOnApplicationPause = true;

        public float SessionSeconds { get; private set; }
        public float SecondsUntilAutosave => Mathf.Max(0f, autosaveInterval - autosaveClock);
        public int AutosaveCount { get; private set; }
        public string LastSaveReason { get; private set; } = "startup";
        public DateTime SessionStartedUtc { get; private set; }

        float autosaveClock;

        void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
            SessionStartedUtc = DateTime.UtcNow;
        }

        void OnEnable()
        {
            SceneManager.sceneLoaded += OnSceneLoaded;
        }

        void OnDisable()
        {
            SceneManager.sceneLoaded -= OnSceneLoaded;
        }

        void Update()
        {
            SessionSeconds += Time.unscaledDeltaTime;
            autosaveClock += Time.unscaledDeltaTime;

            if (autosaveClock < autosaveInterval) return;
            Autosave("timer");
        }

        void OnSceneLoaded(Scene scene, LoadSceneMode mode)
        {
            if (saveOnSceneChange && mode == LoadSceneMode.Single)
                SaveCheckpoint("scene:" + scene.name);
        }

        void OnApplicationPause(bool paused)
        {
            if (paused && saveOnApplicationPause)
                SaveCheckpoint("pause");
        }

        void OnApplicationFocus(bool focused)
        {
            if (!focused && saveOnApplicationPause)
                SaveCheckpoint("focus-lost");
        }

        public void Autosave(string reason)
        {
            autosaveClock = 0f;
            if (SaveLoadSystem.Instance == null || !SaveLoadSystem.Instance.IsLoaded) return;

            if (SaveLoadSystem.Instance.Save("autosave:" + reason))
            {
                AutosaveCount++;
                LastSaveReason = "autosave:" + reason;
            }
        }

        public void SaveCheckpoint(string reason)
        {
            if (SaveLoadSystem.Instance == null || !SaveLoadSystem.Instance.IsLoaded) return;

            if (SaveLoadSystem.Instance.Save("checkpoint:" + reason))
                LastSaveReason = "checkpoint:" + reason;
        }

        public void ForceSave()
        {
            autosaveClock = 0f;
            if (SaveLoadSystem.Instance != null && SaveLoadSystem.Instance.IsLoaded && SaveLoadSystem.Instance.Save("manual"))
                LastSaveReason = "manual";
        }
    }
}
