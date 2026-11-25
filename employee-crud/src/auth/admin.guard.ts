import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService, UserSession } from './auth.service';

export interface RequestWithAdmin extends Request {
  user?: UserSession;
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAdmin>();
    const authHeader = request.headers['authorization'];
    const token =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).split(';')[0].trim().split(' ')[0].trim()
        : (request.headers['x-session-id'] as string | undefined) ||
          (request.headers['token'] as string | undefined);

    if (!token) {
      throw new UnauthorizedException('Authentication token missing');
    }

    const session = await this.authService.validateSession(token);
    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    // Role check: if role is specified, it must be ADMIN
    if (session.role && session.role.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('Admin privileges required');
    }

    request.user = session;
    return true;
  }
}
