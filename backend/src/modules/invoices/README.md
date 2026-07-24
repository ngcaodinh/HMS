# Backend Module: invoices (Lane 7)

Owns invoices, BHYT Decimal calculation, statements, write-offs, claim draft/void, and **BillingSettlementPort** / **BillingPaymentIntentPort** implementations.

Payment (Lane 8) must not import this repository — only call ports.

## HTTP (`/api/v1`) — planned

| Method | Path | Permission |
|--------|------|------------|
| POST | `/invoices` | `invoice.create` |
| GET | `/invoices/:invoiceId` | `invoice.read` |
| GET | `/invoices?recordId=` | `invoice.read` |
| POST | `/invoices/:invoiceId/statements/sign` | `statement.sign` |
| POST | `/invoices/:invoiceId/cancel` | `invoice.cancel` |
| POST | `/invoices/:invoiceId/write-off` | `invoice.write_off` |

## Internal ports

- `BillingSettlementPort.confirm` — cash/Momo settle → `paid`
- `BillingPaymentIntentPort.registerMomo` — register Momo order before payUrl

## Money

- API: decimal **string** `^\d+(\.\d{2})$`
- DB: `Decimal(18,2)`
- Client must not send unit prices / totals / fund amounts

## Status

PR-A: schema + ports + money utils. PR-B+: services/routes.
