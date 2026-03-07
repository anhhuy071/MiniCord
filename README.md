# MiniCord Real-Time Architecture Demo

MiniCord là dự án demo giao diện chat kiểu Discord, tập trung vào việc mô phỏng kiến trúc realtime (thời gian thực) quy mô lớn trong môi trường ứng dụng web.

Dự án bao gồm hai phần:
- **Frontend**: React + TypeScript chạy với Vite
- **Backend**: Node.js (Express + Socket.IO)

Mục tiêu chính của dự án không chỉ dựng UI mà còn để **học và áp dụng best practices** từ hệ thống thời gian thực của Discord (chẳng hạn như quản lý Event-Driven, Heartbeats, State Recovery, và Scalability).

---

## 🏗️ Kiến Trúc Hệ Thống & Phân Tích Hiện Tại

Dưới đây là phân tích những **điểm chưa tốt (anti-patterns)** trong phiên bản ban đầu và cách kiến trúc hệ thống lớn giải quyết chúng:

### 1. Quản Trị Trạng Thái (State Management)
- ❌ **Cái sai hiện tại:** Backend đang giữ toàn bộ lịch sử tin nhắn trong bộ nhớ (`let messagesByRoom = {}`) và ghi định kỳ ra một file `messages.json`.
- ⚠️ **Tại sao lại sai?** 
  - Nếu server crash đột ngột, bạn sẽ mất dữ liệu chưa kịp ghi vào JSON. 
  - Bộ nhớ RAM của Node.js là hữu hạn. Khi số lượng phòng chat hàng trăm ngàn, server sẽ bị sập vì quá tải (Out of Memory - OOM).
  - Khởi tạo File API (như `fs.writeFile`) trên một thread chính (Event Loop) có thể gây nghẽn cổ chai (block event loop) khi dữ liệu JSON quá lớn.
- ✅ **Best Practice (Kiểu Discord):** Sử dụng Cơ sở dữ liệu phân tán (Cassandra/ScyllaDB) cho lưu trữ bền vững. Đồng thời, dùng cơ sở dữ liệu In-Memory nhẹ như **Redis** để cache các tin nhắn gần nhất nhằm phản hồi nhanh.

### 2. Khả Năng Mở Rộng Theo Chiều Ngang (Horizontal Scaling)
- ❌ **Cái sai hiện tại:** Setup Socket.IO hiện tại mặc định client gắn rễ vào một Node process duy nhất. Nếu lượng người dùng tăng lên, bạn bật 3 server Node.js lên thì những User ở Server A gửi tin nhắn, User ở Server B sẽ **không bao giờ nhận được**.
- ✅ **Best Practice:** Cần tích hợp một **Pub/Sub Broker** (như Redis Pub/Sub, RabbitMQ, Kafka). Khi User ở Server A gửi tin vào Room 1, Server A sẽ bắn một event Pub/Sub cho hệ thống biết. Server B (đang giữ kết nối Socket cho User C cũng ở chung Room 1) sẽ nhận Pub/Sub event đó và bắn tới User C. Socket.IO có hỗ trợ sẵn **Redis Adapter** giải quyết vấn đề này.

### 3. Phục Hồi Kết Nối (Connection Recovery) & Heartbeats
- ❌ **Thiếu sót:** Khi client bị rớt mạng và kết nối lại sau 2 phút, họ có thể bỏ lỡ 10 tin nhắn mới. Thiết kế hiện tại bắt họ fetch lại toàn bộ lịch sử để đồng bộ lại (tốn data và server load).
- ✅ **Best Practice:** Giữ lại một bộ đếm hoặc Event ID. Khi mất kết nối và nối lại, Client sẽ gửi sequence id cuối cùng mà nó bắt được, và server chỉ "replay" lại những sự kiện đã lỡ (catch-up mechanism), thay vì gửi lại cục history to đùng.

---

## 🛠 Cấu Trúc Dự Án

- `backend/`: server Node.js (ESM). Chứa logic WebSocket. Entry point: `src/server.js`.
- `frontend/`: Ứng dụng React Vite TypeScript. Entry point: `src/main.tsx`. Build files nằm tại `frontend/dist/`.

## 🚀 Requirement & Cài Đặt (Quick Start)

### Yêu Cầu
- Node.js 18+ 
- PowerShell (hoặc Terminal tương tự)

### 1. Khởi động Backend
- Sao chép file `.env`: 
  ```powershell
  cp backend/.env.example backend/.env
  ```
- Cài Node packages và chạy server (mặc định PORT 3000):
  ```powershell
  cd backend
  npm install
  npm run dev
  ```

### 2. Khởi động Frontend
- Từ root repo, mở terminal riêng:
  ```powershell
  cd frontend
  npm install
  npm run dev
  ```
- Mặc định UI sẽ chạy ở `http://localhost:5173`.

---

## 💻 Quy Ước Dev

- Cơ chế Module: **ESM (`import`/`export`)**.
- Quản lý Event: Luôn chia nhóm bằng tên miền, ví dụ `room:join`, `chat:send`. Tránh để tên event lẫn lộn. Không gửi raw text mà gửi objects có schema rõ ràng (`{ event, data, timestamp }`).
- Mã Định Danh ID: Dùng `UUID` để tạo unique message ID.
- Xử lý Biến Môi Trường: Qua thư viện `dotenv` -> `process.env`.
- Cross-Origin (CORS): Yêu cầu strict, backend chỉ nhận request từ `FRONTEND_ORIGIN` định sẵn.

---

## Quyền Sở Hữu / License
Dự án được phân phối dưới giấy phép **ISC**.
