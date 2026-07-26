import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { ApiError, httpClient } from '../src/shared/api-client';

const originalAdapter = httpClient.defaults.adapter;

afterEach(() => {
  httpClient.defaults.adapter = originalAdapter;
});

describe('httpClient', () => {
  it('normalizes backend 403 envelopes into the shared ApiError class', async () => {
    httpClient.defaults.adapter = async (config) => Promise.reject({
      config,
      isAxiosError: true,
      response: {
        config,
        data: {
          error: {
            code: 'FORBIDDEN_ACCESS',
            message: 'Bạn không có quyền thao tác trên hồ sơ này.',
          },
        },
        headers: {},
        status: 403,
        statusText: 'Forbidden',
      },
    });

    await assert.rejects(
      httpClient.post('/medical-records/record-1/vital-signs', {}),
      (error) => {
        assert.equal(error instanceof ApiError, true);
        if (!(error instanceof ApiError)) return false;

        assert.equal(error.code, 'FORBIDDEN_ACCESS');
        assert.equal(error.message, 'Bạn không có quyền thao tác trên hồ sơ này.');
        assert.equal(error.status, 403);

        return true;
      },
    );
  });

  it('maps legacy error.details into field errors', async () => {
    httpClient.defaults.adapter = async (config) => Promise.reject({
      config,
      isAxiosError: true,
      response: {
        config,
        data: {
          error: {
            code: 'VALIDATION_ERROR',
            details: [
              { field: 'pulse', message: 'Mạch không hợp lệ' },
              { field: 'spo2' },
            ],
            message: 'Dữ liệu không hợp lệ',
          },
        },
        headers: {},
        status: 422,
        statusText: 'Unprocessable Entity',
      },
    });

    await assert.rejects(
      httpClient.post('/medical-records/record-1/vital-signs', {}),
      (error) => {
        assert.equal(error instanceof ApiError, true);
        if (!(error instanceof ApiError)) return false;

        assert.deepEqual(error.fields, {
          pulse: ['Mạch không hợp lệ'],
          spo2: ['Dữ liệu không hợp lệ'],
        });

        return true;
      },
    );
  });
});
