using NUnit.Framework;
using UnityEngine;
using UnityEngine.AI;
using AshenCrown.Boss;
using AshenCrown.Combat;
using AshenCrown.Core;
using AshenCrown.Player;

namespace AshenCrown.Tests.EditMode
{
    public sealed class RegistryLifecycleTests
    {
        GameObject playerObject;
        GameObject bossObject;

        [TearDown]
        public void TearDown()
        {
            if (playerObject != null)
                Object.DestroyImmediate(playerObject);
            if (bossObject != null)
                Object.DestroyImmediate(bossObject);

            if (PlayerRegistry.CurrentPlayer != null)
                PlayerRegistry.Unregister(PlayerRegistry.CurrentPlayer);
        }

        [Test]
        public void PlayerComponentRegistersAndUnregistersWithoutSceneSearch()
        {
            playerObject = new GameObject("RegistryLifecycle_Player");
            playerObject.AddComponent<HealthAndDamageSystem>();
            playerObject.AddComponent<PlayerStamina>();
            var player = playerObject.AddComponent<PlayerCombatSystem>();

            Assert.AreSame(player, PlayerRegistry.CurrentPlayer);

            Object.DestroyImmediate(playerObject);
            playerObject = null;

            Assert.IsNull(PlayerRegistry.CurrentPlayer);
        }

        [Test]
        public void BossLifecycleRaisesRegisteredAndUnregisteredEvents()
        {
            bool registered = false;
            bool unregistered = false;
            BossController registeredBoss = null;
            System.Action<BossController> onRegistered = boss =>
            {
                registeredBoss = boss;
                registered = true;
            };
            System.Action<BossController> onUnregistered = boss =>
            {
                if (boss == registeredBoss)
                    unregistered = true;
            };

            BossController.Registered += onRegistered;
            BossController.Unregistered += onUnregistered;
            try
            {
                bossObject = new GameObject("RegistryLifecycle_Boss");
                bossObject.AddComponent<NavMeshAgent>();
                bossObject.AddComponent<HealthAndDamageSystem>();
                var boss = bossObject.AddComponent<BossController>();

                Assert.IsTrue(registered);
                Assert.AreSame(boss, registeredBoss);

                Object.DestroyImmediate(bossObject);
                bossObject = null;

                Assert.IsTrue(unregistered);
            }
            finally
            {
                BossController.Registered -= onRegistered;
                BossController.Unregistered -= onUnregistered;
            }
        }
    }
}
