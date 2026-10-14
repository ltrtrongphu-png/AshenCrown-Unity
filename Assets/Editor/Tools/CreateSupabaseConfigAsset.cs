using System.IO;
using UnityEditor;
using UnityEngine;
using AshenCrown.Online;

namespace AshenCrown.Editor.Tools
{
    public static class CreateSupabaseConfigAsset
    {
        const string DirectoryPath = "Assets/Resources";
        const string AssetPath = DirectoryPath + "/SupabaseConfig.asset";

        [MenuItem("Ashen Crown/Online/Create Supabase Config Asset")]
        public static void Create()
        {
            if (File.Exists(AssetPath))
            {
                Selection.activeObject = AssetDatabase.LoadAssetAtPath<SupabaseConfig>(AssetPath);
                Debug.Log("SupabaseConfig.asset already exists. No configuration was overwritten.");
                return;
            }

            if (!AssetDatabase.IsValidFolder(DirectoryPath))
                AssetDatabase.CreateFolder("Assets", "Resources");

            var config = ScriptableObject.CreateInstance<SupabaseConfig>();
            config.projectUrl = "";
            config.publishableKey = "";
            config.autoCloudSave = true;
            AssetDatabase.CreateAsset(config, AssetPath);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Selection.activeObject = config;

            EditorUtility.DisplayDialog(
                "Supabase config created",
                "Fill in the Supabase project URL and publishable key in Assets/Resources/SupabaseConfig.asset. Use a publishable client key only; never paste a service_role or sb_secret key into the Unity client.",
                "OK");
        }
    }
}
