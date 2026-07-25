import { Router } from 'express';

import { attachmentRouter } from '../modules/attachments/routes/attachment.routes';
import { authRouter } from '../modules/auth/routes/auth.routes';
import { clinicalCatalogRouter, medicalRecordRouter } from '../modules/medical-records/routes/medical-record.routes';
import { labTestTypeRouter } from '../modules/lab-tests/routes/lab-test-type.routes';
import { labTestRouter } from '../modules/lab-tests/routes/lab-test.routes';
import {
  medicineRouter,
  prescriptionRouter,
  recordPrescriptionRouter,
} from '../modules/prescriptions/routes/prescription.routes';

export const apiV1Router = Router();

apiV1Router.use('/auth', authRouter);
apiV1Router.use('/attachments', attachmentRouter);
apiV1Router.use('/medical-records', medicalRecordRouter);
apiV1Router.use('/medical-records', recordPrescriptionRouter);
apiV1Router.use('/clinical-catalogs', clinicalCatalogRouter);
apiV1Router.use('/lab-test-types', labTestTypeRouter);
apiV1Router.use('/lab-tests', labTestRouter);
apiV1Router.use('/prescriptions', prescriptionRouter);
apiV1Router.use('/medicines', medicineRouter);
