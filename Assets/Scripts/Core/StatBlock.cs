using System;
using System.Collections.Generic;
using UnityEngine;
using AshenCrown.Progression;

namespace AshenCrown.Core
{
    public enum StatType
    {
        MaxHealth,
        Defense,
        Damage,
        CritChance
    }

    [Serializable]
    public struct StatModifier
    {
        public StatType stat;
        public float flat;
        public float multiplier;
        public string source;

        public StatModifier(StatType stat, float flat, float multiplier, string source)
        {
            this.stat = stat;
            this.flat = flat;
            this.multiplier = multiplier;
            this.source = source;
        }
    }

    /// <summary>
    /// Single player stat pipeline. Base values remain owned by the combat/health systems;
    /// equipment and unlocked skills contribute modifiers here.
    /// </summary>
    public sealed class StatBlock : MonoBehaviour
    {
        readonly List<StatModifier> modifiers = new List<StatModifier>();
        public IReadOnlyList<StatModifier> Modifiers => modifiers;
        public event Action Changed;

        void Start()
        {
            SubscribeSources();
            Rebuild();
        }

        void OnDisable() => UnsubscribeSources();

        void SubscribeSources()
        {
            if (EquipmentSystem.Instance != null)
                EquipmentSystem.Instance.EquipmentChanged += Rebuild;
            if (SkillTreeSystem.Instance != null)
                SkillTreeSystem.Instance.SkillUnlocked += HandleSkillUnlocked;
        }

        void UnsubscribeSources()
        {
            if (EquipmentSystem.Instance != null)
                EquipmentSystem.Instance.EquipmentChanged -= Rebuild;
            if (SkillTreeSystem.Instance != null)
                SkillTreeSystem.Instance.SkillUnlocked -= HandleSkillUnlocked;
        }

        void HandleSkillUnlocked(string skillId) => Rebuild();

        public void Rebuild()
        {
            modifiers.Clear();

            if (EquipmentSystem.Instance != null)
            {
                foreach (var pair in EquipmentSystem.Instance.Equipped)
                {
                    var item = pair.Value;
                    if (item == null) continue;
                    Add(StatType.MaxHealth, item.health, 0f, "equipment:" + item.id);
                    Add(StatType.Defense, item.armor, 0f, "equipment:" + item.id);
                    Add(StatType.Damage, item.damage, 0f, "equipment:" + item.id);
                }
            }

            var skills = SkillTreeSystem.Instance;
            if (skills != null)
            {
                if (skills.IsUnlocked("ashen_edge"))
                    Add(StatType.Damage, 0f, 0.10f, "skill:ashen_edge");
                if (skills.IsUnlocked("void_step"))
                    Add(StatType.CritChance, 0.05f, 0f, "skill:void_step");
                if (skills.IsUnlocked("ember_guard"))
                    Add(StatType.Defense, 0f, 0.15f, "skill:ember_guard");
                if (skills.IsUnlocked("crown_breaker"))
                    Add(StatType.Damage, 0f, 0.15f, "skill:crown_breaker");
            }

            Changed?.Invoke();
        }

        void Add(StatType stat, float flat, float multiplier, string source)
        {
            if (Mathf.Approximately(flat, 0f) && Mathf.Approximately(multiplier, 0f)) return;
            modifiers.Add(new StatModifier(stat, flat, multiplier, source));
        }

        public float Evaluate(StatType stat, float baseValue)
        {
            float flat = 0f;
            float multiplier = 1f;
            for (int i = 0; i < modifiers.Count; i++)
            {
                var mod = modifiers[i];
                if (mod.stat != stat) continue;
                flat += mod.flat;
                multiplier *= 1f + mod.multiplier;
            }
            return (baseValue + flat) * multiplier;
        }
    }
}
