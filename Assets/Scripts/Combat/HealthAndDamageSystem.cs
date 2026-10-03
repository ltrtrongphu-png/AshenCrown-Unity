using System;
using UnityEngine;
using AshenCrown.Core;

namespace AshenCrown.Combat
{
    /// <summary>
    /// MODULE 4 - Máu, Giáp, Poise, tính sát thương, kháng thuộc tính, floating text.
    /// Dùng chung cho Player, Enemy và Boss.
    ///
    /// Thứ tự tính sát thương:
    ///   1. Chạy các IDamageFilter (I-frame / Perfect Dodge / Block / Parry của Player). Bị vô hiệu thì dừng.
    ///   2. Kháng thuộc tính:  dmg *= (1 - resist)           (resist âm = yếu điểm)
    ///   3. Giáp (Defense):    dmg *= 100 / (100 + defense)   (đòn xuyên giáp chỉ tính 50% defense)
    ///   4. Hệ số nhận thêm (DamageTakenMultiplier), vd. trạng thái Execute.
    ///   5. Trừ máu; trừ Poise. Poise về 0 -> sự kiện OnPoiseBroken (kẻ địch sẽ Stagger).
    /// </summary>
    public class HealthAndDamageSystem : MonoBehaviour, IDamageable
    {
        [Header("Máu")]
        [SerializeField] float maxHealth = 100f;

        [Header("Giáp (Defense)")]
        [Tooltip("Giáp phẳng. 100 giáp = giảm 50% sát thương.")]
        [SerializeField] float defense = 10f;

        [Header("Poise (thanh giáp / thăng bằng)")]
        [SerializeField] float maxPoise = 40f;
        [SerializeField] float poiseRegenPerSecond = 12f;
        [SerializeField] float poiseRegenDelay = 2.5f;

        [Header("Kháng thuộc tính (-1 = nhận gấp đôi, 0.5 = giảm một nửa)")]
        [SerializeField, Range(-1f, 0.95f)] float resistPhysical = 0f;
        [SerializeField, Range(-1f, 0.95f)] float resistFire = 0f;
        [SerializeField, Range(-1f, 0.95f)] float resistVoid = 0f;
        [SerializeField, Range(-1f, 0.95f)] float resistBlood = 0f;

        [Header("Hiển thị")]
        [Tooltip("Điểm ngắm lock-on. Để trống = vị trí + aimOffset")]
        [SerializeField] Transform aimPoint;
        [SerializeField] Vector3 aimOffset = new Vector3(0f, 1.2f, 0f);
        [SerializeField] bool showFloatingText = true;
        [SerializeField] Color textColor = Color.white;
        [SerializeField] Color criticalColor = new Color(1f, 0.85f, 0.2f);

        /// <summary>Bất tử tuyệt đối (đang chuyển phase boss, cutscene...).</summary>
        public bool Invulnerable { get; set; }
        /// <summary>Nhân sát thương nhận vào. Trạng thái Execute đặt &gt; 1.</summary>
        public float DamageTakenMultiplier { get; set; } = 1f;

        public float CurrentHealth { get; private set; }
        public float MaxHealth => maxHealth;
        public float Health01 => maxHealth <= 0f ? 0f : CurrentHealth / maxHealth;
        public float CurrentPoise { get; private set; }
        public float MaxPoise => maxPoise;
        public float Poise01 => maxPoise <= 0f ? 0f : CurrentPoise / maxPoise;
        public bool IsDead { get; private set; }

        public Transform Transform => transform;
        public Vector3 AimPoint => aimPoint != null ? aimPoint.position : transform.position + aimOffset;

        public event Action<float, float> OnHealthChanged;   // (hiện tại, tối đa)
        public event Action<float, float> OnPoiseChanged;
        public event Action<DamageResult, DamageInfo> OnDamaged;
        public event Action OnPoiseBroken;
        public event Action OnDeath;

        /// <summary>Applies authored RPG stats before the first damage calculation.</summary>
        public void ConfigureStats(float health, float defenseValue, float poise)
        {
            maxHealth = Mathf.Max(1f, health);
            defense = Mathf.Max(0f, defenseValue);
            maxPoise = Mathf.Max(0f, poise);
            CurrentHealth = maxHealth;
            CurrentPoise = maxPoise;
            IsDead = false;
            OnHealthChanged?.Invoke(CurrentHealth, maxHealth);
            OnPoiseChanged?.Invoke(CurrentPoise, maxPoise);
        }

