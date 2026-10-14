# Phase 0 — Audit repository Ashen Crown

**Ngày audit:** 2026-10-14  
**Repository:** [ltrtrongphu-png/AshenCrown-Unity](https://github.com/ltrtrongphu-png/AshenCrown-Unity)  
**Nhánh báo cáo:** `phase-0-audit`  
**Commit nền được xem xét:** `ece3a4cb7b22d5309c6384af22d752dc6a50d43a` (`main`, 2026-10-10)  
**Phạm vi:** kiểm tra tĩnh cấu trúc repo và nội dung file trên GitHub. Phase này chỉ ghi nhận; không sửa logic/runtime.

## Phương pháp và giới hạn

- Đối chiếu cây file hiện tại với A1–A18 trong master prompt; đọc các file nguồn liên quan để xác nhận nhận định quan trọng.
- Đã thử `git ls-remote https://github.com/ltrtrongphu-png/AshenCrown-Unity.git HEAD`; môi trường trả về `Could not resolve host: github.com`. Vì không có working copy cục bộ, chưa thể chạy `node tools/build-web.mjs`, syntax-check toàn bộ source, `npm audit`, hay phục vụ trang từ `dist/`.
- Môi trường có Node.js `v22.16.0`, npm `10.9.2`, Chromium ở `/usr/bin/chromium`; không có Unity Editor hoặc .NET SDK.
- Không tuyên bố Unity compile, EditMode/PlayMode tests, browser smoke test, FPS, GPU/JS memory, Network 404 hoặc Lighthouse đã chạy.
- “Xác nhận” trong bảng nghĩa là bằng chứng tĩnh hỗ trợ nhận định; không đồng nghĩa đã xác minh hành vi runtime. Đếm `innerHTML` tự nó không chứng minh được lỗ hổng XSS.

## A1–A18: kết quả kiểm tra

| ID | Khu vực | Kết luận và bằng chứng | Cách tái hiện | Mức | Đề xuất | Công sức | Phase | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| A1 | Unity project | **Project Unity chưa hoàn chỉnh trong repo.** Không có `ProjectSettings/`, `Packages/`, scene `.unity`, hay file `.meta`; README cũng nói cần tạo project rồi nhập `Assets/` (`README.md`, phần trạng thái repo). | Liệt kê cây file và tìm các đường dẫn nói trên. | Blocker | Thiết lập project Unity 2021.3 LTS tái tạo được, manifest tối thiểu và scene mẫu; không commit `Library/`. | L | 2 | Xác nhận |
| A2 | Unity test | Chỉ thấy `Assets/Tests/EditMode/ProgressionReliabilityTests.cs`; không có `.asmdef`, test assembly hoặc fixture. | Tìm `*.asmdef`, `Assets/Tests/Fixtures/`, `tests/fixtures/`. | Blocker | Dựng test assembly và fixture trước khi mở rộng test; chạy EditMode trên Unity Editor/CI ở Phase 2. | M | 2 | Xác nhận |
| A3 | Logo web | HTML và service worker tham chiếu `./Assets/ashen-crown-logo.svg` (`index.html`, `sw.js`), nhưng file nguồn có đường dẫn `assets/ashen-crown-logo.svg`. **Build script hiện có fallback SVG** cho path viết hoa và phát cảnh báo; do đó kết luận trước đây “logo chắc chắn thiếu trong output” quá mạnh. Đường dẫn nguồn vẫn không thống nhất và fallback có thể che lỗi asset. | So sánh đường dẫn phân biệt hoa/thường; xem `optionalAssets` và nhánh fallback trong `tools/build-web.mjs`. | High | Dùng một path chuẩn chữ thường và kiểm tra output thật; asset quan trọng nên là required. | S | 1 | Đã khác |
| A4 | Backend `server/` | `server/package.json` chạy `node src/index.js`, nhưng repo chỉ có `server/package.json` và `server/.env.example`; không thấy `server/src/index.js`. | Đối chiếu script `start` và cây `server/`. | Med | Chủ repo cần chọn **hoàn thiện backend** hay **loại bỏ backend dang dở/dependency liên quan** trước Phase 1. Không tự chọn thay. | M/L | 1 | Xác nhận |
| A5 | Supabase schema | Migration duy nhất `supabase/migrations/001_ashen_crown_accounts.sql` tạo `player_saves`. Web gọi `player_web_saves` (`auth.js`); Unity cũng gọi `player_saves` (`SupabaseAuthService.cs`). Security review nói bảng web đã tồn tại trên project kết nối, nhưng repo không có migration để dựng lại bảng đó. Chưa kết luận bảng đang chạy trên Supabase bị thiếu. | So sánh tên bảng ở web, Unity, migrations và security review. | High | Thống nhất hợp đồng lưu giữa web/Unity/migration; thêm migration và kiểm tra RLS ở Phase 1. | M | 1 | Xác nhận |
| A6 | Animation plan | `docs/superpowers/plans/2026-10-04-animation-uiux-major-upgrade.md` mô tả `AnimationPresentationController`, `CombatPresentationFeedback`, `HUDPresentationSettings` và test; các file triển khai/test chưa có trong cây hiện tại. | Tìm các tên class/file theo plan và đối chiếu cây repo. | Med | Giữ plan là kế hoạch; triển khai theo TDD ở Phase 5, không mô tả như code đã có. | M | 5 | Xác nhận |
| A7 | Unity UI | Nhận định “toàn bộ UI dùng `OnGUI`” **không hoàn toàn đúng**: trong 10 file HUD được kiểm tra, 9 có `OnGUI`; `BossHealthBarUI.cs` không có. Các file còn dùng IMGUI gồm `CameraModeHUD.cs`, `DialogueOverlay.cs`, `EquipmentHUD.cs`, `GameFeedbackHUD.cs`, `LongTermEngagementHUD.cs`, `ProgressionHUD.cs`, `QuestHUD.cs`, `RPGShopHUD.cs`, `SettingsHUD.cs`. | Tìm `OnGUI(` trong `Assets/Scripts/UI/*.cs`. | High | Chỉ sau khi chọn UGUI hoặc UI Toolkit; thay theo các bước review được và so sánh hiệu năng trước/sau. | L | 4 | Đã khác |
| A8 | Bootstrap/services | `Assets/Scripts/Core/AshenCrownSystemsBootstrap.cs` tạo hơn 30 component bằng `AddComponent<T>()` từ bootstrap, chưa có `GameServicesProfile`; hệ thống liên kết qua `X.Instance`. | Đếm các lệnh `AddComponent<T>()` và đọc bootstrap. | High | Thiết kế service registration/profile và sơ đồ phụ thuộc trước khi thay kiến trúc; giữ shim tương thích cho `X.Instance`. | L | 3 | Xác nhận |
| A9 | Event bridge | `Assets/Scripts/Core/GameplayEventBridge.cs`: `Update()` quét mỗi 1 giây và gọi `FindObjectsOfType<PlayerCombatSystem>(true)` cùng `FindObjectsOfType<BossController>(true)`. Đã có hook `sceneLoaded`, nhưng polling vẫn tồn tại. | Đọc `Update`, `BindSceneObjects`, `OnEnable/OnDisable`. | Med | Thay polling bằng registry/event có lifecycle; thêm test subscribe/unsubscribe khi đổi scene. | M | 3 | Xác nhận |
| A10 | Debug key | `Assets/Scripts/UI/EquipmentHUD.cs`: phím L gọi loot roll thử và hiển thị trong HUD; không được bao quanh bởi `#if UNITY_EDITOR || DEVELOPMENT_BUILD`. F5/F9 trong bootstrap đã được bảo vệ bằng điều kiện build. | Kiểm tra điều kiện tiền xử lý quanh `KeyCode.L`. | Med | Bao phím debug bằng điều kiện Editor/Development và lập `docs/CONTROLS.md` ở Phase 1. | S | 1 | Xác nhận |
| A11 | Unity auth/cloud save | `Assets/Scripts/Online/SupabaseAuthService.cs`: có nhận `refresh_token` nhưng chỉ giữ trong biến; không thấy flow refresh/restore phiên hoặc timeout; lỗi chuyển nguyên response body qua event; signup luôn phát `SignedUp(CurrentUser)`; cloud payload được nối chuỗi và gửi toàn bộ JSON. | Đọc `Auth`, `SaveCloud`, `LoadCloud`; tìm refresh/timeout và chỗ gọi lỗi. | High | Phase 6: secure-storage adapter, refresh/retry có giới hạn, mapping lỗi thân thiện, JSON serializer và debounce/hash cloud save; test bằng HTTP mock. | L | 6 | Xác nhận |
| A12 | Save integrity | `Assets/Scripts/Save/SaveLoadSystem.cs`: save version 5; SHA-256 checksum không khóa. Đây là phát hiện hỏng/ghi dở, không xác thực tính trung thực dữ liệu. Cloud save vẫn do client khai báo. | Kiểm tra version và `ComputeChecksum`. | Med/High khi online cạnh tranh | Giữ tương thích v5; mọi đổi schema cần migration + fixture. Không coi checksum client là chống gian lận; online cạnh tranh cần xác thực server. | M/L | 3, 6 | Xác nhận |
| A13 | Độ sâu hệ meta | `CodexSystem.cs` hiện chủ yếu giữ ID trong `HashSet<string>`; `CraftingSystem.cs` có 3 recipe hardcode và không có UI chế tạo riêng. Nhưng `ReputationSystem` và `WorldEventSystem` có logic/capture/restore, nên không nên coi tất cả hệ được nêu là stub giống nhau. | Đọc các file system được nêu; xác minh UI/save/test từng hệ. | Med | Lập ma trận dữ liệu–logic–UI–save–test–nội dung ở Phase 5.D; xin duyệt giữ/hoàn thiện/gộp/ẩn trước khi triển khai. | M | 5 | Xác nhận |
| A14 | Web monolith | `play.js` có 2.866 dòng và Git blob 219.546 bytes; render/combat/RPG/UI/i18n/save vẫn nằm chung file. | Kiểm tra metadata file và cấu trúc `play.js`. | High | Tách module ở Phase 7 sau khi có baseline và quyết định bundler; giữ nguyên hợp đồng localStorage/event/global đã nêu trong prompt. | L | 7 | Xác nhận |
| A15 | GPU resource lifecycle | `play.js:1909` trong `useSkill()` tạo `TorusGeometry` và `MeshBasicMaterial`; callback chỉ `ring.removeFromParent()` sau 360 ms, không dispose geometry/material. Đếm tĩnh toàn file: khoảng 312 biểu thức `new THREE.*`, 5 lần `.dispose(`. | Đọc `useSkill()`; tìm `new THREE.` và `.dispose(`. | High | Xây EffectPool dùng geometry/material dùng chung và vòng đời theo `tick(dt)`; xác minh soak bằng `renderer.info` khi browser test khả dụng. | M/L | 7 | Xác nhận |
| A16 | Web localization | `play.js` còn `PLAY_LOCALE_ROWS`, `translateTextNode`, `translatePlayTree` và cơ chế dịch text node qua DOM; `i18n.js` cũng có xử lý text node. | Tìm tên mảng/hàm và các điểm đăng ký observer. | Med | Chỉ thay bằng key-based dictionaries khi có test coverage cho đủ 5 ngôn ngữ và giữ tương thích setting hiện có. | L | 7 | Xác nhận |
| A17 | DOM injection surface | Đếm tĩnh có 23 phép gán `.innerHTML =` trong `play.js`. `auth.js` cũng tạo modal bằng markup tĩnh; nhiều thông báo dùng `textContent`. Chưa duyệt đủ 23 sink và chưa chạy payload XSS nên **chưa kết luận có lỗ hổng khai thác**. | Liệt kê các sink, truy nguồn dữ liệu động, kiểm tra escaping/sanitize và chạy test. | Med | Phase 7: thay sink không cần HTML bằng DOM/`textContent`; test với tên item độc hại và stats NaN/Infinity. | M | 7 | Xác nhận |
| A18 | Tài liệu | `README.md` có 22.766 bytes và gộp hướng dẫn Unity, web deployment, game design, security; nhiều tài liệu vận hành dự kiến chưa có. | Đối chiếu tài liệu trong repo với danh sách Phase 8.C. | Low/Med | Chỉ làm gọn README và bổ sung tài liệu cấu trúc ở Phase 8 sau khi các phase nền đã rõ. | M | 8 | Xác nhận |

## Phát hiện bổ sung

1. `.gitignore` hiện chỉ bỏ qua `dist/`, `.vercel/`, `node_modules/`; chưa phải bộ ignore cho Unity/IDE/log/build.
2. Không thấy `package-lock.json` hoặc `npm-shrinkwrap.json`, nên dependency install chưa được khóa bằng lockfile.
3. Cây repo hiện chưa có `.github/workflows/`; CI tự động chưa được thiết lập trong nhánh được audit.
4. Branch protection của `main` đang tắt theo metadata API tại thời điểm kiểm tra. Đây là khuyến nghị vận hành, không phải lỗi runtime.
5. Cấu hình Vercel có CSP/security headers; không có thay đổi CSP nào được thực hiện trong Phase 0.

## Quyết định bắt buộc trước các phase liên quan

Theo master prompt, chủ repo cần chọn trước khi bắt đầu phạm vi tương ứng:

- **Phase 1:** hoàn thiện hay loại bỏ `server/`; có di chuyển phần web sang `web/` hay không; có bật Git LFS hay không.
- **Phase 2/4:** UGUI hay UI Toolkit; có dùng URP hay không; chọn GLB importer (ví dụ glTFast) hay không.
- **Phase 3.D:** duyệt schema save v6 trước khi đổi schema.
- **Phase 5.D:** duyệt từng hệ meta để giữ/hoàn thiện/gộp/tạm ẩn; không mở rộng gameplay trước khi duyệt.
- **Phase 6.C:** có làm server-authoritative validation/leaderboard hay giữ rõ phạm vi single-player.
- **Phase 7:** chọn esbuild hay Vite; có bật source map production hay không; có dùng Draco/meshopt/KTX2 hay không.
- **Phase 8.C:** chọn license dự án.

**Trạng thái Phase 0:** audit tĩnh đã hoàn thành từ GitHub source; build, runtime profile, browser network trace và Unity tests vẫn chưa được xác minh trong môi trường hiện tại. Chờ duyệt trước Phase 1.
