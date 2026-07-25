import { randomUUID } from 'node:crypto';

import type { Prisma } from '@prisma/client';

import { prisma } from '../../../core/db/prisma-client';

const queueInclude = {
  lab_test_types: true,
  medical_records: {
    include: { patients: true, departments: true, users_medical_records_doctorIdTousers: true },
  },
  users_lab_tests_orderedByTousers: true,
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
  const where: Prisma.lab_testsWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.isUrgent !== undefined ? { isUrgent: filters.isUrgent } : {}),
    lab_test_types: { departmentId },
  };

  return Promise.all([
    prisma.lab_tests.findMany({
      where,
      include: queueInclude,
      orderBy: [{ isUrgent: 'desc' }, { createdAt: 'asc' }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.lab_tests.count({ where }),
  ]);
}

export type PendingLabTest = Awaited<ReturnType<typeof findPendingLabTests>>[0][number];

const detailInclude = {
  lab_test_types: true,
  medical_records: {
    include: { patients: true, departments: true, users_medical_records_doctorIdTousers: true },
  },
  users_lab_tests_orderedByTousers: true,
  users_lab_tests_resultedByTousers: true,
  users_lab_tests_signedByTousers: true,
  xn_cong_thuc_mau: true,
  xn_nuoc_tieu: true,
  xn_vi_sinh: true,
  xn_mo_benh_hoc: true,
  xn_hoa_sinh_mau: true,
} as const;

export function findLabTestById(labTestId: string) {
  return prisma.lab_tests.findUnique({ where: { id: labTestId }, include: detailInclude });
}

export type LabTestWithDetails = NonNullable<Awaited<ReturnType<typeof findLabTestById>>>;

export function findAttachmentsForLabTest(labTestId: string) {
  return prisma.attachments.findMany({
    where: { ownerType: 'lab_test', ownerId: labTestId },
    orderBy: { uploadedAt: 'desc' },
  });
}

export function findAttachmentById(attachmentId: string) {
  return prisma.attachments.findUnique({ where: { id: attachmentId } });
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
          await tx.xn_cong_thuc_mau.upsert({
            where: { labTestId: params.labTestId },
            create: upsertData as Prisma.xn_cong_thuc_mauUncheckedCreateInput,
            update: params.structuredResult as Prisma.xn_cong_thuc_mauUncheckedUpdateInput,
          });
          break;
        case 'xn_nuoc_tieu':
          await tx.xn_nuoc_tieu.upsert({
            where: { labTestId: params.labTestId },
            create: upsertData as Prisma.xn_nuoc_tieuUncheckedCreateInput,
            update: params.structuredResult as Prisma.xn_nuoc_tieuUncheckedUpdateInput,
          });
          break;
        case 'xn_vi_sinh':
          await tx.xn_vi_sinh.upsert({
            where: { labTestId: params.labTestId },
            create: upsertData as Prisma.xn_vi_sinhUncheckedCreateInput,
            update: params.structuredResult as Prisma.xn_vi_sinhUncheckedUpdateInput,
          });
          break;
        case 'xn_mo_benh_hoc':
          await tx.xn_mo_benh_hoc.upsert({
            where: { labTestId: params.labTestId },
            create: upsertData as Prisma.xn_mo_benh_hocUncheckedCreateInput,
            update: params.structuredResult as Prisma.xn_mo_benh_hocUncheckedUpdateInput,
          });
          break;
        case 'xn_hoa_sinh_mau':
          await tx.xn_hoa_sinh_mau.upsert({
            where: { labTestId: params.labTestId },
            create: upsertData as Prisma.xn_hoa_sinh_mauUncheckedCreateInput,
            update: params.structuredResult as Prisma.xn_hoa_sinh_mauUncheckedUpdateInput,
          });
          break;
      }

      const updated = await tx.lab_tests.updateMany({
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

      return tx.lab_tests.findUniqueOrThrow({ where: { id: params.labTestId }, include: detailInclude });
    });
  } catch (error) {
    if (error instanceof LabTestAlreadyResultedError) return null;
    throw error;
  }
}

