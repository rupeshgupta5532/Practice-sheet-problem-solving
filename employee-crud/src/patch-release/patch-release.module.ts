import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatchRelease, PatchReleaseSchema } from './patch-release.entity';
import { PatchReleaseService } from './patch-release.service';
import { PatchReleaseController } from './patch-release.controller';
import { PatchVersionMiddleware } from './patch-version.middleware';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PatchRelease.name, schema: PatchReleaseSchema },
    ]),
  ],
  controllers: [PatchReleaseController],
  providers: [PatchReleaseService, PatchVersionMiddleware],
  exports: [PatchReleaseService, PatchVersionMiddleware],
})
export class PatchReleaseModule {}
