import { describe, expect, it } from 'vitest';

import {
  buildMomoCreateRawSignature,
  generateMomoSignature,
} from '../../src/modules/payments/gateways/momo.signature';

describe('momo.signature (doc-momo port)', () => {
  it('buildMomoCreateRawSignature giữ thứ tự field cố định', () => {
    const raw = buildMomoCreateRawSignature({
      accessKey: 'access',
      amount: 20000,
      extraData: '',
      ipnUrl: 'https://example.com/ipn',
      orderId: 'HMS-ORDER-1',
      orderInfo: 'Thanh toan',
      partnerCode: 'MOMO',
      redirectUrl: 'https://example.com/return',
      requestId: 'req-1',
      requestType: 'payWithMethod',
    });

    expect(raw).toBe(
      [
        'accessKey=access',
        'amount=20000',
        'extraData=',
        'ipnUrl=https://example.com/ipn',
        'orderId=HMS-ORDER-1',
        'orderInfo=Thanh toan',
        'partnerCode=MOMO',
        'redirectUrl=https://example.com/return',
        'requestId=req-1',
        'requestType=payWithMethod',
      ].join('&'),
    );
  });

  it('generateMomoSignature ổn định (HMAC-SHA256 hex)', () => {
    const raw = 'accessKey=a&amount=1';
    const sig1 = generateMomoSignature(raw, 'secret');
    const sig2 = generateMomoSignature(raw, 'secret');
    expect(sig1).toBe(sig2);
    expect(sig1).toMatch(/^[a-f0-9]{64}$/);
  });
});
