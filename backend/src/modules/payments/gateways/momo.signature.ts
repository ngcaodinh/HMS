import { createHmac } from 'node:crypto';

/**
 * HMAC-SHA256 hex — port từ doc-momo/MomoPayment.js (chuẩn hóa TS).
 * @param rawSignature - Chuỗi raw đã nối field theo thứ tự Momo
 * @param secretKey - MOMO_SECRET_KEY
 * @returns Chữ ký hex
 */
export function generateMomoSignature(rawSignature: string, secretKey: string): string {
  return createHmac('sha256', secretKey).update(rawSignature).digest('hex');
}

export type MomoCreateSignatureFields = {
  accessKey: string;
  amount: string | number;
  extraData: string;
  ipnUrl: string;
  orderId: string;
  orderInfo: string;
  partnerCode: string;
  redirectUrl: string;
  requestId: string;
  requestType: string;
};

/**
 * rawSignature tạo payment — thứ tự field cố định theo doc-momo.
 */
export function buildMomoCreateRawSignature(fields: MomoCreateSignatureFields): string {
  return [
    `accessKey=${fields.accessKey}`,
    `amount=${fields.amount}`,
    `extraData=${fields.extraData}`,
    `ipnUrl=${fields.ipnUrl}`,
    `orderId=${fields.orderId}`,
    `orderInfo=${fields.orderInfo}`,
    `partnerCode=${fields.partnerCode}`,
    `redirectUrl=${fields.redirectUrl}`,
    `requestId=${fields.requestId}`,
    `requestType=${fields.requestType}`,
  ].join('&');
}

export type MomoQuerySignatureFields = {
  accessKey: string;
  orderId: string;
  partnerCode: string;
  requestId: string;
};

/**
 * rawSignature query transaction — theo doc-momo.
 */
export function buildMomoQueryRawSignature(fields: MomoQuerySignatureFields): string {
  return [
    `accessKey=${fields.accessKey}`,
    `orderId=${fields.orderId}`,
    `partnerCode=${fields.partnerCode}`,
    `requestId=${fields.requestId}`,
  ].join('&');
}

/**
 * Verify chữ ký create-style (fallback/dev).
 * IPN production có thể cần field list vendor đầy đủ — bổ sung buildMomoIpnRawSignature khi có vector test.
 */
export function verifyMomoCreateStyleSignature(
  data: Record<string, unknown>,
  signature: string,
  accessKey: string,
  secretKey: string,
): boolean {
  const raw = buildMomoCreateRawSignature({
    accessKey,
    amount: String(data.amount ?? ''),
    extraData: String(data.extraData ?? ''),
    ipnUrl: String(data.ipnUrl ?? ''),
    orderId: String(data.orderId ?? ''),
    orderInfo: String(data.orderInfo ?? ''),
    partnerCode: String(data.partnerCode ?? ''),
    redirectUrl: String(data.redirectUrl ?? ''),
    requestId: String(data.requestId ?? ''),
    requestType: String(data.requestType ?? ''),
  });
  const computed = generateMomoSignature(raw, secretKey);
  return computed === signature;
}
