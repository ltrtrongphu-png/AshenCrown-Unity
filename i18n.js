(() => {
  const dictionaries = {
    en:{world:"World",combat:"Combat",systems:"Systems",progression:"Progression",controls:"Controls",play:"Play Trial",trial:"Enter the combat trial",enterWorld:"Enter the world",showcase:"Inspect the ember.",inspect:"Rotate · zoom · explore the interactive presentation.",tryTrial:"Try the trial →",source:"View source ↗",language:"Language"},
    vi:{world:"Thế giới",combat:"Chiến đấu",systems:"Hệ thống",progression:"Tiến trình",controls:"Điều khiển",play:"Chơi thử",trial:"Bước vào màn chiến đấu",enterWorld:"Khám phá thế giới",showcase:"Quan sát ngọn lửa.",inspect:"Xoay · phóng to · khám phá mô hình 3D.",tryTrial:"Thử màn chiến đấu →",source:"Xem mã nguồn ↗",language:"Ngôn ngữ"},
    ja:{world:"世界",combat:"戦闘",systems:"システム",progression:"進行",controls:"操作",play:"試練をプレイ",trial:"戦闘試練へ",enterWorld:"世界へ",showcase:"炎を観察する。",inspect:"回転 · ズーム · 3Dモデルを探索。",tryTrial:"試練をプレイ →",source:"ソースを見る ↗",language:"言語"},
    ko:{world:"세계",combat:"전투",systems:"시스템",progression:"진행",controls:"조작",play:"시험 플레이",trial:"전투 시험으로",enterWorld:"세계로 들어가기",showcase:"불꽃을 살펴본다.",inspect:"회전 · 확대 · 3D 모델 탐험.",tryTrial:"시험 플레이 →",source:"소스 보기 ↗",language:"언어"},
    zh:{world:"世界",combat:"战斗",systems:"系统",progression:"进程",controls:"操作",play:"开始试炼",trial:"进入战斗试炼",enterWorld:"进入世界",showcase:"凝视余烬。",inspect:"旋转 · 缩放 · 探索3D模型。",tryTrial:"开始试炼 →",source:"查看源码 ↗",language:"语言"}
  };
  const supported=["en","vi","ja","ko","zh"];
  const saved=localStorage.getItem("ashen.language"),browser=(navigator.language||"en").slice(0,2).toLowerCase();
  let language=supported.includes(saved)?saved:(supported.includes(browser)?browser:"en");

  function setText(selector,value){const el=document.querySelector(selector);if(el)el.textContent=value}
  function injectUI(){
    const header=document.querySelector(".site-header");
    if(header&&!header.querySelector(".lang-switch")){
      const box=document.createElement("div");box.className="header-tools";
      box.innerHTML='<div class="lang-switch" aria-label="Language"><button data-lang="en">EN</button><button data-lang="vi">VI</button><button data-lang="ja">JA</button><button data-lang="ko">KO</button><button data-lang="zh">中文</button></div>';
      header.appendChild(box);
    }
  }
  function apply(){
    const d=dictionaries[language];document.documentElement.lang=language;
    const nav=document.querySelectorAll("nav>a");if(nav.length>=5){nav[0].textContent=d.world;nav[1].textContent=d.combat;nav[2].textContent=d.systems;nav[3].textContent=d.progression}
    setText(".nav-cta",d.play);setText(".hero-actions .primary",d.trial);setText('.hero-actions .quiet',d.enterWorld);
    setText("#model .section-head h2",d.showcase);setText("#model .section-head>p",d.inspect);
    document.querySelectorAll("[data-i18n]").forEach(el=>{const key=el.dataset.i18n;if(d[key])el.textContent=d[key]});
    document.querySelectorAll("[data-lang]").forEach(el=>el.classList.toggle("active",el.dataset.lang===language));
  }
  window.AshenI18n={get language(){return language;},setLanguage(next){if(!supported.includes(next))return;language=next;localStorage.setItem("ashen.language",next);apply();window.dispatchEvent(new CustomEvent("ashen:language",{detail:next}))}};
  injectUI();document.addEventListener("click",e=>{const b=e.target.closest("[data-lang]");if(b)window.AshenI18n.setLanguage(b.dataset.lang)});
  window.addEventListener("DOMContentLoaded",apply);apply();
})();