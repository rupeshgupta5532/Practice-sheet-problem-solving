import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CreateStaticDocumentDto,
  StaticDocument,
  StaticDocumentDocument,
  StaticDocumentType,
  UpdateStaticDocumentDto,
} from './static-document.entity';

@Injectable()
export class StaticDocumentService {
  constructor(
    @InjectModel(StaticDocument.name)
    private readonly docModel: Model<StaticDocumentDocument>,
  ) {}

  async create(dto: CreateStaticDocumentDto, adminIdentifier: string) {
    const existing = await this.docModel.findOne({ type: dto.type });
    if (existing) {
      throw new ConflictException(
        `Static document of type "${dto.type}" already exists`,
      );
    }

    return this.docModel.create({
      ...dto,
      updatedBy: adminIdentifier,
      lastAction: 'POST',
    });
  }

  async findAll() {
    return this.docModel.find().sort({ createdAt: -1 }).lean().exec();
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Static document with ID "${id}" not found`);
    }
    const doc = await this.docModel.findById(id).lean().exec();
    if (!doc) {
      throw new NotFoundException(`Static document with ID "${id}" not found`);
    }
    return doc;
  }

  async update(
    id: string,
    dto: UpdateStaticDocumentDto,
    adminIdentifier: string,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Static document with ID "${id}" not found`);
    }

    const updated = await this.docModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            ...dto,
            updatedBy: adminIdentifier,
            lastAction: 'EDIT',
          },
        },
        { new: true },
      )
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException(`Static document with ID "${id}" not found`);
    }

    return updated;
  }

  async findAllPublic() {
    return this.docModel.find().select('-__v').lean().exec();
  }

  async findByTypePublic(type: string) {
    const docType = type.toUpperCase() as StaticDocumentType;
    const doc = await this.docModel
      .findOne({ type: docType })
      .select('-__v')
      .lean()
      .exec();

    if (!doc) {
      throw new NotFoundException(
        `Static document of type "${type}" not found`,
      );
    }
    return doc;
  }

  async delete(id: string) {
    const doc = await this.docModel.findByIdAndDelete(id).exec();
    if (!doc) {
      throw new NotFoundException(`Static document with ID "${id}" not found`);
    }
    return { message: 'Document deleted successfully' };
  }
}
