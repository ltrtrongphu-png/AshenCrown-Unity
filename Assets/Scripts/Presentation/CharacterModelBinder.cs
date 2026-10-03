using UnityEngine;
using AshenCrown.Core;

namespace AshenCrown.Presentation
{
    public sealed class CharacterModelBinder:MonoBehaviour
    {
        [SerializeField]GameObject modelPrefab;
        [SerializeField]ModelSource modelSource;
        [SerializeField]ModelPerformanceProfile performance;
        [SerializeField]Transform modelAnchor;
        [SerializeField]bool copyAnimatorFromModel=true;
        [SerializeField]Vector3 localPosition;
        [SerializeField]Vector3 localEulerAngles;
        [SerializeField]Vector3 localScale=Vector3.one;
        GameObject instance;
        Renderer[] renderers;
        public Animator ModelAnimator{get;private set;}
        public GameObject ModelInstance=>instance;

        void Awake()=>Rebuild();

        public void Rebuild()
        {
            if(instance!=null)Destroy(instance);
            GameObject prefab=modelPrefab;
            if(prefab==null&&modelSource!=null)prefab=modelSource.modelPrefab;
            if(prefab==null&&modelSource!=null&&!string.IsNullOrWhiteSpace(modelSource.assetGuid))
                prefab=Resources.Load<GameObject>(modelSource.assetGuid);
            if(prefab==null){BuildFallback();return;}
            var a=modelAnchor!=null?modelAnchor:transform;
            instance=Instantiate(prefab,a);
            instance.name=prefab.name+"_Runtime";
            instance.transform.localPosition=localPosition;
            instance.transform.localRotation=Quaternion.Euler(localEulerAngles);
            instance.transform.localScale=localScale;
            ModelAnimator=instance.GetComponentInChildren<Animator>(true);
            renderers=instance.GetComponentsInChildren<Renderer>(true);
            ApplyPerformance();
            if(copyAnimatorFromModel){var root=GetComponent<Animator>();if(root!=null&&ModelAnimator!=null)root.runtimeAnimatorController=ModelAnimator.runtimeAnimatorController;}
        }

        void BuildFallback()
        {
            instance=GameObject.CreatePrimitive(PrimitiveType.Capsule);
            instance.name="AshenCrown_3D_Fallback";
            instance.transform.SetParent(modelAnchor!=null?modelAnchor:transform,false);
            instance.transform.localPosition=localPosition;
            instance.transform.localRotation=Quaternion.Euler(localEulerAngles);
            instance.transform.localScale=localScale;
            renderers=instance.GetComponentsInChildren<Renderer>(true);
        }

        void ApplyPerformance()
        {
            if(renderers==null||renderers.Length==0)return;
            if(performance!=null&&performance.lodCount>0)
            {
                var lod=new LOD(Mathf.Clamp01(1f-Mathf.Clamp(performance.maxDistance,1f,500f)/500f),renderers);
                var group=instance.GetComponent<LODGroup>();
                if(group==null)group=instance.AddComponent<LODGroup>();
                group.SetLODs(new[]{lod});group.RecalculateBounds();
            }
        }

        void LateUpdate()
        {
            if(performance==null||renderers==null||renderers.Length==0||Camera.main==null)return;
            float d=Vector3.Distance(Camera.main.transform.position,transform.position);
            bool cast=!performance.disableShadowsAtDistance||d<=performance.maxDistance;
            foreach(var r in renderers)if(r!=null)r.shadowCastingMode=cast?UnityEngine.Rendering.ShadowCastingMode.On:UnityEngine.Rendering.ShadowCastingMode.Off;
        }

        public void Play(string state,float fade=.08f)=>AnimatorSafe.Play(ModelAnimator!=null?ModelAnimator:GetComponent<Animator>(),state,fade);
    }
}