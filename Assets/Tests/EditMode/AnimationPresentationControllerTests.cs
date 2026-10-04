using NUnit.Framework;
using UnityEngine;

namespace AshenCrown.Tests
{
    public class AnimationPresentationControllerTests
    {
        [Test]
        public void ClampSpeed_StaysWithinBlendTreeRange()
        {
            Assert.That(AshenCrown.Animation.AnimationPresentationMath.ClampSpeed(-1f), Is.EqualTo(0f));
            Assert.That(AshenCrown.Animation.AnimationPresentationMath.ClampSpeed(2f), Is.EqualTo(1f));
        }

        [Test]
        public void ClampLocomotion_RemovesVerticalAndOvershoot()
        {
            Vector3 result = AshenCrown.Animation.AnimationPresentationMath.ClampLocomotion(new Vector3(2f, 9f, -2f));
            Assert.That(result, Is.EqualTo(new Vector3(1f, 0f, -1f)));
        }

        [Test]
        public void ClampPlaybackSpeed_StaysSafe()
        {
            Assert.That(AshenCrown.Animation.AnimationPresentationMath.ClampPlaybackSpeed(0f), Is.EqualTo(.01f));
            Assert.That(AshenCrown.Animation.AnimationPresentationMath.ClampPlaybackSpeed(9f), Is.EqualTo(3f));
        }
    }
}
