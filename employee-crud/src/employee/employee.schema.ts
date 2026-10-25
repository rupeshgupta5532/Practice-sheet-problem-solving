import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";



@Schema()
export class Employee{

    @Prop({required:true})
    name:string;

    @Prop()
    department:string;

    @Prop({})
    salary:number
}

export const employeeSchema = SchemaFactory.createForClass(Employee)