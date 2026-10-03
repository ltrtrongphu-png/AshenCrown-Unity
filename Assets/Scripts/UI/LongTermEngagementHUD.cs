using UnityEngine;
using AshenCrown.Endgame;

namespace AshenCrown.UI
{
    public sealed class LongTermEngagementHUD : MonoBehaviour
    {
        bool visible=true; GUIStyle title; GUIStyle body;
        void Update(){if(Input.GetKeyDown(KeyCode.F11))visible=!visible;}
        void OnGUI()
        {
            if(!visible||LongTermEngagementSystem.Instance==null)return;
            if(title==null){title=new GUIStyle(GUI.skin.label){fontSize=16,fontStyle=FontStyle.Bold};body=new GUIStyle(GUI.skin.label){fontSize=12};}
            var s=LongTermEngagementSystem.Instance;
            GUILayout.BeginArea(new Rect(16,16,380,260),GUI.skin.box);
            GUILayout.Label("ASHEN CROWN • ETERNAL PROGRESSION",title);
            GUILayout.Label($"Legacy Lv {s.LegacyLevel} • Journey {s.JourneyPoints} pts",body);
            GUILayout.Label($"Expedition: {(s.Expedition.active?$"T{s.Expedition.tier} {s.Expedition.roomsCleared}/{s.Expedition.roomsRequired}":"Ready")}",body);
            GUILayout.Space(6);GUILayout.Label("Rotating Contracts",title);
            foreach(var c in s.Contracts){var state=c.claimed?"CLAIMED":$"{c.progress}/{c.required}";GUILayout.Label($"• {c.titleKey}: {state}",body);}
            GUILayout.Space(6);GUILayout.Label("F10 refresh rotations • F11 toggle HUD",body);
            GUILayout.EndArea();
        }
    }
}