import { Test, TestingModule } from '@nestjs/testing';
import { StaticDocumentController } from './static-document.controller';
import { StaticDocumentService } from './static-document.service';
import { StaticDocumentType } from './static-document.entity';
import { AdminGuard, RequestWithAdmin } from '../auth/admin.guard';

describe('StaticDocumentController', () => {
  let controller: StaticDocumentController;
  let service: Partial<StaticDocumentService>;

  const mockDoc = {
    _id: 'doc-1',
    type: StaticDocumentType.PRIVACY_POLICY,
    title: 'Privacy Policy',
    content: 'Details',
    updatedBy: 'Admin',
    lastAction: 'POST',
  };

  const mockReq = {
    user: {
      userId: 'admin-1',
      name: 'Admin Name',
      email: 'admin@example.com',
      lastLoginAt: '2026-10-28T00:00:00.000Z',
      loggedInAt: '2026-10-28T00:00:00.000Z',
      sessionId: 'sess-1',
      role: 'ADMIN',
    },
  } as unknown as RequestWithAdmin;

  beforeEach(async () => {
    service = {
      findAllPublic: jest.fn().mockResolvedValue([mockDoc]),
      findByTypePublic: jest.fn().mockResolvedValue(mockDoc),
      create: jest.fn().mockResolvedValue(mockDoc),
      findAll: jest.fn().mockResolvedValue([mockDoc]),
      findById: jest.fn().mockResolvedValue(mockDoc),
      update: jest.fn().mockResolvedValue({ ...mockDoc, lastAction: 'EDIT' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaticDocumentController],
      providers: [{ provide: StaticDocumentService, useValue: service }],
    })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<StaticDocumentController>(StaticDocumentController);
  });

  it('should call findAllPublic on public endpoint', async () => {
    const res = await controller.findAllPublic();
    expect(service.findAllPublic).toHaveBeenCalled();
    expect(res).toHaveLength(1);
  });

  it('should call findByTypePublic on public endpoint', async () => {
    const res = await controller.findByTypePublic('PRIVACY_POLICY');
    expect(service.findByTypePublic).toHaveBeenCalledWith('PRIVACY_POLICY');
    expect(res).toEqual(mockDoc);
  });

  it('should call create on admin endpoint with admin name', async () => {
    const dto = {
      type: StaticDocumentType.PRIVACY_POLICY,
      title: 'Privacy Policy',
      content: 'Details',
    };
    const res = await controller.create(dto, mockReq);
    expect(service.create).toHaveBeenCalledWith(dto, 'Admin Name');
    expect(res).toBeDefined();
  });

  it('should call findAll on admin endpoint', async () => {
    const res = await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
    expect(res).toHaveLength(1);
  });

  it('should call findById on admin endpoint', async () => {
    const res = await controller.findById('doc-1');
    expect(service.findById).toHaveBeenCalledWith('doc-1');
    expect(res).toBeDefined();
  });

  it('should call update on admin endpoint', async () => {
    const res = await controller.update('doc-1', { title: 'New' }, mockReq);
    expect(service.update).toHaveBeenCalledWith(
      'doc-1',
      { title: 'New' },
      'Admin Name',
    );
    expect(res.lastAction).toBe('EDIT');
  });
});
