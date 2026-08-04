import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { errorHandler } from '../src/middlewares/errorHandler';
import { getVietnamLegalDateString } from '../src/core/time/vietnamClock';
import { searchPatientsQuerySchema } from '../src/modules/patients/schemas/patient.schemas';
import {
  createEmergencyBodySchema,
  normalizeEmergencyIdentityBodySchema,
} from '../src/modules/reception/schemas/emergency.schemas';
import { createReceptionBodySchema } from '../src/modules/reception/schemas/reception.schemas';

const validReceptionBody = {
  queueTicketId: '11111111-1111-4111-8111-111111111111',
  doctorId: '22222222-2222-4222-8222-222222222222',
  newPatient: {
    fullName: 'Nguyen Van A',
    dateOfBirth: '1990-01-15',
    gender: 'male' as const,
    phoneNumber: '0912345678',
    privacyNoticeAccepted: true as const,
  },
};

const getTomorrow = (dateString: string): string => {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
};

const expectIssue = (
  result: ReturnType<typeof createReceptionBodySchema.safeParse>,
  path: readonly string[],
  message: string | RegExp,
) => {
  expect(result.success).toBe(false);
  if (result.success) return;

  const issue = result.error.issues.find((item) => item.path.join('.') === path.join('.'));
  expect(issue).toBeDefined();
  if (message instanceof RegExp) {
    expect(issue?.message).toMatch(message);
    return;
  }

  expect(issue?.message).toBe(message);
};