/** Only ever touches `xn_mo_benh_hoc` — never writes `lab_tests.status`/`resultedAt` (Gate G4). */
export function savePathologyWorkupDraftTx(labTestId: string, structuredResult: Record<string, unknown>) {
  return prisma.xn_mo_benh_hoc.upsert({
    where: { labTestId },
    create: { id: randomUUID(), labTestId, ...structuredResult } as Prisma.xn_mo_benh_hocUncheckedCreateInput,
    update: structuredResult as Prisma.xn_mo_benh_hocUncheckedUpdateInput,
  });
}

export async function updateLabTestTypeReferenceRange(id: string, referenceRange: string) {
  const result = await prisma.lab_test_types.updateMany({ where: { id }, data: { referenceRange } });
  if (result.count !== 1) return null;
  return prisma.lab_test_types.findUniqueOrThrow({ where: { id } });
}

/** "Tiếp nhận mẫu" — ordered -> in_progress, ghi nhận specimenReceivedAt. Guarded so it only ever
 * fires once from `ordered`; already-in_progress/resulted calls are no-ops (return null). */
export async function receiveSpecimenTx(labTestId: string) {
  const result = await prisma.lab_tests.updateMany({
    where: { id: labTestId, status: 'ordered' },
    data: { status: 'in_progress', specimenReceivedAt: new Date() },
  });
  if (result.count !== 1) return null;
  return prisma.lab_tests.findUniqueOrThrow({ where: { id: labTestId }, include: detailInclude });
}

export function listReferenceRanges(filters: { labTestTypeId?: string; keyword?: string; page: number; pageSize: number }) {
  const where: Prisma.lab_reference_rangesWhereInput = {
    isActive: true,
    ...(filters.labTestTypeId ? { labTestTypeId: filters.labTestTypeId } : {}),
    ...(filters.keyword
      ? { OR: [{ code: { contains: filters.keyword } }, { label: { contains: filters.keyword } }] }
      : {}),
  };
  return Promise.all([
    prisma.lab_reference_ranges.findMany({
      where,
      include: { lab_test_types: true },
      orderBy: { code: 'asc' },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.lab_reference_ranges.count({ where }),
  ]);
}

export type ReferenceRangeWithType = Awaited<ReturnType<typeof listReferenceRanges>>[0][number];

export function createReferenceRange(data: Prisma.lab_reference_rangesUncheckedCreateInput) {
  return prisma.lab_reference_ranges.create({ data, include: { lab_test_types: true } });
}

export async function updateReferenceRangeDetail(id: string, data: Prisma.lab_reference_rangesUncheckedUpdateInput) {
  const result = await prisma.lab_reference_ranges.updateMany({ where: { id }, data });
  if (result.count !== 1) return null;
  return prisma.lab_reference_ranges.findUniqueOrThrow({ where: { id }, include: { lab_test_types: true } });
}

export async function softDeleteReferenceRange(id: string) {
  const result = await prisma.lab_reference_ranges.updateMany({ where: { id }, data: { isActive: false } });
  return result.count === 1;
}

export function findReferenceRangesByType(labTestTypeId: string) {
  return prisma.lab_reference_ranges.findMany({ where: { labTestTypeId, isActive: true } });
}

/** Dữ liệu thô cho thống kê hoạt động — tính toán/group ở service để tránh raw SQL không cần thiết. */
export function findLabTestsForStats(departmentId: string, from: Date, to: Date) {
  return prisma.lab_tests.findMany({
    where: { lab_test_types: { departmentId }, createdAt: { gte: from, lte: to } },
    select: {
      status: true,
      isUrgent: true,
      specimenReceivedAt: true,
      resultedAt: true,
      signedAt: true,
    },
  });
}
