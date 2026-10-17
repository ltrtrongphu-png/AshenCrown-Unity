using System.Reflection;
using NUnit.Framework;
using UnityEngine;
using AshenCrown.Player;
using AshenCrown.Combat;

namespace AshenCrown.Tests.EditMode
{
    public sealed class NumericSafetyTests
    {
        GameObject owner;

        [TearDown]
        public void TearDown()
        {
            if (owner != null) Object.DestroyImmediate(owner);
        }

        [Test]
        public void StaminaNormalizationDoesNotDivideByZeroOrLeakNan()
        {
            owner = new GameObject("NumericSafety_Stamina");
            var stamina = owner.AddComponent<PlayerStamina>();
            FieldInfo max = typeof(PlayerStamina).GetField("maxStamina", BindingFlags.Instance | BindingFlags.NonPublic);
            max.SetValue(stamina, 0f);
            Assert.AreEqual(0f, stamina.Normalized);
            max.SetValue(stamina, float.NaN);
            Assert.AreEqual(0f, stamina.Normalized);
        }

        [Test]
        public void UltimateGaugeIsClampedAndNeverNanWhenMaxIsInvalid()
        {
            owner = new GameObject("NumericSafety_Combat");
            owner.AddComponent<CharacterController>();
            owner.AddComponent<PlayerStamina>();
            owner.AddComponent<HealthAndDamageSystem>();
            owner.AddComponent<PlayerMovementAndCamera>();
            var combat = owner.AddComponent<PlayerCombatSystem>();
            FieldInfo max = typeof(PlayerCombatSystem).GetField("ultimateMax", BindingFlags.Instance | BindingFlags.NonPublic);
            max.SetValue(combat, 0f);
            Assert.AreEqual(0f, combat.UltimateGauge01);
            max.SetValue(combat, float.NaN);
            Assert.AreEqual(0f, combat.UltimateGauge01);
        }
    }
}