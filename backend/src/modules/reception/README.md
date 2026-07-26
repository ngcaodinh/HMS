# Backend Module: reception

Owns normal patient reception: call-bound ticket → create patient/record → mark queue `served`.

## APIs

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/v1/receptions/doctors` | `reception.create` |
| POST | `/api/v1/receptions` | `reception.create` |
| GET | `/api/v1/patients` | `patient.search` (patients module) |

## Flow

1. Ticket must be `called` (from FIFO `call-next`).
2. XOR `existingPatientId` | `newPatient`.
3. Transaction: medical_record `open` + service_order + ticket `served` + `recordId`.

## Seed

```bash
npx tsx prisma/seeders/seed-reception-dev.ts
```
