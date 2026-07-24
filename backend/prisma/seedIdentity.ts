import { createHash, randomUUID } from 'node:crypto';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { config } from '../src/config/unifiedConfig';
import type { RoleCode } from '../src/modules/identity/identityTypes';

const prisma = new PrismaClient();

const roles: Array<{
  code: RoleCode;
  description: string;
  isPrivileged: boolean;
  name: string;
}> = [
  { code: 'admin', description: 'Quản trị hệ thống cấp cao', isPrivileged: true, name: 'Admin' },
  { code: 'receptionist', description: 'Tiếp nhận và quản lý lượt khám', isPrivileged: false, name: 'Lễ tân' },
  { code: 'accountant', description: 'Viện phí và thanh toán', isPrivileged: false, name: 'Kế toán' },
  { code: 'doctor', description: 'Khám, chẩn đoán và kê đơn', isPrivileged: false, name: 'Bác sĩ' },
  { code: 'nurse', description: 'Điều dưỡng và chăm sóc nội trú', isPrivileged: false, name: 'Điều dưỡng' },
  { code: 'lab_tech', description: 'Kỹ thuật viên xét nghiệm', isPrivileged: false, name: 'KTV xét nghiệm' },
  { code: 'pharmacist', description: 'Dược sĩ và phát thuốc', isPrivileged: false, name: 'Dược sĩ' },
  { code: 'it_tech', description: 'Hỗ trợ kỹ thuật tài khoản nhân viên thường', isPrivileged: true, name: 'KTV IT' },
  { code: 'director', description: 'Giám đốc xem báo cáo tổng hợp', isPrivileged: true, name: 'Giám đốc' },
];

const roleActions: Record<RoleCode, string[]> = {
  accountant: [],
  admin: ['staff.read', 'staff.create', 'staff.update', 'staff.password.reset'],
  director: [],
  doctor: [],
  it_tech: ['staff.read', 'staff.create', 'staff.update', 'staff.password.reset'],
  lab_tech: [],
  nurse: [],
  pharmacist: [],
  receptionist: [],
};

const revision = 'identity-rbac-staff-v1';

const seedRbacPolicy = async () => {
  for (const role of roles) {
    await prisma.role.upsert({
      create: {
        ...role,
        id: randomUUID(),
        isSystem: true,
      },
      update: {
        description: role.description,
        isActive: true,
        isPrivileged: role.isPrivileged,
        isSystem: true,
        name: role.name,
      },
      where: {
        code: role.code,
      },
    });
  }

  const desiredActions = Object.entries(roleActions).flatMap(([roleCode, actions]) =>
    actions.map((actionCode) => ({
      actionCode,
      roleCode,
    })),
  );

  for (const item of desiredActions) {
    await prisma.rolePermission.upsert({
      create: item,
      update: {},
      where: {
        roleCode_actionCode: item,
      },
    });
  }

  const checksum = createHash('sha256')
    .update(JSON.stringify({ revision, roleActions, roles }))
    .digest('hex');

  await prisma.rbacPolicyVersion.upsert({
    create: {
      checksum,
      revision,
    },
    update: {
      checksum,
    },
    where: {
      revision,
    },
  });
};

const seedDevelopmentItUser = async () => {
  if (config.app.env === 'production') return;
  if (!config.auth.itDevPassword) {
    throw new Error('IT_DEV_PASSWORD is required to seed the development IT account');
  }

  const existing = await prisma.user.findUnique({
    where: {
      username: 'it.tech.dev',
    },
  });

  const user =
    existing ??
    (await prisma.user.create({
      data: {
        authVersion: 1,
        dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
        departmentId: 'it',
        fullName: 'IT Technician Dev',
        gender: 'male',
        id: randomUUID(),
        identityCardNumber: '001199000001',
        isActive: true,
        mustChangePassword: true,
        password: await bcrypt.hash(config.auth.itDevPassword, 12),
        phoneNumber: '0901234567',
        username: 'it.tech.dev',
      },
    }));

  await prisma.permission.upsert({
    create: {
      assignedBy: null,
      id: randomUUID(),
      roleCode: 'it_tech',
      userId: user.id,
    },
    update: {},
    where: {
      userId_roleCode: {
        roleCode: 'it_tech',
        userId: user.id,
      },
    },
  });
};

void seedRbacPolicy()
  .then(seedDevelopmentItUser)
  .finally(async () => {
    await prisma.$disconnect();
  });
