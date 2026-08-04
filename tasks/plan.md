# Implementation Plan: Lab Technician Validation

## Phạm vi

Hoàn thiện validation đầu vào cho màn `/lab-technician`, đưa lỗi field-level từ backend
đến đúng ô nhập, bổ sung kiểm tra nghiệp vụ an toàn cho kết quả xét nghiệm và bảo vệ
quyền quản lý trị số tham chiếu.

## Giả định nghiệp vụ tạm thời

- Giữ `in_progress` để không phá vỡ dữ liệu và luồng hiện có; cần BA/PO xác nhận lại
  state machine theo workflow chính thức trước khi có migration loại bỏ trạng thái này.
- Chỉ `admin` được quản lý reference range trong phiên bản này vì đây là quyền thay đổi
  dữ liệu dùng chung và repo chưa có role `Trưởng khoa` riêng.
- Giữ loại Hoá sinh máu và bảng reference range hiện tại vì chúng đã được code và API sử
  dụng; việc đồng bộ lại tài liệu SQL là công việc dữ liệu/BA riêng.
- Giữ precision `DECIMAL(6,2)` cho `rbc` theo Prisma hiện tại; plan đang có mâu thuẫn giữa
  `(5,2)` và `(5,1)`, nên không tự ý migration khi chưa có SQL/BA chính thức.

## Các lát triển khai

1. Sửa chuẩn hóa lỗi `rule`, thêm test regression và field components accessible.
2. Thêm helper validation thuần cho CBC, Hoá sinh, Nước tiểu, Vi sinh và GPB; thêm test
   boundary/optional/abnormal-clinical-value.
3. Kết nối helper với result-entry panel/forms, inline lỗi API/local, attachment và
   conclusion; bổ sung các field GPB còn thiếu.
4. Siết backend Zod, kiểm tra user/role GPB, map unique report code và validation
   reference range; thêm migration `specimenCollectedAt`/precision RBC nếu Prisma hiện
   tại có thể migrate an toàn.
5. Kiểm tra RBAC, chạy typecheck/lint/test/build và review toàn bộ diff.

## Tiêu chí nghiệm thu

- Field-level backend error giữ nguyên thông điệp tiếng Việt và hiển thị đúng field.
- Mỗi nhóm số có test giá trị trống, ngoài ngưỡng và bất thường lâm sàng nhưng hợp lệ.
- Không ghi nhận kết quả vi sinh thiếu kết luận hoặc GPB có userId không hợp lệ/không đúng role.
- Không cho phép trùng `reportCode` và reference range có bound sai thứ tự.
- Không để lỗi validation nhạy cảm lọt vào log hoặc response 500 chung.
