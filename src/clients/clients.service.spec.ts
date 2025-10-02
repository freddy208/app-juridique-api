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
      count: jest.fn(),
    },
    dossier: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    document: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    note: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    correspondance: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
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
    (prisma.client.count as jest.Mock).mockResolvedValue(mockClients.length);
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
    (prisma.client.count as jest.Mock).mockResolvedValue(mockClients.length);
    expect(result).toEqual({
      totalCount: mockClients.length,
      skip: 0,
      take: 10,
      data: mockClients,
    });
  });

  it('should handle empty filters', async () => {
    const filters: FilterClientDto = {
      skip: 0,
      take: 10,
    };

    const mockClients: any[] = []; // aucun client
    (prisma.client.findMany as jest.Mock).mockResolvedValue(mockClients);
    (prisma.client.count as jest.Mock).mockResolvedValue(mockClients.length); // totalCount = 0

    const result = await service.findAll(filters);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {}, // pas de filtre
        skip: 0,
        take: 10,
      }),
    );

    expect(result).toEqual({
      totalCount: 0,
      skip: 0,
      take: 10,
      data: [],
    });
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
  // ---------- remove (soft delete) tests ----------
  it('should soft delete a client when found', async () => {
    const id = '1';
    const mockClient = {
      id,
      prenom: 'Jean',
      nom: 'Dupont',
      statut: StatutClient.INACTIF,
      dossiers: [],
      factures: [],
    };

    // Mock pour vérifier existence
    (prisma.client.findUnique as jest.Mock).mockResolvedValue({
      id,
      prenom: 'Jean',
      nom: 'Dupont',
      statut: StatutClient.ACTIF,
    });

    (prisma.client.update as jest.Mock).mockResolvedValue(mockClient);

    const result = await service.remove(id);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.client.findUnique).toHaveBeenCalledWith({ where: { id } });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.client.update).toHaveBeenCalledWith({
      where: { id },
      data: { statut: StatutClient.INACTIF },
      include: { dossiers: true, factures: true },
    });
    expect(result).toEqual(mockClient);
  });

  it('should throw NotFoundException if client to remove not found', async () => {
    (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.remove('999')).rejects.toThrow(NotFoundException);
  });
  // ---------- findDossiersByClient tests ----------
  describe('findDossiersByClient', () => {
    it('should return dossiers when client exists', async () => {
      const clientId = '1';
      const mockDossiers = [
        { id: 'd1', titre: 'Dossier 1', clientId },
        { id: 'd2', titre: 'Dossier 2', clientId },
      ];

      (prisma.client.findUnique as jest.Mock).mockResolvedValue({
        id: clientId,
      });
      (prisma.dossier.findMany as jest.Mock).mockResolvedValue(mockDossiers);
      (prisma.dossier.count as jest.Mock).mockResolvedValue(
        mockDossiers.length,
      ); // ✅ mock count avant

      const result = await service.findDossiersByClient(
        clientId,
        undefined,
        0,
        10,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.dossier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clientId },
          skip: 0,
          take: 10,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          include: expect.any(Object),
        }),
      );

      expect(result).toEqual({
        totalCount: mockDossiers.length,
        skip: 0,
        take: 10,
        data: mockDossiers,
      });
    });

    it('should throw NotFoundException if client does not exist', async () => {
      const clientId = '999';
      (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findDossiersByClient(clientId)).rejects.toThrow(
        NotFoundException,
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
      });
    });

    it('should use default skip and take if not provided', async () => {
      const clientId = '1';
      const mockDossiers: any[] = [];

      (prisma.client.findUnique as jest.Mock).mockResolvedValue({
        id: clientId,
      });
      (prisma.dossier.findMany as jest.Mock).mockResolvedValue(mockDossiers);
      (prisma.dossier.count as jest.Mock).mockResolvedValue(
        mockDossiers.length,
      );

      const result = await service.findDossiersByClient(clientId); // skip et take par défaut

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.dossier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );

      expect(result).toEqual({
        totalCount: mockDossiers.length,
        skip: 0,
        take: 10,
        data: mockDossiers,
      });
    });
  });
  // ---------- findDocumentsByClient tests module ----------
  describe('findDocumentsByClient', () => {
    it('should return documents when client exists', async () => {
      const clientId = '1';
      const mockDocuments = [
        { id: 'doc1', titre: 'Document 1', clientId },
        { id: 'doc2', titre: 'Document 2', clientId },
      ];

      (prisma.client.findUnique as jest.Mock).mockResolvedValue({
        id: clientId,
      });
      (prisma.document.findMany as jest.Mock).mockResolvedValue(mockDocuments);
      (prisma.document.count as jest.Mock).mockResolvedValue(
        mockDocuments.length,
      ); // ✅

      const result = await service.findDocumentsByClient(
        clientId,
        undefined,
        0,
        10,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.document.findMany).toHaveBeenCalledWith({
        where: { dossier: { clientId } },
        skip: 0,
        take: 10,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        include: expect.any(Object),
        orderBy: { creeLe: 'desc' },
      });

      expect(result).toEqual({
        totalCount: mockDocuments.length,
        skip: 0,
        take: 10,
        data: mockDocuments,
      });
    });

    it('should throw NotFoundException if client does not exist', async () => {
      const clientId = '999';
      (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.findDocumentsByClient(clientId, undefined, 0, 10),
      ).rejects.toThrow(NotFoundException);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
      });
    });

    it('should use default skip and take if not provided', async () => {
      const clientId = '1';
      const mockDocuments: any[] = [];
      (prisma.client.findUnique as jest.Mock).mockResolvedValue({
        id: clientId,
      });
      (prisma.document.findMany as jest.Mock).mockResolvedValue(mockDocuments);
      (prisma.document.count as jest.Mock).mockResolvedValue(
        mockDocuments.length,
      );

      const result = await service.findDocumentsByClient(clientId); // skip et take par défaut

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );

      expect(result).toEqual({
        totalCount: mockDocuments.length,
        skip: 0,
        take: 10,
        data: mockDocuments,
      });
    });
  });
  // ---------- findNotesByClient tests ----------
  describe('findNotesByClient', () => {
    it('should return notes when client exists', async () => {
      const clientId = '1';
      const mockNotes = [
        {
          id: 'n1',
          contenu: 'Note 1',
          clientId,
          utilisateur: {
            id: 'u1',
            prenom: 'John',
            nom: 'Doe',
            email: 'john@example.com',
          },
          dossier: { id: 'd1', numeroUnique: 'DU-001', titre: 'Dossier 1' },
        },
        {
          id: 'n2',
          contenu: 'Note 2',
          clientId,
          utilisateur: {
            id: 'u2',
            prenom: 'Jane',
            nom: 'Doe',
            email: 'jane@example.com',
          },
          dossier: { id: 'd2', numeroUnique: 'DU-002', titre: 'Dossier 2' },
        },
      ];

      (prisma.client.findUnique as jest.Mock).mockResolvedValue({
        id: clientId,
      });
      (prisma.note.findMany as jest.Mock).mockResolvedValue(mockNotes);

      (prisma.note.count as jest.Mock).mockResolvedValue(mockNotes.length);
      const result = await service.findNotesByClient(clientId, 0, 10);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clientId, statut: 'ACTIF' },
          skip: 0,
          take: 10,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          include: expect.any(Object),
          orderBy: { creeLe: 'desc' },
        }),
      );
      (prisma.note.count as jest.Mock).mockResolvedValue(mockNotes.length);

      expect(result).toEqual({
        totalCount: mockNotes.length,
        skip: 0,
        take: 10,
        data: mockNotes,
      });
    });

    it('should throw NotFoundException if client does not exist', async () => {
      const clientId = '999';
      (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findNotesByClient(clientId)).rejects.toThrow(
        NotFoundException,
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
      });
    });

    it('should use default skip and take if not provided', async () => {
      const clientId = '1';
      const mockNotes: any[] = [];
      (prisma.client.findUnique as jest.Mock).mockResolvedValue({
        id: clientId,
      });
      (prisma.note.findMany as jest.Mock).mockResolvedValue(mockNotes);
      (prisma.note.count as jest.Mock).mockResolvedValue(mockNotes.length);

      const result = await service.findNotesByClient(clientId);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );

      expect(result).toEqual({
        totalCount: mockNotes.length,
        skip: 0,
        take: 10,
        data: mockNotes,
      });
    });
  });
  // ---------- findCorrespondancesByClient tests ----------
  describe('findCorrespondancesByClient', () => {
    it('should return correspondances when client exists', async () => {
      const clientId = '1';
      const mockCorrespondances = [
        { id: 'c1', objet: 'Lettre 1', clientId },
        { id: 'c2', objet: 'Lettre 2', clientId },
      ];

      (prisma.client.findUnique as jest.Mock).mockResolvedValue({
        id: clientId,
      });
      (prisma.correspondance.findMany as jest.Mock).mockResolvedValue(
        mockCorrespondances,
      );
      (prisma.correspondance.count as jest.Mock).mockResolvedValue(
        mockCorrespondances.length,
      );

      const result = await service.findCorrespondancesByClient(clientId, 0, 10);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.correspondance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clientId, statut: 'ACTIF' },
          skip: 0,
          take: 10,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          include: expect.any(Object),
          orderBy: { creeLe: 'desc' },
        }),
      );
      expect(result).toEqual({
        totalCount: mockCorrespondances.length,
        skip: 0,
        take: 10,
        data: mockCorrespondances,
      });
    });

    it('should throw NotFoundException if client does not exist', async () => {
      const clientId = '999';
      (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.findCorrespondancesByClient(clientId),
      ).rejects.toThrow(NotFoundException);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
      });
    });

    it('should use default skip and take if not provided', async () => {
      const clientId = '1';
      const mockCorrespondances: any[] = [];

      (prisma.client.findUnique as jest.Mock).mockResolvedValue({
        id: clientId,
      });
      (prisma.correspondance.findMany as jest.Mock).mockResolvedValue(
        mockCorrespondances,
      );
      (prisma.correspondance.count as jest.Mock).mockResolvedValue(0);

      const result = await service.findCorrespondancesByClient(clientId);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.correspondance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
      expect(result).toEqual({
        totalCount: 0,
        skip: 0,
        take: 10,
        data: [],
      });
    });
  });
});
