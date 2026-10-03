using UnityEngine;
using AshenCrown.Quests;

namespace AshenCrown.World
{
    public sealed class EternalCampaignDirector:MonoBehaviour
    {
        public static EternalCampaignDirector Instance{get;private set;}
        void Awake(){if(Instance!=null&&Instance!=this){Destroy(gameObject);return;}Instance=this;DontDestroyOnLoad(gameObject);}
        void Start(){if(WorldProgressionSystem.Instance!=null)WorldProgressionSystem.Instance.BossDefeated+=OnBossDefeated;}
        void OnDestroy(){if(WorldProgressionSystem.Instance!=null)WorldProgressionSystem.Instance.BossDefeated-=OnBossDefeated;}
        void OnBossDefeated(string bossId)
        {
            var world=WorldProgressionSystem.Instance;if(world==null)return;
            switch(bossId)
            {
                case "king_alden": world.AdvanceAct(WorldAct.VeilSea);world.UnlockRegion("veil_sea");break;
                case "veil_mother": world.AdvanceAct(WorldAct.Crownlands);world.UnlockRegion("crownlands");break;
                case "crown_sentinel": world.AdvanceAct(WorldAct.StarlessDepths);world.UnlockRegion("starless_depths");break;
                case "starless_heart": world.AdvanceAct(WorldAct.LastEmber);world.UnlockRegion("last_ember");break;
                case "last_ember": world.BeginNewCycle();break;
            }
        }
        public void NotifyExplore(string pointId){if(QuestSystem.Instance!=null)QuestSystem.Instance.Progress(QuestObjectiveType.Explore,pointId);}
        public void NotifyKill(string enemyId){if(QuestSystem.Instance!=null)QuestSystem.Instance.Progress(QuestObjectiveType.Kill,enemyId);if(WorldEventSystem.Instance!=null)WorldEventSystem.Instance.Progress();}
        public void NotifyCollect(string itemId,int amount=1){if(QuestSystem.Instance!=null)QuestSystem.Instance.Progress(QuestObjectiveType.Collect,itemId,amount);}
    }
}