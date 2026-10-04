using UnityEngine;
using UnityEngine.Rendering;
using AshenCrown.Core;

namespace AshenCrown.Presentation
{
    public sealed class CharacterModelBinder : MonoBehaviour
    {
        [SerializeField] GameObject modelPrefab;
        [SerializeField] ModelSource modelSource;
        [SerializeField] ModelPerformanceProfile performance;
        [SerializeField] Transform modelAnchor;
        [SerializeField] bool copyAnimatorFromModel = true;
        [SerializeField] Vector3 localPosition;
        [SerializeField] Vector3 localEulerAngles;
        [SerializeField] Vector3 localScale = Vector3.one;

        GameObject instance;
        Renderer[] renderers;
        SkinnedMeshRenderer[] skinnedRenderers;
        Animator modelAnimator;
        Camera cachedCamera;
        float cameraRefreshTimer;
        bool modelCulled;

        public Animator ModelAnimator => modelAnimator;
        public GameObject ModelInstance => instance;

        void Awake() => Rebuild();

        public void Rebuild()
        {
            if (instance != null)
                Destroy(instance);

            GameObject prefab = modelPrefab;
            if (prefab == null && modelSource != null) prefab = modelSource.modelPrefab;
            if (prefab == null && modelSource != null && !string.IsNullOrWhiteSpace(modelSource.assetGuid))
                prefab = Resources.Load<GameObject>(modelSource.assetGuid);

            if (prefab == null)
            {
                BuildFallback();
                return;
            }

            var anchor = modelAnchor != null ? modelAnchor : transform;
            instance = Instantiate(prefab, anchor);
            instance.name = prefab.name + "_Runtime";
            instance.transform.localPosition = localPosition;
            instance.transform.localRotation = Quaternion.Euler(localEulerAngles);
            instance.transform.localScale = localScale;

            CacheModelComponents();
            ApplyPerformance();

            if (copyAnimatorFromModel)
            {
                var rootAnimator = GetComponent<Animator>();
                if (rootAnimator != null && modelAnimator != null)
                    rootAnimator.runtimeAnimatorController = modelAnimator.runtimeAnimatorController;
            }
        }

        void BuildFallback()
        {
            var anchor = modelAnchor != null ? modelAnchor : transform;
            instance = new GameObject("AshenCrown_3D_Fallback");
            instance.transform.SetParent(anchor, false);
            instance.transform.localPosition = localPosition;
            instance.transform.localRotation = Quaternion.Euler(localEulerAngles);
            instance.transform.localScale = localScale;

            var material = new Material(Shader.Find("Standard"))
            {
                name = "AshenCrown_FallbackMaterial",
                color = new Color(0.16f, 0.18f, 0.22f, 1f)
            };
            if (material.HasProperty("_Metallic")) material.SetFloat("_Metallic", 0.28f);
            if (material.HasProperty("_Glossiness")) material.SetFloat("_Glossiness", 0.62f);

            CreateFallbackPart(PrimitiveType.Capsule, "Body", new Vector3(0f, 0.75f, 0f), new Vector3(0.58f, 0.9f, 0.38f), material);
            CreateFallbackPart(PrimitiveType.Sphere, "Face", new Vector3(0f, 1.66f, 0f), new Vector3(0.46f, 0.52f, 0.44f), material);
            CreateFallbackPart(PrimitiveType.Cylinder, "ChestArmor", new Vector3(0f, 1.0f, -0.02f), new Vector3(0.57f, 0.28f, 0.42f), material);
            CreateFallbackPart(PrimitiveType.Cube, "ShoulderLeft", new Vector3(-0.48f, 1.16f, 0f), new Vector3(0.28f, 0.24f, 0.44f), material);
            CreateFallbackPart(PrimitiveType.Cube, "ShoulderRight", new Vector3(0.48f, 1.16f, 0f), new Vector3(0.28f, 0.24f, 0.44f), material);
            CreateFallbackPart(PrimitiveType.Cylinder, "Belt", new Vector3(0f, 0.76f, 0f), new Vector3(0.62f, 0.08f, 0.44f), material);
            CreateFallbackPart(PrimitiveType.Cylinder, "HeadCrown", new Vector3(0f, 1.98f, 0f), new Vector3(0.30f, 0.10f, 0.30f), material);

            CacheModelComponents();
            BuildFallbackLODGroup();
            ApplyPerformance();
        }

        void CreateFallbackPart(PrimitiveType type, string partName, Vector3 position, Vector3 scale, Material material)
        {
            var go = GameObject.CreatePrimitive(type);
            go.name = partName;
            go.transform.SetParent(instance.transform, false);
            go.transform.localPosition = position;
            go.transform.localScale = scale;

            var renderer = go.GetComponent<Renderer>();
            if (renderer != null) renderer.sharedMaterial = material;

            var collider = go.GetComponent<Collider>();
            if (collider != null) Destroy(collider);
        }

