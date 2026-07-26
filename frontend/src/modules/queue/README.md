# Frontend Module: queue

Owns kiosk ticketing, queue display, and realtime queue UI.

## Routes

- `/` and `/kiosk`: public kiosk — **lấy số qua REST** (`POST /api/v1/queue-tickets`)
- `/queue-display`: LED public — REST snapshot + Socket events (no PII)
- `/queue-display/dermatology`: secondary dashboard mock (reuse services when wiring)

## Kiosk flow

Giữ **UI modal cũ** (số thứ tự · In lại · Đã nhận phiếu). Chỉ bổ sung:

1. BN bấm **LẤY SỐ** → issue (lưu DB) → hiện modal xác nhận như ban đầu → **tự mở dialog in Windows**.
2. Khi đóng dialog in (In hoặc Cancel) → vẫn modal xác nhận; có thể **In lại** hoặc **Đã nhận phiếu · Quay lại** màn lấy số.
3. Kiosk không mở Socket.IO khi lấy số.

## Services

- `services/queue.api.ts` — REST `/api/v1` (issue, reprint, display, call-next, skip, recall, desk)
- `services/queue.socket.ts` — LED join room + subscribe events

## Env (`.env.example`)

- `NEXT_PUBLIC_API_URL=http://localhost:4000`
- `NEXT_PUBLIC_SOCKET_URL=http://localhost:4000`
