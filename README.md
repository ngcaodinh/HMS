# HMS — Hospital Management System

HMS là nền tảng quản lý bệnh viện theo workflow, hỗ trợ vận hành liên thông từ
tiếp nhận, hàng đợi, khám bệnh, xét nghiệm, điều trị nội trú, nhà thuốc đến hóa
đơn, thanh toán, bảo hiểm y tế và báo cáo quản trị.

> Đây là hệ thống xử lý dữ liệu y tế. Chỉ sử dụng dữ liệu tổng hợp hoặc dữ liệu
> đã ẩn danh trong môi trường phát triển, kiểm thử và tài liệu.

## Phạm vi nghiệp vụ

| Khu vực | Năng lực chính |
| --- | --- |
| Kiosk và hàng đợi | Lấy số công khai, gọi số, hiển thị hàng đợi theo khoa và realtime |
| Lễ tân | Tìm/tạo hồ sơ, đăng ký lượt khám, tiếp nhận tái khám và cấp cứu |
| Bác sĩ | Worklist, sinh hiệu, chẩn đoán, chỉ định xét nghiệm và kê đơn |
| Điều dưỡng | Buồng bệnh, giường, y lệnh chăm sóc, sinh hiệu và thủ tục xuất viện |
| Xét nghiệm | Tiếp nhận mẫu, nhập kết quả, khoảng tham chiếu, xác nhận và in kết quả |
| Dược | Danh mục thuốc, tồn kho, FEFO, xuất thuốc, từ chối và XML điện tử |
| Kế toán | Hóa đơn, tạm ứng, thanh toán, hoàn/hủy, bảng kê và bảo hiểm y tế |
| Giám đốc/Admin/IT | Dashboard, audit log, danh mục, phân quyền và tài khoản nhân viên |

## Công nghệ và kiến trúc

- **Backend:** Express, TypeScript, Prisma và MySQL.
- **Frontend:** Next.js App Router, React, TypeScript và TanStack Query.
- **Realtime:** Socket.IO cho các sự kiện hàng đợi.
- **Validation:** Zod ở các biên request và form quan trọng.
- **Bảo mật:** Helmet, CORS, cookie/session, RBAC, audit và giới hạn đăng nhập.
- **Thanh toán:** MoMo sandbox/mock tùy cấu hình môi trường.

```text
HMS/
├── backend/
│   ├── prisma/                 # Schema, migration và seed dữ liệu phát triển
│   └── src/
│       ├── core/               # HTTP, lỗi, database, logger, thời gian
│       ├── middlewares/        # Context, auth, permission và error handling
│       ├── modules/            # Module nghiệp vụ theo bounded context
│       ├── routes/             # Router tổng hợp API v1
│       └── sockets/            # Realtime queue events
├── frontend/
│   └── src/
│       ├── app/                # Route và page của Next.js
│       ├── modules/            # UI, state và API theo nghiệp vụ
│       └── shared/             # API client, auth, hooks và UI dùng chung
├── contracts/                  # Hợp đồng dữ liệu liên module
├── doc/                        # Workflow, coding standard, test plan và mẫu UI
└── tasks/                      # Kế hoạch và công việc đang theo dõi
```

Backend phục vụ API dưới namespace `/api/v1`. Frontend dùng API client/BFF
same-origin cho các request của trình duyệt; Socket.IO phục vụ cập nhật hàng
đợi theo thời gian thực.

## Yêu cầu trước khi chạy

- Node.js 20 LTS trở lên và npm.
- Docker Desktop có hỗ trợ Docker Compose.
- Git.

## Khởi động nhanh

### 1. Cài đặt và khởi động MySQL

Từ thư mục gốc repository:

```powershell
docker compose up -d mysql
```

### 2. Cấu hình backend

Tạo file môi trường cục bộ từ mẫu, sau đó thay các giá trị placeholder bằng
credential phù hợp với máy phát triển. Không commit file `.env`.

