import type { Request, Response } from 'express';
import { BedStatus } from '@prisma/client';

import { AppError } from '../../core/errors/app-error';
import { prisma } from '../../core/prisma/prisma';
import { AuditPort } from '../../ports/audit-port';
import { RealtimePublisher } from '../../ports/realtime-publisher';
import { sendSuccess } from '../../core/http/response-envelope';

type BedRequestUser = {
  id: string;
  departmentId?: string;
};

export class BedController {
  // GET /api/v1/beds
  static async getBeds(req: Request, res: Response) {
    const requestUser = req.user as BedRequestUser | undefined;
    const departmentId = requestUser?.departmentId;
    const beds = await prisma.bed.findMany({
      where: departmentId ? { room: { departmentId } } : undefined,
      include: {
        room: true,
        bedAssignments: {
          where: { releasedAt: null },
          include: {
            record: {
              include: {
                patient: true,
                dischargeSummary: {
                  select: { signedAt: true },
                },
              },
            },
          },
        },
      },
      orderBy: [{ room: { name: 'asc' } }, { number: 'asc' }],
    });

    // Chỉ trả các trường frontend cần; không đưa toàn bộ quan hệ Prisma ra ngoài API.
    const formattedBeds = beds.map((bed) => {
      const activeAssignment = bed.bedAssignments[0];
      let patient = null;
      let diagnosis = null;
      let meta = null;
      let allergy = false;
      let status: string = bed.status;

      if (activeAssignment) {
        const record = activeAssignment.record;
        patient = record.patient.fullName;
        diagnosis = record.diagnosisText;
        const entryDate = record.createdAt.toISOString().split('T')[0];
        const age = new Date().getFullYear() - (record.patient.dateOfBirth?.getFullYear() || 0);
        const gender = record.patient.gender === 'male' ? 'Nam' : 'Nữ';
        meta = `${gender}, ${age}t • BA: ${record.recordCode} • Vào: ${entryDate}`;
        allergy = record.patient.allergies !== null && record.patient.allergies.trim() !== '';
        if (
          record.dischargeSummary?.signedAt &&
          record.dischargeSummary.signedAt >= activeAssignment.assignedAt
        ) {
          status = 'discharge';
        }
      }

      return {
        id: bed.id,
        bed: bed.number, // e.g., '101-A'
        roomName: bed.room.name,
        status,
        patient,
        diagnosis,
        meta,
        allergy,
        assignmentId: activeAssignment?.id || null,
        recordId: activeAssignment?.record?.id || null,
        recordVersion: activeAssignment?.record?.version ?? null,
      };
    });

    return sendSuccess(res, formattedBeds);
  }

  // PUT /api/v1/beds/:id/maintenance
  static async toggleMaintenance(req: Request, res: Response) {
    const { id } = req.params;
    const requestBody = req.body as { status?: BedStatus } | undefined;
    const status = requestBody?.status;

    if (status !== BedStatus.maintenance && status !== BedStatus.available) {
      throw new AppError(400, 'INVALID_STATUS', 'Status must be available or maintenance');
    }

    // Transaction bảo đảm không thể chuyển sang bảo trì khi vẫn còn bệnh nhân đang nằm.
    const updatedBed = await prisma.$transaction(async (tx) => {
      const bed = await tx.bed.findUnique({
        where: { id },
        include: { bedAssignments: { where: { releasedAt: null } } },
      });

      if (!bed) throw new AppError(404, 'BED_NOT_FOUND', 'Giường không tồn tại');

      if (status === BedStatus.maintenance && bed.bedAssignments.length > 0) {
        throw new AppError(409, 'BED_OCCUPIED', 'Không thể bảo trì giường đang có bệnh nhân');
      }

      return tx.bed.update({
        where: { id },
        data: { status },
      });
    });

    const requestUser = req.user as BedRequestUser | undefined;
    AuditPort.logActivity('BED_MAINTENANCE_TOGGLED', requestUser?.id || 'unknown', updatedBed.id, {
      status,
    });
    RealtimePublisher.publishEvent('beds', 'status_changed', { bedId: updatedBed.id, status });

    return sendSuccess(res, updatedBed);
  }
}
