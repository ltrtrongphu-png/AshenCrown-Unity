using UnityEngine;
using UnityEngine.SceneManagement;
using AshenCrown.Combat;
using AshenCrown.Player;

namespace AshenCrown.Core
{
    /// <summary>
    /// Reliable player death loop: death screen -> scene reset -> checkpoint restore.
    /// Scene reload also recreates enemies, so their player references are fresh.
    /// </summary>
    public sealed class PlayerRespawnDirector : MonoBehaviour
    {
        public static PlayerRespawnDirector Instance { get; private set; }

        [SerializeField, Min(0.5f)] float respawnDelay = 1.8f;

        Transform boundPlayer;
        HealthAndDamageSystem boundHealth;
        Vector3 checkpointPosition;
        string checkpointScene;
        bool checkpointInitialized;
        bool waitingForRespawn;
        float respawnTimer;

        void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        void OnEnable() => SceneManager.sceneLoaded += OnSceneLoaded;
        void OnDisable()
        {
            SceneManager.sceneLoaded -= OnSceneLoaded;
            Unbind();
        }

        void Start() => BindPlayer();

        void Update()
        {
            if (waitingForRespawn)
            {
                respawnTimer -= Time.unscaledDeltaTime;
                if (respawnTimer <= 0f) ReloadCurrentScene();
                return;
            }

            if (boundPlayer == null || boundHealth == null)
                BindPlayer();
        }

        void BindPlayer()
        {
            var players = FindObjectsOfType<PlayerCombatSystem>(true);
            if (players.Length == 0) return;

            var player = players[0];
            var health = player.GetComponent<HealthAndDamageSystem>();
            if (health == null) return;

            if (boundPlayer == player.transform && boundHealth == health) return;

            Unbind();
            boundPlayer = player.transform;
            boundHealth = health;
            boundHealth.OnDeath += HandleDeath;

            string scene = SceneManager.GetActiveScene().name;
            if (!checkpointInitialized || checkpointScene != scene)
            {
                checkpointScene = scene;
                checkpointPosition = boundPlayer.position;
                checkpointInitialized = true;
            }
        }

        void Unbind()
        {
            if (boundHealth != null) boundHealth.OnDeath -= HandleDeath;
            boundHealth = null;
            boundPlayer = null;
        }

        void HandleDeath()
        {
            if (waitingForRespawn) return;
            waitingForRespawn = true;
            respawnTimer = respawnDelay;
        }

        void ReloadCurrentScene()
        {
            waitingForRespawn = false;
            var scene = SceneManager.GetActiveScene();
            SceneManager.LoadScene(scene.buildIndex >= 0 ? scene.buildIndex : scene.name);
        }

        void OnSceneLoaded(Scene scene, LoadSceneMode mode)
        {
            waitingForRespawn = false;
            respawnTimer = 0f;
            BindPlayer();

            if (boundPlayer != null && checkpointInitialized && checkpointScene == scene.name)
                boundPlayer.position = checkpointPosition;
        }

        public void SetCheckpoint(Transform anchor)
        {
            if (anchor == null || boundPlayer == null) return;
            SetCheckpoint(anchor.position);
        }

        public void SetCheckpoint(Vector3 position)
        {
            checkpointScene = SceneManager.GetActiveScene().name;
            checkpointPosition = position;
            checkpointInitialized = true;
        }

        void OnGUI()
        {
            if (!waitingForRespawn) return;

            float w = Mathf.Min(520f, Screen.width * 0.72f);
            float h = 150f;
            float x = (Screen.width - w) * 0.5f;
            float y = (Screen.height - h) * 0.5f;

            GUI.Box(new Rect(x, y, w, h), string.Empty);
            GUIStyle title = new GUIStyle(GUI.skin.label)
            {
                alignment = TextAnchor.MiddleCenter,
                fontSize = Mathf.Max(24, Screen.height / 28),
                fontStyle = FontStyle.Bold
            };
            GUIStyle body = new GUIStyle(GUI.skin.label)
            {
                alignment = TextAnchor.MiddleCenter,
                fontSize = Mathf.Max(14, Screen.height / 60)
            };

            GUI.Label(new Rect(x, y + 20f, w, 55f), "YOU DIED", title);
            GUI.Label(new Rect(x, y + 82f, w, 35f), "Returning to the last checkpoint...", body);
        }
    }
}
