import { Test, TestingModule } from '@nestjs/testing';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { FilterClientDto } from './dto/filter-client.dto';
import { StatutClient } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('ClientsController', () => {
  let controller: ClientsController;
  let service: ClientsService;

  const mockClientsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [{ provide: ClientsService, useValue: mockClientsService }],
    }).compile();

    controller = module.get<ClientsController>(ClientsController);
    service = module.get<ClientsService>(ClientsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call ClientsService.findAll and return result', async () => {
    const filters: FilterClientDto = { statut: StatutClient.ACTIF };
    const mockResult = [
      { id: '1', prenom: 'Jean', nom: 'Dupont', statut: StatutClient.ACTIF },
    ];
    (service.findAll as jest.Mock).mockResolvedValue(mockResult);

    const result = await controller.findAll(filters);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.findAll).toHaveBeenCalledWith(filters);
    expect(result).toEqual(mockResult);
  });

  // ---------- findOne tests ----------
  it('should return a client when found', async () => {
    const mockClient = { id: '1', prenom: 'Jean', nom: 'Dupont' };
    (service.findOne as jest.Mock).mockResolvedValue(mockClient);

    const result = await controller.findOne('1');

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.findOne).toHaveBeenCalledWith('1');
    expect(result).toEqual(mockClient);
  });

  it('should throw NotFoundException if client not found', async () => {
    (service.findOne as jest.Mock).mockRejectedValue(new NotFoundException());

    await expect(controller.findOne('999')).rejects.toThrow(NotFoundException);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.findOne).toHaveBeenCalledWith('999');
  });
  // ---------- create tests ----------
  it('should call ClientsService.create and return result', async () => {
    const createDto = {
      prenom: 'Jean',
      nom: 'Dupont',
      email: 'jean@example.com',
      telephone: '123456789',
      nomEntreprise: 'Dupont SARL',
      adresse: 'Douala',
    };

    const mockClient = { id: '1', ...createDto, dossiers: [], factures: [] };
    (service.create as jest.Mock).mockResolvedValue(mockClient);

    const result = await controller.create(createDto);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.create).toHaveBeenCalledWith(createDto);
    expect(result).toEqual(mockClient);
  });
  // ---------- update tests ----------
  it('should call ClientsService.update and return result', async () => {
    const id = '1';
    const updateDto = { prenom: 'Jean-Marc' };
    const mockClient = {
      id,
      prenom: 'Jean-Marc',
      nom: 'Dupont',
      dossiers: [],
      factures: [],
    };

    (service.update as jest.Mock).mockResolvedValue(mockClient);

    const result = await controller.update(id, updateDto);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.update).toHaveBeenCalledWith(id, updateDto);
    expect(result).toEqual(mockClient);
  });
});
