using UnityEngine;
using AshenCrown.Core;
using AshenCrown.Progression;

namespace AshenCrown.Presentation
{
    /// <summary>Turns a dropped item into a readable animated 3D pickup.</summary>
    public sealed class ItemWorldPickupAnimator : MonoBehaviour
    {
        [SerializeField] float hoverHeight = .16f;
        [SerializeField] float rotationSpeed = 45f;
        [SerializeField] float pulseSpeed = 2.2f;
        [SerializeField] ItemTier tier = ItemTier.Common;
        Vector3 basePosition;
        Vector3 baseScale;

        public void Initialize(ItemDefinition item)
        {
            if (item == null) return;
            tier = item.tier;
            basePosition = transform.position;
            baseScale = transform.localScale == Vector3.zero ? Vector3.one : transform.localScale;
        }

        void Awake()
        {
            basePosition = transform.position;
            baseScale = transform.localScale == Vector3.zero ? Vector3.one : transform.localScale;
        }

        void Update()
        {
            var reduced = GameSettingsService.Instance != null && GameSettingsService.Instance.ReducedMotion;
            var motion = reduced ? .2f : 1f;
            var t = Time.time * motion;
            transform.Rotate(Vector3.up, rotationSpeed * motion * Time.deltaTime, Space.World);
            transform.position = basePosition + Vector3.up * Mathf.Sin(t * pulseSpeed) * hoverHeight;
            var scale = 1f + Mathf.Sin(t * pulseSpeed * .7f) * (tier >= ItemTier.Epic ? .035f : .018f);
            transform.localScale = baseScale * scale;
        }
    }
}
