using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using AshenCrown.Boss;
using AshenCrown.Combat;
using AshenCrown.Enemy;
using AshenCrown.Endgame;
using AshenCrown.Player;
using AshenCrown.Progression;
using AshenCrown.World;

namespace AshenCrown.Core
{
    /// <summary>
    /// Turns runtime combat events into the progression/quest/loot pipeline.
    /// Kept separate from the combat modules so each system remains reusable.
    /// </summary>
    public sealed class GameplayEventBridge : MonoBehaviour
    {
        public static GameplayEventBridge Instance { get; private set; }

        readonly HashSet<BossController> boundBosses = new HashSet<BossController>();
        readonly HashSet<PlayerCombatSystem> boundPlayers = new HashSet<PlayerCombatSystem>();
        readonly Dictionary<BossController, Action> bossDeathHandlers = new Dictionary<BossController, Action>();
        float scanTimer;

        void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        void OnEnable()
        {
            EnemyFSM.OnEnemyKilled += HandleEnemyKilled;
            SceneManager.sceneLoaded += HandleSceneLoaded;
        }

        void Start()
        {
            BindSceneObjects();
        }

        void Update()
        {
            scanTimer += Time.unscaledDeltaTime;
            if (scanTimer < 1f) return;
            scanTimer = 0f;
            BindSceneObjects();
        }

        void OnDisable()
        {
            EnemyFSM.OnEnemyKilled -= HandleEnemyKilled;
            SceneManager.sceneLoaded -= HandleSceneLoaded;

            foreach (var pair in bossDeathHandlers)
                if (pair.Key != null) pair.Key.OnDefeated -= pair.Value;
            foreach (var player in boundPlayers)
                if (player != null) UnbindPlayer(player);
            bossDeathHandlers.Clear();
            boundBosses.Clear();
            boundPlayers.Clear();
        }

        void HandleSceneLoaded(Scene scene, LoadSceneMode mode)
        {
            scanTimer = 0f;
            BindSceneObjects();
        }

        void BindSceneObjects()
        {
            foreach (var player in FindObjectsOfType<PlayerCombatSystem>(true))
            {
                if (player == null || boundPlayers.Contains(player)) continue;
                boundPlayers.Add(player);
                player.OnParry += HandleParry;
                player.OnPerfectDodge += HandlePerfectDodge;

                // Death itself is handled by PlayerRespawnDirector; this bridge only records
                // successful defensive actions and combat progression.
            }

            foreach (var boss in FindObjectsOfType<BossController>(true))
            {
                if (boss == null || boundBosses.Contains(boss) || boss.Health == null) continue;
                boundBosses.Add(boss);
                Action handler = () => HandleBossDeath(boss);
                bossDeathHandlers[boss] = handler;
                boss.OnDefeated += handler;
            }
        }

        void UnbindPlayer(PlayerCombatSystem player)
        {
            player.OnParry -= HandleParry;
            player.OnPerfectDodge -= HandlePerfectDodge;

        }

        void HandleParry(GameObject source)
        {
            if (LongTermEngagementSystem.Instance != null)
            {
                LongTermEngagementSystem.Instance.RecordAction(EngagementAction.Parry);
                LongTermEngagementSystem.Instance.AddMastery("parry", 25);
            }
            if (CodexSystem.Instance != null) CodexSystem.Instance.Unlock("combat_parry");
        }

        void HandlePerfectDodge()
        {
            if (LongTermEngagementSystem.Instance != null)
            {
                LongTermEngagementSystem.Instance.RecordAction(EngagementAction.PerfectDodge);
                LongTermEngagementSystem.Instance.AddMastery("perfect_dodge", 25);
            }
            if (CodexSystem.Instance != null) CodexSystem.Instance.Unlock("combat_perfect_dodge");
        }

        void HandleEnemyKilled(EnemyFSM enemy, int cinderReward)
        {
            if (enemy == null) return;
            string id = NormalizeId(enemy.gameObject.name);

            if (EternalCampaignDirector.Instance != null)
                EternalCampaignDirector.Instance.NotifyKill(id);

            if (QuestSystem.Instance != null)
                QuestSystem.Instance.Progress(QuestObjectiveType.Kill, id);

            if (LongTermEngagementSystem.Instance != null)
            {
                LongTermEngagementSystem.Instance.RecordAction(EngagementAction.EnemyDefeated);
                LongTermEngagementSystem.Instance.AddMastery("combat", 10);
            }

            if (CodexSystem.Instance != null)
                CodexSystem.Instance.Unlock("enemy:" + id);

            if (InventorySystem.Instance != null && cinderReward > 0)
                InventorySystem.Instance.Add(RPGShopSystem.CurrencyId, cinderReward);

            int level = LongTermProgressionSystem.Instance != null ? LongTermProgressionSystem.Instance.Level : 1;
            if (LootSystem.Instance != null)
                LootSystem.Instance.Roll(id, level);
        }

        void HandleBossDeath(BossController boss)
        {
            if (boss == null) return;
            string id = NormalizeId(boss.bossName);

            if (WorldProgressionSystem.Instance != null)
                WorldProgressionSystem.Instance.RegisterBossDefeat(id);

            if (LongTermEngagementSystem.Instance != null)
                LongTermEngagementSystem.Instance.AddMastery("boss:" + id, 100);

            if (CodexSystem.Instance != null)
                CodexSystem.Instance.Unlock("boss:" + id);

            int level = LongTermProgressionSystem.Instance != null ? LongTermProgressionSystem.Instance.Level : 1;
            if (LootSystem.Instance != null)
                LootSystem.Instance.Roll("boss_" + id, level, 5);
        }

        static string NormalizeId(string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return "unknown";
            var chars = new List<char>(value.Length);
            bool underscore = false;
            foreach (char ch in value.ToLowerInvariant())
            {
                if (char.IsLetterOrDigit(ch))
                {
                    chars.Add(ch);
                    underscore = false;
                }
                else if (!underscore)
                {
                    chars.Add('_');
                    underscore = true;
                }
            }
            return new string(chars.ToArray()).Trim('_');
        }
    }
}
