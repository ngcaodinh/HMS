import { randomUUID } from 'node:crypto';

import { Prisma } from '@prisma/client';

import { AppError } from '../../../core/errors/app-error';
import { recordAuditLog } from '../../audit/services/audit.service';
import type { Principal } from '../../auth/types/auth.types';
import {
  createReferenceRange,
  findAttachmentById,
  findAttachmentsForLabTest,
  findLabTestById,
  findLabTestsForStats,
  findPendingLabTests,
  findReferenceRangesByType,
  findUserForPathology,
  listReferenceRanges,
  receiveSpecimenTx,
  recordLabResultTx,
  savePathologyWorkupDraftTx,
  softDeleteReferenceRange,
  updateLabTestTypeReferenceRange,
  updateReferenceRangeDetail,
  type LabTestWithDetails,
  type PendingLabTest,
  type ReferenceRangeWithType,
} from '../repositories/lab-test.repository';
import type {
  CreateReferenceRangeInput,
  LabActivityStatsQuery,
  ListPendingLabTestsQuery,
  ListReferenceRangesQuery,
  RecordLabResultInput,
  SavePathologyWorkupDraftInput,
  UpdateReferenceRangeDetailInput,
} from '../types/lab-test.types';

function shapePendingLabTest(labTest: PendingLabTest) {
  const record = labTest.medicalRecord;
  return {
    labTestId: labTest.id,
    recordId: labTest.recordId,
    labTestTypeId: labTest.labTestTypeId,
    testName: labTest.testName,
    resultTableKey: labTest.labTestType.resultTableKey,
    specimenType: labTest.specimenType,
    isUrgent: labTest.isUrgent,
    status: labTest.status,
    reportCode: labTest.reportCode,
    createdAt: labTest.createdAt,
    patient: {
      patientId: record.patient.id,
      patientCode: record.patient.patientCode,
      fullName: record.patient.fullName,
      dateOfBirth: record.patient.dateOfBirth,
      gender: record.patient.gender,
    },
    department: record.department ? { name: record.department.name } : null,
    orderingDoctor: { fullName: record.doctor.fullName },
  };
}

/**
 * @route GET /api/v1/lab-tests
 * @desc Lab technician worklist, hard-scoped to the technician's own department (not a
 * client-controlled query param, to prevent viewing other departments' queues).
 * @access lab_tech
 */
export async function listPendingLabTests(query: ListPendingLabTestsQuery, principal: Principal) {
  const [labTests, totalItems] = await findPendingLabTests(principal.departmentId, {
    status: query.status,
    isUrgent: query.isUrgent,
    page: query.page,
    pageSize: query.pageSize,
  });

  return {
    data: labTests.map(shapePendingLabTest),
    pagination: { page: query.page, pageSize: query.pageSize, totalItems },
  };
}

const RESULT_FIELD_BY_KEY = {
  xn_cong_thuc_mau: 'cbcResult',
  xn_nuoc_tieu: 'urinalysisResult',
  xn_vi_sinh: 'microbiology',
  xn_mo_benh_hoc: 'pathology',
  xn_hoa_sinh_mau: 'bioChemistry',
} as const;

function shapeReferenceRange(range: Awaited<ReturnType<typeof findReferenceRangesByType>>[number]) {
  return {
    fieldKey: range.fieldKey,
    code: range.code,
    label: range.label,
    unit: range.unit,
    lowerBound: range.lowerBound?.toString() ?? null,
    upperBound: range.upperBound?.toString() ?? null,
    condition: range.condition,
  };
}

