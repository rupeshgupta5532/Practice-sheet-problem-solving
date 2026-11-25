import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StaticDocument, StaticDocumentSchema } from './static-document.entity';
import { StaticDocumentService } from './static-document.service';
import { StaticDocumentController } from './static-document.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StaticDocument.name, schema: StaticDocumentSchema },
    ]),
  ],
  controllers: [StaticDocumentController],
  providers: [StaticDocumentService],
  exports: [StaticDocumentService],
})
export class StaticDocumentModule {}
