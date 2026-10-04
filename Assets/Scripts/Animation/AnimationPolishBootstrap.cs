using UnityEngine;

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
            var go = new GameObject("AshenCrown Animation Polish");
            instance = go.AddComponent<AnimationPolishBootstrap>();
            DontDestroyOnLoad(go);
        }

        void Update()
        {
            scanTimer -= Time.unscaledDeltaTime;
            if (scanTimer > 0f) return;
            scanTimer = 1f;
            Scan();
        }

        void Scan()
        {
            Animator[] animators = FindObjectsOfType<Animator>();
            for (int i = 0; i < animators.Length; i++)
            {
                Animator animator = animators[i];
                if (animator == null) continue;
                Transform root = animator.transform.root;
                var presentation = root.GetComponent<AnimationPresentationController>();
                var sampler = root.GetComponent<AnimationTransformSampler>();
                if (presentation != null && sampler != null) continue;

                if (presentation == null) presentation = root.gameObject.AddComponent<AnimationPresentationController>();
                if (sampler == null) sampler = root.gameObject.AddComponent<AnimationTransformSampler>();
                sampler.Initialize(presentation);
            }
        }
    }

    [DisallowMultipleComponent]
    sealed class AnimationTransformSampler : MonoBehaviour
    {
        AnimationPresentationController presentation;
        Vector3 previousPosition;
        bool initialized;

        public void Initialize(AnimationPresentationController value)
        {
            presentation = value;
            previousPosition = transform.position;
            initialized = true;
        }

        void Update()
        {
            if (!initialized || presentation == null) return;
            float dt = Mathf.Max(Time.deltaTime, 0.0001f);
            Vector3 velocity = (transform.position - previousPosition) / dt;
            previousPosition = transform.position;
            Vector3 local = transform.InverseTransformDirection(velocity);
            float normalized = Mathf.Clamp01(new Vector2(local.x, local.z).magnitude / 7.2f);
            presentation.SetLocomotion(local / 7.2f, normalized);
        }
    }
}
