import { randomUUID } from 'node:crypto';

import { AppError } from '../../../core/errors/appError';
import { auditPort } from '../../../core/ports/auditPort';
import { realtimePort } from '../../../core/ports/realtimePort';
import {
  formatVietnamDbDateTime,
  getVietnamLegalDate,
  getVietnamLegalDateString,
  toVietnamDbDateTime,
} from '../../../core/time/vietnamClock';
import {
  IDENTITY_CARD_REGEX,
  VN_MOBILE_PHONE_REGEX,
} from '../../patients/constants/patient.constants';
import { patientRepository } from '../../patients/repositories/patient.repository';
import { queueRepository } from '../../queue/repositories/queue.repository';
import { queueService } from '../../queue/services/queue.service';
import { receptionRepository } from '../repositories/reception.repository';

export type CreateReceptionInput = {
  queueTicketId?: string;
  createDirectTicket?: boolean;
  doctorId: string;
  departmentId?: string;
  consultationServiceId?: string;
  existingPatientId?: string;
  newPatient?: {
    fullName: string;
    dateOfBirth: string;
    gender: 'male' | 'female';
    phoneNumber?: string | null;
    phoneNumberUnavailableReason?: string | null;
    identityCardNumber?: string | null;
    address?: string | null;
    healthInsuranceCode?: string | null;
    healthInsuranceExpiryDate?: string | null;
    privacyNoticeAccepted: true;
  };
  chiefComplaint?: string;
  actorUserId?: string;
};

/**
 * Tiếp nhận: patient + medical_record open + serve ticket called.
 */
export class ReceptionService {
  async listDoctors() {
    return receptionRepository.listActiveDoctors();
  }

