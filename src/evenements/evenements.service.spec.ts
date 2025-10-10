import { Test, TestingModule } from '@nestjs/testing';
import { EvenementsService } from './evenements.service';
import { PrismaService } from '../prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// 🧠 Mock de Prisma
const mockPrisma = () => ({
  evenementCalendrier: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  dossier: {
    findUnique: jest.fn(),
  },
  utilisateur: {
    findUnique: jest.fn(),
  },
  journalAudit: {
    create: jest.fn(),
  },
});

describe('EvenementsService', () => {
  let service: EvenementsService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvenementsService,
        { provide: PrismaService, useFactory: mockPrisma },
      ],
    }).compile();

    service = module.get<EvenementsService>(EvenementsService);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    prisma = module.get<PrismaService>(PrismaService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // 🧪 findAll()
  describe('findAll', () => {
    it('devrait retourner une liste paginée', async () => {
      prisma.evenementCalendrier.findMany.mockResolvedValue([{ id: '1' }]);
      prisma.evenementCalendrier.count.mockResolvedValue(1);

      const result = await service.findAll({ skip: 0, take: 10 });

      expect(result).toEqual({ total: 1, data: [{ id: '1' }] });
      expect(prisma.evenementCalendrier.findMany).toHaveBeenCalled();
      expect(prisma.evenementCalendrier.count).toHaveBeenCalled();
    });
  });

  // 🧪 findOne()
  describe('findOne', () => {
    it('devrait retourner un événement existant', async () => {
      const mockEvent = { id: '1', statut: 'PREVU' };
      prisma.evenementCalendrier.findUnique.mockResolvedValue(mockEvent);

      const result = await service.findOne('1');
      expect(result).toEqual(mockEvent);
    });

    it('devrait lancer NotFoundException si introuvable', async () => {
      prisma.evenementCalendrier.findUnique.mockResolvedValue(null);
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });

    it('devrait lancer NotFoundException si supprimé', async () => {
      prisma.evenementCalendrier.findUnique.mockResolvedValue({
        id: '1',
        statut: 'SUPPRIME',
      });
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  // 🧪 create()
  describe('create', () => {
    const dto = {
      titre: 'Réunion',
      description: 'Discussion projet',
      debut: new Date('2025-10-10T10:00:00Z').toISOString(),
      fin: new Date('2025-10-10T11:00:00Z').toISOString(),
      dossierId: 'd1',
    };

    it('devrait créer un événement avec succès', async () => {
      prisma.dossier.findUnique.mockResolvedValue({
        id: 'd1',
        statut: 'ACTIF',
      });
      prisma.evenementCalendrier.create.mockResolvedValue({
        id: '1',
        ...dto,
        statut: 'PREVU',
      });

      prisma.journalAudit.create.mockResolvedValue({});

      const result = await service.create(dto, 'user1');
      expect(result.id).toBe('1');
      expect(prisma.journalAudit.create).toHaveBeenCalled();
    });

    it('devrait lancer BadRequestException si fin <= debut', async () => {
      const badDto = { ...dto, fin: dto.debut };
      await expect(service.create(badDto, 'u1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('devrait lancer NotFoundException si dossier inexistant', async () => {
      prisma.dossier.findUnique.mockResolvedValue(null);
      await expect(service.create(dto, 'u1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devrait lancer BadRequestException si dossier supprimé', async () => {
      prisma.dossier.findUnique.mockResolvedValue({ statut: 'SUPPRIME' });
      await expect(service.create(dto, 'u1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // 🧪 update()
  describe('update', () => {
    const dto = { titre: 'Modifié' };

    it('devrait mettre à jour un événement avec succès', async () => {
      prisma.evenementCalendrier.findUnique.mockResolvedValue({
        id: '1',
        creeParId: 'user1',
        statut: 'PREVU',
      });
      prisma.utilisateur.findUnique.mockResolvedValue({
        id: 'user1',
        role: 'USER',
      });
      prisma.evenementCalendrier.update.mockResolvedValue({
        id: '1',
        ...dto,
      });
      prisma.journalAudit.create.mockResolvedValue({});

      const result = await service.update('1', dto, 'user1');
      expect(result.id).toBe('1');
    });

    it('devrait lancer NotFoundException si event inexistant', async () => {
      prisma.evenementCalendrier.findUnique.mockResolvedValue(null);
      await expect(service.update('1', dto, 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devrait lancer BadRequestException si non créateur et non admin', async () => {
      prisma.evenementCalendrier.findUnique.mockResolvedValue({
        id: '1',
        creeParId: 'user2',
        statut: 'PREVU',
      });
      prisma.utilisateur.findUnique.mockResolvedValue({
        id: 'user1',
        role: 'USER',
      });

      await expect(service.update('1', dto, 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // 🧪 updateStatus()
  describe('updateStatus', () => {
    it('devrait changer le statut avec succès', async () => {
      prisma.evenementCalendrier.findUnique.mockResolvedValue({
        id: '1',
        creeParId: 'user1',
        statut: 'PREVU',
      });
      prisma.utilisateur.findUnique.mockResolvedValue({
        id: 'user1',
        role: 'USER',
      });
      prisma.evenementCalendrier.update.mockResolvedValue({
        id: '1',
        statut: 'TERMINE',
      });
      prisma.journalAudit.create.mockResolvedValue({});

      const result = await service.updateStatus('1', 'TERMINE', 'user1');
      expect(result.statut).toBe('TERMINE');
    });

    it('devrait lancer NotFoundException si event inexistant', async () => {
      prisma.evenementCalendrier.findUnique.mockResolvedValue(null);
      await expect(
        service.updateStatus('1', 'TERMINE', 'user1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('devrait lancer BadRequestException si statut invalide', async () => {
      prisma.evenementCalendrier.findUnique.mockResolvedValue({
        id: '1',
        creeParId: 'user1',
        statut: 'PREVU',
      });
      prisma.utilisateur.findUnique.mockResolvedValue({
        id: 'user1',
        role: 'USER',
      });

      await expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        service.updateStatus('1', 'FAUXSTATUT' as any, 'user1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // 🧪 softDelete()
  describe('softDelete', () => {
    it('devrait supprimer un événement (soft delete)', async () => {
      prisma.evenementCalendrier.findUnique.mockResolvedValue({
        id: '1',
        creeParId: 'user1',
        statut: 'PREVU',
      });
      prisma.utilisateur.findUnique.mockResolvedValue({
        id: 'user1',
        role: 'USER',
      });
      prisma.evenementCalendrier.update.mockResolvedValue({
        id: '1',
        statut: 'SUPPRIME',
      });
      prisma.journalAudit.create.mockResolvedValue({});

      const result = await service.softDelete('1', 'user1');
      expect(result.message).toContain('succès');
      expect(result.evenement.statut).toBe('SUPPRIME');
    });

    it('devrait lancer NotFoundException si déjà supprimé', async () => {
      prisma.evenementCalendrier.findUnique.mockResolvedValue({
        id: '1',
        statut: 'SUPPRIME',
      });
      await expect(service.softDelete('1', 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
