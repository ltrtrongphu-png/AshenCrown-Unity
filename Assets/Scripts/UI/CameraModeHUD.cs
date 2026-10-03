using UnityEngine;

namespace AshenCrown.Player
{
    /// <summary>Small diegetic-free HUD for camera controls; replace with Canvas UI later.</summary>
    public sealed class CameraModeHUD:MonoBehaviour
    {
        [SerializeField] ThirdPersonCameraRig cameraRig;
        [SerializeField] bool show=true;
        [SerializeField] float visibleSeconds=3f;
        GUIStyle label;
        float hideAt;

        void Start()
        {
            if(cameraRig==null) cameraRig=FindObjectOfType<ThirdPersonCameraRig>();
            hideAt=Time.unscaledTime+visibleSeconds;
        }

        void Update()
        {
            if(Input.GetKeyDown(KeyCode.Alpha1)||Input.GetKeyDown(KeyCode.Alpha2)||Input.GetKeyDown(KeyCode.Alpha3)||Input.GetKeyDown(KeyCode.V))
                hideAt=Time.unscaledTime+visibleSeconds;
        }

        void OnGUI()
        {
            if(!show||cameraRig==null||Time.unscaledTime>hideAt)return;
            if(label==null)label=new GUIStyle(GUI.skin.label){fontSize=15,fontStyle=FontStyle.Bold};
            string mode=cameraRig.CurrentMode==CameraViewMode.FirstPerson?"FIRST PERSON":
                        cameraRig.CurrentMode==CameraViewMode.Shoulder?"SHOULDER CAM":"THIRD PERSON";
            GUI.Label(new Rect(18,18,360,24),$"{mode}   [1/2/3]  [V] cycle  [C] shoulder",label);
        }
    }
}