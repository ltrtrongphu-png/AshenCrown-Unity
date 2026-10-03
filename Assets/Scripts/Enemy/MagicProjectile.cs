using UnityEngine;
using AshenCrown.Core;

namespace AshenCrown.Enemy
{
    /// <summary>
    /// Đạn ma thuật của Ranged Enemy. Di chuyển thẳng, quét SphereCast mỗi frame
    /// (không cần Rigidbody, không bị xuyên người ở tốc độ cao).
    /// </summary>
    public class MagicProjectile : MonoBehaviour
    {
        [SerializeField] float speed = 14f;
        [SerializeField] float radius = 0.3f;
        [SerializeField] float lifetime = 6f;
        [Tooltip("Layer của Player và địa hình")]
        [SerializeField] LayerMask hitMask = ~0;
        [SerializeField] GameObject impactVfx;

        GameObject source;
        Vector3 direction;
        float damage, poise;
        DamageType damageType;

        public void Init(GameObject src, Vector3 dir, float dmg, float poiseDmg, DamageType type)
        {
            source = src; direction = dir.normalized;
            damage = dmg; poise = poiseDmg; damageType = type;
            transform.forward = direction;
        }

        void Update()
        {
            float step = speed * Time.deltaTime;
            if (Physics.SphereCast(transform.position, radius, direction, out RaycastHit hit, step, hitMask,
                                   QueryTriggerInteraction.Ignore)
                && (source == null || !hit.collider.transform.IsChildOf(source.transform)))
            {
                Impact(hit);
                return;
            }

            transform.position += direction * step;
            lifetime -= Time.deltaTime;
            if (lifetime <= 0f) Destroy(gameObject);
        }

        void Impact(RaycastHit hit)
        {
            var target = hit.collider.GetComponentInParent<IDamageable>();
            if (target != null && !target.IsDead)
            {
                target.TakeDamage(new DamageInfo
                {
                    amount = damage, type = damageType, poiseDamage = poise,
                    source = source, hitPoint = hit.point, hitDirection = direction
                });
            }
            if (impactVfx != null) Instantiate(impactVfx, hit.point, Quaternion.identity);
            Destroy(gameObject);
        }
    }
}
