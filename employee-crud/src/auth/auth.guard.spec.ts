import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard, RequestWithUser } from './auth.guard';
import { AuthService, UserSession } from './auth.service';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: Partial<AuthService>;

  const mockSession: UserSession = {
    sessionId: 'test-session-id',
    userId: 'emp123',
    name: 'testuser',
    email: 'test@example.com',
    department: 'Engineering',
    lastLoginAt: '2026-10-28T00:00:00.000Z',
    loggedInAt: '2026-10-28T00:00:00.000Z',
  };

  beforeEach(async () => {
    authService = {
      validateSession: jest.fn().mockImplementation((token: string) => {
        if (token === 'valid-token') return Promise.resolve(mockSession);
        return Promise.resolve(null);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthGuard, { provide: AuthService, useValue: authService }],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  const createMockContext = (
    headers: Record<string, string | undefined>,
  ): ExecutionContext => {
    const request = { headers } as unknown as RequestWithUser;
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow request with valid Bearer token', async () => {
    const context = createMockContext({ authorization: 'Bearer valid-token' });
    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
  });

  it('should allow request with valid x-session-id', async () => {
    const context = createMockContext({ 'x-session-id': 'valid-token' });
    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
  });

  it('should throw UnauthorizedException when token is missing', async () => {
    const context = createMockContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when session is invalid or expired', async () => {
    const context = createMockContext({
      authorization: 'Bearer expired-token',
    });
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
