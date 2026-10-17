using NUnit.Framework;
using AshenCrown.Core;

namespace AshenCrown.Tests.EditMode
{
    public sealed class TimeScaleServiceTests
    {
        [Test]
        public void ActiveEffectsComposeToTheSlowestRequestedScale()
        {
            Assert.AreEqual(0.05f, TimeScaleService.CalculateEffectiveScale(new[] { 0.08f, 0.05f, 1f }, false), 0.0001f);
        }

        [Test]
        public void PauseAlwaysOverridesActiveEffects()
        {
            Assert.AreEqual(0f, TimeScaleService.CalculateEffectiveScale(new[] { 0.08f, 0.05f }, true), 0.0001f);
        }

        [Test]
        public void MissingOrInvalidScaleRequestsDoNotProduceNan()
        {
            Assert.AreEqual(1f, TimeScaleService.CalculateEffectiveScale(null, false), 0.0001f);
            Assert.AreEqual(0.2f, TimeScaleService.CalculateEffectiveScale(new[] { float.NaN, float.PositiveInfinity, 0.2f }, false), 0.0001f);
        }
    }
}