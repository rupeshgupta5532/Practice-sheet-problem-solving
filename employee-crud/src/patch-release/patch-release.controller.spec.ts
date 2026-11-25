import { Test, TestingModule } from '@nestjs/testing';
import { PatchReleaseController } from './patch-release.controller';
import { PatchReleaseService } from './patch-release.service';
import { PatchPlatform, PatchStatus, UpdateType } from './patch-release.entity';
import { AdminGuard } from '../auth/admin.guard';

describe('PatchReleaseController', () => {
  let controller: PatchReleaseController;
  let service: Partial<PatchReleaseService>;

  const mockRelease = {
    _id: 'patch-1',
    version: '1.0.1',
    title: 'Bug Fix',
    content: 'Details',
    updateType: UpdateType.OPTIONAL,
    status: PatchStatus.PUBLISHED,
    platform: PatchPlatform.ALL,
  };

  beforeEach(async () => {
    service = {
      checkUpdate: jest.fn().mockResolvedValue({
        updateAvailable: false,
        updateRequired: false,
        updateType: null,
        currentVersion: '1.0.1',
        latestVersion: '1.0.1',
      }),
      create: jest.fn().mockResolvedValue(mockRelease),
      findAll: jest.fn().mockResolvedValue([mockRelease]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatchReleaseController],
      providers: [{ provide: PatchReleaseService, useValue: service }],
    })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PatchReleaseController>(PatchReleaseController);
  });

  it('should call checkUpdate on public endpoint', async () => {
    const res = await controller.checkUpdate({
      currentVersion: '1.0.1',
      platform: 'WEB',
    });
    expect(service.checkUpdate).toHaveBeenCalledWith('1.0.1', 'WEB');
    expect(res.updateAvailable).toBe(false);
  });

  it('should call create on admin create endpoint', async () => {
    const dto = {
      version: '1.0.2',
      title: 'New patch',
      content: 'Notes',
      updateType: UpdateType.FORCE,
    };
    const res = await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(res).toBeDefined();
  });

  it('should call findAll', async () => {
    const res = await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
    expect(res).toHaveLength(1);
  });
});
