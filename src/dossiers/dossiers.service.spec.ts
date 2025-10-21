import { Test, TestingModule } from '@nestjs/testing';
import { DossiersService } from './dossiers.service';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { NotFoundException } from '@nestjs/common';
import { StatutDossier } from '@prisma/client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('DossiersService', () => {
  let service: DossiersService;
  let prisma: Partial<Record<keyof PrismaService, any>>;
  let cloudinary: Partial<CloudinaryService>;
  let cacheManager: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
  };

  beforeEach(async () => {
    // Mock pour le cache manager
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    // Mock minimal PrismaService
    prisma = {
      dossier: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
      },
      client: { findUnique: jest.fn() },
      utilisateur: { findUnique: jest.fn() },
      journalAudit: { create: jest.fn() },
      note: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      tache: { findMany: jest.fn() },
      document: { findMany: jest.fn(), create: jest.fn() },
      evenementCalendrier: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      messageChat: { findMany: jest.fn(), count: jest.fn() },
      $transaction: jest.fn(),
    };

    cloudinary = {
      uploadFile: jest
        .fn()
        .mockResolvedValue({ secure_url: 'http://fake.url/file.png' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DossiersService,
        { provide: PrismaService, useValue: prisma },
        { provide: CloudinaryService, useValue: cloudinary },
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get<DossiersService>(DossiersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a dossier if found', async () => {
      const dossierMock = { id: '1', titre: 'Test Dossier' };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.dossier.findUnique.mockResolvedValue(dossierMock);
      const result = await service.findOne('1');
      expect(result).toEqual(dossierMock);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(prisma.dossier.findUnique).toHaveBeenCalledWith({
        where: { id: '1', statut: { not: 'SUPPRIME' } },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if not found', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.dossier.findUnique.mockResolvedValue(null);
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return cached result if available', async () => {
      const filters = { skip: 0, take: 10 };
      const cachedResult = { totalCount: 1, skip: 0, take: 10, data: [] };
      // Mock plus précis pour le cache
      cacheManager.get.mockImplementation((key: string) => {
        if (key === `dossiers:${JSON.stringify(filters)}`) {
          return Promise.resolve(cachedResult);
        }
        if (key === 'dossiers:cache_keys') {
          return Promise.resolve([]);
        }
        return Promise.resolve(null);
      });
      const result = await service.findAll(filters);
      expect(result).toEqual(cachedResult);
      expect(cacheManager.get).toHaveBeenCalledWith(
        `dossiers:${JSON.stringify(filters)}`,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(prisma.dossier.findMany).not.toHaveBeenCalled();
    });

    it('should query database if no cached result', async () => {
      const filters = { skip: 0, take: 10 };
      const dbResult = {
        totalCount: 1,
        skip: 0,
        take: 10,
        data: [{ id: '1', titre: 'Test' }],
      };
      // Mock plus précis pour le cache
      cacheManager.get.mockImplementation((key: string) => {
        if (key === `dossiers:${JSON.stringify(filters)}`) {
          return Promise.resolve(null);
        }
        if (key === 'dossiers:cache_keys') {
          return Promise.resolve([]);
        }
        return Promise.resolve(null);
      });
      // Mock de la base de données
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.dossier.findMany.mockResolvedValue(dbResult.data);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.dossier.count.mockResolvedValue(dbResult.totalCount);
      const result = await service.findAll(filters);
      expect(result).toEqual(dbResult);
      expect(cacheManager.get).toHaveBeenCalledWith(
        `dossiers:${JSON.stringify(filters)}`,
      );
      expect(cacheManager.set).toHaveBeenCalledWith(
        `dossiers:${JSON.stringify(filters)}`,
        dbResult,
        300000,
      );
    });
  });

  describe('create', () => {
    it('should create a dossier with transaction', async () => {
      const dto = { titre: 'D', type: 'AUTRE', clientId: 'c1' };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.client.findUnique.mockResolvedValue({ id: 'c1', statut: 'ACTIF' });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.$transaction.mockImplementation((cb) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        cb({
          dossier: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: 'd1',
              numeroUnique: 'AU250001',
              ...dto,
            }),
            findUnique: jest.fn().mockResolvedValue({
              id: 'd1',
              numeroUnique: 'AU250001',
              ...dto,
            }),
          },
          sinistreCorporel: { create: jest.fn() },
          sinistreMateriel: { create: jest.fn() },
          sinistreMortel: { create: jest.fn() },
          immobilier: { create: jest.fn() },
          sport: { create: jest.fn() },
          contentieux: { create: jest.fn() },
          contrat: { create: jest.fn() },
        }),
      );

      // Mock du cache pour l'invalidation
      cacheManager.get.mockResolvedValue(['dossiers:{}']);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await service.create(dto as any);
      expect(result.numeroUnique).toBe('AU250001');
      expect(cacheManager.del).toHaveBeenCalled();
    });

    it('should throw if client not found', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.client.findUnique.mockResolvedValue(null);
      await expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        service.create({ titre: 'T', type: 'AUTRE', clientId: 'c1' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update status', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.dossier.findUnique.mockResolvedValue({
        id: '1',
        statut: 'OUVERT',
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.dossier.update.mockResolvedValue({
        id: '1',
        statut: 'CLOS',
        client: {},
        responsable: {},
      });
      const result = await service.updateStatus('1', StatutDossier.CLOS);
      expect(result.dossier.statut).toBe('CLOS');
    });

    it('should throw if dossier not found', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.dossier.findUnique.mockResolvedValue(null);
      await expect(
        service.updateStatus('1', StatutDossier.CLOS),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('should soft delete', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.dossier.findUnique.mockResolvedValue({
        id: '1',
        statut: 'OUVERT',
        client: {},
        responsable: {},
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.dossier.update.mockResolvedValue({
        id: '1',
        statut: 'SUPPRIME',
        client: {},
        responsable: {},
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.journalAudit.create.mockResolvedValue(true);

      // Mock du cache pour l'invalidation
      cacheManager.get.mockResolvedValue(['dossiers:{}']);

      const result = await service.softDelete('1', 'u1');
      expect(result.dossier.statut).toBe('SUPPRIME');
      expect(cacheManager.del).toHaveBeenCalled();
    });
  });

  describe('addDocumentsToDossier', () => {
    it('should upload and create documents', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.dossier.findUnique.mockResolvedValue({
        id: 'd1',
        statut: 'OUVERT',
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.document.create.mockImplementation((data) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        Promise.resolve({ id: 'doc1', ...data.data }),
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const files = [{ originalname: 'f.txt', mimetype: 'text/plain' }] as any;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await service.addDocumentsToDossier('d1', files, 'u1');
      expect(result.documents[0].dossierId).toBe('d1');
      expect(cloudinary.uploadFile).toHaveBeenCalled();
    });
  });

  describe('assignDossier', () => {
    it('should assign dossier to new user', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.dossier.findUnique.mockResolvedValue({
        id: 'd1',
        statut: 'OUVERT',
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.utilisateur.findUnique.mockResolvedValue({
        id: 'u2',
        statut: 'ACTIF',
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.dossier.update.mockResolvedValue({
        id: 'd1',
        responsableId: 'u2',
        client: {},
        responsable: {},
      });

      const result = await service.assignDossier('d1', 'u2');
      expect(result.dossier.responsableId).toBe('u2');
    });
  });

  describe('invalidateDossierCache', () => {
    it('should invalidate cache keys', async () => {
      const mockKeys = ['dossiers:{}', 'dossiers:{filter: "test"}'];
      cacheManager.get.mockResolvedValue(mockKeys);
      await service['invalidateDossierCache'](); // Accès à la méthode privée
      expect(cacheManager.get).toHaveBeenCalledWith('dossiers:cache_keys');
      // +1 pour la clé des clés elle-même
      expect(cacheManager.del).toHaveBeenCalledTimes(mockKeys.length + 1);
    });
  });
});
