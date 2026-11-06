import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class RequestLog extends Document {
  @Prop()
  apiKey: string;

  @Prop()
  appType: string;

  @Prop()
  appVersion: string;

  @Prop()
  app: string;

  @Prop({ default: () => new Date().toISOString() })
  lastLoginAt: string;

  @Prop()
  endpoint: string;

  @Prop()
  method: string;
}

export const RequestLogSchema = SchemaFactory.createForClass(RequestLog);
