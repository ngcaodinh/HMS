# Backend Module: payments (Lane 8)

Cash + **Momo Sandbox** (port từ `doc-momo/`) + IPN + sync sau return.

## API

| Method | Path | Auth |
|--------|------|------|
| POST | `/invoices/:id/cash-payments` | `payment.cash.create` + Idempotency-Key |
| POST | `/invoices/:id/momo-payment-requests` | `payment.momo.create` + Idempotency-Key |
| GET | `/invoices/:id/payment-status` | `payment.read` |
| POST | `/invoices/:id/momo-sync` | `payment.read` (query Momo nếu IPN chưa về) |
| POST | `/webhooks/momo` | **Public** IPN |

## Sandbox setup

```env
USE_MOMO_MOCK=false
MOMO_ENV=test
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=...
MOMO_SECRET_KEY=...
# payWithMethod = ví + ATM + Visa/Mastercard (khuyến nghị)
# captureWallet = chủ yếu quét mã / ví MoMo
MOMO_REQUEST_TYPE=payWithMethod
MOMO_RETURN_URL=http://localhost:3000/accounting?momo=return
MOMO_IPN_URL=https://<ngrok-id>.ngrok-free.app/api/v1/webhooks/momo
```

1. `ngrok http 4000` → gán `MOMO_IPN_URL` (Momo **không** gọi được `localhost`).
2. Restart backend.
3. FE: HĐ pending → **Thanh toán Momo** → **redirect full-page** sang `payUrl` (trang Momo Sandbox).
4. Trên trang Momo (`requestType=payWithMethod`): chọn **quét QR / ví MoMo / ATM / Visa / Mastercard**.
5. Dùng **MoMo Test App** + thẻ test (không dùng app/thẻ production).
6. Sau thanh toán Momo redirect về `/accounting?momo=return&invoiceId=...` → poll + `momo-sync` / IPN → `paid`.

## Vì sao sandbox báo “Từ chối giao dịch”?

Tạo đơn (`POST .../momo-payment-requests`) thường **thành công** (`resultCode: 0` + có `payUrl`).  
Lỗi **từ chối** xảy ra **lúc xác nhận trên trang/app MoMo**, không phải lúc BE tạo đơn.

| Nguyên nhân phổ biến | Cách xử lý |
|----------------------|------------|
| Dùng **app MoMo thật** (CH Play / App Store) với link **sandbox** | Gỡ app thật, cài **MoMo Test App**: https://developers.momo.vn/v3/download/ |
| Ví test chưa nạp tiền / chưa liên kết thẻ test | Top-up trong app test; thẻ ATM demo `9704 05xx xxxx xxxx` |
| OTP/mật khẩu sai | App test: password `000000`, OTP `000000` (hoặc `0000`) |
| Tài khoản bị hạn chế 24h đầu / eKYC | Chờ hoặc tạo ví test mới theo hướng dẫn MoMo |
| Chọn ATM/CC thật thay vì ví test | Dùng `captureWallet` (mặc định) hoặc thẻ test bảng dưới |
| resultCode **1006** | User bấm hủy / không xác nhận |
| resultCode **1001** | Không đủ số dư ví test |
| resultCode **1002** | Issuer từ chối (sai app/thẻ/môi trường) |
| resultCode **1005** | QR/link hết hạn — tạo lại payment request |

### Test wallet (tóm tắt MoMo Docs)

1. Cài **MoMo Test App** (gỡ app production trước).
2. Đăng ký SĐT 10 số bất kỳ; OTP `000000`; mật khẩu 6 số (vd. `000000`).
3. Liên kết thẻ demo + nạp tiền trong app.
4. Quét / mở `payUrl` sandbox → đăng nhập ví test → xác nhận.

### Thẻ ATM test (nếu chọn phương thức thẻ)

| Case | Số thẻ | Hết hạn | OTP |
|------|--------|---------|-----|
| Thành công | 9704 0000 0000 0018 | 03/07 | OTP |
| Không đủ tiền | 9704 0000 0000 0034 | 03/07 | OTP |

Probe tạo đơn (kiểm tra credential BE):

```bash
npx tsx scripts/momo-create-probe.ts
```

## Seed demo

```bash
npx tsx prisma/seeders/seed-reception-dev.ts
npx tsx prisma/seeders/seed-billing-payment-demo.ts
```

In ra 3 `invoiceId` **pending** để test cash/Momo.

## Mock offline

`USE_MOMO_MOCK=true` → payUrl giả; dùng `momo-sync` hoặc IPN giả để settle (không cần app test).
