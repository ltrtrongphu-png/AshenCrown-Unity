using UnityEngine;

namespace AshenCrown.Performance
{
    public sealed class PerformanceDirector : MonoBehaviour
    {
        public static PerformanceDirector Instance { get; private set; }

        [Header("Frame pacing")]
        [SerializeField, Range(30, 240)] int targetFps = 60;
        [SerializeField, Min(0.25f)] float sampleInterval = 0.5f;
        [SerializeField, Min(3)] int sampleCount = 8;
        [SerializeField, Min(2f)] float qualityChangeCooldown = 4f;
        [SerializeField, Range(2f, 20f)] float downgradeMargin = 8f;
        [SerializeField, Range(2f, 20f)] float upgradeMargin = 5f;

        [Header("Texture streaming")]
        [SerializeField, Min(64)] float streamingMemoryBudgetMb = 512f;
        [SerializeField] bool enableTextureStreaming = true;

        readonly float[] frameSamples = new float[16];
        int sampleIndex;
        int samplesFilled;
        float sampleTimer;
        float sampleFrameTime;
        int sampleFrameCount;
        float qualityCooldown;
        int lastQuality = -1;

        public int TargetFps => targetFps;

        void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
            Application.targetFrameRate = targetFps;
            QualitySettings.vSyncCount = 0;

            if (enableTextureStreaming)
            {
                QualitySettings.streamingMipmapsActive = true;
                QualitySettings.streamingMipmapsMemoryBudget = streamingMemoryBudgetMb;
            }
        }

        void Update()
        {
            float dt = Time.unscaledDeltaTime;
            sampleTimer += dt;
            sampleFrameTime += dt;
            sampleFrameCount++;
            qualityCooldown = Mathf.Max(0f, qualityCooldown - dt);
            if (sampleTimer < sampleInterval) return;

            float intervalFps = sampleFrameCount > 0
                ? sampleFrameCount / Mathf.Max(0.001f, sampleFrameTime)
                : targetFps;
            sampleTimer = 0f;
            sampleFrameTime = 0f;
            sampleFrameCount = 0;

            if (frameSamples.Length > 0)
            {
                frameSamples[sampleIndex] = intervalFps;
                sampleIndex = (sampleIndex + 1) % Mathf.Min(frameSamples.Length, sampleCount);
                samplesFilled = Mathf.Min(samplesFilled + 1, Mathf.Min(frameSamples.Length, sampleCount));
            }

            if (samplesFilled < Mathf.Min(frameSamples.Length, sampleCount) || qualityCooldown > 0f)
                return;

            float averageFps = 0f;
            for (int i = 0; i < samplesFilled; i++) averageFps += frameSamples[i];
            averageFps /= samplesFilled;

            float downgradeAt = targetFps - downgradeMargin;
            float upgradeAt = targetFps + upgradeMargin;
            int current = QualitySettings.GetQualityLevel();

            if (averageFps < downgradeAt && current > 0)
                SetQuality(current - 1);
            else if (averageFps > upgradeAt && current < QualitySettings.names.Length - 1)
                SetQuality(current + 1);
        }

        void SetQuality(int level)
        {
            if (qualityCooldown > 0f || level == lastQuality) return;

            QualitySettings.SetQualityLevel(level, false);
            lastQuality = level;
            qualityCooldown = qualityChangeCooldown;

            // Re-apply art-specific preferences after Unity quality presets.
            if (enableTextureStreaming)
            {
                QualitySettings.streamingMipmapsActive = true;
                QualitySettings.streamingMipmapsMemoryBudget = streamingMemoryBudgetMb;
            }
        }

        public void SetTargetFps(int fps)
        {
            targetFps = Mathf.Clamp(fps, 30, 240);
            Application.targetFrameRate = targetFps;
        }

        public void ConfigureShadows(bool enabled)
        {
            QualitySettings.shadows = enabled ? ShadowQuality.All : ShadowQuality.Disable;
        }

        public void ConfigureTextureStreaming(bool enabled, float memoryBudgetMb = 512f)
        {
            enableTextureStreaming = enabled;
            streamingMemoryBudgetMb = Mathf.Max(64f, memoryBudgetMb);
            QualitySettings.streamingMipmapsActive = enabled;
            if (enabled) QualitySettings.streamingMipmapsMemoryBudget = streamingMemoryBudgetMb;
        }
    }
}
