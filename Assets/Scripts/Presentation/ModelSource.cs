using UnityEngine;

namespace AshenCrown.Presentation
{
    public enum ModelSourceFormat { Prefab, FBX, GLB }

    [CreateAssetMenu(menuName = "Ashen Crown/Model Profile")]
    public sealed class ModelSource : ScriptableObject
    {
        public ModelSourceFormat format = ModelSourceFormat.Prefab;
        public GameObject modelPrefab;
        public string assetGuid;
        public string animationControllerKey;
        public bool preload = true;
    }
}