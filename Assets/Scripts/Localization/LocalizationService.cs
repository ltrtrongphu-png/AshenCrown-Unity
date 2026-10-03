using System;
using System.Collections.Generic;
using UnityEngine;

namespace AshenCrown.Localization
{
    /// <summary>Lightweight localization layer with zero package dependencies.</summary>
    public sealed class LocalizationService : MonoBehaviour
    {
        public enum Language { English, Vietnamese, Japanese, Korean, ChineseSimplified }

        public static LocalizationService Instance { get; private set; }
        public Language CurrentLanguage { get; private set; } = Language.English;
        public event Action LanguageChanged;

        readonly Dictionary<string, string[]> table = new Dictionary<string, string[]>
        {
            { "ui.play", new[] { "Play Combat Trial", "Chơi thử chiến đấu", "戦闘トライアル", "전투 시험", "开始战斗试炼" } },
            { "ui.settings", new[] { "Settings", "Cài đặt", "設定", "설정", "设置" } },
            { "ui.resume", new[] { "Resume", "Tiếp tục", "再開", "계속", "继续" } },
            { "ui.pause", new[] { "Trial Paused", "Đã tạm dừng", "一時停止", "일시정지", "已暂停" } },
            { "ui.defeat", new[] { "Defeat the Warden", "Đánh bại Warden", "ウォーデンを倒せ", "워든 처치", "击败守卫者" } },
            { "ui.ready", new[] { "Ready", "Sẵn sàng", "準備完了", "준비 완료", "准备就绪" } },
            { "combat.move", new[] { "Move", "Di chuyển", "移動", "이동", "移动" } },
            { "combat.dodge", new[] { "Dodge", "Né", "回避", "회피", "闪避" } },
            { "combat.guard", new[] { "Guard / Parry", "Đỡ / Đỡ hoàn hảo", "ガード / パリィ", "가드 / 패리", "格挡 / 弹反" } },
            { "skill.ashen_edge", new[] { "Ashen Edge", "Lưỡi Tro Tàn", "灰の刃", "잿빛 칼날", "灰烬之刃" } },
            { "skill.void_step", new[] { "Void Step", "Bước Hư Không", "虚無の歩み", "공허의 발걸음", "虚空步" } },
            { "skill.ember_guard", new[] { "Ember Guard", "Hộ Vệ Tàn Lửa", "残火の守り", "잿불 수호", "余烬守护" } },
            { "skill.crown_breaker", new[] { "Crown Breaker", "Phá Vương Miện", "王冠砕き", "왕관 파괴자", "破冠者" } }
        };

        void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            CurrentLanguage = (Language)Mathf.Clamp(PlayerPrefs.GetInt("ashen.language", 0), 0, 4);
        }

        public void SetLanguage(Language language)
        {
            if (CurrentLanguage == language) return;
            CurrentLanguage = language;
            PlayerPrefs.SetInt("ashen.language", (int)language);
            PlayerPrefs.Save();
            LanguageChanged?.Invoke();
        }

        public void SetLanguage(string code)
        {
            if (string.IsNullOrWhiteSpace(code)) return;
            switch (code.Trim().ToLowerInvariant())
            {
                case "vi": SetLanguage(Language.Vietnamese); break;
                case "ja": SetLanguage(Language.Japanese); break;
                case "ko": SetLanguage(Language.Korean); break;
                case "zh": SetLanguage(Language.ChineseSimplified); break;
                default: SetLanguage(Language.English); break;
            }
        }

        public string Get(string key)
        {
            if (!table.TryGetValue(key, out var values)) return key;
            return values[Mathf.Clamp((int)CurrentLanguage, 0, values.Length - 1)];
        }
    }
}
