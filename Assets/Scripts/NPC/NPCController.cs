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
        public void Interact(){if(player!=null&&Vector3.Distance(player.position,transform.position)>interactionDistance)return;if(QuestSystem.Instance!=null){var quest=QuestSystem.Instance.GetAvailableQuestForGiver(npcId);if(quest!=null)QuestSystem.Instance.Accept(quest.id);QuestSystem.Instance.Progress(QuestObjectiveType.Talk,npcId);}if(DialogueSystem.Instance!=null)DialogueSystem.Instance.StartConversation(npcId);}
    }
}