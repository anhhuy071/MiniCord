# MiniCord

Chat realtime tối giản với Node.js (Express + Socket.IO) và frontend tĩnh.

## Cấu trúc dự án

- `backend/`: server Node.js (ESM), entry `src/server.js`, script trong `package.json`.
- `frontend/`: client tĩnh (chưa có build tool).

## Yêu cầu

- Node.js 18+ (khuyến nghị)
- PowerShell (dùng cú pháp PowerShell)

## Cách chạy nhanh (Quick Start)

1. Tạo file môi trường cho backend:
   - Sao chép `backend/.env.example` → `backend/.env` và chỉnh:
     - `PORT` (mặc định 3000)
     - `FRONTEND_ORIGIN` (ví dụ: `http://localhost:5173`)

2. Cài dependencies và chạy backend:

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

- `backend/src/server.js` có thể đang trống — thêm scaffold tối thiểu (Express + CORS + HTTP server + Socket.IO + `/health`).
- Chưa có lưu trữ; dùng in-memory hoặc thêm sau (SQLite/file).

 

## Khắc phục sự cố

- CORS: kiểm tra `FRONTEND_ORIGIN` khớp origin của frontend (không có `/` cuối)
- Lỗi khởi động: kiểm tra Node (`node -v`), cài lại dependencies

## License

ISC

