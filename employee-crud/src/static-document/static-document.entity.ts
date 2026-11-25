import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export type StaticDocumentDocument = StaticDocument & Document;

export enum StaticDocumentType {
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  TERMS_AND_CONDITIONS = 'TERMS_AND_CONDITIONS',
  MY_BENEFITS = 'MY_BENEFITS',
  ABOUT_APP = 'ABOUT_APP',
}

@Schema({ timestamps: true, collection: 'static_documents' })
export class StaticDocument {
  @Prop({
    required: true,
    unique: true,
    enum: Object.values(StaticDocumentType),
    index: true,
  })
  type: StaticDocumentType;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ required: true })
  updatedBy: string;

  @Prop({ required: true, default: 'POST' })
  lastAction: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const StaticDocumentSchema =
  SchemaFactory.createForClass(StaticDocument);

export class CreateStaticDocumentDto {
  @IsNotEmpty()
  @IsEnum(StaticDocumentType)
  type: StaticDocumentType;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;
}

export class UpdateStaticDocumentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
