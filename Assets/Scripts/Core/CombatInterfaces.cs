using UnityEngine;

namespace AshenCrown.Core
{
    /// <summary>Hệ thuộc tính sát thương. Dùng để tra bảng kháng (resistance) trong HealthAndDamageSystem.</summary>
    public enum DamageType { Physical, Fire, Void, Blood }

    /// <summary>
    /// Gói dữ liệu một đòn đánh. Là struct nhỏ truyền bằng giá trị để dễ chỉnh sửa
    /// (ví dụ Block giảm amount) trước khi áp vào máu.
    /// </summary>
    public struct DamageInfo
    {
        public float amount;                // Sát thương gốc (trước kháng/giáp)
        public DamageType type;
        public float poiseDamage;           // Sát thương lên thanh Poise (phá giáp / Stagger)
        public GameObject source;           // Kẻ gây sát thương (để Parry biết phản đòn về ai)
        public Vector3 hitPoint;
        public Vector3 hitDirection;        // Hướng lực đánh, dùng cho ragdoll / knockback
        public bool isCritical;
        public bool isUnblockable;          // Đòn ĐỎ: không thể Block/Parry, bắt buộc né
        public bool armorPiercing;          // Xuyên giáp: bỏ qua 50% Defense của mục tiêu
        public bool requiresPerfectDodge;   // I-frame thường KHÔNG cứu được, chỉ Perfect Dodge mới né được
    }

    public struct DamageResult
    {
        public float finalDamage;
        public bool blocked;     // Bị vô hiệu hoàn toàn (né / parry / bất tử)
        public bool killed;
        public bool critical;
        public bool poiseBroken;
    }

    /// <summary>Mọi thứ có thể nhận sát thương (Player, Enemy, Boss, vật thể phá được).</summary>
    public interface IDamageable
    {
        Transform Transform { get; }
        Vector3 AimPoint { get; }     // Điểm ngắm cho lock-on / floating text
        bool IsDead { get; }
        DamageResult TakeDamage(DamageInfo info);
    }

    /// <summary>
    /// Bộ lọc chạy TRƯỚC khi tính sát thương. Player cài vào để xử lý I-frame, Perfect Dodge, Block, Parry.
    /// Trả về true nếu đòn bị vô hiệu hoàn toàn. Có thể sửa info (vd. giảm amount khi Block).
    /// </summary>
    public interface IDamageFilter
    {
        bool TryNegate(ref DamageInfo info);
    }

    public interface IStaggerable
    {
        void ApplyStagger(float duration);
        /// <summary>Trạng thái "Choáng Tẩy" sau khi bị Parry: đứng yên và nhận thêm sát thương.</summary>
        void EnterExecuteState(float duration);
        void ApplyKnockback(Vector3 impulse);
    }

    /// <summary>Đối tượng bị "Sương Thời Gian" (Perfect Dodge) làm chậm.</summary>
    public interface ITimeSlowable
    {
        void ApplyTimeSlow(float factor, float duration);
    }
}
