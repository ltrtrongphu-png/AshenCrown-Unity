using System;using System.Collections.Generic;using UnityEngine;
namespace AshenCrown.Progression
{
    [Serializable] public sealed class LootState{public List<ItemDefinition> items=new List<ItemDefinition>();}
    public sealed class LootSystem:MonoBehaviour
    {
        public static LootSystem Instance{get;private set;}public event Action<ItemDefinition> LootAdded;readonly List<ItemDefinition> items=new List<ItemDefinition>();
        public IReadOnlyList<ItemDefinition> Items=>items;
        void Awake(){if(Instance!=null&&Instance!=this){Destroy(gameObject);return;}Instance=this;DontDestroyOnLoad(gameObject);}
        public void AddLoot(ItemDefinition item){if(item==null)return;if(!items.Contains(item)){items.Add(item);LootAdded?.Invoke(item);}}
        public bool Remove(ItemDefinition item)=>item!=null&&items.Remove(item);
        public ItemDefinition Roll(string sourceId,int playerLevel,int luck=0){if(EquipmentSystem.Instance==null)return null;var item=EquipmentSystem.Instance.GenerateDrop(sourceId,playerLevel,luck);if(item==null)return null;AddLoot(item);return item;}
        public bool Equip(ItemDefinition item)
        {
            if (item == null || EquipmentSystem.Instance == null) return false;
            if (!items.Remove(item)) return false;

            if (EquipmentSystem.Instance.Equip(item)) return true;

            AddLoot(item);
            return false;
        }
        public LootState Capture()=>new LootState{items=new List<ItemDefinition>(items)};
        public void Restore(LootState state){items.Clear();if(state?.items!=null)items.AddRange(state.items);}
    }
}