  async createReception(input: CreateReceptionInput) {
    const doctor = await receptionRepository.findDoctor(input.doctorId);
    if (!doctor) {
      throw new AppError(400, 'MISSING_DOCTOR', 'Bác sĩ không hợp lệ hoặc không hoạt động');
    }

    const service = await receptionRepository.findConsultationService(
      input.consultationServiceId,
    );
    if (!service) {
      throw new AppError(
        400,
        'CONSULTATION_SERVICE_UNRESOLVED',
        'Không tìm thấy dịch vụ khám ngoại trú',
      );
    }

    const department =
      (input.departmentId
        ? await receptionRepository.findDefaultDepartment()
        : await receptionRepository.findDefaultDepartment()) ?? null;

    // Resolve / create patient
    let patientId: string;
    let patientCode: string;
    let patientVersion = 1;
    let isEmergencyBypass = false;

    if (input.existingPatientId) {
      const existing = await patientRepository.findById(input.existingPatientId);
      if (!existing) {
        throw new AppError(404, 'PATIENT_NOT_FOUND', 'Không tìm thấy bệnh nhân');
      }
      patientId = existing.id;
      patientCode = existing.patientCode;
      patientVersion = existing.version;
      isEmergencyBypass = existing.isEmergencyBypass;
    } else if (input.newPatient) {
      const np = input.newPatient;
      this.assertNewPatient(np);

      if (np.identityCardNumber) {
        const dup = await patientRepository.findByIdentityCard(np.identityCardNumber);
        if (dup) {
          throw new AppError(
            409,
            'IDENTITY_CARD_ALREADY_EXISTS',
            'CCCD đã tồn tại. Vui lòng mở hồ sơ bệnh nhân hiện có.',
          );
        }
      }

      const created = await patientRepository.create({
        fullName: np.fullName,
        dateOfBirth: np.dateOfBirth,
        gender: np.gender,
        phoneNumber: np.phoneNumber?.trim() || null,
        phoneNumberUnavailableReason: np.phoneNumberUnavailableReason ?? null,
        identityCardNumber: np.identityCardNumber?.trim() || null,
        address: np.address ?? null,
        healthInsuranceCode: np.healthInsuranceCode ?? null,
        healthInsuranceExpiryDate: np.healthInsuranceExpiryDate ?? null,
        privacyNoticeAccepted: true,
      });
      patientId = created.id;
      patientCode = created.patientCode;
      patientVersion = created.version;
      isEmergencyBypass = created.isEmergencyBypass;
    } else {
      throw new AppError(400, 'VALIDATION_ERROR', 'Thiếu existingPatientId hoặc newPatient');
    }

    // Ticket: existing called OR createDirectTicket
    let queueTicketId = input.queueTicketId;

    if (input.createDirectTicket) {
      // Walk-in: cấp số + chuyển ngay called (không cắt hàng waiting có sẵn).
      const issued = await queueService.issueTicket({
        idempotencyKey: randomUUID(),
        source: 'reception_desk',
      });
      await queueRepository.updateStatus(issued.ticketId, {
        status: 'called',
        calledAt: toVietnamDbDateTime(),
      });
      queueTicketId = issued.ticketId;
    }

    if (!queueTicketId) {
      throw new AppError(400, 'QUEUE_TICKET_REQUIRED', 'Thiếu số thứ tự hàng đợi');
    }

    try {
      const result = await receptionRepository.completeReception({
        patientId,
        doctorId: input.doctorId,
        departmentId: input.departmentId ?? department?.id ?? null,
        consultationServiceId: service.id,
        fee: service.price,
        queueTicketId,
        chiefComplaint: input.chiefComplaint,
      });

      await auditPort.record({
        action: 'reception.create',
        resource: 'MedicalRecord',
        resourceId: result.medicalRecord.id,
        userId: input.actorUserId,
        metadata: {
          patientId,
          queueTicketId,
          doctorId: input.doctorId,
        },
      });

      const dateString = getVietnamLegalDateString();
      await realtimePort.publishQueue({
        eventName: 'queue.ticket.updated',
        date: dateString,
        payload: {
          ticketId: result.ticket.id,
          number: result.ticket.number,
          status: 'served',
          calledAt: formatVietnamDbDateTime(result.ticket.calledAt),
          date: dateString,
        },
      });

      return {
        patient: {
          patientId,
          patientCode,
          isEmergencyBypass,
          version: patientVersion,
        },
        medicalRecord: {
          recordId: result.medicalRecord.id,
          recordCode: result.medicalRecord.recordCode,
          status: result.medicalRecord.status,
          doctorId: result.medicalRecord.doctorId,
          version: result.medicalRecord.version,
        },
        serviceOrder: {
          serviceOrderId: result.serviceOrder.id,
          fee: Number(result.serviceOrder.fee).toFixed(2),
          status: result.serviceOrder.status,
        },
        queueTicket: {
          ticketId: result.ticket.id,
          status: result.ticket.status,
          calledAt: formatVietnamDbDateTime(result.ticket.calledAt),
          servedAt: formatVietnamDbDateTime(result.ticket.servedAt),
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'QUEUE_TICKET_NOT_FOUND') {
        throw new AppError(404, 'QUEUE_TICKET_NOT_FOUND', 'Không tìm thấy số thứ tự');
      }
      if (message === 'QUEUE_TICKET_NOT_CALLED') {
        throw new AppError(
          400,
          'QUEUE_TICKET_NOT_CALLED',
          'Chỉ tiếp nhận được số đang ở trạng thái đã gọi',
        );
      }
      if (message === 'QUEUE_TICKET_ALREADY_CHANGED') {
        throw new AppError(
          409,
          'QUEUE_TICKET_ALREADY_CHANGED',
          'Số thứ tự đã thay đổi trạng thái. Vui lòng làm mới.',
        );
      }
      throw error;
    }
  }

  private assertNewPatient(np: NonNullable<CreateReceptionInput['newPatient']>): void {
    const phone = np.phoneNumber?.trim();
    if (phone) {
      if (!VN_MOBILE_PHONE_REGEX.test(phone)) {
        throw new AppError(
          400,
          'INVALID_PHONE_FORMAT',
          'Số điện thoại phải gồm 10 chữ số và dùng đầu số di động Việt Nam hợp lệ',
        );
      }
    } else if (!np.phoneNumberUnavailableReason) {
      throw new AppError(
        400,
        'PHONE_REQUIRED',
        'Bắt buộc nhập số điện thoại hoặc lý do không có SĐT',
      );
    }

    const cccd = np.identityCardNumber?.trim();
    if (cccd && !IDENTITY_CARD_REGEX.test(cccd)) {
      throw new AppError(
        400,
        'INVALID_IDENTITY_CARD_FORMAT',
        'Căn cước công dân phải đủ 12 chữ số',
      );
    }

    if (!np.privacyNoticeAccepted) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Cần xác nhận thông báo bảo vệ dữ liệu');
    }
  }

