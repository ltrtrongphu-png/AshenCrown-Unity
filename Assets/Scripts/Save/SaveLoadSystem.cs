using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using AshenCrown.Progression;
using AshenCrown.Localization;
using AshenCrown.Core;
using AshenCrown.World;
using AshenCrown.Quests;
using AshenCrown.Codex;
using AshenCrown.Endgame;
using AshenCrown.Customization;

namespace AshenCrown.Save
{
    [Serializable]
    public class AshenSaveData
    {
        public int version = 5;
        public string language = "English";
        public float masterVolume = 1f;
        public bool reducedMotion;
        public bool subtitles = true;
        public int skillPoints;
        public List<string> unlockedSkills = new List<string>();
        public List<InventoryItem> inventory = new List<InventoryItem>();
        public LongTermProgressionData progression;
        public WorldStateData world;
        public WorldEventState worldEvent;
        public List<QuestRuntime> activeQuests = new List<QuestRuntime>();
        public List<string> completedQuests = new List<string>();
        public List<ReputationEntry> reputation = new List<ReputationEntry>();
        public List<string> codex = new List<string>();
        public LongTermEngagementData engagement;
        public EquipmentState equipment;
        public LootState loot;
        public CharacterAppearanceData appearance;
        public string lastSavedUtc;
        public string saveReason;
    }

    public sealed class SaveLoadSystem : MonoBehaviour
    {
        public static SaveLoadSystem Instance { get; private set; }
        public string SavePath => Path.Combine(Application.persistentDataPath, "ashen_crown_save.json");

        void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public bool Save(string reason = "manual")
        {
            var d = new AshenSaveData();

            if (LocalizationService.Instance != null) d.language = LocalizationService.Instance.CurrentLanguage.ToString();
            if (GameSettingsService.Instance != null)
            {
                d.masterVolume = GameSettingsService.Instance.MasterVolume;
                d.reducedMotion = GameSettingsService.Instance.ReducedMotion;
                d.subtitles = GameSettingsService.Instance.Subtitles;
            }
            if (SkillTreeSystem.Instance != null)
            {
                d.skillPoints = SkillTreeSystem.Instance.SkillPoints;
                d.unlockedSkills = SkillTreeSystem.Instance.CaptureUnlocked();
            }
            if (InventorySystem.Instance != null) d.inventory = InventorySystem.Instance.Capture();
            if (LongTermProgressionSystem.Instance != null) d.progression = LongTermProgressionSystem.Instance.Capture();
            if (WorldProgressionSystem.Instance != null) d.world = WorldProgressionSystem.Instance.Capture();
            if (WorldEventSystem.Instance != null) d.worldEvent = WorldEventSystem.Instance.Current;
            if (QuestSystem.Instance != null)
            {
                d.activeQuests = QuestSystem.Instance.CaptureActive();
                d.completedQuests = QuestSystem.Instance.CaptureCompleted();
            }
            if (ReputationSystem.Instance != null) d.reputation = ReputationSystem.Instance.Capture();
            if (CodexSystem.Instance != null) d.codex = CodexSystem.Instance.Capture();
            if (LongTermEngagementSystem.Instance != null) d.engagement = LongTermEngagementSystem.Instance.Capture();
            if (EquipmentSystem.Instance != null) d.equipment = EquipmentSystem.Instance.Capture();
            if (LootSystem.Instance != null) d.loot = LootSystem.Instance.Capture();
            if (CharacterAppearanceSystem.Instance != null) d.appearance = CharacterAppearanceSystem.Instance.Capture();

            d.lastSavedUtc = DateTime.UtcNow.ToString("O");
            d.saveReason = reason;

            try
            {
                var json = JsonUtility.ToJson(d, true);
                var directory = Path.GetDirectoryName(SavePath);
                if (!string.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);
                File.WriteAllText(SavePath, json);

                if (AshenCrown.Online.SupabaseAuthService.Instance != null)
                    StartCoroutine(AshenCrown.Online.SupabaseAuthService.Instance.SaveCloud(json));

                return true;
            }
            catch (Exception e)
            {
                Debug.LogError("[SaveLoadSystem] Save failed: " + e.Message);
                return false;
            }
        }

        void Start()
        {
            if (AshenCrown.Online.SupabaseAuthService.Instance != null)
                AshenCrown.Online.SupabaseAuthService.Instance.SignedIn += OnSignedIn;
        }

        void OnDisable()
        {
            if (AshenCrown.Online.SupabaseAuthService.Instance != null)
                AshenCrown.Online.SupabaseAuthService.Instance.SignedIn -= OnSignedIn;
        }

        void OnSignedIn(AshenCrown.Online.AuthUser user)
        {
            StartCoroutine(AshenCrown.Online.SupabaseAuthService.Instance.LoadCloud(json =>
            {
                if (!string.IsNullOrWhiteSpace(json))
                    ApplyJson(json);
            }));
        }

        public bool Load()
        {
            if (!File.Exists(SavePath)) return false;

            try
            {
                return ApplyJson(File.ReadAllText(SavePath));
            }
            catch (Exception e)
            {
                Debug.LogError("[SaveLoadSystem] Load failed: " + e.Message);
                return false;
            }
        }

        bool ApplyJson(string json)
        {
            if (string.IsNullOrWhiteSpace(json)) return false;

            AshenSaveData d;
            try
            {
                d = JsonUtility.FromJson<AshenSaveData>(json);
            }
            catch (Exception e)
            {
                Debug.LogError("[SaveLoadSystem] Invalid save JSON: " + e.Message);
                return false;
            }

            if (d == null) return false;
            if (d.version <= 0) d.version = 1;

            if (LocalizationService.Instance != null) LocalizationService.Instance.SetLanguage(d.language);
            if (GameSettingsService.Instance != null)
            {
                GameSettingsService.Instance.SetMasterVolume(d.masterVolume);
                GameSettingsService.Instance.SetReducedMotion(d.reducedMotion);
                GameSettingsService.Instance.SetSubtitles(d.subtitles);
            }
            if (SkillTreeSystem.Instance != null) SkillTreeSystem.Instance.Restore(d.unlockedSkills, d.skillPoints);
            if (InventorySystem.Instance != null) InventorySystem.Instance.Restore(d.inventory);
            if (LongTermProgressionSystem.Instance != null) LongTermProgressionSystem.Instance.Restore(d.progression);
            if (WorldProgressionSystem.Instance != null) WorldProgressionSystem.Instance.Restore(d.world);
            if (WorldEventSystem.Instance != null && d.worldEvent != null) WorldEventSystem.Instance.Restore(d.worldEvent);
            if (QuestSystem.Instance != null) QuestSystem.Instance.Restore(d.activeQuests, d.completedQuests);
            if (ReputationSystem.Instance != null) ReputationSystem.Instance.Restore(d.reputation);
            if (CodexSystem.Instance != null) CodexSystem.Instance.Restore(d.codex);
            if (LongTermEngagementSystem.Instance != null) LongTermEngagementSystem.Instance.Restore(d.engagement);
            if (EquipmentSystem.Instance != null) EquipmentSystem.Instance.Restore(d.equipment);
            if (LootSystem.Instance != null) LootSystem.Instance.Restore(d.loot);
            if (CharacterAppearanceSystem.Instance != null) CharacterAppearanceSystem.Instance.Restore(d.appearance);

            return true;
        }

        public bool HasSave() => File.Exists(SavePath);
        public void DeleteSave() { if (File.Exists(SavePath)) File.Delete(SavePath); }
    }
}
