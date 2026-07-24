/**
 * Seed dev: department, consultation service, 2 doctors.
 * Chạy: npx tsx prisma/seeders/seed-reception-dev.ts
 */
import { randomUUID } from 'node:crypto';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const deptId = '22222222-2222-4222-8222-222222222222';
  const serviceId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const doctor1 = '11111111-1111-4111-8111-111111111111';
  const doctor2 = '11111111-1111-4111-8111-111111111112';

  await prisma.department.upsert({
    where: { code: 'DL-OUT' },
    create: {
      id: deptId,
      code: 'DL-OUT',
      name: 'Khoa Khám Da Liễu Ngoại Trú',
      isActive: true,
    },
    update: { isActive: true, name: 'Khoa Khám Da Liễu Ngoại Trú' },
  });

  await prisma.serviceCatalog.upsert({
    where: { code: 'CONSULT_OUTPATIENT' },
    create: {
      id: serviceId,
      code: 'CONSULT_OUTPATIENT',
      name: 'Khám bệnh ngoại trú',
      price: 100000,
      isActive: true,
      departmentId: deptId,
    },
    update: { isActive: true, price: 100000, departmentId: deptId },
  });

  await prisma.doctor.upsert({
    where: { employeeCode: 'BS000123' },
    create: {
      id: doctor1,
      fullName: 'BS. Trần Minh Anh',
      employeeCode: 'BS000123',
      isActive: true,
    },
    update: { isActive: true, fullName: 'BS. Trần Minh Anh' },
  });

  await prisma.doctor.upsert({
    where: { employeeCode: 'BS000124' },
    create: {
      id: doctor2,
      fullName: 'BS. Lê Hoàng Nam',
      employeeCode: 'BS000124',
      isActive: true,
    },
    update: { isActive: true, fullName: 'BS. Lê Hoàng Nam' },
  });

  console.log('Seed reception dev OK', { deptId, serviceId, doctor1, doctor2 });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
