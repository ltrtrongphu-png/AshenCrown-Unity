using UnityEngine;
using AshenCrown.Localization;
using AshenCrown.Progression;
using AshenCrown.Save;
using AshenCrown.Quests;
using AshenCrown.Dialogue;
using AshenCrown.World;
using AshenCrown.Codex;
using AshenCrown.NPC;
using AshenCrown.UI;
using AshenCrown.Endgame;
using AshenCrown.Performance;
using AshenCrown.Online;
using AshenCrown.Customization;

namespace AshenCrown.Core
{
    public sealed class AshenCrownSystemsBootstrap:MonoBehaviour
    {
        static bool booted;
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        static void Bootstrap()
        {
            if(booted)return;
            booted=true;
            var root=new GameObject("AshenCrown_Systems");
            Object.DontDestroyOnLoad(root);
            root.AddComponent<LocalizationService>();
            root.AddComponent<GameSettingsService>();
            root.AddComponent<CharacterAppearanceSystem>();
            root.AddComponent<InventorySystem>();
            root.AddComponent<EquipmentSystem>();
            root.AddComponent<LootSystem>();
            root.AddComponent<RPGShopSystem>();
            root.AddComponent<RPGShopSystem>();
            root.AddComponent<SkillTreeSystem>();
            root.AddComponent<LongTermProgressionSystem>();
            root.AddComponent<ReputationSystem>();
            root.AddComponent<CraftingSystem>();
            root.AddComponent<WorldProgressionSystem>();
            root.AddComponent<WorldEventSystem>();
            root.AddComponent<EternalCampaignDirector>();
            root.AddComponent<QuestSystem>();
            root.AddComponent<DialogueSystem>();
            root.AddComponent<CodexSystem>();
            root.AddComponent<SaveLoadSystem>();
            root.AddComponent<NPCWorldSpawner>();
            root.AddComponent<DialogueOverlay>();
            root.AddComponent<CameraModeHUD>();
            root.AddComponent<LongTermEngagementSystem>();
            root.AddComponent<LongTermEngagementHUD>();
            root.AddComponent<EquipmentHUD>();
            root.AddComponent<RPGShopHUD>();
            root.AddComponent<RPGShopHUD>();
            root.AddComponent<SettingsHUD>();
            root.AddComponent<QuestHUD>();
            root.AddComponent<PerformanceDirector>();
            root.AddComponent<SessionPersistenceDirector>();
            root.AddComponent<ProgressionHUD>();
            root.AddComponent<GameFeedbackHUD>();
            root.AddComponent<SupabaseAuthService>();
            root.AddComponent<SupabaseAuthUI>();
            root.AddComponent<AshenCrownSystemsBootstrap>();
        }
        void Update()
        {
            if(Input.GetKeyDown(KeyCode.F5)&&SaveLoadSystem.Instance!=null)SaveLoadSystem.Instance.Save();
            if(Input.GetKeyDown(KeyCode.F9)&&SaveLoadSystem.Instance!=null)SaveLoadSystem.Instance.Load();
        }
    }
}