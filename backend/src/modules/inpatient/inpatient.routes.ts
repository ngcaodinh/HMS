import { Router } from 'express';
import { InpatientController } from './inpatient.controller';
import { asyncHandler } from '../../core/middlewares/asyncHandler';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';

const router = Router();

router.use(authenticate);

// Inpatient Admission Board
router.get(
  '/inpatient/admission-board',
  authorize('inpatient.read'),
  asyncHandler((req, res) => InpatientController.listInpatientAdmissionBoard(req, res))
);

// Bed Assignments
router.post(
  '/medical-records/:recordId/bed-assignments',
  authorize('bed.assign'),
  asyncHandler((req, res) => InpatientController.assignBed(req, res))
);
router.post(
  '/medical-records/:recordId/bed-assignment-changes',
  authorize('bed.change'),
  asyncHandler((req, res) => InpatientController.changeBedAssignment(req, res))
);

// Treatment Orders
router.post(
  '/medical-records/:recordId/treatment-orders',
  authorize('treatment_order.create'),
  asyncHandler((req, res) => InpatientController.createOrder(req, res))
);
router.get(
  '/treatment-orders',
  authorize('treatment_order.read'),
  asyncHandler((req, res) => InpatientController.listOrders(req, res))
);
router.post(
  '/treatment-orders/:treatmentOrderId/complete',
  authorize('treatment_order.execute'),
  asyncHandler((req, res) => InpatientController.completeTreatmentOrder(req, res))
);
router.post(
  '/treatment-orders/:treatmentOrderId/cancel',
  authorize('treatment_order.cancel'),
  asyncHandler((req, res) => InpatientController.cancelTreatmentOrder(req, res))
);
router.put(
  '/treatment-orders/:id/status',
  authorize('treatment_order.execute'),
  asyncHandler((req, res) => InpatientController.updateOrderStatus(req, res))
);

// Discharge Summaries & Discharges
router.post(
  '/medical-records/:recordId/discharge-summaries',
  authorize('discharge_summary.sign'),
  asyncHandler((req, res) => InpatientController.signDischargeSummary(req, res))
);
router.post(
  '/medical-records/:recordId/discharges',
  authorize('discharge.execute'),
  asyncHandler((req, res) => InpatientController.processDischarge(req, res))
);

// Queue Tickets & Vital Signs
router.get(
  '/inpatient/vitals-queue',
  authorize('inpatient.read'),
  asyncHandler((req, res) => InpatientController.listVitalsQueue(req, res))
);
router.post(
  '/inpatient/queue-tickets/call-next',
  authorize('queue_ticket.call'),
  asyncHandler((req, res) => InpatientController.callNextQueueTicket(req, res))
);
router.post(
  '/inpatient/queue-tickets/:id/recall',
  authorize('queue_ticket.call'),
  asyncHandler((req, res) => InpatientController.recallQueueTicket(req, res))
);
router.post(
  '/medical-records/:recordId/vital-signs',
  authorize('vital_signs.record'),
  asyncHandler((req, res) => InpatientController.recordVitalSigns(req, res))
);

// Emergency Identity Standardization
router.get(
  '/inpatient/emergency-unidentified-patients',
  authorize('inpatient.read'),
  asyncHandler((req, res) => InpatientController.listUnidentifiedEmergencyPatients(req, res))
);
router.post(
  '/patients/:patientId/emergency-identity',
  authorize('patient_identity.standardize'),
  asyncHandler((req, res) => InpatientController.standardizeEmergencyIdentity(req, res))
);

export const inpatientRoutes = router;
