# TOEIC Reading Backend

Backend API server cho ứng dụng **TOEIC Master**, xử lý proxy các yêu cầu gọi OmniRoute API, quản lý API keys, và lưu trữ thống kê người dùng trên server.

---

## 📦 Cài đặt

```bash
npm install
```

## ⚙️ Cấu hình

Tạo file `.env` trong thư mục gốc:

```env
# OmniRoute API Configuration
OMNIROUTE_MODEL=oc/deepseek-v4-flash-free
OMNIROUTE_API_BASE_URL=http://localhost:20128/v1
# Default API key (UI có thể override)
OMNIROUTE_API_KEY=
# Số lần retry khi model trả JSON sai schema (mặc định 3)
OMNIROUTE_MAX_ATTEMPTS=3
# Timeout gọi AI (ms)
OMNIROUTE_TIMEOUT_MS=150000

# Server Configuration
PORT=3000
# CORS: "*" cho dev local; production nên liệt kê domain, ví dụ:
# FRONTEND_ORIGIN="https://toeic.example.com"
FRONTEND_ORIGIN=*

# Stats: số history entries tối đa giữ lại mỗi user (chống phình file JSON)
MAX_HISTORY_SIZE=200
# Question bank: số items tối đa mỗi part trong data/bank
BANK_MAX_ITEMS=500
```

## 🚀 Khởi chạy

```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

Server chạy tại: `http://localhost:3000`

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

---

## 📡 API Endpoints

### Key Management

| Method | Endpoint | Body | Mô tả |
|--------|----------|------|-------|
| `GET` | `/api/toeic/keys` | — | Liệt kê status API keys (masked) |
| `PUT` | `/api/toeic/keys` | `{ name: string, value: string }` | Lưu/cập nhật API key |
| `DELETE` | `/api/toeic/keys/:name` | — | Xóa API key |

**Ví dụ:**

```bash
# Liệt kê keys
curl http://localhost:3000/api/toeic/keys

# Lưu key
curl -X PUT http://localhost:3000/api/toeic/keys \
  -H "Content-Type: application/json" \
  -d '{"name": "omniroute", "value": "your-api-key"}'

# Xóa key
curl -X DELETE http://localhost:3000/api/toeic/keys/omniroute
```

### User Stats (Multi-user)

| Method | Endpoint | Body | Mô tả |
|--------|----------|------|-------|
| `GET` | `/api/toeic/stats/:userId` | — | Lấy thống kê của user |
| `PUT` | `/api/toeic/stats/:userId` | `{ stats: UserStats }` | Lưu thống kê (full replacement) |
| `DELETE` | `/api/toeic/stats/:userId` | — | Xóa thống kê của user |

**UserStats schema:**

```json
{
  "totalAnswered": 10,
  "totalCorrect": 7,
  "totalIncorrect": 3,
  "categoryStats": {
    "Grammar": { "answered": 5, "correct": 4 },
    "Vocabulary": { "answered": 3, "correct": 2 },
    "Word Forms": { "answered": 2, "correct": 1 },
    "Sentence Insertion": { "answered": 0, "correct": 0 },
    "Single Passage": { "answered": 0, "correct": 0 },
    "Double Passage": { "answered": 0, "correct": 0 },
    "Triple Passage": { "answered": 0, "correct": 0 }
  },
  "history": [
    {
      "questionId": "q1",
      "questionText": "Part 5 - Câu 1: The company...",
      "selectedAnswer": 0,
      "correctAnswer": 2,
      "isCorrect": false,
      "timestamp": 1700000000000
    }
  ]
}
```

**Ví dụ:**

```bash
# Lấy stats
curl http://localhost:3000/api/toeic/stats/user1

# Lưu stats
curl -X PUT http://localhost:3000/api/toeic/stats/user1 \
  -H "Content-Type: application/json" \
  -d '{"stats": {"totalAnswered": 1, "totalCorrect": 1, "totalIncorrect": 0}}'

# Xóa stats
curl -X DELETE http://localhost:3000/api/toeic/stats/user1
```

### TOEIC Generation (validate + retry + bank-first)

