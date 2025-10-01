import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { PrismaService } from '../prisma.service';
import { FilterClientDto } from './dto/filter-client.dto';
import { StatutClient } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('ClientsService', () => {
  let service: ClientsService;
  let prisma: PrismaService;

  const mockPrisma = {
    client: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------- findAll tests existants ----------
  it('should call prisma.client.findMany with filters', async () => {
    const filters: FilterClientDto = {
      statut: StatutClient.ACTIF,
      search: 'Jean',
      skip: 0,
      take: 10,
    };
    const mockClients = [
      { id: '1', prenom: 'Jean', nom: 'Dupont', statut: StatutClient.ACTIF },
    ];
    (prisma.client.findMany as jest.Mock).mockResolvedValue(mockClients);

    const result = await service.findAll(filters);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where: expect.objectContaining({
          statut: StatutClient.ACTIF,
          OR: [
            { prenom: { contains: 'Jean', mode: 'insensitive' } },
            { nom: { contains: 'Jean', mode: 'insensitive' } },
          ],
        }),
        skip: 0,
        take: 10,
      }),
    );
    expect(result).toEqual(mockClients);
  });

  it('should handle empty filters', async () => {
    const filters: FilterClientDto = {};
    (prisma.client.findMany as jest.Mock).mockResolvedValue([]);

    const result = await service.findAll(filters);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      }),
    );
    expect(result).toEqual([]);
  });

  // ---------- findOne tests ----------
  it('should return a client when found', async () => {
    const mockClient = { id: '1', prenom: 'Jean', nom: 'Dupont' };
    (prisma.client.findUnique as jest.Mock).mockResolvedValue(mockClient);

    const result = await service.findOne('1');

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.client.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
      include: { dossiers: true, factures: true },
    });
    expect(result).toEqual(mockClient);
  });

  it('should throw NotFoundException if client not found', async () => {
    (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.client.findUnique).toHaveBeenCalledWith({
      where: { id: '999' },
      include: { dossiers: true, factures: true },
    });
  });
  // ---------- create tests ----------
  it('should create a new client', async () => {
    const createDto = {
      prenom: 'Jean',
      nom: 'Dupont',
      email: 'jean@example.com',
      telephone: '123456789',
      nomEntreprise: 'Dupont SARL',
      adresse: 'Douala',
    };

    const mockClient = { id: '1', ...createDto, dossiers: [], factures: [] };
    (prisma.client.create as jest.Mock).mockResolvedValue(mockClient);

    const result = await service.create(createDto);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.client.create).toHaveBeenCalledWith({
      data: createDto,
      include: { dossiers: true, factures: true },
    });
    expect(result).toEqual(mockClient);
  });
  // ---------- update tests ----------
  it('should update a client when found', async () => {
    const id = '1';
    const updateDto = { prenom: 'Jean-Marc' };
    const mockClient = {
      id,
      prenom: 'Jean-Marc',
      nom: 'Dupont',
      dossiers: [],
      factures: [],
    };

    // Mock findUnique pour vérifier existence
    (prisma.client.findUnique as jest.Mock).mockResolvedValue({
      id,
      prenom: 'Jean',
      nom: 'Dupont',
    });

    (prisma.client.update as jest.Mock).mockResolvedValue(mockClient);

    const result = await service.update(id, updateDto);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.client.findUnique).toHaveBeenCalledWith({ where: { id } });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.client.update).toHaveBeenCalledWith({
      where: { id },
      data: updateDto,
      include: { dossiers: true, factures: true },
    });
    expect(result).toEqual(mockClient);
  });

  it('should throw NotFoundException if client to update not found', async () => {
    (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.update('999', { prenom: 'Test' })).rejects.toThrow(
      NotFoundException,
    );
  });
  // ---------- updateStatus tests ----------
  it('should update client status when found', async () => {
    const id = '1';
    const statut: StatutClient = StatutClient.INACTIF;
    const mockClient = {
      id,
      prenom: 'Jean',
      nom: 'Dupont',
      statut,
      dossiers: [],
      factures: [],
    };

    // Mock findUnique pour vérifier existence
    (prisma.client.findUnique as jest.Mock).mockResolvedValue({
      id,
      prenom: 'Jean',
      nom: 'Dupont',
      statut: StatutClient.ACTIF,
    });

    (prisma.client.update as jest.Mock).mockResolvedValue(mockClient);

    const result = await service.updateStatus(id, statut);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.client.findUnique).toHaveBeenCalledWith({ where: { id } });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.client.update).toHaveBeenCalledWith({
      where: { id },
      data: { statut },
      include: { dossiers: true, factures: true },
    });
    expect(result).toEqual(mockClient);
  });

  it('should throw NotFoundException if client to update status not found', async () => {
    (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      service.updateStatus('999', StatutClient.ACTIF),
    ).rejects.toThrow(NotFoundException);
  });
});
