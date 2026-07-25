import { EventEmitter } from 'node:events';

import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  loginRateLimiter,
  resetLoginRateLimiterForTests,
} from '../../src/modules/identity/loginRateLimiter';

// Tạo request Express tối thiểu để middleware đọc IP và username đăng nhập.
const createRequest = (username: string, ip = '127.0.0.1') =>
  ({
    body: {
      username,
    },
    ip,
  }) as Request;

// Tạo response giả có sự kiện finish để test cách middleware ghi nhận kết quả sau handler.
const createResponse = () => {
  const response = new EventEmitter() as Response &
    EventEmitter & {
      setHeader: (name: string, value: number | string) => void;
      statusCode: number;
    };
  response.setHeader = () => response;
  response.statusCode = 200;
  return response;
};

// Chạy middleware và trả lỗi được truyền vào next để testcase kiểm tra trạng thái chặn.
const runLimiter = (response: Response, request = createRequest('it.tech.dev')) => {
  let nextError: unknown;
  const next: NextFunction = (error?: unknown) => {
    nextError = error;
  };

  loginRateLimiter(request, response, next);

  return nextError;
};

describe('loginRateLimiter', () => {
  beforeEach(() => {
    resetLoginRateLimiterForTests();
  });

  it('does not count successful login requests against the brute-force limit', () => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const response = createResponse();
      const nextError = runLimiter(response);

      response.statusCode = 200;
      response.emit('finish');

      expect(nextError).toBeUndefined();
    }
  });

  it('blocks the next request after too many failed credential checks', () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = createResponse();
      const nextError = runLimiter(response);

      response.statusCode = 401;
      response.emit('finish');

      expect(nextError).toBeUndefined();
    }

    const blockedResponse = createResponse();

    expect(runLimiter(blockedResponse)).toMatchObject({
      code: 'LOGIN_RATE_LIMITED',
      status: 429,
    });
  });

  it('clears previous failed attempts after a successful login', () => {
    const request = createRequest('it.tech.dev');

    for (let attempt = 0; attempt < 9; attempt += 1) {
      const response = createResponse();
      const nextError = runLimiter(response, request);

      response.statusCode = 401;
      response.emit('finish');

      expect(nextError).toBeUndefined();
    }

    const successfulResponse = createResponse();
    const successfulNextError = runLimiter(successfulResponse, request);

    successfulResponse.statusCode = 200;
    successfulResponse.emit('finish');

    expect(successfulNextError).toBeUndefined();

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = createResponse();
      const nextError = runLimiter(response, request);

      response.statusCode = 401;
      response.emit('finish');

      expect(nextError).toBeUndefined();
    }
  });

  it('normalizes username case and surrounding spaces for the same rate-limit bucket', () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = createResponse();
      const nextError = runLimiter(response, createRequest(' IT.Tech.Dev '));

      response.statusCode = 401;
      response.emit('finish');

      expect(nextError).toBeUndefined();
    }

    const blockedResponse = createResponse();

    expect(runLimiter(blockedResponse, createRequest('it.tech.dev'))).toMatchObject({
      code: 'LOGIN_RATE_LIMITED',
      status: 429,
    });
  });

  it('keeps attempts isolated across different usernames', () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = createResponse();
      const nextError = runLimiter(response, createRequest('it.tech.dev'));

      response.statusCode = 401;
      response.emit('finish');

      expect(nextError).toBeUndefined();
    }

    const otherUserResponse = createResponse();

    expect(runLimiter(otherUserResponse, createRequest('doctor.one'))).toBeUndefined();
  });
});
