import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { createEmployeeDto } from './dtos/createEmployee.dto';
import { EmployeeService } from './employee.service';
import { updateEmployeeDto } from './dtos/updateEmployee.dto';

@Controller('employee')
export class EmployeeController {

    constructor(private readonly employeeService : EmployeeService){}

    @Post()
    createEmployee(@Body() createEmployeeDto : createEmployeeDto){
       return this.employeeService.createEmployee(createEmployeeDto);
    }


    @Get("department")
    getEmployeeByDepartment(){
        return this.employeeService.getEmployeeByDepartment();
    }

    @Get("avg-salary")
    getAverageEmployeeSalary(){
        return this.employeeService.getAverageSalarly();
    }

    @Get(":id")
    getEmployee(@Param('id') id :string){
        console.log(id)
        return this.employeeService.getEmployeeById(id);
    }

    @Patch()
    updateEmployee(@Query('id') id:string, @Body() data : updateEmployeeDto){
        return this.employeeService.updateEmployee(id,data);
    }

    @Delete()
    deleteEmployee(@Query('id') id : string){
        return this.employeeService.deleteEmployee(id);
    }

    
}
