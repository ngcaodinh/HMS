# Frontend Module: queue

Owns kiosk ticketing, queue display, and realtime queue UI.

## Routes

- `/` and `/kiosk`: public kiosk — **lấy số qua WebSocket** (`queue.ticket.issue`)
- `/queue-display`: LED public — REST snapshot + Socket events (no PII)
- `/queue-display/dermatology`: secondary dashboard mock (reuse services when wiring)

## Services

- `services/queue.socket.ts` — issue ticket + join room + subscribe events
- `services/queue.api.ts` — REST `/api/v1` (display, call-next, skip, recall, desk, reprint)

## Env (`.env.example`)

- `NEXT_PUBLIC_API_URL=http://localhost:4000`
- `NEXT_PUBLIC_SOCKET_URL=http://localhost:4000`
