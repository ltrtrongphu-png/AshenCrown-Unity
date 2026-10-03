using UnityEngine;

namespace AshenCrown.NPC
{
    public sealed class NPCWorldSpawner:MonoBehaviour
    {
        [SerializeField]GameObject modelPrefab;[SerializeField]Transform sanctuary;[SerializeField]bool spawnIfMissing=true;
        readonly string[] ids={"lyra","orren","seer"};
        void Start(){if(!spawnIfMissing)return;for(int i=0;i<ids.Length;i++){if(GameObject.Find("NPC_"+ids[i])!=null)continue;Spawn(ids[i],new Vector3((i-1)*3.5f,0f,4f));}}
        void Spawn(string id,Vector3 position)
        {
            GameObject root=new GameObject("NPC_"+id);
            root.transform.position=sanctuary!=null?sanctuary.TransformPoint(position):position;
            root.transform.rotation=Quaternion.Euler(0f,180f,0f);
            var collider=root.AddComponent<SphereCollider>();collider.radius=1.25f;
            var npc=root.AddComponent<NPCController>();
            var field=typeof(NPCController).GetField("npcId",System.Reflection.BindingFlags.Instance|System.Reflection.BindingFlags.NonPublic);
            if(field!=null)field.SetValue(npc,id);
            GameObject visual=modelPrefab!=null?Instantiate(modelPrefab,root.transform):GameObject.CreatePrimitive(PrimitiveType.Capsule);
            visual.name=id+"_3D";visual.transform.SetParent(root.transform,false);visual.transform.localScale=new Vector3(.75f,1.2f,.75f);
            var visualCollider=visual.GetComponent<Collider>();if(visualCollider!=null)Destroy(visualCollider);
        }
    }
}