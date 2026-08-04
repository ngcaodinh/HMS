# Implementation Plan: Nurse Input Validation

## Overview

Hoàn thiện validation hai lớp Frontend/Backend và hiển thị lỗi nghiệp vụ rõ ràng cho các màn
`/nurse` theo `doc/Plan/PLAN_nurse_input_validation.md`. Dữ liệu y tế phải được kiểm tra ở
backend trước khi chạm database; frontend chỉ cải thiện phản hồi sớm và không thay thế kiểm tra
server.

## Architecture decisions

- Dùng một `AppError` canonical tại `backend/src/core/errors/appError.ts`; các đường dẫn cũ chỉ
  re-export để tương thích, không tạo thêm class làm hỏng `instanceof`.
- Chuẩn hóa lỗi Prisma `P2002` tại error handler dùng thật bởi `app.ts`, trả `409 CONFLICT_ERROR`
  và chi tiết field an toàn, không trả stack trace hoặc dữ liệu nhạy cảm.
- Tách validation thuần của nurse vào helper frontend để kiểm thử độc lập; component chỉ ghép
  state, hiển thị lỗi và gọi mutation.
- Giữ nguyên các thiết kế chưa đủ quyết định nghiệp vụ: queue dùng chung, trạng thái emergency
  bed, allergy workflow và nguồn dữ liệu specimen.

## Task list

### Phase 1: Shared error and authorization foundation

- [x] Hợp nhất `AppError`, bổ sung mapping Prisma `P2002`, thêm policy cho identity/treatment order.
- [x] Bổ sung test response contract cho `VERSION_CONFLICT`, `BED_UNAVAILABLE`, `TICKET_NOT_CALLED`,
      `VITALS_ALREADY_RECORDED`, `SPECIMEN_ALREADY_COLLECTED`.

### Phase 2: Vitals and emergency identity

- [x] Đồng bộ giới hạn sinh hiệu FE/BE, kiểm tra quan hệ huyết áp, giới hạn allergy note và hiển thị
      lỗi mutation.
- [x] Cho phép định danh cấp cứu bằng CCCD hoặc cặp người giám hộ + số điện thoại; thêm giới hạn
      ngày sinh, độ dài và xử lý conflict.

### Checkpoint: clinical validation

- [x] Backend tests và frontend tests cho boundary, cross-field rules, RBAC và error mapping pass.
- [x] Typecheck/lint/build của backend và frontend pass.

### Phase 3: Beds and treatment orders

- [x] Đưa mutation Beds/Orders/Samples về toast hoặc inline error nhất quán, giữ cơ chế disable double-submit.
- [x] Thêm giới hạn ký tự cho lý do chuyển giường và hủy y lệnh.

### Checkpoint: complete

- [x] Chạy full test suite, typecheck, lint, build trong phạm vi môi trường khả dụng.
- [x] Review diff và xác nhận không triển khai các mục thiết kế đang chờ PO/BA.

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Error class trùng làm response rơi về 500 | Cao | Canonical class + compatibility re-export + regression tests |
| Sai lệch FE/BE trong rule y tế | Cao | Dùng cùng boundary/message và test hai phía |
| Hiển thị lỗi server nhạy cảm | Cao | Chỉ expose code/message/details field-level đã chuẩn hóa |
| Thay đổi nhầm nghiệp vụ chưa chốt | Cao | Giữ ngoài phạm vi các mục 1.2, 1.4, 1.5, 1.6 |
