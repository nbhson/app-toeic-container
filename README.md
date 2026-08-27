# TOEIC Reading Container

Monorepo chứa frontend (Angular), backend (Node.js/Express) và OmniRoute (AI proxy) cho ứng dụng luyện đọc TOEIC, chạy bằng Docker.

## Cấu trúc thư mục

```
toeic-container/
├── docker-compose.yml
├── omni-route/                # AI Proxy - OmniRoute (chạy trên host machine)
│   ├── .env                   # API keys, JWT secrets, provider config
│   ├── src/
│   └── ...
├── toeic-reading-ui/          # Frontend - Angular 22
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
├── toeic-reading-be/          # Backend - Node.js/Express
│   ├── Dockerfile
│   └── src/
└── README.md
```

## Tech Stack

| Component | Technology | Port | Chạy ở đâu | Mô tả |
|-----------|-----------|------|------------|-------|
| OmniRoute | Next.js (AI proxy) | 20128 | **Host machine** | Proxy trung gian đến các AI providers |
| Redis | Redis 7 | — | Docker container | Rate limiter backend cho OmniRoute |
| Backend | Node.js 22, Express 4 | 3000 | Docker container | API server cho TOEIC app |
| Frontend | Angular 22, Nginx | 80 | Docker container | SPA + reverse proxy |

## Yêu cầu

