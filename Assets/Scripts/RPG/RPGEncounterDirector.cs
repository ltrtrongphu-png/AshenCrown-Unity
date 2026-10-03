using System.Collections.Generic;
using UnityEngine;

namespace AshenCrown.RPG
{
    /// <summary>
    /// Lightweight RPG encounter director. Drop it into a scene and assign spawn points;
    /// it creates a varied creature composition and an optional boss encounter.
    /// </summary>
    public sealed class RPGEncounterDirector : MonoBehaviour
    {
        [SerializeField] Transform[] spawnPoints;
        [SerializeField] string[] creatureIds =
        {
            "ashen-wisp","veil-stalker","hollow-brute","ember-caster",
            "crown-guardian","star-beast","hollow-aberration"
        };
        [SerializeField] string bossId = "warden-of-ashes";
        [SerializeField] Transform bossSpawnPoint;
        [SerializeField] bool spawnOnStart = false;
        [SerializeField] int maxCreatures = 8;

        readonly List<GameObject> spawned = new List<GameObject>();

        void Start(){if(spawnOnStart)SpawnEncounter();}

        public void SpawnEncounter()
        {
            ClearEncounter();
            int count=Mathf.Min(maxCreatures,spawnPoints==null?0:spawnPoints.Length);
            for(int i=0;i<count;i++)
            {
                var id=creatureIds[Random.Range(0,creatureIds.Length)];
                var go=RPGCreatureFactory.Spawn(id,spawnPoints[i].position,transform);
                if(go!=null)spawned.Add(go);
            }
            if(bossSpawnPoint!=null)
            {
                var boss=RPGCreatureFactory.SpawnBoss(bossId,bossSpawnPoint.position,transform);
                if(boss!=null)spawned.Add(boss);
            }
        }

        public void ClearEncounter()
        {
            for(int i=0;i<spawned.Count;i++)if(spawned[i]!=null)Destroy(spawned[i]);
            spawned.Clear();
        }
    }
}
