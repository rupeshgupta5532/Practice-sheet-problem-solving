import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Employee } from './employee.schema';
import { Model } from 'mongoose';
import { createHash } from 'crypto';
import { createEmployeeDto } from './dtos/createEmployee.dto';
import { updateEmployeeDto } from './dtos/updateEmployee.dto';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectModel(Employee.name) private readonly employeeModel: Model<Employee>,
  ) {}

  async createEmployee(createEmployee: createEmployeeDto) {
    try {
      const hashedPassword = createHash('sha256')
        .update(createEmployee.password)
        .digest('hex');

      return await this.employeeModel.create({
        ...createEmployee,
        password: hashedPassword,
      });
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal Server Error',
        500,
      );
    }
  }

  async getEmployeeById(id: string) {
    try {
      return await this.employeeModel.findById(id).select('-password');
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal Server Error',
        500,
      );
    }
  }

  async updateEmployee(id: string, updateEmployeeDto: updateEmployeeDto) {
    try {
      const updateData = { ...updateEmployeeDto };
      if (updateData.password) {
        updateData.password = createHash('sha256')
          .update(updateData.password)
          .digest('hex');
      }

      return await this.employeeModel.findByIdAndUpdate(id, updateData, {
        new: true,
      });
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal Server Error',
        500,
      );
    }
  }

  async deleteEmployee(id: string) {
    try {
      return await this.employeeModel.findByIdAndDelete(id);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal Server Error',
        500,
      );
    }
  }

  async getEmployeeByDepartment() {
    try {
      const data = await this.employeeModel.aggregate([
        {
          $group: {
            _id: '$department',
            count: {
              $sum: 1,
            },
          },
        },
      ]);
      return data as Array<{ _id: string; count: number }>;
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal Server Error',
        500,
      );
    }
  }

  async getAverageSalarly() {
    try {
      const data = await this.employeeModel.aggregate([
        {
          $group: {
            _id: null,
            avgSalary: {
              $avg: '$salary',
            },
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ]);
      console.log('data is data : ', data);
      return (data[0] ?? null) as { avgSalary: number } | null;
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal Server Error',
        500,
      );
    }
  }
}
