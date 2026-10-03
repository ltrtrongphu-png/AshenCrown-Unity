using System;
using UnityEngine;

namespace AshenCrown.Player
{
    /// <summary>
    /// Thể lực (Stamina). Dùng chung cho Sprint (tiêu hao liên tục) và Combat (tiêu hao theo hành động).
    /// Sau khi tiêu hao sẽ chờ regenDelay giây rồi mới hồi. Về 0 thì bị "kiệt sức" tới khi hồi đủ ngưỡng.
    /// </summary>
    public class PlayerStamina : MonoBehaviour
    {
        [SerializeField] float maxStamina = 100f;
        [SerializeField] float regenPerSecond = 32f;
        [SerializeField] float regenDelay = 0.9f;
        [SerializeField] float exhaustRecoverThreshold = 20f;

        public float Current { get; private set; }
        public float Max => maxStamina;
        public float Normalized => Current / maxStamina;
        public bool IsExhausted { get; private set; }
        public bool CanSprint => !IsExhausted && Current > 1f;

        /// <summary>(hiện tại, tối đa) - UI lắng nghe để vẽ thanh Stamina.</summary>
        public event Action<float, float> OnChanged;

        float regenTimer;

        void Awake() { Current = maxStamina; }

        void Update()
        {
            if (regenTimer > 0f) { regenTimer -= Time.deltaTime; return; }
            if (Current < maxStamina) Set(Current + regenPerSecond * Time.deltaTime);
            if (IsExhausted && Current >= exhaustRecoverThreshold) IsExhausted = false;
        }

        /// <summary>Trừ stamina một lần. Trả về false (không trừ) nếu không đủ.</summary>
        public bool TryConsume(float amount)
        {
            if (amount <= 0f) return true;
            if (Current < amount) return false;
            Drain(amount);
            return true;
        }

        /// <summary>Trừ bắt buộc (dùng cho Sprint mỗi frame).</summary>
        public void Drain(float amount)
        {
            Set(Current - amount);
            regenTimer = regenDelay;
            if (Current <= 0.01f) IsExhausted = true;
        }

        public void Restore(float amount) => Set(Current + amount);
        public void RestorePercent(float percent01) => Set(Current + maxStamina * percent01);

        void Set(float v)
        {
            Current = Mathf.Clamp(v, 0f, maxStamina);
            OnChanged?.Invoke(Current, maxStamina);
        }
    }
}
