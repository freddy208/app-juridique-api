import { Test, TestingModule } from '@nestjs/testing';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { FilterClientDto } from './dto/filter-client.dto';
import { StatutClient } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { FilterDossierDto } from './dto/filter-dossier.dto';

describe('ClientsController', () => {
  let controller: ClientsController;
  let service: ClientsService;

  const mockClientsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    remove: jest.fn(),
    findDossiersByClient: jest.fn(),
    findDocumentsByClient: jest.fn(),
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
  // ---------- updateStatus tests ----------
  it('should call ClientsService.updateStatus and return result', async () => {
    const id = '1';
    const body = { statut: StatutClient.INACTIF };
    const mockClient = {
      id,
      prenom: 'Jean',
      nom: 'Dupont',
      statut: StatutClient.INACTIF,
      dossiers: [],
      factures: [],
    };

    (service.updateStatus as jest.Mock).mockResolvedValue(mockClient);

    const result = await controller.updateStatus(id, body);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.updateStatus).toHaveBeenCalledWith(id, body.statut);
    expect(result).toEqual(mockClient);
  });

  it('should throw NotFoundException if client to update status not found', async () => {
    const id = '999';
    const body = { statut: StatutClient.ACTIF };

    (service.updateStatus as jest.Mock).mockRejectedValue(
      new NotFoundException(),
    );

    await expect(controller.updateStatus(id, body)).rejects.toThrow(
      NotFoundException,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.updateStatus).toHaveBeenCalledWith(id, body.statut);
  });
  // ---------- remove (soft delete) tests ----------
  it('should call ClientsService.remove and return result', async () => {
    const id = '1';
    const mockClient = {
      id,
      prenom: 'Jean',
      nom: 'Dupont',
      statut: StatutClient.INACTIF,
      dossiers: [],
      factures: [],
    };

    (service.remove as jest.Mock).mockResolvedValue(mockClient);

    const result = await controller.remove(id);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.remove).toHaveBeenCalledWith(id);
    expect(result).toEqual(mockClient);
  });

  it('should throw NotFoundException if client to remove not found', async () => {
    const id = '999';
    (service.remove as jest.Mock).mockRejectedValue(new NotFoundException());

    await expect(controller.remove(id)).rejects.toThrow(NotFoundException);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.remove).toHaveBeenCalledWith(id);
  });
  // ---------- getDossiers tests ----------
  describe('getDossiers', () => {
    it('should call service.findDossiersByClient and return result', async () => {
      const clientId = '1';
      const filters: FilterDossierDto = new FilterDossierDto(); // ✅ valeurs par défaut (skip=0, take=10)

      const mockDossiers = [
        { id: 'd1', titre: 'Dossier 1', clientId },
        { id: 'd2', titre: 'Dossier 2', clientId },
      ];

      (service.findDossiersByClient as jest.Mock).mockResolvedValue(
        mockDossiers,
      );

      const result = await controller.getDossiers(clientId, filters);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findDossiersByClient).toHaveBeenCalledWith(
        clientId,
        undefined,
        0,
        10,
      );
      expect(result).toEqual(mockDossiers);
    });

    it('should use skip and take from filters', async () => {
      const clientId = '1';
      const filters: FilterDossierDto = {
        skip: 5,
        take: 15,
      } as FilterDossierDto; // ✅ pagination custom
      const mockDossiers: any[] = [];

      (service.findDossiersByClient as jest.Mock).mockResolvedValue(
        mockDossiers,
      );

      const result = await controller.getDossiers(clientId, filters);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findDossiersByClient).toHaveBeenCalledWith(
        clientId,
        undefined,
        5,
        15,
      );
      expect(result).toEqual(mockDossiers);
    });

    it('should throw NotFoundException if service throws', async () => {
      const clientId = '999';
      const filters: FilterDossierDto = new FilterDossierDto(); // ✅ valeurs par défaut

      (service.findDossiersByClient as jest.Mock).mockRejectedValue(
        new NotFoundException(),
      );

      await expect(controller.getDossiers(clientId, filters)).rejects.toThrow(
        NotFoundException,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findDossiersByClient).toHaveBeenCalledWith(
        clientId,
        undefined,
        0,
        10,
      );
    });
  });
  // ---------- getDocuments tests ----------
  describe('getDocuments', () => {
    it('should call service.findDocumentsByClient and return result', async () => {
      const clientId = '1';
      const mockDocuments = [
        { id: 'doc1', titre: 'Document 1', clientId },
        { id: 'doc2', titre: 'Document 2', clientId },
      ];

      (service.findDocumentsByClient as jest.Mock).mockResolvedValue(
        mockDocuments,
      );

      const result = await controller.getDocuments(clientId, {
        skip: 0,
        take: 10,
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findDocumentsByClient).toHaveBeenCalledWith(
        clientId,
        undefined,
        0,
        10,
      );
      expect(result).toEqual(mockDocuments);
    });

    it('should throw NotFoundException if service throws', async () => {
      const clientId = '999';
      (service.findDocumentsByClient as jest.Mock).mockRejectedValue(
        new NotFoundException(),
      );

      await expect(
        controller.getDocuments(clientId, { skip: 0, take: 10 }),
      ).rejects.toThrow(NotFoundException);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findDocumentsByClient).toHaveBeenCalledWith(
        clientId,
        undefined,
        0,
        10,
      );
    });
  });
});
