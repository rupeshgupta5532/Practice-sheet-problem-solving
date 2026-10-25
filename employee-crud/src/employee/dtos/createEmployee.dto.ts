import { IsNotEmpty, IsNumber, IsString, MinLength } from "class-validator";



export class createEmployeeDto{

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    name:string;

    @IsString()
    @IsNotEmpty()
    department:string;

    @IsNumber()
    
    salary:number
}