# Phase 0 — Baseline

**Ngày ghi nhận:** 2026-10-14  
**Repository:** `ltrtrongphu-png/AshenCrown-Unity`  
**Commit baseline:** `ece3a4cb7b22d5309c6384af22d752dc6a50d43a` (`main`)  
**Loại baseline:** static repository/source baseline. Chưa phải build/runtime performance baseline.

## Môi trường

| Thuộc tính | Kết quả | Bằng chứng/trạng thái |
|---|---|---|
| Hệ điều hành | Linux x86_64, kernel `6.18.44` | Đã chạy `uname -a` |
| Node.js | `v22.16.0` | Đã chạy `node --version` |
| npm | `10.9.2` | Đã chạy `npm --version` |
| Chromium | `/usr/bin/chromium` có tồn tại | Chưa mở ứng dụng web |
| Unity Editor | Không tìm thấy executable | Unity compile/test chưa thể chạy tại đây |
| .NET SDK | Không có; `dotnet: command not found` | Roslyn/dotnet analyzers chưa chạy |
| GitHub checkout | Bị chặn do DNS | `git ls-remote https://github.com/ltrtrongphu-png/AshenCrown-Unity.git HEAD` → `Could not resolve host: github.com` |
| Package install | Chưa chạy | Chưa có checkout và không truy cập được GitHub |
| Supabase thực | Chưa xác minh trong phiên này | Không chạy signup/login/RLS với 2 tài khoản |

## Static repo inventory

| Chỉ số | Giá trị quan sát được |
|---|---:|
| Git tree entries (gồm file và thư mục) | 150 |
| `.asmdef` | 0 |
| Unity `.meta` files | 0 |
| Unity `.unity` scenes | 0 |
| `.github/workflows/` entries | 0 |
| Test source tìm thấy | 1: `Assets/Tests/EditMode/ProgressionReliabilityTests.cs` |
| Test fixtures path | Không có `Assets/Tests/Fixtures/` hoặc `tests/fixtures/` |
| Web lockfile | Không thấy `package-lock.json` hay `npm-shrinkwrap.json` |
| Backend entry point | `server/src/index.js` không tồn tại trong cây file |
| Migration Supabase | 1: `supabase/migrations/001_ashen_crown_accounts.sql` |
| Web JS monolith | `play.js`: 2.866 dòng; Git blob 219.546 bytes |
| HUD IMGUI | 9/10 file HUD được kiểm tra có `OnGUI()`; `BossHealthBarUI.cs` không có |

## Web source byte sizes

Dưới đây là raw byte sizes lấy từ Git tree metadata của commit baseline; **không phải** gzip/Brotli hoặc kích thước bundle sau build.

| File | Bytes |
|---|---:|
| `play.js` | 219,546 |
| `play.css` | 45,665 |
| `i18n.js` | 33,923 |
| `styles.css` | 33,399 |
| `auth.js` | 16,600 |
| `index.html` | 11,152 |
| `model3d.js` | 8,684 |
| `play.html` | 7,504 |
| `tools/build-web.mjs` | 6,527 |
| `app.js` | 5,060 |
| `campaign.js` | 4,600 |
| `play-boot.js` | 3,180 |
| `sw.js` | 2,588 |
| `model3d.css` | 2,071 |
| `assets/ashen-crown-logo.svg` | 1,124 |
| `auth-config.js` | 387 |

**Chưa đo:** thời gian build, tổng dung lượng `dist/`, kích thước các file đã build, gzip/Brotli, số request và 404 từ browser Network panel. Các giá trị này cần checkout, dependency install và browser test; không thay bằng ước lượng.

## Unity baseline

| Chỉ số yêu cầu | Kết quả Phase 0 | Lý do |
|---|---|---|
| Compile errors/warnings | Chưa đo | Không có project Unity hoàn chỉnh, Unity Editor hoặc .NET SDK |
| EditMode/PlayMode test | Chưa chạy | Không có asmdef và Unity Editor |
| CPU ms/frame, p99 | Chưa đo | Cần sandbox scene và Unity Profiler |
| GC alloc/frame | Chưa đo | Cần Unity Profiler trong combat |
| Memory snapshot qua 10 lần đổi scene | Chưa đo | Cần Unity Memory Profiler |
| SetPass/batches/triangles | Chưa đo | Cần Frame Debugger hoặc Unity Stats |
| Thời gian bootstrap | Chưa đo | Cần runtime Unity |

## Web runtime baseline

| Chỉ số yêu cầu | Kết quả Phase 0 | Lý do |
|---|---|---|
| Thời gian đến `ashen:game-ready` | Chưa đo | Chưa chạy local web build |
| FPS trung bình / 1% low ở Sanctuary và encounter | Chưa đo | Cần browser test + CPU throttle 4× |
| `renderer.info.render.calls/triangles` | Chưa đo | Cần runtime instrument |
| `renderer.info.memory.geometries/textures` lúc đầu và sau 5 phút | Chưa đo | Cần runtime soak test |
| JS heap lúc đầu/sau 5 phút | Chưa đo | Cần Chromium DevTools / Playwright |
| Soak 10 phút và offline flow | Chưa chạy | Chưa có local checkout/test harness |
| Lighthouse LCP/INP/CLS và score | Chưa đo | Cần build phục vụ qua HTTP và Lighthouse |

## Commands/results đã thực sự chạy

```text
$ uname -a
Linux 6de2f5d4f875 6.18.44 #1 SMP PREEMPT_DYNAMIC ... x86_64 GNU/Linux

$ node --version
v22.16.0

$ npm --version
10.9.2

$ dotnet --version
bash: dotnet: command not found

$ command -v chromium
/usr/bin/chromium

$ git ls-remote https://github.com/ltrtrongphu-png/AshenCrown-Unity.git HEAD
fatal: unable to access 'https://github.com/ltrtrongphu-png/AshenCrown-Unity.git/': Could not resolve host: github.com
```

Do không có checkout, **chưa chạy** `node tools/build-web.mjs`, `node --check`, `npm audit`, `npm ci`, hoặc `gitleaks`. Không có output đủ căn cứ để đánh dấu các lệnh này là pass.

## Design tham chiếu (chưa áp dụng vào code)

Màu tham chiếu dùng trong lần rà soát thiết kế này: **`#211B24FF`** (alpha 100%). Đây là lựa chọn thử nghiệm do agent đặt vào công cụ màu, chưa phải lựa chọn được chủ repo xác nhận và chưa áp dụng vào CSS, Unity materials hoặc runtime token.

## Cổng qua Phase 1

Phase 0 ghi nhận xong audit tĩnh và baseline tĩnh. Để báo cáo build/performance thực, cần môi trường có checkout hoạt động và quyền chạy build/browser tests. Giữ các cổng quyết định từ master prompt; đặc biệt **không tự chọn** hoàn thiện/xóa backend, di chuyển web, bật Git LFS hoặc đổi schema save.
