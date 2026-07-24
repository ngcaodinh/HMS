# Backend Module: queue

Owns queue tickets, kiosk ticket creation (WebSocket + REST), call/skip/recall, and public display.

## HTTP (`/api/v1`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/queue-tickets` | Public + `Idempotency-Key` |
| POST | `/queue-tickets/:ticketId/print` | Public |
| GET | `/public/queue-display` | Public |
| GET | `/queue-tickets` | `queue.read` |
| POST | `/queue-tickets/call-next` | `queue.call` |
| POST | `/queue-tickets/desk` | `queue.manage` (bốc số quầy) |
| POST | `/queue-tickets/:ticketId/skip` | `queue.manage` |
| POST | `/queue-tickets/:ticketId/recall` | `queue.manage` |

## WebSocket (lấy số kiosk)

| Direction | Event | Payload |
|-----------|-------|---------|
| Client → Server | `queue.ticket.issue` | `{ idempotencyKey: uuid }` |
| Server → Client | `queue.ticket.issue.result` | `{ data: IssuedTicket }` |
| Server → Client | `queue.ticket.issue.error` | `{ error: { code, message } }` |
| Client → Server | `queue.join` | `{ date?: YYYY-MM-DD }` |
| Server → Room | `queue.ticket.called` / `queue.ticket.updated` | no PII |

Room: `queue:YYYY-MM-DD` (Asia/Ho_Chi_Minh).