        IDamageFilter[] filters;
        float poiseRegenTimer;

        void Awake()
        {
            CurrentHealth = maxHealth;
            CurrentPoise = maxPoise;
            filters = GetComponents<IDamageFilter>();
        }

        void Update()
        {
            if (IsDead || CurrentPoise >= maxPoise) return;
            if (poiseRegenTimer > 0f) { poiseRegenTimer -= Time.deltaTime; return; }
            CurrentPoise = Mathf.Min(maxPoise, CurrentPoise + poiseRegenPerSecond * Time.deltaTime);
            OnPoiseChanged?.Invoke(CurrentPoise, maxPoise);
        }

        public float GetResistance(DamageType t)
        {
            switch (t)
            {
                case DamageType.Fire: return resistFire;
                case DamageType.Void: return resistVoid;
                case DamageType.Blood: return resistBlood;
                default: return resistPhysical;
            }
        }

        public DamageResult TakeDamage(DamageInfo info)
        {
            var result = new DamageResult();
            if (IsDead) return result;
            if (Invulnerable) { result.blocked = true; return result; }

            // 1) Bộ lọc phòng thủ (I-frame, Perfect Dodge, Block, Parry).
            for (int i = 0; i < filters.Length; i++)
            {
                if (filters[i].TryNegate(ref info)) { result.blocked = true; return result; }
            }

            // 2-4) Kháng -> Giáp -> hệ số nhận thêm.
            float dmg = info.amount;
            dmg *= 1f - Mathf.Clamp(GetResistance(info.type), -1f, 0.95f);
            float effDef = info.armorPiercing ? defense * 0.5f : defense;
            dmg *= 100f / (100f + Mathf.Max(0f, effDef));
            dmg *= DamageTakenMultiplier;
            if (info.amount > 0f) dmg = Mathf.Max(1f, Mathf.Round(dmg));

            // 5) Trừ máu & Poise.
            CurrentHealth = Mathf.Max(0f, CurrentHealth - dmg);
            result.finalDamage = dmg;
            result.critical = info.isCritical;

            if (maxPoise > 0f && info.poiseDamage > 0f)
            {
                CurrentPoise -= info.poiseDamage;
                poiseRegenTimer = poiseRegenDelay;
                if (CurrentPoise <= 0f)
                {
                    CurrentPoise = maxPoise;     // reset sau khi vỡ
                    result.poiseBroken = true;
                }
                OnPoiseChanged?.Invoke(CurrentPoise, maxPoise);
            }

            OnHealthChanged?.Invoke(CurrentHealth, maxHealth);

            if (showFloatingText && dmg > 0f)
                DamageFloatingText.Spawn(AimPoint + Vector3.up * 0.4f, Mathf.RoundToInt(dmg).ToString(),
                                         info.isCritical ? criticalColor : textColor, info.isCritical ? 1.4f : 1f);

            if (CurrentHealth <= 0f) { IsDead = true; result.killed = true; }

            OnDamaged?.Invoke(result, info);
            if (result.poiseBroken && !IsDead) OnPoiseBroken?.Invoke();
            if (result.killed) OnDeath?.Invoke();
            return result;
        }

        public void Heal(float amount)
        {
            if (IsDead || amount <= 0f) return;
            CurrentHealth = Mathf.Min(maxHealth, CurrentHealth + amount);
            OnHealthChanged?.Invoke(CurrentHealth, maxHealth);
            if (showFloatingText)
                DamageFloatingText.Spawn(AimPoint + Vector3.up * 0.4f, "+" + Mathf.RoundToInt(amount),
                                         new Color(0.4f, 1f, 0.5f), 0.9f);
        }

        public void RestorePoise()
        {
            CurrentPoise = maxPoise;
            OnPoiseChanged?.Invoke(CurrentPoise, maxPoise);
        }

        /// <summary>Hồi sinh (dùng khi respawn tại Trạm Phong Ấn).</summary>
        public void ReviveFull()
        {
            IsDead = false;
            CurrentHealth = maxHealth;
            CurrentPoise = maxPoise;
            OnHealthChanged?.Invoke(CurrentHealth, maxHealth);
            OnPoiseChanged?.Invoke(CurrentPoise, maxPoise);
        }
    }
}
