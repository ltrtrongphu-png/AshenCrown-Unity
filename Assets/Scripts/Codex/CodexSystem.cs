using System;
using System.Collections.Generic;
using UnityEngine;

namespace AshenCrown.Codex
{
    public sealed class CodexSystem:MonoBehaviour
    {
        public static CodexSystem Instance{get;private set;}readonly HashSet<string> entries=new HashSet<string>();public event Action<string> EntryUnlocked;
        void Awake(){if(Instance!=null&&Instance!=this){Destroy(gameObject);return;}Instance=this;DontDestroyOnLoad(gameObject);}
        public bool Has(string id)=>entries.Contains(id);
        public void Unlock(string id){if(string.IsNullOrWhiteSpace(id)||!entries.Add(id))return;EntryUnlocked?.Invoke(id);}
        public List<string> Capture()=>new List<string>(entries);
        public void Restore(List<string> saved){entries.Clear();if(saved!=null)foreach(var x in saved)if(!string.IsNullOrWhiteSpace(x))entries.Add(x);}
    }
}