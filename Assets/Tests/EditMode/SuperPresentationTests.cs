using NUnit.Framework;
using UnityEngine;

namespace AshenCrown.Tests
{
    public class SuperPresentationTests
    {
        [Test]
        public void AnimationDeadZone_RemovesMicroJitter()
        {
            var value = AshenCrown.Animation.AnimationPresentationMath.ClampLocomotion(
                new Vector3(0.01f, 4f, -0.02f), 0.05f);
            Assert.That(value, Is.EqualTo(Vector3.zero));
        }

        [Test]
        public void AnimationSmoothingFactor_IsBounded()
        {
            float factor = AshenCrown.Animation.AnimationPresentationMath.ExpSmoothingFactor(18f, 0.016f);
            Assert.That(factor, Is.GreaterThan(0f));
            Assert.That(factor, Is.LessThan(1f));
        }

        [Test]
        public void HudPulse_ReachesFullStrengthAtStart()
        {
            Assert.That(AshenCrown.UI.CinematicHUDMath.Pulse(1f, 1f), Is.EqualTo(1f));
        }

        [Test]
        public void HudBars_StayNormalized()
        {
            Assert.That(AshenCrown.UI.CinematicHUDMath.ClampBar(-2f), Is.EqualTo(0f));
            Assert.That(AshenCrown.UI.CinematicHUDMath.ClampBar(4f), Is.EqualTo(1f));
        }
    }
}