// taches.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TachesController } from './taches.controller';
import { TachesService } from './taches.service';
import { FilterTacheDto } from './dto/filter-tache.dto';

const mockService = () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateStatus: jest.fn(),
  softDelete: jest.fn(),
  findCommentsByTacheId: jest.fn(),
  addComment: jest.fn(),
  updateComment: jest.fn(),
  softDeleteComment: jest.fn(),
});

describe('TachesController', () => {
  let controller: TachesController;
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TachesController],
      providers: [{ provide: TachesService, useFactory: mockService }],
    }).compile();

    controller = module.get<TachesController>(TachesController);
    service = module.get<TachesService>(TachesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should call findAll', async () => {
    const filters: FilterTacheDto = {
      statut: 'A_FAIRE',
      skip: 0,
      take: 10,
    }; // skip et take prennent les valeurs par défaut a utiliser
    await controller.findAll(filters);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(service.findAll).toHaveBeenCalledWith(filters);
  });

  it('should call create with correct args', async () => {
    const dto = { titre: 'Test' };
    const req = { user: { id: 'user1' } };
    await controller.create(dto, req);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(service.create).toHaveBeenCalledWith(dto, 'user1');
  });

  it('should call update with correct args', async () => {
    const dto = { titre: 'Updated' };
    const req = { user: { id: 'user1' } };
    await controller.update('1', dto, req);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(service.update).toHaveBeenCalledWith('1', dto, 'user1');
  });

  it('should call softDelete', async () => {
    const req = { user: { id: 'user1' } };
    await controller.softDelete('1', req);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(service.softDelete).toHaveBeenCalledWith('1', 'user1');
  });
});
