using NUnit.Framework;
using AshenCrown.Save;

namespace AshenCrown.Tests.EditMode
{
    public sealed class CloudSaveConflictTests
    {
        [Test]
        public void NewerCloudRequiresExplicitConflictResolution()
        {
            Assert.IsTrue(SaveLoadSystem.IsCloudSaveNewer(
                "2026-10-10T12:00:00.0000000Z",
                "2026-10-11T12:00:00.0000000Z"));
        }

        [Test]
        public void OlderOrEqualCloudNeverWinsAutomatically()
        {
            Assert.IsFalse(SaveLoadSystem.IsCloudSaveNewer(
                "2026-10-11T12:00:00.0000000Z",
                "2026-10-10T12:00:00.0000000Z"));
            Assert.IsFalse(SaveLoadSystem.IsCloudSaveNewer(
                "2026-10-11T12:00:00.0000000Z",
                "2026-10-11T12:00:00.0000000Z"));
        }

        [Test]
        public void InvalidCloudTimestampDoesNotOverrideLocalSave()
        {
            Assert.IsFalse(SaveLoadSystem.IsCloudSaveNewer(
                "2026-10-11T12:00:00.0000000Z",
                "not-a-timestamp"));
        }
    }
}