describe('reception validation schemas', () => {
  it('accepts all valid boundary values and trims supported text fields', () => {
    const today = getVietnamLegalDateString();
    const result = createReceptionBodySchema.safeParse({
      ...validReceptionBody,
      chiefComplaint: 'a'.repeat(500),
      newPatient: {
        ...validReceptionBody.newPatient,
        fullName: `  ${'a'.repeat(255)}  `,
        dateOfBirth: '1900-01-01',
        phoneNumberUnavailableReason: null,
        identityCardNumber: '123456789012',
        address: 'a'.repeat(500),
        healthInsuranceCode: 'a'.repeat(20),
        healthInsuranceExpiryDate: today,
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.newPatient?.fullName).toBe('a'.repeat(255));
  });

  it.each([
    ['empty full name', { fullName: '' }, ['newPatient', 'fullName'], 'Họ và tên là bắt buộc'],
    [
      'full name over max length',
      { fullName: 'a'.repeat(256) },
      ['newPatient', 'fullName'],
      'Họ và tên tối đa 255 ký tự',
    ],
    ['invalid gender', { gender: 'other' }, ['newPatient', 'gender'], /Invalid enum value/],
    [
      'invalid date format',
      { dateOfBirth: '15-01-1990' },
      ['newPatient', 'dateOfBirth'],
      'Ngày sinh phải theo định dạng YYYY-MM-DD',
    ],
    [
      'date before allowed range',
      { dateOfBirth: '1899-12-31' },
      ['newPatient', 'dateOfBirth'],
      'Ngày sinh không hợp lệ',
    ],
    [
      'missing phone and reason',
      { phoneNumber: null, phoneNumberUnavailableReason: null },
      ['newPatient', 'phoneNumber'],
      'Bắt buộc nhập số điện thoại hoặc lý do không có SĐT',
    ],
    [
      'reason shorter than minimum',
      { phoneNumber: null, phoneNumberUnavailableReason: 'ab' },
      ['newPatient', 'phoneNumberUnavailableReason'],
      'Lý do không có SĐT phải có ít nhất 3 ký tự',
    ],
    [
      'reason over maximum',
      { phoneNumber: null, phoneNumberUnavailableReason: 'a'.repeat(256) },
      ['newPatient', 'phoneNumberUnavailableReason'],
      'Lý do không có SĐT tối đa 255 ký tự',
    ],
    [
      'invalid identity card',
      { identityCardNumber: '12345678901' },
      ['newPatient', 'identityCardNumber'],
      'Căn cước công dân phải đủ 12 chữ số',
    ],
    [
      'address over maximum',
      { address: 'a'.repeat(501) },
      ['newPatient', 'address'],
      'Địa chỉ tối đa 500 ký tự',
    ],
    [
      'insurance code over maximum',
      { healthInsuranceCode: 'a'.repeat(21) },
      ['newPatient', 'healthInsuranceCode'],
      'Mã thẻ BHYT tối đa 20 ký tự',
    ],
    [
      'insurance expiry with invalid format',
      { healthInsuranceExpiryDate: '2026/01/01' },
      ['newPatient', 'healthInsuranceExpiryDate'],
      'Ngày hết hạn BHYT phải theo định dạng YYYY-MM-DD',
    ],
    [
      'privacy consent is false',
      { privacyNoticeAccepted: false },
      ['newPatient', 'privacyNoticeAccepted'],
      /Invalid literal value, expected true/,
    ],
    ['invalid doctor id', {}, ['doctorId'], /Invalid uuid/],
  ] as const)(
    'rejects %s with the correct field message',
    (caseName, patientOverrides, path, message) => {
      const result = createReceptionBodySchema.safeParse({
        ...validReceptionBody,
        doctorId: caseName === 'invalid doctor id' ? 'not-a-uuid' : validReceptionBody.doctorId,
        newPatient: {
          ...validReceptionBody.newPatient,
          ...patientOverrides,
        },
      });

      expectIssue(result, path, message);
    },
  );

  it('returns a specific Vietnamese message for an invalid phone number', () => {
    const result = createReceptionBodySchema.safeParse({
      ...validReceptionBody,
      newPatient: {
        ...validReceptionBody.newPatient,
        phoneNumber: '0123',
      },
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.issues).toContainEqual({
      code: 'custom',
      message: 'Số điện thoại phải gồm 10 chữ số đầu di động Việt Nam hợp lệ',
      path: ['newPatient', 'phoneNumber'],
    });
  });

  it('accepts a valid phone number and a reason with exactly three characters', () => {
    const withPhone = createReceptionBodySchema.safeParse(validReceptionBody);
    const withoutPhone = createReceptionBodySchema.safeParse({
      ...validReceptionBody,
      newPatient: {
        ...validReceptionBody.newPatient,
        phoneNumber: null,
        phoneNumberUnavailableReason: 'N/A',
      },
    });

    expect(withPhone.success).toBe(true);
    expect(withoutPhone.success).toBe(true);
  });

  it('rejects multiple independent missing identifiers instead of accepting partial data', () => {
    const result = createReceptionBodySchema.safeParse({
      ...validReceptionBody,
      newPatient: {
        ...validReceptionBody.newPatient,
        phoneNumber: null,
        phoneNumberUnavailableReason: null,
        identityCardNumber: 'not-cccd',
      },
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual([
      'newPatient.phoneNumber',
      'newPatient.identityCardNumber',
    ]);
  });

  it('rejects a future date of birth in the reception flow', () => {
    const result = createReceptionBodySchema.safeParse({
      ...validReceptionBody,
      newPatient: {
        ...validReceptionBody.newPatient,
        dateOfBirth: '2999-01-01',
      },
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.issues).toContainEqual({
      code: 'custom',
      message: 'Ngày sinh không được ở tương lai',
      path: ['newPatient', 'dateOfBirth'],
    });
  });

  it('rejects a date that is not a real calendar date', () => {
    const result = createReceptionBodySchema.safeParse({
      ...validReceptionBody,
      newPatient: {
        ...validReceptionBody.newPatient,
        dateOfBirth: '2026-02-31',
      },
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.issues).toContainEqual({
      code: 'custom',
      message: 'Ngày sinh không hợp lệ',
      path: ['newPatient', 'dateOfBirth'],
    });
  });

  it('accepts today but rejects tomorrow using the Vietnam legal date', () => {
    const today = getVietnamLegalDateString();
    const todayResult = createReceptionBodySchema.safeParse({
      ...validReceptionBody,
      newPatient: { ...validReceptionBody.newPatient, dateOfBirth: today },
    });
    const tomorrowResult = createReceptionBodySchema.safeParse({
      ...validReceptionBody,
      newPatient: { ...validReceptionBody.newPatient, dateOfBirth: getTomorrow(today) },
    });

    expect(todayResult.success).toBe(true);
    expectIssue(tomorrowResult, ['newPatient', 'dateOfBirth'], 'Ngày sinh không được ở tương lai');
  });

  it('rejects a new patient without explicit privacy consent', () => {
    const result = createReceptionBodySchema.safeParse({
      ...validReceptionBody,
      newPatient: {
        ...validReceptionBody.newPatient,
        privacyNoticeAccepted: false,
      },
    });

    expect(result.success).toBe(false);
  });

  it('applies the same date rules to emergency identity normalization', () => {
    const result = normalizeEmergencyIdentityBodySchema.safeParse({
      expectedVersion: 1,
      fullName: 'Nguyen Van A',
      dateOfBirth: '2999-01-01',
      gender: 'male',
      phoneNumber: '0912345678',
      privacyNoticeAccepted: true,
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.issues[0]?.message).toBe('Ngày sinh không được ở tương lai');
  });

  it('returns the specific issue message from the active error handler', () => {
    const result = createReceptionBodySchema.safeParse({
      ...validReceptionBody,
      newPatient: {
        ...validReceptionBody.newPatient,
        phoneNumber: '0123',
      },
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    const json = vi.fn();
    const response = {
      status: vi.fn().mockReturnValue({ json }),
    } as unknown as Response;
    const request = { requestId: 'request-validation-test' } as Request;

    errorHandler(result.error, request, response, vi.fn());

    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        details: [
          {
            field: 'newPatient.phoneNumber',
            rule: 'Số điện thoại phải gồm 10 chữ số đầu di động Việt Nam hợp lệ',
            message: 'Số điện thoại phải gồm 10 chữ số đầu di động Việt Nam hợp lệ',
          },
        ],
        message: 'Số điện thoại phải gồm 10 chữ số đầu di động Việt Nam hợp lệ',
        requestId: 'request-validation-test',
      },
    });
  });

  it('keeps a general top-level message while retaining each detail message', () => {
    const error = new ZodError([
      {
        code: 'custom',
        path: ['newPatient', 'phoneNumber'],
        message: 'Số điện thoại phải gồm 10 chữ số đầu di động Việt Nam hợp lệ',
      },
      {
        code: 'custom',
        path: ['newPatient', 'identityCardNumber'],
        message: 'Căn cước công dân phải đủ 12 chữ số',
      },
    ]);
    const json = vi.fn();
    const response = {
      status: vi.fn().mockReturnValue({ json }),
    } as unknown as Response;

    errorHandler(
      error,
      { requestId: 'request-multi-validation-test' } as Request,
      response,
      vi.fn(),
    );

    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dữ liệu đầu vào không hợp lệ',
        details: [
          {
            field: 'newPatient.phoneNumber',
            rule: 'Số điện thoại phải gồm 10 chữ số đầu di động Việt Nam hợp lệ',
            message: 'Số điện thoại phải gồm 10 chữ số đầu di động Việt Nam hợp lệ',
          },
          {
            field: 'newPatient.identityCardNumber',
            rule: 'Căn cước công dân phải đủ 12 chữ số',
            message: 'Căn cước công dân phải đủ 12 chữ số',
          },
        ],
        requestId: 'request-multi-validation-test',
      },
    });
  });

  it.each([['invalid emergency gender', { gender: 'unknown' }, /Invalid enum value/]] as const)(
    'rejects %s at the emergency boundary',
    (_name, overrides, message) => {
      const identityBase = {
        expectedVersion: 1,
        fullName: 'Nguyen Van A',
        dateOfBirth: '1990-01-15',
        gender: 'male',
        phoneNumber: '0912345678',
        privacyNoticeAccepted: true,
      };
      const result = normalizeEmergencyIdentityBodySchema.safeParse({
        ...identityBase,
        ...overrides,
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.issues.some((issue) => message.test(issue.message))).toBe(true);
    },
  );

  it.each([
    ['emergency reason with nine characters', '123456789', 'Lý do cấp cứu tối thiểu 10 ký tự'],
    ['emergency reason over maximum', 'a'.repeat(501), 'Lý do cấp cứu tối đa 500 ký tự'],
  ] as const)('rejects %s with the exact reason message', (_name, emergencyReason, message) => {
    const result = createEmergencyBodySchema.safeParse({
      gender: 'male',
      emergencyReason,
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.issues[0]?.message).toBe(message);
  });

  it('accepts emergency reason at exactly 10 and 500 characters', () => {
    expect(
      createEmergencyBodySchema.safeParse({
        gender: 'male',
        emergencyReason: '1234567890',
      }).success,
    ).toBe(true);
    expect(
      createEmergencyBodySchema.safeParse({
        gender: 'female',
        emergencyReason: 'a'.repeat(500),
      }).success,
    ).toBe(true);
  });

  it('accepts emergency identity boundaries and optional phone reason', () => {
    const result = normalizeEmergencyIdentityBodySchema.safeParse({
      expectedVersion: 1,
      fullName: 'Nguyen Van A',
      dateOfBirth: '1900-01-01',
      gender: 'female',
      phoneNumber: null,
      phoneNumberUnavailableReason: 'N/A',
      privacyNoticeAccepted: true,
    });

    expect(result.success).toBe(true);
  });

  it('does not allow the removed direct-ticket control to alter the public payload', () => {
    const result = createReceptionBodySchema.safeParse({
      ...validReceptionBody,
      createDirectTicket: true,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data).not.toHaveProperty('createDirectTicket');
  });

  it.each([
    ['missing queue ticket', { queueTicketId: undefined }, 'Thiếu số thứ tự hàng đợi'],
    [
      'both patient branches',
      { existingPatientId: validReceptionBody.doctorId },
      'Đúng một trong existingPatientId | newPatient',
    ],
  ] as const)('rejects %s at the reception root', (_name, overrides, message) => {
    const result = createReceptionBodySchema.safeParse({ ...validReceptionBody, ...overrides });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.issues.some((issue) => issue.message === message)).toBe(true);
  });
});

describe('patient search query validation', () => {
  it.each([
    [{ fullName: 'Nguyen Van A' }, true],
    [{ phoneNumber: '0912345678' }, true],
    [{ identityCardNumber: '123456789012' }, true],
    [{}, false],
    [{ fullName: 'Nguyen Van A', phoneNumber: '0912345678' }, false],
    [{ fullName: 'a'.repeat(256) }, false],
    [{ phoneNumber: '0'.repeat(16) }, false],
    [{ identityCardNumber: '12345678901' }, false],
    [{ identityCardNumber: '12345678901a' }, false],
  ] as const)('validates exactly one bounded search field: %j', (query, expectedSuccess) => {
    expect(searchPatientsQuerySchema.safeParse(query).success).toBe(expectedSuccess);
  });

  it('applies safe pagination defaults and rejects out-of-range pagination', () => {
    const parsed = searchPatientsQuerySchema.parse({ fullName: 'A' });
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(20);
    expect(searchPatientsQuerySchema.safeParse({ fullName: 'A', page: 0 }).success).toBe(false);
    expect(searchPatientsQuerySchema.safeParse({ fullName: 'A', pageSize: 101 }).success).toBe(
      false,
    );
  });
});
