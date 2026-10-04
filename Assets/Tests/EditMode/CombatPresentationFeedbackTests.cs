using NUnit.Framework;
using UnityEngine;

namespace AshenCrown.Tests
{
    public class CombatPresentationFeedbackTests
    {
        [Test]
        public void FeedbackStrength_IsBounded()
        {
            Assert.That(Mathf.Clamp01(-1f), Is.EqualTo(0f));
            Assert.That(Mathf.Clamp01(2f), Is.EqualTo(1f));
        }
    }
}
