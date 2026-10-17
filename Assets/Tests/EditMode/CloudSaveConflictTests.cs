using NUnit.Framework;
using AshenCrown.Save;

namespace AshenCrown.Tests.EditMode
{
    public sealed class CloudSaveConflictTests
    {
        static AshenSaveData Save(string time, int skillPoints = 0)
        {
            return new AshenSaveData { lastSavedUtc = time, skillPoints = skillPoints };
        }

        [Test]
        public void NewerOrOlderSaveRequiresExplicitConflictResolution()
        {
            Assert.IsTrue(SaveLoadSystem.ShouldPromptCloudConflict(
                Save("2026-10-10T12:00:00.0000000Z"),
                Save("2026-10-11T12:00:00.0000000Z")));
            Assert.IsTrue(SaveLoadSystem.ShouldPromptCloudConflict(
                Save("2026-10-11T12:00:00.0000000Z"),
                Save("2026-10-10T12:00:00.0000000Z")));
        }

        [Test]
        public void EqualTimestampButDifferentPayloadStillPrompts()
        {
            const string stamp = "2026-10-11T12:00:00.0000000Z";
            Assert.IsTrue(SaveLoadSystem.ShouldPromptCloudConflict(Save(stamp, 1), Save(stamp, 2)));
        }

        [Test]
        public void EqualTimestampAndEqualPayloadKeepsLocalWithoutPrompt()
        {
            const string stamp = "2026-10-11T12:00:00.0000000Z";
            Assert.IsFalse(SaveLoadSystem.ShouldPromptCloudConflict(Save(stamp, 1), Save(stamp, 1)));
        }

        [Test]
        public void InvalidTimestampRequiresExplicitResolution()
        {
            Assert.IsTrue(SaveLoadSystem.ShouldPromptCloudConflict(
                Save("not-a-timestamp"),
                Save("2026-10-11T12:00:00.0000000Z")));
        }
    }
}
