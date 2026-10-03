using System.Collections.Generic;
using UnityEngine;
using AshenCrown.Core;

namespace AshenCrown.Enemy
{
    /// <summary>
    /// Bẫy đặt dưới chân người chơi. Có thời gian báo hiệu (armDelay) để kịp bước ra,
    /// sau đó nổ một lần gây sát thương trong bán kính.
    /// </summary>
    public class GroundHazard : MonoBehaviour
    {
        [SerializeField] float radius = 2.2f;
        [SerializeField] float armDelay = 1.0f;
        [SerializeField] LayerMask targetMask;
        [Tooltip("Hình tròn báo hiệu: sẽ phóng to dần tới đúng bán kính trước khi nổ (tuỳ chọn)")]
        [SerializeField] Transform telegraphVisual;
        [SerializeField] GameObject burstVfx;

        GameObject source;
        float damage, poise, timer;
        bool triggered;

        public void Init(GameObject src, float dmg, float poiseDmg)
        {
            source = src; damage = dmg; poise = poiseDmg;
        }

        void Update()
        {
            timer += Time.deltaTime;
            if (telegraphVisual != null && !triggered)
            {
                float d = radius * 2f * Mathf.Clamp01(timer / armDelay);
                telegraphVisual.localScale = new Vector3(d, telegraphVisual.localScale.y, d);
            }
            if (!triggered && timer >= armDelay) Burst();
        }

        void Burst()
        {
            triggered = true;
            var hits = Physics.OverlapSphere(transform.position, radius, targetMask, QueryTriggerInteraction.Ignore);
            var seen = new HashSet<IDamageable>();
            foreach (var c in hits)
            {
                var t = c.GetComponentInParent<IDamageable>();
                if (t == null || t.IsDead || !seen.Add(t)) continue;
                t.TakeDamage(new DamageInfo
                {
                    amount = damage, type = DamageType.Void, poiseDamage = poise, source = source,
                    hitPoint = t.AimPoint, hitDirection = (t.Transform.position - transform.position).normalized
                });
            }
            if (burstVfx != null) Instantiate(burstVfx, transform.position, Quaternion.identity);
            Destroy(gameObject, 0.15f);
        }

        void OnDrawGizmosSelected()
        {
            Gizmos.color = Color.magenta;
            Gizmos.DrawWireSphere(transform.position, radius);
        }
    }
}
