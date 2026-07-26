import { AppError } from '../../../core/errors/appError';
import { auditPort } from '../../../core/ports/auditPort';
import { formatDateOnly, getVietnamNowIso } from '../../../core/time/vietnamClock';
import {
  IDENTITY_CARD_REGEX,
  VN_MOBILE_PHONE_REGEX,
} from '../constants/patient.constants';
import {
  maskFullName,
  maskIdentityCard,
  maskPhone,
  patientRepository,
} from '../repositories/patient.repository';
import type { PatientSearchResultDto } from '../types/patient.types';

/**
 * Search patient — PII masked, no MED.
 */
export class PatientService {
  async search(params: {
    fullName?: string;
    phoneNumber?: string;
    identityCardNumber?: string;
    page: number;
    pageSize: number;
  }): Promise<{
    data: PatientSearchResultDto[];
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
  }> {
    if (
      params.identityCardNumber &&
      !/^\d{12}$/.test(params.identityCardNumber)
    ) {
      throw new AppError(400, 'INVALID_SEARCH_QUERY', 'CCCD phải đúng 12 chữ số');
    }

    const skip = (params.page - 1) * params.pageSize;
    const { items, total } = await patientRepository.search({
      fullName: params.fullName,
      phoneNumber: params.phoneNumber,
      identityCardNumber: params.identityCardNumber,
      skip,
      take: params.pageSize,
    });

    return {
      data: items.map((patient) => ({
        patientId: patient.id,
        patientCode: patient.patientCode,
        fullName: maskFullName(patient.fullName),
        dateOfBirth: formatDateOnly(patient.dateOfBirth),
        phoneNumberMasked: maskPhone(patient.phoneNumber),
        identityCardNumberMasked: maskIdentityCard(patient.identityCardNumber),
      })),
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        totalItems: total,
        totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
      },
    };
  }

  /**
   * Chuẩn hóa danh tính sau cấp cứu — tắt bypass khi record emergency chưa closed.
   */
  async normalizeEmergencyIdentity(
    patientId: string,
    input: {
      expectedVersion: number;
      fullName: string;
      dateOfBirth: string;
      gender: 'male' | 'female';
      phoneNumber?: string | null;
      phoneNumberUnavailableReason?: string | null;
      identityCardNumber?: string | null;
      address?: string | null;
      privacyNoticeAccepted: true;
      actorUserId?: string;
    },
  ) {
    const patient = await patientRepository.findById(patientId);
    if (!patient) {
      throw new AppError(404, 'PATIENT_NOT_FOUND', 'Không tìm thấy bệnh nhân');
    }

    if (!patient.isEmergencyBypass) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Bệnh nhân không ở trạng thái bypass cấp cứu',
      );
    }

    const openEmergency = await patientRepository.findOpenEmergencyRecord(patientId);
    if (!openEmergency) {
      throw new AppError(
        400,
        'RECORD_ALREADY_CLOSED',
        'Không có bệnh án cấp cứu đang mở để chuẩn hóa danh tính',
      );
    }

    const phone = input.phoneNumber?.trim();
    if (phone) {
      if (!VN_MOBILE_PHONE_REGEX.test(phone)) {
        throw new AppError(
          400,
          'INVALID_PHONE_FORMAT',
          'Số điện thoại phải gồm 10 chữ số đầu di động Việt Nam',
        );
      }
    } else if (!input.phoneNumberUnavailableReason?.trim()) {
      throw new AppError(
        400,
        'PHONE_REQUIRED',
        'Bắt buộc nhập SĐT hoặc lý do không có SĐT',
      );
    }

    const cccd = input.identityCardNumber?.trim();
    if (cccd) {
      if (!IDENTITY_CARD_REGEX.test(cccd)) {
        throw new AppError(
          400,
          'INVALID_IDENTITY_CARD_FORMAT',
          'CCCD phải đủ 12 chữ số',
        );
      }
      const dup = await patientRepository.findByIdentityCard(cccd);
      if (dup && dup.id !== patientId) {
        throw new AppError(
          409,
          'IDENTITY_CARD_ALREADY_EXISTS',
          'CCCD đã tồn tại trên hồ sơ khác',
        );
      }
    }

    const changedFields: string[] = [];
    if (patient.fullName !== input.fullName.trim()) {
      changedFields.push('fullName');
    }
    if (formatDateOnly(patient.dateOfBirth) !== input.dateOfBirth) {
      changedFields.push('dateOfBirth');
    }
    if (patient.gender !== input.gender) {
      changedFields.push('gender');
    }
    if ((patient.phoneNumber ?? null) !== (phone || null)) {
      changedFields.push('phoneNumber');
    }
    if ((patient.identityCardNumber ?? null) !== (cccd || null)) {
      changedFields.push('identityCardNumber');
    }
    changedFields.push('isEmergencyBypass');

    const updated = await patientRepository.normalizeEmergencyIdentity({
      patientId,
      expectedVersion: input.expectedVersion,
      fullName: input.fullName,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      phoneNumber: phone || null,
      phoneNumberUnavailableReason: input.phoneNumberUnavailableReason ?? null,
      identityCardNumber: cccd || null,
      address: input.address ?? null,
    });

    if (!updated) {
      throw new AppError(
        409,
        'VERSION_CONFLICT',
        'Hồ sơ đã được cập nhật bởi người khác. Vui lòng tải lại.',
      );
    }

    await auditPort.record({
      action: 'patient.emergency_identity_normalize',
      resource: 'Patient',
      resourceId: patientId,
      userId: input.actorUserId,
      metadata: {
        changedFields,
        recordId: openEmergency.id,
        // Không log giá trị PII thô
      },
    });

    return {
      patientId: updated.id,
      fullName: updated.fullName,
      isEmergencyBypass: updated.isEmergencyBypass,
      version: updated.version,
      normalizedAt: getVietnamNowIso(),
    };
  }
}

export const patientService = new PatientService();
