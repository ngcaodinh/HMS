import { Router, type NextFunction, type Request, type Response } from 'express';
import { InpatientController } from './inpatient.controller';
import { asyncHandler } from '../../core/middlewares/async-handler';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';

/**
 * @route   /api/v1/inpatient/*, /api/v1/medical-records/*, /api/v1/patients/*
 * @desc    Điều phối các API tiếp nhận, giường bệnh, y lệnh, sinh hiệu và ra viện nội trú.
 * @access  Private (authenticate và permission riêng theo từng endpoint)
 */
const router = Router();

router.use(authenticate);

// Chỉ lane nội trú xử lý payload có ticketId; payload khám ngoại trú được chuyển sang EMR router chuẩn.
export const shouldHandleInpatientVitalSignsRoute = (body: unknown): boolean =>
  typeof body === 'object' &&
  body !== null &&
  typeof (body as { ticketId?: unknown }).ticketId === 'string' &&
  (body as { ticketId: string }).ticketId.trim().length > 0;

/**
 * Chỉ cho payload có `ticketId` đi vào lane nội trú; request ngoại trú được chuyển sang
 * router medical-records để giữ đúng ranh giới nghiệp vụ giữa hai luồng ghi sinh hiệu.
 */
const routeOutpatientVitalSignsToMedicalRecordModule = (
  req: Request,
  response: Response,
  next: NextFunction,
) => {
  void response;
  if (!shouldHandleInpatientVitalSignsRoute(req.body)) return next('router');

  return next();
};

// Bảng tiếp nhận nội trú.
router.get(
  '/inpatient/admission-board',
  authorize('inpatient.read'),
  asyncHandler((req, res) => InpatientController.listInpatientAdmissionBoard(req, res)),
);

// Phân giường.
router.post(
  '/medical-records/:recordId/bed-assignments',
  authorize('bed.assign'),
  asyncHandler((req, res) => InpatientController.assignBed(req, res)),
);
router.post(
  '/medical-records/:recordId/bed-assignment-changes',
  authorize('bed.change'),
  asyncHandler((req, res) => InpatientController.changeBedAssignment(req, res)),
);

// Y lệnh điều trị.
router.post(
  '/medical-records/:recordId/treatment-orders',
  authorize('treatment_order.create'),
  asyncHandler((req, res) => InpatientController.createOrder(req, res)),
);
router.get(
  '/treatment-orders',
  authorize('treatment_order.read'),
  asyncHandler((req, res) => InpatientController.listOrders(req, res)),
);
router.post(
  '/treatment-orders/:treatmentOrderId/complete',
  authorize('treatment_order.execute'),
  asyncHandler((req, res) => InpatientController.completeTreatmentOrder(req, res)),
);
router.post(
  '/treatment-orders/:treatmentOrderId/cancel',
  authorize('treatment_order.cancel'),
  asyncHandler((req, res) => InpatientController.cancelTreatmentOrder(req, res)),
);
router.put(
  '/treatment-orders/:id/status',
  authorize('treatment_order.execute'),
  asyncHandler((req, res) => InpatientController.updateOrderStatus(req, res)),
);

// Tóm tắt ra viện và xử lý ra viện.
router.post(
  '/medical-records/:recordId/discharge-summaries',
  authorize('discharge_summary.sign'),
  asyncHandler((req, res) => InpatientController.signDischargeSummary(req, res)),
);
router.post(
  '/medical-records/:recordId/discharges',
  authorize('discharge.execute'),
  asyncHandler((req, res) => InpatientController.processDischarge(req, res)),
);

// Số thứ tự và sinh hiệu.
router.get(
  '/inpatient/vitals-queue',
  authorize('inpatient.read'),
  asyncHandler((req, res) => InpatientController.listVitalsQueue(req, res)),
);
router.post(
  '/inpatient/queue-tickets/call-next',
  authorize('queue_ticket.call'),
  asyncHandler((req, res) => InpatientController.callNextQueueTicket(req, res)),
);
router.post(
  '/inpatient/queue-tickets/:id/recall',
  authorize('queue_ticket.call'),
  asyncHandler((req, res) => InpatientController.recallQueueTicket(req, res)),
);
router.post(
  '/medical-records/:recordId/vital-signs',
  routeOutpatientVitalSignsToMedicalRecordModule,
  authorize('vital_signs.record'),
  asyncHandler((req, res) => InpatientController.recordVitalSigns(req, res)),
);

// Chuẩn hóa danh tính cấp cứu.
router.get(
  '/inpatient/emergency-unidentified-patients',
  authorize('inpatient.read'),
  asyncHandler((req, res) => InpatientController.listUnidentifiedEmergencyPatients(req, res)),
);
router.post(
  '/patients/:patientId/emergency-identity',
  authorize('patient_identity.standardize'),
  asyncHandler((req, res) => InpatientController.standardizeEmergencyIdentity(req, res)),
);

export const inpatientRoutes = router;
