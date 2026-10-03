using System;
using UnityEngine;
using AshenCrown.Core;
using AshenCrown.Enemy;
using AshenCrown.Progression;

namespace AshenCrown.RPG
{
    public enum RPGCreatureKind { Wisp, Stalker, Brute, Caster, Guardian, Beast, Aberration, Boss }
    [Serializable]
    public sealed class RPGCreatureDefinition
    {
        public string id;
        public string displayName;
        public RPGCreatureKind kind;
        public EnemyArchetype archetype = EnemyArchetype.Minion;
        public DamageType affinity = DamageType.Physical;
        public float health = 120f;
        public float defense = 10f;
        public float poise = 40f;
        public float damage = 16f;
        public float speed = 3.5f;
        public float scale = 1f;
        public ItemTier rewardTier = ItemTier.Common;
        public Color coreColor = Color.white;
        public bool elite;
        public bool flying;
    }

    public static class RPGCreatureRoster
    {
        public static RPGCreatureDefinition Get(string id)
        {
            switch ((id ?? "").ToLowerInvariant())
            {
                case "ashen-wisp": return D("ashen-wisp","Ashen Wisp",RPGCreatureKind.Wisp,EnemyArchetype.Ranged,DamageType.Fire,80,4,20,13,4.8f,.75f,ItemTier.Uncommon,new Color(1f,.42f,.18f));
                case "veil-stalker": return D("veil-stalker","Veil Stalker",RPGCreatureKind.Stalker,EnemyArchetype.Minion,DamageType.Void,150,12,42,20,4.8f,1f,ItemTier.Uncommon,new Color(.36f,.25f,1f));
                case "hollow-brute": return D("hollow-brute","Hollow Brute",RPGCreatureKind.Brute,EnemyArchetype.Elite,DamageType.Physical,420,38,100,34,2.8f,1.55f,ItemTier.Rare,new Color(.55f,.62f,.72f),true);
                case "ember-caster": return D("ember-caster","Ember Caster",RPGCreatureKind.Caster,EnemyArchetype.Ranged,DamageType.Fire,190,16,45,28,3.1f,1.05f,ItemTier.Rare,new Color(1f,.22f,.08f));
                case "crown-guardian": return D("crown-guardian","Crown Guardian",RPGCreatureKind.Guardian,EnemyArchetype.Elite,DamageType.Void,620,55,130,42,3.2f,1.8f,ItemTier.Epic,new Color(.35f,.75f,1f),true);
                case "star-beast": return D("star-beast","Star Beast",RPGCreatureKind.Beast,EnemyArchetype.Minion,DamageType.Void,300,24,70,31,4.2f,1.35f,ItemTier.Epic,new Color(.65f,.35f,1f));
                case "hollow-aberration": return D("hollow-aberration","Hollow Aberration",RPGCreatureKind.Aberration,EnemyArchetype.Ranged,DamageType.Void,360,28,80,37,3.6f,1.5f,ItemTier.Epic,new Color(.16f,.95f,.8f),true);
                default: return null;
            }
        }

        static RPGCreatureDefinition D(string id,string name,RPGCreatureKind kind,EnemyArchetype archetype,DamageType affinity,float hp,float defense,float poise,float damage,float speed,float scale,ItemTier tier,Color color,bool elite=false)
            => new RPGCreatureDefinition{id=id,displayName=name,kind=kind,archetype=archetype,affinity=affinity,health=hp,defense=defense,poise=poise,damage=damage,speed=speed,scale=scale,rewardTier=tier,coreColor=color,elite=elite};
    }
}