  /**
   * Tiếp nhận cấp cứu — không queue; patient vô danh + bypass + record isEmergency.
   */
  async createEmergencyAdmission(input: {
    gender: 'male' | 'female';
    emergencyReason: string;
    doctorId?: string;
    departmentId?: string;
    chiefComplaint?: string;
    actorUserId?: string;
  }) {
    const reason = input.emergencyReason.trim();
    if (reason.length < 10) {
      throw new AppError(
        400,
        'INVALID_EMERGENCY_REASON',
        'Lý do cấp cứu tối thiểu 10 ký tự',
      );
    }

    let doctorId = input.doctorId;
    if (doctorId) {
      const doctor = await receptionRepository.findDoctor(doctorId);
      if (!doctor) {
        throw new AppError(404, 'DOCTOR_NOT_FOUND', 'Không tìm thấy bác sĩ');
      }
    } else {
      const doctors = await receptionRepository.listActiveDoctors();
      const first = doctors[0];
      if (!first) {
        throw new AppError(
          409,
          'NO_ON_DUTY_DOCTOR',
          'Không có bác sĩ sẵn sàng cho ca cấp cứu',
        );
      }
      doctorId = first.id;
    }

    const service = await receptionRepository.findConsultationService();
    if (!service) {
      throw new AppError(
        400,
        'CONSULTATION_SERVICE_UNRESOLVED',
        'Không tìm thấy dịch vụ khám',
      );
    }

    const department = await receptionRepository.findDefaultDepartment();
    const legalDate = getVietnamLegalDateString();
    const stt = await receptionRepository.nextEmergencyAnonymousStt(legalDate);
    const genderLabel = input.gender === 'male' ? 'Nam' : 'Nữ';
    const fullName = `Vô danh ${genderLabel} - Cấp Cứu ngày: ${legalDate} - ${String(stt).padStart(3, '0')}`;

    const result = await receptionRepository.createEmergencyAdmission({
      fullName,
      gender: input.gender,
      // DOB tạm = ngày tiếp nhận (legal VN)
      dateOfBirth: getVietnamLegalDate(),
      doctorId,
      departmentId: input.departmentId ?? department?.id ?? null,
      emergencyReason: reason,
      chiefComplaint: input.chiefComplaint,
      consultationServiceId: service.id,
      fee: service.price,
    });

    await auditPort.record({
      action: 'reception.emergency_create',
      resource: 'MedicalRecord',
      resourceId: result.medicalRecord.id,
      userId: input.actorUserId,
      metadata: {
        patientId: result.patient.id,
        gender: input.gender,
        reasonLength: reason.length,
        isEmergency: true,
      },
    });

    return {
      patient: {
        patientId: result.patient.id,
        patientCode: result.patient.patientCode,
        fullName: result.patient.fullName,
        gender: result.patient.gender,
        isEmergencyBypass: result.patient.isEmergencyBypass,
      },
      medicalRecord: {
        recordId: result.medicalRecord.id,
        recordCode: result.medicalRecord.recordCode,
        status: result.medicalRecord.status,
        doctorId: result.medicalRecord.doctorId,
        isEmergency: result.medicalRecord.isEmergency,
        emergencyReason: result.medicalRecord.emergencyReason,
      },
    };
  }
}

export const receptionService = new ReceptionService();
