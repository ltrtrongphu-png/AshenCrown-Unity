using UnityEngine;
namespace AshenCrown.Performance
{
    public sealed class PerformanceDirector:MonoBehaviour
    {
        public static PerformanceDirector Instance{get;private set;} [SerializeField]int targetFps=60;[SerializeField]float dynamicInterval=.75f;float timer;int lastQuality=-1;
        void Awake(){if(Instance!=null&&Instance!=this){Destroy(gameObject);return;}Instance=this;DontDestroyOnLoad(gameObject);Application.targetFrameRate=targetFps;QualitySettings.vSyncCount=0;}
        void Update(){timer+=Time.unscaledDeltaTime;if(timer<dynamicInterval)return;timer=0;var fps=1f/Mathf.Max(.001f,Time.unscaledDeltaTime);if(fps<42&&QualitySettings.GetQualityLevel()>0)SetQuality(QualitySettings.GetQualityLevel()-1);else if(fps>58&&QualitySettings.GetQualityLevel()<QualitySettings.names.Length-1)SetQuality(QualitySettings.GetQualityLevel()+1);}
        void SetQuality(int level){if(level==lastQuality)return;lastQuality=level;QualitySettings.SetQualityLevel(level,true);}
        public void SetTargetFps(int fps){targetFps=Mathf.Clamp(fps,30,240);Application.targetFrameRate=targetFps;}
        public void ConfigureShadows(bool enabled){QualitySettings.shadows=enabled?ShadowQuality.All:ShadowQuality.Disable;}
    }
}