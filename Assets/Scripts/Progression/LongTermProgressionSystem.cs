using System;
using UnityEngine;

namespace AshenCrown.Progression
{
    [Serializable] public sealed class LongTermProgressionData{public int level=1;public int experience;public int prestige;public int essence;public int relicSlots=2;public int newGamePlusCycles;}
    public sealed class LongTermProgressionSystem:MonoBehaviour
    {
        public static LongTermProgressionSystem Instance{get;private set;}
        public event Action<int> LevelChanged,PrestigeChanged;
        public int Level{get;private set;}=1;public int Experience{get;private set;}public int Prestige{get;private set;}public int Essence{get;private set;}public int RelicSlots{get;private set;}=2;public int NewGamePlusCycles{get;private set;}
        void Awake(){if(Instance!=null&&Instance!=this){Destroy(gameObject);return;}Instance=this;DontDestroyOnLoad(gameObject);}
        public int ExperienceToNext=>100+(Level-1)*75;public float LevelProgress=>Mathf.Clamp01(Experience/(float)ExperienceToNext);
        public void AddExperience(int amount){if(amount<=0)return;Experience+=amount;while(Experience>=ExperienceToNext){Experience-=ExperienceToNext;Level++;Essence++;if(Level%5==0)RelicSlots++;LevelChanged?.Invoke(Level);}}
        public void AddEssence(int amount){if(amount<=0)return;Essence+=amount;}
        public bool SpendEssence(int amount){if(amount<=0||Essence<amount)return false;Essence-=amount;return true;}
        public void AddPrestige(int amount){if(amount<=0)return;Prestige+=amount;PrestigeChanged?.Invoke(Prestige);}
        public void BeginNewGamePlus(){NewGamePlusCycles++;Prestige++;Essence+=10+NewGamePlusCycles*2;RelicSlots=Mathf.Max(RelicSlots,2+NewGamePlusCycles);}
        public LongTermProgressionData Capture()=>new LongTermProgressionData{level=Level,experience=Experience,prestige=Prestige,essence=Essence,relicSlots=RelicSlots,newGamePlusCycles=NewGamePlusCycles};
        public void Restore(LongTermProgressionData d){if(d==null)return;Level=Mathf.Max(1,d.level);Experience=Mathf.Max(0,d.experience);Prestige=Mathf.Max(0,d.prestige);Essence=Mathf.Max(0,d.essence);RelicSlots=Mathf.Max(1,d.relicSlots);NewGamePlusCycles=Mathf.Max(0,d.newGamePlusCycles);LevelChanged?.Invoke(Level);}
    }
}