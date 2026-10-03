using System;
using System.Collections.Generic;
using UnityEngine;
using AshenCrown.Core;
using AshenCrown.Progression;

namespace AshenCrown.Presentation
{
    /// <summary>
    /// Runtime fallback presentation for equipment until authored GLB/FBX assets are supplied.
    /// Builds readable 3D relic-like silhouettes with tier-aware materials, animation and particles.
    /// </summary>
    public sealed class Item3DPresentationSystem : MonoBehaviour
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void BootstrapRuntime()
        {
            if (Instance != null) return;
            var root = new GameObject("AshenCrown_ItemPresentation");
            DontDestroyOnLoad(root);
            root.AddComponent<Item3DPresentationSystem>();
            root.AddComponent<ItemUpgradeFeedback>();
        }
        public static Item3DPresentationSystem Instance { get; private set; }

        [SerializeField] Transform displayRoot;
        readonly Dictionary<string, GameObject> activeDisplays = new Dictionary<string, GameObject>();
        readonly Dictionary<ItemTier, Color> tierColors = new Dictionary<ItemTier, Color>
        {
            { ItemTier.Broken, new Color(.28f,.28f,.30f) },
            { ItemTier.Common, new Color(.72f,.76f,.82f) },
            { ItemTier.Uncommon, new Color(.25f,.85f,.48f) },
            { ItemTier.Rare, new Color(.25f,.58f,1f) },
            { ItemTier.Epic, new Color(.70f,.38f,1f) },
            { ItemTier.Legendary, new Color(1f,.66f,.18f) },
            { ItemTier.Mythic, new Color(1f,.28f,.38f) },
            { ItemTier.Ascendant, new Color(.55f,1f,.96f) }
        };

