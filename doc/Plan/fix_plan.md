# Integration Fix Plan Cho `integration/merge-7-branches-to-dev`

## Status
- Implementation: hoàn tất phần fix backend/frontend theo phạm vi integration.
- Verification: backend và frontend gates đã xanh trên workspace local.
- Merge readiness: sẵn sàng merge code vào `dev` sau khi người phụ trách xác nhận smoke test thủ công.
- Local DB note: MySQL Windows service `MYSQL80` hiện chỉ cấp quyền `hms_user` trên database `hms`, nên `backend/.env` local đang trỏ `mysql://hms_user:hms_password@localhost:3306/hms` để verify. Target chuẩn của repo/compose vẫn là `hms_vn` khi đã grant quyền đúng.

## Completed Changes
- Chuẩn hóa Prisma schema theo convention `PascalCase model + @@map("snake_case_table")`.
- Refactor backend khỏi delegate snake_case cũ như `prisma.lab_tests`, `prisma.medical_records`, `prisma.prescriptions`.
- Bổ sung/refactor các domain merge từ nhiều lane: lab tests, attachments, audit logs, prescriptions, medicines, beds/rooms/inpatient, specimen collections, vital sign logs, invoices/payments.
- Chuyển lookup bác sĩ nghiệp vụ reception từ bảng legacy `Doctor` sang `User` có role `doctor`, khớp FK `medical_records.doctorId`.
- Sửa queue allocation chịu được race khi nhiều worker/quầy cùng khởi tạo daily sequence.
- Chuẩn hóa auth principal/test fixtures theo shape mới: `userId`, `username`, `fullName`, `roleCodes`, `permissions`, `departmentId`, `authVersion`.
- Sửa invoice repository select thiếu field khi map DTO.
- Sửa BFF/frontend API client:
  - Dùng cookie `hms_session` thống nhất.
  - API client đi qua same-origin BFF proxy, không giữ access token trong browser localStorage.
  - Thêm `apiDelete<T>` và `apiPostMultipart<T>`.
  - Bổ sung CSRF/same-origin check cho non-GET proxy requests.
- Hợp nhất pharmacy workspace sang bản API-backed canonical cho dispense/reject flow.
- Bổ sung type declaration tối thiểu cho `jsbarcode`.
- Bổ sung backend env example cho MoMo/test callback/upload/CORS bằng placeholder an toàn.
- Cập nhật `.gitignore` để Git track đúng `doc/Plan/fix_plan.md` và `backend/prisma/migrations/**/migration.sql` mà không mở rộng sang toàn bộ tài liệu/SQL tạm.

## Verification Completed
Backend:
- `npm run prisma:generate`: pass sau khi generate client bình thường.
- `npm run prisma:migrate:deploy`: pass trên DB local `hms`, `2` migrations, no pending migrations.
- `npm run typecheck`: pass.
- `npm run build`: pass.
- `npm test -- --reporter=dot`: pass, `13` test files / `105` tests.
- Local DB đã sync với schema hiện tại; migration `20260726_integration_schema_merge` đã được mark applied vì schema local đã được apply trước đó bằng `prisma db push`.

Frontend:
- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm run build`: pass.
- `jsbarcode` đã được materialize trong `frontend/node_modules`.

Quality:
- Không còn conflict marker hoặc unmerged path trong worktree.
- `git diff --check`: không có whitespace error; chỉ còn cảnh báo LF sẽ đổi sang CRLF khi Git chạm file trên Windows.

## Remaining Before Merge
- Migration Prisma chính thức đã tạo: `backend/prisma/migrations/20260726_integration_schema_merge/migration.sql`.
- SQL migration đã kiểm tra nhanh:
  - Không có `DROP TABLE`, `DROP COLUMN`, `DELETE FROM`, `TRUNCATE`.
  - Có backfill `departments` legacy trước khi gắn FK `users.departmentId`.
  - FK `medical_records.doctorId -> users.id` khớp repository reception mới dùng `User` role `doctor`.
- Quyết định DB local/dev chuẩn trước khi deploy môi trường mới:
  - Hoặc grant `hms_user` quyền trên `hms_vn`.
  - Hoặc cập nhật compose/env dùng thống nhất một database.
- Khi chạy trên database chuẩn `hms_vn`, dùng:
  - `npm run prisma:migrate:deploy`
  - `npm test -- --reporter=dot`
- Smoke test thủ công các flow chính:
  - login -> `/auth/me`
  - queue issue/call/serve
  - reception tạo medical record với doctor là `User`
  - emergency admission không tạo queue ticket
  - doctor order lab
  - lab upload/result/sign
  - pharmacy list/dispense/reject prescription
  - nurse barcode/beds/inpatient

## Security Notes
- Không commit secret thật trong `.env`; file này vẫn phải nằm ngoài Git.
- `backend/.env.example` chỉ dùng placeholder cho MoMo/JWT/dev password.
- BFF proxy dùng same-origin check cho request có side effect.
- Attachment upload vẫn phải giữ validate MIME/size và không expose local file path.
- Audit metadata không nên ghi raw PII/MED/token.

## Merge Rule
- Có thể squash/merge vào `dev` sau khi smoke test thủ công đạt.
- Khi deploy sang DB mới/chuẩn, chạy migration chính thức thay vì `prisma db push`.
