using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.AI;
using UnityEngine.SceneManagement;
using AshenCrown.Boss;
using AshenCrown.Combat;
using AshenCrown.Core;
using AshenCrown.Enemy;
using AshenCrown.Player;
using AshenCrown.Progression;
using AshenCrown.World;

namespace AshenCrown.Editor.Tools
{
    public static class CreateSandboxScene
    {
        const string ScenePath = "Assets/Scenes/Sandbox_Combat.unity";
        const string NavMeshPath = "Assets/Scenes/Sandbox_Combat_NavMesh.asset";

        [MenuItem("Ashen Crown/Create Sandbox Scene")]
        public static void Create()
        {
            Directory.CreateDirectory("Assets/Scenes");
            EnsureLayer("Environment");
            EnsureLayer("Enemy");

            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            RenderSettings.ambientLight = new Color(.34f, .31f, .30f);
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(.13f, .11f, .12f);
            RenderSettings.fogDensity = .004f;

            GameObject floor = GameObject.CreatePrimitive(PrimitiveType.Plane);
            floor.name = "Sandbox Ground";
            floor.transform.localScale = new Vector3(12f, 1f, 12f);
            floor.layer = LayerMask.NameToLayer("Environment");

            GameObject lightObject = new GameObject("Key Light");
            Light keyLight = lightObject.AddComponent<Light>();
            keyLight.type = LightType.Directional;
            keyLight.intensity = 1.15f;
            lightObject.transform.rotation = Quaternion.Euler(48f, -35f, 0f);

            GameObject player = new GameObject("Player");
            player.tag = "Player";
            player.transform.position = new Vector3(0f, 0f, 0f);
            CharacterController controller = player.AddComponent<CharacterController>();
            controller.height = 1.8f;
            controller.radius = .38f;
            controller.center = new Vector3(0f, .9f, 0f);
            player.AddComponent<PlayerStamina>();
            player.AddComponent<HealthAndDamageSystem>();
            PlayerCombatSystem combat = player.AddComponent<PlayerCombatSystem>();
            PlayerMovementAndCamera movement = player.AddComponent<PlayerMovementAndCamera>();
            AddVisualCapsule(player.transform, new Color(.20f, .17f, .16f), .9f);

            GameObject cameraObject = new GameObject("Main Camera");
            cameraObject.tag = "MainCamera";
            cameraObject.transform.SetParent(player.transform, false);
            cameraObject.transform.localPosition = new Vector3(0f, 2.4f, -5.5f);
            Camera camera = cameraObject.AddComponent<Camera>();
            camera.nearClipPlane = .08f;
            camera.fieldOfView = 62f;
            ThirdPersonCameraRig cameraRig = cameraObject.AddComponent<ThirdPersonCameraRig>();
            cameraRig.followTarget = player.transform;
            movement.cameraTransform = cameraObject.transform;

            SetLayerMask(movement, "lockOnMask", 1 << LayerMask.NameToLayer("Enemy"));
            SetLayerMask(movement, "obstructionMask", 1 << LayerMask.NameToLayer("Environment"));
            SetLayerMask(combat, "enemyMask", 1 << LayerMask.NameToLayer("Enemy"));
            SetReference(combat, "cameraRig", cameraRig);
            SetLayerMask(cameraRig, "collisionMask", 1 << LayerMask.NameToLayer("Environment"));

            CreateEnemy("Minion", new Vector3(-5f, 0f, 6f), "Minion");
            CreateEnemy("Ranged", new Vector3(5f, 0f, 7f), "Ranged");
            CreateEnemy("Elite", new Vector3(-7f, 0f, 10f), "Elite");
            CreateBoss(new Vector3(0f, 0f, 16f));

            var navSource = new NavMeshBuildSource
            {
                shape = NavMeshBuildSourceShape.Mesh,
                sourceObject = floor.GetComponent<MeshFilter>().sharedMesh,
                transform = floor.transform.localToWorldMatrix,
                area = 0
            };
            var settings = NavMesh.GetSettingsByID(0);
            var bounds = new Bounds(new Vector3(0f, 1f, 0f), new Vector3(120f, 8f, 120f));
            NavMeshData navData = NavMeshBuilder.BuildNavMeshData(
                settings,
                new List<NavMeshBuildSource> { navSource },
                bounds,
                Vector3.zero,
                Quaternion.identity);

            AssetDatabase.DeleteAsset(NavMeshPath);
            AssetDatabase.CreateAsset(navData, NavMeshPath);
            GameObject navObject = new GameObject("Sandbox Navigation");
            SandboxNavMeshRuntime navRuntime = navObject.AddComponent<SandboxNavMeshRuntime>();
            SetReference(navRuntime, "Data", navData);

            EditorSceneManager.MarkSceneDirty(scene);
            EditorSceneManager.SaveScene(scene, ScenePath);
            EditorBuildSettings.scenes = new[]
            {
                new EditorBuildSettingsScene(ScenePath, true)
            };
            AssetDatabase.SaveAssets();
            Selection.activeGameObject = player;
            Debug.Log("Created Sandbox_Combat.unity. Open the scene and verify navigation/AI in Play Mode.");
        }