        void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            if (displayRoot == null)
            {
                var root = new GameObject("AshenCrown_ItemDisplays");
                root.transform.SetParent(transform, false);
                displayRoot = root.transform;
            }
        }

        public GameObject CreateDisplay(ItemDefinition item, Transform parent = null)
        {
            if (item == null) return null;
            var key = string.IsNullOrEmpty(item.id) ? Guid.NewGuid().ToString("N") : item.id;
            RemoveDisplay(key);

            var root = new GameObject("Item3D_" + key);
            root.transform.SetParent(parent != null ? parent : displayRoot, false);

            var visual = new GameObject("RelicVisual");
            visual.transform.SetParent(root.transform, false);
            BuildSilhouette(visual.transform, item);

            var animator = root.AddComponent<Item3DAnimator>();
            animator.Initialize(item.tier, item.upgradeLevel, visual.transform);

            activeDisplays[key] = root;
            return root;
        }

        public void RemoveDisplay(string itemId)
        {
            if (string.IsNullOrEmpty(itemId)) return;
            if (activeDisplays.TryGetValue(itemId, out var old))
            {
                if (old != null) Destroy(old);
                activeDisplays.Remove(itemId);
            }
        }

        void BuildSilhouette(Transform root, ItemDefinition item)
        {
            var color = tierColors[item.tier];
            var shape = item.slot == EquipmentSlot.Helmet ? PrimitiveType.Sphere :
                        item.slot == EquipmentSlot.Chest ? PrimitiveType.Cube :
                        item.slot == EquipmentSlot.Legs ? PrimitiveType.Capsule :
                        item.slot == EquipmentSlot.Boots ? PrimitiveType.Cylinder :
                        PrimitiveType.Sphere;

            var body = GameObject.CreatePrimitive(shape);
            body.name = "TierCore";
            body.transform.SetParent(root, false);
            body.transform.localScale = item.slot == EquipmentSlot.Chest
                ? new Vector3(.9f, 1.15f, .42f)
                : new Vector3(.72f, .72f, .72f);
            ApplyMaterial(body.GetComponent<Renderer>(), color, item.tier);

            var ring = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            ring.name = "OrbitRing";
            ring.transform.SetParent(root, false);
            ring.transform.localPosition = Vector3.down * .42f;
            ring.transform.localScale = new Vector3(.85f, .035f, .85f);
            ApplyMaterial(ring.GetComponent<Renderer>(), Color.Lerp(color, Color.white, .35f), item.tier);

            if (item.tier >= ItemTier.Epic)
            {
                var halo = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                halo.name = "TierHalo";
                halo.transform.SetParent(root, false);
                halo.transform.localScale = Vector3.one * 1.28f;
                var renderer = halo.GetComponent<Renderer>();
                ApplyMaterial(renderer, color, item.tier, true);
            }

            CreateParticles(root, color, item.tier);
        }

        void ApplyMaterial(Renderer renderer, Color color, ItemTier tier, bool transparent = false)
        {
            if (renderer == null) return;
            var material = new Material(Shader.Find("Standard"));
            material.name = "AshenCrown_Item_" + tier;
            material.color = transparent ? new Color(color.r, color.g, color.b, .08f) : color;
            if (tier >= ItemTier.Epic)
            {
                material.EnableKeyword("_EMISSION");
                material.SetColor("_EmissionColor", color * (tier >= ItemTier.Legendary ? 2.4f : 1.2f));
            }
            if (transparent)
            {
                material.SetFloat("_Mode", 3f);
                material.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.SrcAlpha);
                material.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
                material.SetInt("_ZWrite", 0);
                material.DisableKeyword("_ALPHATEST_ON");
                material.EnableKeyword("_ALPHABLEND_ON");
                material.renderQueue = 3000;
            }
            renderer.material = material;
        }

        void CreateParticles(Transform root, Color color, ItemTier tier)
        {
            if (tier < ItemTier.Rare) return;
            var go = new GameObject("EmberParticles");
            go.transform.SetParent(root, false);
            var ps = go.AddComponent<ParticleSystem>();
            var main = ps.main;
            main.loop = true;
            main.startLifetime = new ParticleSystem.MinMaxCurve(.7f, 1.6f);
            main.startSpeed = new ParticleSystem.MinMaxCurve(.08f, .35f);
            main.startSize = new ParticleSystem.MinMaxCurve(.025f, .075f);
            main.startColor = color;
            main.maxParticles = tier >= ItemTier.Legendary ? 28 : 12;
            var emission = ps.emission;
            emission.rateOverTime = tier >= ItemTier.Legendary ? 12f : 5f;
            var shape = ps.shape;
            shape.shapeType = ParticleSystemShapeType.Sphere;
            shape.radius = .45f;
            var renderer = ps.GetComponent<ParticleSystemRenderer>();
            renderer.renderMode = ParticleSystemRenderMode.Billboard;
        }

        sealed class Item3DAnimator : MonoBehaviour
        {
            Transform visual;
            ItemTier tier;
            int upgradeLevel;
            float seed;

            public void Initialize(ItemTier itemTier, int upgrades, Transform target)
            {
                tier = itemTier;
                upgradeLevel = upgrades;
                visual = target;
                seed = UnityEngine.Random.value * 10f;
            }

            void Update()
            {
                if (visual == null) return;
                var reduced = GameSettingsService.Instance != null && GameSettingsService.Instance.ReducedMotion;
                var motion = reduced ? .12f : 1f;
                var t = Time.time * motion + seed;
                visual.localRotation = Quaternion.Euler(
                    Mathf.Sin(t * .7f) * 3f,
                    t * (8f + (int)tier * 1.8f),
                    Mathf.Cos(t * .55f) * 3f);
                visual.localPosition = Vector3.up * (Mathf.Sin(t * 1.5f) * (.035f + (int)tier * .006f));
                var pulse = 1f + Mathf.Sin(t * 2.1f) * (.012f + upgradeLevel * .002f);
                visual.localScale = Vector3.one * pulse;
            }
        }
    }
}
