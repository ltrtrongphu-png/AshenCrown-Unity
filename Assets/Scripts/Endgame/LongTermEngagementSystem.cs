using System;
using System.Collections.Generic;
using UnityEngine;
using AshenCrown.Progression;

namespace AshenCrown.Endgame
{
    public enum EngagementAction { EnemyDefeated, BossDefeated, QuestCompleted, ExpeditionCompleted, CraftCompleted, ExplorationFound, PerfectDodge, Parry, DialogueCompleted }

    [Serializable] public sealed class EngagementCounter { public string id; public int value; }
    [Serializable] public sealed class RotatingContract { public string id; public string titleKey; public EngagementAction action; public int required; public int progress; public int rewardExperience; public int rewardEssence; public bool claimed; public bool Complete => progress >= required; }
    [Serializable] public sealed class MasteryEntry { public string id; public int experience; }
    [Serializable] public sealed class JourneyReward { public int pointsRequired; public int experienceReward; public int essenceReward; public int legacyReward; public bool claimed; }
    [Serializable] public sealed class ExpeditionState { public bool active; public int tier=1; public int modifierSeed; public int roomsCleared; public int roomsRequired=5; public string modifierKey="ashen_tide"; }
    [Serializable] public sealed class LongTermEngagementData { public int schemaVersion=1; public int legacyLevel=1; public int legacyExperience; public int journeySeason; public int journeyPoints; public List<JourneyReward> journeyRewards=new List<JourneyReward>(); public List<RotatingContract> contracts=new List<RotatingContract>(); public List<MasteryEntry> mastery=new List<MasteryEntry>(); public List<string> achievements=new List<string>(); public List<string> collection=new List<string>(); public List<EngagementCounter> counters=new List<EngagementCounter>(); public ExpeditionState expedition=new ExpeditionState(); }

    public sealed class LongTermEngagementSystem : MonoBehaviour
    {
        public static LongTermEngagementSystem Instance { get; private set; }
        public event Action<RotatingContract> ContractChanged;
        public event Action<int> JourneyChanged;
        public event Action<string,int> MasteryChanged;
        public event Action<string> AchievementUnlocked;
        public event Action<string> CollectionChanged;
        public event Action<int> LegacyChanged;
        public event Action<ExpeditionState> ExpeditionChanged;

        readonly Dictionary<string,int> counters=new Dictionary<string,int>();
        readonly Dictionary<string,int> mastery=new Dictionary<string,int>();
        readonly HashSet<string> achievements=new HashSet<string>();
        readonly HashSet<string> collection=new HashSet<string>();
        readonly List<RotatingContract> contracts=new List<RotatingContract>();
        readonly List<JourneyReward> journeyRewards=new List<JourneyReward>();
        static readonly string[] Modifiers={"ashen_tide","fragile_embers","blood_moon","hollow_winds","crown_pressure"};

        public int LegacyLevel { get; private set; }=1;
        public int LegacyExperience { get; private set; }
        public int JourneySeason { get; private set; }
        public int JourneyPoints { get; private set; }
        public ExpeditionState Expedition { get; private set; }=new ExpeditionState();
        public IReadOnlyList<RotatingContract> Contracts=>contracts;
        public int LegacyExperienceToNext=>500+(LegacyLevel-1)*250;

        void Awake(){if(Instance!=null&&Instance!=this){Destroy(gameObject);return;}Instance=this;DontDestroyOnLoad(gameObject);}
        void Start(){RefreshRotations();EnsureJourneyRewards();}
        void Update(){if(Input.GetKeyDown(KeyCode.F10))RefreshRotations();}

        public int GetCounter(EngagementAction action)=>GetCounter(action.ToString());
        public int GetCounter(string id)=>counters.TryGetValue(id,out var v)?v:0;
        public int GetMastery(string id)=>mastery.TryGetValue(id,out var v)?v:0;
        public int GetMasteryRank(string id)=>Mathf.Clamp(GetMastery(id)/250,0,20);
        public bool HasAchievement(string id)=>achievements.Contains(id);
        public bool HasCollection(string id)=>collection.Contains(id);

