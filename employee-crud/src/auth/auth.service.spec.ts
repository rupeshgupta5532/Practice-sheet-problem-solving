import { Test, TestingModule } from '@nestjs/testing';
import { AuthService, UserSession } from './auth.service';
import { RedisService } from './redis.service';
import { UnauthorizedException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Employee } from '../employee/employee.schema';
import { createHash } from 'crypto';

describe('AuthService', () => {
  let service: AuthService;
  let redisService: Partial<RedisService>;
  let employeeModel: { findOne: jest.Mock; findByIdAndUpdate: jest.Mock };

  const mockEmployee = {
    _id: 'emp123',
    name: 'testuser',
    email: 'test@example.com',
    password: createHash('sha256').update('password123').digest('hex'),
    department: 'Engineering',
    lastLoginAt: '2026-10-27T10:00:00.000Z',
  };

  const mockSession: UserSession = {
    sessionId: 'test-session-id',
    userId: 'emp123',
    name: 'testuser',
    email: 'test@example.com',
    department: 'Engineering',
    lastLoginAt: '2026-10-27T10:00:00.000Z',
    loggedInAt: '2026-10-27T10:00:00.000Z',
  };

  beforeEach(async () => {
    redisService = {
      setSession: jest.fn().mockResolvedValue(undefined),
      getSession: jest.fn().mockResolvedValue(mockSession),
      deleteSession: jest.fn().mockResolvedValue(undefined),
    };

    employeeModel = {
      findOne: jest
        .fn()
        .mockImplementation(
          (query: { $or: Array<{ email?: string; name?: string }> }) => {
            const identifier = query.$or[0]?.email;
            if (
              identifier === 'test@example.com' ||
              identifier === 'testuser'
            ) {
              return Promise.resolve(mockEmployee);
            }
            return Promise.resolve(null);
          },
        ),
      findByIdAndUpdate: jest.fn().mockResolvedValue(mockEmployee),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: RedisService, useValue: redisService },
        { provide: getModelToken(Employee.name), useValue: employeeModel },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should login with valid credentials and return a session token with previous login time', async () => {
    const result = await service.login('test@example.com', 'password123');
    expect(result).toHaveProperty('token');
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.lastLoginAt).toBe('2026-10-27T10:00:00.000Z');
    expect(redisService.setSession).toHaveBeenCalled();
    expect(employeeModel.findByIdAndUpdate).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if employee not found', async () => {
    await expect(
      service.login('unknown@example.com', 'password123'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if password incorrect', async () => {
    await expect(
      service.login('test@example.com', 'wrongpassword'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if identifier or password missing', async () => {
    await expect(service.login('', '')).rejects.toThrow(UnauthorizedException);
  });

  it('should validate session from Redis', async () => {
    const session = await service.validateSession('some-token');
    expect(session).toEqual(mockSession);
    expect(redisService.getSession).toHaveBeenCalledWith('some-token');
  });

  it('should logout and delete session from Redis', async () => {
    const result = await service.logout('some-token');
    expect(result.message).toBe('Logged out successfully');
    expect(redisService.deleteSession).toHaveBeenCalledWith('some-token');
  });
});
