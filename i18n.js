(() => {
  const dictionaries = {
    en: { play:"Play the combat trial", explore:"Explore the combat", combat:"Combat", systems:"Systems", controls:"Controls", source:"Source", showcase:"3D relic showcase", inspect:"Rotate · zoom · inspect", language:"Language" },
    vi: { play:"Chơi thử chiến đấu", explore:"Khám phá chiến đấu", combat:"Chiến đấu", systems:"Hệ thống", controls:"Điều khiển", source:"Mã nguồn", showcase:"Trưng bày di vật 3D", inspect:"Xoay · phóng to · quan sát", language:"Ngôn ngữ" },
    ja: { play:"戦闘トライアルを開始", explore:"戦闘を見る", combat:"戦闘", systems:"システム", controls:"操作", source:"ソース", showcase:"3Dレリック展示", inspect:"回転 · ズーム · 観察", language:"言語" },
    ko: { play:"전투 시험 플레이", explore:"전투 살펴보기", combat:"전투", systems:"시스템", controls:"조작", source:"소스", showcase:"3D 유물 전시", inspect:"회전 · 확대 · 관찰", language:"언어" },
    zh: { play:"开始战斗试炼", explore:"探索战斗", combat:"战斗", systems:"系统", controls:"操作", source:"源码", showcase:"3D 遗物展示", inspect:"旋转 · 缩放 · 查看", language:"语言" }
  };

  const supported = ["en","vi","ja","ko","zh"];
  const saved = localStorage.getItem("ashen.language");
  const browser = (navigator.language || "en").slice(0,2).toLowerCase();
  let language = supported.includes(saved) ? saved : (supported.includes(browser) ? browser : "en");

  function apply() {
    const d = dictionaries[language];
    document.documentElement.lang = language;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      if (d[key]) el.textContent = d[key];
    });
    document.querySelectorAll("[data-lang]").forEach(el => el.classList.toggle("active", el.dataset.lang === language));
  }

  window.AshenI18n = {
    get language() { return language; },
    setLanguage(next) {
      if (!supported.includes(next)) return;
      language = next;
      localStorage.setItem("ashen.language", next);
      apply();
      window.dispatchEvent(new CustomEvent("ashen:language", { detail: next }));
    }
  };

  window.addEventListener("DOMContentLoaded", apply);
})();
