using UnityEngine;
using AshenCrown.Core;

namespace AshenCrown.Animation
{
    [DisallowMultipleComponent]
    public sealed class AnimationPresentationController : MonoBehaviour
    {
        [SerializeField] Animator animator;
        [SerializeField, Min(0.01f)] float locomotionDamp = 0.09f;
        [SerializeField, Min(0.01f)] float actionFade = 0.075f;
        [SerializeField, Min(0.01f)] float minPlaybackSpeed = 0.01f;
        [SerializeField, Min(0.01f)] float maxPlaybackSpeed = 3f;

        public Animator Animator => animator;

        void Awake()
        {
            if (animator == null) animator = GetComponentInChildren<Animator>();
        }

        public void SetLocomotion(Vector3 localVelocity, float normalizedSpeed, bool sprinting = false, bool lockedOn = false)
        {
            if (animator == null) return;
            localVelocity.y = 0f;
            AnimatorSafe.SetFloat(animator, "MoveX", Mathf.Clamp(localVelocity.x, -1f, 1f), locomotionDamp, Time.deltaTime);
            AnimatorSafe.SetFloat(animator, "MoveY", Mathf.Clamp(localVelocity.z, -1f, 1f), locomotionDamp, Time.deltaTime);
            AnimatorSafe.SetFloat(animator, "MoveZ", Mathf.Clamp(localVelocity.z, -1f, 1f), locomotionDamp, Time.deltaTime);
            AnimatorSafe.SetFloat(animator, "Speed", Mathf.Clamp01(normalizedSpeed), locomotionDamp, Time.deltaTime);
            AnimatorSafe.SetBool(animator, "Sprint", sprinting);
            AnimatorSafe.SetBool(animator, "LockedOn", lockedOn);
        }

        public void SetCombatState(bool combat, bool grounded)
        {
            AnimatorSafe.SetBool(animator, "Combat", combat);
            AnimatorSafe.SetBool(animator, "Grounded", grounded);
        }

        public void PlayAction(string stateName, float fade = -1f, float playbackSpeed = 1f)
        {
            if (animator == null || string.IsNullOrEmpty(stateName)) return;
            AnimatorSafe.PlayIfDifferent(animator, stateName, fade > 0f ? fade : actionFade);
            SetPlaybackSpeed(playbackSpeed);
        }

        public void Trigger(string parameter) => AnimatorSafe.Trigger(animator, parameter);

        public void SetPlaybackSpeed(float value)
        {
            if (animator == null) return;
            animator.speed = Mathf.Clamp(value, minPlaybackSpeed, maxPlaybackSpeed);
        }
    }
}
