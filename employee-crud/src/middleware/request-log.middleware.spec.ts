import { RequestLogMiddleware } from './request-log.middleware';
import { Model } from 'mongoose';
import { RequestLog } from './request-log.schema';
import { Employee } from '../employee/employee.schema';
import { Request, Response } from 'express';
import { RedisService } from '../auth/redis.service';

describe('RequestLogMiddleware', () => {
  let middleware: RequestLogMiddleware;
  let mockModel: { create: jest.Mock };
  let mockEmployeeModel: { findOne: jest.Mock };
  let mockRedisService: Partial<RedisService>;

  beforeEach(() => {
    mockModel = {
      create: jest.fn().mockReturnValue(Promise.resolve({})),
    };
    mockEmployeeModel = {
      findOne: jest
        .fn()
        .mockImplementation(
          (query: { $or: Array<{ email?: string; name?: string }> }) => {
            const identifier = query.$or[0]?.email;
            if (identifier === 'returning@example.com') {
              return Promise.resolve({
                email: 'returning@example.com',
                lastLoginAt: '2026-10-27T08:00:00.000Z',
              });
            }
            return Promise.resolve(null);
          },
        ),
    };
    mockRedisService = {
      getSession: jest.fn().mockImplementation((token: string) => {
        if (token === 'active-session-token') {
          return Promise.resolve({
            sessionId: 'active-session-token',
            userId: 'emp123',
            name: 'testuser',
            email: 'test@example.com',
            lastLoginAt: '2026-10-27T08:00:00.000Z',
            loggedInAt: '2026-10-27T08:00:00.000Z',
          });
        }
        return Promise.resolve(null);
      }),
    };
    middleware = new RequestLogMiddleware(
      mockModel as unknown as Model<RequestLog>,
      mockEmployeeModel as unknown as Model<Employee>,
      mockRedisService as RedisService,
    );
  });

  it('should capture headers and call next()', async () => {
    const req = {
      headers: {
        'api-key': 'test-key',
        'app-type': 'mobile',
        'app-version': '1.2.0',
        app: 'employee-portal',
        last_login_at: '2026-10-27T10:00:00Z',
      },
      originalUrl: '/employee',
      method: 'GET',
    } as unknown as Request;
    const res = {} as Response;
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(mockModel.create).toHaveBeenCalledWith({
      apiKey: 'test-key',
      appType: 'mobile',
      appVersion: '1.2.0',
      app: 'employee-portal',
      lastLoginAt: '2026-10-27T10:00:00Z',
      endpoint: '/employee',
      method: 'GET',
    });
    expect(next).toHaveBeenCalled();
  });

  it('should dynamically insert lastLoginAt from backend session if header missing', async () => {
    const req = {
      headers: {
        'api-key': 'test-key',
        authorization: 'Bearer active-session-token',
      },
      originalUrl: '/employee',
      method: 'GET',
    } as unknown as Request;
    const res = {} as Response;
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(mockModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'test-key',
        lastLoginAt: '2026-10-27T08:00:00.000Z',
        endpoint: '/employee',
        method: 'GET',
      }),
    );
    expect(next).toHaveBeenCalled();
  });

  it('should dynamically insert previous login timestamp on /auth/login for returning user', async () => {
    const req = {
      headers: {
        'api-key': 'test-key',
      },
      body: {
        email: 'returning@example.com',
      },
      originalUrl: '/auth/login',
      method: 'POST',
    } as unknown as Request;
    const res = {} as Response;
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(mockModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'test-key',
        endpoint: '/auth/login',
        method: 'POST',
        lastLoginAt: '2026-10-27T08:00:00.000Z',
      }),
    );
    expect(next).toHaveBeenCalled();
  });

  it('should dynamically insert current timestamp for first-time login if no previous login exists', async () => {
    const req = {
      headers: {
        'api-key': 'test-key',
      },
      originalUrl: '/auth/login',
      method: 'POST',
    } as unknown as Request;
    const res = {} as Response;
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(mockModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'test-key',
        endpoint: '/auth/login',
        method: 'POST',
      }),
    );
    const firstCallArgs = mockModel.create.mock.calls[0] as unknown[];
    const firstPayload = firstCallArgs[0] as { lastLoginAt?: string };
    expect(typeof firstPayload?.lastLoginAt).toBe('string');
    expect(next).toHaveBeenCalled();
  });

  it('should ignore "null" string header and dynamically insert timestamp', async () => {
    const req = {
      headers: {
        'api-key': 'test-key',
        last_login_at: 'null',
      },
      originalUrl: '/auth/logout',
      method: 'POST',
    } as unknown as Request;
    const res = {} as Response;
    const next = jest.fn();

    await middleware.use(req, res, next);

    const callArgs = mockModel.create.mock.calls[0] as unknown[];
    const payload = callArgs[0] as { lastLoginAt?: string };
    expect(typeof payload?.lastLoginAt).toBe('string');
    expect(payload?.lastLoginAt).not.toBe('null');
    expect(next).toHaveBeenCalled();
  });
});
