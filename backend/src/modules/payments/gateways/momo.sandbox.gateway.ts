import { request as httpsRequest } from 'node:https';

import { config } from '../../../config/unifiedConfig';
import { logger } from '../../../core/logger/logger';
import {
  buildMomoCreateRawSignature,
  buildMomoQueryRawSignature,
  generateMomoSignature,
  verifyMomoCreateStyleSignature,
} from './momo.signature';

/**
 * payWithMethod: hiện đủ phương thức (ví MoMo, ATM, Visa/Mastercard…).
 * captureWallet: chỉ ví MoMo / QR.
 * Cấu hình qua config.momo.requestType (env MOMO_REQUEST_TYPE).
 */

export type MomoCreatePaymentInput = {
  orderId: string;
  amountVndInteger: number;
  orderInfo: string;
  redirectUrl: string;
  ipnUrl: string;
  extraData?: string;
  requestId: string;
  autoCapture?: boolean;
  lang?: 'vi' | 'en';
};

export type MomoCreatePaymentResult = {
  success: true;
  payUrl: string;
  /**
   * Payload EMVCo / deeplink data từ Momo — dùng gen QR trên trang merchant.
   * Không phải URL ảnh; FE cần thư viện/API gen QR từ chuỗi này.
   * @see https://developers.momo.vn/v3/docs/payment/api/wallet/onetime/
   */
  qrCodeUrl: string | null;
  /** Deeplink mở app MoMo (nếu sandbox/prod trả về). */
  deeplink: string | null;
  requestId: string;
  orderId: string;
  resultCode: number;
  message: string;
};

export type MomoQueryResult = {
  transId?: string | number;
  resultCode: number;
  message?: string;
  isSuccess: boolean;
};

export type MomoIpnParseResult = {
  valid: boolean;
  isSuccess?: boolean;
  resultCode?: number;
  message: string;
  data?: {
    orderId: string;
    amount: number;
    requestId?: string;
    transId?: string | number;
    responseTime?: unknown;
    extraData?: string;
  };
};

/**
 * Gateway Momo Sandbox — port logic doc-momo sang TypeScript.
 * Không log secretKey.
 */
export class MomoSandboxGateway {
  private getHostname(): string {
    return config.momo.environment === 'production'
      ? 'payment.momo.vn'
      : 'test-payment.momo.vn';
  }

  private getRequestType(): string {
    // payWithMethod: ví MoMo + quét QR + ATM + Visa/MC (đủ lựa chọn).
    // captureWallet: chủ yếu ví/QR.
    const t = config.momo.requestType?.trim();
    return t && t.length > 0 ? t : 'payWithMethod';
  }

  /**
   * Tạo yêu cầu thanh toán Momo.
   * Mặc định payWithMethod → trang sandbox có quét mã + ATM + Visa + ví.
   */
  async createPayment(input: MomoCreatePaymentInput): Promise<MomoCreatePaymentResult> {
    if (config.momo.useMock) {
      const mockPayUrl = `https://test-payment.momo.vn/pay/mock/${input.orderId}`;
      // Mock: qrCodeUrl = payload quét được (dùng chính payUrl để FE gen QR hiển thị).
      return {
        success: true,
        payUrl: mockPayUrl,
        qrCodeUrl: mockPayUrl,
        deeplink: null,
        requestId: input.requestId,
        orderId: input.orderId,
        resultCode: 0,
        message: 'mock success',
      };
    }

    const requestType = this.getRequestType();
    const extraData = input.extraData ?? '';
    const amount = Math.floor(input.amountVndInteger);
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const rawSignature = buildMomoCreateRawSignature({
      accessKey: config.momo.accessKey,
      amount,
      extraData,
      ipnUrl: input.ipnUrl,
      orderId: input.orderId,
      orderInfo: input.orderInfo,
      partnerCode: config.momo.partnerCode,
      redirectUrl: input.redirectUrl,
      requestId: input.requestId,
      requestType,
    });

    const signature = generateMomoSignature(rawSignature, config.momo.secretKey);

    const requestBody = JSON.stringify({
      partnerCode: config.momo.partnerCode,
      partnerName: config.momo.partnerName,
      storeId: config.momo.storeId,
      requestId: input.requestId,
      amount,
      orderId: input.orderId,
      orderInfo: input.orderInfo,
      redirectUrl: input.redirectUrl,
      ipnUrl: input.ipnUrl,
      lang: input.lang ?? 'vi',
      requestType,
      autoCapture: input.autoCapture ?? true,
      extraData,
      signature,
    });

    const response = await this.postJson('/v2/gateway/api/create', requestBody);

    if (Number(response.resultCode) !== 0) {
      logger.warn(
        {
          resultCode: response.resultCode,
          message: response.message,
          orderId: input.orderId,
          requestType,
        },
        'momo.create.rejected',
      );
      throw new Error(
        `Momo API error: [${response.resultCode}] ${response.message || 'Unknown error'}`,
      );
    }

    const payUrl = response.payUrl !== undefined && response.payUrl !== null
      ? String(response.payUrl)
      : '';
    // MoMo docs: qrCodeUrl = data gen QR (không phải ảnh); optional theo môi trường/quyền.
    const rawQr =
      response.qrCodeUrl !== undefined && response.qrCodeUrl !== null
        ? String(response.qrCodeUrl).trim()
        : '';
    const rawDeeplink =
      response.deeplink !== undefined && response.deeplink !== null
        ? String(response.deeplink).trim()
        : '';

    logger.info(
      {
        resultCode: response.resultCode,
        orderId: input.orderId,
        hasPayUrl: Boolean(payUrl),
        hasQrCodeUrl: Boolean(rawQr),
        hasDeeplink: Boolean(rawDeeplink),
        requestType,
      },
      'momo.create.ok',
    );

    return {
      success: true,
      payUrl,
      qrCodeUrl: rawQr.length > 0 ? rawQr : null,
      deeplink: rawDeeplink.length > 0 ? rawDeeplink : null,
      requestId: input.requestId,
      orderId: input.orderId,
      resultCode: Number(response.resultCode),
      message: String(response.message ?? ''),
    };
  }

