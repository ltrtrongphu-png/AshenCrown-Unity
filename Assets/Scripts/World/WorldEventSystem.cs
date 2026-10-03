using System;
using UnityEngine;
using AshenCrown.Progression;

namespace AshenCrown.World
{
    public enum WorldEventType{EmberStorm,HollowHunt,LostCaravan,RiftAnomaly}
    [Serializable]public sealed class WorldEventState{public int day;public WorldEventType type;public int completion;public int required=10;}
    public sealed class WorldEventSystem:MonoBehaviour
    {
        public static WorldEventSystem Instance{get;private set;}public event Action<WorldEventState> EventChanged;public WorldEventState Current{get;private set;}
        void Awake(){if(Instance!=null&&Instance!=this){Destroy(gameObject);return;}Instance=this;DontDestroyOnLoad(gameObject);}
        void Start()=>Refresh();
        public void Refresh(){int day=DateTime.UtcNow.DayOfYear+DateTime.UtcNow.Year*1000;if(Current!=null&&Current.day==day)return;Current=new WorldEventState{day=day,type=(WorldEventType)Mathf.Abs(day)%4,completion=0,required=10};EventChanged?.Invoke(Current);}
        public void Progress(int amount=1){if(Current==null||amount<=0)return;Current.completion=Mathf.Min(Current.required,Current.completion+amount);EventChanged?.Invoke(Current);if(Current.completion>=Current.required&&LongTermProgressionSystem.Instance!=null){LongTermProgressionSystem.Instance.AddExperience(300);LongTermProgressionSystem.Instance.AddEssence(2);}}
    }
}