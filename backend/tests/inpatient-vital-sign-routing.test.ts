import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';

import {
  inpatientRoutes,
  shouldHandleInpatientVitalSignsRoute,
} from '../src/modules/inpatient/inpatient.routes';
import { signAccessToken } from '../src/modules/auth/services/jwt.service';

describe('inpatient vital-sign route splitter', () => {
  it('lets outpatient doctor payloads fall through to the medical-records module', () => {
    expect(shouldHandleInpatientVitalSignsRoute({
      bloodPressureDiastolic: 80,
      bloodPressureSystolic: 120,
      pulse: 72,
      spo2: 98,
    })).toBe(false);
  });

  it('keeps inpatient nurse payloads with a called ticket on the inpatient route', () => {
    expect(shouldHandleInpatientVitalSignsRoute({
      bloodPressureDiastolic: 80,
      bloodPressureSystolic: 120,
      pulse: 72,
      spo2: 98,
      ticketId: 'ticket-1',
    })).toBe(true);
  });

  it('does not treat empty or non-string ticketId as an inpatient queue write', () => {
    expect(shouldHandleInpatientVitalSignsRoute({ ticketId: '' })).toBe(false);
    expect(shouldHandleInpatientVitalSignsRoute({ ticketId: 123 })).toBe(false);
    expect(shouldHandleInpatientVitalSignsRoute(null)).toBe(false);
  });

  it('falls through to the EMR route for outpatient doctor vital-sign payloads', async () => {
    const app = express();
    const { accessToken } = signAccessToken({ roleCodes: ['doctor'], userId: 'doctor-1' });

    app.use(express.json());
    app.use(inpatientRoutes);
    app.post('/medical-records/:recordId/vital-signs', (_req, res) => {
      res.status(201).json({ data: { routedTo: 'medical-records' } });
    });

    const response = await request(app)
      .post('/medical-records/record-1/vital-signs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        bloodPressureDiastolic: 80,
        bloodPressureSystolic: 120,
        pulse: 72,
        spo2: 98,
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ data: { routedTo: 'medical-records' } });
  });
});