  /**
   * Query trạng thái giao dịch trên Momo.
   */
  async queryTransaction(orderId: string, requestId: string): Promise<MomoQueryResult> {
    if (config.momo.useMock) {
      return { resultCode: 0, message: 'mock', isSuccess: true, transId: 'MOCK-TX' };
    }

    const rawSignature = buildMomoQueryRawSignature({
      accessKey: config.momo.accessKey,
      orderId,
      partnerCode: config.momo.partnerCode,
      requestId,
    });
    const signature = generateMomoSignature(rawSignature, config.momo.secretKey);

    const body = JSON.stringify({
      partnerCode: config.momo.partnerCode,
      requestId,
      orderId,
      signature,
      lang: 'vi',
    });

    const response = await this.postJson('/v2/gateway/api/query', body);
    const resultCode = Number(response.resultCode);
    return {
      transId: response.transId as string | number | undefined,
      resultCode,
      message: response.message as string | undefined,
      isSuccess: resultCode === 0,
    };
  }

  /**
   * Parse + verify IPN (create-style signature từ doc-momo; mock bypass verify).
   */
  handleIpn(requestBody: Record<string, unknown>): MomoIpnParseResult {
    try {
      const signature = String(requestBody.signature ?? '');
      const data = { ...requestBody };
      delete data.signature;

      if (!config.momo.useMock) {
        const ok = verifyMomoCreateStyleSignature(
          data,
          signature,
          config.momo.accessKey,
          config.momo.secretKey,
        );
        if (!ok) {
          return { valid: false, message: 'Invalid signature' };
        }
      }

      if (String(data.partnerCode ?? '') !== config.momo.partnerCode && !config.momo.useMock) {
        return { valid: false, message: 'Invalid partner code' };
      }

      const resultCode = Number(data.resultCode);
      const isSuccess = resultCode === 0;

      return {
        valid: true,
        isSuccess,
        resultCode,
        message:
          String(data.message ?? '') || (isSuccess ? 'Payment successful' : 'Payment failed'),
        data: {
          orderId: String(data.orderId ?? ''),
          amount: Number(data.amount),
          requestId: data.requestId !== undefined ? String(data.requestId) : undefined,
          transId: data.transId as string | number | undefined,
          responseTime: data.responseTime,
          extraData: data.extraData !== undefined ? String(data.extraData) : undefined,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'IPN processing error';
      return { valid: false, message };
    }
  }

  private postJson(path: string, requestBody: string): Promise<Record<string, unknown>> {
    const hostname = this.getHostname();

    return new Promise((resolve, reject) => {
      const req = httpsRequest(
        {
          hostname,
          port: 443,
          path,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk: Buffer | string) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              resolve(JSON.parse(data) as Record<string, unknown>);
            } catch (error) {
              const msg = error instanceof Error ? error.message : 'parse error';
              reject(new Error(`Failed to parse Momo response: ${msg}`));
            }
          });
        },
      );

      req.on('error', (error) => {
        logger.error({ err: error.message, path }, 'momo.gateway.request_failed');
        reject(new Error(`Momo request failed: ${error.message}`));
      });

      req.write(requestBody);
      req.end();
    });
  }
}

export const momoSandboxGateway = new MomoSandboxGateway();
