import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createStaffFormSchema,
  editStaffFormSchema,
  getCreateStaffValidationFieldErrors,
  getEditStaffValidationFieldErrors,
  normalizeCreateStaffFieldErrors,
  normalizeEditStaffFieldErrors,
  toCreateStaffInput,
  toUpdateStaffInput,
} from '../src/modules/it/types/staff-form.schema';
import {
  canAssignRoleCode,
  getManageableRoleOptions,
} from '../src/modules/it/types/staff-role-options';
import { staffUserSchema } from '../src/modules/it/types/staff.schema';

const validFormValues = {
  dateOfBirth: '1992-02-02',
  departmentId: 'it',
  fullName: '  Nguyễn Văn A  ',
  gender: 'male',
  identityCardNumber: '001 199 200 003',
  phoneNumber: '090 123 4569',
  roleCode: 'doctor',
  username: '  doctor.managed  ',
};

const toDateInput = (date: Date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

  return localDate.toISOString().slice(0, 10);
};

describe('getManageableRoleOptions', () => {
  it('shows the full role catalog to IT technicians while keeping privileged roles disabled', () => {
    const roleOptions = getManageableRoleOptions({ roleCodes: ['it_tech'] });

    assert.deepEqual(
      roleOptions.map((option) => option.value),
      [
        'admin',
        'director',
        'doctor',
        'nurse',
        'pharmacist',
        'accountant',
        'receptionist',
        'lab_tech',
        'it_tech',
      ],
    );
    assert.equal(
      roleOptions.find((option) => option.value === 'director')?.isDisabled,
      true,
    );
    assert.equal(canAssignRoleCode(roleOptions, 'director'), false);
    assert.equal(canAssignRoleCode(roleOptions, 'doctor'), true);
  });

  it('allows admins to assign director accounts from the IT staff form', () => {
    const roleOptions = getManageableRoleOptions({ roleCodes: ['admin'] });

    assert.equal(roleOptions.every((option) => !option.isDisabled), true);
    assert.equal(canAssignRoleCode(roleOptions, 'director'), true);
  });
});

describe('createStaffFormSchema', () => {
  it('normalizes valid form values before mapping to the backend payload', () => {
    const parsedForm = createStaffFormSchema.parse(validFormValues);
    const payload = toCreateStaffInput(parsedForm);

    assert.deepEqual(payload, {
      dateOfBirth: '1992-02-02',
      departmentId: 'it',
      fullName: 'Nguyễn Văn A',
      gender: 'male',
      identityCardNumber: '001199200003',
      phoneNumber: '0901234569',
      roleCodes: ['doctor'],
      username: 'doctor.managed',
    });
    assert.equal(Object.hasOwn(payload, 'supportRequestReference'), false);
  });

  it('rejects every required empty field and returns UI-readable field errors', () => {
    const result = createStaffFormSchema.safeParse({
      dateOfBirth: '',
      departmentId: '',
      fullName: '',
      gender: '',
      identityCardNumber: '',
      phoneNumber: '',
      roleCode: '',
      username: '',
    });

    assert.equal(result.success, false);
    if (!result.success) {
      assert.deepEqual(Object.keys(getCreateStaffValidationFieldErrors(result.error)).sort(), [
        'dateOfBirth',
        'departmentId',
        'fullName',
        'gender',
        'identityCardNumber',
        'phoneNumber',
        'roleCode',
        'username',
      ]);
    }
  });

  it('rejects invalid phone, identity card, username, department, role, gender, and future date', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = createStaffFormSchema.safeParse({
      ...validFormValues,
      dateOfBirth: toDateInput(tomorrow),
      departmentId: 'unknown',
      gender: 'other',
      identityCardNumber: '123',
      phoneNumber: '0123456789',
      roleCode: 'director_plus',
      username: 'doctor managed',
    });

    assert.equal(result.success, false);
    if (!result.success) {
      assert.deepEqual(Object.keys(getCreateStaffValidationFieldErrors(result.error)).sort(), [
        'dateOfBirth',
        'departmentId',
        'gender',
        'identityCardNumber',
        'phoneNumber',
        'roleCode',
        'username',
      ]);
    }
  });

  it('rejects impossible date values instead of relying on browser date input only', () => {
    const result = createStaffFormSchema.safeParse({
      ...validFormValues,
      dateOfBirth: '2026-02-31',
    });

    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(getCreateStaffValidationFieldErrors(result.error).dateOfBirth?.[0], 'Ngày sinh không hợp lệ');
    }
  });
});

describe('normalizeCreateStaffFieldErrors', () => {
  it('maps backend roleCodes paths to roleCode and drops fields not rendered by the form', () => {
    assert.deepEqual(
      normalizeCreateStaffFieldErrors({
        password: ['Không được gửi password'],
        roleCodes: ['Vai trò không hợp lệ'],
        'roleCodes.0': ['Vai trò đầu tiên không hợp lệ'],
        username: ['Tên đăng nhập đã tồn tại'],
      }),
      {
        roleCode: ['Vai trò không hợp lệ', 'Vai trò đầu tiên không hợp lệ'],
        username: ['Tên đăng nhập đã tồn tại'],
      },
    );
  });
});

