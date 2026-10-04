using NUnit.Framework;
using UnityEngine;

namespace AshenCrown.Tests
{
    public class HUDPresentationTests
    {
        [Test]
        public void UIAlpha_IsClampedToReadableRange()
        {
            var go = new GameObject("HUD settings test");
            try
            {
                var settings = go.AddComponent<AshenCrown.UI.HUDPresentationSettings>();
                settings.UIAlpha = 0f;
                Assert.That(settings.UIAlpha, Is.EqualTo(.65f));
                settings.UIAlpha = 2f;
                Assert.That(settings.UIAlpha, Is.EqualTo(1f));
            }
            finally { Object.DestroyImmediate(go); }
        }

        [Test]
        public void UIScale_IsClampedToAccessibleRange()
        {
            var go = new GameObject("HUD scale test");
            try
            {
                var settings = go.AddComponent<AshenCrown.UI.HUDPresentationSettings>();
                settings.UIScale = 0f;
                Assert.That(settings.UIScale, Is.EqualTo(.85f));
                settings.UIScale = 2f;
                Assert.That(settings.UIScale, Is.EqualTo(1.35f));
            }
            finally { Object.DestroyImmediate(go); }
        }
    }
}
