import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmployeeModule } from './employee/employee.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { RequestLog, RequestLogSchema } from './middleware/request-log.schema';
import { RequestLogMiddleware } from './middleware/request-log.middleware';
import { Employee, employeeSchema } from './employee/employee.schema';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost/empCrud',
    ),
    MongooseModule.forFeature([
      { name: RequestLog.name, schema: RequestLogSchema },
      { name: Employee.name, schema: employeeSchema },
    ]),
    EmployeeModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLogMiddleware).forRoutes('*');
  }
}
