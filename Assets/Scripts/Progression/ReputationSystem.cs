using System;
using System.Collections.Generic;
using UnityEngine;

namespace AshenCrown.Progression
{
    [Serializable]public sealed class ReputationEntry{public string factionId;public int value;}
    public sealed class ReputationSystem:MonoBehaviour
    {
        public static ReputationSystem Instance{get;private set;}readonly Dictionary<string,int> values=new Dictionary<string,int>();public event Action<string,int> ReputationChanged;
        void Awake(){if(Instance!=null&&Instance!=this){Destroy(gameObject);return;}Instance=this;DontDestroyOnLoad(gameObject);}
        public int Get(string faction)=>values.TryGetValue(faction,out var v)?v:0;
        public void Add(string faction,int amount){if(string.IsNullOrWhiteSpace(faction)||amount==0)return;int v=Mathf.Clamp(Get(faction)+amount,-100,100);values[faction]=v;ReputationChanged?.Invoke(faction,v);}
        public List<ReputationEntry> Capture(){var r=new List<ReputationEntry>();foreach(var p in values)r.Add(new ReputationEntry{factionId=p.Key,value=p.Value});return r;}
        public void Restore(List<ReputationEntry> saved){values.Clear();if(saved!=null)foreach(var x in saved)if(!string.IsNullOrWhiteSpace(x.factionId))values[x.factionId]=Mathf.Clamp(x.value,-100,100);}
    }
}