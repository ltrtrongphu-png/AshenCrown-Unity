using UnityEngine;

namespace AshenCrown.Presentation
{
    [CreateAssetMenu(menuName = "Ashen Crown/Texture Performance Profile")]
    public sealed class TexturePerformanceProfile : ScriptableObject
    {
        [Header("Texture size")]
        [Min(64)] public int defaultMaxTextureSize = 2048;
        [Min(64)] public int characterMaxTextureSize = 4096;
        [Min(64)] public int environmentMaxTextureSize = 2048;
        [Min(64)] public int uiMaxTextureSize = 2048;

        [Header("Runtime sampling")]
        public bool generateMipMaps = true;
        public bool streamMipMaps = true;
        [Range(0, 16)] public int anisotropicLevel = 4;
        public FilterMode filterMode = FilterMode.Trilinear;

        [Header("Compression")]
        [Tooltip("Editor import compression quality. 100 = highest quality, lower values reduce build size.")]
        [Range(0, 100)] public int compressionQuality = 70;
        public bool highQualityCompression = true;
        public bool crunchCompression = true;

        public int GetMaxSize(string assetPath)
        {
            var path = (assetPath ?? string.Empty).Replace('\\', '/').ToLowerInvariant();
            if (path.Contains("/characters/") || path.Contains("/character/"))
                return characterMaxTextureSize;
            if (path.Contains("/environment/") || path.Contains("/world/"))
                return environmentMaxTextureSize;
            if (path.Contains("/ui/") || path.Contains("/hud/"))
                return uiMaxTextureSize;
            return defaultMaxTextureSize;
        }
    }
}
