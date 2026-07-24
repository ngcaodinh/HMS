import { Router } from 'express';

import { authRouter } from '../modules/auth/routes/auth.routes';
import { clinicalCatalogRouter, medicalRecordRouter } from '../modules/medical-records/routes/medical-record.routes';
import { labTestTypeRouter } from '../modules/lab-tests/routes/lab-test-type.routes';

export const apiV1Router = Router();

apiV1Router.use('/auth', authRouter);
apiV1Router.use('/medical-records', medicalRecordRouter);
apiV1Router.use('/clinical-catalogs', clinicalCatalogRouter);
apiV1Router.use('/lab-test-types', labTestTypeRouter);