        static void CreateEnemy(string name, Vector3 position, string archetype)
        {
            GameObject root = new GameObject(name);
            root.layer = LayerMask.NameToLayer("Enemy");
            root.transform.position = position;
            NavMeshAgent agent = root.AddComponent<NavMeshAgent>();
            agent.speed = archetype == "Ranged" ? 3f : archetype == "Elite" ? 2.6f : 3.5f;
            agent.radius = archetype == "Elite" ? .65f : .42f;
            agent.height = 2f;
            root.AddComponent<HealthAndDamageSystem>();
            EnemyFSM enemy = root.AddComponent<EnemyFSM>();
            SerializedObject serialized = new SerializedObject(enemy);
            SerializedProperty archetypeProperty = serialized.FindProperty("archetype");
            if (archetypeProperty != null)
            {
                string[] names = archetypeProperty.enumNames;
                for (int i = 0; i < names.Length; i++)
                    if (names[i] == archetype) archetypeProperty.enumValueIndex = i;
            }
            serialized.ApplyModifiedPropertiesWithoutUndo();
            AddVisualCapsule(root.transform, archetype == "Elite"
                ? new Color(.32f, .19f, .16f)
                : archetype == "Ranged" ? new Color(.24f, .25f, .31f) : new Color(.28f, .22f, .31f), 1f, true);
            SetLayerRecursively(root, LayerMask.NameToLayer("Enemy"));
        }

        static void CreateBoss(Vector3 position)
        {
            GameObject root = new GameObject("Ashen Regent");
            root.layer = LayerMask.NameToLayer("Enemy");
            root.transform.position = position;
            NavMeshAgent agent = root.AddComponent<NavMeshAgent>();
            agent.speed = 2.7f;
            agent.radius = .8f;
            agent.height = 2.6f;
            root.AddComponent<HealthAndDamageSystem>();
            BossController boss = root.AddComponent<BossController>();
            ConfigureSandboxBoss(boss);
            AddVisualCapsule(root.transform, new Color(.25f, .12f, .11f), 1.3f, true);
            SetLayerRecursively(root, LayerMask.NameToLayer("Enemy"));
        }

        static void ConfigureSandboxBoss(BossController boss)
        {
            var serialized = new SerializedObject(boss);
            SerializedProperty phases = serialized.FindProperty("phases");
            if (phases == null) return;
            phases.arraySize = 1;
            SerializedProperty phase = phases.GetArrayElementAtIndex(0);
            phase.FindPropertyRelative("name").stringValue = "Sandbox Phase";
            phase.FindPropertyRelative("enterAtHealthPercent").floatValue = 1f;
            phase.FindPropertyRelative("moveSpeed").floatValue = 2.7f;
            phase.FindPropertyRelative("speedMultiplier").floatValue = 1f;
            phase.FindPropertyRelative("aoeMultiplier").floatValue = 1f;
            phase.FindPropertyRelative("transitionDuration").floatValue = .8f;
            SerializedProperty attacks = phase.FindPropertyRelative("attacks");
            if (attacks != null)
            {
                attacks.arraySize = 1;
                SerializedProperty attack = attacks.GetArrayElementAtIndex(0);
                attack.FindPropertyRelative("name").stringValue = "Regent Slash";
                attack.FindPropertyRelative("maxRange").floatValue = 3.5f;
                attack.FindPropertyRelative("damage").floatValue = 24f;
                attack.FindPropertyRelative("windup").floatValue = .75f;
                attack.FindPropertyRelative("active").floatValue = .2f;
                attack.FindPropertyRelative("recover").floatValue = 1.1f;
                attack.FindPropertyRelative("cooldown").floatValue = 2.6f;
            }
            serialized.ApplyModifiedPropertiesWithoutUndo();
        }

        static void AddVisualCapsule(Transform parent, Color color, float scale, bool keepCollider = false)
        {
            GameObject visual = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            visual.name = "Visual Capsule";
            visual.transform.SetParent(parent, false);
            visual.transform.localPosition = new Vector3(0f, scale, 0f);
            visual.transform.localScale = new Vector3(scale * .8f, scale, scale * .8f);
            Collider collider = visual.GetComponent<Collider>();
            if (!keepCollider && collider != null) Object.DestroyImmediate(collider);
            var renderer = visual.GetComponent<Renderer>();
            var material = new Material(Shader.Find("Standard"));
            material.color = color;
            renderer.sharedMaterial = material;
        }

        static void SetLayerMask(Object target, string propertyName, int value)
        {
            var serialized = new SerializedObject(target);
            SerializedProperty property = serialized.FindProperty(propertyName);
            if (property == null) return;
            property.intValue = value;
            serialized.ApplyModifiedPropertiesWithoutUndo();
        }

        static void SetReference(Object target, string propertyName, Object value)
        {
            var serialized = new SerializedObject(target);
            SerializedProperty property = serialized.FindProperty(propertyName);
            if (property == null) return;
            property.objectReferenceValue = value;
            serialized.ApplyModifiedPropertiesWithoutUndo();
        }

        static void SetLayerRecursively(GameObject target, int layer)
        {
            target.layer = layer;
            foreach (Transform child in target.transform)
                SetLayerRecursively(child.gameObject, layer);
        }

        static void EnsureLayer(string layerName)
        {
            if (LayerMask.NameToLayer(layerName) >= 0) return;
            var tagManager = new SerializedObject(AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/TagManager.asset")[0]);
            SerializedProperty layers = tagManager.FindProperty("layers");
            for (int i = 8; i < layers.arraySize; i++)
            {
                SerializedProperty layer = layers.GetArrayElementAtIndex(i);
                if (!string.IsNullOrEmpty(layer.stringValue)) continue;
                layer.stringValue = layerName;
                tagManager.ApplyModifiedProperties();
                return;
            }
            throw new System.InvalidOperationException("No available user layer for " + layerName);
        }
    }
}
