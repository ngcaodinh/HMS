/**
 * Seed demo thanh toán — data mock giống thật (HĐ pending/paid/cancelled + intent/IPN).
 * Chạy sau seed-reception-dev:
 *   npx tsx prisma/seeders/seed-reception-dev.ts
 *   npx tsx prisma/seeders/seed-billing-payment-demo.ts
 */
import { randomUUID } from 'node:crypto';

import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEPT = '22222222-2222-4222-8222-222222222222';
const SERVICE = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const DOCTOR = '11111111-1111-4111-8111-111111111111';

const D = (v: string) => new Prisma.Decimal(v);

type PatientSeed = {
  id: string;
  code: string;
  fullName: string;
  phone: string;
  cccd: string;
  bhyt?: string | null;
  bhytExpiry?: string | null;
};

const PATIENTS: PatientSeed[] = [
  {
    id: 'a1000001-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    code: 'BN-PAY-001',
    fullName: 'Nguyễn Văn Minh',
    phone: '0912345678',
    cccd: '079085001001',
    bhyt: 'DN4123456789012',
    bhytExpiry: '2027-12-31',
  },
  {
    id: 'a1000002-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    code: 'BN-PAY-002',
    fullName: 'Trần Thị Hoa',
    phone: '0987654321',
    cccd: '079085001002',
    bhyt: 'HN4987654321098',
    bhytExpiry: '2027-06-30',
  },
  {
    id: 'a1000003-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    code: 'BN-PAY-003',
    fullName: 'Lê Hoàng Nam',
    phone: '0903111222',
    cccd: '079085001003',
    bhyt: 'DN4111111111111',
    bhytExpiry: '2020-01-01', // hết hạn → NO_COVERAGE khi lập HĐ mới
  },
  {
    id: 'a1000004-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    code: 'BN-PAY-004',
    fullName: 'Phạm Thu Hà',
    phone: '0933444555',
    cccd: '079085001004',
    bhyt: null,
    bhytExpiry: null,
  },
  {
    id: 'a1000005-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    code: 'BN-PAY-005',
    fullName: 'Vô danh Nam - Cấp cứu demo',
    phone: '0909000001',
    cccd: '079085001005',
    bhyt: null,
    bhytExpiry: null,
  },
];

async function upsertPatient(p: PatientSeed) {
  return prisma.patient.upsert({
    where: { patientCode: p.code },
    create: {
      id: p.id,
      patientCode: p.code,
      fullName: p.fullName,
      dateOfBirth: new Date('1990-01-15T00:00:00.000Z'),
      gender: p.code.endsWith('2') || p.code.endsWith('4') ? 'female' : 'male',
      phoneNumber: p.phone,
      identityCardNumber: p.cccd,
      address: 'Quận 1, TP. Hồ Chí Minh',
      healthInsuranceCode: p.bhyt,
      healthInsuranceExpiryDate: p.bhytExpiry
        ? new Date(`${p.bhytExpiry}T00:00:00.000Z`)
        : null,
      privacyNoticeAcceptedAt: new Date(),
      isEmergencyBypass: p.code === 'BN-PAY-005',
      version: 1,
    },
    update: {
      fullName: p.fullName,
      phoneNumber: p.phone,
      healthInsuranceCode: p.bhyt,
      healthInsuranceExpiryDate: p.bhytExpiry
        ? new Date(`${p.bhytExpiry}T00:00:00.000Z`)
        : null,
    },
  });
}

async function upsertRecord(params: {
  id: string;
  code: string;
  patientId: string;
  status: 'diagnosed' | 'open' | 'closed';
  isEmergency?: boolean;
  complaint: string;
}) {
  return prisma.medicalRecord.upsert({
    where: { recordCode: params.code },
    create: {
      id: params.id,
      recordCode: params.code,
      patientId: params.patientId,
      doctorId: DOCTOR,
      departmentId: DEPT,
      status: params.status,
      isEmergency: params.isEmergency ?? false,
      emergencyReason: params.isEmergency ? 'Cấp cứu demo seed' : null,
      chiefComplaint: params.complaint,
      version: 1,
    },
    update: {
      status: params.status,
      patientId: params.patientId,
      doctorId: DOCTOR,
      departmentId: DEPT,
      chiefComplaint: params.complaint,
      isEmergency: params.isEmergency ?? false,
    },
  });
}