        void CacheModelComponents()
        {
            modelAnimator = instance.GetComponentInChildren<Animator>(true);
            renderers = instance.GetComponentsInChildren<Renderer>(true);
            skinnedRenderers = instance.GetComponentsInChildren<SkinnedMeshRenderer>(true);
            cachedCamera = Camera.main;
            cameraRefreshTimer = 0f;
            modelCulled = false;
        }

        void BuildFallbackLODGroup()
        {
            if (instance == null || renderers == null || renderers.Length == 0) return;
            if (instance.GetComponent<LODGroup>() != null) return;

            var lodGroup = instance.AddComponent<LODGroup>();
            var lod0 = new LOD(performance != null ? performance.lod0Threshold : 0.70f, renderers);

            var medium = new System.Collections.Generic.List<Renderer>();
            var low = new System.Collections.Generic.List<Renderer>();
            for (int i = 0; i < renderers.Length; i++)
            {
                var renderer = renderers[i];
                if (renderer == null) continue;
                string n = renderer.name.ToLowerInvariant();

                // Medium retains silhouette-critical pieces.
                if (n.Contains("body") || n.Contains("face") || n.Contains("chest") || n.Contains("belt"))
                    medium.Add(renderer);

                // Far LOD keeps only the main body/head silhouette.
                if (n.Contains("body") || n.Contains("face"))
                    low.Add(renderer);
            }

            var lod1 = new LOD(performance != null ? performance.lod1Threshold : 0.35f, medium.ToArray());
            var lod2 = new LOD(performance != null ? performance.lod2Threshold : 0.12f, low.ToArray());
            lodGroup.SetLODs(new[] { lod0, lod1, lod2 });
            lodGroup.fadeMode = performance != null && performance.useCrossFade ? LODFadeMode.CrossFade : LODFadeMode.None;
            lodGroup.animateCrossFading = performance != null && performance.useCrossFade;
            lodGroup.RecalculateBounds();
        }

        void ApplyPerformance()
        {
            if (instance == null || renderers == null || renderers.Length == 0)
                return;

            var lodGroup = instance.GetComponentInChildren<LODGroup>(true);
            if (lodGroup != null && performance != null)
            {
                lodGroup.fadeMode = performance.useCrossFade ? LODFadeMode.CrossFade : LODFadeMode.None;
                lodGroup.animateCrossFading = performance.useCrossFade;
            }

            for (int i = 0; i < skinnedRenderers.Length; i++)
            {
                if (skinnedRenderers[i] == null) continue;
                skinnedRenderers[i].updateWhenOffscreen = !performance || !performance.useSkinnedMeshOffscreenCulling;
            }

            if (modelAnimator != null && performance != null && performance.cullAnimatorWhenOffscreen)
                modelAnimator.cullingMode = AnimatorCullingMode.CullUpdateTransforms;
        }

        void LateUpdate()
        {
            if (performance == null || renderers == null || renderers.Length == 0)
                return;

            if (cachedCamera == null || !cachedCamera.isActiveAndEnabled)
            {
                cameraRefreshTimer -= Time.unscaledDeltaTime;
                if (cameraRefreshTimer <= 0f)
                {
                    cameraRefreshTimer = 1f;
                    cachedCamera = Camera.main;
                }
                if (cachedCamera == null) return;
            }

            float distance = Vector3.Distance(cachedCamera.transform.position, transform.position);
            bool shouldCull = distance >= Mathf.Max(performance.cullDistance, performance.maxDistance + 1f);

            if (shouldCull != modelCulled)
            {
                modelCulled = shouldCull;
                for (int i = 0; i < renderers.Length; i++)
                    if (renderers[i] != null) renderers[i].enabled = !shouldCull;
            }

            if (modelAnimator != null && performance.cullAnimatorWhenOffscreen)
            {
                bool shouldAnimate = !shouldCull && distance <= performance.animatorFarDistance;
                if (modelAnimator.enabled != shouldAnimate)
                    modelAnimator.enabled = shouldAnimate;
            }

            bool castShadows = !performance.disableShadowsAtDistance || distance <= performance.ShadowDistance;
            ReflectionProbeUsage reflectionMode = performance.disableReflectionProbesAtDistance &&
                                                   distance > performance.ShadowDistance
                ? ReflectionProbeUsage.Off
                : ReflectionProbeUsage.BlendProbes;

            for (int i = 0; i < renderers.Length; i++)
            {
                var renderer = renderers[i];
                if (renderer == null) continue;

                renderer.shadowCastingMode = castShadows ? ShadowCastingMode.On : ShadowCastingMode.Off;
                renderer.reflectionProbeUsage = reflectionMode;
            }
        }

        public void Play(string state, float fade = .08f) =>
            AnimatorSafe.Play(modelAnimator != null ? modelAnimator : GetComponent<Animator>(), state, fade);
    }
}
