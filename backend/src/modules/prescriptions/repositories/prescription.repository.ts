import { randomUUID } from 'node:crypto';

import type { Prisma } from '@prisma/client';

import { prisma } from '../../../core/db/prisma-client';

export function findRecordForPrescription(recordId: string) {
  return prisma.medicalRecord.findUnique({
    where: { id: recordId },
    include: { patient: true },
  });
}

export function findActiveMedicinesByIds(medicineIds: string[]) {
  return prisma.medicine.findMany({ where: { id: { in: medicineIds }, isActive: true } });
}

export function findLatestPrescriptionForRecord(recordId: string) {
  return prisma.prescription.findFirst({
    where: { recordId, status: { not: 'cancelled' } },
    include: { prescriptionItems: true },
    orderBy: { roundNumber: 'desc' },
  });
}

export function findNextRoundNumber(recordId: string) {
  return prisma.prescription
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
    const existingCount = await tx.prescription.count();
    const prescriptionCode = `RX-${new Date().getFullYear()}-${String(existingCount + 1).padStart(4, '0')}`;

    const prescription = await tx.prescription.create({
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
      const created = await tx.prescriptionItem.create({
        data: { id: randomUUID(), prescriptionId: prescription.id, ...item },
      });
      createdItems.push(created);
    }

    return { prescription, items: createdItems };
  });
}

export function findPrescriptionById(prescriptionId: string) {
  return prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: {
      prescriptionItems: true,
      medicalRecord: { include: { patient: true, doctor: true } },
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
  const result = await prisma.prescription.updateMany({
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
  return prisma.prescription.findUniqueOrThrow({ where: { id: prescriptionId } });
}

export async function cancelPrescriptionTx(
  prescriptionId: string,
  expectedVersion: number,
  cancelledBy: string,
  cancelReason: string,
) {
  const result = await prisma.prescription.updateMany({
    where: { id: prescriptionId, version: expectedVersion, status: { not: 'cancelled' } },
    data: { status: 'cancelled', cancelledBy, cancelledAt: new Date(), cancelReason, version: { increment: 1 } },
  });
  if (result.count !== 1) return null;
  return prisma.prescription.findUniqueOrThrow({ where: { id: prescriptionId } });
}

export async function markXmlExportedTx(prescriptionId: string, expectedVersion: number, xmlFilePath: string) {
  const result = await prisma.prescription.updateMany({
    where: { id: prescriptionId, version: expectedVersion, status: 'active' },
    data: { status: 'xml_exported', xmlExportedAt: new Date(), xmlFilePath, version: { increment: 1 } },
  });
  if (result.count !== 1) return null;
  return prisma.prescription.findUniqueOrThrow({ where: { id: prescriptionId } });
}

const dispensableInclude = {
  prescriptionItems: true,
  medicalRecord: {
    include: {
      patient: true,
      department: true,
      doctor: true,
    },
  },
} as const;

export function findDispensablePrescriptions(filters: {
  keyword?: string;
  dispensed: boolean;
  page: number;
  pageSize: number;
}) {
  const where: Prisma.PrescriptionWhereInput = {
    status: { in: ['active', 'xml_exported'] },
    dispensedAt: filters.dispensed ? { not: null } : null,
    ...(filters.keyword
      ? {
          OR: [
            { prescriptionCode: { contains: filters.keyword } },
            { medicalRecord: { patient: { fullName: { contains: filters.keyword } } } },
            { medicalRecord: { patient: { patientCode: { contains: filters.keyword } } } },
          ],
        }
      : {}),
  };

  return Promise.all([
    prisma.prescription.findMany({
      where,
      include: dispensableInclude,
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.prescription.count({ where }),
  ]);
}

export type DispensablePrescription = Awaited<ReturnType<typeof findDispensablePrescriptions>>[0][number];

export async function dispensePrescriptionTx(prescriptionId: string, expectedVersion: number, dispensedBy: string) {
  const result = await prisma.prescription.updateMany({
    where: {
      id: prescriptionId,
      version: expectedVersion,
      status: { in: ['active', 'xml_exported'] },
      dispensedAt: null,
    },
    data: { dispensedBy, dispensedAt: new Date(), version: { increment: 1 } },
  });
  if (result.count !== 1) return null;
  return prisma.prescription.findUniqueOrThrow({ where: { id: prescriptionId } });
}
