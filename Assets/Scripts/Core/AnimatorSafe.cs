using System.Collections.Generic;
using UnityEngine;

namespace AshenCrown.Core
{
    /// <summary>
    /// Safe Animator access for prototypes and production assets. Missing controllers,
    /// parameters, layers, and states are treated as no-ops without warnings.
    /// </summary>
    public static class AnimatorSafe
    {
        static readonly Dictionary<int, HashSet<int>> ParameterCache = new Dictionary<int, HashSet<int>>();
        static readonly Dictionary<int, Dictionary<long, bool>> StateCache = new Dictionary<int, Dictionary<long, bool>>();

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        static void ResetCache()
        {
            ParameterCache.Clear();
            StateCache.Clear();
        }

        static bool HasParameter(Animator animator, int hash)
        {
            if (animator == null || animator.runtimeAnimatorController == null)
                return false;

            int controllerId = animator.runtimeAnimatorController.GetInstanceID();
            if (!ParameterCache.TryGetValue(controllerId, out HashSet<int> parameters))
            {
                parameters = new HashSet<int>();
                foreach (AnimatorControllerParameter parameter in animator.parameters)
                    parameters.Add(parameter.nameHash);
                ParameterCache[controllerId] = parameters;
            }

            return parameters.Contains(hash);
        }

        public static bool HasState(Animator animator, int layer, int stateHash)
        {
            if (animator == null || animator.runtimeAnimatorController == null
                || layer < 0 || layer >= animator.layerCount)
                return false;

            int controllerId = animator.runtimeAnimatorController.GetInstanceID();
            if (!StateCache.TryGetValue(controllerId, out Dictionary<long, bool> states))
            {
                states = new Dictionary<long, bool>();
                StateCache[controllerId] = states;
            }

            long key = ((long)layer << 32) | (uint)stateHash;
            if (!states.TryGetValue(key, out bool exists))
            {
                exists = animator.HasState(layer, stateHash);
                states[key] = exists;
            }

            return exists;
        }

        public static void SetFloat(Animator animator, string name, float value, float damp = 0f, float deltaTime = 0f)
        {
            if (string.IsNullOrEmpty(name))
                return;
            SetFloat(animator, Animator.StringToHash(name), value, damp, deltaTime);
        }

        public static void SetFloat(Animator animator, int hash, float value, float damp = 0f, float deltaTime = 0f)
        {
            if (!HasParameter(animator, hash))
                return;

            if (damp > 0f)
                animator.SetFloat(hash, value, damp, Mathf.Max(0f, deltaTime));
            else
                animator.SetFloat(hash, value);
        }

        public static void SetBool(Animator animator, string name, bool value)
        {
            if (!string.IsNullOrEmpty(name))
                SetBool(animator, Animator.StringToHash(name), value);
        }

        public static void SetBool(Animator animator, int hash, bool value)
        {
            if (HasParameter(animator, hash))
                animator.SetBool(hash, value);
        }

        public static void SetInt(Animator animator, string name, int value)
        {
            if (!string.IsNullOrEmpty(name))
                SetInt(animator, Animator.StringToHash(name), value);
        }

        public static void SetInt(Animator animator, int hash, int value)
        {
            if (HasParameter(animator, hash))
                animator.SetInteger(hash, value);
        }

        public static void Trigger(Animator animator, string name)
        {
            if (!string.IsNullOrEmpty(name))
                Trigger(animator, Animator.StringToHash(name));
        }

        public static void Trigger(Animator animator, int hash)
        {
            if (HasParameter(animator, hash))
                animator.SetTrigger(hash);
        }

        public static void Play(Animator animator, string stateName, float fade = 0.08f)
        {
            if (string.IsNullOrEmpty(stateName))
                return;
            TryPlay(animator, Animator.StringToHash(stateName), fade);
        }

        public static bool TryPlay(Animator animator, int stateHash, float fade = 0.08f, int layer = 0)
        {
            if (!HasState(animator, layer, stateHash))
                return false;

            animator.CrossFadeInFixedTime(stateHash, Mathf.Clamp(fade, 0f, 1f), layer);
            return true;
        }

        public static void SetPlaybackSpeed(Animator animator, float speed)
        {
            if (animator == null || animator.runtimeAnimatorController == null)
                return;
            animator.speed = Mathf.Clamp(speed, 0.05f, 3f);
        }

        public static void SetLayerWeight(Animator animator, int layer, float weight)
        {
            if (animator == null || animator.runtimeAnimatorController == null
                || layer < 0 || layer >= animator.layerCount)
                return;
            animator.SetLayerWeight(layer, Mathf.Clamp01(weight));
        }
    }
}
