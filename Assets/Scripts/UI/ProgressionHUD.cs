using UnityEngine;
using AshenCrown.Progression;
using AshenCrown.Endgame;
using AshenCrown.Core;

namespace AshenCrown.UI
{
    /// <summary>
    /// Compact always-on progression strip. It intentionally uses IMGUI so it
    /// works in a fresh prototype scene without requiring a Canvas prefab.
    /// </summary>
    public sealed class ProgressionHUD : MonoBehaviour
    {
        [SerializeField] KeyCode toggleKey = KeyCode.F2;
        bool visible = true;
        Rect panel = new Rect(18, 18, 320, 170);

        void Update()
        {
            if (Input.GetKeyDown(toggleKey))
                visible = !visible;
        }

        void OnGUI()
        {
            if (!visible) return;

            var progression = LongTermProgressionSystem.Instance;
            if (progression == null) return;

            panel = GUI.Window(7201, panel, DrawPanel, "ASHEN CROWN  •  PROFILE");
        }

        void DrawPanel(int id)
        {
            var p = LongTermProgressionSystem.Instance;
            var e = LongTermEngagementSystem.Instance;
            var session = SessionPersistenceDirector.Instance;

            GUILayout.BeginVertical("box");

            GUILayout.Label($"Level {p.Level}   •   Essence {p.Essence}   •   Prestige {p.Prestige}");
            GUILayout.Label($"XP  {p.Experience} / {p.ExperienceToNext}");
            DrawBar(p.LevelProgress);

            if (e != null)
            {
                GUILayout.Space(4);
                GUILayout.Label($"Journey  {e.JourneyPoints} pts   •   Legacy Lv.{e.LegacyLevel}");
                if (e.Expedition != null && e.Expedition.active)
                    GUILayout.Label($"Expedition T{e.Expedition.tier}  •  Room {e.Expedition.roomsCleared}/{e.Expedition.roomsRequired}");
            }

            if (session != null)
                GUILayout.Label($"Autosave in {Mathf.CeilToInt(session.SecondsUntilAutosave)}s  •  {session.LastSaveReason}");

            GUILayout.Space(4);
            GUILayout.BeginHorizontal();
            if (GUILayout.Button("SAVE")) session?.ForceSave();
            if (GUILayout.Button("HIDE")) visible = false;
            GUILayout.EndHorizontal();

            GUI.DragWindow();
            GUILayout.EndVertical();
        }

        void DrawBar(float value)
        {
            value = Mathf.Clamp01(value);
            var rect = GUILayoutUtility.GetRect(290, 16);
            GUI.Box(rect, GUIContent.none);
            rect.width *= value;
            GUI.Box(rect, GUIContent.none);
        }
    }
}
