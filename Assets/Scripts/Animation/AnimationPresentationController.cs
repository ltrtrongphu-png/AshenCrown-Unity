using UnityEngine;
using AshenCrown.Core;

namespace AshenCrown.Animation
{
    [DisallowMultipleComponent]
    public sealed class AnimationPresentationController : MonoBehaviour
    {
        [SerializeField] Animator animator;
        [SerializeField, Min(0.01f)] float locomotionDamp = 0.075f;
        [SerializeField, Min(0.01f)] float actionFade = 0.065f;
        [SerializeField, Min(0.01f)] float minPlaybackSpeed = 0.01f;
        [SerializeField, Min(0.01f)] float maxPlaybackSpeed = 3f;
        [SerializeField, Range(0f, 0.25f)] float locomotionDeadZone = 0.035f;

        public Animator Animator => animator;
        public string CurrentAction { get; private set; }

        void Awake()
        {
            if (animator == null) animator = GetComponentInChildren<Animator>();
        }

        public void SetLocomotion(Vector3 localVelocity, float normalizedSpeed, bool sprinting = false, bool lockedOn = false)
        {
            if (animator == null) return;
            Vector3 clamped = AnimationPresentationMath.ClampLocomotion(localVelocity, locomotionDeadZone);
            AnimatorSafe.SetFloat(animator, "MoveX", clamped.x, locomotionDamp, Time.deltaTime);
            AnimatorSafe.SetFloat(animator, "MoveY", clamped.z, locomotionDamp, Time.deltaTime);
            AnimatorSafe.SetFloat(animator, "MoveZ", clamped.z, locomotionDamp, Time.deltaTime);
            AnimatorSafe.SetFloat(animator, "Speed", AnimationPresentationMath.ClampSpeed(normalizedSpeed), locomotionDamp, Time.deltaTime);
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
            if (AnimatorSafe.PlayIfDifferent(animator, stateName, fade > 0f ? fade : actionFade))
                CurrentAction = stateName;
            SetPlaybackSpeed(playbackSpeed);
        }

        public void Trigger(string parameter) => AnimatorSafe.Trigger(animator, parameter);

        public void SetPlaybackSpeed(float value)
        {
            if (animator == null) return;
            float clamped = AnimationPresentationMath.ClampPlaybackSpeed(value, minPlaybackSpeed, maxPlaybackSpeed);
            if (Mathf.Abs(animator.speed - clamped) > 0.002f) animator.speed = clamped;
        }
    }
}