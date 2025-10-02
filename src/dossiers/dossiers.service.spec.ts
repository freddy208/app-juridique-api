import { Test, TestingModule } from '@nestjs/testing';
import { DossiersService } from './dossiers.service';
import { PrismaService } from '../prisma.service';
import { NotFoundException } from '@nestjs/common';
import { StatutDossier } from '@prisma/client';

describe('DossiersService', () => {
  let service: DossiersService;
  let prisma: Partial<Record<keyof PrismaService, any>>;

  beforeEach(async () => {
    // Mocking minimal PrismaService
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
      document: { findMany: jest.fn() },
      evenementCalendrier: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      messageChat: { findMany: jest.fn(), count: jest.fn() },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DossiersService,
        { provide: PrismaService, useValue: prisma },
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

    it('should throw NotFoundException if dossier not found', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.dossier.findUnique.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a dossier successfully', async () => {
      const createDto = { titre: 'Test', type: 'AUTRE', clientId: 'c1' };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.client.findUnique.mockResolvedValue({ id: 'c1' });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.$transaction.mockImplementation((cb) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        cb({
          dossier: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: 'd1',
              numeroUnique: 'AU20250001',
              ...createDto,
            }),
          },
        }),
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await service.create(createDto as any);
      expect(result.numeroUnique).toBe('AU20250001');
    });

    it('should throw NotFoundException if client not found', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.client.findUnique.mockResolvedValue(null);

      await expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        service.create({ titre: 't', type: 'AUTRE', clientId: 'c1' } as any),
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

    it('should throw NotFoundException if dossier not found', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.dossier.findUnique.mockResolvedValue(null);
      await expect(
        service.updateStatus('1', StatutDossier.CLOS),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('should soft delete dossier', async () => {
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
  describe('findDocuments', () => {
    it('should return documents', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.dossier.findUnique.mockResolvedValue({ id: 'd1' });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.document.findMany.mockResolvedValue([{ id: 'doc1' }]);

      const result = await service.findDocuments('d1');
      expect(result.total).toBe(1);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { dossierId: 'd1', statut: 'ACTIF' },
        }),
      );
    });

    it('should throw NotFoundException if dossier not found', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.dossier.findUnique.mockResolvedValue(null);
      await expect(service.findDocuments('d1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findTasks', () => {
    it('should return tasks', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.dossier.findUnique.mockResolvedValue({ id: 'd1' });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.tache.findMany.mockResolvedValue([{ id: 't1' }]);

      const result = await service.findTasks('d1');
      expect(result.total).toBe(1);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(prisma.tache.findMany).toHaveBeenCalled();
    });
  });

  describe('addNote', () => {
    it('should add a note', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.dossier.findUnique.mockResolvedValue({ id: 'd1', clientId: 'c1' });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.note.create.mockResolvedValue({ id: 'n1', contenu: 'Note' });

      const result = await service.addNote(
        'd1',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        { contenu: 'Note' } as any,
        'u1',
      );
      expect(result.id).toBe('n1');
    });

    it('should throw NotFoundException if dossier not found', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.dossier.findUnique.mockResolvedValue(null);
      await expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        service.addNote('d1', { contenu: 'Note' } as any, 'u1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateNote', () => {
    it('should update note', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.note.findUnique.mockResolvedValue({
        id: 'n1',
        dossierId: 'd1',
        statut: 'ACTIF',
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.note.update.mockResolvedValue({ id: 'n1', contenu: 'Updated' });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await service.updateNote('d1', 'n1', {
        contenu: 'Updated',
      } as any);
      expect(result.contenu).toBe('Updated');
    });

    it('should throw NotFoundException if note not found', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.note.findUnique.mockResolvedValue(null);
      await expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        service.updateNote('d1', 'n1', { contenu: 'Updated' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDeleteNote', () => {
    it('should soft delete note', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.note.findUnique.mockResolvedValue({
        id: 'n1',
        dossierId: 'd1',
        statut: 'ACTIF',
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.note.update.mockResolvedValue({ id: 'n1', statut: 'SUPPRIME' });

      const result = await service.softDeleteNote('d1', 'n1');
      expect(result.note.statut).toBe('SUPPRIME');
    });
  });

  describe('createEvent', () => {
    it('should create event', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.dossier.findUnique.mockResolvedValue({ id: 'd1' });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.evenementCalendrier.create.mockResolvedValue({
        id: 'e1',
        titre: 'Event',
      });

      const result = await service.createEvent(
        'd1',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        { titre: 'Event' } as any,
        'u1',
      );
      expect(result.id).toBe('e1');
    });
  });

  describe('updateEvent', () => {
    it('should update event', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.evenementCalendrier.findUnique.mockResolvedValue({
        id: 'e1',
        dossierId: 'd1',
        statut: 'PREVU',
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.evenementCalendrier.update.mockResolvedValue({
        id: 'e1',
        titre: 'Updated',
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await service.updateEvent('d1', 'e1', {
        titre: 'Updated',
      } as any);
      expect(result.titre).toBe('Updated');
    });
  });

  describe('softDeleteEvent', () => {
    it('should soft delete event', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.evenementCalendrier.findUnique.mockResolvedValue({
        id: 'e1',
        dossierId: 'd1',
        statut: 'PREVU',
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.evenementCalendrier.update.mockResolvedValue({
        id: 'e1',
        statut: 'SUPPRIME',
      });

      const result = await service.softDeleteEvent('d1', 'e1');
      expect(result.event.statut).toBe('SUPPRIME');
    });
  });

  describe('assignDossier', () => {
    it('should reassign dossier', async () => {
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
      });

      const result = await service.assignDossier('d1', 'u2');
      expect(result.dossier.responsableId).toBe('u2');
    });
  });

  // ⚡️ On peut répéter pour toutes les méthodes : findDocuments, findTasks, addNote, updateNote, softDeleteNote, createEvent, updateEvent...
});
