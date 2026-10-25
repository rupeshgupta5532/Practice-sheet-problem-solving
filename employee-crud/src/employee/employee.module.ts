import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Employee, employeeSchema } from './employee.schema';

@Module({
  imports:[MongooseModule.forFeature([
    { name: Employee.name, schema: employeeSchema }
  ])],
  controllers: [EmployeeController],
  providers: [EmployeeService]
})
export class EmployeeModule {}
