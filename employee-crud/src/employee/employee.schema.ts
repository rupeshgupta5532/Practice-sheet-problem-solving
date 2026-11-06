import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Employee {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  department: string;

  @Prop()
  salary: number;

  @Prop()
  lastLoginAt?: string;
}

export const employeeSchema = SchemaFactory.createForClass(Employee);
