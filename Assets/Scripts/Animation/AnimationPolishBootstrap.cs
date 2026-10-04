using UnityEngine;
using AshenCrown.Combat;
using AshenCrown.Player;
using AshenCrown.UI;

namespace AshenCrown.Animation
{
    public sealed class AnimationPolishBootstrap : MonoBehaviour
    {
        static AnimationPolishBootstrap instance;
        float scanTimer;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Install()
        {
            if (instance != null) return;
            var go = new GameObject("AshenCrown Presentation Bootstrap");
            instance = go.AddComponent<AnimationPolishBootstrap>();
            DontDestroyOnLoad(go);
        }

        void Update()
        {
            scanTimer -= Time.unscaledDeltaTime;
            if (scanTimer > 0f) return;
            scanTimer = 1.25f;
            Scan();
        }

        void Scan()
        {
            if (FindObjectOfType<CinematicHUDDirector>() == null)
            {
                var hud = new GameObject("Ashen Crown Cinematic HUD");
                hud.AddComponent<CinematicHUDDirector>();
            }

            Animator[] animators = FindObjectsOfType<Animator>();
            for (int i = 0; i < animators.Length; i++)
            {
                Animator animator = animators[i];
                if (animator == null) continue;

                Transform root = animator.transform.root;
                var presentation = root.GetComponent<AnimationPresentationController>();
                if (presentation == null) presentation = root.gameObject.AddComponent<AnimationPresentationController>();

                var sampler = root.GetComponent<AnimationTransformSampler>();
                if (sampler == null) sampler = root.gameObject.AddComponent<AnimationTransformSampler>();
                sampler.Initialize(presentation);

                if (root.GetComponent<PlayerCombatSystem>() != null &&
                    root.GetComponent<CombatPresentationFeedback>() == null)
                    root.gameObject.AddComponent<CombatPresentationFeedback>();
            }
        }
    }

    [DisallowMultipleComponent]
    sealed class AnimationTransformSampler : MonoBehaviour
    {
        AnimationPresentationController presentation;
        PlayerMovementAndCamera movement;
        PlayerCombatSystem combat;
        CharacterController controller;
        Vector3 previousPosition;
        bool initialized;

        public void Initialize(AnimationPresentationController value)
        {
            if (initialized && presentation == value) return;
            presentation = value;
            movement = GetComponent<PlayerMovementAndCamera>();
            combat = GetComponent<PlayerCombatSystem>();
            controller = GetComponent<CharacterController>();
            previousPosition = transform.position;
            initialized = true;
        }

        void Update()
        {
            if (!initialized || presentation == null) return;

            float dt = Mathf.Max(Time.deltaTime, 0.0001f);
            Vector3 velocity = movement != null ? movement.Velocity : (transform.position - previousPosition) / dt;
            previousPosition = transform.position;

            float maxSpeed = movement != null ? Mathf.Max(1f, movement.MaxPlanarSpeed) : 7.2f;
            Vector3 local = transform.InverseTransformDirection(velocity) / maxSpeed;
            float normalized = Mathf.Clamp01(new Vector2(local.x, local.z).magnitude);

            presentation.SetLocomotion(local, normalized,
                movement != null && movement.IsSprinting,
                movement != null && movement.IsLockedOn);

            bool grounded = controller == null || controller.isGrounded;
            presentation.SetCombatState(combat != null && combat.IsCombatPresentationActive, grounded);

            if (combat != null && combat.IsAttacking)
                presentation.SetPlaybackSpeed(combat.AttackAnimationSpeed);
            else if (combat == null || !combat.IsCharging)
                presentation.SetPlaybackSpeed(1f);
        }
    }
}