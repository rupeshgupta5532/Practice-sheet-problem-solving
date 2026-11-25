import { Test, TestingModule } from '@nestjs/testing';
import { PatchVersionMiddleware } from './patch-version.middleware';
import { AuthService } from '../auth/auth.service';
import { PatchReleaseService } from './patch-release.service';
import { UpdateType } from './patch-release.entity';
import { Request, Response, NextFunction } from 'express';

describe('PatchVersionMiddleware', () => {
  let middleware: PatchVersionMiddleware;
  let authService: jest.Mocked<Partial<AuthService>>;
  let patchReleaseService: jest.Mocked<Partial<PatchReleaseService>>;

  let mockReq: Partial<Request>;
  let mockRes: {
    status: jest.Mock;
    json: jest.Mock;
    setHeader: jest.Mock;
  };
  let mockNext: NextFunction;

  beforeEach(async () => {
    authService = {
      validateSession: jest.fn(),
    };

    patchReleaseService = {
      checkUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatchVersionMiddleware,
        { provide: AuthService, useValue: authService },
        { provide: PatchReleaseService, useValue: patchReleaseService },
      ],
    }).compile();

    middleware = module.get<PatchVersionMiddleware>(PatchVersionMiddleware);

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('Route exclusions', () => {
    it('should bypass middleware for /auth routes', async () => {
      mockReq = {
        path: '/auth/login',
        headers: {},
      };

      await middleware.use(
        mockReq as Request,
        mockRes as unknown as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(authService.validateSession).not.toHaveBeenCalled();
    });

    it('should bypass middleware for /patch-releases/check', async () => {
      mockReq = {
        path: '/patch-releases/check',
        headers: {},
      };

      await middleware.use(
        mockReq as Request,
        mockRes as unknown as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(authService.validateSession).not.toHaveBeenCalled();
    });

    it('should bypass middleware for /static-documents/public', async () => {
      mockReq = {
        path: '/static-documents/public',
        headers: {},
      };

      await middleware.use(
        mockReq as Request,
        mockRes as unknown as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(authService.validateSession).not.toHaveBeenCalled();
    });
  });

  describe('Authentication pass-through for AuthGuard', () => {
    it('should call next() if no token is provided', async () => {
      mockReq = {
        path: '/employee',
        headers: {},
      };

      await middleware.use(
        mockReq as Request,
        mockRes as unknown as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(authService.validateSession).not.toHaveBeenCalled();
    });

    it('should call next() if token is invalid or expired', async () => {
      mockReq = {
        path: '/employee',
        headers: { authorization: 'Bearer invalid-token' },
      };
      (authService.validateSession as jest.Mock).mockResolvedValue(null);

      await middleware.use(
        mockReq as Request,
        mockRes as unknown as Response,
        mockNext,
      );

      expect(authService.validateSession).toHaveBeenCalledWith('invalid-token');
      expect(mockNext).toHaveBeenCalled();
      expect(patchReleaseService.checkUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Admin bypass', () => {
    it('should allow admin requests without version blocking', async () => {
      mockReq = {
        path: '/employee',
        headers: {
          authorization: 'Bearer admin-token',
          'x-app-version': '0.0.1',
        },
      };
      (authService.validateSession as jest.Mock).mockResolvedValue({
        sessionId: 'admin-token',
        userId: 'admin_1',
        name: 'Admin User',
        email: 'admin@company.com',
        lastLoginAt: new Date().toISOString(),
        loggedInAt: new Date().toISOString(),
        role: 'ADMIN',
      });

      await middleware.use(
        mockReq as Request,
        mockRes as unknown as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(patchReleaseService.checkUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Employee version enforcement', () => {
    const employeeSession = {
      sessionId: 'emp-session-123',
      userId: 'emp_1',
      name: 'John Doe',
      email: 'john@company.com',
      lastLoginAt: new Date().toISOString(),
      loggedInAt: new Date().toISOString(),
      role: 'EMPLOYEE',
    };

    it('should block outdated employee with HTTP 426 when FORCE patch exists', async () => {
      mockReq = {
        path: '/employee',
        headers: {
          authorization: 'Bearer emp-token',
          'x-app-version': '1.0.1',
        },
      };
      (authService.validateSession as jest.Mock).mockResolvedValue(
        employeeSession,
      );
      (patchReleaseService.checkUpdate as jest.Mock).mockResolvedValue({
        updateAvailable: true,
        updateRequired: true,
        updateType: UpdateType.FORCE,
        currentVersion: '1.0.1',
        minimumRequiredVersion: '1.0.2',
        latestVersion: '1.0.2',
      });

      await middleware.use(
        mockReq as Request,
        mockRes as unknown as Response,
        mockNext,
      );

      expect(patchReleaseService.checkUpdate).toHaveBeenCalledWith(
        '1.0.1',
        'ALL',
      );
      expect(mockRes.status).toHaveBeenCalledWith(426);
      expect(mockRes.json).toHaveBeenCalledWith({
        statusCode: 426,
        message: 'Application update required.',
        updateRequired: true,
        updateType: 'FORCE',
        currentVersion: '1.0.1',
        requiredVersion: '1.0.2',
        latestVersion: '1.0.2',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should block employee when version header is missing and FORCE patch exists', async () => {
      mockReq = {
        path: '/employee',
        headers: {
          authorization: 'Bearer emp-token',
        },
      };
      (authService.validateSession as jest.Mock).mockResolvedValue(
        employeeSession,
      );
      (patchReleaseService.checkUpdate as jest.Mock).mockResolvedValue({
        updateAvailable: true,
        updateRequired: true,
        updateType: UpdateType.FORCE,
        currentVersion: '0.0.0',
        minimumRequiredVersion: '1.0.0',
        latestVersion: '1.0.0',
      });

      await middleware.use(
        mockReq as Request,
        mockRes as unknown as Response,
        mockNext,
      );

      expect(patchReleaseService.checkUpdate).toHaveBeenCalledWith(
        '0.0.0',
        'ALL',
      );
      expect(mockRes.status).toHaveBeenCalledWith(426);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow employee and attach headers when newer patch is OPTIONAL', async () => {
      mockReq = {
        path: '/employee',
        headers: {
          authorization: 'Bearer emp-token',
          'x-app-version': '1.0.0',
        },
      };
      (authService.validateSession as jest.Mock).mockResolvedValue(
        employeeSession,
      );
      (patchReleaseService.checkUpdate as jest.Mock).mockResolvedValue({
        updateAvailable: true,
        updateRequired: false,
        updateType: UpdateType.OPTIONAL,
        currentVersion: '1.0.0',
        latestVersion: '1.1.0',
      });

      await middleware.use(
        mockReq as Request,
        mockRes as unknown as Response,
        mockNext,
      );

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'X-Update-Available',
        'true',
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'X-Latest-Version',
        '1.1.0',
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'X-Update-Type',
        'OPTIONAL',
      );
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow employee when version is up to date', async () => {
      mockReq = {
        path: '/employee',
        headers: {
          authorization: 'Bearer emp-token',
          'x-app-version': '1.0.2',
        },
      };
      (authService.validateSession as jest.Mock).mockResolvedValue(
        employeeSession,
      );
      (patchReleaseService.checkUpdate as jest.Mock).mockResolvedValue({
        updateAvailable: false,
        updateRequired: false,
        updateType: null,
        currentVersion: '1.0.2',
        latestVersion: '1.0.2',
      });

      await middleware.use(
        mockReq as Request,
        mockRes as unknown as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.setHeader).not.toHaveBeenCalled();
    });
  });
});
