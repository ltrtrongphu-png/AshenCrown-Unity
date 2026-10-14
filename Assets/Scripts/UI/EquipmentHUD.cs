using UnityEngine;
using AshenCrown.Progression;
namespace AshenCrown.UI
{
    public sealed class EquipmentHUD:MonoBehaviour
    {
        bool visible=true;
        void Update()
        {
            if (Input.GetKeyDown(KeyCode.I)) visible = !visible;
#if UNITY_EDITOR || DEVELOPMENT_BUILD
            if (Input.GetKeyDown(KeyCode.L) && LootSystem.Instance != null)
            {
                int level = LongTermProgressionSystem.Instance != null
                    ? LongTermProgressionSystem.Instance.Level
                    : 1;
                LootSystem.Instance.Roll("training_enemy", level);
            }
#endif
        }

        void OnGUI(){if(!visible||EquipmentSystem.Instance==null)return;GUILayout.BeginArea(new Rect(16,Screen.height-300,420,280),GUI.skin.box);GUILayout.Label("GEAR / LOOT");foreach(EquipmentSlot slot in System.Enum.GetValues(typeof(EquipmentSlot))){var x=EquipmentSystem.Instance.Get(slot);GUILayout.Label($"{slot}: {(x==null?"—":$"{x.displayName} [{x.tier}] +{x.upgradeLevel} • Power {x.power}")}");}GUILayout.Label("I toggle gear HUD");GUILayout.EndArea();}
    }
}