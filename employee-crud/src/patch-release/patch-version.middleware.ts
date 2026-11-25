import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth/auth.service';
import { PatchReleaseService } from './patch-release.service';
import { UpdateType } from './patch-release.entity';

@Injectable()
export class PatchVersionMiddleware implements NestMiddleware {
  constructor(
    private readonly authService: AuthService,
    private readonly patchReleaseService: PatchReleaseService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. Exclude public routes that do not require version enforcement
    const path = req.path || req.url || '';
    if (this.isExcludedRoute(path)) {
      return next();
    }

    // 2. Extract authentication token
    const authHeader = req.headers['authorization'];
    const token =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).split(';')[0].trim().split(' ')[0].trim()
        : (req.headers['x-session-id'] as string | undefined) ||
          (req.headers['token'] as string | undefined);

    // If no token is provided, let AuthGuard reject with 401
    if (!token) {
      return next();
    }

    // 3. Validate user session
    const session = await this.authService.validateSession(token);
    if (!session) {
      // Invalid/expired session, let AuthGuard handle 401
      return next();
    }

    // 4. Admins bypass version enforcement
    if (session.role === 'ADMIN') {
      return next();
    }

    // 5. Read client application version header (or from authorization header)
    let rawVersion =
      (req.headers['x-app-version'] as string | undefined) ||
      (req.headers['x-client-version'] as string | undefined) ||
      (req.headers['app-version'] as string | undefined);

    if (!rawVersion && typeof authHeader === 'string') {
      const match = authHeader.match(/version[=/ ]([0-9.]+)/i);
      if (match) rawVersion = match[1];
    }

    const currentVersion = rawVersion ? rawVersion.trim() : '0.0.0';

    const clientPlatform =
      (req.headers['x-platform'] as string | undefined) ||
      (req.headers['x-app-platform'] as string | undefined) ||
      'ALL';

    // 6. Check version status against published patch releases
    const updateCheck = await this.patchReleaseService.checkUpdate(
      currentVersion,
      clientPlatform,
    );

    // 7. Enforce FORCE / Mandatory update -> HTTP 426
    if (
      updateCheck.updateRequired &&
      updateCheck.updateType === UpdateType.FORCE
    ) {
      return res.status(426).json({
        statusCode: 426,
        message: 'Application update required.',
        updateRequired: true,
        updateType: 'FORCE',
        currentVersion,
        requiredVersion:
          updateCheck.minimumRequiredVersion || updateCheck.latestVersion,
        latestVersion: updateCheck.latestVersion,
      });
    }

    // 8. Attach response headers for OPTIONAL update
    if (updateCheck.updateAvailable && !updateCheck.updateRequired) {
      res.setHeader('X-Update-Available', 'true');
      res.setHeader('X-Latest-Version', updateCheck.latestVersion);
      res.setHeader('X-Update-Type', 'OPTIONAL');
      if (updateCheck.title) {
        res.setHeader('X-Update-Title', encodeURIComponent(updateCheck.title));
      }
      if (updateCheck.content) {
        res.setHeader(
          'X-Update-Content',
          encodeURIComponent(updateCheck.content),
        );
      }
    }

    return next();
  }

  private isExcludedRoute(path: string): boolean {
    const cleanPath = path.split('?')[0].toLowerCase();
    const excludedPrefixes = [
      '/auth',
      '/patch-releases/check',
      '/app-version/check',
    ];
    return excludedPrefixes.some((prefix) => cleanPath.startsWith(prefix));
  }
}
