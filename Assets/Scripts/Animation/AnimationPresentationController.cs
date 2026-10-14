using System;
using System.Collections.Generic;
using UnityEngine;
using AshenCrown.Core;

namespace AshenCrown.Animation
{
    /// <summary>
    /// Allocation-free steady-state animator presentation for locomotion and combat.
    /// Requests for the currently active action are ignored so animation states do not
    /// restart every frame. Missing controllers/parameters/states remain safe no-ops.
    /// </summary>
    [DisallowMultipleComponent]
    public sealed class AnimationPresentationController : MonoBehaviour
    {
        static readonly int SpeedHash = Animator.StringToHash("Speed");
        static readonly int MoveXHash = Animator.StringToHash("MoveX");
        static readonly int MoveYHash = Animator.StringToHash("MoveY");
        static readonly int SprintHash = Animator.StringToHash("Sprinting");
        static readonly int LockedOnHash = Animator.StringToHash("LockedOn");
        static readonly int CombatHash = Animator.StringToHash("Combat");
        static readonly int GroundedHash = Animator.StringToHash("Grounded");

        [SerializeField] Animator animator;
        [SerializeField, Min(0f)] float locomotionDamp = 0.12f;

        readonly Dictionary<string, int> parameterHashes = new Dictionary<string, int>(StringComparer.Ordinal);
        int activeActionHash;

        public Animator Animator => animator;
        public int ActiveActionHash => activeActionHash;

        void Awake()
        {
            ResolveAnimator();
        }

        void OnDisable()
        {
            activeActionHash = 0;
        }

        public void SetAnimator(Animator value)
        {
            if (animator == value)
                return;

            animator = value;
            activeActionHash = 0;
        }

        public void SetLocomotion(Vector3 localVelocity, float normalizedSpeed, bool sprinting, bool lockedOn)
        {
            ResolveAnimator();
            if (animator == null)
                return;

            float deltaTime = Mathf.Max(0f, Time.deltaTime);
            Vector3 local = ClampLocalVelocity(localVelocity);
            AnimatorSafe.SetFloat(animator, SpeedHash, ClampNormalizedSpeed(normalizedSpeed), locomotionDamp, deltaTime);
            AnimatorSafe.SetFloat(animator, MoveXHash, local.x, locomotionDamp, deltaTime);
            AnimatorSafe.SetFloat(animator, MoveYHash, local.z, locomotionDamp, deltaTime);
            AnimatorSafe.SetBool(animator, SprintHash, sprinting);
            AnimatorSafe.SetBool(animator, LockedOnHash, lockedOn);
        }

        public void SetCombatState(bool combat, bool grounded)
        {
            ResolveAnimator();
            if (animator == null)
                return;

            AnimatorSafe.SetBool(animator, CombatHash, combat);
            AnimatorSafe.SetBool(animator, GroundedHash, grounded);
        }

        public void PlayAction(string stateName, float fade = 0.08f, float playbackSpeed = 1f)
        {
            ResolveAnimator();
            if (animator == null || string.IsNullOrWhiteSpace(stateName))
                return;

            int hash = Animator.StringToHash(stateName);
            if (!ShouldRestartAction(hash, activeActionHash))
            {
                AnimatorSafe.SetPlaybackSpeed(animator, playbackSpeed);
                return;
            }

            if (AnimatorSafe.TryPlay(animator, hash, Mathf.Clamp(fade, 0f, 1f)))
            {
                activeActionHash = hash;
                AnimatorSafe.SetPlaybackSpeed(animator, playbackSpeed);
            }
        }

        public void Trigger(string parameter)
        {
            ResolveAnimator();
            if (animator == null || string.IsNullOrWhiteSpace(parameter))
                return;

            if (!parameterHashes.TryGetValue(parameter, out int hash))
            {
                hash = Animator.StringToHash(parameter);
                parameterHashes[parameter] = hash;
            }
            AnimatorSafe.Trigger(animator, hash);
        }

        public void SetPlaybackSpeed(float value)
        {
            ResolveAnimator();
            AnimatorSafe.SetPlaybackSpeed(animator, value);
        }

        public static Vector3 ClampLocalVelocity(Vector3 value)
        {
            return new Vector3(
                Mathf.Clamp(value.x, -1f, 1f),
                Mathf.Clamp(value.y, -1f, 1f),
                Mathf.Clamp(value.z, -1f, 1f));
        }

        public static float ClampNormalizedSpeed(float value)
        {
            return Mathf.Clamp01(float.IsNaN(value) || float.IsInfinity(value) ? 0f : value);
        }

        public static float ClampPlaybackSpeed(float value)
        {
            return Mathf.Clamp(float.IsNaN(value) || float.IsInfinity(value) ? 1f : value, 0.05f, 3f);
        }

        public static bool ShouldRestartAction(int requestedHash, int activeHash)
        {
            return requestedHash != 0 && requestedHash != activeHash;
        }

        void ResolveAnimator()
        {
            if (animator == null)
                animator = GetComponentInChildren<Animator>();
        }
    }
}