Mọi response của AI đều được **validate schema** (`src/validation/toeic.validate.js`:
đủ số lượng, blank `_______`/`[131]…` liên tục, 4 options duy nhất,
`correctAnswer` 0–3, category/difficulty hợp lệ) và **retry tối đa
`OMNIROUTE_MAX_ATTEMPTS` lần** trước khi báo lỗi — thay vì crash UI như trước.

Các item vượt validation được **lưu vào question bank** (`data/bank/*.json`,
tối đa `BANK_MAX_ITEMS` mỗi part, khử trùng lặp). Request kế tiếp phục vụ từ
bank trước (nhanh, miễn phí), thiếu mới gọi AI bù. Response có thêm field
`fromCache` (số item lấy từ bank). Truyền `"useCache": false` để ép sinh mới
hoàn toàn bằng AI.

| Method | Endpoint | Body | Mô tả |
|--------|----------|------|-------|
| `POST` | `/api/toeic/part5` | `{ count ≤ 30, apiKey?: string, useCache?: boolean }` | Sinh câu hỏi Part 5 |
| `POST` | `/api/toeic/part6` | `{ count ≤ 4, apiKey?: string, useCache?: boolean }` | Sinh đoạn văn Part 6 (blank đánh số lại liên tục từ `[131]`) |
| `POST` | `/api/toeic/part7` | `{ passageType, count ≤ 10, startQuestionNumber, apiKey?: string, useCache?: boolean }` | Sinh đoạn văn Part 7 (đánh số lại liên tục từ `startQuestionNumber`) |
| `POST` | `/api/toeic/part7/batch` | `{ batches: Array, apiKey?: string }` | Sinh nhiều batch Part 7 trong 1 request |

**Ví dụ:**

```bash
# Sinh 5 câu Part 5
curl -X POST http://localhost:3000/api/toeic/part5 \
  -H "Content-Type: application/json" \
  -d '{"count": 5, "apiKey": "your-key"}'

# Sinh 2 đoạn văn Part 6
curl -X POST http://localhost:3000/api/toeic/part6 \
  -H "Content-Type: application/json" \
  -d '{"count": 2}'

# Sinh 1 đoạn văn Part 7 Single
curl -X POST http://localhost:3000/api/toeic/part7 \
  -H "Content-Type: application/json" \
  -d '{"passageType": "Single", "count": 1, "startQuestionNumber": 147}'
```

### Question Bank (luyện offline, không cần AI key)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/toeic/bank` | Số item đã lưu theo từng part |
| `GET` | `/api/toeic/bank/:part?limit=10` | Lấy ngẫu nhiên tối đa `limit` (1–100) item. `part` ∈ `part5, part6, part7-Single, part7-Double, part7-Triple` |
| `DELETE` | `/api/toeic/bank/:part` | Xóa bank của 1 part |

### Full Reading Test (100 câu / 75 phút / thang 5–495)

Điểm là **ước lượng** (ETS thật quy đổi khác nhau theo từng form đề), nội suy
tuyến tính giữa các mốc chuẩn và làm tròn tới bội số 5.

| Method | Endpoint | Body | Mô tả |
|--------|----------|------|-------|
| `GET` | `/api/toeic/reading-test/config` | — | Cấu trúc đề chuẩn: `{ totalQuestions: 100, timeLimitMinutes: 75, parts: [...] }` |
| `POST` | `/api/toeic/reading-test/score` | `{ correct: number, total?: number }` hoặc `{ answers: [{ selectedAnswer, correctAnswer }] }` | Chấm điểm → `{ correct, total, percent, score, level }` |

```bash
# Chấm 75/100 câu đúng
curl -X POST http://localhost:3000/api/toeic/reading-test/score \
  -H "Content-Type: application/json" \
  -d '{"correct": 75, "total": 100}'
# {"correct":75,"total":100,"percent":75,"score":375,"level":"Upper-Intermediate (355-400)",...}
```

### User Stats — Weak-point Analysis

`PUT /stats/:userId` tự cắt `history` còn tối đa `MAX_HISTORY_SIZE` entries
mới nhất (chống phình file JSON).

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/toeic/stats/:userId/analysis` | Phân tích điểm yếu: `overall`, `byCategory` (accuracy từng nhóm), `weakest` (tối đa 3 nhóm đã làm ≥ 3 câu, accuracy thấp nhất), `recentWrong` (10 câu sai gần nhất để ôn lại) |

### Health Check

```bash
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

