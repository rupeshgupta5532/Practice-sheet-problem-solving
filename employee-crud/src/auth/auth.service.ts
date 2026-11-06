import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHash, randomUUID } from 'crypto';
import { RedisService } from './redis.service';
import { Employee } from '../employee/employee.schema';

export interface UserSession {
  sessionId: string;
  userId: string;
  name: string;
  email: string;
  department?: string;
  lastLoginAt: string;
  loggedInAt: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Employee.name) private readonly employeeModel: Model<Employee>,
    private readonly redisService: RedisService,
  ) {}

  async login(
    identifier: string,
    password?: string,
  ){
    if (!identifier || !password) {
      throw new UnauthorizedException(
        'Email/username and password are required',
      );
    }

    const employee = await this.employeeModel.findOne({
      $or: [{ email: identifier }, { name: identifier }],
    });

    if (!employee) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const hashedPassword = createHash('sha256').update(password).digest("hex")
    const isPasswordValid =
      employee.password === password || employee.password === hashedPassword;

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const previousLoginAt = employee.lastLoginAt || new Date().toISOString();
    const currentLoginAt = new Date().toISOString();

    await this.employeeModel.findByIdAndUpdate(employee._id, {
      lastLoginAt: currentLoginAt,
    });

    const sessionId = randomUUID();

    const sessionData = {
      sessionId,
      userId: employee._id ? String(employee._id) : sessionId,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      lastLoginAt: previousLoginAt,
      loggedInAt: previousLoginAt,
    };

    await this.redisService.setSession(
      sessionId,
      sessionData,
      3600,
    );

    return {
      message: 'Login successful',
      token: sessionId,
      user: sessionData,
    };
  }

  async logout(sessionId: string){
    if (sessionId) {
      await this.redisService.deleteSession(sessionId);
    }
    return { message: 'Logged out successfully' };
  }

  async validateSession(sessionId: string){
    console.log("session id ",sessionId)
    if (!sessionId) return null;
    return await this.redisService.getSession(sessionId);
  }
}
