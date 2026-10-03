using System.Collections.Generic;
using UnityEngine;

namespace AshenCrown.Core
{
    /// <summary>
    /// Bọc Animator để game vẫn chạy được khi chưa có Animator Controller / thiếu parameter
    /// (không spam warning "Parameter does not exist"). Rất tiện khi prototype bằng capsule.
    /// </summary>
    public static class AnimatorSafe
    {
        // Cache: ID của controller -> tập hash các parameter. Controller đổi (boss phase) thì key đổi.
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

        public static void SetFloat(Animator a, string name, float v, float damp = 0f, float dt = 0f)
        {
            int h = Animator.StringToHash(name);
            if (!Has(a, h)) return;
            if (damp > 0f) a.SetFloat(h, v, damp, dt); else a.SetFloat(h, v);
        }
        public static void SetBool(Animator a, string name, bool v)
        { int h = Animator.StringToHash(name); if (Has(a, h)) a.SetBool(h, v); }
        public static void SetInt(Animator a, string name, int v)
        { int h = Animator.StringToHash(name); if (Has(a, h)) a.SetInteger(h, v); }
        public static void Trigger(Animator a, string name)
        { int h = Animator.StringToHash(name); if (Has(a, h)) a.SetTrigger(h); }

        /// <summary>CrossFade thẳng vào một state theo tên (nếu tồn tại).</summary>
        public static void Play(Animator a, string stateName, float fade = 0.08f)
        {
            if (a == null || string.IsNullOrEmpty(stateName)) return;
            int h = Animator.StringToHash(stateName);
            if (a.HasState(0, h)) a.CrossFadeInFixedTime(h, fade);
        }
    }
}
