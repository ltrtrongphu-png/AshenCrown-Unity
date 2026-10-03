using System.Collections.Generic;
using UnityEngine;
using AshenCrown.Boss;

namespace AshenCrown.RPG
{
    [System.Serializable]
    public sealed class RPGBossDefinition
    {
        public string id;
        public string title;
        public float scale = 2f;
        public float health = 900f;
        public float defense = 45f;
        public float poise = 120f;
        public Color color = Color.white;
        public int phaseCount = 3;
    }

    public static class RPGBossRoster
    {
        public static readonly RPGBossDefinition[] All =
        {
            new RPGBossDefinition{id="warden-of-ashes",title="Warden of Ashes",scale=2.2f,health=1200f,defense=50f,poise=140f,color=new Color(.9f,.28f,.12f),phaseCount=3},
            new RPGBossDefinition{id="veil-colossus",title="Veil Colossus",scale=2.8f,health=1800f,defense=65f,poise=180f,color=new Color(.25f,.35f,1f),phaseCount=3},
            new RPGBossDefinition{id="starless-regent",title="Starless Regent",scale=2.4f,health=2400f,defense=75f,poise=210f,color=new Color(.55f,.2f,1f),phaseCount=4},
            new RPGBossDefinition{id="last-ember",title="The Last Ember",scale=3.1f,health=3200f,defense=90f,poise=250f,color=new Color(1f,.55f,.08f),phaseCount=4}
        };

        public static RPGBossDefinition Find(string id)
        {
            foreach(var b in All) if(b.id==id) return b;
            return null;
        }
    }
}
