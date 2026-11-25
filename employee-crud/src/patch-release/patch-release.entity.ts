import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export type PatchReleaseDocument = PatchRelease & Document;

export enum UpdateType {
  FORCE = 'FORCE',
  OPTIONAL = 'OPTIONAL',
}

export enum PatchStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export enum PatchPlatform {
  ANDROID = 'ANDROID',
  IOS = 'IOS',
  ALL = 'ALL',
  WEB = 'WEB',
}

@Schema({ timestamps: true, collection: 'patch_releases' })
export class PatchRelease {
  @Prop({ required: true, trim: true })
  version: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ required: true, enum: Object.values(UpdateType) })
  updateType: UpdateType;

  @Prop({
    required: true,
    enum: Object.values(PatchStatus),
    default: PatchStatus.DRAFT,
  })
  status: PatchStatus;

  @Prop({
    required: true,
    enum: Object.values(PatchPlatform),
    default: PatchPlatform.ALL,
  })
  platform: PatchPlatform;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PatchReleaseSchema = SchemaFactory.createForClass(PatchRelease);

PatchReleaseSchema.index({ status: 1, platform: 1 });
PatchReleaseSchema.index({ version: 1, platform: 1 });

// DTOs defined cleanly in the same module
export class CreatePatchReleaseDto {
  @IsNotEmpty()
  @IsString()
  version: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsEnum(UpdateType)
  updateType: UpdateType;

  @IsOptional()
  @IsEnum(PatchStatus)
  status?: PatchStatus = PatchStatus.PUBLISHED;

  @IsOptional()
  @IsEnum(PatchPlatform)
  platform?: PatchPlatform = PatchPlatform.ALL;
}

export class CheckPatchReleaseDto {
  @IsNotEmpty()
  @IsString()
  currentVersion: string;

  @IsOptional()
  @IsString()
  platform?: string = 'WEB';
}
