using NUnit.Framework;
using UnityEngine;
using AshenCrown.Combat;

namespace AshenCrown.Tests.EditMode
{
    public sealed class CombatPresentationFeedbackTests
    {
        GameObject owner;
        CombatPresentationFeedback feedback;
        float originalTimeScale;

        [SetUp]
        public void SetUp()
        {
            originalTimeScale = Time.timeScale;
            Time.timeScale = 1f;
            owner = new GameObject("CombatPresentationFeedbackTests");
            feedback = owner.AddComponent<CombatPresentationFeedback>();
            feedback.SetReducedMotion(false);
        }

        [TearDown]
        public void TearDown()
        {
            if (owner != null)
                Object.DestroyImmediate(owner);
            Time.timeScale = originalTimeScale;
        }

        [TestCase(-1f, 0f)]
        [TestCase(0f, 0f)]
        [TestCase(.5f, .5f)]
        [TestCase(1.5f, 1f)]
        public void StrengthIsClamped(float value, float expected)
        {
            Assert.AreEqual(expected, CombatPresentationFeedback.ClampStrength(value));
        }

        [Test]
        public void DurationClampsAndUsesFallbackForNonFiniteValues()
        {
            Assert.AreEqual(.2f, CombatPresentationFeedback.ClampDuration(3f));
            Assert.AreEqual(.01f, CombatPresentationFeedback.ClampDuration(.001f));
            Assert.AreEqual(.045f, CombatPresentationFeedback.ClampDuration(float.NaN));
        }

        [Test]
        public void ReducedMotionSuppressesHitStop()
        {
            feedback.SetReducedMotion(true);
            feedback.Hit(1f, .1f);
            Assert.AreEqual(1f, Time.timeScale);
        }

        [Test]
        public void DisableRestoresPreviousTimeScaleDuringHitStop()
        {
            Time.timeScale = .5f;
            feedback.Hit(.5f, .1f);
            Assert.AreEqual(.08f, Time.timeScale);

            Object.DestroyImmediate(owner);
            owner = null;

            Assert.AreEqual(.5f, Time.timeScale);
        }
    }
}
