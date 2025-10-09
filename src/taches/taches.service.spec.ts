// taches.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TachesService } from './taches.service';
import { PrismaService } from '../prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const mockPrisma = () => ({
  tache: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  dossier: {
    findUnique: jest.fn(),
  },
  utilisateur: {
    findUnique: jest.fn(),
  },
  commentaire: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
});

describe('TachesService', () => {
  let service: TachesService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TachesService,
        { provide: PrismaService, useFactory: mockPrisma },
      ],
    }).compile();

    service = module.get<TachesService>(TachesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('devrait retourner une tâche existante', async () => {
      const tacheMock = { id: '1', statut: 'A_FAIRE' };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.tache.findUnique.mockResolvedValue(tacheMock);

      const result = await service.findOne('1');
      expect(result).toEqual(tacheMock);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(prisma.tache.findUnique).toHaveBeenCalledWith(expect.any(Object));
    });

    it('devrait lancer NotFoundException si la tâche n’existe pas', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.tache.findUnique.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });

    it('devrait lancer NotFoundException si la tâche est supprimée', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.tache.findUnique.mockResolvedValue({
        id: '1',
        statut: 'SUPPRIME',
      });

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('devrait créer une tâche avec succès', async () => {
      const dto = { titre: 'Test', description: 'Desc' };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.tache.create.mockResolvedValue({ id: '1', ...dto });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.dossier.findUnique.mockResolvedValue(null);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.utilisateur.findUnique.mockResolvedValue(null);

      const result = await service.create(dto, 'user1');
      expect(result.tache).toEqual(expect.objectContaining(dto));
    });

    it('devrait lancer NotFoundException si dossier inexistant', async () => {
      const dto = { titre: 'Test', dossierId: 'd1' };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.dossier.findUnique.mockResolvedValue(null);

      await expect(service.create(dto, 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('devrait mettre à jour une tâche existante', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.tache.findUnique.mockResolvedValue({
        id: '1',
        creeParId: 'user1',
        statut: 'A_FAIRE',
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.utilisateur.findUnique.mockResolvedValue({
        id: 'user1',
        role: 'USER',
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.tache.update.mockResolvedValue({ id: '1', titre: 'Updated' });

      const result = await service.update('1', { titre: 'Updated' }, 'user1');
      expect(result.tache.titre).toBe('Updated');
    });

    it('devrait lancer ForbiddenException si utilisateur non autorisé', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.tache.findUnique.mockResolvedValue({
        id: '1',
        creeParId: 'user2',
        statut: 'A_FAIRE',
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.utilisateur.findUnique.mockResolvedValue({
        id: 'user1',
        role: 'USER',
      });

      await expect(
        service.update('1', { titre: 'Updated' }, 'user1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('softDelete', () => {
    it('devrait soft delete une tâche', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.tache.findUnique.mockResolvedValue({
        id: '1',
        creeParId: 'user1',
        statut: 'A_FAIRE',
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.utilisateur.findUnique.mockResolvedValue({
        id: 'user1',
        role: 'USER',
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prisma.tache.update.mockResolvedValue({ id: '1', statut: 'SUPPRIME' });

      const result = await service.softDelete('1', 'user1');
      expect(result.tache.statut).toBe('SUPPRIME');
    });
  });
});
