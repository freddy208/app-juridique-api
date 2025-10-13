import { Test, TestingModule } from '@nestjs/testing';
import { FacturesService } from './factures.service';
import { PrismaService } from '../prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StatutFacture } from '@prisma/client';

// Création d'un mock complet pour Prisma
const mockPrismaService = () => ({
  facture: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  client: {
    findUnique: jest.fn(),
  },
  dossier: {
    findUnique: jest.fn(),
  },
});

describe('FacturesService', () => {
  let service: FacturesService;
  let prisma: ReturnType<typeof mockPrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacturesService,
        { provide: PrismaService, useFactory: mockPrismaService },
      ],
    }).compile();

    service = module.get<FacturesService>(FacturesService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated factures', async () => {
      const mockFactures = [{ id: '1', statut: 'BROUILLON' }];
      prisma.facture.findMany.mockResolvedValue(mockFactures);
      prisma.facture.count.mockResolvedValue(mockFactures.length);

      const result = await service.findAll({});
      expect(result.data).toEqual(mockFactures);
      expect(result.total).toBe(mockFactures.length);
    });
  });

  describe('findOne', () => {
    it('should return a facture if found', async () => {
      const facture = { id: '1', statut: 'BROUILLON' };
      prisma.facture.findUnique.mockResolvedValue(facture);

      expect(await service.findOne('1')).toEqual(facture);
    });

    it('should throw NotFoundException if facture not found', async () => {
      prisma.facture.findUnique.mockResolvedValue(null);
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = {
      clientId: 'c1',
      dossierId: 'd1',
      montant: 100,
      dateEcheance: new Date().toISOString(),
    };

    it('should create a facture', async () => {
      prisma.client.findUnique.mockResolvedValue({ id: 'c1', statut: 'ACTIF' });
      prisma.dossier.findUnique.mockResolvedValue({
        id: 'd1',
        statut: 'ACTIF',
      });
      prisma.facture.create.mockResolvedValue({ id: '1', ...dto });

      const result = await service.create(dto);
      expect(result.id).toBe('1');
    });

    it('should throw BadRequestException if client invalid', async () => {
      prisma.client.findUnique.mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const dto = { montant: 200 };
    it('should update a facture', async () => {
      prisma.facture.findUnique.mockResolvedValue({
        id: '1',
        statut: 'BROUILLON',
      });
      prisma.facture.update.mockResolvedValue({ id: '1', montant: 200 });
      const result = await service.update('1', dto);
      expect(result.montant).toBe(200);
    });

    it('should throw NotFoundException if facture not found', async () => {
      prisma.facture.findUnique.mockResolvedValue(null);
      await expect(service.update('1', dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update statut', async () => {
      prisma.facture.findUnique.mockResolvedValue({
        id: '1',
        statut: 'BROUILLON',
      });
      prisma.facture.update.mockResolvedValue({
        id: '1',
        statut: StatutFacture.PAYEE,
      });

      const result = await service.updateStatus('1', StatutFacture.PAYEE);
      expect(result.statut).toBe(StatutFacture.PAYEE);
    });
  });

  describe('markAsPaid', () => {
    it('should mark facture as paid', async () => {
      prisma.facture.findUnique.mockResolvedValue({
        id: '1',
        statut: 'BROUILLON',
        payee: false,
      });
      prisma.facture.update.mockResolvedValue({
        id: '1',
        statut: StatutFacture.PAYEE,
        payee: true,
      });

      const result = await service.markAsPaid('1');
      expect(result.payee).toBe(true);
      expect(result.statut).toBe(StatutFacture.PAYEE);
    });

    it('should throw BadRequestException if already paid', async () => {
      prisma.facture.findUnique.mockResolvedValue({
        id: '1',
        statut: 'BROUILLON',
        payee: true,
      });
      await expect(service.markAsPaid('1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('softDelete', () => {
    it('should soft delete a facture', async () => {
      prisma.facture.findUnique.mockResolvedValue({
        id: '1',
        statut: 'BROUILLON',
      });
      prisma.facture.update.mockResolvedValue({ id: '1', statut: 'SUPPRIME' });

      const result = await service.softDelete('1');
      expect(result.facture.statut).toBe('SUPPRIME');
      expect(result.message).toContain('supprimée');
    });

    it('should throw NotFoundException if facture not found', async () => {
      prisma.facture.findUnique.mockResolvedValue(null);
      await expect(service.softDelete('1')).rejects.toThrow(NotFoundException);
    });
  });
});