function shapeLabTestDetail(
  labTest: LabTestWithDetails,
  attachments: Awaited<ReturnType<typeof findAttachmentsForLabTest>>,
  referenceRanges: Awaited<ReturnType<typeof findReferenceRangesByType>>,
) {
  const record = labTest.medicalRecord;
  const resultTableKey = labTest.labTestType.resultTableKey;
  const structuredResult = labTest[RESULT_FIELD_BY_KEY[resultTableKey]] ?? null;

  return {
    labTestId: labTest.id,
    recordId: labTest.recordId,
    testName: labTest.testName,
    status: labTest.status,
    resultTableKey,
    isUrgent: labTest.isUrgent,
    specimenType: labTest.specimenType,
    reportCode: labTest.reportCode,
    method: labTest.method,
    conclusion: labTest.conclusion,
    resultedBy: labTest.resultedByUser?.fullName ?? null,
    resultedAt: labTest.resultedAt,
    signedBy: labTest.signedByUser?.fullName ?? null,
    signedAt: labTest.signedAt,
    patient: {
      patientId: record.patient.id,
      patientCode: record.patient.patientCode,
      fullName: record.patient.fullName,
      dateOfBirth: record.patient.dateOfBirth,
      gender: record.patient.gender,
      healthInsuranceCode: record.patient.healthInsuranceCode,
    },
    department: record.department ? { name: record.department.name } : null,
    orderingDoctor: { fullName: record.doctor.fullName },
    diagnosis: record.icd10 ? { icd10: record.icd10, diagnosisText: record.diagnosisText } : null,
    structuredResult,
    referenceRanges: referenceRanges.map(shapeReferenceRange),
    attachments: attachments.map((attachment) => ({
      attachmentId: attachment.id,
      fileType: attachment.fileType,
      originalName: attachment.originalName,
      uploadedAt: attachment.uploadedAt,
    })),
  };
}

/**
 * @route GET /api/v1/lab-tests/:labTestId
 * @access doctor, lab_tech
 * @throws {AppError} 404 LAB_TEST_NOT_FOUND
 */
export async function getLabResultDetail(labTestId: string) {
  const labTest = await findLabTestById(labTestId);
  if (!labTest) throw AppError.notFound('LAB_TEST_NOT_FOUND', 'Không tìm thấy phiếu xét nghiệm.');
  const [attachments, referenceRanges] = await Promise.all([
    findAttachmentsForLabTest(labTestId),
    findReferenceRangesByType(labTest.labTestTypeId),
  ]);
  return shapeLabTestDetail(labTest, attachments, referenceRanges);
}

/** Accepts both `ordered` and `in_progress` — only a already-`resulted` test is rejected. */
async function loadOrderedLabTest(labTestId: string): Promise<LabTestWithDetails> {
  const labTest = await findLabTestById(labTestId);
  if (!labTest) throw AppError.notFound('LAB_TEST_NOT_FOUND', 'Không tìm thấy phiếu xét nghiệm.');
  if (labTest.status === 'resulted') {
    throw AppError.badRequest('TEST_ALREADY_RESULTED', 'Phiếu xét nghiệm đã có kết quả trước đó.');
  }
  return labTest;
}

/**
 * @route POST /api/v1/lab-tests/:labTestId/receive-specimen
 * @desc "Tiếp nhận mẫu" — ordered -> in_progress, ghi specimenReceivedAt. Gọi tự động khi KTV mở
 * màn Nhập kết quả cho 1 phiếu đang chờ mẫu (không có nút tiếp nhận riêng trong ảnh mẫu).
 * @access lab_tech
 * @throws {AppError} 404 LAB_TEST_NOT_FOUND, 400 TEST_ALREADY_RESULTED
 */
export async function receiveSpecimen(labTestId: string, principal: Principal) {
  const labTest = await loadOrderedLabTest(labTestId);
  if (labTest.status === 'in_progress') {
    return { labTestId, status: labTest.status, specimenReceivedAt: labTest.specimenReceivedAt };
  }

  const updated = await receiveSpecimenTx(labTestId);
  if (!updated)
    throw AppError.badRequest('TEST_ALREADY_RESULTED', 'Phiếu xét nghiệm đã có kết quả trước đó.');

  await recordAuditLog({
    userId: principal.userId,
    userRole: 'lab_tech',
    userName: principal.fullName,
    action: 'UPDATE',
    resource: 'LabTest',
    resourceId: labTestId,
  });

  return {
    labTestId: updated.id,
    status: updated.status,
    specimenReceivedAt: updated.specimenReceivedAt,
  };
}

async function assertAttachmentBelongsToLabTest(attachmentId: string, labTestId: string) {
  const attachment = await findAttachmentById(attachmentId);
  if (!attachment || attachment.ownerType !== 'lab_test' || attachment.ownerId !== labTestId) {
    throw AppError.conflict(
      'ATTACHMENT_OWNER_MISMATCH',
      'Tệp đính kèm không thuộc phiếu xét nghiệm này.',
    );
  }
}

