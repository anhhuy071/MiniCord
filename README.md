# MiniCord

MiniCord là dự án demo giao diện chat kiểu Discord, gồm:

- **Frontend**: React + TypeScript chạy với Vite (tập trung UI/layout)
- **Backend**: Node.js (Express + Socket.IO) theo mô hình realtime (hiện đang là scaffold)

Mục tiêu của repo là dựng nhanh UI và chuẩn bị nền tảng để nối Socket.IO cho chat theo server/channel.

## Mô tả hệ thống

### Frontend (Vite + React)

- Layout 4 cột: **Server sidebar** → **Channel sidebar** → **Main chat** → **Members sidebar**.
- Trạng thái chọn server/channel đang nằm ở UI (dữ liệu và message hiện hard-code để demo).
- UI sử dụng Bootstrap + FontAwesome, style bổ sung trong `frontend/src/assets/css/styles.css`.

### Backend (Express + Socket.IO)

- Dự kiến cung cấp HTTP API (ví dụ `/health`) và Socket.IO để:
  - client kết nối realtime
  - join room theo server/channel
  - gửi/nhận message theo room
- Cấu hình qua `.env` (xem `backend/.env.example`), kèm CORS giới hạn theo `FRONTEND_ORIGIN`.

### Luồng dữ liệu dự kiến

1. Frontend khởi tạo kết nối Socket.IO đến backend.
2. Khi người dùng chọn server/channel, client join room tương ứng.
3. Gửi message → backend broadcast cho các client trong cùng room.

## Cấu trúc dự án

- `backend/`: server Node.js (ESM). Entry: `src/server.js`. Scripts trong `backend/package.json`.
- `frontend/`: Vite + React + TypeScript. Entry: `src/main.tsx`. Build output: `frontend/dist/`.

## Yêu cầu

- Node.js 18+ (khuyến nghị)
- PowerShell (dùng cú pháp PowerShell)

## Cách chạy nhanh (Quick Start)

1. Tạo file môi trường cho backend:
   - Sao chép `backend/.env.example` → `backend/.env` và chỉnh:
     - `PORT` (mặc định 3000)
     - `FRONTEND_ORIGIN` (ví dụ: `http://localhost:5173`)

1. Cài dependencies và chạy backend:

```powershell
cd backend
npm install
npm run dev
```

Muốn chạy dạng start:

```powershell
cd backend
npm start
```

Debug bằng Node inspector:

```powershell
cd backend
node --inspect src/server.js
```

1. Cài dependencies và chạy frontend (dev):

```powershell
cd frontend
npm install
npm run dev
```

Mặc định Vite chạy ở `http://localhost:5173`.

## Quy ước

- ESM: `import`/`export`
- `dotenv` → `process.env` (giữ secrets trong `.env`)
- CORS: chỉ định một `FRONTEND_ORIGIN`
- Socket.IO trong `server.js`: `io.on('connection', ...)`
- ID: `uuid` → `import { v4 as uuidv4 } from 'uuid'`

## Ví dụ server

Route kiểm tra:

```js
app.get('/health', (req, res) => res.json({ ok: true }))
```

Socket.IO:

```js
io.on('connection', s => {
  console.log('connected', s.id)
  s.on('disconnect', () => console.log('disconnected', s.id))
})
```

CORS:

```js
import cors from 'cors'
app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }))
```

## Ghi chú

- `backend/src/server.js` hiện mới load biến môi trường (dotenv). Nếu chạy ngay, tiến trình có thể thoát vì chưa có HTTP server/listener.
- Chưa có lưu trữ; hiện repo phù hợp để demo UI và bổ sung dần phần realtime (in-memory trước, DB sau).

 

## Khắc phục sự cố

- CORS: kiểm tra `FRONTEND_ORIGIN` khớp origin của frontend (không có `/` cuối)
- Lỗi khởi động: kiểm tra Node (`node -v`), cài lại dependencies

## License

ISC

