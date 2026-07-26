import { describe, expect, it } from 'vitest';

import {
  dispensePrescriptionSchema,
  idempotencyKeySchema,
  listDispensablePrescriptionsQuerySchema,
} from '../../src/modules/prescriptions/schemas/prescription.schemas';

describe('prescription dispense API schemas', () => {
  it('requires a UUID idempotency key for dispense commands', () => {
    expect(idempotencyKeySchema.safeParse('11111111-1111-4111-8111-111111111111').success).toBe(true);
    expect(idempotencyKeySchema.safeParse('rx-demo-waiting-0001').success).toBe(false);
    expect(idempotencyKeySchema.safeParse(undefined).success).toBe(false);
  });

  it('parses dispensed query without coercing the literal false string to true', () => {
    expect(listDispensablePrescriptionsQuerySchema.parse({ dispensed: 'false' }).dispensed).toBe(false);
    expect(listDispensablePrescriptionsQuerySchema.parse({ dispensed: 'true' }).dispensed).toBe(true);
    expect(listDispensablePrescriptionsQuerySchema.parse({}).dispensed).toBe(false);
  });

  it('coerces pagination defaults and rejects unsafe page sizes', () => {
    expect(listDispensablePrescriptionsQuerySchema.parse({ page: '2', pageSize: '50' })).toMatchObject({
      page: 2,
      pageSize: 50,
    });
    expect(() => listDispensablePrescriptionsQuerySchema.parse({ pageSize: '101' })).toThrow();
    expect(() => listDispensablePrescriptionsQuerySchema.parse({ page: '0' })).toThrow();
  });

  it('accepts only explicit dispense confirmation with a positive expected version', () => {
    expect(dispensePrescriptionSchema.parse({
      dispenseConfirmation: true,
      expectedVersion: 1,
    })).toEqual({
      dispenseConfirmation: true,
      expectedVersion: 1,
    });
    expect(() => dispensePrescriptionSchema.parse({
      dispenseConfirmation: false,
      expectedVersion: 1,
    })).toThrow();
    expect(() => dispensePrescriptionSchema.parse({
      dispenseConfirmation: true,
      expectedVersion: 0,
    })).toThrow();
  });
});