/**
 * Xác minh bác sĩ đọc kết quả GPB tồn tại, đang hoạt động và có role doctor.
 * Đây là kiểm tra nghiệp vụ bổ sung cho FK/UUID để không gán nhầm user hợp lệ nhưng sai chuyên môn.
 */
async function assertPathologyDoctor(userId: string) {
  const user = await findUserForPathology(userId);
  if (!user || !user.isActive) {
    throw AppError.notFound(
      'PATHOLOGY_DOCTOR_NOT_FOUND',
      'Không tìm thấy bác sĩ giải phẫu bệnh đang hoạt động.',
    );
  }
  if (!user.permissions.some((permission) => permission.roleCode === 'doctor')) {
    throw AppError.unprocessable(
      'PATHOLOGY_DOCTOR_ROLE_INVALID',
      'User được chọn không có vai trò bác sĩ.',
    );
  }
}

/** Xác định đúng unique constraint reportCode mà không che giấu các lỗi DB khác. */
function isReportCodeUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002')
    return false;
  const target = JSON.stringify(error.meta?.target ?? '')
    .toLowerCase()
    .replaceAll('_', '');
  return target.includes('reportcode');
}

/**
 * @route POST /api/v1/lab-tests/:labTestId/result
 * @desc Validates the structured result against the catalog's resultTableKey, verifies the
 * attachment belongs to this lab test, transitions `ordered -> resulted` with e-signature.
 * @access lab_tech
 * @throws {AppError} 400 LAB_RESULT_TYPE_MISMATCH, 400 TEST_ALREADY_RESULTED,
 * 409 ATTACHMENT_OWNER_MISMATCH, 409 VERSION_CONFLICT
 */
export async function recordLabResult(
  labTestId: string,
  input: RecordLabResultInput,
  principal: Principal,
) {
  const labTest = await loadOrderedLabTest(labTestId);
  if (labTest.labTestType.resultTableKey !== input.resultTableKey) {
    throw AppError.badRequest(
      'LAB_RESULT_TYPE_MISMATCH',
      'Loại kết quả không khớp với danh mục xét nghiệm.',
    );
  }
  if (input.resultTableKey === 'xn_mo_benh_hoc') {
    await assertPathologyDoctor(input.structuredResult.bacSiGiaiPhauBenh);
  }
  await assertAttachmentBelongsToLabTest(input.attachmentId, labTestId);

  let updated: Awaited<ReturnType<typeof recordLabResultTx>>;
  try {
    updated = await recordLabResultTx({
      labTestId,
      resultTableKey: input.resultTableKey,
      structuredResult: input.structuredResult,
      resultedBy: principal.userId,
      signedBy: principal.userId,
      reportCode: input.reportCode,
      specimenType: input.specimenType,
      method: input.method,
      conclusion: input.conclusion,
    });
  } catch (error) {
    if (isReportCodeUniqueViolation(error)) {
      throw AppError.conflict('REPORT_CODE_ALREADY_EXISTS', 'Mã phiếu kết quả đã tồn tại.');
    }
    throw error;
  }
  if (!updated)
    throw AppError.badRequest('TEST_ALREADY_RESULTED', 'Phiếu xét nghiệm đã có kết quả trước đó.');

  await recordAuditLog({
    userId: principal.userId,
    userRole: 'lab_tech',
    userName: principal.fullName,
    action: 'SIGN',
    resource: 'LabTest',
    resourceId: labTestId,
  });

  return {
    labTestId: updated.id,
    status: updated.status,
    resultedBy: updated.resultedBy,
    resultedAt: updated.resultedAt,
    signedAt: updated.signedAt,
    attachmentId: input.attachmentId,
  };
}

/**
 * @route PUT /api/v1/lab-tests/:labTestId/pathology-workup
 * @desc Save an in-progress histopathology workup — never touches `lab_tests.status` (Gate G4);
 * only `recordLabResult` with `trangThai: da_co_ket_qua` finalizes the test.
 * @access lab_tech
 * @throws {AppError} 400 LAB_RESULT_TYPE_MISMATCH, 400 TEST_ALREADY_RESULTED
 */
