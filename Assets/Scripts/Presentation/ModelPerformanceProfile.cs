using UnityEngine;

namespace AshenCrown.Presentation
{
    [CreateAssetMenu(menuName = "Ashen Crown/Model Performance Profile")]
    public sealed class ModelPerformanceProfile : ScriptableObject
    {
        public float maxDistance = 80f;
        public bool optimizeBones = true;
        public bool disableShadowsAtDistance = true;
        public int lodCount = 3;
    }
}