---

## 🔑 API Key Resolution Priority

Khi gọi TOEIC generation endpoints, API key được resolve theo thứ tự ưu tiên:

1. **`apiKey` từ request body** — UI gửi key trực tiếp
2. **Stored key từ BE key store** — Key đã lưu qua `/api/toeic/keys`
3. **Default key từ `.env`** — `OMNIROUTE_API_KEY`

---

## 📁 Cấu trúc dự án

```
toeic-reading-be/
├── src/
│   ├── server.js                  # Express server entry point (CORS, limits, security headers)
│   ├── routes/
│   │   ├── toeic.routes.js        # TOEIC generation API routes (bank-first + caps)
│   │   ├── bank.routes.js         # Question bank API routes
│   │   ├── reading-test.routes.js # Full-test config + scoring routes
│   │   ├── keys.routes.js         # API key management routes
│   │   ├── stats.routes.js        # User stats + analysis routes
│   │   └── __tests__/
│   │       ├── keys.routes.test.js
│   │       ├── bank.routes.test.js
│   │       ├── reading-test.routes.test.js
│   │       └── toeic.routes.test.js
│   ├── services/
│   │   ├── omniroute.service.js   # OmniRoute client + safeParseJSON + validate/retry/bank
│   │   └── __tests__/
│   │       └── omniroute.service.test.js
│   ├── validation/
│   │   ├── toeic.validate.js      # Schema validators cho output AI (Part 5/6/7)
│   │   └── __tests__/
│   │       └── toeic.validate.test.js
│   ├── utils/
│   │   ├── score-table.js         # Quy đổi điểm Reading 5–495 + READING_TEST_CONFIG
│   │   └── __tests__/
│   │       └── score-table.test.js
│   ├── prompts/
│   │   ├── toeic.prompts.js       # Prompt templates
│   │   └── __tests__/
│   │       └── toeic.prompts.test.js
│   └── db/
│       ├── key-store.js           # JSON file-based key store
│       ├── stats-store.js         # Per-user stats store (history cap + analyzeStats)
│       ├── bank-store.js          # Question bank store (dedupe + cap + sample)
│       └── __tests__/
│           ├── key-store.test.js
│           ├── stats-store.test.js
│           ├── stats-analysis.test.js
│           └── bank-store.test.js
├── data/                           # Runtime data (gitignored, mount volume trong Docker)
│   ├── keys.json                   # Stored API keys
│   ├── stats/                      # Per-user stats (e.g., user1.json)
│   └── bank/                       # Question bank (part5.json, part6.json, part7-*.json)
├── Dockerfile                      # Non-root user + HEALTHCHECK /api/health
├── .env.example                    # Mẫu biến môi trường
├── vitest.config.js
├── package.json
└── .env                            # Environment variables (gitignored)
```

---

## 🧪 Testing

Dự án sử dụng **Vitest** cho unit testing với **supertest** cho HTTP route testing.

### Test Coverage

| Module | Mô tả |
|--------|-------|
| `key-store.js` | CRUD operations, persistence, masking, directory creation |
| `stats-store.js` | Per-user CRUD, path traversal protection, persistence |
| `stats-analysis` | History cap (`MAX_HISTORY_SIZE`), `analyzeStats` (weakest, recentWrong) |
| `bank-store.js` | Bank CRUD, dedupe, cap, random sample, clear |
| `toeic.validate.js` | Validators Part 5/6/7: count, blanks, options, numbering |
| `score-table.js` | Quy đổi 5–495 (đơn điệu, bội 5), scale partial totals, config 100 câu/75 phút |
| `keys.routes.js` | GET/PUT/DELETE endpoints, validation, error handling |
| `bank.routes.js` | Summary/sample/clear, limit clamp, unknown-part 400 |
| `reading-test.routes.js` | Config + score (counts/answers), validation 400 |
| `toeic.routes.js` | Part 5/6/7/batch generation, key resolution, caps, bank-first |
| `toeic.prompts.js` | Prompt template generation for all parts |
| `omniroute.service.js` | `safeParseJSON` sanitization for AI-generated JSON |

### Chạy tests

```bash
npm test          # Run all tests
npm run test:watch  # Watch mode
```

---

## 📄 License

ISC