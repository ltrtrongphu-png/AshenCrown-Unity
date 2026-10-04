using UnityEngine;
using AshenCrown.Core;

namespace AshenCrown.Animation
{
    [DisallowMultipleComponent]
    public sealed class CharacterAnimationController : MonoBehaviour
    {
        [SerializeField] Animator animator;
        [SerializeField] AnimationPresentationController presentation;

        void Awake()
        {
            if (animator == null) animator = GetComponentInChildren<Animator>();
            if (presentation == null) presentation = GetComponent<AnimationPresentationController>();
            if (presentation == null) presentation = gameObject.AddComponent<AnimationPresentationController>();
        }

        public void SetLocomotion(Vector3 localVelocity, float speed01)
            => presentation?.SetLocomotion(localVelocity, speed01);

        public void SetGrounded(bool value) => AnimatorSafe.SetBool(animator, "Grounded", value);
        public void SetCombat(bool value) => AnimatorSafe.SetBool(animator, "Combat", value);
        public void Trigger(string value) => presentation?.Trigger(value);
        public void Play(string value, float fade = .08f) => presentation?.PlayAction(value, fade);
        public void SetSpeed(float value) => presentation?.SetPlaybackSpeed(value);
    }
}
