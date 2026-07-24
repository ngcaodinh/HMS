import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { AppError } from '../../../core/errors/app-error';
import { config } from '../../../config/unifiedConfig';
import { recordAuditLog } from '../../audit/services/audit.service';
import type { Principal } from '../../auth/types/auth.types';
import {
  cancelPrescriptionTx,
  createDraftPrescription,
  dispensePrescriptionTx,
  findActiveMedicinesByIds,
  findDispensablePrescriptions,
  findLatestPrescriptionForRecord,
  findNextRoundNumber,
  findPrescriptionById,
  findRecordForPrescription,
  markXmlExportedTx,
  signPrescriptionTx,
  type DispensablePrescription,
  type PrescriptionWithDetails,
} from '../repositories/prescription.repository';
import { findAllergyConflict } from './allergy-matcher';
import type {
  CancelPrescriptionInput,
  CreatePrescriptionDraftInput,
  SignPrescriptionInput,
} from '../types/prescription.types';

const MIN_OVERRIDE_REASON_LENGTH = 15;
const CHRONIC_DAYS_THRESHOLD = 30;
const MAX_DAYS = 90;

async function loadAssignedOutpatientRecord(recordId: string, doctorId: string) {
  const record = await findRecordForPrescription(recordId);
  if (!record) throw AppError.notFound('MEDICAL_RECORD_NOT_FOUND', 'Không tìm thấy hồ sơ khám.');
  if (record.doctorId !== doctorId) {
    throw AppError.forbidden('FORBIDDEN_ACCESS', 'Bạn không có quyền kê đơn trên hồ sơ này.');
  }
  if (record.status === 'closed') {
    throw AppError.badRequest('RECORD_ALREADY_CLOSED', 'Hồ sơ khám đã đóng.');
  }
  if (record.treatmentType !== 'outpatient') {
    throw AppError.badRequest('RECORD_NOT_OUTPATIENT', 'Hồ sơ chưa chẩn đoán hướng ngoại trú.');
  }
  return record;
}

async function loadOwnedPrescription(prescriptionId: string, doctorId: string): Promise<PrescriptionWithDetails> {
  const prescription = await findPrescriptionById(prescriptionId);
  if (!prescription) throw AppError.notFound('PRESCRIPTION_NOT_FOUND', 'Không tìm thấy đơn thuốc.');
  if (prescription.medical_records.doctorId !== doctorId) {
    throw AppError.forbidden('FORBIDDEN_ACCESS', 'Bạn không có quyền thao tác trên đơn thuốc này.');
  }
  return prescription;
}

/** Cancel is reachable from two roles: the prescribing doctor, or any pharmacist reviewing the
 * order at the dispense screen ("Từ chối / Trả đơn") — not scoped to a single owner like sign/export. */
async function loadPrescriptionForStaffAccess(prescriptionId: string, principal: Principal): Promise<PrescriptionWithDetails> {
  const prescription = await findPrescriptionById(prescriptionId);
  if (!prescription) throw AppError.notFound('PRESCRIPTION_NOT_FOUND', 'Không tìm thấy đơn thuốc.');
  const isOwnerDoctor = prescription.medical_records.doctorId === principal.userId;
  const isPharmacist = principal.roleCodes.includes('pharmacist');
  if (!isOwnerDoctor && !isPharmacist) {
    throw AppError.forbidden('FORBIDDEN_ACCESS', 'Bạn không có quyền thao tác trên đơn thuốc này.');
  }
  return prescription;
}

function assertLongTermReason(items: CreatePrescriptionDraftInput['items'], longTermReason?: string) {
  const maxDays = Math.max(0, ...items.map((item) => item.days));
  if (maxDays > MAX_DAYS) {
    throw AppError.badRequest('DURATION_EXCEEDED', 'Số ngày kê vượt quá 90 ngày cho phép.');
  }
  if (maxDays > CHRONIC_DAYS_THRESHOLD && (!longTermReason || longTermReason.trim().length < MIN_OVERRIDE_REASON_LENGTH)) {
    throw AppError.badRequest(
      'DURATION_EXCEEDED',
      'Kê thuốc trên 30 ngày cần lý do chuyên môn (bệnh mãn tính) tối thiểu 15 ký tự.',
    );
  }
}

