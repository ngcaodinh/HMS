import { randomUUID } from 'node:crypto';

import { prisma } from '../../../core/db/prisma-client';
import type {
  ClinicalAssessmentInput,
  DiagnoseRecordInput,
  OrderLabTestsInput,
  VitalSignsInput,
  WorklistQuery,
} from '../types/medical-record.types';

const detailInclude = {
  patient: true,
  doctor: { select: { fullName: true } },
  department: { select: { name: true } },
  bed: { select: { number: true } },
  diagnosisSignedByUser: { select: { fullName: true } },
  labTests: { include: { labTestType: true } },
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
    prisma.medicalRecord.findMany({
      where,
      include: { patient: true, labTests: { select: { status: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.medicalRecord.count({ where }),
  ]);
}

export function findMedicalRecordById(recordId: string) {
  return prisma.medicalRecord.findUnique({ where: { id: recordId }, include: detailInclude });
}

/** Kiểm tra đơn đã ký còn hiệu lực trước khi cho phép đổi hồ sơ từ ngoại trú sang nội trú. */
export function findActivePrescriptionForRecord(recordId: string) {
  return prisma.prescription.findFirst({
    where: { recordId, status: { in: ['active', 'xml_exported'] } },
    select: { id: true },
  });
}

export type MedicalRecordDetail = NonNullable<Awaited<ReturnType<typeof findMedicalRecordById>>>;

/**
 * Lưu snapshot sinh hiệu, audit log và khám lâm sàng trong cùng transaction.
 * Trả về null khi version hồ sơ đã thay đổi để service phát sinh lỗi 409.
 */
export async function saveVitalSignsAndAssessment(
  recordId: string,
  recordedBy: string,
  input: ClinicalAssessmentInput,
  vitalSigns: VitalSignsInput,
) {
  return prisma.$transaction(async (tx) => {
    const {
      expectedVersion: _expectedVersion,
      chiefComplaint,
      heightCm,
      weightKg,
      historyOfPresentIllness,
      pastMedicalHistory,
      familyHistory,
      skinLesionTypes,
      skinLesionDescription,
      skinLesionLocation,
      skinLesionDistribution,
      bodySurfaceAreaPercent,
      itchSeverity,
      notes,
    } = input;
    void _expectedVersion;
    const assessment = {
      chiefComplaint,
      heightCm,
      weightKg,
      historyOfPresentIllness,
      pastMedicalHistory,
      familyHistory,
      skinLesionDescription,
      skinLesionLocation,
      skinLesionDistribution,
      bodySurfaceAreaPercent,
      itchSeverity,
      notes,
    };
    const snapshot = {
      pulse: vitalSigns.pulse,
      temperatureC: vitalSigns.temperatureC ?? null,
      bloodPressureSystolic: vitalSigns.bloodPressureSystolic,
      bloodPressureDiastolic: vitalSigns.bloodPressureDiastolic,
      respiratoryRate: vitalSigns.respiratoryRate ?? null,
      spo2: vitalSigns.spo2,
      weightKg: vitalSigns.weightKg ?? null,
    };
    const updated = await tx.medicalRecord.updateMany({
      where: {
        id: recordId,
        doctorId: recordedBy,
        version: input.expectedVersion,
        deletedAt: null,
        status: { not: 'closed' },
      },
      data: {
        ...assessment,
        ...(skinLesionTypes ? { skinLesionTypes: skinLesionTypes.join(',') } : {}),
        vitalSigns: snapshot,
        vitalConfirmedBy: recordedBy,
        vitalConfirmedAt: new Date(),
        version: { increment: 1 },
      },
    });
    if (updated.count !== 1) return null;

    const log = await tx.vitalSignLog.create({
      data: {
        id: randomUUID(),
        recordId,
        recordedBy,
        pulse: vitalSigns.pulse,
        temperatureC: vitalSigns.temperatureC,
        bloodPressureSystolic: vitalSigns.bloodPressureSystolic,
        bloodPressureDiastolic: vitalSigns.bloodPressureDiastolic,
        respiratoryRate: vitalSigns.respiratoryRate,
        spo2: vitalSigns.spo2,
        weightKg: vitalSigns.weightKg,
        treatmentOrderId: vitalSigns.treatmentOrderId,
        measuredAt: vitalSigns.measuredAt ? new Date(vitalSigns.measuredAt) : undefined,
        note: vitalSigns.note,
      },
    });

    return { log };
  });
}

export async function updateClinicalAssessment(
  recordId: string,
  doctorId: string,
  expectedVersion: number,
  input: ClinicalAssessmentInput,
) {
  const { skinLesionTypes, expectedVersion: _expectedVersion, ...rest } = input;
  void _expectedVersion;

  const result = await prisma.medicalRecord.updateMany({
    where: {
      id: recordId,
      doctorId,
      version: expectedVersion,
      deletedAt: null,
      status: { not: 'closed' },
    },
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
  return prisma.labTestType.findFirst({ where: { id: labTestTypeId, isActive: true } });
}

export async function createLabTestOrders(
  recordId: string,
  expectedVersion: number,
  orderedBy: string,
  items: OrderLabTestsInput['items'],
  resolvedTypes: Map<string, { testName: string; fee: string }>,
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.medicalRecord.updateMany({
      where: {
        id: recordId,
        doctorId: orderedBy,
        version: expectedVersion,
        deletedAt: null,
        status: { not: 'closed' },
      },
      data: { status: 'waiting_results', version: { increment: 1 } },
    });
    if (updated.count !== 1) return null;

    const createdTests = [];
    for (const item of items) {
      const resolved = resolvedTypes.get(item.labTestTypeId);
      if (!resolved) continue;
      const created = await tx.labTest.create({
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

    const record = await tx.medicalRecord.findUniqueOrThrow({ where: { id: recordId } });
    return { record, createdTests };
  });
}

export async function diagnoseRecord(
  recordId: string,
  doctorId: string,
  input: DiagnoseRecordInput,
) {
  const now = new Date();
  const result = await prisma.medicalRecord.updateMany({
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
  return prisma.medicalRecord.findUniqueOrThrow({ where: { id: recordId } });
}
