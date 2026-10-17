using System;
using System.Collections.Generic;
using UnityEngine;

namespace AshenCrown.Core
{
    /// <summary>
    /// Single owner of global time scaling. Active temporary effects compose by choosing
    /// the slowest scale; an explicit pause always wins. Expiry uses unscaled realtime.
    /// The steady-state driver path reuses its removal buffer and allocates no per-frame lists.
    /// </summary>
    public static class TimeScaleService
    {
        sealed class ScaleRequest
        {
            public int Id;
            public object Owner;
            public float Scale;
            public float ExpiresAt;
        }

        static readonly Dictionary<int, ScaleRequest> Requests = new Dictionary<int, ScaleRequest>();
        static readonly List<int> PendingRemoval = new List<int>();
        static int nextId = 1;
        static bool paused;
        static TimeScaleServiceDriver driver;

        public static float Effective
        {
            get
            {
                if (paused) return 0f;
                float effective = 1f;
                foreach (var request in Requests.Values)
                    effective = Mathf.Min(effective, request.Scale);
                return effective;
            }
        }

        public static bool IsPaused => paused;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        static void ResetStatics()
        {
            Requests.Clear();
            PendingRemoval.Clear();
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

            if (!IsFinite(scale)) scale = 1f;
            if (!IsFinite(durationRealtime)) durationRealtime = 0.01f;

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
                ExpiresAt = Time.unscaledTime + Mathf.Max(0.01f, durationRealtime)
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
            PendingRemoval.Clear();
            foreach (var pair in Requests)
            {
                if (ReferenceEquals(pair.Value.Owner, owner))
                    PendingRemoval.Add(pair.Key);
            }
            for (int i = 0; i < PendingRemoval.Count; i++)
                Requests.Remove(PendingRemoval[i]);
            if (PendingRemoval.Count > 0)
                ApplyEffectiveScale();
            PendingRemoval.Clear();
        }

        public static void SetPaused(bool value)
        {
            if (paused == value) return;
            if (value) EnsureDriver();
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
                if (!IsFinite(value)) continue;
                effective = Mathf.Min(effective, Mathf.Clamp(value, 0f, 1f));
            }
            return effective;
        }

        internal static void RegisterDriver(TimeScaleServiceDriver instance)
        {
            if (instance == null) return;
            if (driver == null) driver = instance;
            ApplyEffectiveScale();
        }

        internal static void TickDriver(TimeScaleServiceDriver instance, float now)
        {
            if (instance == null || driver != instance) return;

            PendingRemoval.Clear();
            foreach (var pair in Requests)
            {
                if (now >= pair.Value.ExpiresAt || IsDestroyedUnityOwner(pair.Value.Owner))
                    PendingRemoval.Add(pair.Key);
            }
            for (int i = 0; i < PendingRemoval.Count; i++)
                Requests.Remove(PendingRemoval[i]);
            PendingRemoval.Clear();

            ApplyEffectiveScale();
        }

        internal static void UnregisterDriver(TimeScaleServiceDriver instance)
        {
            if (driver != instance) return;
            driver = null;
            if (!Application.isPlaying) return;
            Requests.Clear();
            PendingRemoval.Clear();
            paused = false;
            if (!Mathf.Approximately(Time.timeScale, 1f))
                Time.timeScale = 1f;
        }

        static bool IsDestroyedUnityOwner(object owner)
        {
            return owner is UnityEngine.Object unityObject && unityObject == null;
        }

        static bool IsFinite(float value) => !float.IsNaN(value) && !float.IsInfinity(value);

        static void ApplyEffectiveScale()
        {
            float target = Effective;
            if (!Mathf.Approximately(Time.timeScale, target))
                Time.timeScale = target;
        }

        static void EnsureDriver()
        {
            if (driver != null) return;

            // Also reuse an existing driver when Enter Play Mode has domain reload disabled.
            driver = UnityEngine.Object.FindObjectOfType<TimeScaleServiceDriver>();
            if (driver != null) return;

            var root = new GameObject("AshenCrown_TimeScaleService");
            UnityEngine.Object.DontDestroyOnLoad(root);
            driver = root.AddComponent<TimeScaleServiceDriver>();
        }
    }
}