async function resolveAndValidateItems(input: CreatePrescriptionDraftInput, patientAllergies: string | null) {
  assertLongTermReason(input.items, input.longTermReason);

  const medicines = await findActiveMedicinesByIds(input.items.map((item) => item.medicineId));
  const medicineById = new Map(medicines.map((medicine) => [medicine.id, medicine]));

  let conflictDrugName: string | null = null;
  let conflictAllergy: string | null = null;

  const resolved = input.items.map((item) => {
    const medicine = medicineById.get(item.medicineId);
    if (!medicine) {
      throw AppError.badRequest('INVALID_PRESCRIPTION', `Thuốc không tồn tại hoặc đã ngừng kinh doanh (${item.medicineId}).`);
    }

    const conflict = findAllergyConflict(medicine.activeIngredient, medicine.name, patientAllergies);
    if (conflict && !conflictDrugName) {
      conflictDrugName = medicine.name;
      conflictAllergy = conflict;
    }

    return {
      medicineId: medicine.id,
      medicineNameSnapshot: medicine.name,
      activeIngredientSnapshot: medicine.activeIngredient,
      dosageSnapshot: medicine.dosage,
      quantity: item.quantity,
      days: item.days,
      dosePerUse: item.dosePerUse,
      usesPerDay: item.usesPerDay,
      useTiming: item.useTiming,
      dosageInstruction: item.dosageInstruction,
      longTermReason: item.days > CHRONIC_DAYS_THRESHOLD ? input.longTermReason : undefined,
      unitPrice: medicine.unitPrice.toString(),
      total: medicine.unitPrice.mul(item.quantity).toString(),
    };
  });

  const hasValidOverride = (input.allergyOverrideReason?.trim().length ?? 0) >= MIN_OVERRIDE_REASON_LENGTH;
  if (conflictDrugName && !hasValidOverride) {
    throw AppError.unprocessable(
      'ALLERGY_WARNING',
      `Thuốc ${conflictDrugName} trùng dị ứng "${conflictAllergy}" đã ghi nhận trên hồ sơ bệnh nhân. Cần lý do chuyên môn ghi đè (tối thiểu 15 ký tự).`,
    );
  }

  return resolved;
}

/**
 * @route POST /api/v1/medical-records/:recordId/prescriptions
 * @desc Doctor creates an immutable-line-snapshot draft prescription for an outpatient record.
 * @access doctor
 * @throws {AppError} 400 INVALID_PRESCRIPTION, 400 DURATION_EXCEEDED, 422 ALLERGY_WARNING,
 * 400 RECORD_NOT_OUTPATIENT, 403 FORBIDDEN_ACCESS, 409 VERSION_CONFLICT
 */
export async function createPrescriptionDraft(recordId: string, doctorId: string, input: CreatePrescriptionDraftInput) {
  const record = await loadAssignedOutpatientRecord(recordId, doctorId);
  if (record.version !== input.expectedRecordVersion) {
    throw AppError.conflict('VERSION_CONFLICT', 'Hồ sơ đã bị thay đổi bởi thao tác khác.');
  }
  if (input.items.length === 0 && !input.noDrugConfirmation) {
    throw AppError.badRequest('INVALID_PRESCRIPTION', 'Đơn trống — kê ít nhất 1 thuốc hoặc xác nhận Không dùng thuốc.');
  }

  const resolvedItems = input.items.length > 0 ? await resolveAndValidateItems(input, record.patients.allergies) : [];
  const roundNumber = await findNextRoundNumber(recordId);
  const { prescription, items } = await createDraftPrescription(
    recordId,
    doctorId,
    roundNumber,
    input.prescriptionType ?? 'C',
    resolvedItems,
    input.allergyOverrideReason,
  );

  await recordAuditLog({
    userId: doctorId,
    userRole: 'doctor',
    userName: doctorId,
    action: 'CREATE',
    resource: 'Prescription',
    resourceId: prescription.id,
  });

  return {
    prescriptionId: prescription.id,
    recordId: prescription.recordId,
    status: prescription.status,
    isSigned: prescription.isSigned,
    items: items.map((item) => ({
      prescriptionItemId: item.id,
      medicineId: item.medicineId,
      medicineNameSnapshot: item.medicineNameSnapshot,
      activeIngredientSnapshot: item.activeIngredientSnapshot,
      quantity: item.quantity,
      days: item.days,
      dosageInstruction: item.dosageInstruction,
      unitPrice: item.unitPrice.toString(),
      total: item.total.toString(),
    })),
    version: prescription.version,
  };
}

