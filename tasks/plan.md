# Implementation Plan: Pharmacy Input Validation

## Overview

Complete pharmacy input validation and workflow guards based on
`doc/Plan/PLAN_pharmacy_input_validation.md`. Remove mock data from the inventory,
XML and stock-report screens in scope. Stock import and the XML import modal remain
outside this plan.

## Architecture decisions

- Validate route params/query/body with Zod; services receive parsed input.
- Check invoices in the same transaction as cancel/dispense commands.
- Return the latest active invoice (`pending` or `paid`) from the dispense queue.
- Use real API data and boundary schemas for inventory and stock movements.
- Escape all free text before inserting it into the print window HTML.

## Task list

### Phase 1: Backend contract and business guards

- [x] Add keyword, UUID, cancel-reason (10-500) and date-range validation.
- [x] Block cancellation when an invoice is pending/paid.
- [x] Block dispensing unless a paid invoice exists, inside the transaction.
- [x] Return real invoice status/id in the dispense queue.
- [x] Add schema and business-guard regression tests.

### Phase 2: Frontend dispense and security

- [x] Limit search/reject input and display counters/API field errors.
- [x] Disable invalid actions and refetch after version/conflict errors.
- [x] Escape all dynamic values before `document.write` label printing.
- [x] Use real invoice data and normalized error messages.

### Phase 3: Real pharmacy data screens

- [x] Connect inventory list/summary with loading/error and bounded search.
- [x] Connect stock movements with date/type filters and `from <= to` validation.
- [x] Connect XML screen to the selected prescription and real download endpoint.
- [x] Remove fake success messages for export/FEFO sync without an endpoint.

### Checkpoint: complete

- [x] Frontend tests, typecheck, lint and build pass.
- [x] Backend targeted tests, typecheck and build pass; full-suite DB blockers recorded.
- [x] Review correctness, security, architecture, performance and dead-code impact.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Multiple invoices for one medical record | High | Select the latest active invoice; re-check in the command transaction. |
| Inventory API lacks mock-only fields | Medium | Render only server-backed fields; do not invent data. |
| XML endpoint returns binary | Medium | Use blob for download and text conversion for preview. |
| Client state is stale or bypassed | High | Enforce guards on the backend and refetch after conflicts. |

## Scope note

The plan intentionally leaves the existing stock-import and XML-import flows unchanged,
because their complete backend repository workflow is outside the requested validation
scope.