async function ensureServiceOrder(recordId: string, fee: string, nameHint: string) {
  const existing = await prisma.serviceOrder.findFirst({ where: { recordId } });
  if (existing) {
    return prisma.serviceOrder.update({
      where: { id: existing.id },
      data: { fee: D(fee), status: 'waiting', serviceCatalogId: SERVICE },
    });
  }
  return prisma.serviceOrder.create({
    data: {
      id: randomUUID(),
      recordId,
      serviceCatalogId: SERVICE,
      fee: D(fee),
      status: 'waiting',
    },
  });
}

async function wipeDemoInvoices(recordIds: string[]) {
  const invoices = await prisma.invoice.findMany({
    where: { recordId: { in: recordIds } },
    select: { id: true },
  });
  const ids = invoices.map((i) => i.id);
  if (ids.length === 0) {
    return;
  }
  await prisma.paymentIpnLog.deleteMany({});
  await prisma.paymentIntent.deleteMany({ where: { invoiceId: { in: ids } } });
  await prisma.emergencyWriteOffApproval.deleteMany({ where: { invoiceId: { in: ids } } });
  await prisma.healthInsuranceClaim.deleteMany({ where: { invoiceId: { in: ids } } });
  await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: ids } } });
  await prisma.invoice.deleteMany({ where: { id: { in: ids } } });
}

