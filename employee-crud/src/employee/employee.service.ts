import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Employee } from './employee.schema';
import { Model, Mongoose } from 'mongoose';
import { createEmployeeDto } from './dtos/createEmployee.dto';
import { updateEmployeeDto } from './dtos/updateEmployee.dto';

@Injectable()
export class EmployeeService {

    constructor(@InjectModel(Employee.name) private employeeModel : Model<Employee>){}


    async createEmployee(createEmployee : createEmployeeDto){
       try {
         return await this.employeeModel.create({
            ...createEmployee
        })
       } catch (error) {
         throw new HttpException(error,500)
       }

    }


    async getEmployeeById(id:string){
        try {
            return await this.employeeModel.findById(id)
        } catch (error) {
            throw new HttpException(error,500)
        }
    }


    async updateEmployee(id:string,updateEmployeeDto:updateEmployeeDto){
        try {
            return await this.employeeModel.findByIdAndUpdate(id,{
                ...updateEmployeeDto
            })
        } catch (error) {
            throw new HttpException(error,500)
        }
    }

    async deleteEmployee(id:string){
        try {
            return await this.employeeModel.findByIdAndDelete(id);
        } catch (error) {
            throw new HttpException(error,500)
        }
    }


    async getEmployeeByDepartment(){
        try {
            const data = await this.employeeModel.aggregate([
                {
                    $group:{
                        _id: "$department",
                        count:{
                            $sum:1
                        }
                    },
                }
            ])
            return data;
        } catch (error) {
            throw new HttpException(error,500)
        }
    }


    async getAverageSalarly(){
        try {
            const data = await this.employeeModel.aggregate([
                {
                   $group:{
                    _id:null,
                    avgSalary:{
                        $avg: "$salary"
                    }
                   },
                },
                {
                    $project:{
                        _id : 0
                    }
                }
            ])
            console.log("data is data : ",data)
            return data[0];
        } catch (error) {
            throw new HttpException(error,500)
        }
    }



}
