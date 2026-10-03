using UnityEngine;
using AshenCrown.Dialogue;
using AshenCrown.Quests;

namespace AshenCrown.NPC
{
    public sealed class NPCController:MonoBehaviour
    {
        [SerializeField]string npcId="lyra";[SerializeField]float interactionDistance=5f;Transform player;
        public string NpcId=>npcId;
        void Start(){GameObject p=GameObject.FindGameObjectWithTag("Player");if(p!=null)player=p.transform;}
        void Update(){if(player!=null&&Input.GetKeyDown(KeyCode.E)&&Vector3.Distance(player.position,transform.position)<=interactionDistance)Interact();}
        void OnMouseDown(){Interact();}
        public void Interact(){if(DialogueSystem.Instance==null)return;if(player!=null&&Vector3.Distance(player.position,transform.position)>interactionDistance)return;DialogueSystem.Instance.StartConversation(npcId);if(QuestSystem.Instance!=null)QuestSystem.Instance.Progress(QuestObjectiveType.Talk,npcId);}
    }
}