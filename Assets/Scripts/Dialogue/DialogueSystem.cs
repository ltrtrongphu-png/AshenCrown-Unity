using System;
using System.Collections.Generic;
using UnityEngine;
using AshenCrown.Quests;
using AshenCrown.World;
using AshenCrown.Progression;

namespace AshenCrown.Dialogue
{
    [Serializable] public sealed class DialogueChoice{public string textKey;public string nextNodeId;public string setFlag;public string startQuestId;public int reputationDelta;}
    [Serializable] public sealed class DialogueNode{public string id;public string speakerKey;public string textKey;public List<DialogueChoice> choices=new List<DialogueChoice>();}

    public sealed class DialogueSystem:MonoBehaviour
    {
        public static DialogueSystem Instance{get;private set;}
        public event Action<string,string,string> DialogueStarted;public event Action DialogueEnded;
        readonly Dictionary<string,List<DialogueNode>> conversations=new Dictionary<string,List<DialogueNode>>();
        List<DialogueNode> activeNodes;DialogueNode activeNode;string activeNpc;
        public bool IsOpen=>activeNode!=null;public DialogueNode ActiveNode=>activeNode;
        void Awake(){if(Instance!=null&&Instance!=this){Destroy(gameObject);return;}Instance=this;DontDestroyOnLoad(gameObject);BuildDefaultDialogues();}
        void Update(){if(IsOpen&&Input.GetKeyDown(KeyCode.Escape))End();}
        public void StartConversation(string npcId){if(!conversations.TryGetValue(npcId,out activeNodes)||activeNodes.Count==0)return;activeNpc=npcId;activeNode=activeNodes[0];Show();}
        public void Choose(int index){if(activeNode==null||index<0||index>=activeNode.choices.Count)return;var c=activeNode.choices[index];if(!string.IsNullOrWhiteSpace(c.setFlag)&&WorldProgressionSystem.Instance!=null)WorldProgressionSystem.Instance.SetFlag(c.setFlag);if(!string.IsNullOrWhiteSpace(c.startQuestId)&&QuestSystem.Instance!=null)QuestSystem.Instance.Accept(c.startQuestId);if(c.reputationDelta!=0&&ReputationSystem.Instance!=null)ReputationSystem.Instance.Add(activeNpc,c.reputationDelta);if(string.IsNullOrWhiteSpace(c.nextNodeId)){End();return;}foreach(var n in activeNodes)if(n.id==c.nextNodeId){activeNode=n;Show();return;}End();}
        public void End(){activeNpc=null;activeNodes=null;activeNode=null;DialogueEnded?.Invoke();}
        void Show(){DialogueStarted?.Invoke(activeNpc,activeNode.speakerKey,activeNode.textKey);}
        void Add(string npc,params DialogueNode[] nodes)=>conversations[npc]=new List<DialogueNode>(nodes);
        void BuildDefaultDialogues(){
            Add("lyra",new DialogueNode{id="start",speakerKey="npc.lyra.name",textKey="npc.lyra.hello",choices=new List<DialogueChoice>{new DialogueChoice{textKey="npc.choice.help",nextNodeId="ember",startQuestId="ember_awakens"},new DialogueChoice{textKey="npc.choice.goodbye"}}},new DialogueNode{id="ember",speakerKey="npc.lyra.name",textKey="npc.lyra.ember",choices=new List<DialogueChoice>{new DialogueChoice{textKey="npc.choice.accept",setFlag="lyra_trusts_hero",reputationDelta=5},new DialogueChoice{textKey="npc.choice.leave"}}});
            Add("orren",new DialogueNode{id="start",speakerKey="npc.orren.name",textKey="npc.orren.hello",choices=new List<DialogueChoice>{new DialogueChoice{textKey="npc.choice.help",nextNodeId="forge"},new DialogueChoice{textKey="npc.choice.leave"}}},new DialogueNode{id="forge",speakerKey="npc.orren.name",textKey="npc.orren.forge",choices=new List<DialogueChoice>{new DialogueChoice{textKey="npc.choice.accept",startQuestId="echoes_below",reputationDelta=5},new DialogueChoice{textKey="npc.choice.leave"}}});
            Add("seer",new DialogueNode{id="start",speakerKey="npc.seer.name",textKey="npc.seer.hello",choices=new List<DialogueChoice>{new DialogueChoice{textKey="npc.choice.tell_more",nextNodeId="crown"},new DialogueChoice{textKey="npc.choice.leave"}}},new DialogueNode{id="crown",speakerKey="npc.seer.name",textKey="npc.seer.crown",choices=new List<DialogueChoice>{new DialogueChoice{textKey="npc.choice.accept",startQuestId="crownless_king",setFlag="seer_revealed_crown"},new DialogueChoice{textKey="npc.choice.leave"}}});
        }
    }
}