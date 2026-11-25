import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { StaticDocumentService } from './static-document.service';
import { StaticDocument, StaticDocumentType } from './static-document.entity';

describe('StaticDocumentService', () => {
  let service: StaticDocumentService;
  let mockDocModel: {
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
  };

  const sampleId = new Types.ObjectId().toString();
  const sampleDoc = {
    _id: sampleId,
    type: StaticDocumentType.PRIVACY_POLICY,
    title: 'Privacy Policy',
    content: 'Our privacy practices...',
    updatedBy: 'Admin User',
    lastAction: 'POST',
  };

  beforeEach(async () => {
    mockDocModel = {
      create: jest
        .fn()
        .mockImplementation((doc) =>
          Promise.resolve({ ...doc, _id: sampleId }),
        ),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([sampleDoc]),
          }),
        }),
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([sampleDoc]),
          }),
        }),
      }),
      findOne: jest.fn().mockImplementation((query: { type: string }) => {
        if (query.type === (StaticDocumentType.PRIVACY_POLICY as string)) {
          return {
            select: jest.fn().mockReturnValue({
              lean: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(sampleDoc),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(null),
            }),
          }),
        };
      }),
      findById: jest.fn().mockImplementation((id: string) => {
        if (id === sampleId) {
          return {
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(sampleDoc),
            }),
          };
        }
        return {
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        };
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            ...sampleDoc,
            lastAction: 'EDIT',
            title: 'Updated Title',
          }),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaticDocumentService,
        {
          provide: getModelToken(StaticDocument.name),
          useValue: mockDocModel,
        },
      ],
    }).compile();

    service = module.get<StaticDocumentService>(StaticDocumentService);
  });

  describe('create', () => {
    it('should throw ConflictException if document of same type already exists', async () => {
      mockDocModel.findOne.mockResolvedValueOnce(sampleDoc);

      await expect(
        service.create(
          {
            type: StaticDocumentType.PRIVACY_POLICY,
            title: 'Privacy Policy',
            content: 'Content',
          },
          'Admin',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should create document with updatedBy and lastAction POST', async () => {
      mockDocModel.findOne.mockResolvedValueOnce(null);

      const result = await service.create(
        {
          type: StaticDocumentType.TERMS_AND_CONDITIONS,
          title: 'Terms',
          content: 'Terms content',
        },
        'Admin One',
      );

      expect(mockDocModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: StaticDocumentType.TERMS_AND_CONDITIONS,
          updatedBy: 'Admin One',
          lastAction: 'POST',
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update document with updatedBy and lastAction EDIT', async () => {
      const result = await service.update(
        sampleId,
        { title: 'Updated Title' },
        'Admin Two',
      );

      expect(mockDocModel.findByIdAndUpdate).toHaveBeenCalledWith(
        sampleId,
        {
          $set: {
            title: 'Updated Title',
            updatedBy: 'Admin Two',
            lastAction: 'EDIT',
          },
        },
        { new: true },
      );
      expect(result.lastAction).toBe('EDIT');
    });

    it('should throw NotFoundException for invalid id', async () => {
      await expect(
        service.update('invalid-id', { title: 'Test' }, 'Admin'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTypePublic', () => {
    it('should return document by type', async () => {
      const result = await service.findByTypePublic('PRIVACY_POLICY');
      expect(result).toEqual(sampleDoc);
    });

    it('should throw NotFoundException if type not found', async () => {
      await expect(service.findByTypePublic('ABOUT_APP')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
