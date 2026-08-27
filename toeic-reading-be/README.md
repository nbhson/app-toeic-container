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

# Server Configuration
PORT=3000
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

### TOEIC Generation

| Method | Endpoint | Body | Mô tả |
|--------|----------|------|-------|
| `POST` | `/api/toeic/part5` | `{ count: number, apiKey?: string }` | Sinh câu hỏi Part 5 |
| `POST` | `/api/toeic/part6` | `{ count: number, apiKey?: string }` | Sinh đoạn văn Part 6 |
| `POST` | `/api/toeic/part7` | `{ passageType: 'Single'\|'Double'\|'Triple', count: number, startQuestionNumber: number, apiKey?: string }` | Sinh đoạn văn Part 7 |
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
│   ├── server.js                  # Express server entry point
│   ├── routes/
│   │   ├── toeic.routes.js        # TOEIC generation API routes
│   │   ├── keys.routes.js         # API key management routes
│   │   ├── stats.routes.js        # User stats routes
│   │   └── __tests__/
│   │       ├── keys.routes.test.js
│   │       ├── stats.routes.test.js
│   │       └── toeic.routes.test.js
│   ├── services/
│   │   ├── omniroute.service.js   # OmniRoute API client + safeParseJSON
│   │   └── __tests__/
│   │       └── omniroute.service.test.js
│   ├── prompts/
│   │   ├── toeic.prompts.js       # Prompt templates
│   │   └── __tests__/
│   │       └── toeic.prompts.test.js
│   └── db/
│       ├── key-store.js           # JSON file-based key store
│       ├── stats-store.js         # Per-user stats store
│       └── __tests__/
│           ├── key-store.test.js
│           └── stats-store.test.js
├── data/                           # Runtime data (gitignored)
│   ├── keys.json                   # Stored API keys
│   └── stats/                      # Per-user stats (e.g., user1.json)
├── vitest.config.js
├── package.json
└── .env                            # Environment variables (gitignored)
```

---

## 🧪 Testing

Dự án sử dụng **Vitest** cho unit testing với **supertest** cho HTTP route testing.

### Test Coverage

| Module | Tests | Mô tả |
|--------|-------|-------|
| `key-store.js` | 14 | CRUD operations, persistence, masking, directory creation |
| `stats-store.js` | 11 | Per-user CRUD, path traversal protection, persistence |
| `keys.routes.js` | 8 | GET/PUT/DELETE endpoints, validation, error handling |
| `stats.routes.js` | 8 | GET/PUT/DELETE endpoints, validation, default stats |
| `toeic.routes.js` | 19 | Part 5/6/7/batch generation, key resolution, validation, error handling |
| `toeic.prompts.js` | 14 | Prompt template generation for all parts |
| `omniroute.service.js` | 14 | `safeParseJSON` sanitization for AI-generated JSON |
| **Total** | **80** | |

### Chạy tests

```bash
npm test          # Run all tests
npm run test:watch  # Watch mode
```

---

## 📄 License

ISC