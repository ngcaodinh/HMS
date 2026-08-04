# Nurse Input Validation TODO

- [x] Foundation: canonical AppError, P2002 mapping, RBAC policy.
- [x] Foundation: regression tests for five nurse business errors.
- [x] Vitals: backend schema and frontend helper/UI validation.
- [x] Emergency: cross-field identity, guardian phone, date/length/conflict handling.
- [x] Beds/Orders/Samples: mutation toasts and max-length rules.
- [x] Verification: test, typecheck, lint, build, review.

## Explicitly deferred pending PO/BA decision

- Queue ticket architecture shared by reception and nurse.
- Persistent emergency-bed state and audit design.
- Allergy blocking/test-reaction workflow.
- Specimen data source and `specimen_collections` domain ownership.
