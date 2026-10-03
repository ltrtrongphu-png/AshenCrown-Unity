using UnityEngine;
using AshenCrown.Endgame;
using AshenCrown.Localization;

namespace AshenCrown.UI
{
    public sealed class LongTermEngagementHUD : MonoBehaviour
    {
        bool visible=true; int selectedTier=1; GUIStyle title; GUIStyle body;
        void Update()
        {
            if(Input.GetKeyDown(KeyCode.F11))visible=!visible;
            if(Input.GetKeyDown(KeyCode.PageUp))selectedTier=Mathf.Min(20,selectedTier+1);
            if(Input.GetKeyDown(KeyCode.PageDown))selectedTier=Mathf.Max(1,selectedTier-1);
            if(Input.GetKeyDown(KeyCode.F12))LongTermEngagementSystem.Instance?.StartExpedition(selectedTier);
            if(Input.GetKeyDown(KeyCode.F7))LongTermEngagementSystem.Instance?.AdvanceExpedition();
            if(Input.GetKeyDown(KeyCode.F8))foreach(var c in LongTermEngagementSystem.Instance.Contracts)if(c.Complete&&!c.claimed)LongTermEngagementSystem.Instance.ClaimContract(c.id);
        }
        void OnGUI()
        {
            if(!visible||LongTermEngagementSystem.Instance==null)return;
            if(title==null){title=new GUIStyle(GUI.skin.label){fontSize=16,fontStyle=FontStyle.Bold};body=new GUIStyle(GUI.skin.label){fontSize=12};}
            var s=LongTermEngagementSystem.Instance;
            GUILayout.BeginArea(new Rect(16,16,380,260),GUI.skin.box);
            GUILayout.Label("ASHEN CROWN • ETERNAL PROGRESSION",title);
            GUILayout.Label($"Legacy Lv {s.LegacyLevel} • Journey {s.JourneyPoints} pts",body);
            GUILayout.Label($"Expedition: {(s.Expedition.active?$"T{s.Expedition.tier} {s.Expedition.roomsCleared}/{s.Expedition.roomsRequired}":"Ready")} • Selected T{selectedTier}",body);
            GUILayout.Space(6);GUILayout.Label("Rotating Contracts",title);
            foreach(var c in s.Contracts){var state=c.claimed?"CLAIMED":$"{c.progress}/{c.required}";var titleKey=LocalizationService.Instance!=null?LocalizationService.Instance.Get(c.titleKey):c.titleKey;GUILayout.Label($"• {titleKey}: {state}",body);}
            GUILayout.Space(6);GUILayout.Label("F12 start expedition • F7 clear room • F8 claim contracts",body);GUILayout.Label("PgUp/PgDn tier • F10 refresh • F11 HUD",body);
            GUILayout.EndArea();
        }
    }
}