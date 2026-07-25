import { AppError } from '../../../core/errors/app-error';
import {
  findAttachmentsForLabTest,
  findLabTestById,
  findReferenceRangesByType,
  type LabTestWithDetails,
} from '../repositories/lab-test.repository';

const RESULT_FIELD_BY_KEY = {
  xn_cong_thuc_mau: 'xn_cong_thuc_mau',
  xn_nuoc_tieu: 'xn_nuoc_tieu',
  xn_vi_sinh: 'xn_vi_sinh',
  xn_mo_benh_hoc: 'xn_mo_benh_hoc',
  xn_hoa_sinh_mau: 'xn_hoa_sinh_mau',
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
  const record = labTest.medical_records;
  const resultTableKey = labTest.lab_test_types.resultTableKey;
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
    resultedBy: labTest.users_lab_tests_resultedByTousers?.fullName ?? null,
    resultedAt: labTest.resultedAt,
    signedBy: labTest.users_lab_tests_signedByTousers?.fullName ?? null,
    signedAt: labTest.signedAt,
    patient: {
      patientId: record.patients.id,
      patientCode: record.patients.patientCode,
      fullName: record.patients.fullName,
      dateOfBirth: record.patients.dateOfBirth,
      gender: record.patients.gender,
      healthInsuranceCode: record.patients.healthInsuranceCode,
    },
    department: record.departments ? { name: record.departments.name } : null,
    orderingDoctor: { fullName: record.users_medical_records_doctorIdTousers.fullName },
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
 * @desc Read-only lab result detail — the doctor's Tab 3 "Kết quả CLS" view. Write-side (record
 * result, receive specimen, reference-range management, stats) belongs to the lab_tech module
 * and is intentionally not ported onto this branch.
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
