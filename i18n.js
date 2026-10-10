(() => {
  const languages = ['en','vi','ja','ko','zh'];
  const translationRows = [["World","Thế giới","世界","세계","世界"],["Combat","Chiến đấu","戦闘","전투","战斗"],["Systems","Hệ thống","システム","시스템","系统"],["Progression","Tiến trình","成長","성장","成长"],["Controls","Điều khiển","操作","조작","操作"],["Account / Sign in","Tài khoản / Đăng nhập","アカウント / ログイン","계정 / 로그인","账户 / 登录"],["ACCOUNT / SIGN IN","TÀI KHOẢN / ĐĂNG NHẬP","アカウント / ログイン","계정 / 로그인","账户 / 登录"],["Play Story Demo","Chơi bản demo","ストーリーデモをプレイ","스토리 데모 플레이","剧情试玩"],["DARK FANTASY ARPG · FIRST CHAPTER PLAYABLE","ARPG giả tưởng đen tối · Chương đầu có thể chơi","ダークファンタジーARPG · 第1章プレイ可能","다크 판타지 ARPG · 첫 번째 챕터 플레이 가능","黑暗奇幻动作角色扮演 · 第一章可玩"],["A village was erased from the Crown’s record. The last ember carries its names. Cross the hamlet, face the keeper beneath Hollow, and decide what the sanctuary will remember.","Một ngôi làng đã bị xóa khỏi sử ký của Vương Miện. Tàn lửa cuối cùng vẫn giữ tên của họ. Hãy băng qua thôn làng, đối mặt với người canh giữ bên dưới Hollow và quyết định Thánh Địa sẽ ghi nhớ điều gì.","ある村は王冠の記録から消された。最後の残り火はその名を抱いている。集落を越え、Hollowの地下の番人と対峙し、聖域に何を記憶させるかを決めよう。","한 마을이 왕관의 기록에서 지워졌다. 마지막 잔불은 그들의 이름을 품고 있다. 마을을 지나 Hollow 아래의 수호자와 맞서고 성소가 무엇을 기억할지 결정하라.","一个村庄被从王冠的记录中抹去。最后的余烬承载着他们的名字。穿过村庄，面对 Hollow 地底的守护者，并决定圣所将铭记什么。"],["Enter the story demo","Vào bản demo cốt truyện","ストーリーデモに入る","스토리 데모 시작","进入剧情试玩"],["Enter the world","Khám phá thế giới","世界へ進む","세계로 들어가기","进入世界"],["Playable chapter","Chương có thể chơi","プレイ可能な章","플레이 가능한 챕터","可玩章节"],["Chapter endings","Kết thúc chương","章のエンディング","챕터 엔딩","章节结局"],["Site languages","Ngôn ngữ website","サイトの言語","사이트 언어","网站语言"],["LOCAL","CỤC BỘ","ローカル","로컬","本地"],["Device save","Lưu trên thiết bị","端末セーブ","기기 저장","设备存档"],["WORLD STATE","TRẠNG THÁI THẾ GIỚI","世界の状態","세계 상태","世界状态"],["Story cycle · 08","Mạch truyện · 08","物語の輪 · 08","스토리 사이클 · 08","故事循环 · 08"],["LEGACY","DI SẢN","遺産","유산","传承"],["ASCENDANT","THĂNG HOA","昇華","승천","升华"],["Persistent progression","Tiến trình lâu dài","継続する成長","지속적인 성장","持续成长"],["01 — THE LAST EMBER","01 — TÀN LỬA CUỐI CÙNG","01 — 最後の残り火","01 — 마지막 잔불","01 — 最后的余烬"],["BUILD / ETERNAL WORLD","BẢN DỰNG / THẾ GIỚI VĨNH HẰNG","ビルド / 永遠の世界","빌드 / 영원의 세계","版本 / 永恒世界"],["SCROLL TO DESCEND","CUỘN ĐỂ ĐI TIẾP","スクロールして進む","스크롤하여 내려가기","向下滚动"],["A WORLD THAT REMEMBERS","THẾ GIỚI BIẾT GHI NHỚ","記憶する世界","기억하는 세계","铭记一切的世界"],["One ember.","Một đốm lửa.","ひとつの残り火。","하나의 잔불.","一簇余烬。"],["A village erased.","Một ngôi làng bị xóa sổ.","消された村。","지워진 마을.","被抹去的村庄。"],["A bell beneath Hollow holds the names the Crown removed from history. Lyra wants the sanctuary protected. Orren has cut the road from his map. The first chapter ends with your choice about who gets to remember.","Chiếc chuông dưới Hollow lưu giữ những cái tên mà Vương Miện đã xóa khỏi lịch sử. Lyra muốn bảo vệ Thánh Địa. Orren đã xóa con đường khỏi bản đồ. Chương đầu kết thúc bằng lựa chọn của bạn: ai sẽ được quyền ghi nhớ.","Hollowの地下の鐘は、王冠が歴史から消した名前を抱えている。Lyraは聖域を守りたい。Orrenは地図から道を切り取った。第1章は、誰に記憶を残すかというあなたの選択で終わる。","Hollow 아래의 종은 왕관이 역사에서 지운 이름을 간직하고 있다. Lyra는 성소를 지키려 하고, Orren은 지도에서 길을 잘라냈다. 첫 챕터는 누가 기억할 수 있을지에 대한 당신의 선택으로 끝난다.","Hollow 地底的钟保存着王冠从历史中抹去的名字。Lyra 希望圣所得到保护。Orren 从地图上删掉了那条路。第一章将以你的选择结束：谁有资格被铭记。"],["Explore the game systems","Khám phá hệ thống game","ゲームシステムを見る","게임 시스템 살펴보기","探索游戏系统"],["03 / WORLD MAP","03 / BẢN ĐỒ THẾ GIỚI","03 / ワールドマップ","03 / 월드 맵","03 / 世界地图"],["Walk deeper","Đi sâu hơn","さらに奥へ","더 깊이 들어가","深入"],["into the","vào","灰の中へ","잿더미 속으로","进入"],["ashes.","tàn tro.","灰の世界。","잿더미.","灰烬。"],["From the Ashen March to the Starless Depths, each act introduces new goals, characters and discoveries.","Từ Biên Địa Tro Tàn đến Vực Thẳm Không Sao, mỗi hồi mở ra mục tiêu, nhân vật và khám phá mới.","灰燼の辺境から星なき深淵まで、各幕で新たな目標、人物、発見が待っている。","잿빛 변경부터 별 없는 심연까지, 각 막마다 새로운 목표와 인물, 발견이 등장한다.","从灰烬边境到无星深渊，每一幕都会带来新的目标、角色与发现。"],["Selected","Đã chọn","選択中","선택됨","已选择"],["Selected · Prologue — The First Spark","Đã chọn · Mở đầu — Tia lửa đầu tiên","選択中 · 序章 — 最初の火花","선택됨 · 프롤로그 — 첫 불꽃","已选择 · 序章 — 第一簇火花"],["Prologue","Mở đầu","序章","프롤로그","序章"],["THE FIRST SPARK","TIA LỬA ĐẦU TIÊN","最初の火花","첫 불꽃","第一簇火花"],["Ashen March","Biên Địa Tro Tàn","灰燼の辺境","잿빛 변경","灰烬边境"],["THE BROKEN ROAD","CON ĐƯỜNG GÃY ĐỔ","壊れた道","부서진 길","破碎之路"],["Hollow Kingdom","Vương Quốc Hollow","ホロウ王国","할로우 왕국","空洞王国"],["A CROWN WITHOUT A KING","VƯƠNG MIỆN KHÔNG VUA","王なき王冠","왕 없는 왕관","无王之冠"],["Veil Sea","Biển Màn Sương","ヴェールの海","장막의 바다","帷幕之海"],["BEYOND THE MIST","BÊN KIA MÀN SƯƠNG","霧の向こう","안개 너머","迷雾之外"],["Crownlands","Vùng Đất Vương Miện","王冠領","왕관령","王冠领地"],["THE OLD THRONE","NGÔI VUA CŨ","古き玉座","옛 왕좌","古老王座"],["Starless Depths","Vực Thẳm Không Sao","星なき深淵","별 없는 심연","无星深渊"],["WHERE LIGHT ENDS","NƠI ÁNH SÁNG TẮT","光が尽きる場所","빛이 끝나는 곳","光明终结之处"],["Last Ember","Tàn Lửa Cuối Cùng","最後の残り火","마지막 잔불","最后的余烬"],["THE FINAL FIRE","NGỌN LỬA CUỐI CÙNG","最後の炎","마지막 불꽃","最后之火"],["New Game+","Chơi mới+","ニューゲーム+","뉴 게임+","新游戏+"],["BEGIN AGAIN","BẮT ĐẦU LẠI","再び始める","다시 시작","重新开始"],["04 / ADVENTURE","04 / PHIÊU LƯU","04 / 冒険","04 / 모험","04 / 冒险"],["Learn the rhythm.","Nắm bắt nhịp chiến đấu.","戦いのリズムを掴め。","전투의 리듬을 익혀라.","掌握战斗节奏。"],["Weight, timing and readable feedback turn every encounter into a conversation between pressure and patience.","Sức nặng, thời điểm và phản hồi rõ ràng biến mỗi trận chiến thành cuộc đấu giữa áp lực và kiên nhẫn.","重み、タイミング、分かりやすい反応によって、戦闘は圧力と忍耐の対話になる。","무게감, 타이밍, 명확한 피드백이 모든 전투를 압박과 인내의 대화로 만든다.","打击感、时机与清晰反馈，让每场遭遇都成为压力与耐心的较量。"],["Committed attacks","Đòn đánh có cam kết","隙のある攻撃","빈틈이 있는 공격","有承诺窗口的攻击"],["Light chains, charged attacks and abilities are built around clear commitment windows.","Chuỗi đòn nhẹ, đòn nặng tích lực và kỹ năng đều có khoảng ra đòn rõ ràng.","軽攻撃の連携、溜め攻撃、アビリティには明確な硬直時間がある。","약공격 연계, 차지 공격, 스킬에는 명확한 후딜 구간이 있다.","轻攻击连段、蓄力攻击和技能都有明确的出招窗口。"],["IMPACT / 82","SÁT THƯƠNG / 82","衝撃 / 82","충격 / 82","冲击 / 82"],["Defense timing","Canh thời điểm phòng thủ","防御のタイミング","방어 타이밍","防御时机"],["Block, parry or dodge. Precision creates openings without removing risk.","Đỡ, đỡ phản công hoặc né tránh. Chính xác tạo ra cơ hội nhưng không xóa bỏ rủi ro.","ガード、パリィ、回避。正確な判断で反撃の隙を作るが、危険は残る。","막기, 패링, 회피. 정확한 대응은 기회를 만들지만 위험 자체를 없애진 않는다.","格挡、弹反或闪避。精准操作能创造反击机会，但风险依然存在。"],["Poise & stagger","Thăng bằng & choáng","強靭度と怯み","강인도와 경직","韧性与硬直"],["Pressure changes the state of a fight. Break an enemy's rhythm and take the opening.","Áp lực làm thay đổi cục diện. Phá nhịp đối thủ và tận dụng sơ hở.","圧力が戦況を変える。敵のリズムを崩し、隙を突こう。","압박은 전투의 흐름을 바꾼다. 적의 리듬을 무너뜨리고 빈틈을 노려라.","压力会改变战局。打乱敌人的节奏，抓住破绽。"],["WARDEN","HỘ VỆ","番人","수호자","守卫者"],["POISE 36%","THĂNG BẰNG 36%","強靭度 36%","강인도 36%","韧性 36%"],["Bosses that evolve","Boss biết biến đổi","進化するボス","진화하는 보스","不断进化的首领"],["Multi-phase encounters, enrage states, ranged threats and environmental hazards shift priorities instead of simply inflating health.","Nhiều giai đoạn, trạng thái cuồng nộ, đòn tầm xa và hiểm họa môi trường buộc bạn đổi chiến thuật thay vì chỉ tăng máu boss.","複数フェーズ、激昂状態、遠距離攻撃、環境の危険が戦術を変え、単に体力を増やすだけではない。","여러 페이즈, 격노 상태, 원거리 위협과 환경 위험이 전술을 바꾸게 하며 단순히 체력만 늘리지 않는다.","多阶段战斗、狂暴状态、远程威胁和环境危险会改变作战重点，而不是单纯增加首领血量。"],["05 / GAME SYSTEMS","05 / HỆ THỐNG GAME","05 / ゲームシステム","05 / 게임 시스템","05 / 游戏系统"],["Everything","Mọi thứ","すべてが","모든 것이","一切"],["feeds the","đều góp sức cho","旅へとつながる","여정으로 이어진다","汇入"],["journey.","hành trình.","旅。","여정.","旅程。"],["Combat, exploration, quests, crafting, reputation, codex and long-term progression are designed to share one persistent world state.","Chiến đấu, khám phá, nhiệm vụ, chế tạo, danh tiếng, bách khoa thư và tiến trình dài hạn cùng chia sẻ trạng thái thế giới lưu bền vững.","戦闘、探索、クエスト、クラフト、評判、コーデックス、長期成長がひとつの永続的な世界状態を共有する。","전투, 탐험, 퀘스트, 제작, 평판, 도감과 장기 성장 시스템은 하나의 영구적인 월드 상태를 공유하도록 설계됐다.","战斗、探索、任务、制作、声望、图鉴和长期成长共享同一持久世界状态。"],["Character","Nhân vật","キャラクター","캐릭터","角色"],["3D appearance · presets · cosmetics","Ngoại hình 3D · mẫu · trang phục","3D外見 · プリセット · コスメ","3D 외형 · 프리셋 · 꾸미기","3D 外观 · 预设 · 装饰"],["READY","SẴN SÀNG","準備完了","준비 완료","就绪"],["Questing","Nhiệm vụ","クエスト","퀘스트","任务"],["NPC dialogue · objectives · story flags","Đối thoại NPC · mục tiêu · cờ cốt truyện","NPC会話 · 目標 · ストーリーフラグ","NPC 대화 · 목표 · 스토리 플래그","NPC 对话 · 目标 · 剧情标记"],["XP · Essence · Prestige · Skills","EXP · Tinh Túy · Uy Danh · Kỹ năng","経験値 · エッセンス · 名声 · スキル","경험치 · 정수 · 명성 · 스킬","经验 · 精华 · 威望 · 技能"],["LIVE","ĐANG HOẠT ĐỘNG","稼働中","라이브","运行中"],["Regions · reputation · codex · events","Khu vực · danh tiếng · bách khoa thư · sự kiện","地域 · 評判 · コーデックス · イベント","지역 · 평판 · 도감 · 이벤트","区域 · 声望 · 图鉴 · 事件"],["Endgame","Hậu kỳ","エンドゲーム","엔드게임","终局内容"],["Contracts · Journey · Legacy · Expeditions","Khế ước · Hành trình · Di sản · Thám hiểm","契約 · 旅路 · 遺産 · 遠征","계약 · 여정 · 유산 · 원정","契约 · 旅程 · 传承 · 远征"],["Cloud","Đám mây","クラウド","클라우드","云端"],["Supabase account · persistent saves","Tài khoản Supabase · lưu game lâu dài","Supabaseアカウント · 永続セーブ","Supabase 계정 · 영구 저장","Supabase 账户 · 持久存档"],["SETUP REQUIRED","CẦN THIẾT LẬP","設定が必要","설정 필요","需要配置"],["06 / 3D RELIC CHAMBER","06 / PHÒNG DI VẬT 3D","06 / 3D遺物の間","06 / 3D 유물실","06 / 3D 遗物室"],["Inspect the ember.","Quan sát tàn lửa.","残り火を観察する。","잔불을 살펴보자.","观察余烬。"],["Rotate · zoom · explore the interactive presentation.","Xoay · thu phóng · khám phá mô hình tương tác.","回転 · ズーム · インタラクティブ展示を探索。","회전 · 확대 · 인터랙티브 전시 탐험.","旋转 · 缩放 · 探索交互式展示。"],["ASHEN CROWN","ASHEN CROWN","ASHEN CROWN","ASHEN CROWN","ASHEN CROWN"],["WEBGL · ORBIT CONTROLS · GLB READY","WEBGL · ĐIỀU KHIỂN QUỸ ĐẠO · GLB SẴN SÀNG","WEBGL · オービット操作 · GLB対応","WEBGL · 궤도 조작 · GLB 준비","WEBGL · 轨道控制 · GLB 就绪"],["DRAG TO ROTATE","KÉO ĐỂ XOAY","ドラッグして回転","드래그하여 회전","拖动旋转"],["SCROLL TO ZOOM","CUỘN ĐỂ PHÓNG TO","スクロールしてズーム","스크롤하여 확대","滚动缩放"],["07 / ETERNAL PROGRESSION","07 / TIẾN TRÌNH VĨNH HẰNG","07 / 永続的な成長","07 / 영원한 성장","07 / 永恒成长"],["There is always","Luôn có","いつでもある","언제나 있다","总有"],["another horizon.","một chân trời mới.","次の地平線が。","또 다른 지평선이.","另一个新地平线。"],["Build a character, then build a legacy. Your progression continues beyond the main campaign.","Xây dựng nhân vật, rồi tạo nên di sản. Tiến trình vẫn tiếp tục sau chiến dịch chính.","キャラクターを育て、遺産を築こう。成長はメインキャンペーンの後も続く。","캐릭터를 키우고 유산을 남겨라. 성장은 메인 캠페인 이후에도 계속된다.","培养角色，建立传承。主线战役结束后，成长之路仍将继续。"],["LEVEL","CẤP ĐỘ","レベル","레벨","等级"],["XP and Essence power a persistent character journey.","EXP và Tinh Túy thúc đẩy hành trình nhân vật lâu dài.","経験値とエッセンスが継続的な成長を支える。","경험치와 정수가 지속적인 캐릭터 여정을 뒷받침한다.","经验与精华推动持久的角色成长。"],["Long-term progression carries your choices forward.","Tiến trình dài hạn lưu giữ những lựa chọn của bạn.","長期成長が選択を未来へ引き継ぐ。","장기 성장은 선택을 다음 여정으로 이어간다.","长期成长会延续你的选择。"],["EXPEDITIONS","THÁM HIỂM","遠征","원정","远征"],["Escalating tiers create repeatable endgame goals.","Các bậc thử thách tăng dần tạo mục tiêu hậu kỳ có thể lặp lại.","段階的に上がる難易度が繰り返し挑める目標を生む。","점점 높아지는 단계가 반복 가능한 엔드게임 목표를 만든다.","逐步提升的难度带来可重复挑战的终局目标。"],["COLLECTION","BỘ SƯU TẬP","コレクション","수집","收藏"],["Discoveries feed lore, cosmetics and future systems.","Khám phá mới bổ sung truyền thuyết, ngoại hình và hệ thống tương lai.","発見は伝承、コスメ、今後のシステムにつながる。","발견은 세계관, 꾸미기 요소와 향후 시스템으로 이어진다.","探索发现将扩展背景故事、外观和未来系统。"],["08 / STORY DEMO FIELD NOTES","08 / GHI CHÚ DEMO CỐT TRUYỆN","08 / ストーリーデモ操作メモ","08 / 스토리 데모 안내","08 / 剧情试玩操作说明"],["Controls at a glance.","Tóm tắt điều khiển.","操作一覧。","조작 한눈에 보기.","快速查看操作。"],["Play the story demo →","Chơi demo cốt truyện →","ストーリーデモをプレイ →","스토리 데모 플레이 →","开始剧情试玩 →"],["Move","Di chuyển","移動","이동","移动"],["Walk around the sanctuary and wilds","Di chuyển quanh Thánh Địa và vùng hoang dã","聖域と荒野を移動する","성소와 황야를 이동","在圣所与荒野中移动"],["Look","Quan sát","視点操作","시점","观察"],["Rotate the camera","Xoay camera","カメラを回転","카메라 회전","旋转镜头"],["Sprint","Chạy nhanh","ダッシュ","질주","冲刺"],["Consumes stamina","Tiêu hao thể lực","スタミナを消費","스태미나 소모","消耗耐力"],["Ember Pulse","Xung Tàn Lửa","残り火の波動","잔불 파동","余烬脉冲"],["Short-range attack · costs stamina","Đòn cận chiến · tiêu hao thể lực","近距離攻撃 · スタミナ消費","근거리 공격 · 스태미나 소모","近距离攻击 · 消耗耐力"],["Dodge","Né tránh","回避","회피","闪避"],["Evade a shade’s telegraphed strike","Né đòn báo trước của bóng ma","影の予告攻撃を回避","그림자의 예고 공격 회피","躲避暗影的预警攻击"],["E","E","E","E","E"],["Inventory","Túi đồ","インベントリ","인벤토리","背包"],["Open your pack, compare loot and equip gear","Mở túi, so sánh chiến lợi phẩm và trang bị đồ","持ち物を開き、戦利品を比べて装備する","가방을 열어 전리품을 비교하고 장비를 착용","打开背包、比较战利品并装备物品"],["G","G","G","G","G"],["Interact","Tương tác","調べる","상호작용","互动"],["Talk to NPCs, gather resources and use routes","Nói chuyện với NPC, thu thập tài nguyên và sử dụng lối đi","NPCとの会話、資源の採集、道の利用","NPC 대화, 자원 채집, 길 이용","与 NPC 对话、收集资源并使用路线"],["I / M","I / M","I / M","I / M","I / M"],["Inventory / Map","Túi đồ / Bản đồ","インベントリ / マップ","인벤토리 / 지도","背包 / 地图"],["I remains as an inventory shortcut","I vẫn là phím tắt mở túi đồ","Iキーでもインベントリを開ける","I 키로도 인벤토리를 열 수 있다","I 仍可作为背包快捷键"],["J / K / ESC","J / K / ESC","J / K / ESC","J / K / ESC","J / K / ESC"],["Journal / Archive / Pause","Nhật ký / Lưu trữ / Tạm dừng","日誌 / アーカイブ / 一時停止","일지 / 기록 보관소 / 일시정지","日志 / 档案 / 暂停"],["Review the journey or pause the game","Xem lại hành trình hoặc tạm dừng game","旅を振り返るかゲームを一時停止","여정을 살펴보거나 게임 일시정지","回顾旅程或暂停游戏"],["THE FIRE IS NOT GONE.","NGỌN LỬA CHƯA TẮT.","炎はまだ消えていない。","불꽃은 아직 꺼지지 않았다.","火焰尚未熄灭。"],["It is waiting","Nó đang chờ","それは待っている","그 불꽃은 기다리고 있다","它正在等待"],["for a hand.","một bàn tay.","手が伸びるのを。","손길을.","一只伸来的手。"],["View source ↗","Xem mã nguồn ↗","ソースを見る ↗","소스 보기 ↗","查看源代码 ↗"],["ASHEN CROWN / THE LAST EMBER","ASHEN CROWN / TÀN LỬA CUỐI CÙNG","ASHEN CROWN / 最後の残り火","ASHEN CROWN / 마지막 잔불","ASHEN CROWN / 最后的余烬"],["UNITY · DARK FANTASY · ETERNAL WORLD","UNITY · GIẢ TƯỞNG ĐEN TỐI · THẾ GIỚI VĨNH HẰNG","UNITY · ダークファンタジー · 永遠の世界","UNITY · 다크 판타지 · 영원의 세계","UNITY · 黑暗奇幻 · 永恒世界"],["Your journey","Hành trình của bạn","あなたの旅","당신의 여정","你的旅程"],["PLAYER ACCOUNT","TÀI KHOẢN NGƯỜI CHƠI","プレイヤーアカウント","플레이어 계정","玩家账户"],["Create your account","Tạo tài khoản","アカウントを作成","계정 만들기","创建账户"],["Return to the ashes","Trở về tro tàn","灰の世界へ戻る","잿더미로 돌아가기","重返灰烬"],["SIGN IN","ĐĂNG NHẬP","ログイン","로그인","登录"],["CREATE ACCOUNT","TẠO TÀI KHOẢN","アカウント作成","계정 만들기","创建账户"],["Forgot password?","Quên mật khẩu?","パスワードをお忘れですか？","비밀번호를 잊으셨나요?","忘记密码？"],["Set a new password","Đặt mật khẩu mới","新しいパスワードを設定","새 비밀번호 설정","设置新密码"],["UPDATE PASSWORD","CẬP NHẬT MẬT KHẨU","パスワードを更新","비밀번호 업데이트","更新密码"],["Your cloud save is private to your account. Never share your password. Supabase row-level security restricts save access by authenticated user.","Bản lưu đám mây chỉ thuộc tài khoản của bạn. Không chia sẻ mật khẩu. RLS của Supabase giới hạn quyền truy cập bản lưu theo người dùng đã xác thực.","クラウドセーブはアカウント専用です。パスワードを共有しないでください。Supabaseの行レベルセキュリティがユーザーごとにセーブへのアクセスを制限します。","클라우드 저장은 계정 전용입니다. 비밀번호를 공유하지 마세요. Supabase 행 수준 보안이 인증 사용자별 저장 접근을 제한합니다.","云存档仅属于你的账户。切勿分享密码。Supabase 行级安全策略会按已认证用户限制存档访问。"]];
  translationRows.push(['THE LAST EMBER','TÀN LỬA CUỐI CÙNG','最後の残り火','마지막 잔불','最后的余烬']);
  translationRows.push(
    ['ASHEN CROWN · PLAYER ACCOUNT','ASHEN CROWN · TÀI KHOẢN NGƯỜI CHƠI','ASHEN CROWN · プレイヤーアカウント','ASHEN CROWN · 플레이어 계정','ASHEN CROWN · 玩家账户'],
    ['Email','Email','メールアドレス','이메일','电子邮箱'],
    ['Password','Mật khẩu','パスワード','비밀번호','密码'],
    ['PLEASE WAIT…','ĐANG XỬ LÝ…','お待ちください…','잠시만 기다려 주세요…','请稍候…'],
    ['Account connected.','Đã kết nối tài khoản.','アカウントに接続しました。','계정이 연결되었습니다.','账户已连接。'],
    ['Signed in. Syncing your journey…','Đã đăng nhập. Đang đồng bộ hành trình…','ログインしました。旅を同期しています…','로그인되었습니다. 여정을 동기화하는 중…','已登录，正在同步旅程…'],
    ['Account created. Check your email to confirm it, then sign in here.','Đã tạo tài khoản. Hãy xác nhận qua email rồi đăng nhập tại đây.','アカウントを作成しました。メールを確認してからログインしてください。','계정이 생성되었습니다. 이메일을 확인한 뒤 로그인하세요.','账户已创建。请检查邮箱完成确认，然后在此登录。'],
    ['Account created and signed in.','Đã tạo tài khoản và đăng nhập.','アカウントを作成し、ログインしました。','계정을 만들고 로그인했습니다.','账户已创建并登录。'],
    ['Enter a valid email address.','Vui lòng nhập địa chỉ email hợp lệ.','有効なメールアドレスを入力してください。','유효한 이메일 주소를 입력하세요.','请输入有效的电子邮箱地址。'],
    ['Use a password with at least 8 characters.','Mật khẩu cần có ít nhất 8 ký tự.','パスワードは8文字以上にしてください。','비밀번호는 8자 이상이어야 합니다.','密码至少需要 8 个字符。'],
    ['Enter your email above first.','Trước tiên hãy nhập email ở trên.','先に上の欄にメールアドレスを入力してください。','먼저 위에 이메일을 입력하세요.','请先在上方输入邮箱。'],
    ['If the address belongs to an account, a password reset email will be sent.','Nếu email thuộc về một tài khoản, hướng dẫn đặt lại mật khẩu sẽ được gửi đến đó.','アカウントに登録されている場合、パスワード再設定メールが送信されます。','계정에 등록된 이메일이라면 비밀번호 재설정 메일이 전송됩니다.','如果该邮箱对应某个账户，将收到密码重置邮件。'],
    ['Signed out. Your local browser save remains on this device.','Đã đăng xuất. Bản lưu cục bộ vẫn ở trên thiết bị này.','ログアウトしました。ローカルセーブはこの端末に残ります。','로그아웃했습니다. 로컬 저장은 이 기기에 남아 있습니다.','已退出登录。本地存档仍保留在此设备上。'],
    ['Sign in to sync your save.','Đăng nhập để đồng bộ bản lưu.','セーブを同期するにはログインしてください。','저장 데이터를 동기화하려면 로그인하세요.','登录以同步存档。'],
    ['Signed in as','Đã đăng nhập với tài khoản','ログイン中：','로그인 계정:','当前登录：'],
    ['. Your browser save will sync to your private cloud slot.','。浏览器存档将同步到你的私人云存档位。','。ブラウザーのセーブは個人用クラウド枠に同期されます。','。브라우저 저장 데이터가 개인 클라우드 슬롯과 동기화됩니다.','。你的浏览器存档将同步到专属云端存档位。']
  );
  const lookup = Object.fromEntries(languages.map((code,index)=>[
    code, Object.fromEntries(translationRows.map(row=>[row[0], row[index] ?? row[0]]))
  ]));
  const languageTitles = {
    en:{title:'Ashen Crown — The Last Ember',description:'Ashen Crown: The Last Ember — a dark fantasy 3D action RPG.',navigation:'Main navigation',language:'Language'},
    vi:{title:'Ashen Crown — Tàn Lửa Cuối Cùng',description:'Ashen Crown: Tàn Lửa Cuối Cùng — game nhập vai hành động 3D giả tưởng đen tối.',navigation:'Điều hướng chính',language:'Ngôn ngữ'},
    ja:{title:'Ashen Crown — 最後の残り火',description:'Ashen Crown: 最後の残り火 — ダークファンタジー3DアクションRPG。',navigation:'メインナビゲーション',language:'言語'},
    ko:{title:'Ashen Crown — 마지막 잔불',description:'Ashen Crown: 마지막 잔불 — 다크 판타지 3D 액션 RPG.',navigation:'주요 탐색',language:'언어'},
    zh:{title:'Ashen Crown — 最后的余烬',description:'Ashen Crown：最后的余烬 — 黑暗奇幻 3D 动作角色扮演游戏。',navigation:'主导航',language:'语言'}
  };
  let language = 'en';
  try {
    const saved = localStorage.getItem('ashen.language');
    const browser = (navigator.language || 'en').slice(0,2).toLowerCase();
    language = languages.includes(saved) ? saved : (languages.includes(browser) ? browser : 'en');
  } catch {}
  const sourceText = new WeakMap();
  const textOf = node => sourceText.get(node) ?? node.nodeValue;
  function localize(value) {
    const dictionary = lookup[language] || lookup.en;
    return Object.prototype.hasOwnProperty.call(dictionary, value) ? dictionary[value] : value;
  }
  function preserveWhitespace(original, translated) {
    const lead = (original.match(/^\s*/) || [''])[0];
    const trail = (original.match(/\s*$/) || [''])[0];
    return lead + translated + trail;
  }
  function injectUI() {
    const header = document.querySelector('.site-header');
    if (!header || header.querySelector('.lang-switch')) return;
    let box = header.querySelector('.header-tools');
    if (!box) {
      box = document.createElement('div');
      box.className = 'header-tools';
      header.appendChild(box);
    }
    box.innerHTML = '<div class="lang-switch" role="group" aria-label="Language">' +
      '<button type="button" data-lang="en" aria-label="English" aria-pressed="false">EN</button>' +
      '<button type="button" data-lang="vi" aria-label="Vietnamese" aria-pressed="false">VI</button>' +
      '<button type="button" data-lang="ja" aria-label="Japanese" aria-pressed="false">JA</button>' +
      '<button type="button" data-lang="ko" aria-label="Korean" aria-pressed="false">KO</button>' +
      '<button type="button" data-lang="zh" aria-label="Chinese" aria-pressed="false">中文</button>' +
      '</div>';
  }
  function translateTextNodes(root = document.body) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT)$/i.test(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (!sourceText.has(node)) sourceText.set(node, node.nodeValue);
      const original = sourceText.get(node);
      const key = original.trim();
      const translated = localize(key);
      if (translated !== key) node.nodeValue = preserveWhitespace(original, translated);
      else if (node.nodeValue !== original && language === 'en') node.nodeValue = original;
    }
  }
  function applyLanguage() {
    const ui = languageTitles[language] || languageTitles.en;
    document.documentElement.lang = language;
    document.title = ui.title;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = ui.description;
    const nav = document.querySelector('#main-nav');
    if (nav) nav.setAttribute('aria-label', ui.navigation);
    const menu = document.querySelector('.menu');
    if (menu) menu.setAttribute('aria-label', language === 'en' ? 'Open navigation' : ({
      vi:'Mở menu điều hướng',ja:'ナビゲーションを開く',ko:'탐색 메뉴 열기',zh:'打开导航菜单'
    }[language]));
    const languageSwitch = document.querySelector('.lang-switch');
    if (languageSwitch) languageSwitch.setAttribute('aria-label', ui.language);
    translateTextNodes();
    document.querySelectorAll('[data-lang]').forEach(button => {
      const active = button.dataset.lang === language;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const activeAct = document.querySelector('.act.active');
    const selection = document.querySelector('#actSelection');
    if (activeAct && selection) {
      const actName = activeAct.querySelector('span')?.textContent.trim() || 'Act';
      const actTitle = activeAct.querySelector('small')?.textContent.trim() || '';
      const desired = localize('Selected') + ' · ' + actName + ' — ' + actTitle;
      if (selection.textContent !== desired) selection.textContent = desired;
    }
  }
  function setLanguage(next) {
    if (!languages.includes(next)) return;
    language = next;
    try { localStorage.setItem('ashen.language', next); } catch {}
    applyLanguage();
    window.dispatchEvent(new CustomEvent('ashen:language', {detail: next}));
  }
  window.AshenI18n = {
    get language() { return language; },
    setLanguage,
    t: localize,
    apply: applyLanguage
  };
  injectUI();
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-lang]');
    if (button) setLanguage(button.dataset.lang);
    if (event.target.closest('.act')) requestAnimationFrame(applyLanguage);
  });
  applyLanguage();
  const observer = new MutationObserver(records => {
    if (records.some(record => record.type === 'childList')) requestAnimationFrame(applyLanguage);
  });
  observer.observe(document.body, {childList:true,subtree:true});
})();