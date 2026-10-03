using UnityEngine;
using AshenCrown.Quests;

namespace AshenCrown.UI
{
    public sealed class QuestHUD : MonoBehaviour
    {
        bool open = true;

        void Update()
        {
            if (Input.GetKeyDown(KeyCode.J)) open = !open;
        }

        void OnGUI()
        {
            if (!open || QuestSystem.Instance == null) return;
            GUILayout.BeginArea(new Rect(18, 18, 360, 220), GUI.skin.box);
            GUILayout.Label("QUESTS  [J]");
            foreach (var pair in QuestSystem.Instance.ActiveQuests)
            {
                var q = QuestSystem.Instance.GetDefinition(pair.Key);
                GUILayout.Label(q != null ? q.titleKey : pair.Key);
                foreach (var o in pair.Value.objectives)
                    GUILayout.Label("  " + o.type + "  " + o.progress + "/" + o.required + "  [" + o.targetId + "]");
            }
            GUILayout.EndArea();
        }
    }
}
