import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RedisService } from './redis.service';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';
import { Employee, employeeSchema } from '../employee/employee.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: employeeSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, RedisService, AuthGuard, AdminGuard],
  exports: [AuthService, RedisService, AuthGuard, AdminGuard],
})
export class AuthModule {}
