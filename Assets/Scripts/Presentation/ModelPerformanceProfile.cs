using UnityEngine;

namespace AshenCrown.Presentation
{
    [CreateAssetMenu(menuName = "Ashen Crown/Model Performance Profile")]
    public sealed class ModelPerformanceProfile : ScriptableObject
    {
        [Header("Visibility")]
        [Min(1f)] public float maxDistance = 80f;
        [Min(1f)] public float cullDistance = 120f;

        [Header("LOD")]
        [Tooltip("World-space screen-relative thresholds. Use authored LODGroup data on the prefab when available.")]
        [Range(0.01f, 1f)] public float lod0Threshold = 0.70f;
        [Range(0.01f, 1f)] public float lod1Threshold = 0.35f;
        [Range(0.01f, 1f)] public float lod2Threshold = 0.12f;
        [Range(0f, 1f)] public float lodFadeWidth = 0.08f;
        public bool useCrossFade = true;

        [Header("Rendering")]
        public bool disableShadowsAtDistance = true;
        [Min(0f)] public float shadowDistance = 45f;
        public bool disableReflectionProbesAtDistance = false;
        public bool useSkinnedMeshOffscreenCulling = true;

        [Header("Animation")]
        public bool optimizeBones = true;
        public bool cullAnimatorWhenOffscreen = true;
        [Min(0.1f)] public float animatorFarDistance = 55f;

        public float ShadowDistance => Mathf.Min(maxDistance, Mathf.Max(0f, shadowDistance));
    }
}