        public void RecordAction(EngagementAction action,int amount=1)
        {
            if(amount<=0)return;
            counters[action.ToString()]=GetCounter(action)+amount;
            foreach(var c in contracts)if(!c.claimed&&c.action==action){c.progress=Mathf.Min(c.required,c.progress+amount);ContractChanged?.Invoke(c);}
            EvaluateAchievements();
        }

        public bool ClaimContract(string id)
        {
            var c=contracts.Find(x=>x.id==id);
            if(c==null||!c.Complete||c.claimed)return false;
            c.claimed=true;
            if(LongTermProgressionSystem.Instance!=null){LongTermProgressionSystem.Instance.AddExperience(c.rewardExperience);LongTermProgressionSystem.Instance.AddEssence(c.rewardEssence);}
            AddJourneyPoints(25); return true;
        }

        public void AddMastery(string id,int xp)
        {
            if(string.IsNullOrWhiteSpace(id)||xp<=0)return;
            mastery[id]=GetMastery(id)+xp; MasteryChanged?.Invoke(id,GetMasteryRank(id));
            if(GetMasteryRank(id)>=5)UnlockAchievement("mastery_"+id);
        }

        public void AddCollection(string id){if(string.IsNullOrWhiteSpace(id)||!collection.Add(id))return;CollectionChanged?.Invoke(id);AddJourneyPoints(10);EvaluateAchievements();}
        public void AddJourneyPoints(int amount){if(amount<=0)return;JourneyPoints+=amount;EnsureJourneyRewards();JourneyChanged?.Invoke(JourneyPoints);}

        public bool ClaimJourneyReward(int pointsRequired)
        {
            EnsureJourneyRewards();var r=journeyRewards.Find(x=>x.pointsRequired==pointsRequired);
            if(r==null||r.claimed||JourneyPoints<r.pointsRequired)return false;r.claimed=true;
            if(LongTermProgressionSystem.Instance!=null){LongTermProgressionSystem.Instance.AddExperience(r.experienceReward);LongTermProgressionSystem.Instance.AddEssence(r.essenceReward);}
            AddLegacyExperience(r.legacyReward);return true;
        }

        public void StartExpedition(int tier)
        {
            tier=Mathf.Clamp(tier,1,20);var seed=DateTime.UtcNow.DayOfYear+DateTime.UtcNow.Year*1000;
            Expedition=new ExpeditionState{active=true,tier=tier,modifierSeed=seed+tier*97,roomsCleared=0,roomsRequired=4+Mathf.Min(8,tier/2),modifierKey=Modifiers[Mathf.Abs(seed+tier)%Modifiers.Length]};
            ExpeditionChanged?.Invoke(Expedition);
        }

        public bool AdvanceExpedition(int rooms=1)
        {
            if(!Expedition.active||rooms<=0)return false;
            Expedition.roomsCleared=Mathf.Min(Expedition.roomsRequired,Expedition.roomsCleared+rooms);ExpeditionChanged?.Invoke(Expedition);
            if(Expedition.roomsCleared<Expedition.roomsRequired)return false;
            var tier=Expedition.tier;Expedition.active=false;
            if(LongTermProgressionSystem.Instance!=null){LongTermProgressionSystem.Instance.AddExperience(180+tier*90);LongTermProgressionSystem.Instance.AddEssence(1+tier/5);if(tier>=5)LongTermProgressionSystem.Instance.AddPrestige(1);}
            AddMastery("expedition",100+tier*20);RecordAction(EngagementAction.ExpeditionCompleted);AddJourneyPoints(50+tier*5);ExpeditionChanged?.Invoke(Expedition);return true;
        }

        public void AbandonExpedition(){Expedition.active=false;ExpeditionChanged?.Invoke(Expedition);}
        public void AddLegacyExperience(int amount){if(amount<=0)return;LegacyExperience+=amount;while(LegacyExperience>=LegacyExperienceToNext){LegacyExperience-=LegacyExperienceToNext;LegacyLevel++;LegacyChanged?.Invoke(LegacyLevel);}}
        public void UnlockAchievement(string id){if(string.IsNullOrWhiteSpace(id)||!achievements.Add(id))return;AchievementUnlocked?.Invoke(id);AddLegacyExperience(100);}

