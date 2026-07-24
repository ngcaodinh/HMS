import { randomUUID } from 'node:crypto';
import type { MedicalRecord, ServiceOrder } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { prisma } from '../../../core/prisma/prisma';
import { toVietnamDbDateTime } from '../../../core/time/vietnamClock';

export class ReceptionRepository {
  async nextRecordCode(): Promise<string> {
    const result = await prisma.$transaction(async (tx) => {
      const key = 'record_code';
      const existing = await tx.codeSequence.findUnique({ where: { key } });
      let next = 1;
      if (!existing) {
        await tx.codeSequence.create({ data: { key, lastNumber: 1 } });
      } else {
        const updated = await tx.codeSequence.update({
          where: { key },
          data: { lastNumber: { increment: 1 } },
        });
        next = updated.lastNumber;
      }
      return next;
    });
    return `HS${String(result).padStart(6, '0')}`;
  }

  async findDoctor(doctorId: string) {
    return prisma.doctor.findFirst({
      where: { id: doctorId, isActive: true },
      select: { id: true, fullName: true },
    });
  }

  async findDefaultDepartment() {
    return prisma.department.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findConsultationService(serviceId?: string) {
    if (serviceId) {
      return prisma.serviceCatalog.findFirst({
        where: { id: serviceId, isActive: true },
      });
    }
    return prisma.serviceCatalog.findFirst({
      where: { code: 'CONSULT_OUTPATIENT', isActive: true },
    });
  }

  async listActiveDoctors() {
    return prisma.doctor.findMany({
      where: { isActive: true },
      orderBy: { fullName: 'asc' },
      select: { id: true, fullName: true, employeeCode: true },
    });
  }

  /**
   * Transaction: create record + service order + mark ticket served.
   */
  async completeReception(params: {
    patientId: string;
    doctorId: string;
    departmentId: string | null;
    consultationServiceId: string;
    fee: Prisma.Decimal | number | string;
    queueTicketId: string;
    chiefComplaint?: string;
  }): Promise<{
    medicalRecord: MedicalRecord;
    serviceOrder: ServiceOrder;
    ticket: {
      id: string;
      status: string;
      calledAt: Date | null;
      servedAt: Date | null;
      number: number;
    };
  }> {
    const recordCode = await this.nextRecordCode();
    const now = toVietnamDbDateTime();
    const servedAt = now;

    return prisma.$transaction(async (tx) => {
      const ticket = await tx.queueTicket.findUnique({
        where: { id: params.queueTicketId },
      });

      if (!ticket) {
        throw new Error('QUEUE_TICKET_NOT_FOUND');
      }

      if (ticket.status !== 'called') {
        throw new Error('QUEUE_TICKET_NOT_CALLED');
      }

      const medicalRecord = await tx.medicalRecord.create({
        data: {
          id: randomUUID(),
          recordCode,
          patientId: params.patientId,
          doctorId: params.doctorId,
          departmentId: params.departmentId,
          status: 'open',
          isEmergency: false,
          chiefComplaint: params.chiefComplaint ?? null,
          version: 1,
          createdAt: now,
          updatedAt: now,
        },
      });

      const serviceOrder = await tx.serviceOrder.create({
        data: {
          id: randomUUID(),
          recordId: medicalRecord.id,
          serviceCatalogId: params.consultationServiceId,
          fee: params.fee,
          status: 'waiting',
          createdAt: now,
        },
      });

      const ticketUpdate = await tx.queueTicket.updateMany({
        where: { id: params.queueTicketId, status: 'called' },
        data: {
          status: 'served',
          servedAt,
          recordId: medicalRecord.id,
        },
      });

      if (ticketUpdate.count === 0) {
        throw new Error('QUEUE_TICKET_ALREADY_CHANGED');
      }

      const updatedTicket = await tx.queueTicket.findUniqueOrThrow({
        where: { id: params.queueTicketId },
        select: {
          id: true,
          status: true,
          calledAt: true,
          servedAt: true,
          number: true,
        },
      });

      return { medicalRecord, serviceOrder, ticket: updatedTicket };
    });
  }

  async nextPatientCodeInTx(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const key = 'patient_code';
    const existing = await tx.codeSequence.findUnique({ where: { key } });
    let next = 1;
    if (!existing) {
      await tx.codeSequence.create({ data: { key, lastNumber: 1 } });
    } else {
      const updated = await tx.codeSequence.update({
        where: { key },
        data: { lastNumber: { increment: 1 } },
      });
      next = updated.lastNumber;
    }
    return `BN${String(next).padStart(6, '0')}`;
  }

  async nextRecordCodeInTx(tx: Prisma.TransactionClient): Promise<string> {
    const key = 'record_code';
    const existing = await tx.codeSequence.findUnique({ where: { key } });
    let next = 1;
    if (!existing) {
      await tx.codeSequence.create({ data: { key, lastNumber: 1 } });
    } else {
      const updated = await tx.codeSequence.update({
        where: { key },
        data: { lastNumber: { increment: 1 } },
      });
      next = updated.lastNumber;
    }
    return `HS${String(next).padStart(6, '0')}`;
  }

  async nextEmergencyAnonymousStt(legalDate: string): Promise<number> {
    const key = `emergency_anonymous_${legalDate}`;
    return prisma.$transaction(async (tx) => {
      const existing = await tx.codeSequence.findUnique({ where: { key } });
      if (!existing) {
        await tx.codeSequence.create({ data: { key, lastNumber: 1 } });
        return 1;
      }
      const updated = await tx.codeSequence.update({
        where: { key },
        data: { lastNumber: { increment: 1 } },
      });
      return updated.lastNumber;
    });
  }

  /**
   * Cấp cứu: patient vô danh + record isEmergency — không queue ticket.
   */
  async createEmergencyAdmission(params: {
    fullName: string;
    gender: 'male' | 'female';
    dateOfBirth: Date;
    doctorId: string;
    departmentId: string | null;
    emergencyReason: string;
    chiefComplaint?: string;
    consultationServiceId: string;
    fee: Prisma.Decimal | number | string;
  }): Promise<{
    patient: {
      id: string;
      patientCode: string;
      fullName: string;
      gender: 'male' | 'female';
      isEmergencyBypass: boolean;
      version: number;
    };
    medicalRecord: MedicalRecord;
    serviceOrder: ServiceOrder;
  }> {
    const now = toVietnamDbDateTime();

    return prisma.$transaction(async (tx) => {
      const patientCode = await this.nextPatientCodeInTx(tx);
      const recordCode = await this.nextRecordCodeInTx(tx);

      const patient = await tx.patient.create({
        data: {
          id: randomUUID(),
          patientCode,
          fullName: params.fullName,
          dateOfBirth: params.dateOfBirth,
          gender: params.gender,
          phoneNumber: null,
          identityCardNumber: null,
          isEmergencyBypass: true,
          privacyNoticeAcceptedAt: null,
          version: 1,
          createdAt: now,
          updatedAt: now,
        },
        select: {
          id: true,
          patientCode: true,
          fullName: true,
          gender: true,
          isEmergencyBypass: true,
          version: true,
        },
      });

      const medicalRecord = await tx.medicalRecord.create({
        data: {
          id: randomUUID(),
          recordCode,
          patientId: patient.id,
          doctorId: params.doctorId,
          departmentId: params.departmentId,
          status: 'open',
          isEmergency: true,
          emergencyReason: params.emergencyReason,
          chiefComplaint: params.chiefComplaint ?? params.emergencyReason,
          version: 1,
          createdAt: now,
          updatedAt: now,
        },
      });

      const serviceOrder = await tx.serviceOrder.create({
        data: {
          id: randomUUID(),
          recordId: medicalRecord.id,
          serviceCatalogId: params.consultationServiceId,
          fee: params.fee,
          status: 'waiting',
          createdAt: now,
        },
      });

      return { patient, medicalRecord, serviceOrder };
    });
  }
}

export const receptionRepository = new ReceptionRepository();
