using System;
using UnityEngine;
using AshenCrown.Progression;

namespace AshenCrown.World
{
    public enum WorldEventType { EmberStorm, HollowHunt, LostCaravan, RiftAnomaly }

    [Serializable]
    public sealed class WorldEventState
    {
        public int day;
        public WorldEventType type;
        public int completion;
        public int required = 10;
        public bool rewarded;
    }

    public sealed class WorldEventSystem : MonoBehaviour
    {
        public static WorldEventSystem Instance { get; private set; }
        public event Action<WorldEventState> EventChanged;
        public WorldEventState Current { get; private set; }

        void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        void Start() => Refresh();

        public void Refresh()
        {
            int day = DateTime.UtcNow.DayOfYear + DateTime.UtcNow.Year * 1000;
            if (Current != null && Current.day == day) return;

            Current = new WorldEventState
            {
                day = day,
                type = (WorldEventType)Mathf.Abs(day) % 4,
                completion = 0,
                required = 10,
                rewarded = false
            };
            EventChanged?.Invoke(Current);
        }

        public void Progress(int amount = 1)
        {
            if (Current == null || amount <= 0 || Current.rewarded) return;

            Current.completion = Mathf.Min(Current.required, Current.completion + amount);
            EventChanged?.Invoke(Current);

            if (Current.completion >= Current.required)
                CompleteCurrent();
        }

        public void Restore(WorldEventState state)
        {
            if (state == null) return;
            Current = new WorldEventState
            {
                day = state.day,
                type = state.type,
                completion = Mathf.Clamp(state.completion, 0, Mathf.Max(1, state.required)),
                required = Mathf.Max(1, state.required),
                rewarded = state.rewarded
            };

            // A save from a previous real-world day should not resurrect yesterday's event.
            int today = DateTime.UtcNow.DayOfYear + DateTime.UtcNow.Year * 1000;
            if (Current.day != today)
                Refresh();
            else
                EventChanged?.Invoke(Current);
        }

        void CompleteCurrent()
        {
            if (Current == null || Current.rewarded) return;
            Current.rewarded = true;

            if (LongTermProgressionSystem.Instance != null)
            {
                LongTermProgressionSystem.Instance.AddExperience(300);
                LongTermProgressionSystem.Instance.AddEssence(2);
            }

            if (AshenCrown.Endgame.LongTermEngagementSystem.Instance != null)
                AshenCrown.Endgame.LongTermEngagementSystem.Instance.RecordAction(
                    AshenCrown.Endgame.EngagementAction.ExplorationFound);

            EventChanged?.Invoke(Current);
        }
    }
}
