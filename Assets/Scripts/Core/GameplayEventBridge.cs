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
        readonly HashSet<HealthAndDamageSystem> boundPlayerHealth = new HashSet<HealthAndDamageSystem>();
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

            foreach (var boss in boundBosses)
                if (boss != null && boss.Health != null) boss.Health.OnDeath -= () => HandleBossDeath(boss);
            foreach (var player in boundPlayers)
                if (player != null) UnbindPlayer(player);
            boundBosses.Clear();
            boundPlayers.Clear();
            boundPlayerHealth.Clear();
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

                var health = player.GetComponent<HealthAndDamageSystem>();
                if (health != null && boundPlayerHealth.Add(health))
                    health.OnDeath += HandlePlayerDeath;
            }

            foreach (var boss in FindObjectsOfType<BossController>(true))
            {
                if (boss == null || boundBosses.Contains(boss) || boss.Health == null) continue;
                boundBosses.Add(boss);
                var captured = boss;
                captured.Health.OnDeath += () => HandleBossDeath(captured);
            }
        }

        void UnbindPlayer(PlayerCombatSystem player)
        {
            player.OnParry -= HandleParry;
            player.OnPerfectDodge -= HandlePerfectDodge;
            var health = player.GetComponent<HealthAndDamageSystem>();
            if (health != null)
            {
                health.OnDeath -= HandlePlayerDeath;
                boundPlayerHealth.Remove(health);
            }
        }

        void HandlePlayerDeath() { }

        void HandleParry(GameObject source)
        {
            if (LongTermEngagementSystem.Instance != null)
                LongTermEngagementSystem.Instance.RecordAction(EngagementAction.Parry);
        }

        void HandlePerfectDodge()
        {
            if (LongTermEngagementSystem.Instance != null)
                LongTermEngagementSystem.Instance.RecordAction(EngagementAction.PerfectDodge);
        }

        void HandleEnemyKilled(EnemyFSM enemy, int cinderReward)
        {
            if (enemy == null) return;
            string id = NormalizeId(enemy.gameObject.name);

            if (EternalCampaignDirector.Instance != null)
                EternalCampaignDirector.Instance.NotifyKill(id);

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
