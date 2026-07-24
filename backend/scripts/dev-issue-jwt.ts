import jwt from 'jsonwebtoken';
import { config } from '../src/config/unifiedConfig';

const nursePayload = {
  sub: '30303030-3030-4030-8030-303030303030',
  username: 'DDTEST01',
  role: 'nurse',
  permissions: [
    'inpatient.read',
    'bed.assign',
    'bed.change',
    'treatment_order.read',
    'treatment_order.execute',
    'treatment_order.cancel',
    'discharge_summary.sign',
    'discharge.execute',
  ],
  departmentId: '22222222-2222-4222-8222-222222222222',
};

const doctorPayload = {
  sub: '11111111-1111-4111-8111-111111111111',
  username: 'BSTEST01',
  role: 'doctor',
  permissions: [
    'inpatient.read',
    'bed.assign',
    'bed.change',
    'treatment_order.read',
    'treatment_order.create',
    'treatment_order.execute',
    'treatment_order.cancel',
    'discharge_summary.sign',
    'discharge.execute',
  ],
  departmentId: '22222222-2222-4222-8222-222222222222',
};

const nurseToken = jwt.sign(nursePayload, config.auth.jwtSecret, { expiresIn: '7d' });
const doctorToken = jwt.sign(doctorPayload, config.auth.jwtSecret, { expiresIn: '7d' });

console.log('=== DEV JWT TOKENS ===');
console.log('\n[NURSE TOKEN]:\n' + nurseToken);
console.log('\n[DOCTOR TOKEN]:\n' + doctorToken);

export { nurseToken, doctorToken };