describe('editStaffFormSchema', () => {
  it('normalizes editable account fields before mapping to the staff update payload', () => {
    const parsedForm = editStaffFormSchema.parse({
      dateOfBirth: '1992-02-02',
      departmentId: 'laboratory',
      fullName: '  Trần Thị B  ',
      gender: 'female',
      identityCardNumber: '001 199 200 003',
      isActive: true,
      phoneNumber: '090 765 4321',
      roleCode: 'lab_tech',
      username: '  lab.tech.updated  ',
    });
    const payload = toUpdateStaffInput(parsedForm);

    assert.deepEqual(payload, {
      dateOfBirth: '1992-02-02',
      departmentId: 'laboratory',
      fullName: 'Trần Thị B',
      gender: 'female',
      identityCardNumber: '001199200003',
      isActive: true,
      phoneNumber: '0907654321',
      roleCodes: ['lab_tech'],
      username: 'lab.tech.updated',
    });
  });

  it('returns UI-readable field errors for invalid editable account fields', () => {
    const result = editStaffFormSchema.safeParse({
      dateOfBirth: '',
      departmentId: '',
      fullName: '',
      gender: '',
      identityCardNumber: '',
      isActive: true,
      phoneNumber: '0123456789',
      roleCode: '',
      username: '',
    });

    assert.equal(result.success, false);
    if (!result.success) {
      assert.deepEqual(Object.keys(getEditStaffValidationFieldErrors(result.error)).sort(), [
        'dateOfBirth',
        'departmentId',
        'fullName',
        'gender',
        'identityCardNumber',
        'phoneNumber',
        'roleCode',
        'username',
      ]);
    }
  });
});

describe('normalizeEditStaffFieldErrors', () => {
  it('maps backend roleCodes paths to roleCode and keeps editable identity fields', () => {
    assert.deepEqual(
      normalizeEditStaffFieldErrors({
        dateOfBirth: ['Ngày sinh không hợp lệ'],
        identityCardNumber: ['CCCD đã tồn tại'],
        roleCodes: ['Vai trò không hợp lệ'],
        'roleCodes.0': ['Vai trò đầu tiên không hợp lệ'],
        username: ['Username đã tồn tại'],
      }),
      {
        dateOfBirth: ['Ngày sinh không hợp lệ'],
        identityCardNumber: ['CCCD đã tồn tại'],
        roleCode: ['Vai trò không hợp lệ', 'Vai trò đầu tiên không hợp lệ'],
        username: ['Username đã tồn tại'],
      },
    );
  });
});

describe('staffUserSchema', () => {
  it('parses backend staff users with role codes while allowing department ids from the DB catalog', () => {
    assert.equal(
      staffUserSchema.parse({
        authVersion: 1,
        createdAt: '2026-07-24T08:00:00.000Z',
        dateOfBirth: '1992-02-02T00:00:00.000Z',
        departmentId: '11111111-1111-4111-8111-111111111111',
        fullName: 'Managed Staff',
        gender: 'female',
        id: '33333333-3333-4333-8333-333333333333',
        identityCardNumber: '001199200003',
        isActive: true,
        lastLoginAt: null,
        mustChangePassword: true,
        phoneNumber: '0901234569',
        roleCodes: ['doctor'],
        updatedAt: '2026-07-24T08:00:00.000Z',
        username: 'doctor.managed',
      }).departmentId,
      '11111111-1111-4111-8111-111111111111',
    );
  });

  it('rejects unknown role codes from backend responses', () => {
    assert.equal(
      staffUserSchema.safeParse({
        authVersion: 1,
        createdAt: '2026-07-24T08:00:00.000Z',
        dateOfBirth: '1992-02-02T00:00:00.000Z',
        departmentId: 'it',
        fullName: 'Managed Staff',
        gender: 'female',
        id: '33333333-3333-4333-8333-333333333333',
        identityCardNumber: '001199200003',
        isActive: true,
        lastLoginAt: null,
        mustChangePassword: true,
        phoneNumber: '0901234569',
        roleCodes: ['super_user'],
        updatedAt: '2026-07-24T08:00:00.000Z',
        username: 'doctor.managed',
      }).success,
      false,
    );
  });

  it('rejects staff users without a role instead of falling back to a default role', () => {
    assert.equal(
      staffUserSchema.safeParse({
        authVersion: 1,
        createdAt: '2026-07-24T08:00:00.000Z',
        dateOfBirth: '1992-02-02T00:00:00.000Z',
        departmentId: 'it',
        fullName: 'Managed Staff',
        gender: 'female',
        id: '33333333-3333-4333-8333-333333333333',
        identityCardNumber: '001199200003',
        isActive: true,
        lastLoginAt: null,
        mustChangePassword: true,
        phoneNumber: '0901234569',
        roleCodes: [],
        updatedAt: '2026-07-24T08:00:00.000Z',
        username: 'doctor.managed',
      }).success,
      false,
    );
  });
});