        public void RefreshRotations()
        {
            var week=(DateTime.UtcNow.DayOfYear+DateTime.UtcNow.Year*1000)/7;
            if(contracts.Count>0&&contracts[0].id.StartsWith("w"+week+"_"))return;
            contracts.Clear();
            AddContract("w"+week+"_hunt","contract.hunt",EngagementAction.EnemyDefeated,30,350,2);
            AddContract("w"+week+"_story","contract.story",EngagementAction.QuestCompleted,3,450,3);
            AddContract("w"+week+"_explore","contract.explore",EngagementAction.ExplorationFound,8,300,2);
        }

        void AddContract(string id,string key,EngagementAction action,int required,int xp,int essence){contracts.Add(new RotatingContract{id=id,titleKey=key,action=action,required=required,rewardExperience=xp,rewardEssence=essence});}
        void EnsureJourneyRewards(){if(JourneySeason==0)JourneySeason=DateTime.UtcNow.Year*4+((DateTime.UtcNow.Month-1)/3);if(journeyRewards.Count>0)return;for(var i=1;i<=10;i++)journeyRewards.Add(new JourneyReward{pointsRequired=i*250,experienceReward=250+i*75,essenceReward=1+i/4,legacyReward=25+i*5});}

        void EvaluateAchievements()
        {
            if(GetCounter(EngagementAction.EnemyDefeated)>=100)UnlockAchievement("hunter_100");
            if(GetCounter(EngagementAction.BossDefeated)>=5)UnlockAchievement("bossbreaker_5");
            if(GetCounter(EngagementAction.PerfectDodge)>=50)UnlockAchievement("evasion_master");
            if(GetCounter(EngagementAction.Parry)>=50)UnlockAchievement("parry_master");
            if(collection.Count>=25)UnlockAchievement("collector_25");
            if(LongTermProgressionSystem.Instance!=null&&LongTermProgressionSystem.Instance.Level>=20)UnlockAchievement("level_20");
        }

        public LongTermEngagementData Capture()
        {
            var d=new LongTermEngagementData{legacyLevel=LegacyLevel,legacyExperience=LegacyExperience,journeySeason=JourneySeason,journeyPoints=JourneyPoints,journeyRewards=new List<JourneyReward>(journeyRewards),contracts=new List<RotatingContract>(contracts),expedition=Expedition};
            foreach(var p in counters)d.counters.Add(new EngagementCounter{id=p.Key,value=p.Value});
            foreach(var p in mastery)d.mastery.Add(new MasteryEntry{id=p.Key,experience=p.Value});
            foreach(var id in achievements)d.achievements.Add(id);foreach(var id in collection)d.collection.Add(id);return d;
        }

        public void Restore(LongTermEngagementData d)
        {
            if(d==null)return;LegacyLevel=Mathf.Max(1,d.legacyLevel);LegacyExperience=Mathf.Max(0,d.legacyExperience);JourneySeason=d.journeySeason;JourneyPoints=Mathf.Max(0,d.journeyPoints);
            counters.Clear();mastery.Clear();achievements.Clear();collection.Clear();contracts.Clear();
            if(d.counters!=null)foreach(var x in d.counters)if(!string.IsNullOrWhiteSpace(x.id))counters[x.id]=Mathf.Max(0,x.value);
            if(d.mastery!=null)foreach(var x in d.mastery)if(!string.IsNullOrWhiteSpace(x.id))mastery[x.id]=Mathf.Max(0,x.experience);
            if(d.achievements!=null)foreach(var id in d.achievements)if(!string.IsNullOrWhiteSpace(id))achievements.Add(id);
            if(d.collection!=null)foreach(var id in d.collection)if(!string.IsNullOrWhiteSpace(id))collection.Add(id);
            if(d.contracts!=null)contracts.AddRange(d.contracts);Expedition=d.expedition??new ExpeditionState();journeyRewards.Clear();if(d.journeyRewards!=null)journeyRewards.AddRange(d.journeyRewards);EnsureJourneyRewards();RefreshRotations();
        }
    }
}