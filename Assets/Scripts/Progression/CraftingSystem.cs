using System;
using System.Collections.Generic;
using UnityEngine;

namespace AshenCrown.Progression
{
    [Serializable]public sealed class CraftRecipe{public string id;public string outputId;public int outputAmount=1;public string[] inputIds;public int[] inputAmounts;}
    public sealed class CraftingSystem:MonoBehaviour
    {
        public static CraftingSystem Instance{get;private set;}public event Action<string> Crafted;readonly Dictionary<string,CraftRecipe> recipes=new Dictionary<string,CraftRecipe>();
        void Awake(){if(Instance!=null&&Instance!=this){Destroy(gameObject);return;}Instance=this;DontDestroyOnLoad(gameObject);BuildDefaults();}
        public bool Craft(string id){CraftRecipe r;if(!recipes.TryGetValue(id,out r)||InventorySystem.Instance==null||r.inputIds==null||r.inputAmounts==null||r.inputIds.Length!=r.inputAmounts.Length)return false;for(int i=0;i<r.inputIds.Length;i++)if(!InventorySystem.Instance.Has(r.inputIds[i],r.inputAmounts[i]))return false;for(int i=0;i<r.inputIds.Length;i++)InventorySystem.Instance.Remove(r.inputIds[i],r.inputAmounts[i]);var crafted=InventorySystem.Instance.Add(r.outputId,r.outputAmount);if(crafted)Crafted?.Invoke(id);return crafted;}
        void BuildDefaults(){recipes["ember_core"]=new CraftRecipe{id="ember_core",outputId="ember_core",inputIds=new[]{"ember_shard","void_dust"},inputAmounts=new[]{3,2}};recipes["healing_relic"]=new CraftRecipe{id="healing_relic",outputId="healing_relic",inputIds=new[]{"ember_core","moon_fragment"},inputAmounts=new[]{1,2}};recipes["star_relic"]=new CraftRecipe{id="star_relic",outputId="star_relic",inputIds=new[]{"healing_relic","crown_fragment"},inputAmounts=new[]{1,3}};}
    }
}