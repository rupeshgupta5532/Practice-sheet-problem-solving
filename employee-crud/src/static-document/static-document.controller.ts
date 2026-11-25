import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StaticDocumentService } from './static-document.service';
import {
  CreateStaticDocumentDto,
  UpdateStaticDocumentDto,
} from './static-document.entity';
import { AdminGuard } from '../auth/admin.guard';
import type { RequestWithAdmin } from '../auth/admin.guard';

@Controller('static-documents')
export class StaticDocumentController {
  constructor(private readonly docService: StaticDocumentService) {}

  @Get('public')
  async findAllPublic() {
    return this.docService.findAllPublic();
  }

  @Get('public/:type')
  async findByTypePublic(@Param('type') type: string) {
    return this.docService.findByTypePublic(type);
  }

  @Post()
  @UseGuards(AdminGuard)
  async create(
    @Body() dto: CreateStaticDocumentDto,
    @Req() req: RequestWithAdmin,
  ) {
    const adminIdentifier = req.user?.name || req.user?.userId || 'Admin';
    return this.docService.create(dto, adminIdentifier);
  }

  @Get()
  @UseGuards(AdminGuard)
  async findAll() {
    return this.docService.findAll();
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  async findById(@Param('id') id: string) {
    return this.docService.findById(id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStaticDocumentDto,
    @Req() req: RequestWithAdmin,
  ) {
    const adminIdentifier = req.user?.name || req.user?.userId || 'Admin';
    return this.docService.update(id, dto, adminIdentifier);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  async delete(@Param('id') id: string) {
    return this.docService.delete(id);
  }
}
