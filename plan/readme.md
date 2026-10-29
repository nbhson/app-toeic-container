# Plan — app-toeic-container

> TOEIC Reading practice: Express BE (ESM, JSON file stores) + Angular UI qua nginx,
> chạy docker-compose (redis + backend + ui). AI generation qua OmniRoute trên host.

## Kết quả Review (audit đợt 1)

| # | Severity | Vị trí | Vấn đề | Fix |
|---|----------|--------|--------|-----|
| 1 | MAJOR | be/routes/keys.routes.js:25-34 | PUT nhận `name` BẤT KỲ + `value` không validate type → inject key object tùy ý vào keys.json (GET chỉ mask nhưng name/value lạ vào store) | Whitelist `ALLOWED_KEY_NAMES` ('omniroute' — key duy nhất app đọc), value phải string |
| 2 | MAJOR | be/routes/toeic.routes.js:82,129,181,251 | `!count || count < 1` — `"5"` (string) qua được rồi `"5" > MAX` so sánh lỏng; `count: "3"` trở đi sinh SQL/array size bất ngờ; boolean `true` qua được | `Number.isInteger(count) \|\| count < 1` ở cả 4 chỗ (part5/part6/part7/batch) |
| 3 | MAJOR | be/routes/toeic.routes.js:187,254 | `startQuestionNumber` chỉ check `< 1` — `"1e9"`, `1.5` qua được → renumber Part7 sai/off-by | `Number.isInteger` cả 2 chỗ |
| 4 | MAJOR | be/routes/toeic.routes.js:236 | `/part7/batch` không cap `batches.length` — array 10k batch = generation farm | Cap 20 batch/request |
| 5 | MAJOR | be/routes/*.js (7 chỗ) | `error.message \|\| 'Internal server error.'` trả raw message — lỗi fs/SQLite lộ đường dẫn + shape | Generic 500, chi tiết chỉ vào `console.error` |
| 6 | MINOR | be/server.js:41 | `presented !== expected` — so sánh admin key không constant-time | HMAC wrapper + `timingSafeEqual` |
| 7 | MINOR | be/server.js | Không có JSON error handler (body-parse lỗi → HTML Express) + thiếu 404 catch-all | 400 cho parse.failed, 404 JSON cuối |
| 8 | MINOR | ui/nginx.conf | Không forward `X-Forwarded-For`/`X-Forwarded-Proto` — backend không thấy IP client thật cho logging/rate limit | Thêm 2 header |

## Không sửa (đã cân nhắc, ghi nhận)

- **`/api/toeic/keys` chỉ guard bởi optional `ADMIN_API_KEY`**: đã có cảnh báo "Unset = open (local dev only)" trong comment từ đợt trước; app này là container cá nhân (single user), bật token là việc cấu hình deploy — đã ghi trong README, không force.
- **Key store JSON plain-text** (data/keys.json): key Omniroute là key dev-local, mã hóa cần KMS ngoài scope.
- **UI Angular**: audit tập trung BE (UI là app học cá nhân, không có sink XSS — Angular template escaping mặc định).

## Trạng thái

- [x] Plan
- [x] Fix #1–#8
- [x] `node --check` server.js OK; vitest **124/124 pass** (4 test cũ assert hành vi lỗi đã cập nhật theo behavior mới)
- [x] Commit + self-review

## Review Log

### Vòng 1
- Self-review: whitelist key name khớp với `toeic.routes.js:55` (chỉ đọc `omniroute`). Test `succeeds even if key does not exist` cũ chính là assert hành vi inject — đổi thành test chặn non-whitelist. Batch cap 20 không phá UI (UI chỉ gửi ≤4 batch/part test).

---

# Round 2 (2026-10-29) — Enterprise upgrade

## Kết quả Review (audit đợt 2)

### Backend (toeic-reading-be)

| # | Severity | Vị trí | Vấn đề | Fix |
|---|----------|--------|--------|-----|
| R2-1 | MAJOR | routes/toeic.routes.js (part5/6/7 + batch) | Không có rate limit trên các endpoint gọi AI → 1 client có thể đốt quota/generation farm | Rate limiter in-memory (token bucket theo IP), chỉ áp cho POST generation, cấu hình qua env |
| R2-2 | MAJOR | routes/stats.routes.js PUT | Chấp nhận stats BẤT KỲ (số âm, NaN, string, history item lạ) → store hỏng, analytics sai | Validate + normalize (số nguyên ≥0, cap history, kiểm tra shape entry) |
| R2-3 | MAJOR | routes/toeic.routes.js | 4 handler part5/6/7/batch trùng lặp ~90% (validate → sample bank → generate → merge) | Tách helper chung `handleGeneration` + validator dùng lại |
| R2-4 | MINOR | routes/stats.routes.js | `:userId` validate lặp 4 lần | `param('userId')` middleware dùng chung |
| R2-5 | MINOR | db/stats-store.js | `writeFileSync` thẳng vào file đích → crash giữa chừng làm hỏng file stats | Ghi file tạm + rename (atomic) |
| R2-6 | MINOR | routes/reading-test.routes.js | Item trong `answers` không kiểm tra shape (object/number) → tính điểm bằng dữ liệu rác | Validate từng item, 400 khi sai |
| R2-7 | FEATURE | — | Không có lịch sử điểm thi thử server-side → không vẽ được xu hướng điểm | Store `data/test-history/{userId}.json` + POST/GET/DELETE `/api/toeic/reading-test/history/:userId` (cap 100 bài) |

### Frontend (toeic-reading-ui)

| # | Severity | Vị trí | Vấn đề | Fix |
|---|----------|--------|--------|-----|
| R2-8 | MAJOR (test đỏ sẵn) | core/services/toeic.service.spec.ts:77 | Spec dùng `STORAGE_KEYS.API_KEY` — const đã bị xóa từ trước → `ng test` KHÔNG compile được (pre-existing failure, xác nhận tại commit `a6db57e`) | Đổi sang `STORAGE_KEYS.OMNIROUTE_API_KEY` |
| R2-9 | MAJOR | reading-test.component.ts | Đồng hồ đếm ngược dùng `setInterval` trừ 1s → trôi so với đồng hồ thật (tab background) | Tính remaining từ `endTime` (Date.now()) mỗi tick |
| R2-10 | MAJOR | reading-test.component.ts | `confirm()` native khi nộp bài thiếu câu — trong khi app đã có ConfirmModalComponent → UX không nhất quán | Dùng modal của app |
| R2-11 | MINOR | dashboard.component.ts/.html | 7 computed accuracy copy-paste + 7 khối HTML category copy-paste | Mỗi cái 1 vòng `@for`/computed map theo config category |
| R2-12 | MINOR | toeic.service.ts | Bắt mọi lỗi API rồi ném message chung → mất message cụ thể từ BE (vd "apiKey is required") | Ưu tiên message gốc, chỉ fallback khi trống |
| R2-13 | MINOR | reading-test.component.html | `[innerHTML]="p.text"` (Part 7) — Angular tự sanitize (đã kiểm tra: không có bypassSecurityTrust) nhưng nên ghi nhận + giữ chuẩn hóa; không đổi sang raw HTML | Ghi nhận, giữ sanitize mặc định |
| R2-14 | MINOR | toàn UI | A11y: option button thiếu `aria-pressed`, timer không `aria-live`, thiếu focus-visible cho nav | Bổ sung aria + focus style |
| R2-15 | FEATURE | — | Sau thi chỉ thấy đúng/sai, không có giải thích để ôn lại | Xem lại có đáp án + giải thích + dịch (collapsible) sau khi nộp |
| R2-16 | UX | reading-test | Thiếu navigator/bảng câu hỏi + flag đánh dấureview — trải nghiệm thi thật | Question palette (đã làm/chưa/flag), click nhảy tới câu, flag |
| R2-17 | FEATURE | — | Không có "sổ tay câu sai" chuyên trang | Trang `/notebook`: câu sai, đáp án đúng/sai, đánh dấu đã ôn (lưu localStorage) |

## Trạng thái Round 2

- [x] Deep review BE + FE
- [x] Update plan
- [x] BE: rate limit, stats validation, atomic write, dedupe routes, test-history store
- [x] UI: fix spec compile, dashboard dedupe, reading-test (timer, modal, navigator+flag, review explanations), notebook page, test-history trend, a11y
- [x] Build + test xanh cả BE & FE (FE thất bại pre-existing đã xác minh + fix)
- [x] Commits nhỏ kiểu conventional, local only
- [x] Self-review diff

## Trạng thái Round 2 (chốt — phiên xác minh 2026-10-29)

Phiên trước để notebook (R2-17) chưa commit + 1 lỗi template. Đã verify lại
toàn bộ item rồi hoàn tất nốt phần còn thiếu:

| Item | Trạng thái cuối |
|------|-----------------|
| R2-1 → R2-7 (BE) | Đã verify có thật trong code + test (rate limiter `middleware/rate-limit.js`, `sanitizeStats`, atomic write, `handleGeneration`, `router.param`, atomic JSON, validate answers, store `test-history-store.js` + 3 endpoints) |
| R2-8 → R2-13, R2-15, R2-16 | Đã verify có thật (spec compile fix, drift-free timer từ `endTime`, ConfirmModal, dashboard `categoryRows` + `@for`, BE error message passthrough, innerHTML sanitize giữ mặc định, review collapsible, palette + flag) |
| R2-14 (a11y) | **Trước đó thiếu 2 phần** — đã hoàn tất: `:focus-visible` global + `.sr-only` (`_reset.scss`), live-region thông báo mốc 10/5/1 phút cho timer, `aria-pressed` cho option/translate ở part5/6/7 |
| R2-17 (notebook) | **Trước đó chưa commit, có bug `item.part`** — đã fix (`partLabel`), bỏ field `translation` chết, thêm sidebar entry + route + spec (7 tests) |

Commit kết thúc round: `97eb60f` (notebook), `d8e4d0d` (a11y timer/focus),
`60b644c` (aria-pressed practice + budget), cộng commit nhỏ sau self-review.

- [x] Build FE sạch (không còn warning budget — `anyComponentStyle` 8kB/12kB khớp thực tế 6 component ~4.3–7.9kB)
- [x] Test: BE vitest 159/159; FE vitest 235/235 (20 file)
- [x] Tính năng round 2: thi thử có giờ (đếm drift-free + tự nộp), xu hướng điểm server-side, review giải thích/dịch sau nộp, palette + flag, sổ tay câu sai `/notebook`

## Review Log Round 2

- Self-review: whitelist key name khớp với `toeic.routes.js:55` (chỉ đọc `omniroute`). Test `succeeds even if key does not exist` cũ chính là assert hành vi inject — đổi thành test chặn non-whitelist. Batch cap 20 không phá UI (UI chỉ gửi ≤4 batch/part test).
