import { prisma } from '../../../core/db/prisma-client';

const detailInclude = {
  lab_test_types: true,
  medical_records: {
    include: { patients: true, departments: true, users_medical_records_doctorIdTousers: true },
  },
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

export function findReferenceRangesByType(labTestTypeId: string) {
  return prisma.lab_reference_ranges.findMany({ where: { labTestTypeId, isActive: true } });
}
