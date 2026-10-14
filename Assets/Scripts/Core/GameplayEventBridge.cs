using System;
using System.Collections.Generic;
using UnityEngine;
using AshenCrown.Boss;
using AshenCrown.Combat;
using AshenCrown.Enemy;
using AshenCrown.Endgame;
using AshenCrown.Player;
using AshenCrown.Progression;
using AshenCrown.Quests;
using AshenCrown.Codex;
using AshenCrown.World;

namespace AshenCrown.Core
{
    /// <summary>
    /// Adapts combat lifecycle/events into the progression pipeline.
    /// Bindings are event-driven; no periodic scene-wide object search is used.
    /// </summary>
    public sealed class GameplayEventBridge : MonoBehaviour
    {
        public static GameplayEventBridge Instance { get; private set; }

        readonly HashSet<BossController> boundBosses = new HashSet<BossController>();
        readonly Dictionary<BossController, Action> bossDeathHandlers = new Dictionary<BossController, Action>();
        PlayerCombatSystem boundPlayer;
        HealthAndDamageSystem boundPlayerHealth;

        void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        static void ResetStatics()
        {
            Instance = null;
        }

        void OnEnable()
        {
            EnemyFSM.OnEnemyKilled += HandleEnemyKilled;
            PlayerRegistry.PlayerChanged += HandlePlayerChanged;
            BossController.Registered += BindBoss;
            BossController.Unregistered += UnbindBoss;

            // Also support an instance created after a test scene or bootstrap.
            HandlePlayerChanged(PlayerRegistry.CurrentPlayer);
            foreach (BossController boss in BossController.ActiveInstances)
                BindBoss(boss);
        }

        void OnDisable()
        {
            EnemyFSM.OnEnemyKilled -= HandleEnemyKilled;
            PlayerRegistry.PlayerChanged -= HandlePlayerChanged;
            BossController.Registered -= BindBoss;
            BossController.Unregistered -= UnbindBoss;

            if (boundPlayer != null)
            {
                UnbindPlayer(boundPlayer);
                boundPlayer = null;
            }
            if (boundPlayerHealth != null)
            {
                boundPlayerHealth.OnDamaged -= HandlePlayerDamaged;
                boundPlayerHealth = null;
            }

            foreach (var pair in bossDeathHandlers)
                if (pair.Key != null)
                    pair.Key.OnDefeated -= pair.Value;

            bossDeathHandlers.Clear();
            boundBosses.Clear();
        }

        void OnDestroy()
        {
            if (Instance == this)
                Instance = null;
        }

        void HandlePlayerChanged(PlayerCombatSystem player)
        {
            if (boundPlayer == player)
                return;

            if (boundPlayer != null)
                UnbindPlayer(boundPlayer);
            if (boundPlayerHealth != null)
                boundPlayerHealth.OnDamaged -= HandlePlayerDamaged;

            boundPlayer = player;
            boundPlayerHealth = null;
            if (boundPlayer != null)
            {
                boundPlayer.OnParry += HandleParry;
                boundPlayer.OnPerfectDodge += HandlePerfectDodge;
                boundPlayerHealth = boundPlayer.GetComponent<HealthAndDamageSystem>();
                if (boundPlayerHealth != null)
                    boundPlayerHealth.OnDamaged += HandlePlayerDamaged;

                var movement = boundPlayer.GetComponent<PlayerMovementAndCamera>();
                ThirdPersonCameraRig rig = movement != null && movement.cameraTransform != null
                    ? movement.cameraTransform.GetComponent<ThirdPersonCameraRig>()
                    : Camera.main != null ? Camera.main.GetComponent<ThirdPersonCameraRig>() : null;
                if (CombatPresentationFeedback.Instance != null)
                    CombatPresentationFeedback.Instance.SetCameraRig(rig);
            }
        }

        void UnbindPlayer(PlayerCombatSystem player)
        {
            player.OnParry -= HandleParry;
            player.OnPerfectDodge -= HandlePerfectDodge;
        }

        void HandlePlayerDamaged(DamageResult result, DamageInfo info)
        {
            if (CombatPresentationFeedback.Instance != null)
                CombatPresentationFeedback.Instance.Hit(0.35f, 0.04f);
        }

        void BindBoss(BossController boss)
        {
            if (boss == null || !boss.isActiveAndEnabled || boss.Health == null || !boundBosses.Add(boss))
                return;

            Action handler = () => HandleBossDeath(boss);
            bossDeathHandlers[boss] = handler;
            boss.OnDefeated += handler;
        }

        void UnbindBoss(BossController boss)
        {
            if (boss == null || !boundBosses.Remove(boss))
                return;

            if (bossDeathHandlers.TryGetValue(boss, out Action handler))
            {
                boss.OnDefeated -= handler;
                bossDeathHandlers.Remove(boss);
            }
        }

        void HandleParry(GameObject source)
        {
            if (CombatPresentationFeedback.Instance != null)
                CombatPresentationFeedback.Instance.Parry(0.8f);

            if (LongTermEngagementSystem.Instance != null)
            {
                LongTermEngagementSystem.Instance.RecordAction(EngagementAction.Parry);
                LongTermEngagementSystem.Instance.AddMastery("parry", 25);
            }

            if (CodexSystem.Instance != null)
                CodexSystem.Instance.Unlock("combat_parry");
        }

        void HandlePerfectDodge()
        {
            if (CombatPresentationFeedback.Instance != null)
                CombatPresentationFeedback.Instance.PerfectDodge(1f);

            if (LongTermEngagementSystem.Instance != null)
            {
                LongTermEngagementSystem.Instance.RecordAction(EngagementAction.PerfectDodge);
                LongTermEngagementSystem.Instance.AddMastery("perfect_dodge", 25);
            }

            if (CodexSystem.Instance != null)
                CodexSystem.Instance.Unlock("combat_perfect_dodge");
        }

        void HandleEnemyKilled(EnemyFSM enemy, int cinderReward)
        {
            if (enemy == null)
                return;

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

            int level = LongTermProgressionSystem.Instance != null
                ? LongTermProgressionSystem.Instance.Level
                : 1;
            if (LootSystem.Instance != null)
                LootSystem.Instance.Roll(id, level);
        }

        void HandleBossDeath(BossController boss)
        {
            if (boss == null)
                return;

            string id = NormalizeId(boss.bossName);

            if (WorldProgressionSystem.Instance != null)
                WorldProgressionSystem.Instance.RegisterBossDefeat(id);

            if (LongTermEngagementSystem.Instance != null)
                LongTermEngagementSystem.Instance.AddMastery("boss:" + id, 100);

            if (CodexSystem.Instance != null)
                CodexSystem.Instance.Unlock("boss:" + id);

            int level = LongTermProgressionSystem.Instance != null
                ? LongTermProgressionSystem.Instance.Level
                : 1;
            if (LootSystem.Instance != null)
                LootSystem.Instance.Roll("boss_" + id, level, 5);
        }

        static string NormalizeId(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return "unknown";

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
