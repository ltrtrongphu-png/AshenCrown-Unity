using System;
using System.Collections.Generic;
using UnityEngine;
namespace AshenCrown.Progression
{
    public enum EquipmentSlot { Helmet, Chest, Gloves, Legs, Boots, Weapon, Offhand, Relic }
    public enum ItemTier { Broken, Common, Uncommon, Rare, Epic, Legendary, Mythic, Ascendant }
    [Serializable] public sealed class ItemDefinition { public string id; public string displayName; public EquipmentSlot slot; public ItemTier tier; public int requiredLevel; public int power; public int armor; public int health; public int damage; public int upgradeLevel; public int maxUpgrade=10; public List<string> affixes=new List<string>(); }
    [Serializable] public sealed class EquipmentState { public List<ItemDefinition> equipped=new List<ItemDefinition>(); }
    public sealed class EquipmentSystem:MonoBehaviour
    {
        public static EquipmentSystem Instance{get;private set;} public event Action EquipmentChanged; public event Action<ItemDefinition> ItemDropped;
        readonly Dictionary<EquipmentSlot,ItemDefinition> equipped=new Dictionary<EquipmentSlot,ItemDefinition>();
        static readonly string[] Prefixes={"Ashen","Hollow","Crown","Starless","Ember","Veiled","Eternal"};
        static readonly string[] Affixes={"Vitality","Might","Haste","Ward","Critical","Resilience","Lifeforce","Ruin"};
        void Awake(){if(Instance!=null&&Instance!=this){Destroy(gameObject);return;}Instance=this;DontDestroyOnLoad(gameObject);}
        public ItemDefinition Get(EquipmentSlot slot)=>equipped.TryGetValue(slot,out var x)?x:null;
        public IReadOnlyDictionary<EquipmentSlot,ItemDefinition> Equipped=>equipped;
        public bool Equip(ItemDefinition item){if(item==null)return false;equipped[item.slot]=item;EquipmentChanged?.Invoke();return true;}
        public ItemDefinition GenerateDrop(string sourceId,int playerLevel,int luck=0)
        {
            var roll=UnityEngine.Random.value;var tier=roll<.40f?ItemTier.Common:roll<.68f?ItemTier.Uncommon:roll<.86f?ItemTier.Rare:roll<.96f?ItemTier.Epic:roll<.992f?ItemTier.Legendary:ItemTier.Mythic;
            if(luck>0&&UnityEngine.Random.Range(0,100)<luck)tier=(ItemTier)Mathf.Min((int)ItemTier.Ascendant,(int)tier+1);
            var slot=(EquipmentSlot)UnityEngine.Random.Range(0,8);var power=Mathf.Max(1,playerLevel*10+UnityEngine.Random.Range(-playerLevel*2,playerLevel*5)+(int)tier*12);
            var item=new ItemDefinition{id=$"{sourceId}_{Guid.NewGuid():N}",displayName=$"{Prefixes[UnityEngine.Random.Range(0,Prefixes.Length)]} {slot}",slot=slot,tier=tier,requiredLevel=Mathf.Max(1,playerLevel-2),power=power,armor=slot==EquipmentSlot.Weapon?0:power/2,damage=slot==EquipmentSlot.Weapon?power:0,health=power/3};
            var count=Mathf.Clamp(1+(int)tier/2,1,5);for(int i=0;i<count;i++)item.affixes.Add(Affixes[UnityEngine.Random.Range(0,Affixes.Length)]);ItemDropped?.Invoke(item);return item;
        }
        public bool Upgrade(ItemDefinition item,int essenceCost)
        {
            if(item==null||item.upgradeLevel>=item.maxUpgrade||LongTermProgressionSystem.Instance==null||LongTermProgressionSystem.Instance.Essence<essenceCost)return false;
            LongTermProgressionSystem.Instance.AddEssence(-essenceCost);item.upgradeLevel++;item.power+=Mathf.Max(1,item.power/12);item.armor+=item.armor>0?Mathf.Max(1,item.armor/14):0;item.damage+=item.damage>0?Mathf.Max(1,item.damage/14):0;EquipmentChanged?.Invoke();return true;
        }
        public EquipmentState Capture(){var s=new EquipmentState();foreach(var p in equipped)s.equipped.Add(p.Value);return s;}
        public void Restore(EquipmentState s){equipped.Clear();if(s?.equipped!=null)foreach(var x in s.equipped)if(x!=null)equipped[x.slot]=x;EquipmentChanged?.Invoke();}
    }
}