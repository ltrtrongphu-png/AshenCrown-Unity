#if UNITY_EDITOR
using System;
using UnityEditor;
using UnityEngine;

namespace AshenCrown.Editor.Art
{
    /// <summary>
    /// Import-time art pipeline for consistent character/environment textures and meshes.
    /// It deliberately preserves authored normal maps, sprites and animation clips.
    /// </summary>
    public sealed class ArtAssetPipeline : AssetPostprocessor
    {
        const string EnabledKey = "AshenCrown.ArtPipeline.Enabled";

        static bool Enabled => !EditorPrefs.HasKey(EnabledKey) || EditorPrefs.GetBool(EnabledKey, true);

        [MenuItem("Ashen Crown/Art/Enable Import Optimization")]
        static void EnablePipeline()
        {
            EditorPrefs.SetBool(EnabledKey, true);
            AssetDatabase.Refresh();
            Debug.Log("[AshenCrown] Art import optimization enabled.");
        }

        [MenuItem("Ashen Crown/Art/Disable Import Optimization")]
        static void DisablePipeline()
        {
            EditorPrefs.SetBool(EnabledKey, false);
            Debug.LogWarning("[AshenCrown] Art import optimization disabled.");
        }

        void OnPreprocessTexture()
        {
            if (!Enabled) return;
            var importer = (TextureImporter)assetImporter;
            var path = assetPath.Replace('\\', '/');
            bool isNormal = importer.textureType == TextureImporterType.NormalMap;
            bool isSprite = importer.textureType == TextureImporterType.Sprite;

            importer.isReadable = false;
            importer.filterMode = FilterMode.Trilinear;
            importer.anisoLevel = 4;

            if (!isSprite)
            {
                importer.mipmapEnabled = true;
                importer.streamingMipmaps = true;
            }

            importer.textureCompression = TextureImporterCompression.CompressedHQ;
            importer.compressionQuality = 70;

            int maxSize = GetMaxTextureSize(path, isNormal);
            importer.maxTextureSize = Mathf.Min(Mathf.Max(64, importer.maxTextureSize), maxSize);

            // Crunch is useful for color/albedo textures; normal maps keep the importer defaults
            // to avoid introducing additional normal-map compression artifacts.
            if (!isNormal && !isSprite)
                importer.crunchedCompression = true;
        }

        void OnPreprocessModel()
        {
            if (!Enabled) return;
            var importer = (ModelImporter)assetImporter;
            var path = assetPath.Replace('\\', '/').ToLowerInvariant();

            importer.isReadable = false;
            importer.optimizeMeshVertices = true;
            importer.optimizeMeshPolygons = true;
            importer.meshCompression = ModelImporterMeshCompression.Medium;
            importer.animationCompression = ModelImporterAnimationCompression.Optimal;
            importer.importCameras = false;
            importer.importLights = false;

            // Character rigs keep their animations; static environment assets do not need them.
            if (path.Contains("/environment/") || path.Contains("/world/"))
                importer.importAnimation = false;
        }

        static int GetMaxTextureSize(string path, bool normalMap)
        {
            if (normalMap)
                return 4096;
            if (path.Contains("/characters/") || path.Contains("/character/"))
                return 4096;
            if (path.Contains("/environment/") || path.Contains("/world/"))
                return 2048;
            if (path.Contains("/ui/") || path.Contains("/hud/"))
                return 2048;
            return 2048;
        }

        public static void ReimportArtAssets()
        {
            var textureGuids = AssetDatabase.FindAssets("t:Texture2D");
            var modelGuids = AssetDatabase.FindAssets("t:Model");
            var guids = new System.Collections.Generic.HashSet<string>();
            for (int i = 0; i < textureGuids.Length; i++) guids.Add(textureGuids[i]);
            for (int i = 0; i < modelGuids.Length; i++) guids.Add(modelGuids[i]);

            int processed = 0;
            foreach (var guid in guids)
            {
                string path = AssetDatabase.GUIDToAssetPath(guid);
                if (string.IsNullOrEmpty(path)) continue;

                try
                {
                    AssetDatabase.ImportAsset(path, ImportAssetOptions.ForceUpdate);
                    processed++;
                }
                catch (Exception e)
                {
                    Debug.LogWarning("[AshenCrown] Art import skipped: " + path + " | " + e.Message);
                }
            }
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("[AshenCrown] Reimported " + processed + " art assets.");
        }

        [MenuItem("Ashen Crown/Art/Reimport Art Assets")]
        static void ReimportMenu() => ReimportArtAssets();
    }
}
#endif