/**
 * @route GET /api/v1/medical-records/:recordId/prescriptions/latest
 * @desc Convenience read for the doctor's own Rx tab — the current non-cancelled prescription
 * (if any) for this record, so the UI can restore draft/signed state on reload.
 * @access doctor
 */
export async function getLatestPrescriptionForRecord(recordId: string, doctorId: string) {
  await loadAssignedOutpatientRecord(recordId, doctorId).catch((error) => {
    if (error instanceof AppError && error.code === 'RECORD_NOT_OUTPATIENT') return;
    throw error;
  });

  const prescription = await findLatestPrescriptionForRecord(recordId);
  if (!prescription) return null;

  return {
    prescriptionId: prescription.id,
    recordId: prescription.recordId,
    status: prescription.status,
    isSigned: prescription.isSigned,
    signedAt: prescription.signedAt,
    xmlExportedAt: prescription.xmlExportedAt,
    allergyOverrideReason: prescription.allergyOverrideReason,
    items: prescription.prescription_items.map((item) => ({
      prescriptionItemId: item.id,
      medicineId: item.medicineId,
      medicineNameSnapshot: item.medicineNameSnapshot,
      activeIngredientSnapshot: item.activeIngredientSnapshot,
      quantity: item.quantity,
      days: item.days,
      dosePerUse: item.dosePerUse,
      usesPerDay: item.usesPerDay,
      useTiming: item.useTiming,
      dosageInstruction: item.dosageInstruction,
      unitPrice: item.unitPrice.toString(),
      total: item.total.toString(),
    })),
    version: prescription.version,
  };
}

/**
 * @route POST /api/v1/prescriptions/:prescriptionId/sign
 * @desc Electronically sign a draft prescription, re-checking allergy conflicts.
 * @access doctor
 * @throws {AppError} 400 PRESCRIPTION_NOT_DRAFT, 422 ALLERGY_WARNING, 409 VERSION_CONFLICT
 */
export async function signPrescription(prescriptionId: string, doctorId: string, input: SignPrescriptionInput) {
  const prescription = await loadOwnedPrescription(prescriptionId, doctorId);
  if (prescription.status !== 'draft') {
    throw AppError.badRequest('PRESCRIPTION_NOT_DRAFT', 'Đơn thuốc không ở trạng thái nháp.');
  }

  const patientAllergies = prescription.medical_records.patients.allergies;
  const conflict = prescription.prescription_items
    .map((item) => findAllergyConflict(item.activeIngredientSnapshot, item.medicineNameSnapshot ?? '', patientAllergies))
    .find(Boolean);
  const hasOverride =
    Boolean(prescription.allergyOverrideReason) || (input.allergyOverrideReason?.trim().length ?? 0) >= MIN_OVERRIDE_REASON_LENGTH;
  if (conflict && !hasOverride) {
    throw AppError.unprocessable('ALLERGY_WARNING', `Đơn còn thuốc trùng dị ứng "${conflict}" chưa được ghi đè lý do chuyên môn.`);
  }

  const updated = await signPrescriptionTx(prescriptionId, input.expectedVersion, doctorId, input.allergyOverrideReason);
  if (!updated) throw AppError.conflict('VERSION_CONFLICT', 'Đơn thuốc đã bị thay đổi bởi thao tác khác.');

  await recordAuditLog({
    userId: doctorId,
    userRole: 'doctor',
    userName: doctorId,
    action: 'SIGN',
    resource: 'Prescription',
    resourceId: prescriptionId,
  });

  return {
    prescriptionId: updated.id,
    status: updated.status,
    isSigned: updated.isSigned,
    signedBy: updated.signedBy,
    signedAt: updated.signedAt,
    version: updated.version,
  };
}

/**
 * @route POST /api/v1/prescriptions/:prescriptionId/cancel
 * @access doctor
 * @throws {AppError} 409 INVALID_PRESCRIPTION_TRANSITION, 409 VERSION_CONFLICT
 */
export async function cancelPrescription(prescriptionId: string, principal: Principal, input: CancelPrescriptionInput) {
  const prescription = await loadPrescriptionForStaffAccess(prescriptionId, principal);
  if (prescription.status === 'cancelled') {
    throw AppError.conflict('INVALID_PRESCRIPTION_TRANSITION', 'Đơn thuốc đã bị hủy trước đó.');
  }

  const updated = await cancelPrescriptionTx(prescriptionId, input.expectedVersion, principal.userId, input.cancelReason);
  if (!updated) throw AppError.conflict('VERSION_CONFLICT', 'Đơn thuốc đã bị thay đổi bởi thao tác khác.');

  await recordAuditLog({
    userId: principal.userId,
    userRole: principal.roleCodes[0] ?? 'unknown',
    userName: principal.fullName,
    action: 'CANCEL',
    resource: 'Prescription',
    resourceId: prescriptionId,
  });

  return { prescriptionId: updated.id, status: updated.status, cancelledAt: updated.cancelledAt, version: updated.version };
}

