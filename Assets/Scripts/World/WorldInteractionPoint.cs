using UnityEngine;
using AshenCrown.Quests;
using AshenCrown.World;

namespace AshenCrown.World
{
    public sealed class WorldInteractionPoint:MonoBehaviour
    {
        [SerializeField]string pointId="ashen_gate";
        [SerializeField]float activationDistance=4f;
        bool activated;
        Transform player;
        void Start(){var p=GameObject.FindGameObjectWithTag("Player");if(p!=null)player=p.transform;}
        void Update(){if(activated||player==null)return;if(Vector3.Distance(player.position,transform.position)<=activationDistance&&Input.GetKeyDown(KeyCode.E))Activate();}
        void OnMouseDown(){Activate();}
        public void Activate(){if(activated)return;if(player!=null&&Vector3.Distance(player.position,transform.position)>activationDistance)return;activated=true;if(QuestSystem.Instance!=null)QuestSystem.Instance.Progress(QuestObjectiveType.Explore,pointId);if(EternalCampaignDirector.Instance!=null)EternalCampaignDirector.Instance.NotifyExplore(pointId);}
    }
}