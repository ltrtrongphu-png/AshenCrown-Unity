using System;
using System.Collections.Generic;
using UnityEngine;

namespace AshenCrown.Localization
{
    public sealed class LocalizationService:MonoBehaviour
    {
        public enum Language{English,Vietnamese,Japanese,Korean,ChineseSimplified}
        public static LocalizationService Instance{get;private set;}
        public Language CurrentLanguage{get;private set;}=Language.English;
        public event Action LanguageChanged;
        readonly Dictionary<string,string[]> table=new Dictionary<string,string[]>
        {
            {"ui.play",new[]{"Play Combat Trial","Chơi thử chiến đấu","戦闘トライアル","전투 시험","开始战斗试炼"}},
            {"ui.settings",new[]{"Settings","Cài đặt","設定","설정","设置"}},
            {"ui.resume",new[]{"Resume","Tiếp tục","再開","계속","继续"}},
            {"ui.pause",new[]{"Trial Paused","Đã tạm dừng","一時停止","일시정지","已暂停"}},
            {"ui.defeat",new[]{"Defeat the Warden","Đánh bại Warden","ウォーデンを倒せ","워든 처치","击败守卫者"}},
            {"ui.ready",new[]{"Ready","Sẵn sàng","準備完了","준비 완료","准备就绪"}},
            {"combat.move",new[]{"Move","Di chuyển","移動","이동","移动"}},
            {"combat.dodge",new[]{"Dodge","Né","回避","회피","闪避"}},
            {"combat.guard",new[]{"Guard / Parry","Đỡ / Đỡ hoàn hảo","ガード / パリィ","가드 / 패리","格挡 / 弹反"}},
            {"skill.ashen_edge",new[]{"Ashen Edge","Lưỡi Tro Tàn","灰の刃","잿빛 칼날","灰烬之刃"}},
            {"skill.void_step",new[]{"Void Step","Bước Hư Không","虚無の歩み","공허의 발걸음","虚空步"}},
            {"skill.ember_guard",new[]{"Ember Guard","Hộ Vệ Tàn Lửa","残火の守り","잿불 수호","余烬守护"}},
            {"skill.crown_breaker",new[]{"Crown Breaker","Phá Vương Miện","王冠砕き","왕관 파괴자","破冠者"}},
            {"npc.lyra.name",new[]{"Lyra","Lyra","リラ","릴라","莉拉"}},
            {"npc.lyra.hello",new[]{"The ember remembers you. Will you help me wake the sealed gate?","Tàn lửa vẫn nhớ ngươi. Giúp ta đánh thức cánh cổng phong ấn chứ?","残火はあなたを覚えている。封印された門を起こすのを手伝ってくれる？","잿불은 당신을 기억합니다. 봉인된 문을 깨우는 걸 도와줄래요?","余烬还记得你。愿意帮我唤醒封印之门吗？"}},
            {"npc.lyra.ember",new[]{"Every region hides a fragment of the Crown. Start with the gate.","Mỗi vùng đất đều giấu một mảnh Vương Miện. Hãy bắt đầu từ cánh cổng.","各地に王冠の欠片が眠る。まず門へ。","각 지역에는 왕관의 조각이 잠들어 있어요. 먼저 문으로.","每片土地都藏着王冠碎片。先从大门开始。"}},
            {"npc.orren.name",new[]{"Orren","Orren","オーレン","오렌","奥伦"}},
            {"npc.orren.hello",new[]{"The lower ruins are changing every cycle. Bring me what survives down there.","Phế tích bên dưới thay đổi theo từng chu kỳ. Mang cho ta những gì còn sót lại.","地下遺跡は周期ごとに変わる。残ったものを持ち帰れ。","지하 유적은 주기마다 변합니다. 남은 것을 가져오세요.","地下遗迹每个循环都会变化。把幸存的东西带回来。"}},
            {"npc.orren.forge",new[]{"The forge can turn rare fragments into permanent relics.","Lò rèn có thể biến những mảnh hiếm thành di vật vĩnh viễn.","鍛冶場は希少な欠片を永続する遺物に変えられる。","대장간은 희귀 조각을 영구 유물로 바꿀 수 있습니다.","熔炉可以把稀有碎片铸成永久遗物。"}},
            {"npc.seer.name",new[]{"The Seer","Nhà Tiên Tri","予言者","예언자","预言者"}},
            {"npc.seer.hello",new[]{"I have seen the Crown without a king. Its shadow points beyond this world.","Ta đã thấy Vương Miện không có vua. Bóng của nó chỉ tới nơi vượt ngoài thế giới này.","王なき王冠を見た。その影は世界の外を指している。","왕 없는 왕관을 보았습니다. 그 그림자는 세계 너머를 가리킵니다.","我见过没有君王的王冠。它的影子指向世界之外。"}},
            {"npc.seer.crown",new[]{"The Hollow King is only the first gate. What lies beyond will remember every cycle.","Hollow King chỉ là cánh cổng đầu tiên. Những gì phía sau sẽ nhớ mọi chu kỳ.","虚ろの王は最初の門に過ぎない。先にあるものは全周期を覚えている。","공허의 왕은 첫 번째 문일 뿐입니다. 너머의 존재는 모든 순환을 기억합니다.","空王只是第一道门。门后的存在会记住每一次轮回。"}},
            {"npc.choice.help",new[]{"Tell me more","Kể ta nghe","詳しく聞く","더 말해줘","告诉我更多"}},
            {"npc.choice.accept",new[]{"I will help","Ta sẽ giúp","手を貸す","돕겠습니다","我会帮忙"}},
            {"npc.choice.goodbye",new[]{"Not now","Để sau","また今度","나중에","下次再说"}},
            {"npc.choice.leave",new[]{"Leave","Rời đi","立ち去る","떠나기","离开"}},
            {"npc.choice.tell_more",new[]{"What did you see?","Ngươi đã thấy gì?","何を見た？","무엇을 봤죠?","你看到了什么？"}},
            {"quest.ember_awakens.title",new[]{"Ember Awakens","Tàn Lửa Thức Tỉnh","目覚める残火","깨어나는 잿불","余烬苏醒"}},
            {"quest.ember_awakens.desc",new[]{"Find the sealed gate and learn why the sanctuary still burns.","Tìm cánh cổng phong ấn và khám phá vì sao thánh địa vẫn cháy.","封印された門を探し、聖域の火が残る理由を知る。","봉인된 문을 찾아 성역의 불이 남은 이유를 알아내세요.","寻找封印之门，查明圣域之火为何仍在燃烧。"}},
            {"quest.echoes_below.title",new[]{"Echoes Below","Tiếng Vọng Bên Dưới","地下の残響","지하의 메아리","地下回响"}},
            {"quest.echoes_below.desc",new[]{"Explore the changing ruins and recover ember fragments.","Khám phá phế tích biến đổi và thu hồi các mảnh tàn lửa.","変化する遺跡を探索し、残火の欠片を集める。","변하는 유적을 탐험하고 잿불 조각을 모으세요.","探索变化的遗迹并回收余烬碎片。"}},
            {"quest.crownless_king.title",new[]{"The Crownless King","Vị Vua Không Vương Miện","王冠なき王","왕관 없는 왕","无冠之王"}},
            {"quest.crownless_king.desc",new[]{"Break the first cycle of the Hollow Kingdom and open the next region.","Phá vỡ chu kỳ đầu của Vương Quốc Rỗng và mở vùng đất tiếp theo.","虚ろの王国の最初の周期を断ち、次の地域を開く。","공허 왕국의 첫 순환을 끊고 다음 지역을 엽니다.","打破空王国的第一轮回，开启下一个区域。"}},
            {"quest.objective.talk",new[]{"Talk","Nói chuyện","会話する","대화","交谈"}},
            {"quest.objective.explore",new[]{"Explore","Khám phá","探索","탐험","探索"}},
            {"quest.objective.kill",new[]{"Defeat","Đánh bại","討伐","처치","击败"}},
            {"quest.objective.collect",new[]{"Collect","Thu thập","収集","수집","收集"}},
            {"quest.objective.boss",new[]{"Defeat the boss","Đánh bại trùm","ボスを倒す","보스를 처치","击败首领"}},
            {"contract.hunt",new[]{"Weekly Hunt","Săn hàng tuần","週間討伐","주간 사냥","每周狩猎"}},
            {"contract.story",new[]{"Weekly Story","Cốt truyện hàng tuần","週間ストーリー","주간 스토리","每周剧情"}},
            {"contract.explore",new[]{"Weekly Exploration","Khám phá hàng tuần","週間探索","주간 탐험","每周探索"}}
        };
        void Awake(){if(Instance!=null&&Instance!=this){Destroy(gameObject);return;}Instance=this;DontDestroyOnLoad(gameObject);CurrentLanguage=(Language)Mathf.Clamp(PlayerPrefs.GetInt("ashen.language",0),0,4);}
        public void SetLanguage(Language language){if(CurrentLanguage==language)return;CurrentLanguage=language;PlayerPrefs.SetInt("ashen.language",(int)language);PlayerPrefs.Save();LanguageChanged?.Invoke();}
        public void SetLanguage(string code){if(string.IsNullOrWhiteSpace(code))return;switch(code.Trim().ToLowerInvariant()){case "vi":SetLanguage(Language.Vietnamese);break;case "ja":SetLanguage(Language.Japanese);break;case "ko":SetLanguage(Language.Korean);break;case "zh":SetLanguage(Language.ChineseSimplified);break;default:SetLanguage(Language.English);break;}}
        public string Get(string key){if(!table.TryGetValue(key,out var values))return key;return values[Mathf.Clamp((int)CurrentLanguage,0,values.Length-1)];}
    }
}