export async function savePathologyWorkupDraft(
  labTestId: string,
  input: SavePathologyWorkupDraftInput,
  principal: Principal,
) {
  const labTest = await loadOrderedLabTest(labTestId);
  if (labTest.labTestType.resultTableKey !== 'xn_mo_benh_hoc') {
    throw AppError.badRequest(
      'LAB_RESULT_TYPE_MISMATCH',
      'Loại kết quả không khớp với danh mục xét nghiệm.',
    );
  }

  const updated = await savePathologyWorkupDraftTx(labTestId, input.structuredResult);

  await recordAuditLog({
    userId: principal.userId,
    userRole: 'lab_tech',
    userName: principal.fullName,
    action: 'UPDATE',
    resource: 'LabTest',
    resourceId: labTestId,
  });

  return {
    labTestId,
    labTestStatus: labTest.status,
    pathologyStatus: updated.trangThai,
    resultedAt: null,
  };
}

/**
 * @route PATCH /api/v1/lab-test-types/:id/reference-range
 * @desc Simplified reference-range management — a single free-text field per catalog type
 * (no per-analyte table; SQL deliberately dropped a shared reference-range table, see plan notes).
 * @access admin
 */
export async function manageLabTestTypeReferenceRange(
  id: string,
  referenceRange: string,
  principal: Principal,
) {
  const updated = await updateLabTestTypeReferenceRange(id, referenceRange);
  if (!updated)
    throw AppError.notFound('LAB_TEST_TYPE_NOT_FOUND', 'Không tìm thấy loại xét nghiệm.');

  await recordAuditLog({
    userId: principal.userId,
    userRole: principal.roleCodes[0] ?? 'unknown',
    userName: principal.fullName,
    action: 'UPDATE',
    resource: 'LabTestType',
    resourceId: id,
  });

  return { labTestTypeId: updated.id, referenceRange: updated.referenceRange };
}

function shapeReferenceRangeRow(range: ReferenceRangeWithType) {
  return {
    referenceRangeId: range.id,
    labTestTypeId: range.labTestTypeId,
    labTestTypeName: range.labTestType.name,
    resultTableKey: range.labTestType.resultTableKey,
    fieldKey: range.fieldKey,
    code: range.code,
    label: range.label,
    unit: range.unit,
    lowerBound: range.lowerBound?.toString() ?? null,
    upperBound: range.upperBound?.toString() ?? null,
    condition: range.condition,
  };
}

/**
 * @route GET /api/v1/lab-tests/reference-ranges
 * @access admin
 */
export async function listReferenceRangesForConfig(query: ListReferenceRangesQuery) {
  const [ranges, totalItems] = await listReferenceRanges(query);
  return {
    data: ranges.map(shapeReferenceRangeRow),
    pagination: { page: query.page, pageSize: query.pageSize, totalItems },
  };
}

/**
 * @route POST /api/v1/lab-tests/reference-ranges
 * @access admin
 * @throws {AppError} 409 REFERENCE_RANGE_ALREADY_EXISTS
 */
export async function createNewReferenceRange(
  input: CreateReferenceRangeInput,
  principal: Principal,
) {
  try {
    const created = await createReferenceRange({
      id: randomUUID(),
      labTestTypeId: input.labTestTypeId,
      fieldKey: input.fieldKey,
      code: input.code,
      label: input.label,
      unit: input.unit,
      lowerBound: input.lowerBound !== undefined ? String(input.lowerBound) : undefined,
      upperBound: input.upperBound !== undefined ? String(input.upperBound) : undefined,
      condition: input.condition,
    });

    await recordAuditLog({
      userId: principal.userId,
      userRole: principal.roleCodes[0] ?? 'unknown',
      userName: principal.fullName,
      action: 'CREATE',
      resource: 'LabReferenceRange',
      resourceId: created.id,
    });

    return shapeReferenceRangeRow(created);
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002')
      throw error;
    throw AppError.conflict(
      'REFERENCE_RANGE_ALREADY_EXISTS',
      'Đã có trị số tham chiếu cho chỉ số/điều kiện này.',
    );
  }
}

/**
 * @route PATCH /api/v1/lab-tests/reference-ranges/:referenceRangeId
 * @access admin
 * @throws {AppError} 404 REFERENCE_RANGE_NOT_FOUND
 */
