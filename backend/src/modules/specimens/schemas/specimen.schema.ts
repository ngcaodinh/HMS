import { z } from 'zod';

export const createSpecimenSchema = z.object({
  recordId: z.string().min(1, 'recordId là bắt buộc'),
  patientCode: z.string().min(1, 'patientCode là bắt buộc'),
  patientName: z.string().min(1, 'patientName là bắt buộc'),
  departmentName: z.string().min(1, 'departmentName là bắt buộc'),
  specimenCode: z.string().min(1, 'specimenCode là bắt buộc'),
  specimenType: z.string().min(1, 'specimenType là bắt buộc'),
  orderDescription: z.string().min(1, 'orderDescription là bắt buộc'),
  priority: z.boolean().optional().default(false),
});

export const handoffSpecimenSchema = z.object({
  labReceiverName: z.string().optional(),
});
