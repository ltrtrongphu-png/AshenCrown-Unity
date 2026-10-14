using NUnit.Framework;
using UnityEngine;
using AshenCrown.Animation;
using AshenCrown.Core;

namespace AshenCrown.Tests.EditMode
{
    public sealed class AnimationPresentationControllerTests
    {
        GameObject owner;
        AnimationPresentationController controller;

        [SetUp]
        public void SetUp()
        {
            owner = new GameObject("AnimationPresentationControllerTests");
            controller = owner.AddComponent<AnimationPresentationController>();
        }

        [TearDown]
        public void TearDown()
        {
            if (owner != null)
                Object.DestroyImmediate(owner);
        }

        [TestCase(-1f, 0f)]
        [TestCase(0f, 0f)]
        [TestCase(.5f, .5f)]
        [TestCase(1f, 1f)]
        [TestCase(1.5f, 1f)]
        public void NormalizedSpeedIsClamped(float source, float expected)
        {
            Assert.AreEqual(expected, AnimationPresentationController.ClampNormalizedSpeed(source));
        }

        [Test]
        public void NonFiniteSpeedFallsBackToZero()
        {
            Assert.AreEqual(0f, AnimationPresentationController.ClampNormalizedSpeed(float.NaN));
            Assert.AreEqual(0f, AnimationPresentationController.ClampNormalizedSpeed(float.PositiveInfinity));
        }

        [Test]
        public void LocalVelocityIsClampedPerAxis()
        {
            Vector3 result = AnimationPresentationController.ClampLocalVelocity(new Vector3(4f, -3f, .25f));
            Assert.AreEqual(new Vector3(1f, -1f, .25f), result);
        }

        [Test]
        public void PlaybackSpeedIsClampedAndRejectsNonFiniteValues()
        {
            Assert.AreEqual(3f, AnimationPresentationController.ClampPlaybackSpeed(99f));
            Assert.AreEqual(.05f, AnimationPresentationController.ClampPlaybackSpeed(0f));
            Assert.AreEqual(1f, AnimationPresentationController.ClampPlaybackSpeed(float.NaN));
        }

        [Test]
        public void IdenticalActionHashIsNotRestarted()
        {
            Assert.IsFalse(AnimationPresentationController.ShouldRestartAction(42, 42));
            Assert.IsFalse(AnimationPresentationController.ShouldRestartAction(0, 0));
            Assert.IsTrue(AnimationPresentationController.ShouldRestartAction(43, 42));
        }

        [Test]
        public void MissingAnimatorControllerIsSafeNoOp()
        {
            Assert.DoesNotThrow(() =>
            {
                controller.SetLocomotion(new Vector3(2f, 0f, -2f), 1.5f, true, true);
                controller.SetCombatState(true, false);
                controller.SetGrounded(true);
                controller.SetCombat(true);
                controller.Trigger("MissingTrigger");
                controller.PlayAction("MissingState", .1f, 1f);
                controller.SetPlaybackSpeed(100f);
                AnimatorSafe.Play(null, "MissingState");
            });
        }
    }
}
