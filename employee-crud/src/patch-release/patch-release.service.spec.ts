import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { compareVersions, PatchReleaseService } from './patch-release.service';
import {
  PatchPlatform,
  PatchRelease,
  PatchStatus,
  UpdateType,
} from './patch-release.entity';

describe('PatchReleaseService', () => {
  let service: PatchReleaseService;
  let mockPatchModel: {
    create: jest.Mock;
    find: jest.Mock;
  };

  const sampleId = new Types.ObjectId().toString();
  const samplePatch = {
    _id: sampleId,
    version: '1.0.1',
    title: 'Bug Fix Release',
    content: 'Resolved memory leak',
    updateType: UpdateType.OPTIONAL,
    status: PatchStatus.PUBLISHED,
    platform: PatchPlatform.ALL,
  };

  beforeEach(async () => {
    mockPatchModel = {
      create: jest
        .fn()
        .mockImplementation((doc) =>
          Promise.resolve({ ...doc, _id: sampleId }),
        ),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([samplePatch]),
          }),
        }),
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([samplePatch]),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatchReleaseService,
        {
          provide: getModelToken(PatchRelease.name),
          useValue: mockPatchModel,
        },
      ],
    }).compile();

    service = module.get<PatchReleaseService>(PatchReleaseService);
  });

  describe('compareVersions', () => {
    it('should correctly compare versions as per specification', () => {
      expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
      expect(compareVersions('1.0.9', '1.0.10')).toBe(-1);
      expect(compareVersions('1.1.0', '1.0.9')).toBe(1);
      expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
      expect(compareVersions('1.0.2', '1.0.2')).toBe(0);
    });
  });

  describe('create and findAll', () => {
    it('should create a patch release with PUBLISHED status', async () => {
      const dto = {
        version: '1.1.0',
        title: 'New features',
        content: 'Some notes',
        updateType: UpdateType.FORCE,
      };
      const result = await service.create(dto);
      expect(mockPatchModel.create).toHaveBeenCalledWith({
        ...dto,
        status: PatchStatus.PUBLISHED,
      });
      expect(result).toBeDefined();
    });

    it('should find all patch releases', async () => {
      const result = await service.findAll();
      expect(mockPatchModel.find).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('checkUpdate', () => {
    it('should return no update when current version is equal or newer', async () => {
      mockPatchModel.find.mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              version: '1.0.2',
              updateType: UpdateType.OPTIONAL,
              status: PatchStatus.PUBLISHED,
              platform: PatchPlatform.WEB,
            },
          ]),
        }),
      });

      const result = await service.checkUpdate('1.0.2', 'WEB');
      expect(result.updateAvailable).toBe(false);
      expect(result.updateRequired).toBe(false);
      expect(result.updateType).toBeNull();
      expect(result.currentVersion).toBe('1.0.2');
      expect(result.latestVersion).toBe('1.0.2');
    });

    it('should return update required when newer release exists', async () => {
      mockPatchModel.find.mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              version: '1.0.2',
              title: 'Application Improvements',
              content: 'Improved performance and user experience.',
              updateType: UpdateType.FORCE,
              status: PatchStatus.PUBLISHED,
              platform: PatchPlatform.WEB,
            },
          ]),
        }),
      });

      const result = await service.checkUpdate('1.0.0', 'WEB');
      expect(result.updateAvailable).toBe(true);
      expect(result.updateRequired).toBe(true);
      expect(result.updateType).toBe(UpdateType.FORCE);
      expect(result.currentVersion).toBe('1.0.0');
      expect(result.latestVersion).toBe('1.0.2');
      expect(result.title).toBe('Application Improvements');
    });

    it('should filter releases by platform (ANDROID matches ANDROID and ALL)', async () => {
      mockPatchModel.find.mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              version: '2.0.0',
              updateType: UpdateType.OPTIONAL,
              status: PatchStatus.PUBLISHED,
              platform: PatchPlatform.IOS,
            },
            {
              version: '2.1.0',
              updateType: UpdateType.FORCE,
              status: PatchStatus.PUBLISHED,
              platform: PatchPlatform.ANDROID,
            },
          ]),
        }),
      });

      const result = await service.checkUpdate('1.0.0', 'ANDROID');
      expect(result.updateAvailable).toBe(true);
      expect(result.latestVersion).toBe('2.1.0');
      expect(result.updateType).toBe(UpdateType.FORCE);
    });

    it('should match any published release when client platform is ALL', async () => {
      mockPatchModel.find.mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              version: '1.2.0',
              updateType: UpdateType.OPTIONAL,
              status: PatchStatus.PUBLISHED,
              platform: PatchPlatform.ANDROID,
            },
          ]),
        }),
      });

      const result = await service.checkUpdate('1.0.0', 'ALL');
      expect(result.updateAvailable).toBe(true);
      expect(result.latestVersion).toBe('1.2.0');
      expect(result.updateRequired).toBe(false);
      expect(result.updateType).toBe(UpdateType.OPTIONAL);
    });
  });
});