function escapeXml(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPrescriptionXml(prescription: PrescriptionWithDetails): string {
  const record = prescription.medical_records;
  const doctorName = record.users_medical_records_doctorIdTousers.fullName;
  const patient = record.patients;
  const diagnosis = record.icd10 ? `${record.icd10} ${record.diagnosisText ?? ''}`.trim() : '';

  const itemsXml = prescription.prescription_items.length
    ? prescription.prescription_items
        .map(
          (item, index) =>
            `    <Thuoc stt="${index + 1}"><Ten>${escapeXml(item.medicineNameSnapshot)}</Ten><HoatChat>${escapeXml(item.activeIngredientSnapshot)}</HoatChat><SoLuong>${item.quantity}</SoLuong><SoNgay>${item.days}</SoNgay><Lieu>${escapeXml(item.dosePerUse)}</Lieu><CachDung>${escapeXml(item.dosageInstruction)}</CachDung></Thuoc>`,
        )
        .join('\n')
    : '    <KhongDungThuoc>true</KhongDungThuoc>';

  return `<?xml version="1.0" encoding="UTF-8"?>
<DonThuoc dienTu="true" maCoSo="HMS-VN">
  <BacSi>${escapeXml(doctorName)}</BacSi>
  <BenhNhan ma="${escapeXml(patient.patientCode)}">${escapeXml(patient.fullName)}</BenhNhan>
  <NgaySinh>${patient.dateOfBirth ? patient.dateOfBirth.toISOString().slice(0, 10) : ''}</NgaySinh>
  <ChanDoan>${escapeXml(diagnosis)}</ChanDoan>
  <Ky luc="${prescription.signedAt ? prescription.signedAt.toISOString() : ''}" boi="${escapeXml(doctorName)}" daKy="true"/>
  <DanhSachThuoc>
${itemsXml}
  </DanhSachThuoc>
</DonThuoc>
`;
}

/**
 * @route POST /api/v1/prescriptions/:prescriptionId/xml-exports
 * @desc Generate the local prescription XML file (QĐ 425/QĐ-BYT format) and move active -> xml_exported.
 * @access doctor
 * @throws {AppError} 400 PRESCRIPTION_NOT_SIGNED, 409 VERSION_CONFLICT
 */
export async function exportPrescriptionXml(prescriptionId: string, doctorId: string, expectedVersion: number) {
  const prescription = await loadOwnedPrescription(prescriptionId, doctorId);
  if (prescription.status !== 'active') {
    throw AppError.badRequest('PRESCRIPTION_NOT_SIGNED', 'Chỉ xuất XML sau khi đơn đã ký.');
  }

  const xml = buildPrescriptionXml(prescription);
  const fileName = `don-thuoc-${prescription.medical_records.patients.patientCode}-${prescription.id.slice(0, 8)}.xml`;
  const dir = path.join(config.upload.root, 'prescriptions');
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, fileName);
  await writeFile(filePath, xml, 'utf-8');

  const updated = await markXmlExportedTx(prescriptionId, expectedVersion, filePath);
  if (!updated) throw AppError.conflict('VERSION_CONFLICT', 'Đơn thuốc đã bị thay đổi bởi thao tác khác.');

  await recordAuditLog({
    userId: doctorId,
    userRole: 'doctor',
    userName: doctorId,
    action: 'EXPORT',
    resource: 'Prescription',
    resourceId: prescriptionId,
  });

  return {
    prescriptionId: updated.id,
    status: updated.status,
    xmlExportedAt: updated.xmlExportedAt,
    download: { endpoint: `/api/v1/prescriptions/${prescriptionId}/xml-file`, fileType: 'xml', originalName: fileName },
    version: updated.version,
  };
}

/**
 * @route GET /api/v1/prescriptions/:prescriptionId/xml-file
 * @access doctor, pharmacist
 * @throws {AppError} 400 PRESCRIPTION_XML_NOT_EXPORTED
 */
