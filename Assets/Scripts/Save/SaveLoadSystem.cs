using System;
using System.Collections.Generic;
using System.IO;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
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
        // Empty on legacy saves. New saves use this SHA-256 checksum to detect partial/corrupt writes.
        public string checksum;
    }

    public sealed class SaveLoadSystem : MonoBehaviour
    {
        public static SaveLoadSystem Instance { get; private set; }

        string pendingCloudJson;
        string pendingLocalBackupSource;

        public bool HasCloudConflict => !string.IsNullOrWhiteSpace(pendingCloudJson);
        public string PendingLocalSaveTime { get; private set; } = "";
        public string PendingCloudSaveTime { get; private set; } = "";
        public string CloudSaveStatus { get; private set; } = "";

        public string SavePath => Path.Combine(Application.persistentDataPath, "ashen_crown_save.json");
        public string BackupPath => SavePath + ".bak";
        public string TempPath => SavePath + ".tmp";
        public bool IsLoaded { get; private set; }
        public bool HasValidSave { get; private set; }

        void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public bool Save(string reason = "manual")
        {
            if (!IsLoaded)
            {
                Debug.LogWarning("[SaveLoadSystem] Save skipped: initial load has not completed yet.");
                return false;
            }

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
                d.checksum = string.Empty;
                var canonicalJson = JsonUtility.ToJson(d, false);
                d.checksum = ComputeChecksum(canonicalJson);
                var json = JsonUtility.ToJson(d, true);

                var directory = Path.GetDirectoryName(SavePath);
                if (!string.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);

                // Never replace the backup with a corrupt/partial primary file.
                // The primary is written to a temp file and atomically replaced when possible.
                WriteAndFlushTemp(TempPath, json);

                if (File.Exists(SavePath) && IsValidSaveFile(SavePath))
                {
                    try
                    {
                        File.Replace(TempPath, SavePath, BackupPath, true);
                    }
                    catch (PlatformNotSupportedException)
                    {
                        File.Copy(SavePath, BackupPath, true);
                        ReplacePrimaryWithFallbackMove();
                    }
                    catch (IOException)
                    {
                        File.Copy(SavePath, BackupPath, true);
                        ReplacePrimaryWithFallbackMove();
                    }
                }
                else
                {
                    ReplacePrimaryWithFallbackMove();
                }

                HasValidSave = IsValidSaveFile(SavePath);
                if (!HasValidSave) throw new IOException("Primary save failed post-write validation.");

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
            // All bootstrap systems have Awake'd by this point, so restore before autosave can run.
            HasValidSave = Load();
            IsLoaded = true;

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
            StartCoroutine(AshenCrown.Online.SupabaseAuthService.Instance.LoadCloud(HandleCloudSaveLoaded));
        }

        void HandleCloudSaveLoaded(string cloudJson)
        {
            if (string.IsNullOrWhiteSpace(cloudJson))
            {
                CloudSaveStatus = "No cloud save found. Existing local progress was kept.";
                return;
            }

            if (!ValidateChecksum(cloudJson))
            {
                CloudSaveStatus = "Cloud save failed validation. It was not imported.";
                Debug.LogWarning("[SaveLoadSystem] Cloud save failed checksum/JSON validation; local progress was preserved.");
                return;
            }

            AshenSaveData cloudData;
            try
            {
                cloudData = JsonUtility.FromJson<AshenSaveData>(cloudJson);
            }
            catch (Exception e)
            {
                CloudSaveStatus = "Cloud save could not be parsed. Local progress was kept.";
                Debug.LogWarning("[SaveLoadSystem] Cloud save parse failed: " + e.GetType().Name);
                return;
            }

            if (cloudData == null)
            {
                CloudSaveStatus = "Cloud save was empty or invalid. Local progress was kept.";
                return;
            }

            string localPath = ReadBestLocalSavePath();
            if (!string.IsNullOrEmpty(localPath))
            {
                AshenSaveData localData;
                try
                {
                    localData = JsonUtility.FromJson<AshenSaveData>(File.ReadAllText(localPath));
                }
                catch (Exception e)
                {
                    CloudSaveStatus = "Local save could not be read. Cloud restore was stopped.";
                    Debug.LogWarning("[SaveLoadSystem] Local save comparison failed: " + e.GetType().Name);
                    return;
                }

                if (localData == null)
                {
                    CloudSaveStatus = "Local save is invalid. Cloud restore was stopped to preserve its files.";
                    return;
                }

                if (ShouldPromptCloudConflict(localData, cloudData))
                {
                    pendingCloudJson = cloudJson;
                    pendingLocalBackupSource = localPath;
                    PendingLocalSaveTime = FormatSaveTime(localData.lastSavedUtc);
                    PendingCloudSaveTime = FormatSaveTime(cloudData.lastSavedUtc);
                    CloudSaveStatus = "Local and cloud saves differ. Choose which journey to keep.";
                    return;
                }

                // Identical timestamps and gameplay payloads: preserve local state and sync it.
                if (Save("local-save-retained-after-cloud-check"))
                    CloudSaveStatus = "Local progress was kept and queued for cloud sync.";
                else
                    CloudSaveStatus = "Local progress was kept, but cloud sync could not be queued.";
                return;
            }

            // Existing but invalid save files are evidence to preserve, not permission to overwrite.
            if (File.Exists(SavePath) || File.Exists(BackupPath) || File.Exists(TempPath))
            {
                CloudSaveStatus = "Local save files need recovery. Cloud restore was stopped to preserve them.";
                Debug.LogWarning("[SaveLoadSystem] Cloud restore skipped because local save artifacts exist but none validated.");
                return;
            }

            if (ApplyJson(cloudJson))
            {
                HasValidSave = true;
                if (Save("cloud-restore-no-local"))
                    CloudSaveStatus = "Cloud journey restored on this device.";
                else
                    CloudSaveStatus = "Cloud journey loaded, but local persistence failed.";
            }
            else
            {
                CloudSaveStatus = "Cloud save could not be applied. Local progress was kept.";
            }
        }

        string ReadBestLocalSavePath()
        {
            if (IsValidSaveFile(SavePath)) return SavePath;
            if (IsValidSaveFile(BackupPath)) return BackupPath;
            return null;
        }

        static string FormatSaveTime(string value)
        {
            DateTime parsed;
            return DateTime.TryParse(value, CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out parsed)
                ? parsed.ToUniversalTime().ToString("u")
                : "unknown time";
        }

        public static bool ShouldPromptCloudConflict(AshenSaveData localData, AshenSaveData cloudData)
        {
            if (localData == null || cloudData == null) return true;

            DateTime local;
            DateTime cloud;
            bool hasLocalTime = DateTime.TryParse(localData.lastSavedUtc, CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out local);
            bool hasCloudTime = DateTime.TryParse(cloudData.lastSavedUtc, CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out cloud);

            // Missing/invalid timestamps cannot establish which journey is authoritative.
            if (!hasLocalTime || !hasCloudTime) return true;
            if (local.ToUniversalTime() != cloud.ToUniversalTime()) return true;

            return !string.Equals(ConflictComparableJson(localData), ConflictComparableJson(cloudData),
                StringComparison.Ordinal);
        }

        static string ConflictComparableJson(AshenSaveData data)
        {
            // Treat save metadata as non-gameplay data, but compare every schema-v5 payload
            // field so equal millisecond timestamps cannot hide two different journeys.
            data.lastSavedUtc = "";
            data.saveReason = "";
            data.checksum = "";
            return JsonUtility.ToJson(data, false);
        }

        public bool ResolveCloudConflict(bool useCloudSave)
        {
            if (!HasCloudConflict || string.IsNullOrWhiteSpace(pendingLocalBackupSource))
                return false;

            if (!useCloudSave)
            {
                ClearPendingCloudConflict();
                bool saved = Save("local-save-kept-after-cloud-conflict");
                CloudSaveStatus = saved
                    ? "Local journey kept and queued for cloud sync."
                    : "Local journey kept, but cloud sync could not be queued.";
                return saved;
            }

            string backupPath = SavePath + ".conflict-" + DateTime.UtcNow.ToString("yyyyMMddHHmmssfff") + ".bak";
            try
            {
                if (!File.Exists(pendingLocalBackupSource))
                    throw new FileNotFoundException("Local conflict source disappeared.", pendingLocalBackupSource);
                File.Copy(pendingLocalBackupSource, backupPath, false);
                if (!IsValidSaveFile(backupPath))
                    throw new IOException("Conflict backup did not pass validation.");
            }
            catch (Exception e)
            {
                CloudSaveStatus = "Local backup failed; cloud restore was cancelled.";
                Debug.LogError("[SaveLoadSystem] Conflict backup failed: " + e.GetType().Name);
                return false;
            }

            if (!ApplyJson(pendingCloudJson))
            {
                CloudSaveStatus = "Cloud data could not be applied. The local backup was preserved.";
                return false;
            }

            HasValidSave = true;
            bool persisted = Save("cloud-save-accepted-after-conflict");
            if (!persisted)
            {
                CloudSaveStatus = "Cloud journey loaded but local save failed; the previous journey is backed up.";
                return false;
            }

            ClearPendingCloudConflict();
            CloudSaveStatus = "Cloud journey restored. The previous local save remains in a separate backup file.";
            return true;
        }

        void ClearPendingCloudConflict()
        {
            pendingCloudJson = null;
            pendingLocalBackupSource = null;
            PendingLocalSaveTime = "";
            PendingCloudSaveTime = "";
        }

        public bool Load()
        {
            if (TryApplyFile(SavePath))
            {
                HasValidSave = true;
                return true;
            }

            if (TryApplyFile(BackupPath))
            {
                Debug.LogWarning("[SaveLoadSystem] Primary save was invalid; recovered from backup.");
                HasValidSave = true;
                return true;
            }

            HasValidSave = false;
            return false;
        }

        bool TryApplyFile(string path)
        {
            if (!File.Exists(path)) return false;

            try
            {
                var json = File.ReadAllText(path);
                if (!ValidateChecksum(json))
                {
                    Debug.LogError("[SaveLoadSystem] Save checksum mismatch: " + path);
                    return false;
                }
                return ApplyJson(json);
            }
            catch (Exception e)
            {
                Debug.LogError("[SaveLoadSystem] Load failed for " + path + ": " + e.Message);
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

        void WriteAndFlushTemp(string path, string content)
        {
            using (var stream = new FileStream(path, FileMode.Create, FileAccess.Write, FileShare.None))
            using (var writer = new StreamWriter(stream, new UTF8Encoding(false)))
            {
                writer.Write(content);
                writer.Flush();
                stream.Flush(true);
            }
        }

        void ReplacePrimaryWithFallbackMove()
        {
            if (File.Exists(SavePath)) File.Delete(SavePath);
            File.Move(TempPath, SavePath);
        }

        bool IsValidSaveFile(string path)
        {
            if (!File.Exists(path)) return false;
            try { return ValidateChecksum(File.ReadAllText(path)); }
            catch { return false; }
        }

        bool ValidateChecksum(string json)
        {
            if (string.IsNullOrWhiteSpace(json)) return false;
            AshenSaveData d;
            try { d = JsonUtility.FromJson<AshenSaveData>(json); }
            catch { return false; }
            if (d == null) return false;
            // Legacy saves did not have a checksum; accept them so users can migrate on next save.
            if (string.IsNullOrWhiteSpace(d.checksum)) return true;
            var expected = d.checksum;
            d.checksum = string.Empty;
            return string.Equals(expected, ComputeChecksum(JsonUtility.ToJson(d, false)), StringComparison.OrdinalIgnoreCase);
        }

        static string ComputeChecksum(string value)
        {
            using (var sha = SHA256.Create())
            {
                var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(value ?? string.Empty));
                var sb = new StringBuilder(bytes.Length * 2);
                for (int i = 0; i < bytes.Length; i++) sb.Append(bytes[i].ToString("x2"));
                return sb.ToString();
            }
        }

        public bool HasSave() => File.Exists(SavePath);
        public void DeleteSave() { if (File.Exists(SavePath)) File.Delete(SavePath); if (File.Exists(BackupPath)) File.Delete(BackupPath); if (File.Exists(TempPath)) File.Delete(TempPath); HasValidSave = false; }
    }
}
