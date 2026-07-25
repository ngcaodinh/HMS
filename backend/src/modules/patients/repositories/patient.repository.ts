import type { Patient, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { prisma } from '../../../core/prisma/prisma';
import { parseLegalDateString, toVietnamDbDateTime } from '../../../core/time/vietnamClock';

export type CreatePatientInput = {
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  phoneNumber?: string | null;
  phoneNumberUnavailableReason?: string | null;
  identityCardNumber?: string | null;
  address?: string | null;
  healthInsuranceCode?: string | null;
  healthInsuranceExpiryDate?: string | null;
  privacyNoticeAccepted: boolean;
};

/**
 * Mask PII cho search response.
 */
export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone || phone.length < 7) {
    return phone ?? null;
  }
  return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
}

export function maskIdentityCard(cccd: string | null | undefined): string | null {
  if (!cccd || cccd.length !== 12) {
    return cccd ?? null;
  }
  return `${cccd.slice(0, 4)}****${cccd.slice(-4)}`;
}

export function maskFullName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) {
    return fullName;
  }
  const last = parts[parts.length - 1] ?? fullName;
  if (last.length <= 1) {
    return fullName;
  }
  const maskedLast = `${last.slice(0, 1)}***`;
  return [...parts.slice(0, -1), maskedLast].join(' ');
}

export class PatientRepository {
  async nextPatientCode(): Promise<string> {
    const result = await prisma.$transaction(async (tx) => {
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
      return next;
    });
    return `BN${String(result).padStart(6, '0')}`;
  }

  async findById(patientId: string): Promise<Patient | null> {
    return prisma.patient.findUnique({ where: { id: patientId } });
  }

  async findByIdentityCard(identityCardNumber: string): Promise<Patient | null> {
    return prisma.patient.findUnique({ where: { identityCardNumber } });
  }

  async search(params: {
    fullName?: string;
    phoneNumber?: string;
    identityCardNumber?: string;
    skip: number;
    take: number;
  }): Promise<{ items: Patient[]; total: number }> {
    const where: Prisma.PatientWhereInput = {};

    if (params.identityCardNumber) {
      where.identityCardNumber = params.identityCardNumber;
    } else if (params.phoneNumber) {
      where.phoneNumber = params.phoneNumber;
    } else if (params.fullName) {
      where.fullName = { contains: params.fullName };
    }

    const [items, total] = await prisma.$transaction([
      prisma.patient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      prisma.patient.count({ where }),
    ]);

    return { items, total };
  }

  async create(input: CreatePatientInput): Promise<Patient> {
    const patientCode = await this.nextPatientCode();
    const now = toVietnamDbDateTime();
    return prisma.patient.create({
      data: {
        id: randomUUID(),
        patientCode,
        fullName: input.fullName.trim(),
        dateOfBirth: parseLegalDateString(input.dateOfBirth),
        gender: input.gender,
        phoneNumber: input.phoneNumber ?? null,
        phoneNumberUnavailableReason: input.phoneNumberUnavailableReason ?? null,
        identityCardNumber: input.identityCardNumber ?? null,
        address: input.address ?? null,
        healthInsuranceCode: input.healthInsuranceCode ?? null,
        healthInsuranceExpiryDate: input.healthInsuranceExpiryDate
          ? parseLegalDateString(input.healthInsuranceExpiryDate)
          : null,
        privacyNoticeAcceptedAt: input.privacyNoticeAccepted ? now : null,
        isEmergencyBypass: false,
        version: 1,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async findOpenEmergencyRecord(patientId: string) {
    return prisma.medicalRecord.findFirst({
      where: {
        patientId,
        isEmergency: true,
        status: { not: 'closed' },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        isEmergency: true,
        recordCode: true,
      },
    });
  }

  async normalizeEmergencyIdentity(params: {
    patientId: string;
    expectedVersion: number;
    fullName: string;
    dateOfBirth: string;
    gender: 'male' | 'female';
    phoneNumber?: string | null;
    phoneNumberUnavailableReason?: string | null;
    identityCardNumber?: string | null;
    address?: string | null;
  }) {
    const now = toVietnamDbDateTime();
    const updated = await prisma.patient.updateMany({
      where: {
        id: params.patientId,
        version: params.expectedVersion,
        isEmergencyBypass: true,
      },
      data: {
        fullName: params.fullName.trim(),
        dateOfBirth: parseLegalDateString(params.dateOfBirth),
        gender: params.gender,
        phoneNumber: params.phoneNumber ?? null,
        phoneNumberUnavailableReason: params.phoneNumberUnavailableReason ?? null,
        identityCardNumber: params.identityCardNumber ?? null,
        address: params.address ?? null,
        isEmergencyBypass: false,
        privacyNoticeAcceptedAt: now,
        updatedAt: now,
        version: { increment: 1 },
      },
    });

    if (updated.count === 0) {
      return null;
    }

    return prisma.patient.findUniqueOrThrow({
      where: { id: params.patientId },
      select: {
        id: true,
        fullName: true,
        isEmergencyBypass: true,
        version: true,
        patientCode: true,
      },
    });
  }
}

export const patientRepository = new PatientRepository();
