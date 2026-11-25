import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PatchReleaseService } from './patch-release.service';
import {
  CheckPatchReleaseDto,
  CreatePatchReleaseDto,
} from './patch-release.entity';
import { AdminGuard } from '../auth/admin.guard';

@Controller('patch-releases')
export class PatchReleaseController {
  constructor(private readonly patchService: PatchReleaseService) {}

  // Public update check endpoint
  @Get('check')
  async checkUpdate(@Query() query: CheckPatchReleaseDto) {
    return this.patchService.checkUpdate(query.currentVersion, query.platform);
  }

  // Admin: Create new patch release (published immediately)
  @Post()
  @UseGuards(AdminGuard)
  async create(@Body() dto: CreatePatchReleaseDto) {
    return this.patchService.create(dto);
  }

  // Admin: List all patch releases
  @Get()
  @UseGuards(AdminGuard)
  async findAll() {
    return this.patchService.findAll();
  }
}
