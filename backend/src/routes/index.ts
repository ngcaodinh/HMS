import { Router } from 'express';

import { attachmentRouter } from '../modules/attachments/routes/attachment.routes';
import { authRouter } from '../modules/auth/routes/auth.routes';
import { bedRoutes } from '../modules/beds/bed.routes';
import { inpatientRoutes } from '../modules/inpatient/inpatient.routes';
import { invoiceRouter } from '../modules/invoices/routes/invoice.routes';
import { labTestTypeRouter } from '../modules/lab-tests/routes/lab-test-type.routes';
import { labTestRouter } from '../modules/lab-tests/routes/lab-test.routes';
import {
  clinicalCatalogRouter,
  medicalRecordRouter,
} from '../modules/medical-records/routes/medical-record.routes';
import { patientRouter } from '../modules/patients/routes/patient.routes';
import { paymentRouter } from '../modules/payments/routes/payment.routes';
import {
  medicineRouter,
  prescriptionRouter,
  recordPrescriptionRouter,
} from '../modules/prescriptions/routes/prescription.routes';
import { queueRouter } from '../modules/queue/routes/queue.routes';
import { receptionRouter } from '../modules/reception/routes/reception.routes';
import { specimenRoutes } from '../modules/specimens/specimen.routes';

// Side-effect: wire BillingSettlementPort + BillingPaymentIntentPort.
import '../modules/invoices/services/invoice.service';

/**
 * Router gốc API v1, gom các lane chức năng vào cùng namespace /api/v1.
 */
export const apiV1Router = Router();

apiV1Router.use(queueRouter);
apiV1Router.use(patientRouter);
apiV1Router.use(receptionRouter);
apiV1Router.use(invoiceRouter);
apiV1Router.use(paymentRouter);
apiV1Router.use('/beds', bedRoutes);
apiV1Router.use(inpatientRoutes);
apiV1Router.use(specimenRoutes);
apiV1Router.use('/auth', authRouter);
apiV1Router.use('/attachments', attachmentRouter);
apiV1Router.use('/medical-records', medicalRecordRouter);
apiV1Router.use('/medical-records', recordPrescriptionRouter);
apiV1Router.use('/clinical-catalogs', clinicalCatalogRouter);
apiV1Router.use('/lab-test-types', labTestTypeRouter);
apiV1Router.use('/lab-tests', labTestRouter);
apiV1Router.use('/prescriptions', prescriptionRouter);
apiV1Router.use('/medicines', medicineRouter);
