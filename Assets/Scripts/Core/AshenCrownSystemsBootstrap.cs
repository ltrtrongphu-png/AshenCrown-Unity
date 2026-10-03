using UnityEngine;
using AshenCrown.Localization;
using AshenCrown.Core;
using AshenCrown.Progression;
using AshenCrown.Save;

namespace AshenCrown.Core
{
    public sealed class AshenCrownSystemsBootstrap : MonoBehaviour
    {
        static bool booted;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        static void Bootstrap()
        {
            if (booted) return;
            booted = true;
            var root = new GameObject("AshenCrown_Systems");
            Object.DontDestroyOnLoad(root);
            root.AddComponent<LocalizationService>();
            root.AddComponent<GameSettingsService>();
            root.AddComponent<InventorySystem>();
            root.AddComponent<SkillTreeSystem>();
            root.AddComponent<SaveLoadSystem>();
        }

        void Update()
        {
            if (Input.GetKeyDown(KeyCode.F5) && SaveLoadSystem.Instance != null)
                SaveLoadSystem.Instance.Save();
            if (Input.GetKeyDown(KeyCode.F9) && SaveLoadSystem.Instance != null)
                SaveLoadSystem.Instance.Load();
        }
    }
}