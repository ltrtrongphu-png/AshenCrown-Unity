using UnityEngine;
using AshenCrown.Combat;
using AshenCrown.Progression;

namespace AshenCrown.RPG
{
    public sealed class RPGCreatureReward : MonoBehaviour
    {
        [SerializeField] int coins = 10;
        HealthAndDamageSystem health;
        bool paid;

        public void Configure(int amount)
        {
            coins = Mathf.Max(0, amount);
        }

        void Awake()
        {
            health = GetComponent<HealthAndDamageSystem>();
            if (health != null) health.OnDeath += Pay;
        }

        void OnDestroy()
        {
            if (health != null) health.OnDeath -= Pay;
        }

        void Pay()
        {
            if (paid || coins <= 0 || InventorySystem.Instance == null) return;
            paid = true;
            InventorySystem.Instance.Add(RPGShopSystem.CurrencyId, coins);
        }
    }
}
