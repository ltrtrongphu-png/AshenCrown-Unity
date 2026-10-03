using System;
using System.Collections.Generic;
using UnityEngine;
using AshenCrown.Progression;
using AshenCrown.World;

namespace AshenCrown.Quests
{
    public enum QuestObjectiveType{Talk,Kill,Collect,Explore,Boss}
    public enum QuestStatus{Available,Active,Completed,Failed}
    [Serializable] public sealed class QuestObjective{public string id;public QuestObjectiveType type;public string targetId;public int required=1;public int progress;public string displayKey;public bool Done=>progress>=required;}
    [Serializable] public sealed class QuestDefinition{public string id;public string titleKey;public string descriptionKey;public string giverId;public int rewardXP;public int rewardSkillPoints;public string rewardItemId;public int rewardItemAmount=1;public string unlockRegion;public string[] prerequisites;public List<QuestObjective> objectives=new List<QuestObjective>();}
    [Serializable] public sealed class QuestRuntime{public string id;public QuestStatus status;public List<QuestObjective> objectives=new List<QuestObjective>();}

    public sealed class QuestSystem:MonoBehaviour
    {
        public static QuestSystem Instance{get;private set;}
        public event Action<QuestRuntime> QuestAccepted,QuestUpdated,QuestCompleted;
        readonly Dictionary<string,QuestDefinition> definitions=new Dictionary<string,QuestDefinition>();
        readonly Dictionary<string,QuestRuntime> active=new Dictionary<string,QuestRuntime>();
        readonly HashSet<string> completed=new HashSet<string>();
        public IReadOnlyDictionary<string,QuestRuntime> ActiveQuests=>active;
        void Awake(){if(Instance!=null&&Instance!=this){Destroy(gameObject);return;}Instance=this;DontDestroyOnLoad(gameObject);BuildStoryQuests();}
        void OnEnable(){if(WorldProgressionSystem.Instance!=null)WorldProgressionSystem.Instance.BossDefeated+=OnBossDefeated;}
        void OnDisable(){if(WorldProgressionSystem.Instance!=null)WorldProgressionSystem.Instance.BossDefeated-=OnBossDefeated;}
        public QuestDefinition GetDefinition(string id){QuestDefinition q;return definitions.TryGetValue(id,out q)?q:null;
        public QuestDefinition GetAvailableQuestForGiver(string giverId){foreach(var pair in definitions)if(pair.Value.giverId==giverId&&CanAccept(pair.Key))return pair.Value;return null;}
        public bool IsCompleted(string id)=>completed.Contains(id);
        public bool CanAccept(string id){var q=GetDefinition(id);if(q==null||active.ContainsKey(id)||completed.Contains(id))return false;if(q.prerequisites==null)return true;foreach(var p in q.prerequisites)if(!completed.Contains(p))return false;return true;}
        public bool Accept(string id){if(!CanAccept(id))return false;var q=definitions[id];var r=new QuestRuntime{id=id,status=QuestStatus.Active};foreach(var o in q.objectives)r.objectives.Add(new QuestObjective{id=o.id,type=o.type,targetId=o.targetId,required=o.required,displayKey=o.displayKey});active[id]=r;QuestAccepted?.Invoke(r);return true;}
        public void Progress(QuestObjectiveType type,string targetId,int amount=1){if(amount<=0)return;foreach(var pair in new List<KeyValuePair<string,QuestRuntime>>(active)){var r=pair.Value;bool changed=false;foreach(var o in r.objectives)if(!o.Done&&o.type==type&&o.targetId==targetId){o.progress=Mathf.Min(o.required,o.progress+amount);changed=true;}if(changed){QuestUpdated?.Invoke(r);if(AllDone(r))Complete(r.id);}}}
        public bool Complete(string id){QuestRuntime r;if(!active.TryGetValue(id,out r)||!AllDone(r))return false;var q=definitions[id];active.Remove(id);completed.Add(id);if(q.rewardXP>0&&LongTermProgressionSystem.Instance!=null)LongTermProgressionSystem.Instance.AddExperience(q.rewardXP);if(q.rewardSkillPoints>0&&SkillTreeSystem.Instance!=null)SkillTreeSystem.Instance.AddSkillPoints(q.rewardSkillPoints);if(!string.IsNullOrWhiteSpace(q.rewardItemId)&&InventorySystem.Instance!=null)InventorySystem.Instance.Add(q.rewardItemId,q.rewardItemAmount);if(!string.IsNullOrWhiteSpace(q.unlockRegion)&&WorldProgressionSystem.Instance!=null)WorldProgressionSystem.Instance.UnlockRegion(q.unlockRegion);QuestCompleted?.Invoke(r);return true;}
        bool AllDone(QuestRuntime r){if(r==null||r.objectives.Count==0)return true;foreach(var o in r.objectives)if(!o.Done)return false;return true;}
        void OnBossDefeated(string id)=>Progress(QuestObjectiveType.Boss,id);
        public List<QuestRuntime> CaptureActive()=>new List<QuestRuntime>(active.Values);
        public List<string> CaptureCompleted()=>new List<string>(completed);
        public void Restore(List<QuestRuntime> a,List<string> c){active.Clear();completed.Clear();if(c!=null)foreach(var id in c)if(definitions.ContainsKey(id))completed.Add(id);if(a!=null)foreach(var r in a)if(definitions.ContainsKey(r.id)&&!completed.Contains(r.id))active[r.id]=r;}
        void Add(QuestDefinition q)=>definitions[q.id]=q;
        void BuildStoryQuests(){
            Add(new QuestDefinition{id="ember_awakens",titleKey="quest.ember_awakens.title",descriptionKey="quest.ember_awakens.desc",giverId="lyra",rewardXP=250,rewardSkillPoints=1,objectives=new List<QuestObjective>{new QuestObjective{id="talk",type=QuestObjectiveType.Talk,targetId="lyra",displayKey="quest.objective.talk"},new QuestObjective{id="explore",type=QuestObjectiveType.Explore,targetId="ashen_gate",displayKey="quest.objective.explore"}}});
            Add(new QuestDefinition{id="echoes_below",titleKey="quest.echoes_below.title",descriptionKey="quest.echoes_below.desc",giverId="orren",rewardXP=600,rewardSkillPoints=1,rewardItemId="ember_shard",rewardItemAmount=3,prerequisites=new[]{"ember_awakens"},objectives=new List<QuestObjective>{new QuestObjective{id="kill",type=QuestObjectiveType.Kill,targetId="hollow_guardian",required=8,displayKey="quest.objective.kill"},new QuestObjective{id="collect",type=QuestObjectiveType.Collect,targetId="ember_shard",required=3,displayKey="quest.objective.collect"}}});
            Add(new QuestDefinition{id="crownless_king",titleKey="quest.crownless_king.title",descriptionKey="quest.crownless_king.desc",giverId="seer",rewardXP=1500,rewardSkillPoints=2,unlockRegion="hollow_kingdom",prerequisites=new[]{"echoes_below"},objectives=new List<QuestObjective>{new QuestObjective{id="boss",type=QuestObjectiveType.Boss,targetId="king_alden",displayKey="quest.objective.boss"}}});
        }
    }
}