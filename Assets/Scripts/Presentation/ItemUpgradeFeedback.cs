using UnityEngine;
using AshenCrown.Progression;

namespace AshenCrown.Presentation
{
    public sealed class ItemUpgradeFeedback : MonoBehaviour
    {
        public static ItemUpgradeFeedback Instance { get; private set; }

        void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void Play(ItemDefinition item)
        {
            if (item == null || GameSettingsService.Instance != null && GameSettingsService.Instance.ReducedMotion) return;
            Debug.Log($"[AshenCrown] Upgrade presentation: {item.displayName} reached +{item.upgradeLevel}.");
        }
    }
}
