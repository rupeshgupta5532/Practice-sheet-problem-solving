import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { RequestLog } from './request-log.schema';
import { RedisService } from '../auth/redis.service';
import type { UserSession } from '../auth/auth.service';
import { Employee } from '../employee/employee.schema';

@Injectable()
export class RequestLogMiddleware implements NestMiddleware {
  constructor(
    @InjectModel(RequestLog.name) private readonly logModel: Model<RequestLog>,
    @InjectModel(Employee.name) private readonly employeeModel: Model<Employee>,
    private readonly redisService: RedisService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const apiKey = (req.headers['api-key'] ||
      req.headers['x-api-key']) as string;
    const appType = (req.headers['app-type'] ||
      req.headers['app type']) as string;
    const appVersion = req.headers['app-version'] as string;
    const app = req.headers['app'] as string;

    const rawHeader = req.headers['last_login_at'];
    let lastLoginAt;

    if(typeof rawHeader === "string"){
        lastLoginAt= rawHeader.trim();
    }else if(Array.isArray(rawHeader)){
      lastLoginAt = rawHeader[0].trim()
    }

    // 2. If not in header, check active Redis session via authorization token

    if (!lastLoginAt) {
      const authHeader = req.headers['authorization'];

      let token: string | undefined;

      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      } else {
        const headerToken = req.headers['token'];

        if (typeof headerToken === 'string') {
          token = headerToken;
        }
      }

      if (token) {
        try {
          const session = await this.redisService.getSession(token);

          if (session?.lastLoginAt || session?.loggedInAt) {
            lastLoginAt = session.lastLoginAt || session.loggedInAt;
          }
        } catch {
          // Ignore Redis errors
        }
      }
    }

    // 3. If login request, use employee's previous login timestamp from DB
    if (
      !lastLoginAt &&
      (req.originalUrl?.includes('/auth/login') ||
        req.url?.includes('/auth/login'))
    ) {
      const body = req.body;
      const identifier = body?.email || body?.username;
      if (identifier) {
        try {
          const employee = await this.employeeModel.findOne({
            $or: [{ email: identifier }, { name: identifier }],
          });
          if (employee?.lastLoginAt) {
            lastLoginAt = employee.lastLoginAt;
          }
        } catch {
          // ignore DB error
        }
      }
    }

    // 4. Fallback if no previous login exists (first-time login or anonymous request)
    if (!lastLoginAt) {
      lastLoginAt = new Date().toISOString();
    }

    void this.logModel
      .create({
        apiKey,
        appType,
        appVersion,
        app,
        lastLoginAt,
        endpoint: req.originalUrl || req.url,
        method: req.method,
      })
      .catch((err: unknown) =>
        console.log(
          'Failed to save request log:',
          err instanceof Error ? err.message : 'Unknown error',
        ),
      );

    next();
  }
}
