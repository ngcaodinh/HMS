import { randomUUID } from 'node:crypto';

import type { Prisma } from '@prisma/client';

import { prisma } from '../../../core/db/prisma-client';

const queueInclude = {
  labTestType: true,
  medicalRecord: {
    include: { patient: true, department: true, doctor: true },
  },
  orderedByUser: true,
} as const;

export function findPendingLabTests(
  departmentId: string,
  filters: {
    status?: 'ordered' | 'in_progress' | 'resulted';
    isUrgent?: boolean;
    page: number;
    pageSize: number;
  },
) {
  const where: Prisma.LabTestWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.isUrgent !== undefined ? { isUrgent: filters.isUrgent } : {}),
    labTestType: { departmentId },
  };

  return Promise.all([
    prisma.labTest.findMany({
      where,
      include: queueInclude,
      orderBy: [{ isUrgent: 'desc' }, { createdAt: 'asc' }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.labTest.count({ where }),
  ]);
}

export type PendingLabTest = Awaited<ReturnType<typeof findPendingLabTests>>[0][number];

const detailInclude = {
  labTestType: true,
  medicalRecord: {
    include: { patient: true, department: true, doctor: true },
  },
  orderedByUser: true,
  resultedByUser: true,
  signedByUser: true,
  cbcResult: true,
  urinalysisResult: true,
  microbiology: true,
  pathology: true,
  bioChemistry: true,
} as const;

export function findLabTestById(labTestId: string) {
  return prisma.labTest.findUnique({ where: { id: labTestId }, include: detailInclude });
}

export type LabTestWithDetails = NonNullable<Awaited<ReturnType<typeof findLabTestById>>>;

export function findAttachmentsForLabTest(labTestId: string) {
  return prisma.attachment.findMany({
    where: { ownerType: 'lab_test', ownerId: labTestId },
    orderBy: { uploadedAt: 'desc' },
  });
}

export function findAttachmentById(attachmentId: string) {
  return prisma.attachment.findUnique({ where: { id: attachmentId } });
}

class LabTestAlreadyResultedError extends Error {}

interface RecordLabResultParams {
  labTestId: string;
  resultTableKey: 'xn_cong_thuc_mau' | 'xn_nuoc_tieu' | 'xn_vi_sinh' | 'xn_mo_benh_hoc' | 'xn_hoa_sinh_mau';
  structuredResult: Record<string, unknown>;
  resultedBy: string;
  signedBy: string;
  reportCode?: string;
  specimenType?: string;
  method?: string;
  conclusion?: string;
}

/** Transaction: upsert the one matching child result table + flip `lab_tests` to `resulted`, guarded
 * by `where: { status: 'ordered' }` (no `version` field on lab_tests to use for optimistic locking).
 * A concurrent duplicate submit rolls back the child-table write too — returns null on race loss. */
export async function recordLabResultTx(params: RecordLabResultParams) {
  try {
    return await prisma.$transaction(async (tx) => {
      const resultId = randomUUID();
      const upsertData = { id: resultId, labTestId: params.labTestId, ...params.structuredResult };
      switch (params.resultTableKey) {
        case 'xn_cong_thuc_mau':
          await tx.xnCongThucMau.upsert({
            where: { labTestId: params.labTestId },
            create: upsertData as Prisma.XnCongThucMauUncheckedCreateInput,
            update: params.structuredResult as Prisma.XnCongThucMauUncheckedUpdateInput,
          });
          break;
        case 'xn_nuoc_tieu':
          await tx.xnNuocTieu.upsert({
            where: { labTestId: params.labTestId },
            create: upsertData as Prisma.XnNuocTieuUncheckedCreateInput,
            update: params.structuredResult as Prisma.XnNuocTieuUncheckedUpdateInput,
          });
          break;
        case 'xn_vi_sinh':
          await tx.xnViSinh.upsert({
            where: { labTestId: params.labTestId },
            create: upsertData as Prisma.XnViSinhUncheckedCreateInput,
            update: params.structuredResult as Prisma.XnViSinhUncheckedUpdateInput,
          });
          break;
        case 'xn_mo_benh_hoc':
          await tx.xnMoBenhHoc.upsert({
            where: { labTestId: params.labTestId },
            create: upsertData as Prisma.XnMoBenhHocUncheckedCreateInput,
            update: params.structuredResult as Prisma.XnMoBenhHocUncheckedUpdateInput,
          });
          break;
        case 'xn_hoa_sinh_mau':
          await tx.xnHoaSinhMau.upsert({
            where: { labTestId: params.labTestId },
            create: upsertData as Prisma.XnHoaSinhMauUncheckedCreateInput,
            update: params.structuredResult as Prisma.XnHoaSinhMauUncheckedUpdateInput,
          });
          break;
      }

      const updated = await tx.labTest.updateMany({
        where: { id: params.labTestId, status: { in: ['ordered', 'in_progress'] } },
        data: {
          status: 'resulted',
          resultedBy: params.resultedBy,
          resultedAt: new Date(),
          signedBy: params.signedBy,
          signedAt: new Date(),
          signatureMethod: 'dev_e_confirmation',
          reportCode: params.reportCode,
          specimenType: params.specimenType,
          method: params.method,
          conclusion: params.conclusion,
        },
      });
      if (updated.count !== 1) throw new LabTestAlreadyResultedError();

      return tx.labTest.findUniqueOrThrow({ where: { id: params.labTestId }, include: detailInclude });
    });
  } catch (error) {
    if (error instanceof LabTestAlreadyResultedError) return null;
    throw error;
  }
}

/** Only ever touches `xn_mo_benh_hoc` — never writes `lab_tests.status`/`resultedAt` (Gate G4). */
export function savePathologyWorkupDraftTx(labTestId: string, structuredResult: Record<string, unknown>) {
  return prisma.xnMoBenhHoc.upsert({
    where: { labTestId },
    create: { id: randomUUID(), labTestId, ...structuredResult } as Prisma.XnMoBenhHocUncheckedCreateInput,
    update: structuredResult as Prisma.XnMoBenhHocUncheckedUpdateInput,
  });
}

export async function updateLabTestTypeReferenceRange(id: string, referenceRange: string) {
  const result = await prisma.labTestType.updateMany({ where: { id }, data: { referenceRange } });
  if (result.count !== 1) return null;
  return prisma.labTestType.findUniqueOrThrow({ where: { id } });
}

/** "Tiếp nhận mẫu" — ordered -> in_progress, ghi nhận specimenReceivedAt. Guarded so it only ever
 * fires once from `ordered`; already-in_progress/resulted calls are no-ops (return null). */
export async function receiveSpecimenTx(labTestId: string) {
  const result = await prisma.labTest.updateMany({
    where: { id: labTestId, status: 'ordered' },
    data: { status: 'in_progress', specimenReceivedAt: new Date() },
  });
  if (result.count !== 1) return null;
  return prisma.labTest.findUniqueOrThrow({ where: { id: labTestId }, include: detailInclude });
}

export function listReferenceRanges(filters: { labTestTypeId?: string; keyword?: string; page: number; pageSize: number }) {
  const where: Prisma.LabReferenceRangeWhereInput = {
    isActive: true,
    ...(filters.labTestTypeId ? { labTestTypeId: filters.labTestTypeId } : {}),
    ...(filters.keyword
      ? { OR: [{ code: { contains: filters.keyword } }, { label: { contains: filters.keyword } }] }
      : {}),
  };
  return Promise.all([
    prisma.labReferenceRange.findMany({
      where,
      include: { labTestType: true },
      orderBy: { code: 'asc' },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.labReferenceRange.count({ where }),
  ]);
}

export type ReferenceRangeWithType = Awaited<ReturnType<typeof listReferenceRanges>>[0][number];

export function createReferenceRange(data: Prisma.LabReferenceRangeUncheckedCreateInput) {
  return prisma.labReferenceRange.create({ data, include: { labTestType: true } });
}

export async function updateReferenceRangeDetail(id: string, data: Prisma.LabReferenceRangeUncheckedUpdateInput) {
  const result = await prisma.labReferenceRange.updateMany({ where: { id }, data });
  if (result.count !== 1) return null;
  return prisma.labReferenceRange.findUniqueOrThrow({ where: { id }, include: { labTestType: true } });
}

export async function softDeleteReferenceRange(id: string) {
  const result = await prisma.labReferenceRange.updateMany({ where: { id }, data: { isActive: false } });
  return result.count === 1;
}

export function findReferenceRangesByType(labTestTypeId: string) {
  return prisma.labReferenceRange.findMany({ where: { labTestTypeId, isActive: true } });
}

/** Dữ liệu thô cho thống kê hoạt động — tính toán/group ở service để tránh raw SQL không cần thiết. */
export function findLabTestsForStats(departmentId: string, from: Date, to: Date) {
  return prisma.labTest.findMany({
    where: { labTestType: { departmentId }, createdAt: { gte: from, lte: to } },
    select: {
      status: true,
      isUrgent: true,
      specimenReceivedAt: true,
      resultedAt: true,
      signedAt: true,
    },
  });
}