export async function downloadPrescriptionXml(prescriptionId: string, principal: Principal) {
  const prescription = await loadPrescriptionForStaffAccess(prescriptionId, principal);
  if (!prescription.xmlFilePath) {
    throw AppError.badRequest('PRESCRIPTION_XML_NOT_EXPORTED', 'Đơn thuốc chưa được xuất XML.');
  }
  const content = await readFile(prescription.xmlFilePath);
  return { content, fileName: path.basename(prescription.xmlFilePath) };
}

function shapeDispensablePrescription(prescription: DispensablePrescription) {
  const record = prescription.medical_records;
  return {
    prescriptionId: prescription.id,
    prescriptionCode: prescription.prescriptionCode,
    status: prescription.status,
    signedAt: prescription.signedAt,
    dispensedAt: prescription.dispensedAt,
    allergyOverrideReason: prescription.allergyOverrideReason,
    allergyOverrideAt: prescription.allergyOverrideAt,
    patient: {
      patientId: record.patients.id,
      patientCode: record.patients.patientCode,
      fullName: record.patients.fullName,
      dateOfBirth: record.patients.dateOfBirth,
      gender: record.patients.gender,
      allergies: record.patients.allergies,
      healthInsuranceCode: record.patients.healthInsuranceCode,
    },
    department: record.departments ? { name: record.departments.name } : null,
    prescribingDoctor: { fullName: record.users_medical_records_doctorIdTousers.fullName },
    diagnosis: record.icd10 ? { icd10: record.icd10, diagnosisText: record.diagnosisText } : null,
    items: prescription.prescription_items.map((item) => ({
      prescriptionItemId: item.id,
      medicineNameSnapshot: item.medicineNameSnapshot,
      activeIngredientSnapshot: item.activeIngredientSnapshot,
      dosageSnapshot: item.dosageSnapshot,
      quantity: item.quantity,
      days: item.days,
      dosePerUse: item.dosePerUse,
      useTiming: item.useTiming,
      dosageInstruction: item.dosageInstruction,
    })),
    version: prescription.version,
  };
}

/**
 * @route GET /api/v1/prescriptions
 * @desc Pharmacist worklist — signed, non-cancelled prescriptions pending (or already) dispensed.
 * @access pharmacist
 */
export async function listDispensablePrescriptions(query: {
  keyword?: string;
  dispensed?: boolean;
  page: number;
  pageSize: number;
}) {
  const [prescriptions, totalItems] = await findDispensablePrescriptions({
    keyword: query.keyword,
    dispensed: query.dispensed ?? false,
    page: query.page,
    pageSize: query.pageSize,
  });

  return {
    data: prescriptions.map(shapeDispensablePrescription),
    pagination: { page: query.page, pageSize: query.pageSize, totalItems },
  };
}

/**
 * @route POST /api/v1/prescriptions/:prescriptionId/dispenses
 * @desc Pharmacist records dispensing actor/time for a signed, not-yet-dispensed prescription.
 * @access pharmacist
 * @throws {AppError} 400 PRESCRIPTION_NOT_SIGNED, 400 PRESCRIPTION_ALREADY_DISPENSED, 409 VERSION_CONFLICT
 */
export async function dispensePrescription(prescriptionId: string, pharmacistId: string, expectedVersion: number) {
  const prescription = await findPrescriptionById(prescriptionId);
  if (!prescription) throw AppError.notFound('PRESCRIPTION_NOT_FOUND', 'Không tìm thấy đơn thuốc.');
  if (prescription.status !== 'active' && prescription.status !== 'xml_exported') {
    throw AppError.badRequest('PRESCRIPTION_NOT_SIGNED', 'Đơn thuốc chưa được ký hoặc đã bị hủy.');
  }
  if (prescription.dispensedAt) {
    throw AppError.badRequest('PRESCRIPTION_ALREADY_DISPENSED', 'Đơn thuốc đã được cấp phát trước đó.');
  }

  const updated = await dispensePrescriptionTx(prescriptionId, expectedVersion, pharmacistId);
  if (!updated) throw AppError.conflict('VERSION_CONFLICT', 'Đơn thuốc đã bị thay đổi bởi thao tác khác.');

  await recordAuditLog({
    userId: pharmacistId,
    userRole: 'pharmacist',
    userName: pharmacistId,
    action: 'DISPENSE',
    resource: 'Prescription',
    resourceId: prescriptionId,
  });

  return {
    prescriptionId: updated.id,
    dispensedBy: updated.dispensedBy,
    dispensedAt: updated.dispensedAt,
    version: updated.version,
  };
}
