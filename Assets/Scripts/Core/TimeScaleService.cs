using System;
using System.Collections.Generic;
using UnityEngine;

namespace AshenCrown.Core
{
    /// <summary>
    /// Single owner of global time scaling. Temporary effects compose by choosing the
    /// slowest active scale; an explicit pause always wins over hit-stop or slow motion.
    /// Durations use unscaled realtime so requests expire while the simulation is slowed.
    /// </summary>
    public static class TimeScaleService
    {
        sealed class ScaleRequest
        {
            public int Id;
            public object Owner;
            public float Scale;
            public float ExpiresAt;
            public int Priority;
        }

        static readonly Dictionary<int, ScaleRequest> Requests = new Dictionary<int, ScaleRequest>();
        static int nextId = 1;
        static bool paused;
        static Driver driver;

        public static float Effective => paused ? 0f : CalculateEffectiveScale(GetActiveScales(), false);
        public static bool IsPaused => paused;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        static void ResetStatics()
        {
            Requests.Clear();
            nextId = 1;
            paused = false;
            driver = null;
            if (!Mathf.Approximately(Time.timeScale, 1f))
                Time.timeScale = 1f;
        }

        public static int Request(object owner, float scale, float durationRealtime, int priority = 0)
        {
            if (owner == null) throw new ArgumentNullException(nameof(owner));
            EnsureDriver();

            if (float.IsNaN(scale) || float.IsInfinity(scale))
                scale = 1f;
            if (float.IsNaN(durationRealtime) || float.IsInfinity(durationRealtime))
                durationRealtime = 0.01f;

            int id = nextId++;
            if (nextId <= 0) nextId = 1;
            while (Requests.ContainsKey(id))
            {
                id = nextId++;
                if (nextId <= 0) nextId = 1;
            }

            Requests[id] = new ScaleRequest
            {
                Id = id,
                Owner = owner,
                Scale = Mathf.Clamp(scale, 0f, 1f),
                ExpiresAt = Time.unscaledTime + Mathf.Max(0.01f, durationRealtime),
                Priority = priority
            };
            ApplyEffectiveScale();
            return id;
        }

        public static void Release(int token)
        {
            if (Requests.Remove(token))
                ApplyEffectiveScale();
        }

        public static void ReleaseAll(object owner)
        {
            if (owner == null) return;
            bool changed = false;
            var expired = new List<int>();
            foreach (var pair in Requests)
            {
                if (ReferenceEquals(pair.Value.Owner, owner))
                    expired.Add(pair.Key);
            }
            for (int i = 0; i < expired.Count; i++)
                changed |= Requests.Remove(expired[i]);
            if (changed) ApplyEffectiveScale();
        }

        public static void SetPaused(bool value)
        {
            if (paused == value) return;
            EnsureDriver();
            paused = value;
            ApplyEffectiveScale();
        }

        /// <summary>Pure resolver exposed for EditMode regression tests.</summary>
        public static float CalculateEffectiveScale(IEnumerable<float> scales, bool pause)
        {
            if (pause) return 0f;
            float effective = 1f;
            if (scales == null) return effective;
            foreach (float value in scales)
            {
                if (float.IsNaN(value) || float.IsInfinity(value)) continue;
                effective = Mathf.Min(effective, Mathf.Clamp(value, 0f, 1f));
            }
            return effective;
        }

        static List<float> GetActiveScales()
        {
            var scales = new List<float>(Requests.Count);
            foreach (var request in Requests.Values)
                scales.Add(request.Scale);
            return scales;
        }

        static void Tick(float now)
        {
            bool changed = false;
            var expired = new List<int>();
            foreach (var pair in Requests)
            {
                if (now >= pair.Value.ExpiresAt || IsDestroyedUnityOwner(pair.Value.Owner))
                    expired.Add(pair.Key);
            }
            for (int i = 0; i < expired.Count; i++)
                changed |= Requests.Remove(expired[i]);
            if (changed || driver != null)
                ApplyEffectiveScale();
        }

        static bool IsDestroyedUnityOwner(object owner)
        {
            return owner is UnityEngine.Object unityObject && unityObject == null;
        }

        static void ApplyEffectiveScale()
        {
            float target = Effective;
            if (!Mathf.Approximately(Time.timeScale, target))
                Time.timeScale = target;
        }

        static void EnsureDriver()
        {
            if (driver != null) return;
            var root = new GameObject("AshenCrown_TimeScaleService");
            UnityEngine.Object.DontDestroyOnLoad(root);
            driver = root.AddComponent<Driver>();
        }

        sealed class Driver : MonoBehaviour
        {
            void Awake() { driver = this; }
            void Update() { Tick(Time.unscaledTime); }
            void OnDestroy()
            {
                if (driver == this) driver = null;
                if (!Application.isPlaying)
                    return;
                Requests.Clear();
                paused = false;
                if (!Mathf.Approximately(Time.timeScale, 1f))
                    Time.timeScale = 1f;
            }
        }
    }
}