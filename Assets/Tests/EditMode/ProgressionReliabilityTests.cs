using NUnit.Framework;
using UnityEngine;
using AshenCrown.Progression;

namespace AshenCrown.Tests.EditMode
{
    public sealed class ProgressionReliabilityTests
    {
        GameObject inventoryObject;
        GameObject progressionObject;

        [SetUp]
        public void SetUp()
        {
            inventoryObject = new GameObject("InventorySystem_Test");
            inventoryObject.AddComponent<InventorySystem>();

            progressionObject = new GameObject("LongTermProgressionSystem_Test");
            progressionObject.AddComponent<LongTermProgressionSystem>();
        }

        [TearDown]
        public void TearDown()
        {
            if (inventoryObject != null) Object.DestroyImmediate(inventoryObject);
            if (progressionObject != null) Object.DestroyImmediate(progressionObject);
        }

        [Test]
        public void Inventory_GetAmount_SumsAllStacks()
        {
            Assert.IsTrue(InventorySystem.Instance.Add("test_currency", 250, 100));
            Assert.AreEqual(250, InventorySystem.Instance.GetAmount("test_currency"));
            Assert.IsTrue(InventorySystem.Instance.Remove("test_currency", 150));
            Assert.AreEqual(100, InventorySystem.Instance.GetAmount("test_currency"));
        }

        [Test]
        public void Inventory_Has_UsesTotalAcrossStacks()
        {
            InventorySystem.Instance.Add("test_item", 180, 99);
            Assert.IsTrue(InventorySystem.Instance.Has("test_item", 180));
            Assert.IsFalse(InventorySystem.Instance.Has("test_item", 181));
        }

        [Test]
        public void Essence_RejectsNegativeAdd_AndSupportsSafeSpend()
        {
            LongTermProgressionSystem.Instance.AddEssence(25);
            LongTermProgressionSystem.Instance.AddEssence(-100);
            Assert.AreEqual(25, LongTermProgressionSystem.Instance.Essence);

            Assert.IsFalse(LongTermProgressionSystem.Instance.SpendEssence(26));
            Assert.AreEqual(25, LongTermProgressionSystem.Instance.Essence);

            Assert.IsTrue(LongTermProgressionSystem.Instance.SpendEssence(10));
            Assert.AreEqual(15, LongTermProgressionSystem.Instance.Essence);
        }
    }
}
