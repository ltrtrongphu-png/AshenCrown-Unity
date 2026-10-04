using NUnit.Framework;
using UnityEngine;
using AshenCrown.Core;
using AshenCrown.Progression;

namespace AshenCrown.Tests.EditMode
{
    public sealed class ProgressionReliabilityTests
    {
        GameObject inventoryObject;
        GameObject progressionObject;
        GameObject equipmentObject;
        GameObject lootObject;
        GameObject shopObject;
        GameObject skillTreeObject;
        GameObject statBlockObject;

        [SetUp]
        public void SetUp()
        {
            inventoryObject = new GameObject("InventorySystem_Test");
            inventoryObject.AddComponent<InventorySystem>();

            progressionObject = new GameObject("LongTermProgressionSystem_Test");
            progressionObject.AddComponent<LongTermProgressionSystem>();

            equipmentObject = new GameObject("EquipmentSystem_Test");
            equipmentObject.AddComponent<EquipmentSystem>();

            lootObject = new GameObject("LootSystem_Test");
            lootObject.AddComponent<LootSystem>();

            skillTreeObject = new GameObject("SkillTreeSystem_Test");
            skillTreeObject.AddComponent<SkillTreeSystem>();
        }

        [TearDown]
        public void TearDown()
        {
            if (shopObject != null) Object.DestroyImmediate(shopObject);
            if (lootObject != null) Object.DestroyImmediate(lootObject);
            if (equipmentObject != null) Object.DestroyImmediate(equipmentObject);
            if (inventoryObject != null) Object.DestroyImmediate(inventoryObject);
            if (progressionObject != null) Object.DestroyImmediate(progressionObject);
            if (skillTreeObject != null) Object.DestroyImmediate(skillTreeObject);
            if (statBlockObject != null) Object.DestroyImmediate(statBlockObject);
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

        [Test]
        public void Equipment_EquipReturnsPreviousItemToLoot()
        {
            var oldItem = new ItemDefinition { id = "old_helmet", slot = EquipmentSlot.Helmet, tier = ItemTier.Rare };
            var newItem = new ItemDefinition { id = "new_helmet", slot = EquipmentSlot.Helmet, tier = ItemTier.Epic };

            Assert.IsTrue(EquipmentSystem.Instance.Equip(oldItem));
            LootSystem.Instance.AddLoot(newItem);
            Assert.IsTrue(LootSystem.Instance.Equip(newItem));

            Assert.AreSame(newItem, EquipmentSystem.Instance.Get(EquipmentSlot.Helmet));
            CollectionAssert.Contains(LootSystem.Instance.Items, oldItem);
            CollectionAssert.DoesNotContain(LootSystem.Instance.Items, newItem);
        }

        [Test]
        public void Equipment_SalvageOnlyRemovesOwnedItem()
        {
            var helmet = new ItemDefinition { id = "helmet", slot = EquipmentSlot.Helmet, tier = ItemTier.Rare };
            var weapon = new ItemDefinition { id = "weapon", slot = EquipmentSlot.Weapon, tier = ItemTier.Common };
            var lootItem = new ItemDefinition { id = "loot_weapon", slot = EquipmentSlot.Weapon, tier = ItemTier.Epic };

            EquipmentSystem.Instance.Equip(helmet);
            EquipmentSystem.Instance.Equip(weapon);
            LootSystem.Instance.AddLoot(lootItem);

            int essenceBefore = LongTermProgressionSystem.Instance.Essence;
            int lootReward = EquipmentSystem.Instance.Salvage(lootItem);

            Assert.Greater(lootReward, 0);
            Assert.AreSame(helmet, EquipmentSystem.Instance.Get(EquipmentSlot.Helmet));
            Assert.AreSame(weapon, EquipmentSystem.Instance.Get(EquipmentSlot.Weapon));
            CollectionAssert.DoesNotContain(LootSystem.Instance.Items, lootItem);
            Assert.AreEqual(essenceBefore + lootReward, LongTermProgressionSystem.Instance.Essence);

            var unrelated = new ItemDefinition { id = "not_owned", slot = EquipmentSlot.Helmet, tier = ItemTier.Ascendant };
            Assert.AreEqual(0, EquipmentSystem.Instance.Salvage(unrelated));
            Assert.AreSame(helmet, EquipmentSystem.Instance.Get(EquipmentSlot.Helmet));
        }

        [Test]
        public void Equipment_UpgradeUsesSpendEssence()
        {
            var item = new ItemDefinition { id = "upgrade_me", slot = EquipmentSlot.Weapon, power = 100 };
            EquipmentSystem.Instance.Equip(item);
            LongTermProgressionSystem.Instance.AddEssence(100);

            Assert.IsTrue(EquipmentSystem.Instance.Upgrade(item, 25));
            Assert.AreEqual(75, LongTermProgressionSystem.Instance.Essence);
            Assert.AreEqual(1, item.upgradeLevel);
        }

        [Test]
        public void Shop_PurchaseUsesTotalCurrencyAcrossStacks()
        {
            shopObject = new GameObject("RPGShopSystem_Test");
            shopObject.AddComponent<RPGShopSystem>();
            RPGShopSystem.Instance.Refresh();

            InventorySystem.Instance.Add(RPGShopSystem.CurrencyId, 250, 100);
            Assert.AreEqual(250, RPGShopSystem.Instance.Currency);

            Assert.IsTrue(RPGShopSystem.Instance.Purchase(0));
            Assert.AreEqual(170, RPGShopSystem.Instance.Currency);
            Assert.IsNotNull(EquipmentSystem.Instance.Get(EquipmentSlot.Relic));
        }

        [Test]
        public void StatBlock_AppliesEquipmentAndUnlockedSkillModifiers()
        {
            statBlockObject = new GameObject("StatBlock_Test");
            var stats = statBlockObject.AddComponent<StatBlock>();

            var weapon = new ItemDefinition { id = "stat_weapon", slot = EquipmentSlot.Weapon, damage = 50 };
            var armor = new ItemDefinition { id = "stat_armor", slot = EquipmentSlot.Chest, health = 30, armor = 20 };
            EquipmentSystem.Instance.Equip(weapon);
            EquipmentSystem.Instance.Equip(armor);

            stats.Rebuild();
            Assert.AreEqual(180f, stats.Evaluate(StatType.MaxHealth, 150f), 0.01f);
            Assert.AreEqual(30f, stats.Evaluate(StatType.Defense, 10f), 0.01f);
            Assert.AreEqual(75f, stats.Evaluate(StatType.Damage, 25f), 0.01f);

            SkillTreeSystem.Instance.AddSkillPoints(1);
            Assert.IsTrue(SkillTreeSystem.Instance.Unlock("ashen_edge"));
            Assert.AreEqual(82.5f, stats.Evaluate(StatType.Damage, 25f), 0.01f);

            Object.DestroyImmediate(statBlockObject);
            statBlockObject = null;
        }
    }
}
