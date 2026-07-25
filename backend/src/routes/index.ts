import { Router } from 'express';

import { invoiceRouter } from '../modules/invoices/routes/invoice.routes';
import { patientRouter } from '../modules/patients/routes/patient.routes';
import { paymentRouter } from '../modules/payments/routes/payment.routes';
import { queueRouter } from '../modules/queue/routes/queue.routes';
import { receptionRouter } from '../modules/reception/routes/reception.routes';

// Side-effect: wire BillingSettlementPort + BillingPaymentIntentPort
import '../modules/invoices/services/invoice.service';

/**
 * API v1 root router.
 */
export const apiV1Router = Router();

apiV1Router.use(queueRouter);
apiV1Router.use(patientRouter);
apiV1Router.use(receptionRouter);
apiV1Router.use(invoiceRouter);
apiV1Router.use(paymentRouter);