- [Docker](https://docs.docker.com/get-docker/) và Docker Compose (đã tích hợp sẵn trong Docker Desktop)

## Chạy nhanh

```bash
# 1. Clone tất cả repo vào thư mục toeic-container/
mkdir toeic-container && cd toeic-container

git clone https://github.com/nbhson/omni-route.git
git clone https://github.com/nbhson/angular-toeic-reading.git toeic-reading-ui
git clone https://github.com/nbhson/angular-toeic-reading-be.git toeic-reading-be

# 2. Setup OmniRoute trên host machine
cd omni-route
cp .env.example .env
# Chỉnh sửa .env — BẮT BUỘC: JWT_SECRET, API_KEY_SECRET, INITIAL_PASSWORD
# Tạo secrets: openssl rand -base48 48 && openssl rand -hex 32
npm install
npm run dev              # OmniRoute chạy trên http://localhost:20128
# Giữ terminal này chạy, mở terminal mới cho bước 3

# 3. Trong terminal mới, chạy Docker (backend + frontend)
cd /path/to/toeic-container
docker compose up --build
```

### Lưu ý khi chạy lần đầu

- **OmniRoute chạy trên host machine** (không chạy trong Docker) do cần native modules phức tạp.
- **OmniRoute `.env`** cần ít nhất: `JWT_SECRET`, `API_KEY_SECRET`, `INITIAL_PASSWORD`
  - Tạo secrets: `openssl rand -base64 48` cho JWT_SECRET, `openssl rand -hex 32` cho API_KEY_SECRET
- **Backend kết nối OmniRoute** qua `host.docker.internal:20128` (đã cấu hình sẵn trong docker-compose.yml)
- **OmniRoute Dashboard** tại `http://localhost:20128` để cấu hình AI providers sau khi deploy.

## Truy cập

| Service | URL | Chạy ở đâu | Mô tả |
|---------|-----|------------|-------|
| Frontend | http://localhost | Docker | Angular SPA |
| Backend API | http://localhost:3000 | Docker | TOEIC API |
| Health Check | http://localhost:3000/api/health | Docker | Backend health check |
| OmniRoute Dashboard | http://localhost:20128 | Host machine | OmniRoute UI (AI proxy) |
| OmniRoute API | http://localhost:20128/v1 | Host machine | Chat completions endpoint |

## Docker Compose

```yaml
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis-data:/data

  backend:
    build: ./toeic-reading-be
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - ./toeic-reading-be/.env
    extra_hosts:
      - "host.docker.internal:host-gateway"

  frontend:
    build: ./toeic-reading-ui
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
```

### Flow kết nối

```
Browser → Frontend (:80) → /api/* → Backend (:3000) → host.docker.internal:20128 → OmniRoute (host machine) → AI Providers
```

Backend kết nối đến OmniRoute qua `host.docker.internal` (Đường gateway từ container sang host machine).
OmniRoute chạy trực tiếp trên host machine (không trong Docker) do cần native modules.

## Dockerfile - Backend

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY src ./src
EXPOSE 3000
CMD ["node", "src/server.js"]
```

- Sử dụng `npm ci --omit=dev` để chỉ cài production dependencies
- Copy source code và chạy trực tiếp `node src/server.js`

## Dockerfile - Frontend

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist/toeic-app/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- **Multi-stage build**: Stage 1 build Angular, stage 2 serve bằng Nginx
- Image cuối cùng chỉ chứa static files + Nginx (rất nhẹ)

## Nginx Config

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

- `try_files`: SPA fallback — mọi route trả về `index.html` (Angular Router xử lý)
- `proxy_pass`: Reverse proxy `/api/*` sang backend qua Docker network

## Các lệnh Docker Compose thường dùng

### Chạy (Start)

```bash
# Lần đầu: build image rồi chạy
docker compose up --build

# Chạy nền (detach mode) — terminal không bị chiếm
docker compose up --build -d

# Chạy lại mà không cần build lại (nếu code không đổi)
docker compose up -d
```

### Dừng (Stop)

```bash
# Dừng containers (giữ lại container, có thể start lại nhanh)
docker compose stop

# Dừng và xóa containers + network (clean hơn)
docker compose down

# Dừng + xóa containers + xóa cả images đã build
docker compose down --rmi all
```

### Restart (Khởi động lại)

```bash
# Restart tất cả services
docker compose restart

# Restart 1 service cụ thể
docker compose restart backend
docker compose restart frontend

# Dừng rồi chạy lại (nhanh, không rebuild)
docker compose down && docker compose up -d

# Dừng → Rebuild → Chạy lại (khi thay đổi code/Dockerfile)
docker compose down && docker compose up --build -d
```

### Xem logs

```bash
# Xem logs tất cả services (real-time)
docker compose logs -f

# Xem logs 1 service
docker compose logs -f backend
docker compose logs -f frontend

# Xem logs 100 dòng gần nhất
docker compose logs --tail=100 backend
```

### Kiểm tra trạng thái

```bash
# Xem containers đang chạy
docker compose ps

# Xem images đã build
docker images | grep toeic
```

### Vào shell container

```bash
docker compose exec backend sh
docker compose exec frontend sh
```

### Tóm tắt nhanh

| Hành động | Lệnh |
|-----------|------|
| Chạy lần đầu | `docker compose up --build` |
| Chạy nền | `docker compose up --build -d` |
| Dừng nhanh | `docker compose stop` |
| Dừng sạch | `docker compose down` |
| Restart | `docker compose restart` |
| Rebuild + chạy | `docker compose down && docker compose up --build -d` |
| Xem logs | `docker compose logs -f` |
| Kiểm tra | `docker compose ps` |

## Giải thích `docker compose up --build`

Lệnh này tự động thực hiện tất cả các bước:

| Bước | Hành động | Tự động? |
|------|-----------|-----------|
| Build image | Đọc Dockerfile, build image cho Backend và Frontend | ✅ |
| Tạo container | Tạo và start containers | ✅ |
| Tạo network | Tạo Docker network để services giao tiếp | ✅ |
| Map ports | Port 80 → frontend, 3000 → backend | ✅ |
| extra_hosts | Thêm host.docker.internal để container gọi được host | ✅ |
| Kết nối services | Backend → `http://host.docker.internal:20128/v1` → OmniRoute (host) | ✅ |

## Backend API Routes

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/health` | Health check |
| — | `/api/toeic/*` | TOEIC routes |
| — | `/api/toeic/keys/*` | Keys routes |
| — | `/api/toeic/stats/*` | Stats routes |

## Phát triển local (không dùng Docker)

### Backend

```bash
cd toeic-reading-be
npm install
cp .env.example .env   # Tạo file .env
npm run dev             # Chạy với --watch (auto-reload)
```

### Frontend

```bash
cd toeic-reading-ui
npm install
npm start               # ng serve - http://localhost:4200
```

## Troubleshooting

| Vấn đề | Giải pháp |
|---------|-----------|
| Port 80 đã bị chiếm | Đổi port trong `docker-compose.yml`: `"8080:80"` |
| Port 3000 đã bị chiếm | Đổi port trong `docker-compose.yml`: `"3001:3000"` |
| Port 20128 đã bị chiếm | Đổi port trong `docker-compose.yml`: `"20130:20128"` |
| OmniRoute build chậm | OmniRoute dùng Next.js build → cần 4GB RAM. Nếu OOM, tăng Docker memory limit |
| Backend không connect OmniRoute | Kiểm tra `OMNIROUTE_API_BASE_URL=http://host.docker.internal:20128/v1` và đảm bảo OmniRoute đang chạy trên host |
| OmniRoute chưa chạy | Đảm bảo OmniRoute đã chạy `npm run dev` trên host trước khi start Docker |
| CORS lỗi khi chạy local | Backend đã cấu hình `cors()`, kiểm tra file `.env` |
| Angular build lỗi | Chạy `npm run build` local trước để xác định lỗi |
| Nginx trả 404 cho SPA routes | Kiểm tra `nginx.conf` có `try_files $uri $uri/ /index.html` |
| OmniRoute cần Redis | Docker compose đã include Redis, OmniRoute `.env` cần `REDIS_URL=redis://redis:6379` |