async function createInvoiceFull(params: {
  id: string;
  recordId: string;
  status: 'pending' | 'paid' | 'cancelled';
  benefit: 'RATE_80' | 'NO_COVERAGE';
  method?: 'cash' | 'momo' | null;
  receiptNumber?: string | null;
  momoOrderId?: string | null;
  paidAt?: Date | null;
}) {
  const covered = params.benefit === 'RATE_80';
  const rate = covered ? '0.8000' : '0.0000';
  const unit = D('100000.00');
  const fund = covered ? D('80000.00') : D('0.00');
  const copay = covered ? D('20000.00') : D('100000.00');
  const discount = fund;
  const total = copay;
  const amountDue = params.status === 'paid' ? D('0.00') : total;

  // amountDue when paid should still show original due for history — contract uses amountDue at create.
  // Keep amountDue as total due at creation (20000) even when paid.
  const amountDueStored = total;

  await prisma.invoice.create({
    data: {
      id: params.id,
      recordId: params.recordId,
      status: params.status,
      healthInsuranceBenefitLevel: params.benefit,
      healthInsuranceRouteType: covered ? 'right_route' : null,
      healthInsuranceBenefitRateSnapshot: rate,
      healthInsuranceRuleSource: 'NĐ 188/2025/NĐ-CP; TT 12/2026/TT-BTC (demo seed)',
      subtotal: unit,
      healthInsuranceBaseAmount: covered ? unit : D('0.00'),
      healthInsuranceDiscountAmount: discount,
      totalAmount: total,
      advanceAppliedAmount: D('0.00'),
      amountDue: amountDueStored,
      paymentMethod: params.method ?? null,
      receiptNumber: params.receiptNumber ?? null,
      paidAt: params.paidAt ?? null,
      momoOrderId: params.momoOrderId ?? null,
      statementStatus: params.status === 'paid' ? 'signed' : 'draft',
      statementNumber: params.status === 'paid' ? `BK-DEMO-${params.id.slice(0, 6)}` : null,
      cancelReason: params.status === 'cancelled' ? 'Lập sai dịch vụ (demo seed)' : null,
      cancelledAt: params.status === 'cancelled' ? new Date() : null,
      version: params.status === 'pending' ? 1 : 2,
      items: {
        create: [
          {
            id: randomUUID(),
            description: 'Khám bệnh ngoại trú',
            category: 'consultation',
            quantity: D('1.00'),
            unitPrice: unit,
            amount: unit,
            coveredByHealthInsurance: covered,
            healthInsuranceBenefitLevel: covered ? 'RATE_80' : null,
            healthInsuranceBenefitRateSnapshot: covered ? rate : null,
            healthInsuranceEligibleAmount: covered ? unit : D('0.00'),
            healthInsuranceCeilingAmount: covered ? unit : D('0.00'),
            healthInsuranceFundAmount: fund,
            patientCoPayAmount: copay,
            sortOrder: 0,
          },
        ],
      },
    },
  });

  if (covered && params.status !== 'cancelled') {
    await prisma.healthInsuranceClaim.create({
      data: {
        id: randomUUID(),
        invoiceId: params.id,
        status: 'draft',
      },
    });
  }
  if (params.status === 'cancelled' && covered) {
    await prisma.healthInsuranceClaim.create({
      data: {
        id: randomUUID(),
        invoiceId: params.id,
        status: 'voided',
        voidReason: 'invoice_cancelled',
        voidedAt: new Date(),
      },
    });
  }

  if (params.momoOrderId && params.method === 'momo') {
    await prisma.paymentIntent.create({
      data: {
        id: randomUUID(),
        invoiceId: params.id,
        momoOrderId: params.momoOrderId,
        requestId: `MOMO-${params.momoOrderId}-seed`,
        amount: amountDueStored,
        status: params.status === 'paid' ? 'paid' : 'pending',
        payUrl: `https://test-payment.momo.vn/v2/gateway/pay?t=seed-${params.momoOrderId}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        idempotencyKey: randomUUID(),
        transId: params.status === 'paid' ? `SEED-TX-${params.id.slice(0, 8)}` : null,
      },
    });
  }

  if (params.status === 'paid' && params.method === 'momo') {
    await prisma.paymentIpnLog.create({
      data: {
        id: randomUUID(),
        orderId: params.momoOrderId,
        transId: `SEED-TX-${params.id.slice(0, 8)}`,
        resultCode: 0,
        signatureValid: true,
        processing: 'settled',
        rawPayload: {
          orderId: params.momoOrderId,
          resultCode: 0,
          amount: 20000,
          message: 'seed success',
        },
      },
    });
  }
}

async function main() {
  // Master data
  for (const p of PATIENTS) {
    await upsertPatient(p);
  }

  const r1 = await upsertRecord({
    id: 'c1000001-cccc-4ccc-8ccc-cccccccccccc',
    code: 'HS-PAY-001',
    patientId: (await prisma.patient.findUniqueOrThrow({ where: { patientCode: 'BN-PAY-001' } }))
      .id,
    status: 'diagnosed',
    complaint: 'Viêm da cơ địa — tái khám',
  });
  const r2 = await upsertRecord({
    id: 'c1000002-cccc-4ccc-8ccc-cccccccccccc',
    code: 'HS-PAY-002',
    patientId: (await prisma.patient.findUniqueOrThrow({ where: { patientCode: 'BN-PAY-002' } }))
      .id,
    status: 'diagnosed',
    complaint: 'Nám da — tư vấn điều trị',
  });
  const r3 = await upsertRecord({
    id: 'c1000003-cccc-4ccc-8ccc-cccccccccccc',
    code: 'HS-PAY-003',
    patientId: (await prisma.patient.findUniqueOrThrow({ where: { patientCode: 'BN-PAY-003' } }))
      .id,
    status: 'diagnosed',
    complaint: 'Mụn trứng cá — thẻ BHYT hết hạn',
  });
  const r4 = await upsertRecord({
    id: 'c1000004-cccc-4ccc-8ccc-cccccccccccc',
    code: 'HS-PAY-004',
    patientId: (await prisma.patient.findUniqueOrThrow({ where: { patientCode: 'BN-PAY-004' } }))
      .id,
    status: 'diagnosed',
    complaint: 'Khám da liễu — không BHYT',
  });
  const r5 = await upsertRecord({
    id: 'c1000005-cccc-4ccc-8ccc-cccccccccccc',
    code: 'HS-PAY-005',
    patientId: (await prisma.patient.findUniqueOrThrow({ where: { patientCode: 'BN-PAY-005' } }))
      .id,
    status: 'open',
    isEmergency: true,
    complaint: 'Cấp cứu da liễu demo',
  });

  await ensureServiceOrder(r1.id, '100000.00', 'kham');
  await ensureServiceOrder(r2.id, '100000.00', 'kham');
  await ensureServiceOrder(r3.id, '100000.00', 'kham');
  await ensureServiceOrder(r4.id, '150000.00', 'kham');
  await ensureServiceOrder(r5.id, '100000.00', 'kham');

  const recordIds = [r1.id, r2.id, r3.id, r4.id, r5.id];
  await wipeDemoInvoices(recordIds);

  // Pending — test cash / Momo (UUID v4 hợp lệ cho Zod)
  const invPending1 = '11000001-1001-4001-8001-110000000001';
  const invPending2 = '11000002-1002-4002-8002-110000000002';
  const invPending3 = '11000003-1003-4003-8003-110000000003';
  // Paid cash / momo / cancelled
  const invPaidCash = '11000004-1004-4004-8004-110000000004';
  const invPaidMomo = '11000005-1005-4005-8005-110000000005';
  const invCancelled = '11000006-1006-4006-8006-110000000006';

  await createInvoiceFull({
    id: invPending1,
    recordId: r1.id,
    status: 'pending',
    benefit: 'RATE_80',
  });
  await createInvoiceFull({
    id: invPending2,
    recordId: r2.id,
    status: 'pending',
    benefit: 'RATE_80',
  });
  await createInvoiceFull({
    id: invPending3,
    recordId: r4.id,
    status: 'pending',
    benefit: 'NO_COVERAGE',
  });
  // Fix amount for no coverage item — recreate with 100000 due
  await prisma.invoice.update({
    where: { id: invPending3 },
    data: {
      subtotal: D('150000.00'),
      totalAmount: D('150000.00'),
      amountDue: D('150000.00'),
      healthInsuranceBaseAmount: D('0.00'),
      healthInsuranceDiscountAmount: D('0.00'),
    },
  });
  await prisma.invoiceItem.updateMany({
    where: { invoiceId: invPending3 },
    data: {
      unitPrice: D('150000.00'),
      amount: D('150000.00'),
      patientCoPayAmount: D('150000.00'),
      healthInsuranceFundAmount: D('0.00'),
    },
  });

  await createInvoiceFull({
    id: invPaidCash,
    recordId: r3.id,
    status: 'paid',
    benefit: 'NO_COVERAGE',
    method: 'cash',
    receiptNumber: 'PT-DEMO-CASH-001',
    paidAt: new Date(),
  });
  await prisma.invoice.update({
    where: { id: invPaidCash },
    data: {
      subtotal: D('100000.00'),
      totalAmount: D('100000.00'),
      amountDue: D('100000.00'),
    },
  });

  await createInvoiceFull({
    id: invPaidMomo,
    recordId: r5.id,
    status: 'paid',
    benefit: 'NO_COVERAGE',
    method: 'momo',
    receiptNumber: 'MM-DEMO-MOMO-001',
    momoOrderId: 'HMS-DEMO-PAID-MOMO-001',
    paidAt: new Date(),
  });

  await createInvoiceFull({
    id: invCancelled,
    recordId: r3.id,
    status: 'cancelled',
    benefit: 'RATE_80',
  });

  await prisma.codeSequence.upsert({
    where: { key: 'receipt_PT' },
    create: { key: 'receipt_PT', lastNumber: 10 },
    update: {},
  });
  await prisma.codeSequence.upsert({
    where: { key: 'receipt_MM' },
    create: { key: 'receipt_MM', lastNumber: 10 },
    update: {},
  });

  console.log('\n=== Seed billing-payment-demo OK ===\n');
  console.log('PENDING invoices (test Cash / Momo):');
  console.log(
    JSON.stringify(
      [
        { invoiceId: invPending1, record: 'HS-PAY-001', patient: 'BN-PAY-001', amountDue: '20000.00', note: 'BHYT 80%' },
        { invoiceId: invPending2, record: 'HS-PAY-002', patient: 'BN-PAY-002', amountDue: '20000.00', note: 'BHYT 80%' },
        { invoiceId: invPending3, record: 'HS-PAY-004', patient: 'BN-PAY-004', amountDue: '150000.00', note: 'No BHYT' },
      ],
      null,
      2,
    ),
  );
  console.log('\nPaid cash:', invPaidCash);
  console.log('Paid momo:', invPaidMomo);
  console.log('Cancelled:', invCancelled);
  console.log('\nFE: http://localhost:3000/accounting');
  console.log('API: GET /api/v1/invoices?status=pending\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
