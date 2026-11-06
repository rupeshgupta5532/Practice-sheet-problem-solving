import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService, UserSession } from './auth.service';

export interface RequestWithUser extends Request {
  user?: UserSession;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext){
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    const token =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : (request.headers['x-session-id']) ||
          (request.headers['token']);

    // console.log("token is",token)

    if (!token) {
      throw new UnauthorizedException('Authentication token missing');
    }

    const session = await this.authService.validateSession(token);
    // console.log("sessiom is ",session)

    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    request.user = session;
    return true;
  }
}
