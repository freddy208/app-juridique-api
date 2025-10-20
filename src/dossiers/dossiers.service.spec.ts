import { Test, TestingModule } from '@nestjs/testing';
import { DossiersService } from './dossiers.service';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { NotFoundException } from '@nestjs/common';
import { StatutDossier } from '@prisma/client';

describe('DossiersService', () => {
  let service: DossiersService;
  let prisma: Partial<Record<keyof PrismaService, any>>;
  let cloudinary: Partial<CloudinaryService>;

  beforeEach(async () => {
    // Mock minimal PrismaService
    prisma = {
      dossier: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
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

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await service.create(dto as any);
      expect(result.numeroUnique).toBe('AU250001');
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

      const result = await service.softDelete('1', 'u1');
      expect(result.dossier.statut).toBe('SUPPRIME');
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

  // Tu peux continuer avec findNotesPaginated, findCalendarEvents, createEvent, updateEvent, softDeleteEvent
});
