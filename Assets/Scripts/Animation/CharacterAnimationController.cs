using UnityEngine;
using AshenCrown.Core;

namespace AshenCrown.Animation
{
    /// <summary>
    /// Compatibility facade retained for existing callers. New animation behavior is
    /// delegated to AnimationPresentationController while the old method signatures stay stable.
    /// </summary>
    public sealed class CharacterAnimationController : MonoBehaviour
    {
        [SerializeField] Animator animator;
        [SerializeField] float locomotionDamp = 0.12f;
        [SerializeField] AnimationPresentationController presentation;

        void Awake()
        {
            if (animator == null)
                animator = GetComponentInChildren<Animator>();

            if (presentation == null)
                presentation = GetComponent<AnimationPresentationController>();
            if (presentation == null)
                presentation = GetComponentInParent<AnimationPresentationController>();
            if (presentation == null)
                presentation = GetComponentInChildren<AnimationPresentationController>();
            if (presentation == null)
                presentation = gameObject.AddComponent<AnimationPresentationController>();

            presentation.SetAnimator(animator);
            presentation.SetLocomotionDamp(locomotionDamp);
        }

        public void SetLocomotion(Vector3 localVelocity, float speed01)
        {
            SetLocomotion(localVelocity, speed01, false, false);
        }

        public void SetLocomotion(Vector3 localVelocity, float speed01, bool sprinting, bool lockedOn)
        {
            if (presentation != null)
            {
                presentation.SetLocomotion(localVelocity, speed01, sprinting, lockedOn);
                return;
            }

            AnimatorSafe.SetFloat(animator, "Speed", Mathf.Clamp01(speed01), locomotionDamp, Time.deltaTime);
            AnimatorSafe.SetFloat(animator, "MoveX", localVelocity.x, locomotionDamp, Time.deltaTime);
            AnimatorSafe.SetFloat(animator, "MoveY", localVelocity.z, locomotionDamp, Time.deltaTime);
        }

        public void SetGrounded(bool value)
        {
            if (presentation != null)
                presentation.SetGrounded(value);
            else
                AnimatorSafe.SetBool(animator, "Grounded", value);
        }

        public void SetCombat(bool value)
        {
            if (presentation != null)
                presentation.SetCombat(value);
            else
                AnimatorSafe.SetBool(animator, "Combat", value);
        }

        public void Trigger(string value)
        {
            if (presentation != null)
                presentation.Trigger(value);
            else
                AnimatorSafe.Trigger(animator, value);
        }

        public void Play(string value, float fade = 0.08f)
        {
            if (presentation != null)
                presentation.PlayAction(value, fade, animator != null ? animator.speed : 1f);
            else
                AnimatorSafe.Play(animator, value, fade);
        }

        public void SetSpeed(float value)
        {
            if (presentation != null)
                presentation.SetPlaybackSpeed(value);
            else if (animator != null)
                AnimatorSafe.SetPlaybackSpeed(animator, value);
        }
    }
}
