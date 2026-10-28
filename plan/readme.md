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
