/**
 * Seed dev billing: patient + diagnosed record + service order để lập HĐ.
 * Chạy: npx tsx prisma/seeders/seed-billing-dev.ts
 * (Nên chạy seed-reception-dev trước)
 */
import { randomUUID } from 'node:crypto';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const deptId = '22222222-2222-4222-8222-222222222222';
  const serviceId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const doctorId = '11111111-1111-4111-8111-111111111111';
  const patientId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const recordId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const orderId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

  const patient = await prisma.patient.upsert({
    where: { patientCode: 'BN-BILL-001' },
    create: {
      id: patientId,
      patientCode: 'BN-BILL-001',
      fullName: 'Nguyễn Văn Minh',
      dateOfBirth: new Date('1985-05-10T00:00:00.000Z'),
      gender: 'male',
      phoneNumber: '0912345678',
      identityCardNumber: '099988877766',
      address: 'TP. HCM',
      healthInsuranceCode: 'DN4123456789012',
      healthInsuranceExpiryDate: new Date('2027-12-31T00:00:00.000Z'),
      privacyNoticeAcceptedAt: new Date(),
      version: 1,
    },
    update: {
      fullName: 'Nguyễn Văn Minh',
      healthInsuranceCode: 'DN4123456789012',
      healthInsuranceExpiryDate: new Date('2027-12-31T00:00:00.000Z'),
    },
  });

  const resolvedPatientId = patient.id;

  const record = await prisma.medicalRecord.upsert({
    where: { recordCode: 'HS-BILL-001' },
    create: {
      id: recordId,
      recordCode: 'HS-BILL-001',
      patientId: resolvedPatientId,
      doctorId,
      departmentId: deptId,
      status: 'diagnosed',
      isEmergency: false,
      chiefComplaint: 'Khám da liễu định kỳ',
      version: 1,
    },
    update: {
      status: 'diagnosed',
      doctorId,
      departmentId: deptId,
      patientId: resolvedPatientId,
    },
  });

  const resolvedRecordId = record.id;

  const existingOrder = await prisma.serviceOrder.findFirst({
    where: { recordId: resolvedRecordId },
  });
  if (existingOrder) {
    await prisma.serviceOrder.update({
      where: { id: existingOrder.id },
      data: { fee: 100000, status: 'waiting', serviceCatalogId: serviceId },
    });
  } else {
    await prisma.serviceOrder.create({
      data: {
        id: orderId,
        recordId: resolvedRecordId,
        serviceCatalogId: serviceId,
        fee: 100000,
        status: 'waiting',
      },
    });
  }

  console.log('Seed billing dev OK');
  console.log(
    JSON.stringify(
      {
        patientId: resolvedPatientId,
        recordId: resolvedRecordId,
        patientCode: 'BN-BILL-001',
        recordCode: 'HS-BILL-001',
        hint: 'POST /api/v1/invoices { recordId, healthInsuranceBenefitLevel: RATE_80, healthInsuranceRouteType: right_route }',
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
