using NUnit.Framework;
using AshenCrown.UI;

namespace AshenCrown.Tests.EditMode
{
    public sealed class HUDPresentationSettingsTests
    {
        [TestCase(-1f, 0.35f)]
        [TestCase(0.35f, 0.35f)]
        [TestCase(0.8f, 0.8f)]
        [TestCase(1f, 1f)]
        [TestCase(2f, 1f)]
        public void AlphaIsClampedToKeepHudReadable(float source, float expected)
        {
            Assert.AreEqual(expected, HUDPresentationSettings.ClampAlpha(source));
        }

        [TestCase(0.1f, 0.8f)]
        [TestCase(0.8f, 0.8f)]
        [TestCase(1f, 1f)]
        [TestCase(1.2f, 1.2f)]
        [TestCase(2f, 1.25f)]
        public void ScaleIsClampedToSafeRange(float source, float expected)
        {
            Assert.AreEqual(expected, HUDPresentationSettings.ClampScale(source));
        }

        [Test]
        public void NonFiniteValuesFallBackToDefaults()
        {
            Assert.AreEqual(1f, HUDPresentationSettings.ClampAlpha(float.NaN));
            Assert.AreEqual(1f, HUDPresentationSettings.ClampScale(float.PositiveInfinity));
        }

        [Test]
        public void ToastQueueLimitRemainsBounded()
        {
            Assert.AreEqual(8, HUDPresentationSettings.MaxQueuedToasts);
        }
    }
}
