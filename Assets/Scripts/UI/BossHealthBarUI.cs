using UnityEngine;
using UnityEngine.UI;
using AshenCrown.Boss;

namespace AshenCrown.UI
{
    /// <summary>
    /// Thanh Máu / Giáp (Poise) của Boss cho Module 5.
    /// Dựng trong Canvas: một CanvasGroup chứa
    ///   - Image (Type = Filled, Horizontal) cho healthGhost (nền, màu nhạt - "máu vừa mất")
    ///   - Image (Filled) cho healthFill
    ///   - Image (Filled) cho poiseFill (thanh mảnh bên dưới = giáp)
    ///   - Text tên boss, Text tên phase, và các Image nhỏ làm chấm báo phase (tuỳ chọn).
    /// Thanh chỉ hiện khi boss bắt đầu giao chiến, và ẩn sau khi boss bị hạ.
    /// </summary>
    public class BossHealthBarUI : MonoBehaviour
    {
        [SerializeField] BossController boss;
        [SerializeField] CanvasGroup group;
        [SerializeField] Image healthFill;
        [SerializeField] Image healthGhost;
        [SerializeField] Image poiseFill;
        [SerializeField] Text nameLabel;
        [SerializeField] Text phaseLabel;
        [SerializeField] Image[] phasePips;

        [Header("Hiệu ứng")]
        [SerializeField] Color normalColor = new Color(0.75f, 0.1f, 0.1f);
        [SerializeField] Color enragedColor = new Color(1f, 0.35f, 0.05f);
        [SerializeField] Color pipActive = new Color(0.9f, 0.8f, 0.4f);
        [SerializeField] Color pipInactive = new Color(0.25f, 0.25f, 0.25f);
        [SerializeField] float fadeSpeed = 3f;
        [SerializeField] float ghostDelay = 0.6f;
        [SerializeField] float ghostSpeed = 0.5f;

        bool visible;
        float ghostTimer;
        float healthTarget = 1f;

        void Start()
        {
            if (group != null) group.alpha = 0f;
            if (boss == null) { enabled = false; return; }

            if (nameLabel != null) nameLabel.text = boss.bossName;
            if (healthFill != null) healthFill.color = normalColor;

            boss.OnEngaged += Show;
            boss.OnDefeated += Hide;
            boss.OnPhaseChanged += HandlePhaseChanged;
            boss.OnEnrageStarted += HandleEnrage;
            boss.Health.OnHealthChanged += HandleHealth;
            boss.Health.OnPoiseChanged += HandlePoise;

            // Đồng bộ giá trị ban đầu.
            HandleHealth(boss.Health.CurrentHealth, boss.Health.MaxHealth);
            HandlePoise(boss.Health.CurrentPoise, boss.Health.MaxPoise);
            if (healthGhost != null) healthGhost.fillAmount = healthTarget;
            if (boss.CurrentPhase != null) HandlePhaseChanged(boss.CurrentPhaseIndex, boss.CurrentPhase);
        }

        void OnDestroy()
        {
            if (boss == null) return;
            boss.OnEngaged -= Show;
            boss.OnDefeated -= Hide;
            boss.OnPhaseChanged -= HandlePhaseChanged;
            boss.OnEnrageStarted -= HandleEnrage;
            if (boss.Health != null)
            {
                boss.Health.OnHealthChanged -= HandleHealth;
                boss.Health.OnPoiseChanged -= HandlePoise;
            }
        }

        void Update()
        {
            if (group != null)
                group.alpha = Mathf.MoveTowards(group.alpha, visible ? 1f : 0f, fadeSpeed * Time.unscaledDeltaTime);

            // Thanh "máu vừa mất": đứng yên một nhịp rồi trượt dần xuống theo máu thật.
            if (healthGhost != null && healthGhost.fillAmount > healthTarget)
            {
                if (ghostTimer > 0f) ghostTimer -= Time.deltaTime;
                else healthGhost.fillAmount = Mathf.MoveTowards(healthGhost.fillAmount, healthTarget, ghostSpeed * Time.deltaTime);
            }
        }

        void Show() { visible = true; }
        void Hide() { visible = false; }

        void HandleHealth(float current, float max)
        {
            healthTarget = max <= 0f ? 0f : current / max;
            if (healthFill != null) healthFill.fillAmount = healthTarget;
            ghostTimer = ghostDelay;
            if (healthGhost != null && healthGhost.fillAmount < healthTarget) healthGhost.fillAmount = healthTarget;
        }

        void HandlePoise(float current, float max)
        {
            if (poiseFill != null) poiseFill.fillAmount = max <= 0f ? 0f : current / max;
        }

        void HandlePhaseChanged(int index, BossPhase phase)
        {
            if (phaseLabel != null) phaseLabel.text = phase.name;
            if (phasePips == null) return;
            for (int i = 0; i < phasePips.Length; i++)
                if (phasePips[i] != null) phasePips[i].color = i <= index ? pipActive : pipInactive;
        }

        void HandleEnrage()
        {
            if (healthFill != null) healthFill.color = enragedColor;
        }
    }
}
