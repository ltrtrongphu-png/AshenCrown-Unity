using UnityEngine;
namespace AshenCrown.Online
{
    [CreateAssetMenu(menuName="Ashen Crown/Online/Supabase Config")]
    public sealed class SupabaseConfig:ScriptableObject
    {
        public string projectUrl;
        [Tooltip("Public sb_publishable_... key only. Never use sb_secret/service_role here.")] public string publishableKey;
        public bool autoCloudSave=true;
    }
}