```powershell
Copy-Item backend/.env.example backend/.env
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed:identity
```

`DATABASE_URL` trong `backend/.env` phải trỏ tới instance MySQL đang chạy. Các
biến `JWT_*`, `MOMO_*` và mật khẩu seed chỉ được dùng cho môi trường cục bộ;
không dùng lại chúng ở staging hoặc production.

### 3. Cấu hình frontend

Mở terminal mới:

```powershell
cd frontend
npm install
```

Tạo `frontend/.env.local` với các URL local cần thiết:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

### 4. Chạy ứng dụng

Terminal backend:

```powershell
cd backend
npm run dev
```

Terminal frontend:

```powershell
cd frontend
npm run dev
```

Mở <http://localhost:3000>. Backend mặc định chạy tại
<http://localhost:4000>.

## Các lệnh thường dùng

### Backend

| Lệnh | Mục đích |
| --- | --- |
| `npm run dev` | Chạy API ở chế độ watch |
| `npm run build` | Biên dịch TypeScript vào `dist/` |
| `npm start` | Chạy bản backend đã build |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm run lint` | Chạy ESLint |
| `npm run format` | Kiểm tra Prettier |
| `npm test` | Chạy Vitest |
| `npm run prisma:studio` | Mở Prisma Studio |
| `npm run prisma:migrate` | Tạo migration trong môi trường phát triển |

### Frontend

| Lệnh | Mục đích |
| --- | --- |
| `npm run dev` | Chạy Next.js ở cổng 3000 |
| `npm run build` | Tạo production build |
| `npm start` | Chạy production build |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm run lint` | Chạy Next.js ESLint |
| `npm run format` | Kiểm tra Prettier |
| `npm test` | Chạy test frontend bằng Node test runner |

Lệnh `frontend/npm test` dùng `tsx` từ `backend/node_modules`; hãy cài
dependency của backend trước khi chạy test frontend.

## Quy tắc dữ liệu và quyền truy cập

- API phải kiểm tra xác thực, vai trò và permission ở đúng boundary; frontend
  chỉ hiển thị trạng thái, không thay thế kiểm tra quyền của backend.
- Dữ liệu bệnh nhân, hồ sơ bệnh án, xét nghiệm, thanh toán và audit log được xem
  là dữ liệu nhạy cảm.
- Không đưa PII/PHI, token, secret, credential thật hoặc payload thật vào
  commit, fixture, log hay ví dụ trong tài liệu.
- Mọi thay đổi workflow cần đối chiếu với tài liệu nguồn
  `HMS-VN-WorkFlow(Fixed) (2).md`.

## Kiểm tra trước khi gửi thay đổi

Chạy các lệnh phù hợp ở cả `backend/` và `frontend/`:

```powershell
npm run typecheck
npm run lint
npm run format
npm test
npm run build
```

Nếu một lệnh thất bại do baseline hoặc môi trường, ghi rõ command, file và
nguyên nhân trong mô tả thay đổi; không sửa lan sang phạm vi không liên quan.

## Tài liệu liên quan

- [Workflow nghiệp vụ HMS](./HMS-VN-WorkFlow%28Fixed%29%20%282%29.md)
- [Coding standard](./doc/Coding_standard.md)
- [Kế hoạch công việc](./tasks/plan.md)
- [Danh sách việc cần làm](./tasks/todo.md)
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)

## Đóng góp

1. Đọc `AGENTS.md`, coding standard và workflow trước khi sửa code.
2. Giữ thay đổi nhỏ, đúng module và không thay đổi behavior ngoài yêu cầu.
3. Bổ sung test cho logic mới hoặc lỗi đã sửa.
4. Cập nhật comment/JSDoc tiếng Việt cho contract và side effect không hiển
   nhiên.
5. Chạy quality gates, kiểm tra diff và mô tả rõ blocker trước khi merge.
