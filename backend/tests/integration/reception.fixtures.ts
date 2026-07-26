import { prisma } from '../../src/core/prisma/prisma';

export const RECEPTION_TEST_DOCTOR_ID = '11111111-1111-4111-8111-111111111111';

const RECEPTION_TEST_DEPARTMENT_ID = 'dermatology';
const RECEPTION_TEST_PERMISSION_ID = 'perm-reception-doctor-test';
const RECEPTION_TEST_ROLE_ID = 'role-doctor-test';
const RECEPTION_TEST_SERVICE_ID = 'svc-consult-outpatient-test';

/**
 * Seed dữ liệu tối thiểu cho các integration test tiếp nhận.
 * Dùng upsert SQL để an toàn khi Vitest chạy nhiều file song song.
 */
export async function ensureReceptionIntegrationFixtures(): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO departments (id, code, name, type, isActive, createdAt, updatedAt)
    VALUES (${RECEPTION_TEST_DEPARTMENT_ID}, 'DERM', 'Khoa Da liễu', 'clinical', TRUE, NOW(3), NOW(3))
    ON DUPLICATE KEY UPDATE
      name = 'Khoa Da liễu',
      type = 'clinical',
      isActive = TRUE,
      updatedAt = NOW(3)
  `;

  await prisma.$executeRaw`
    INSERT INTO roles (id, code, name, description, isSystem, isPrivileged, isActive, createdAt, updatedAt)
    VALUES (${RECEPTION_TEST_ROLE_ID}, 'doctor', 'Bác sĩ', 'Bác sĩ khám và điều trị', TRUE, FALSE, TRUE, NOW(3), NOW(3))
    ON DUPLICATE KEY UPDATE
      name = 'Bác sĩ',
      isActive = TRUE,
      updatedAt = NOW(3)
  `;

  await prisma.$executeRaw`
    INSERT INTO users (
      id,
      username,
      password,
      fullName,
      gender,
      dateOfBirth,
      phoneNumber,
      identityCardNumber,
      departmentId,
      isActive,
      mustChangePassword,
      authVersion,
      createdAt,
      updatedAt
    )
    VALUES (
      ${RECEPTION_TEST_DOCTOR_ID},
      'doctor.integration',
      'test-password-hash',
      'Bác sĩ Integration Test',
      'male',
      '1980-01-01',
      '0901234567',
      '999999999991',
      ${RECEPTION_TEST_DEPARTMENT_ID},
      TRUE,
      FALSE,
      1,
      NOW(3),
      NOW(3)
    )
    ON DUPLICATE KEY UPDATE
      fullName = 'Bác sĩ Integration Test',
      departmentId = ${RECEPTION_TEST_DEPARTMENT_ID},
      isActive = TRUE,
      mustChangePassword = FALSE,
      updatedAt = NOW(3)
  `;

  await prisma.$executeRaw`
    INSERT INTO permissions (id, userId, roleCode, assignedAt, assignedBy)
    VALUES (${RECEPTION_TEST_PERMISSION_ID}, ${RECEPTION_TEST_DOCTOR_ID}, 'doctor', NOW(3), NULL)
    ON DUPLICATE KEY UPDATE
      userId = ${RECEPTION_TEST_DOCTOR_ID},
      roleCode = 'doctor'
  `;

  await prisma.$executeRaw`
    INSERT INTO service_catalog (id, code, name, price, isActive, departmentId, createdAt)
    VALUES (
      ${RECEPTION_TEST_SERVICE_ID},
      'CONSULT_OUTPATIENT',
      'Khám ngoại trú',
      100000.00,
      TRUE,
      ${RECEPTION_TEST_DEPARTMENT_ID},
      NOW(3)
    )
    ON DUPLICATE KEY UPDATE
      name = 'Khám ngoại trú',
      price = 100000.00,
      isActive = TRUE,
      departmentId = ${RECEPTION_TEST_DEPARTMENT_ID}
  `;
}
