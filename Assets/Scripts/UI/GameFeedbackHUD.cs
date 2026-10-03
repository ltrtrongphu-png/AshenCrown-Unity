using System.Collections.Generic;
using UnityEngine;
using AshenCrown.Progression;
using AshenCrown.Endgame;
using AshenCrown.World;

namespace AshenCrown.UI
{
    /// <summary>
    /// Small centralized feedback layer for important progression events.
    /// It is deliberately prefab-free so a prototype scene gets polished
    /// feedback immediately.
    /// </summary>
    public sealed class GameFeedbackHUD : MonoBehaviour
    {
        sealed class Toast
        {
            public string text;
            public float remaining;
            public Toast(string text, float duration) { this.text = text; remaining = duration; }
        }

        readonly Queue<Toast> queue = new Queue<Toast>();
        Toast active;
        Rect panel = new Rect(0, 72, 420, 70);

        void Start()
        {
            if (LongTermProgressionSystem.Instance != null)
                LongTermProgressionSystem.Instance.LevelChanged += OnLevelChanged;

            if (LootSystem.Instance != null)
                LootSystem.Instance.LootAdded += OnLootAdded;

            if (LongTermEngagementSystem.Instance != null)
                LongTermEngagementSystem.Instance.AchievementUnlocked += OnAchievement;

            if (WorldEventSystem.Instance != null)
                WorldEventSystem.Instance.EventChanged += OnWorldEvent;
        }

        void OnDisable()
        {
            if (LongTermProgressionSystem.Instance != null)
                LongTermProgressionSystem.Instance.LevelChanged -= OnLevelChanged;

            if (LootSystem.Instance != null)
                LootSystem.Instance.LootAdded -= OnLootAdded;

            if (LongTermEngagementSystem.Instance != null)
                LongTermEngagementSystem.Instance.AchievementUnlocked -= OnAchievement;

            if (WorldEventSystem.Instance != null)
                WorldEventSystem.Instance.EventChanged -= OnWorldEvent;
        }

        void Update()
        {
            if (active == null && queue.Count > 0)
                active = queue.Dequeue();

            if (active == null) return;

            active.remaining -= Time.unscaledDeltaTime;
            if (active.remaining <= 0f)
                active = null;
        }

        void OnLevelChanged(int level) => Push("LEVEL UP  •  Level " + level, 3.5f);

        void OnLootAdded(ItemDefinition item)
        {
            if (item == null) return;
            Push("NEW GEAR  •  " + item.displayName + "  [" + item.tier + "]", 3f);
        }

        void OnAchievement(string id) => Push("ACHIEVEMENT UNLOCKED  •  " + id, 4f);

        void OnWorldEvent(WorldEventState state)
        {
            if (state == null || !state.rewarded) return;
            Push("WORLD EVENT COMPLETE  •  " + state.type, 4f);
        }

        public void Push(string message, float duration = 3f)
        {
            if (string.IsNullOrWhiteSpace(message)) return;
            queue.Enqueue(new Toast(message, Mathf.Clamp(duration, 1f, 8f)));
            while (queue.Count > 8) queue.Dequeue();
        }

        void OnGUI()
        {
            if (active == null) return;

            panel.x = (Screen.width - panel.width) * 0.5f;
            panel.y = 72f;
            GUI.Window(7301, panel, DrawToast, GUIContent.none);
        }

        void DrawToast(int id)
        {
            GUILayout.BeginVertical("box");
            GUILayout.Label(active.text, GUI.skin.GetStyle("boldLabel"));
            GUI.Label(new Rect(0, 0, panel.width, panel.height), GUIContent.none);
            GUILayout.EndVertical();
        }
    }
}
