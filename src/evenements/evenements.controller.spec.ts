import { Test, TestingModule } from '@nestjs/testing';
import { EvenementsController } from './evenements.controller';
import { EvenementsService } from './evenements.service';
import { FilterEvenementDto } from './dto/filter-evenement.dto';
import { CreateEvenementDto } from './dto/create-evenement.dto';
import { UpdateEvenementDto } from './dto/update-evenement.dto';
import { StatutEvenement } from '@prisma/client';

const mockService = () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateStatus: jest.fn(),
  softDelete: jest.fn(),
});

describe('EvenementsController', () => {
  let controller: EvenementsController;
  let service: ReturnType<typeof mockService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvenementsController],
      providers: [{ provide: EvenementsService, useFactory: mockService }],
    }).compile();

    controller = module.get<EvenementsController>(EvenementsController);
    service = module.get(EvenementsService);
  });

  afterEach(() => jest.clearAllMocks());

  // 🧩 Test findAll
  it('should call findAll with correct filters', async () => {
    const filters: FilterEvenementDto = {
      statut: StatutEvenement.PREVU,
      skip: 0,
      take: 10,
    };

    await controller.findAll(filters);

    expect(service.findAll).toHaveBeenCalledWith(filters);
  });

  // 🧩 Test findOne
  it('should call findOne with correct id', async () => {
    await controller.findOne('event-123');
    expect(service.findOne).toHaveBeenCalledWith('event-123');
  });

  // 🧩 Test create
  it('should call create with correct dto and user id', async () => {
    const dto: CreateEvenementDto = {
      titre: 'Réunion importante',
      description: 'Discussion sur les dossiers en cours',
      debut: new Date().toISOString(),
      fin: new Date().toISOString(),

      dossierId: 'dos-1',
    };
    const req = { user: { id: 'user-123' } };

    await controller.create(dto, req);

    expect(service.create).toHaveBeenCalledWith(dto, 'user-123');
  });

  // 🧩 Test update
  it('should call update with correct args', async () => {
    const dto: UpdateEvenementDto = {
      titre: 'Mise à jour',
      description: 'Changement de planning',
    };
    const req = { user: { id: 'user-999' } };

    await controller.update('event-1', dto, req);

    expect(service.update).toHaveBeenCalledWith('event-1', dto, 'user-999');
  });

  // 🧩 Test updateStatus
  it('should call updateStatus with correct args', async () => {
    const req = { user: { id: 'user-777' } };

    await controller.updateStatus('event-5', StatutEvenement.TERMINE, req);

    expect(service.updateStatus).toHaveBeenCalledWith(
      'event-5',
      StatutEvenement.TERMINE,
      'user-777',
    );
  });

  // 🧩 Test softDelete
  it('should call softDelete with correct args', async () => {
    const req = { user: { id: 'user-456' } };

    await controller.softDelete('event-42', req);

    expect(service.softDelete).toHaveBeenCalledWith('event-42', 'user-456');
  });
});