export async function updateReferenceRangeById(
  referenceRangeId: string,
  input: UpdateReferenceRangeDetailInput,
  principal: Principal,
) {
  const updated = await updateReferenceRangeDetail(referenceRangeId, {
    ...(input.labTestTypeId !== undefined ? { labTestTypeId: input.labTestTypeId } : {}),
    ...(input.fieldKey !== undefined ? { fieldKey: input.fieldKey } : {}),
    ...(input.code !== undefined ? { code: input.code } : {}),
    ...(input.label !== undefined ? { label: input.label } : {}),
    ...(input.unit !== undefined ? { unit: input.unit } : {}),
    ...(input.lowerBound !== undefined ? { lowerBound: String(input.lowerBound) } : {}),
    ...(input.upperBound !== undefined ? { upperBound: String(input.upperBound) } : {}),
    ...(input.condition !== undefined ? { condition: input.condition } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  });
  if (!updated)
    throw AppError.notFound('REFERENCE_RANGE_NOT_FOUND', 'Không tìm thấy trị số tham chiếu.');

  await recordAuditLog({
    userId: principal.userId,
    userRole: principal.roleCodes[0] ?? 'unknown',
    userName: principal.fullName,
    action: 'UPDATE',
    resource: 'LabReferenceRange',
    resourceId: referenceRangeId,
  });

  return shapeReferenceRangeRow(updated);
}

/**
 * @route DELETE /api/v1/lab-tests/reference-ranges/:referenceRangeId
 * @access lab_tech, admin
 * @throws {AppError} 404 REFERENCE_RANGE_NOT_FOUND
 */
export async function deleteReferenceRangeById(referenceRangeId: string, principal: Principal) {
  const deleted = await softDeleteReferenceRange(referenceRangeId);
  if (!deleted)
    throw AppError.notFound('REFERENCE_RANGE_NOT_FOUND', 'Không tìm thấy trị số tham chiếu.');

  await recordAuditLog({
    userId: principal.userId,
    userRole: principal.roleCodes[0] ?? 'unknown',
    userName: principal.fullName,
    action: 'DELETE',
    resource: 'LabReferenceRange',
    resourceId: referenceRangeId,
  });

  return { referenceRangeId };
}

function periodRange(period: 'today' | 'week' | 'month', date?: string): { from: Date; to: Date } {
  const base = date ? new Date(date) : new Date();
  const to = new Date(base);
  to.setHours(23, 59, 59, 999);
  const from = new Date(base);
  from.setHours(0, 0, 0, 0);
  if (period === 'week') from.setDate(from.getDate() - from.getDay());
  if (period === 'month') from.setDate(1);
  return { from, to };
}

/**
 * @route GET /api/v1/lab-tests/stats
 * @desc Thống kê hoạt động (tổng mẫu tiếp nhận, mẫu hoàn thành, ca cấp cứu hoàn thành, TAT trung
 * bình, phân bố mẫu theo giờ) — tính từ dữ liệu lab_tests sẵn có, không cần cột mới.
 * @access lab_tech
 */
export async function getLabActivityStats(query: LabActivityStatsQuery, principal: Principal) {
  const { from, to } = periodRange(query.period, query.date);
  const rows = await findLabTestsForStats(principal.departmentId, from, to);

  const totalReceived = rows.filter((row) => row.specimenReceivedAt !== null).length;
  const totalCompleted = rows.filter(
    (row) => row.status === 'resulted' && row.signedAt !== null,
  ).length;
  const urgentCompleted = rows.filter((row) => row.isUrgent && row.status === 'resulted').length;

  const tatMinutes = rows
    .filter((row) => row.specimenReceivedAt && row.resultedAt)
    .map((row) => (row.resultedAt!.getTime() - row.specimenReceivedAt!.getTime()) / 60000);
  const averageTatMinutes = tatMinutes.length
    ? Math.round(tatMinutes.reduce((sum, value) => sum + value, 0) / tatMinutes.length)
    : 0;

  const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
  for (const row of rows) {
    if (!row.specimenReceivedAt) continue;
    const hour = row.specimenReceivedAt.getHours();
    const bucket = hourlyDistribution[hour];
    if (bucket) bucket.count += 1;
  }

  return { totalReceived, totalCompleted, urgentCompleted, averageTatMinutes, hourlyDistribution };
}
