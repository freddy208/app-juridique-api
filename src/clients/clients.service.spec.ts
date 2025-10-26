// clients.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { PrismaService } from '../prisma.service';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { StatutClient, StatutDossier } from '@prisma/client';

describe('ClientsService', () => {
  let service: ClientsService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let prisma: PrismaService;

  const mockPrisma = {
    client: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    dossier: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    facture: {
      count: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    paiement: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    note: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    documentIdentite: {
      create: jest.fn(),
    },
    honoraire: {
      aggregate: jest.fn(),
    },
    provision: {
      aggregate: jest.fn(),
    },
    satisfaction: {
      aggregate: jest.fn(),
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

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('devrait créer un client avec succès', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null);
      mockPrisma.client.create.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        telephone: '123456',
        chiffreAffaires: 1000,
      });

      const result = await service.create({
        email: 'test@example.com',
        telephone: '123456',
        nom: 'Doe',
        prenom: 'John',
      });

      expect(result.id).toBe('1');
      expect(result.chiffreAffaires).toBe(1000);
      expect(mockPrisma.client.create).toHaveBeenCalled();
    });

    it('devrait lancer ConflictException si email existant', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({
          email: 'exist@example.com',
          telephone: '123',
          nom: 'X',
          prenom: 'Y',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('devrait lancer ConflictException si téléphone existant', async () => {
      mockPrisma.client.findFirst
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce({ id: 'existing' }); // telephone check

      await expect(
        service.create({
          email: 'test@example.com',
          telephone: 'exist',
          nom: 'X',
          prenom: 'Y',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('devrait retourner un client existant', async () => {
      const client = { id: '1', chiffreAffaires: 200 };
      mockPrisma.client.findUnique.mockResolvedValue(client);

      const result = await service.findOne('1');
      expect(result.id).toBe('1');
      expect(result.chiffreAffaires).toBe(200);
    });

    it('devrait lancer NotFoundException si client inexistant', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);
      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('devrait mettre à jour un client', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.client.findFirst.mockResolvedValue(null);
      mockPrisma.client.update.mockResolvedValue({
        id: '1',
        chiffreAffaires: 300,
      });

      const result = await service.update('1', { nom: 'Updated' });
      expect(result.id).toBe('1');
      expect(result.chiffreAffaires).toBe(300);
    });

    it('devrait lancer ConflictException si email déjà utilisé', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.client.findFirst.mockResolvedValue({ id: '2' });

      await expect(
        service.update('1', { email: 'exist@example.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('devrait archiver un client sans dossiers actifs', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({
        id: '1',
        dossiers: [],
      });
      mockPrisma.client.update.mockResolvedValue({ id: '1' });

      const result = await service.remove('1');
      expect(result.message).toBe('Client archivé avec succès');
    });

    it('devrait lancer BadRequestException si dossiers actifs', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({
        id: '1',
        dossiers: [{ statut: StatutDossier.OUVERT }],
      });

      await expect(service.remove('1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAvailableStatuses', () => {
    it('devrait retourner la liste des statuts', () => {
      const result = service.getAvailableStatuses();
      expect(result).toEqual(
        Object.values(StatutClient).map((s) => ({ value: s, label: s })),
      );
    });
  });

  // Ajoute d'autres tests similaires pour findAll, changeStatus, getClientStats, getClientPerformance, getClientActivity, getFinancialSummary, addNote, addIdentityDocument, bulkAction, markLastVisit, getInactiveClients, getGlobalStats
});
