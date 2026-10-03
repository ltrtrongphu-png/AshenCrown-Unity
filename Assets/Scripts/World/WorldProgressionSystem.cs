using System;
using System.Collections.Generic;
using UnityEngine;

namespace AshenCrown.World
{
    public enum WorldAct { Prologue, AshenMarch, HollowKingdom, VeilSea, Crownlands, StarlessDepths, LastEmber, NewGamePlus }
    [Serializable] public sealed class WorldStateData { public int act; public List<string> flags=new List<string>(); public List<string> unlockedRegions=new List<string>(); public List<string> defeatedBosses=new List<string>(); }

    public sealed class WorldProgressionSystem : MonoBehaviour
    {
        public static WorldProgressionSystem Instance { get; private set; }
        public event Action<WorldAct> ActChanged;
        public event Action<string> FlagChanged, RegionUnlocked, BossDefeated;
        public WorldAct CurrentAct { get; private set; }=WorldAct.Prologue;
        public int StoryCycle { get; private set; }
        readonly HashSet<string> flags=new HashSet<string>(), regions=new HashSet<string>(), bosses=new HashSet<string>();

        void Awake(){if(Instance!=null&&Instance!=this){Destroy(gameObject);return;}Instance=this;DontDestroyOnLoad(gameObject);UnlockRegion("sanctuary");}
        public bool HasFlag(string id)=>!string.IsNullOrWhiteSpace(id)&&flags.Contains(id);
        public void SetFlag(string id,bool value=true){if(string.IsNullOrWhiteSpace(id))return;if(value){if(flags.Add(id))FlagChanged?.Invoke(id);}else flags.Remove(id);}
        public void AdvanceAct(WorldAct act){if((int)act<(int)CurrentAct||CurrentAct==act)return;CurrentAct=act;ActChanged?.Invoke(act);}
        public void UnlockRegion(string id){if(!string.IsNullOrWhiteSpace(id)&&regions.Add(id))RegionUnlocked?.Invoke(id);}
        public bool IsRegionUnlocked(string id)=>regions.Contains(id);
        public void RegisterBossDefeat(string id){if(!string.IsNullOrWhiteSpace(id)&&bosses.Add(id))BossDefeated?.Invoke(id);}
        public bool IsBossDefeated(string id)=>bosses.Contains(id);
        public void BeginNewCycle(){StoryCycle++;AdvanceAct(WorldAct.NewGamePlus);SetFlag("cycle_"+StoryCycle);}
        public WorldStateData Capture()=>new WorldStateData{act=(int)CurrentAct,flags=new List<string>(flags),unlockedRegions=new List<string>(regions),defeatedBosses=new List<string>(bosses)};
        public void Restore(WorldStateData d){if(d==null)return;CurrentAct=(WorldAct)Mathf.Clamp(d.act,0,Enum.GetValues(typeof(WorldAct)).Length-1);flags.Clear();regions.Clear();bosses.Clear();if(d.flags!=null)foreach(var x in d.flags)flags.Add(x);if(d.unlockedRegions!=null)foreach(var x in d.unlockedRegions)regions.Add(x);if(d.defeatedBosses!=null)foreach(var x in d.defeatedBosses)bosses.Add(x);if(regions.Count==0)regions.Add("sanctuary");ActChanged?.Invoke(CurrentAct);}
    }
}