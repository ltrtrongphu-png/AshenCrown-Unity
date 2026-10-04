using System;
using System.Collections.Generic;
using UnityEngine;

namespace AshenCrown.Progression
{
    [Serializable]
    public sealed class ShopOffer
    {
        public string id;
        public string title;
        public string description;
        public int price;
        public int stock;
        public bool gear;
        public EquipmentSlot gearSlot;
        public ItemTier tier;
    }

    public sealed class RPGShopSystem : MonoBehaviour
    {
        public const string CurrencyId = "ashen_coins";
        public static RPGShopSystem Instance { get; private set; }
        public event Action ShopChanged;
        public IReadOnlyList<ShopOffer> Offers => offers;
        public int Currency => InventorySystem.Instance != null ? InventorySystem.Instance.GetAmount(CurrencyId) : 0;

        readonly List<ShopOffer> offers = new List<ShopOffer>();
        readonly string[] relicNames = { "Ember Sigil", "Veil Prism", "Crown Fragment", "Starless Charm", "Sanctuary Seal", "Eternal Locket" };
        bool initialized;

        void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        void Start()
        {
            Refresh();
            if (InventorySystem.Instance != null && InventorySystem.Instance.Items.Count == 0)
                InventorySystem.Instance.Add(CurrencyId, 250);
        }

        public void Refresh()
        {
            offers.Clear();
            for (int i = 0; i < 6; i++)
            {
                var tier = (ItemTier)Mathf.Clamp(i + 1, (int)ItemTier.Common, (int)ItemTier.Legendary);
                offers.Add(new ShopOffer
                {
                    id = "shop_relic_" + i,
                    title = relicNames[i],
                    description = "A sanctuary relic that can be equipped in the Relic slot.",
                    price = 60 + i * 55 + (int)tier * 20,
                    stock = 1,
                    gear = true,
                    gearSlot = EquipmentSlot.Relic,
                    tier = tier
                });
            }
            initialized = true;
            ShopChanged?.Invoke();
        }

        public bool Purchase(int index)
        {
            if (!initialized || index < 0 || index >= offers.Count) return false;
            var offer = offers[index];
            if (offer.stock <= 0 || InventorySystem.Instance == null) return false;
            if (!InventorySystem.Instance.Remove(CurrencyId, offer.price)) return false;

            if (offer.gear && EquipmentSystem.Instance != null)
            {
                var item = CreateRelic(offer);
                if (!EquipmentSystem.Instance.Equip(item))
                {
                    InventorySystem.Instance.Add(CurrencyId, offer.price);
                    return false;
                }
            }
            else
            {
                InventorySystem.Instance.Add(offer.id, 1);
            }

            offer.stock--;
            ShopChanged?.Invoke();
            return true;
        }

        public bool SellMaterial(string itemId, int amount, int unitValue = 8)
        {
            if (InventorySystem.Instance == null || amount <= 0 || unitValue <= 0) return false;
            if (!InventorySystem.Instance.Remove(itemId, amount)) return false;
            InventorySystem.Instance.Add(CurrencyId, amount * unitValue);
            ShopChanged?.Invoke();
            return true;
        }

        ShopOffer FindOffer(int index) => index >= 0 && index < offers.Count ? offers[index] : null;

        ItemDefinition CreateRelic(ShopOffer offer)
        {
            int tierPower = 18 + (int)offer.tier * 12;
            return new ItemDefinition
            {
                id = offer.id + "_" + Guid.NewGuid().ToString("N"),
                displayName = offer.title,
                slot = EquipmentSlot.Relic,
                tier = offer.tier,
                requiredLevel = 1 + (int)offer.tier * 2,
                power = tierPower,
                armor = 0,
                health = 12 + (int)offer.tier * 7,
                damage = 0,
                maxUpgrade = 10
            };
        }
    }
}
