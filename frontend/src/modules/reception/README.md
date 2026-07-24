# Frontend Module: reception

Owns normal and emergency patient reception workflows.

## `/reception`

- Left: queue panel — **call-next FIFO**, skip, recall, desk issue (waiting only).
- Right: form bound to **active called ticket** only.
- Search patient → reuse `existingPatientId`, or fill `newPatient`.
- Submit → `POST /api/v1/receptions` with `queueTicketId`.
