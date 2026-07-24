import { randomUUID } from 'node:crypto';

import type { Prisma } from '@prisma/client';

import { prisma } from '../../../core/db/prisma-client';
import type {
  ClinicalAssessmentInput,
  DiagnoseRecordInput,
  OrderLabTestsInput,
  WorklistQuery,
} from '../types/medical-record.types';

const detailInclude = {
  patients: true,
  lab_tests: { include: { lab_test_types: true } },
} as const;

export function findWorklist(query: WorklistQuery) {
  const where = {
    doctorId: query.doctorId,
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.date
      ? {
          createdAt: {
            gte: new Date(`${query.date}T00:00:00`),
            lt: new Date(`${query.date}T23:59:59.999`),
          },
        }
      : {}),
  };

  return Promise.all([
    prisma.medical_records.findMany({
      where,
      include: { patients: true },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.medical_records.count({ where }),
  ]);
}

export function findMedicalRecordById(recordId: string) {
  return prisma.medical_records.findUnique({ where: { id: recordId }, include: detailInclude });
}

export type MedicalRecordDetail = NonNullable<Awaited<ReturnType<typeof findMedicalRecordById>>>;

export async function snapshotVitalSigns(
  recordId: string,
  snapshot: Record<string, unknown>,
  confirmedBy: string,
) {
  await prisma.medical_records.update({
    where: { id: recordId },
    data: {
      vitalSigns: snapshot as Prisma.InputJsonValue,
      vitalConfirmedBy: confirmedBy,
      vitalConfirmedAt: new Date(),
    },
  });
}

export async function updateClinicalAssessment(
  recordId: string,
  expectedVersion: number,
  input: ClinicalAssessmentInput,
) {
  const { skinLesionTypes, expectedVersion: _v, ...rest } = input;

  const result = await prisma.medical_records.updateMany({
    where: { id: recordId, version: expectedVersion, deletedAt: null },
    data: {
      ...rest,
      ...(skinLesionTypes ? { skinLesionTypes: skinLesionTypes.join(',') } : {}),
      version: { increment: 1 },
    },
  });

  return result.count === 1;
}

/** Read-only lookup into the lab catalog owned by Lane 9/Phase 2 — needed here only for price/name snapshotting at order time. */
export function findActiveLabTestType(labTestTypeId: string) {
  return prisma.lab_test_types.findFirst({ where: { id: labTestTypeId, isActive: true } });
}

export async function createLabTestOrders(
  recordId: string,
  expectedVersion: number,
  orderedBy: string,
  items: OrderLabTestsInput['items'],
  resolvedTypes: Map<string, { testName: string; fee: string }>,
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.medical_records.updateMany({
      where: { id: recordId, version: expectedVersion, deletedAt: null },
      data: { status: 'waiting_results', version: { increment: 1 } },
    });
    if (updated.count !== 1) return null;

    const createdTests = [];
    for (const item of items) {
      const resolved = resolvedTypes.get(item.labTestTypeId);
      if (!resolved) continue;
      const created = await tx.lab_tests.create({
        data: {
          id: randomUUID(),
          recordId,
          labTestTypeId: item.labTestTypeId,
          isUrgent: item.isUrgent ?? false,
          orderedBy,
          testName: resolved.testName,
          fee: resolved.fee,
          specimenType: item.specimenType,
          method: item.method,
          status: 'ordered',
        },
      });
      createdTests.push(created);
    }

    const record = await tx.medical_records.findUniqueOrThrow({ where: { id: recordId } });
    return { record, createdTests };
  });
}

export async function diagnoseRecord(
  recordId: string,
  doctorId: string,
  input: DiagnoseRecordInput,
) {
  const now = new Date();
  const result = await prisma.medical_records.updateMany({
    where: {
      id: recordId,
      version: input.expectedVersion,
      doctorId,
      deletedAt: null,
      // 'diagnosed' is included so the assigned doctor can correct ICD/diagnosisText/treatmentType
      // before the record closes (doctor.html "Sửa lại" edit flow) — same endpoint, idempotent overwrite.
      status: { in: ['open', 'waiting_results', 'diagnosed'] },
    },
    data: {
      icd10: input.icd10,
      icdCodingSystem: 'TT06_2026',
      diagnosisText: input.diagnosisText,
      diagnosedBy: doctorId,
      diagnosedAt: now,
      diagnosisSignedBy: doctorId,
      diagnosisSignedAt: now,
      diagnosisSignatureMethod: input.signatureMethod,
      treatmentType: input.treatmentType,
      status: 'diagnosed',
      version: { increment: 1 },
    },
  });

  if (result.count !== 1) return null;
  return prisma.medical_records.findUniqueOrThrow({ where: { id: recordId } });
}
