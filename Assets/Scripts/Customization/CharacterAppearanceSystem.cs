using System;
using UnityEngine;
using AshenCrown.Presentation;

namespace AshenCrown.Customization
{
    [Serializable]
    public sealed class CharacterAppearanceData
    {
        public int preset;
        public int bodyStyle;
        public int hairStyle;
        public int outfitStyle;
        public float bodyScale = 1f;
        public string skinColor = "#C98F6B";
        public string hairColor = "#2B211B";
        public string outfitColor = "#5B6070";
    }

    public sealed class CharacterAppearanceSystem : MonoBehaviour
    {
        public static CharacterAppearanceSystem Instance { get; private set; }
        public CharacterAppearanceData Data { get; private set; } = new CharacterAppearanceData();
        public event Action AppearanceChanged;

        readonly Color[] skinPresets =
        {
            new Color32(201,143,107,255),
            new Color32(232,184,146,255),
            new Color32(160,105,76,255),
            new Color32(113,72,54,255)
        };
        readonly Color[] hairPresets =
        {
            new Color32(43,33,27,255),
            new Color32(91,62,39,255),
            new Color32(154,151,145,255),
            new Color32(67,75,103,255)
        };
        readonly Color[] outfitPresets =
        {
            new Color32(91,96,112,255),
            new Color32(55,70,82,255),
            new Color32(82,58,86,255),
            new Color32(106,77,48,255)
        };

        void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            LoadPrefs();
        }

        void Start() => Apply();

        public void SetPreset(int index)
        {
            Data.preset = Mathf.Clamp(index, 0, 3);
            Data.bodyStyle = Data.preset;
            Data.hairStyle = Data.preset;
            Data.outfitStyle = Data.preset;
            Data.bodyScale = 0.94f + Data.preset * 0.04f;
            Data.skinColor = ColorUtility.ToHtmlStringRGB(skinPresets[Data.preset]);
            Data.hairColor = ColorUtility.ToHtmlStringRGB(hairPresets[Data.preset]);
            Data.outfitColor = ColorUtility.ToHtmlStringRGB(outfitPresets[Data.preset]);
            Apply();
        }

        public void SetBodyScale(float value)
        {
            Data.bodyScale = Mathf.Clamp(value, 0.9f, 1.1f);
            Apply();
        }

        public void SetSkinPreset(int index)
        {
            Data.skinColor = ColorUtility.ToHtmlStringRGB(skinPresets[Mathf.Clamp(index, 0, skinPresets.Length - 1)]);
            Apply();
        }

        public void SetHairPreset(int index)
        {
            Data.hairColor = ColorUtility.ToHtmlStringRGB(hairPresets[Mathf.Clamp(index, 0, hairPresets.Length - 1)]);
            Apply();
        }

        public void SetOutfitPreset(int index)
        {
            Data.outfitColor = ColorUtility.ToHtmlStringRGB(outfitPresets[Mathf.Clamp(index, 0, outfitPresets.Length - 1)]);
            Apply();
        }

        public CharacterAppearanceData Capture()
        {
            return new CharacterAppearanceData
            {
                preset = Data.preset,
                bodyStyle = Data.bodyStyle,
                hairStyle = Data.hairStyle,
                outfitStyle = Data.outfitStyle,
                bodyScale = Data.bodyScale,
                skinColor = Data.skinColor,
                hairColor = Data.hairColor,
                outfitColor = Data.outfitColor
            };
        }

        public void Restore(CharacterAppearanceData data)
        {
            if (data == null) return;
            Data = data;
            SavePrefs();
            Apply();
        }

        public void Apply()
        {
            var player = GameObject.FindGameObjectWithTag("Player");
            if (player == null) { SavePrefs(); return; }

            var binder = player.GetComponent<CharacterModelBinder>();
            if (binder != null && binder.ModelInstance != null)
                binder.ModelInstance.transform.localScale = Vector3.one * Data.bodyScale;

            var renderers = player.GetComponentsInChildren<Renderer>(true);
            Color skin = ParseColor(Data.skinColor, skinPresets[0]);
            Color hair = ParseColor(Data.hairColor, hairPresets[0]);
            Color outfit = ParseColor(Data.outfitColor, outfitPresets[0]);

            foreach (var r in renderers)
            {
                if (r == null) continue;
                string n = r.name.ToLowerInvariant();
                Color c = n.Contains("hair") ? hair :
                          (n.Contains("skin") || n.Contains("face") || n.Contains("body") ? skin : outfit);
                var block = new MaterialPropertyBlock();
                r.GetPropertyBlock(block);
                block.SetColor("_Color", c);
                block.SetColor("_BaseColor", c);
                r.SetPropertyBlock(block);
            }

            SavePrefs();
            AppearanceChanged?.Invoke();
        }

        static Color ParseColor(string hex, Color fallback)
        {
            Color c;
            return ColorUtility.TryParseHtmlString(hex.StartsWith("#") ? hex : "#" + hex, out c) ? c : fallback;
        }

        void LoadPrefs()
        {
            string json = PlayerPrefs.GetString("ashen.appearance", string.Empty);
            if (!string.IsNullOrEmpty(json))
            {
                var data = JsonUtility.FromJson<CharacterAppearanceData>(json);
                if (data != null) Data = data;
            }
        }

        void SavePrefs() => PlayerPrefs.SetString("ashen.appearance", JsonUtility.ToJson(Data));
    }
}
