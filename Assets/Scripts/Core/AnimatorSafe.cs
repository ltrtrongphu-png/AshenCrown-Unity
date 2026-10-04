using System.Collections.Generic;
using UnityEngine;

namespace AshenCrown.Core
{
    public static class AnimatorSafe
    {
        static readonly Dictionary<int, HashSet<int>> Cache = new Dictionary<int, HashSet<int>>();

        static bool Has(Animator a, int hash)
        {
            if (a == null || a.runtimeAnimatorController == null) return false;
            int key = a.runtimeAnimatorController.GetInstanceID();
            if (!Cache.TryGetValue(key, out var set))
            {
                set = new HashSet<int>();
                foreach (var p in a.parameters) set.Add(p.nameHash);
                Cache[key] = set;
            }
            return set.Contains(hash);
        }

        public static void SetFloat(Animator a, string name, float value, float damp = 0f, float dt = 0f)
        {
            int hash = Animator.StringToHash(name);
            if (!Has(a, hash)) return;
            if (damp > 0f) a.SetFloat(hash, value, damp, dt); else a.SetFloat(hash, value);
        }

        public static void SetBool(Animator a, string name, bool value)
        {
            int hash = Animator.StringToHash(name);
            if (Has(a, hash)) a.SetBool(hash, value);
        }

        public static void SetInt(Animator a, string name, int value)
        {
            int hash = Animator.StringToHash(name);
            if (Has(a, hash)) a.SetInteger(hash, value);
        }

        public static void Trigger(Animator a, string name)
        {
            int hash = Animator.StringToHash(name);
            if (Has(a, hash)) a.SetTrigger(hash);
        }

        public static bool HasState(Animator a, string stateName, int layer = 0)
        {
            if (a == null || a.runtimeAnimatorController == null || string.IsNullOrEmpty(stateName)) return false;
            return a.HasState(layer, Animator.StringToHash(stateName));
        }

        public static void Play(Animator a, string stateName, float fade = 0.08f)
            => PlayIfDifferent(a, stateName, fade);

        public static bool PlayIfDifferent(Animator a, string stateName, float fade = 0.08f, int layer = 0)
        {
            if (!HasState(a, stateName, layer)) return false;
            int hash = Animator.StringToHash(stateName);
            AnimatorStateInfo current = a.GetCurrentAnimatorStateInfo(layer);
            if (current.fullPathHash == hash || current.shortNameHash == hash) return false;
            a.CrossFadeInFixedTime(hash, Mathf.Max(0f, fade), layer);
            return true;
        }

        public static void SetSpeed(Animator a, float value)
        {
            if (a != null) a.speed = Mathf.Max(.01f, value);
        }
    }
}
