import { randomUUID } from 'node:crypto';

import type { Prisma } from '@prisma/client';

import { prisma } from '../../../core/db/prisma-client';

export function findRecordForPrescription(recordId: string) {
  return prisma.medical_records.findUnique({
    where: { id: recordId },
    include: { patients: true },
  });
}

export function findActiveMedicinesByIds(medicineIds: string[]) {
  return prisma.medicines.findMany({ where: { id: { in: medicineIds }, isActive: true } });
}

export function findLatestPrescriptionForRecord(recordId: string) {
  return prisma.prescriptions.findFirst({
    where: { recordId, status: { not: 'cancelled' } },
    include: { prescription_items: true },
    orderBy: { roundNumber: 'desc' },
  });
}

export function findNextRoundNumber(recordId: string) {
  return prisma.prescriptions
    .findFirst({ where: { recordId }, orderBy: { roundNumber: 'desc' } })
    .then((last) => (last?.roundNumber ?? 0) + 1);
}

interface ItemToCreate {
  medicineId: string;
  medicineNameSnapshot: string;
  activeIngredientSnapshot: string | null;
  dosageSnapshot: string | null;
  quantity: number;
  days: number;
  dosePerUse?: string;
  usesPerDay?: number;
  useTiming?: string;
  dosageInstruction: string;
  longTermReason?: string;
  unitPrice: string;
  total: string;
}

export async function createDraftPrescription(
  recordId: string,
  prescribedBy: string,
  roundNumber: number,
  prescriptionType: 'C' | 'N' | 'H',
  items: ItemToCreate[],
  allergyOverrideReason: string | undefined,
) {
  return prisma.$transaction(async (tx) => {
    const existingCount = await tx.prescriptions.count();
    const prescriptionCode = `RX-${new Date().getFullYear()}-${String(existingCount + 1).padStart(4, '0')}`;

    const prescription = await tx.prescriptions.create({
      data: {
        id: randomUUID(),
        recordId,
        prescriptionCode,
        prescribedBy,
        roundNumber,
        prescriptionType,
        status: 'draft',
        allergyOverrideReason,
        allergyOverrideBy: allergyOverrideReason ? prescribedBy : undefined,
        allergyOverrideAt: allergyOverrideReason ? new Date() : undefined,
      },
    });

    const createdItems = [];
    for (const item of items) {
      const created = await tx.prescription_items.create({
        data: { id: randomUUID(), prescriptionId: prescription.id, ...item },
      });
      createdItems.push(created);
    }

    return { prescription, items: createdItems };
  });
}

export function findPrescriptionById(prescriptionId: string) {
  return prisma.prescriptions.findUnique({
    where: { id: prescriptionId },
    include: {
      prescription_items: true,
      medical_records: { include: { patients: true, users_medical_records_doctorIdTousers: true } },
    },
  });
}

export type PrescriptionWithDetails = NonNullable<Awaited<ReturnType<typeof findPrescriptionById>>>;

export async function signPrescriptionTx(
  prescriptionId: string,
  expectedVersion: number,
  signedBy: string,
  allergyOverrideReason: string | undefined,
) {
  const result = await prisma.prescriptions.updateMany({
    where: { id: prescriptionId, version: expectedVersion, status: 'draft' },
    data: {
      status: 'active',
      isSigned: true,
      signedBy,
      signedAt: new Date(),
      signatureMethod: 'dev_e_confirmation',
      ...(allergyOverrideReason
        ? { allergyOverrideReason, allergyOverrideBy: signedBy, allergyOverrideAt: new Date() }
        : {}),
      version: { increment: 1 },
    },
  });
  if (result.count !== 1) return null;
  return prisma.prescriptions.findUniqueOrThrow({ where: { id: prescriptionId } });
}

export async function cancelPrescriptionTx(
  prescriptionId: string,
  expectedVersion: number,
  cancelledBy: string,
  cancelReason: string,
) {
  const result = await prisma.prescriptions.updateMany({
    where: { id: prescriptionId, version: expectedVersion, status: { not: 'cancelled' } },
    data: { status: 'cancelled', cancelledBy, cancelledAt: new Date(), cancelReason, version: { increment: 1 } },
  });
  if (result.count !== 1) return null;
  return prisma.prescriptions.findUniqueOrThrow({ where: { id: prescriptionId } });
}

export async function markXmlExportedTx(prescriptionId: string, expectedVersion: number, xmlFilePath: string) {
  const result = await prisma.prescriptions.updateMany({
    where: { id: prescriptionId, version: expectedVersion, status: 'active' },
    data: { status: 'xml_exported', xmlExportedAt: new Date(), xmlFilePath, version: { increment: 1 } },
  });
  if (result.count !== 1) return null;
  return prisma.prescriptions.findUniqueOrThrow({ where: { id: prescriptionId } });
}

const dispensableInclude = {
  prescription_items: true,
  medical_records: {
    include: {
      patients: true,
      departments: true,
      users_medical_records_doctorIdTousers: true,
    },
  },
} as const;

export function findDispensablePrescriptions(filters: {
  keyword?: string;
  dispensed: boolean;
  page: number;
  pageSize: number;
}) {
  const where: Prisma.prescriptionsWhereInput = {
    status: { in: ['active', 'xml_exported'] },
    dispensedAt: filters.dispensed ? { not: null } : null,
    ...(filters.keyword
      ? {
          OR: [
            { prescriptionCode: { contains: filters.keyword } },
            { medical_records: { patients: { fullName: { contains: filters.keyword } } } },
            { medical_records: { patients: { patientCode: { contains: filters.keyword } } } },
          ],
        }
      : {}),
  };

  return Promise.all([
    prisma.prescriptions.findMany({
      where,
      include: dispensableInclude,
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.prescriptions.count({ where }),
  ]);
}

export type DispensablePrescription = Awaited<ReturnType<typeof findDispensablePrescriptions>>[0][number];

export async function dispensePrescriptionTx(prescriptionId: string, expectedVersion: number, dispensedBy: string) {
  const result = await prisma.prescriptions.updateMany({
    where: {
      id: prescriptionId,
      version: expectedVersion,
      status: { in: ['active', 'xml_exported'] },
      dispensedAt: null,
    },
    data: { dispensedBy, dispensedAt: new Date(), version: { increment: 1 } },
  });
  if (result.count !== 1) return null;
  return prisma.prescriptions.findUniqueOrThrow({ where: { id: prescriptionId } });
}
