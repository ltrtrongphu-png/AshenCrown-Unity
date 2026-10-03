using UnityEngine;
using UnityEngine.AI;
using AshenCrown.Combat;
using AshenCrown.Enemy;
using AshenCrown.Boss;

namespace AshenCrown.RPG
{
    public static class RPGCreatureFactory
    {
        public static GameObject Spawn(string creatureId, Vector3 position, Transform parent = null)
        {
            var d=RPGCreatureRoster.Get(creatureId);
            if(d==null){Debug.LogWarning("[AshenCrown RPG] Unknown creature: "+creatureId);return null;}

            var go=new GameObject(d.displayName);
            go.transform.SetParent(parent,false);
            go.transform.position=position;

            var agent=go.AddComponent<NavMeshAgent>();
            agent.speed=d.speed;
            agent.acceleration=24f;
            agent.angularSpeed=720f;
            agent.stoppingDistance=1.7f;

            var health=go.AddComponent<HealthAndDamageSystem>();
            var visual=go.AddComponent<RPGCreatureVisual>();
            visual.Build(d);

            go.AddComponent<EnemyFSM>();

            var collider=go.AddComponent<CapsuleCollider>();
            collider.height=1.8f*d.scale;
            collider.radius=.38f*d.scale;
            collider.center=Vector3.up*.9f*d.scale;

            return go;
        }

        public static GameObject SpawnBoss(string bossId, Vector3 position, Transform parent = null)
        {
            var d=RPGBossRoster.Find(bossId);
            if(d==null){Debug.LogWarning("[AshenCrown RPG] Unknown boss: "+bossId);return null;}

            var go=new GameObject(d.title);
            go.transform.SetParent(parent,false);
            go.transform.position=position;
            go.transform.localScale=Vector3.one*d.scale;

            var agent=go.AddComponent<NavMeshAgent>();
            agent.speed=5f;
            agent.acceleration=18f;
            agent.angularSpeed=360f;
            agent.stoppingDistance=2.5f;

            go.AddComponent<HealthAndDamageSystem>();
            var boss=go.AddComponent<BossController>();
            boss.bossName=d.title;

            var visual=go.AddComponent<RPGCreatureVisual>();
            go.AddComponent<RPGBossVisualDirector>();
            var visualData=new RPGCreatureDefinition
            {
                id=d.id,displayName=d.title,kind=RPGCreatureKind.Boss,scale=1f,elite=true,coreColor=d.color
            };
            visual.Build(visualData);

            var collider=go.AddComponent<CapsuleCollider>();
            collider.height=2.2f*d.scale;
            collider.radius=.55f*d.scale;
            collider.center=Vector3.up*1.1f*d.scale;
            return go;
        }
    }
}
